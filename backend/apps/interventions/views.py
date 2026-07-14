# apps/interventions/views.py
import logging

from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

logger = logging.getLogger(__name__)

from apps.core.permissions import IsAdmin, IsApprovedMechanic, IsValidDriverTokenForIntervention
from apps.core.state_machine import (
    transition_intervention, get_actor_role,
    InvalidTransition, UnauthorizedTransition,
)
from .models import Intervention
from .serializers import InterventionSerializer, InterventionAcceptedSerializer


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_own_intervention(pk, mechanic_profile):
    """Retourne l'Intervention du mécanicien ou None."""
    try:
        return Intervention.objects.select_related(
            'breakdown_request', 'mechanic'
        ).get(pk=pk, mechanic=mechanic_profile)
    except Intervention.DoesNotExist:
        return None


def _transition_response(intervention, action, actor_role, **kwargs):
    """
    Applique la transition et retourne une Response normalisée.
    Toutes les erreurs métier remontent proprement.
    """
    try:
        transition_intervention(intervention, action, actor_role, **kwargs)
    except InvalidTransition as exc:
        # detail est une liste d'ErrorDetail (sous-classe de str)
        detail = exc.detail
        msg = str(detail[0]) if isinstance(detail, list) else str(detail)
        return Response({'error': msg}, status=400)
    except UnauthorizedTransition as exc:
        return Response({'error': str(exc.detail)}, status=403)
    except Exception:
        logger.exception(
            "Erreur inattendue — transition '%s' sur intervention %s", action, intervention.pk
        )
        return Response({'error': 'Erreur interne. Veuillez réessayer.'}, status=500)
    return Response({'success': True, 'status': intervention.status})


# ─── Actions mécanicien ───────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsApprovedMechanic])
def accept_intervention(request, pk):
    profile = request.user.mechanic_profile
    intervention = _get_own_intervention(pk, profile)
    if not intervention:
        return Response({'error': 'Intervention introuvable.'}, status=404)
    if intervention.breakdown_request.status == 'in_progress':
        return Response(
            {'error': 'Ce dépannage a déjà été accepté par un autre mécanicien.'},
            status=409,
        )
    return _transition_response(intervention, 'accept', 'mechanic')


@api_view(['POST'])
@permission_classes([IsApprovedMechanic])
def refuse_intervention(request, pk):
    profile = request.user.mechanic_profile
    intervention = _get_own_intervention(pk, profile)
    if not intervention:
        return Response({'error': 'Intervention introuvable.'}, status=404)
    return _transition_response(
        intervention, 'refuse', 'mechanic',
        refusal_reason=request.data.get('reason', ''),
    )


@api_view(['POST'])
@permission_classes([IsApprovedMechanic])
def start_intervention(request, pk):
    profile = request.user.mechanic_profile
    intervention = _get_own_intervention(pk, profile)
    if not intervention:
        return Response({'error': 'Intervention introuvable.'}, status=404)
    return _transition_response(
        intervention, 'start', 'mechanic',
        before_photo=request.FILES.get('before_photo'),
    )


@api_view(['POST'])
@permission_classes([IsApprovedMechanic])
def complete_intervention(request, pk):
    profile = request.user.mechanic_profile
    intervention = _get_own_intervention(pk, profile)
    if not intervention:
        return Response({'error': 'Intervention introuvable.'}, status=404)
    return _transition_response(
        intervention, 'complete', 'mechanic',
        final_cost=request.data.get('final_cost'),
        mechanic_notes=request.data.get('mechanic_notes', ''),
        after_photo=request.FILES.get('after_photo'),
    )


# ─── Actions conducteur (authentification par driver_token) ───────────────────

@api_view(['POST'])
@permission_classes([IsValidDriverTokenForIntervention])
def driver_confirm_intervention(request, pk):
    """
    Confirmation du conducteur : déclenche la transition completed → paid.
    Requiert driver_token (dans body ou query param).
    """
    intervention = request.driver_intervention

    from apps.payments.models import PaymentTransaction
    from django.db.models import F as DbF
    payment = PaymentTransaction.objects.filter(
        breakdown_request=intervention.breakdown_request,
        status__in=['paid', 'authorized'],
        payment_for='intervention',
    ).order_by('-created_at').first()
    if not payment:
        return Response(
            {'error': "Aucun paiement trouvé pour cette intervention."},
            status=400,
        )

    # S'assurer que le paiement est marqué paid avant la transition
    if payment.status == 'authorized':
        from django.utils import timezone
        payment.status = 'paid'
        payment.paid_at = timezone.now()
        payment.save(update_fields=['status', 'paid_at'])

    response = _transition_response(intervention, 'pay', 'driver')

    # Les deux parties ont confirmé : on crédite maintenant le compte virtuel du mécanicien
    if response.status_code == 200 and payment.mechanic_id and payment.payment_for == 'intervention':
        from apps.mechanics.models import MechanicProfile
        from decimal import Decimal, ROUND_DOWN

        if payment.net_amount == Decimal('0'):
            commission = (payment.amount * payment.breakdown_request.commission_rate).quantize(
                Decimal('0.01'), rounding=ROUND_DOWN
            )
            net_amount = payment.amount - commission
            payment.commission_amount = commission
            payment.net_amount = net_amount
            payment.save(update_fields=['commission_amount', 'net_amount'])
        else:
            net_amount = payment.net_amount

        MechanicProfile.objects.filter(pk=payment.mechanic_id).update(
            balance=DbF('balance') + net_amount
        )

    return response


@api_view(['POST'])
@permission_classes([IsValidDriverTokenForIntervention])
def submit_review_for_intervention(request, pk):
    """
    Dépôt d'un avis : déclenche la transition paid → reviewed.
    Requiert driver_token (dans body ou query param).
    """
    intervention = request.driver_intervention
    return _transition_response(
        intervention, 'review', 'driver',
        rating=request.data.get('rating'),
        comment=request.data.get('comment', ''),
        reviewer_name=request.data.get('reviewer_name', ''),
    )


# ─── Listes ───────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsApprovedMechanic])
def my_interventions(request):
    profile = request.user.mechanic_profile
    qs = Intervention.objects.filter(mechanic=profile).select_related(
        'breakdown_request'
    ).order_by('-created_at')

    status_filter = request.query_params.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)

    serializer = InterventionAcceptedSerializer(qs, many=True)
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


# ─── Admin : annulation d'urgence ─────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_cancel_intervention(request, pk):
    try:
        intervention = Intervention.objects.select_related('breakdown_request').get(pk=pk)
    except Intervention.DoesNotExist:
        return Response({'error': 'Intervention introuvable.'}, status=404)
    return _transition_response(intervention, 'cancel', 'admin')
