# apps/mechanics/views.py
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.core.permissions import IsAdmin, IsMechanic
from apps.notifications.utils import send_notification
from .models import MechanicProfile, Specialty, MechanicReview
from .serializers import (
    MechanicProfileSerializer, MechanicPublicSerializer,
    SpecialtySerializer, MechanicValidationSerializer, MechanicReviewSerializer
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


# ─── Admin: list pending mechanics ───────────────────────────────────────────

class MechanicListAdminView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = MechanicProfileSerializer

    def get_queryset(self):
        qs = MechanicProfile.objects.select_related('user').prefetch_related('specialties')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
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


# ─── Availability toggle ─────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsMechanic])
def toggle_availability_view(request):
    try:
        profile = request.user.mechanic_profile
    except MechanicProfile.DoesNotExist:
        return Response({'error': 'Profil introuvable.'}, status=404)

    profile.is_available = not profile.is_available
    profile.save(update_fields=['is_available'])
    return Response({'is_available': profile.is_available})


# ─── Reviews ─────────────────────────────────────────────────────────────────

class ReviewListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = MechanicReviewSerializer

    def get_queryset(self):
        mechanic_id = self.kwargs.get('pk')
        return MechanicReview.objects.filter(
            mechanic_id=mechanic_id, is_visible=True
        ).order_by('-created_at')