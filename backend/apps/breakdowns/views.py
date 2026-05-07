# apps/breakdowns/views.py
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsAdmin, IsMechanic
from apps.geolocation.utils import find_nearest_mechanic
from apps.notifications.utils import send_notification
from .models import BreakdownRequest
from .serializers import BreakdownRequestCreateSerializer, BreakdownRequestSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def create_breakdown_request(request):
    """
    Permet à n'importe qui (sans compte) de soumettre une demande de dépannage.
    Attribution automatique du mécanicien le plus proche.
    """
    serializer = BreakdownRequestCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Metadata sécurité
    instance = serializer.save(
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        driver_account=request.user if request.user.is_authenticated else None,
    )

    # Attribution automatique
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

        send_notification(
            mechanic.user,
            title='Nouvelle demande de dépannage',
            message=f'Demande de {instance.driver_name} à {distance} km de vous.',
            notif_type='NEW_BREAKDOWN',
            reference_id=str(instance.id),
        )

    return Response(BreakdownRequestSerializer(instance).data, status=201)


@api_view(['GET'])
@permission_classes([IsMechanic])
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