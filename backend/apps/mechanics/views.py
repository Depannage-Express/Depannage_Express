# apps/mechanics/views.py
from decimal import Decimal

from django.db.models import Avg, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.core.permissions import IsAdmin, IsMechanic, IsApprovedMechanic
from apps.notifications.utils import send_notification
from .models import MechanicProfile, Specialty, MechanicReview, MechanicAdminMessage, MomoNumberChangeRequest
from .serializers import (
    MechanicProfileSerializer, MechanicPublicSerializer,
    SpecialtySerializer, MechanicValidationSerializer, MechanicReviewSerializer,
    MechanicAdminMessageSerializer, MomoChangeRequestSerializer,
)


# ─── Specialties ─────────────────────────────────────────────────────────────

class SpecialtyListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = SpecialtySerializer
    queryset = Specialty.objects.all()


# ─── Mechanic profile CRUD ───────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsMechanic])
def create_profile_view(request):
    if hasattr(request.user, 'mechanic_profile'):
        return Response({'error': 'Profil déjà existant.'}, status=400)

    serializer = MechanicProfileSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(user=request.user)
    return Response(serializer.data, status=201)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsMechanic])
def my_profile_view(request):
    try:
        profile = request.user.mechanic_profile
    except MechanicProfile.DoesNotExist:
        return Response({'error': 'Profil introuvable.'}, status=404)

    if request.method == 'GET':
        return Response(MechanicProfileSerializer(profile).data)

    serializer = MechanicProfileSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def mechanic_public_profile(request, pk):
    try:
        profile = MechanicProfile.objects.select_related('user').prefetch_related('specialties').get(
            pk=pk, status='approved'
        )
    except MechanicProfile.DoesNotExist:
        return Response({'error': 'Mécanicien introuvable.'}, status=404)

    serializer = MechanicPublicSerializer(profile)
    return Response(serializer.data)


# ─── Public mechanic list ─────────────────────────────────────────────────────

class MechanicPublicListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = MechanicPublicSerializer

    def get_queryset(self):
        qs = MechanicProfile.objects.select_related('user').prefetch_related('specialties').filter(
            status='approved'
        )
        q = self.request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(user__first_name__icontains=q) |
                Q(user__last_name__icontains=q) |
                Q(city__icontains=q) |
                Q(specialties__name__icontains=q) |
                Q(bio__icontains=q)
            ).distinct()
        return qs.order_by('-average_rating')


# ─── Admin: list pending mechanics ───────────────────────────────────────────

class MechanicListAdminView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = MechanicProfileSerializer

    def get_queryset(self):
        from django.db.models import Q
        qs = MechanicProfile.objects.select_related('user').prefetch_related('specialties')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        q = self.request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(short_id__iexact=q) |
                Q(user__first_name__icontains=q) |
                Q(user__last_name__icontains=q) |
                Q(user__email__icontains=q) |
                Q(user__phone__icontains=q)
            )
        return qs.order_by('-created_at')


@api_view(['POST'])
@permission_classes([IsAdmin])
def validate_mechanic_view(request, pk):
    try:
        profile = MechanicProfile.objects.get(pk=pk)
    except MechanicProfile.DoesNotExist:
        return Response({'error': 'Profil introuvable.'}, status=404)

    serializer = MechanicValidationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    action = serializer.validated_data['action']

    if action == 'approve':
        profile.status = 'approved'
        profile.validated_by = request.user
        profile.validated_at = timezone.now()
        profile.save(update_fields=['status', 'validated_by', 'validated_at'])
        send_notification(
            profile.user,
            title='Profil approuvé',
            message='Votre profil mécanicien a été validé. Vous pouvez maintenant recevoir des demandes.',
            notif_type='PROFILE_APPROVED'
        )
    else:
        profile.status = 'rejected'
        profile.rejection_reason = serializer.validated_data.get('rejection_reason', '')
        profile.save(update_fields=['status', 'rejection_reason'])
        send_notification(
            profile.user,
            title='Profil refusé',
            message=f"Votre profil a été refusé. Motif : {profile.rejection_reason}",
            notif_type='PROFILE_REJECTED'
        )

    return Response({'success': True, 'status': profile.status})


@api_view(['PATCH'])
@permission_classes([IsAdmin])
def admin_fix_mechanic_location(request, pk):
    """Corrige les coordonnées GPS d'un mécanicien sans re-valider tout le profil."""
    try:
        profile = MechanicProfile.objects.get(pk=pk)
    except MechanicProfile.DoesNotExist:
        return Response({'error': 'Profil introuvable.'}, status=404)

    lat = str(request.data.get('latitude') or '').strip()
    lng = str(request.data.get('longitude') or '').strip()

    if not lat or not lng:
        return Response({'error': 'latitude et longitude sont obligatoires.'}, status=400)

    try:
        profile.latitude = float(lat)
        profile.longitude = float(lng)
        profile.save(update_fields=['latitude', 'longitude'])
    except ValueError:
        return Response({'error': 'Coordonnées invalides.'}, status=400)

    return Response({'success': True, 'latitude': lat, 'longitude': lng})


# ─── Availability toggle ─────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsApprovedMechanic])
def toggle_availability_view(request):
    try:
        profile = request.user.mechanic_profile
    except MechanicProfile.DoesNotExist:
        return Response({'error': 'Profil introuvable.'}, status=404)

    profile.is_available = not profile.is_available
    profile.save(update_fields=['is_available'])
    return Response({'is_available': profile.is_available})


# ─── Admin reviews ───────────────────────────────────────────────────────────

class ReviewAdminListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = MechanicReviewSerializer

    def get_queryset(self):
        qs = MechanicReview.objects.select_related(
            'mechanic__user', 'intervention'
        ).order_by('-created_at')
        rating = self.request.query_params.get('rating')
        mechanic_id = self.request.query_params.get('mechanic')
        if rating:
            qs = qs.filter(rating=rating)
        if mechanic_id:
            qs = qs.filter(mechanic_id=mechanic_id)
        return qs


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def admin_delete_review(request, pk):
    try:
        review = MechanicReview.objects.select_related('mechanic').get(pk=pk)
    except MechanicReview.DoesNotExist:
        return Response({'error': 'Avis introuvable.'}, status=404)

    mechanic = review.mechanic
    review.delete()

    remaining = MechanicReview.objects.filter(mechanic=mechanic, is_visible=True)
    count = remaining.count()
    if count > 0:
        avg = remaining.aggregate(avg=Avg('rating'))['avg']
        mechanic.average_rating = Decimal(str(round(avg, 2)))
        mechanic.total_reviews = count
    else:
        mechanic.average_rating = Decimal('0.00')
        mechanic.total_reviews = 0
    mechanic.save(update_fields=['average_rating', 'total_reviews'])

    return Response({'success': True})


# ─── Admin : compléter le profil et approuver en une action ──────────────────

@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_complete_and_approve(request, user_id):
    """
    Crée ou met à jour le profil mécanicien d'un utilisateur et l'approuve immédiatement.
    Utilisé par l'admin après visite de l'atelier.
    Accepte multipart/form-data (photo incluse).
    """
    from apps.accounts.models import User

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable.'}, status=404)

    if user.role not in ('mechanic_standard', 'mechanic_premium'):
        return Response({'error': "Cet utilisateur n'est pas un mécanicien."}, status=400)

    profile, _ = MechanicProfile.objects.get_or_create(user=user)

    fields = ['bio', 'address', 'city', 'country', 'years_experience']
    for field in fields:
        if field in request.data:
            val = request.data.get(field)
            if field == 'years_experience':
                try:
                    val = int(val)
                except (TypeError, ValueError):
                    val = 0
            setattr(profile, field, val)

    for coord in ('latitude', 'longitude'):
        raw = request.data.get(coord, '').strip()
        if raw:
            profile.__dict__[coord] = raw

    for photo_field in ('profile_photo', 'id_card_front', 'id_card_back', 'certification_doc'):
        if photo_field in request.FILES:
            setattr(profile, photo_field, request.FILES[photo_field])

    profile.status = 'approved'
    profile.validated_by = request.user
    profile.validated_at = timezone.now()
    profile.save()

    specialty_ids = request.data.getlist('specialty_ids')
    if not specialty_ids:
        raw_ids = request.data.get('specialty_ids', '')
        if raw_ids:
            specialty_ids = [s.strip() for s in str(raw_ids).split(',') if s.strip()]
    if specialty_ids:
        profile.specialties.set(Specialty.objects.filter(pk__in=specialty_ids))

    send_notification(
        user,
        title='Profil approuvé',
        message='Votre profil mécanicien a été validé. Vous pouvez maintenant recevoir des demandes.',
        notif_type='PROFILE_APPROVED',
    )

    return Response({'success': True, 'profile_id': str(profile.pk)}, status=200)


# ─── Messagerie mécanicien ↔ admin ────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def mechanic_admin_messages(request):
    """
    GET  — mécanicien lit sa conversation avec l'admin (son propre fil).
           admin lit le fil d'un mécanicien via ?mechanic_id=<uuid>.
    POST — mécanicien envoie (sender_type déterminé côté serveur).
           admin répond en passant mechanic_id dans le body.
    """
    is_admin = request.user.role == 'admin'

    if is_admin:
        mechanic_id = request.query_params.get('mechanic_id') or request.data.get('mechanic_id')
        if not mechanic_id:
            return Response({'error': 'mechanic_id requis.'}, status=400)
        try:
            profile = MechanicProfile.objects.select_related('user').get(pk=mechanic_id)
        except MechanicProfile.DoesNotExist:
            return Response({'error': 'Mécanicien introuvable.'}, status=404)
    else:
        if request.user.role not in ('mechanic_standard', 'mechanic_premium') or request.user.is_blocked:
            return Response({'error': 'Accès non autorisé.'}, status=403)
        try:
            profile = request.user.mechanic_profile
        except MechanicProfile.DoesNotExist:
            return Response({'error': 'Profil mécanicien introuvable.'}, status=404)

    if request.method == 'GET':
        msgs = MechanicAdminMessage.objects.filter(mechanic=profile)
        return Response(MechanicAdminMessageSerializer(msgs, many=True).data)

    # POST
    content = (request.data.get('content') or '').strip()
    if not content:
        return Response({'error': 'Message vide.'}, status=400)

    if is_admin:
        full = f"{request.user.first_name} {request.user.last_name}".strip()
        sender_name = full or 'Administration'
        sender_type_val = 'admin'
    else:
        full = f"{request.user.first_name} {request.user.last_name}".strip()
        sender_name = full or request.user.email
        sender_type_val = 'mechanic'

    msg = MechanicAdminMessage.objects.create(
        mechanic=profile,
        sender_type=sender_type_val,
        sender_name=sender_name,
        content=content,
    )
    return Response(MechanicAdminMessageSerializer(msg).data, status=201)


@api_view(['GET'])
@permission_classes([IsAdmin])
def mechanic_admin_conversations(request):
    """Liste tous les mécaniciens approuvés avec leur nombre de messages (pour l'interface admin)."""
    from django.db.models import Count, Max
    profiles = (
        MechanicProfile.objects
        .filter(status='approved')
        .select_related('user')
        .annotate(
            msg_count=Count('admin_messages'),
            last_msg_at=Max('admin_messages__created_at'),
        )
        .order_by('-last_msg_at', '-created_at')
    )
    return Response([{
        'mechanic_id': str(p.id),
        'name': p.user.full_name,
        'msg_count': p.msg_count,
        'last_message_at': p.last_msg_at,
    } for p in profiles])


# ─── Reviews (public) ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def mechanic_reviews(request, pk):
    """
    Lecture publique des avis visibles d'un mécanicien.
    La création d'avis passe exclusivement par POST /interventions/<id>/review/
    (authentification driver_token obligatoire).
    """
    try:
        profile = MechanicProfile.objects.get(pk=pk)
    except MechanicProfile.DoesNotExist:
        return Response({'error': 'Mécanicien introuvable.'}, status=404)

    reviews = MechanicReview.objects.filter(
        mechanic=profile, is_visible=True
    ).order_by('-created_at')
    return Response(MechanicReviewSerializer(reviews, many=True).data)


# ─── Changement numéro MoMo ───────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsApprovedMechanic])
def mechanic_momo_change(request):
    profile = request.user.mechanic_profile

    if request.method == 'GET':
        reqs = profile.momo_change_requests.all()[:20]
        return Response(MomoChangeRequestSerializer(reqs, many=True).data)

    new_number = (request.data.get('new_number') or '').strip()
    if not new_number:
        return Response({'error': 'Nouveau numéro obligatoire.'}, status=400)
    if profile.momo_change_requests.filter(status='pending').exists():
        return Response({'error': 'Une demande de changement est déjà en cours.'}, status=400)

    req = MomoNumberChangeRequest.objects.create(mechanic=profile, new_number=new_number)

    from apps.accounts.models import User
    for admin in User.objects.filter(role='admin'):
        send_notification(
            admin,
            title='Changement numéro MoMo',
            message=f'{profile.user.full_name} demande un changement de numéro MoMo : {new_number}.',
            notif_type='MOMO_CHANGE_REQUEST',
            reference_id=str(req.id),
        )
    return Response(MomoChangeRequestSerializer(req).data, status=201)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_momo_change_list(request):
    status_filter = request.query_params.get('status', '')
    qs = MomoNumberChangeRequest.objects.select_related('mechanic__user', 'processed_by')
    if status_filter:
        qs = qs.filter(status=status_filter)
    return Response(MomoChangeRequestSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_momo_change_process(request, pk):
    from django.shortcuts import get_object_or_404
    req = get_object_or_404(MomoNumberChangeRequest, pk=pk)
    if req.status != 'pending':
        return Response({'error': 'Déjà traité.'}, status=400)

    action = request.data.get('action')
    req.admin_note = (request.data.get('admin_note') or '').strip()
    req.processed_by = request.user
    req.processed_at = timezone.now()

    if action == 'approve':
        req.status = 'approved'
        req.mechanic.withdrawal_number = req.new_number
        req.mechanic.save(update_fields=['withdrawal_number'])
        send_notification(
            req.mechanic.user,
            title='Changement numéro MoMo approuvé',
            message=f'Votre numéro MoMo a été mis à jour : {req.new_number}. '
                    f'Vous pourrez effectuer un retrait dans 72h.',
            notif_type='MOMO_CHANGE_APPROVED',
            reference_id=str(req.id),
        )
    elif action == 'reject':
        req.status = 'rejected'
        send_notification(
            req.mechanic.user,
            title='Changement numéro MoMo refusé',
            message=f'Votre demande de changement de numéro MoMo a été refusée. '
                    f'{req.admin_note or "Contactez l\'administration."}',
            notif_type='MOMO_CHANGE_REJECTED',
            reference_id=str(req.id),
        )
    else:
        return Response({'error': 'Action invalide (approve/reject).'}, status=400)

    req.save()
    return Response(MomoChangeRequestSerializer(req).data)