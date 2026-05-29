from django.utils import timezone
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.core.permissions import IsAdmin
from apps.security.utils import log_security_event
from .models import PaymentTransaction
from .serializers import PaymentTransactionSerializer, PaymentStatusSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def create_payment(request):
    """
    Cree une intention de paiement.
    Le branchement reel avec un operateur mobile money ou carte viendra ensuite.
    """
    serializer = PaymentTransactionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payment = serializer.save(
        status='authorized',
        provider_reference=f"PAY-{timezone.now().strftime('%Y%m%d%H%M%S')}",
    )

    log_security_event(
        request,
        request.user if getattr(request, 'user', None) and request.user.is_authenticated else None,
        'PAYMENT_CREATED',
        f'Paiement initialise pour {payment.payment_for} montant={payment.amount}',
    )

    return Response(PaymentTransactionSerializer(payment).data, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_payment(request, pk):
    try:
        payment = PaymentTransaction.objects.get(pk=pk)
    except PaymentTransaction.DoesNotExist:
        return Response({'error': 'Paiement introuvable.'}, status=404)

    payment.status = 'paid'
    payment.paid_at = timezone.now()
    payment.save(update_fields=['status', 'paid_at'])

    log_security_event(request, None, 'PAYMENT_CONFIRMED', f'Paiement {pk} confirme')
    return Response(PaymentStatusSerializer(payment).data)


class PaymentAdminListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = PaymentTransactionSerializer
    queryset = PaymentTransaction.objects.all().order_by('-created_at')
