# apps/breakdowns/views.py
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.permissions import IsAdmin, IsApprovedMechanic, IsValidDriverToken
from apps.geolocation.utils import find_nearest_mechanic
from apps.mechanics.models import MechanicProfile
from apps.mechanics.serializers import MechanicPublicSerializer
from apps.notifications.utils import send_notification
from apps.payments.models import PaymentTransaction
from .models import BreakdownRequest, Message
from .serializers import BreakdownRequestCreateSerializer, BreakdownRequestSerializer


# ─── Création demande (public, conducteur anonyme) ────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def create_breakdown_request(request):
    """
    Soumission d'une demande de dépannage par un conducteur sans compte.
    Le driver_token est retourné UNE SEULE FOIS ici — le conducteur doit le conserver.
    """
    serializer = BreakdownRequestCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    instance = serializer.save(
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        driver_account=request.user if request.user.is_authenticated else None,
    )

    # Attribution automatique du mécanicien le plus proche
    mechanic, distance = find_nearest_mechanic(
        latitude=float(instance.latitude),
        longitude=float(instance.longitude),
        specialty_id=instance.specialty_requested_id,
    )

    if mechanic:
        instance.assigned_mechanic = mechanic
        instance.assignment_distance_km = distance
        instance.assigned_at = timezone.now()
        instance.status = 'assigned'
        instance.save(update_fields=[
            'assigned_mechanic', 'assignment_distance_km', 'assigned_at', 'status'
        ])

        from apps.interventions.models import Intervention
        Intervention.objects.get_or_create(
            breakdown_request=instance,
            defaults={'mechanic': mechanic, 'status': 'pending_acceptance'},
        )

        send_notification(
            mechanic.user,
            title='Nouvelle demande de dépannage',
            message=f'Demande de {instance.driver_name} à {distance} km de vous.',
            notif_type='NEW_BREAKDOWN',
            reference_id=str(instance.id),
        )

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
    try:
        intervention = breakdown.intervention
    except Intervention.DoesNotExist:
        return Response({'error': 'Aucune intervention trouvée pour cette demande.'}, status=404)

    # Exposer le numéro du mécanicien dès que le paiement est effectué
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
