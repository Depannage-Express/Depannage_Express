# apps/interventions/views.py
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.core.permissions import IsAdmin, IsMechanic
from apps.notifications.utils import send_notification
from apps.breakdowns.models import BreakdownRequest
from .models import Intervention
from .serializers import InterventionSerializer


def _get_intervention_for_mechanic(pk, mechanic_profile):
    try:
        return Intervention.objects.get(pk=pk, mechanic=mechanic_profile)
    except Intervention.DoesNotExist:
        return None


@api_view(['POST'])
@permission_classes([IsMechanic])
def accept_intervention(request, pk):
    profile = request.user.mechanic_profile
    intervention = _get_intervention_for_mechanic(pk, profile)
    if not intervention:
        return Response({'error': 'Intervention introuvable.'}, status=404)
    if intervention.status != 'pending_acceptance':
        return Response({'error': 'Action impossible sur ce statut.'}, status=400)

    intervention.status = 'accepted'
    intervention.accepted_at = timezone.now()
    intervention.save(update_fields=['status', 'accepted_at'])

    # Update breakdown
    intervention.breakdown_request.status = 'in_progress'
    intervention.breakdown_request.save(update_fields=['status'])

    return Response({'success': True, 'status': intervention.status})


@api_view(['POST'])
@permission_classes([IsMechanic])
def refuse_intervention(request, pk):
    profile = request.user.mechanic_profile
    intervention = _get_intervention_for_mechanic(pk, profile)
    if not intervention:
        return Response({'error': 'Intervention introuvable.'}, status=404)
    if intervention.status != 'pending_acceptance':
        return Response({'error': 'Action impossible sur ce statut.'}, status=400)

    reason = request.data.get('reason', '')
    intervention.status = 'refused'
    intervention.refused_at = timezone.now()
    intervention.refusal_reason = reason
    intervention.save(update_fields=['status', 'refused_at', 'refusal_reason'])

    return Response({'success': True, 'status': intervention.status})


@api_view(['POST'])
@permission_classes([IsMechanic])
def start_intervention(request, pk):
    profile = request.user.mechanic_profile
    intervention = _get_intervention_for_mechanic(pk, profile)
    if not intervention:
        return Response({'error': 'Intervention introuvable.'}, status=404)
    if intervention.status != 'accepted':
        return Response({'error': 'L\'intervention doit être acceptée d\'abord.'}, status=400)

    intervention.status = 'in_progress'
    intervention.started_at = timezone.now()
    # Optional before photo
    if 'before_photo' in request.FILES:
        intervention.before_photo = request.FILES['before_photo']
    intervention.save(update_fields=['status', 'started_at', 'before_photo'])

    return Response({'success': True, 'status': intervention.status})


@api_view(['POST'])
@permission_classes([IsMechanic])
def complete_intervention(request, pk):
    profile = request.user.mechanic_profile
    intervention = _get_intervention_for_mechanic(pk, profile)
    if not intervention:
        return Response({'error': 'Intervention introuvable.'}, status=404)
    if intervention.status != 'in_progress':
        return Response({'error': 'L\'intervention n\'est pas en cours.'}, status=400)

    final_cost = request.data.get('final_cost')
    notes = request.data.get('mechanic_notes', '')

    intervention.status = 'completed'
    intervention.completed_at = timezone.now()
    intervention.mechanic_notes = notes
    if final_cost:
        try:
            intervention.final_cost = float(final_cost)
        except ValueError:
            pass
    if 'after_photo' in request.FILES:
        intervention.after_photo = request.FILES['after_photo']
    intervention.save(update_fields=[
        'status', 'completed_at', 'mechanic_notes', 'final_cost', 'after_photo'
    ])

    # Update breakdown + mechanic stats
    breakdown = intervention.breakdown_request
    breakdown.status = 'completed'
    breakdown.save(update_fields=['status'])

    profile.total_interventions += 1
    profile.save(update_fields=['total_interventions'])

    return Response({'success': True, 'status': intervention.status})


@api_view(['GET'])
@permission_classes([IsMechanic])
def my_interventions(request):
    profile = request.user.mechanic_profile
    qs = Intervention.objects.filter(mechanic=profile).select_related(
        'breakdown_request'
    ).order_by('-created_at')

    status_filter = request.query_params.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)

    serializer = InterventionSerializer(qs, many=True)
    return Response({'count': qs.count(), 'results': serializer.data})


class InterventionAdminListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = InterventionSerializer

    def get_queryset(self):
        qs = Intervention.objects.select_related(
            'mechanic__user', 'breakdown_request'
        ).order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs