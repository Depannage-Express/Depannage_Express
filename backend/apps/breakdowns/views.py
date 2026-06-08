# apps/breakdowns/views.py
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.permissions import IsAdmin, IsApprovedMechanic, IsValidDriverToken
from apps.geolocation.utils import find_nearest_mechanic, find_top_mechanics
from apps.mechanics.models import MechanicProfile
from apps.mechanics.serializers import MechanicPublicSerializer
from apps.notifications.utils import send_notification
from apps.payments.models import PaymentTransaction
from .models import BreakdownRequest, Message
from .serializers import BreakdownRequestCreateSerializer, BreakdownRequestSerializer

PHASE_TIMEOUT_SECS = 120   # 2 minutes par phase
PHASE_RADII_KM = {1: 10, 2: 20, 3: 50}  # phase 4 = broadcast


def _assign_mechanic(req, mechanic, distance):
    """Attribue un mécanicien et crée l'intervention."""
    from apps.interventions.models import Intervention
    req.assigned_mechanic = mechanic
    req.assignment_distance_km = distance
    req.assigned_at = timezone.now()
    req.status = 'assigned'
    req.save(update_fields=['assigned_mechanic', 'assignment_distance_km', 'assigned_at', 'status'])
    Intervention.objects.get_or_create(
        breakdown_request=req,
        mechanic=mechanic,
        defaults={'status': 'pending_acceptance'},
    )
    send_notification(
        mechanic.user,
        title='Nouvelle demande de dépannage',
        message=f'Demande de {req.driver_name} à {distance} km de vous.',
        notif_type='NEW_BREAKDOWN',
        reference_id=str(req.id),
    )


def _broadcast_mechanics(req, top):
    """Notifie jusqu'à 10 mécaniciens en mode broadcast."""
    from apps.interventions.models import Intervention
    if not top:
        return
    first = top[0]
    req.assigned_mechanic = first['profile']
    req.assignment_distance_km = first['distance_km']
    req.assigned_at = timezone.now()
    req.status = 'assigned'
    req.save(update_fields=['assigned_mechanic', 'assignment_distance_km', 'assigned_at', 'status'])
    for item in top:
        Intervention.objects.get_or_create(
            breakdown_request=req,
            mechanic=item['profile'],
            defaults={'status': 'pending_acceptance'},
        )
        send_notification(
            item['profile'].user,
            title='Dépannage urgent — Répondez vite !',
            message=(
                f'Demande de {req.driver_name} à {item["distance_km"]} km. '
                'Le premier à accepter intervient.'
            ),
            notif_type='NEW_BREAKDOWN',
            reference_id=str(req.id),
        )


def _try_escalate(req):
    """
    Escalade lazily si le mécanicien ne répond pas dans PHASE_TIMEOUT_SECS.
    Appelée à chaque poll du statut conducteur.
    """
    if req.status not in ('pending', 'assigned'):
        return
    if req.search_phase >= 4 and req.status == 'assigned':
        return  # broadcast déjà lancé, on attend

    if not req.phase_started_at:
        return

    elapsed = (timezone.now() - req.phase_started_at).total_seconds()
    if elapsed < PHASE_TIMEOUT_SECS:
        return

    # Verrou atomique pour éviter les doubles escalades concurrentes
    with transaction.atomic():
        req_locked = BreakdownRequest.objects.select_for_update().get(pk=req.pk)

        # Revérifier dans le verrou
        if req_locked.status not in ('pending', 'assigned'):
            return
        elapsed2 = (timezone.now() - req_locked.phase_started_at).total_seconds()
        if elapsed2 < PHASE_TIMEOUT_SECS:
            return

        from apps.interventions.models import Intervention

        # Mécanicien qui n'a pas répondu → exclure
        skipped = list(req_locked.refused_mechanic_ids or [])
        if req_locked.assigned_mechanic_id and req_locked.assigned_mechanic_id not in skipped:
            skipped.append(req_locked.assigned_mechanic_id)

        # Annuler les interventions en attente
        Intervention.objects.filter(
            breakdown_request=req_locked,
            status='pending_acceptance',
        ).update(status='cancelled')

        next_phase = req_locked.search_phase + 1
        req_locked.assigned_mechanic = None
        req_locked.assigned_at = None
        req_locked.assignment_distance_km = None
        req_locked.status = 'pending'
        req_locked.search_phase = next_phase
        req_locked.phase_started_at = timezone.now()
        req_locked.save(update_fields=[
            'assigned_mechanic', 'assigned_at', 'assignment_distance_km',
            'status', 'search_phase', 'phase_started_at',
        ])

        lat = float(req_locked.latitude)
        lon = float(req_locked.longitude)
        specialty_id = req_locked.specialty_requested_id

        if next_phase <= 3:
            radius = PHASE_RADII_KM[next_phase]
            mechanic, distance = find_nearest_mechanic(
                latitude=lat, longitude=lon,
                radius_km=radius,
                specialty_id=specialty_id,
                exclude_ids=skipped,
            )
            if mechanic:
                _assign_mechanic(req_locked, mechanic, distance)
        else:
            top = find_top_mechanics(
                latitude=lat, longitude=lon,
                n=10,
                specialty_id=specialty_id,
                exclude_ids=skipped,
            )
            _broadcast_mechanics(req_locked, top)

    # Rafraîchir l'instance locale
    req.refresh_from_db()


# ─── Création demande (public, conducteur anonyme) ────────────────────────────

@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_cancel_breakdown(request, pk):
    """Annule une demande de dépannage pour identité suspecte ou autre raison admin."""
    from apps.interventions.models import Intervention

    try:
        req = BreakdownRequest.objects.select_related('assigned_mechanic__user').get(pk=pk)
    except BreakdownRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)

    if req.status in ('completed', 'cancelled'):
        return Response({'error': f'Impossible d\'annuler une demande déjà {req.status}.'}, status=400)

    with transaction.atomic():
        req.status = 'cancelled'
        req.save(update_fields=['status'])
        Intervention.objects.filter(
            breakdown_request=req,
            status__in=['pending_acceptance', 'accepted'],
        ).update(status='cancelled')

    if req.assigned_mechanic:
        send_notification(
            req.assigned_mechanic.user,
            title='Demande annulée',
            message=f'La demande de {req.driver_name} a été annulée par l\'administration.',
            notif_type='BREAKDOWN_CANCELLED',
            reference_id=str(req.id),
        )

    return Response({'message': 'Demande annulée avec succès.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def create_breakdown_request(request):
    """
    Soumission d'une demande de dépannage par un conducteur sans compte.
    Le driver_token est retourné UNE SEULE FOIS ici — le conducteur doit le conserver.
    """
    from django.core import signing

    verify_token = (request.data.get('phone_verify_token') or '').strip()
    driver_phone = (request.data.get('driver_phone') or '').strip()

    if not verify_token:
        return Response({'error': 'La vérification du numéro de téléphone par SMS est obligatoire.'}, status=400)

    try:
        token_data = signing.loads(verify_token, salt='driver-phone-verify', max_age=900)
    except signing.SignatureExpired:
        return Response({'error': 'La vérification du numéro a expiré. Recommencez.'}, status=400)
    except signing.BadSignature:
        return Response({'error': 'Token de vérification de téléphone invalide.'}, status=400)

    if token_data.get('phone') != driver_phone:
        return Response({'error': 'Le numéro vérifié ne correspond pas au numéro fourni.'}, status=400)

    serializer = BreakdownRequestCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    instance = serializer.save(
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        driver_account=request.user if request.user.is_authenticated else None,
    )

    # Démarrer le chrono de phase dès la création
    instance.phase_started_at = timezone.now()
    instance.search_phase = 1
    instance.save(update_fields=['phase_started_at', 'search_phase'])

    # Attribution automatique du mécanicien le plus proche
    mechanic, distance = find_nearest_mechanic(
        latitude=float(instance.latitude),
        longitude=float(instance.longitude),
        specialty_id=instance.specialty_requested_id,
    )

    if mechanic:
        _assign_mechanic(instance, mechanic, distance)

    data = BreakdownRequestSerializer(instance).data
    # Le driver_token est exposé UNIQUEMENT à la création, jamais ailleurs
    data['driver_token'] = str(instance.driver_token)
    return Response(data, status=201)


# ─── Statistiques publiques ───────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def platform_stats(request):
    return Response({
        'total_interventions': BreakdownRequest.objects.filter(status='completed').count(),
        'total_mechanics': MechanicProfile.objects.filter(status='approved').count(),
        'total_requests': BreakdownRequest.objects.count(),
    })


# ─── Statistiques admin ───────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_stats(request):
    breakdown_rows = BreakdownRequest.objects.values('status').annotate(total=Count('id'))
    breakdowns_by_status = {row['status']: row['total'] for row in breakdown_rows}

    pay = PaymentTransaction.objects.aggregate(
        revenue=Sum('amount', filter=Q(status='paid')),
        paid_count=Count('id', filter=Q(status='paid')),
        pending_count=Count('id', filter=Q(status='authorized')),
    )

    user_rows = User.objects.values('role').annotate(total=Count('id'))
    users_by_role = {row['role']: row['total'] for row in user_rows}

    mech_rows = MechanicProfile.objects.values('status').annotate(total=Count('id'))
    mechanics_by_status = {row['status']: row['total'] for row in mech_rows}

    return Response({
        'breakdowns': {
            'total': BreakdownRequest.objects.count(),
            'by_status': breakdowns_by_status,
        },
        'payments': {
            'total_revenue_xof': int(pay['revenue'] or 0),
            'paid_count': pay['paid_count'],
            'pending_count': pay['pending_count'],
        },
        'users': {
            'total': User.objects.count(),
            'by_role': users_by_role,
        },
        'mechanics': {
            'total': MechanicProfile.objects.count(),
            'by_status': mechanics_by_status,
        },
    })


# ─── Mécanicien : ses demandes assignées ─────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsApprovedMechanic])
def my_breakdown_requests(request):
    try:
        profile = request.user.mechanic_profile
    except Exception:
        return Response({'error': 'Profil mécanicien introuvable.'}, status=404)

    qs = BreakdownRequest.objects.filter(assigned_mechanic=profile).order_by('-created_at')
    status_filter = request.query_params.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)

    serializer = BreakdownRequestSerializer(qs, many=True)
    return Response({'count': qs.count(), 'results': serializer.data})


# ─── Admin : liste et détail ──────────────────────────────────────────────────

class BreakdownAdminListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = BreakdownRequestSerializer

    def get_queryset(self):
        qs = BreakdownRequest.objects.select_related(
            'assigned_mechanic__user', 'specialty_requested'
        ).order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


@api_view(['GET'])
@permission_classes([IsAdmin])
def breakdown_detail_admin(request, pk):
    try:
        req = BreakdownRequest.objects.get(pk=pk)
    except BreakdownRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)
    return Response(BreakdownRequestSerializer(req).data)


# ─── Suivi public (lecture seule, pas de données sensibles) ──────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def breakdown_status_public(request, pk):
    try:
        req = BreakdownRequest.objects.select_related(
            'assigned_mechanic__user'
        ).prefetch_related('assigned_mechanic__specialties').get(pk=pk)
    except BreakdownRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)

    # Escalade automatique si le mécanicien ne répond pas
    _try_escalate(req)

    mechanic_data = None
    if req.assigned_mechanic:
        mechanic_data = MechanicPublicSerializer(req.assigned_mechanic).data

    return Response({
        'id': str(req.id),
        'status': req.status,
        'breakdown_type': req.breakdown_type,
        'created_at': req.created_at,
        'assigned_at': req.assigned_at,
        'assignment_distance_km': (
            str(req.assignment_distance_km) if req.assignment_distance_km else None
        ),
        'assigned_mechanic': mechanic_data,
        'refusal_count': req.refusal_count,
        'search_phase': req.search_phase,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_intervention_by_breakdown(request, pk):
    """
    Retourne les informations minimales de l'intervention liée à une demande.
    Pas de données sensibles — utilisé pour le suivi frontend.
    """
    try:
        breakdown = BreakdownRequest.objects.get(pk=pk)
    except BreakdownRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)

    from apps.interventions.models import Intervention
    intervention = breakdown.interventions.exclude(
        status__in=['refused', 'cancelled']
    ).select_related('mechanic__user').first()
    if not intervention:
        return Response({'error': 'Aucune intervention active pour cette demande.'}, status=404)

    mechanic_phone = None
    if intervention.status in ('paid', 'reviewed') and intervention.mechanic:
        mechanic_phone = intervention.mechanic.user.phone or None

    return Response({
        'id': str(intervention.id),
        'status': intervention.status,
        'driver_confirmed': intervention.driver_confirmed,
        'mechanic_phone': mechanic_phone,
    })


# ─── Chat — sécurisé par rôle ─────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def breakdown_messages(request, pk):
    """
    GET  : lecture publique des messages (suivi conducteur).
    POST : envoi de message.
      - Mécanicien : doit être authentifié + assigné à cette demande (IsApprovedMechanic).
      - Conducteur : doit fournir driver_token valide.
    """
    try:
        breakdown = BreakdownRequest.objects.get(pk=pk)
    except BreakdownRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)

    if request.method == 'GET':
        msgs = breakdown.messages.order_by('created_at')
        return Response([{
            'id': str(m.id),
            'sender_type': m.sender_type,
            'sender_name': m.sender_name,
            'content': m.content,
            'sent_at': m.created_at.isoformat(),
        } for m in msgs])

    # ── POST ──
    content = (request.data.get('content') or '').strip()
    if not content:
        return Response({'error': 'Le message ne peut pas être vide.'}, status=400)

    sender_type = request.data.get('sender_type')

    # Envoi en tant qu'administrateur : JWT requis + rôle admin
    if sender_type == 'admin':
        if not (
            request.user.is_authenticated
            and request.user.role == 'admin'
            and not request.user.is_blocked
        ):
            return Response({'error': 'Authentification administrateur requise.'}, status=403)
        full = f"{request.user.first_name} {request.user.last_name}".strip()
        sender_name = full or 'Administration'

    # Envoi en tant que conducteur : driver_token requis
    elif sender_type == 'driver':
        token = (
            request.data.get('driver_token')
            or request.query_params.get('driver_token')
        )
        if not token or str(breakdown.driver_token) != str(token):
            return Response({'error': 'Token conducteur invalide.'}, status=403)
        sender_name = (
            (request.data.get('sender_name') or '').strip()
            or breakdown.driver_name
            or 'Conducteur'
        )

    else:
        return Response(
            {'error': 'sender_type invalide. Valeurs acceptées : driver, admin.'},
            status=400,
        )

    msg = Message.objects.create(
        breakdown_request=breakdown,
        sender_type=sender_type,
        sender_name=sender_name,
        content=content,
    )

    return Response({
        'id': str(msg.id),
        'sender_type': msg.sender_type,
        'sender_name': msg.sender_name,
        'content': msg.content,
        'sent_at': msg.created_at.isoformat(),
    }, status=201)
