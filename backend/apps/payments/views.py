# apps/payments/views.py
from django.utils import timezone
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.core.permissions import IsAdmin, IsMechanic
from apps.security.utils import log_security_event
from .models import PaymentTransaction
from .serializers import PaymentTransactionSerializer, PaymentStatusSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def create_payment(request):
    """
    Crée une intention de paiement pour une intervention.

    Contrôles backend obligatoires :
    1. driver_token + breakdown_request_id doivent correspondre
    2. L'intervention liée doit avoir été acceptée par le mécanicien
    3. Aucun paiement 'paid' ne doit déjà exister pour cette intervention
    """
    from apps.breakdowns.models import BreakdownRequest
    from apps.interventions.models import Intervention

    driver_token = request.data.get('driver_token')
    breakdown_id = request.data.get('breakdown_request')

    # Vérification du driver_token
    if not driver_token or not breakdown_id:
        return Response(
            {'error': 'driver_token et breakdown_request sont obligatoires.'},
            status=400,
        )

    try:
        breakdown = BreakdownRequest.objects.get(
            pk=breakdown_id,
            driver_token=driver_token,
        )
    except BreakdownRequest.DoesNotExist:
        return Response({'error': 'Token conducteur invalide ou demande introuvable.'}, status=403)

    intervention = breakdown.interventions.exclude(
        status__in=['refused', 'cancelled']
    ).first()
    if not intervention:
        return Response({'error': 'Aucune intervention active pour cette demande.'}, status=400)

    if intervention.status == 'pending_acceptance':
        return Response(
            {'error': 'Le mécanicien n\'a pas encore accepté l\'intervention.'},
            status=400,
        )

    # Idempotence : refuser si un paiement validé existe déjà
    if PaymentTransaction.objects.filter(breakdown_request=breakdown, status='paid').exists():
        return Response({'error': 'Cette intervention a déjà été payée.'}, status=400)

    # Construire les données sans le driver_token (non stocké dans PaymentTransaction)
    payment_data = {k: v for k, v in request.data.items() if k != 'driver_token'}
    payment_data['intervention'] = str(intervention.id)
    payment_data['mechanic'] = str(intervention.mechanic_id)

    serializer = PaymentTransactionSerializer(data=payment_data)
    serializer.is_valid(raise_exception=True)
    payment = serializer.save(
        status='authorized',
        provider_reference=f"PAY-{timezone.now().strftime('%Y%m%d%H%M%S')}",
    )

    log_security_event(
        request,
        None,
        'PAYMENT_CREATED',
        f'Paiement initialisé pour intervention {intervention.id} montant={payment.amount}',
    )

    return Response(PaymentTransactionSerializer(payment).data, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_payment(request, pk):
    """
    Confirme un paiement et fait avancer le workflow côté backend.

    Contrôles :
    1. driver_token + breakdown_request_id doivent correspondre au paiement
    2. Le paiement doit être en état 'authorized'
    3. Sur confirmation : transition intervention completed → paid (via state machine)
    """
    try:
        payment = PaymentTransaction.objects.select_related('breakdown_request').get(pk=pk)
    except PaymentTransaction.DoesNotExist:
        return Response({'error': 'Paiement introuvable.'}, status=404)

    driver_token = request.data.get('driver_token')
    breakdown_id = request.data.get('breakdown_request_id')

    if not driver_token or not breakdown_id:
        return Response(
            {'error': 'driver_token et breakdown_request_id sont obligatoires.'},
            status=400,
        )

    if payment.breakdown_request is None:
        return Response({'error': 'Ce paiement n\'est pas lié à une demande.'}, status=400)

    if str(payment.breakdown_request.id) != str(breakdown_id):
        return Response({'error': 'Confirmation de paiement non autorisée.'}, status=403)

    if str(payment.breakdown_request.driver_token) != str(driver_token):
        return Response({'error': 'Token conducteur invalide.'}, status=403)

    # Idempotence
    if payment.status == 'paid':
        return Response(PaymentStatusSerializer(payment).data)

    if payment.status != 'authorized':
        return Response(
            {'error': f"Impossible de confirmer un paiement en état '{payment.status}'."},
            status=400,
        )

    # Confirmer le paiement
    payment.status = 'paid'
    payment.paid_at = timezone.now()
    payment.save(update_fields=['status', 'paid_at'])

    # NE PAS déclencher la transition ici.
    # C'est driver_confirm_intervention (POST /interventions/<id>/driver-confirm/)
    # qui fait la transition completed → paid de façon explicite.
    # confirm_payment ne fait que valider le paiement côté financier.

    log_security_event(
        request, None, 'PAYMENT_CONFIRMED',
        f'Paiement {pk} confirmé pour breakdown {breakdown_id}',
    )
    return Response(PaymentStatusSerializer(payment).data)


class PaymentAdminListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = PaymentTransactionSerializer
    queryset = PaymentTransaction.objects.select_related(
        'mechanic__user'
    ).all().order_by('-created_at')


SUBSCRIPTION_AMOUNT = '5000.00'


@api_view(['POST'])
@permission_classes([IsMechanic])
def create_subscription_payment(request):
    """Crée une intention de paiement pour l'abonnement premium mécanicien."""
    user = request.user

    if user.role == 'mechanic_premium':
        return Response({'error': 'Vous êtes déjà abonné au plan Premium.'}, status=400)

    try:
        profile = user.mechanic_profile
    except Exception:
        return Response({'error': 'Profil mécanicien introuvable.'}, status=404)

    if PaymentTransaction.objects.filter(
        mechanic=profile,
        payment_for='premium_subscription',
        status__in=['pending', 'authorized'],
    ).exists():
        return Response({'error': "Une demande d'abonnement est déjà en cours."}, status=400)

    payer_name = (request.data.get('payer_name') or user.full_name).strip()
    payer_phone = (request.data.get('payer_phone') or user.phone or '').strip()
    payment_method = (request.data.get('payment_method') or 'MTN Mobile Money').strip()

    if not payer_phone:
        return Response({'error': 'Le numéro de téléphone est obligatoire.'}, status=400)

    data = {
        'payer_name': payer_name,
        'payer_phone': payer_phone,
        'amount': SUBSCRIPTION_AMOUNT,
        'currency': 'XOF',
        'payment_method': payment_method,
        'payment_for': 'premium_subscription',
        'mechanic': str(profile.pk),
    }

    serializer = PaymentTransactionSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    payment = serializer.save(
        status='authorized',
        provider_reference=f"SUB-{timezone.now().strftime('%Y%m%d%H%M%S')}",
    )

    log_security_event(
        request, user, 'SUBSCRIPTION_PAYMENT_CREATED',
        f'Paiement abonnement premium initié par {user.email}',
    )

    return Response(PaymentTransactionSerializer(payment).data, status=201)


@api_view(['POST'])
@permission_classes([IsMechanic])
def confirm_subscription_payment(request, pk):
    """Confirme le paiement d'abonnement et passe le mécanicien en Premium."""
    user = request.user

    try:
        payment = PaymentTransaction.objects.select_related('mechanic__user').get(
            pk=pk,
            payment_for='premium_subscription',
        )
    except PaymentTransaction.DoesNotExist:
        return Response({'error': 'Paiement introuvable.'}, status=404)

    if payment.mechanic.user_id != user.pk:
        return Response({'error': 'Non autorisé.'}, status=403)

    if payment.status == 'paid':
        return Response({'success': True, 'message': 'Abonnement déjà activé.'})

    if payment.status != 'authorized':
        return Response(
            {'error': f"Impossible de confirmer un paiement en état '{payment.status}'."},
            status=400,
        )

    payment.status = 'paid'
    payment.paid_at = timezone.now()
    payment.save(update_fields=['status', 'paid_at'])

    user.role = 'mechanic_premium'
    user.save(update_fields=['role'])

    log_security_event(
        request, user, 'SUBSCRIPTION_CONFIRMED',
        f'Mécanicien {user.email} passé en Premium.',
    )

    return Response({'success': True, 'message': 'Félicitations ! Vous êtes maintenant Mécanicien Premium.'})
