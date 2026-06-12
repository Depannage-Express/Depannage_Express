# apps/payments/views.py
import json as stdlib_json
from decimal import Decimal, ROUND_DOWN

from django.conf import settings
from django.db import transaction as db_transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.core.permissions import IsAdmin, IsMechanic, IsApprovedMechanic
from apps.notifications.utils import send_notification
from apps.security.utils import log_security_event
from .fedapay_client import verify_webhook_signature
from .models import PaymentTransaction, WithdrawalRequest
from .serializers import PaymentTransactionSerializer, PaymentStatusSerializer, WithdrawalRequestSerializer, PaymentAdminSerializer


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

    with db_transaction.atomic():
        # Idempotence protégée contre les doubles créations concurrentes
        existing = PaymentTransaction.objects.select_for_update().filter(
            breakdown_request=breakdown,
            status__in=['pending', 'authorized', 'paid'],
        ).first()
        if existing:
            if existing.status == 'paid':
                return Response({'error': 'Cette intervention a déjà été payée.'}, status=400)
            return Response({'error': 'Un paiement est déjà en cours pour cette intervention.'}, status=400)

        # Montant calculé côté serveur — le champ 'amount' du frontend est ignoré
        amount = settings.BREAKDOWN_PRICING.get(
            breakdown.breakdown_type,
            settings.BREAKDOWN_PRICING['general'],
        )

        payment_data = {
            k: v for k, v in request.data.items()
            if k not in ('driver_token', 'amount', 'breakdown_request')
        }
        payment_data['breakdown_request'] = str(breakdown.id)
        payment_data['intervention'] = str(intervention.id)
        payment_data['mechanic'] = str(intervention.mechanic_id)
        payment_data['amount'] = str(amount)

        is_premium = intervention.mechanic.user.role == 'mechanic_premium'
        if is_premium:
            commission = Decimal('0')
        else:
            commission = (Decimal(str(amount)) * settings.PLATFORM_COMMISSION_RATE).quantize(
                Decimal('0.01'), rounding=ROUND_DOWN
            )
        payment_data['commission_amount'] = str(commission)
        payment_data['net_amount'] = str(Decimal(str(amount)) - commission)

        serializer = PaymentTransactionSerializer(data=payment_data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(status='authorized', provider_reference='')

    payment.provider_reference = f'SIM-{payment.id}'
    payment.save(update_fields=['provider_reference'])

    log_security_event(
        request, None, 'PAYMENT_CREATED',
        f'Paiement simulé créé pour intervention {intervention.id} montant={payment.amount}',
    )

    return Response({'payment_id': str(payment.id)}, status=201)


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

    # Confirmer le paiement (séquestre : fonds retenus jusqu'à confirmation des deux parties)
    payment.status = 'paid'
    payment.paid_at = timezone.now()
    payment.save(update_fields=['status', 'paid_at'])

    # Le crédit du mécanicien se fait dans driver_confirm_intervention,
    # une fois que les deux parties ont confirmé la fin de l'intervention.

    log_security_event(
        request, None, 'PAYMENT_CONFIRMED',
        f'Paiement {pk} confirmé pour breakdown {breakdown_id}',
    )
    return Response(PaymentStatusSerializer(payment).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def payment_callback(request):
    """
    Webhook FedaPay : met à jour le paiement et l'intervention après confirmation externe.
    Protégé par vérification HMAC-SHA256 (header X-Fedapay-Signature: sha256=<hex>).
    """
    from apps.interventions.models import Intervention

    signature = request.META.get('HTTP_X_FEDAPAY_SIGNATURE', '')
    raw_body = request.body

    if not verify_webhook_signature(raw_body, signature):
        return Response({'error': 'Signature invalide.'}, status=400)

    try:
        payload = stdlib_json.loads(raw_body)
    except (ValueError, KeyError):
        return Response({'error': 'Payload invalide.'}, status=400)

    transaction_obj = payload.get('object', {})
    fedapay_id = str(transaction_obj.get('id', ''))
    fedapay_status = transaction_obj.get('status', '')

    if not fedapay_id:
        return Response({'error': 'ID de transaction manquant.'}, status=400)

    try:
        payment = PaymentTransaction.objects.select_related('intervention').get(
            provider_reference=fedapay_id
        )
    except PaymentTransaction.DoesNotExist:
        return Response({'error': 'Paiement introuvable.'}, status=404)

    # Idempotence
    if payment.status == 'paid':
        return Response({'status': 'already_paid'})

    if fedapay_status in ('approved', 'transferred'):
        with db_transaction.atomic():
            payment.status = 'paid'
            payment.paid_at = timezone.now()
            payment.save(update_fields=['status', 'paid_at'])

            if payment.intervention_id:
                Intervention.objects.filter(pk=payment.intervention_id).update(status='paid')

        log_security_event(
            request, None, 'PAYMENT_CALLBACK_OK',
            f'Callback FedaPay OK — transaction {fedapay_id} statut={fedapay_status}',
        )

    return Response({'status': 'ok'})


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_list_payments(request):
    from django.db import models as db_models

    qs = PaymentTransaction.objects.select_related(
        'breakdown_request', 'mechanic__user'
    ).order_by('-created_at')

    status = request.query_params.get('status')
    if status and status != 'all':
        qs = qs.filter(status=status)

    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(
            db_models.Q(provider_reference__icontains=search) |
            db_models.Q(payer_name__icontains=search) |
            db_models.Q(breakdown_request__driver_name__icontains=search)
        )

    return Response(PaymentAdminSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_payment_stats(request):
    from django.db.models import Sum, Count, Q

    stats = PaymentTransaction.objects.aggregate(
        total_paid=Sum('amount', filter=Q(status='paid')),
        total_commission=Sum('commission_amount', filter=Q(status='paid')),
        total_net=Sum('net_amount', filter=Q(status='paid')),
        count_paid=Count('id', filter=Q(status='paid')),
        count_pending=Count('id', filter=Q(status__in=['pending', 'authorized'])),
        count_failed=Count('id', filter=Q(status='failed')),
        count_total=Count('id'),
    )
    stats['platform_commission_rate'] = float(settings.PLATFORM_COMMISSION_RATE)
    stats['withdrawal_fee_rate'] = float(settings.WITHDRAWAL_FEE_RATE)
    stats['pending_withdrawals'] = WithdrawalRequest.objects.filter(status='pending').count()
    stats['pending_withdrawal_amount'] = float(
        WithdrawalRequest.objects.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
    )
    stats['total_paid'] = float(stats['total_paid'] or 0)
    stats['total_commission'] = float(stats['total_commission'] or 0)
    stats['total_net'] = float(stats['total_net'] or 0)
    return Response(stats)


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
        'amount': settings.PREMIUM_SUBSCRIPTION_AMOUNT,
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


# ─── Portefeuille mécanicien ──────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsApprovedMechanic])
def mechanic_wallet(request):
    profile = request.user.mechanic_profile

    payments = (
        PaymentTransaction.objects
        .filter(mechanic=profile, payment_for='intervention', status='paid')
        .order_by('-paid_at')
    )
    withdrawals = WithdrawalRequest.objects.filter(mechanic=profile).order_by('-created_at')

    history = []
    for p in payments:
        ref = str(p.breakdown_request_id)[:8].upper() if p.breakdown_request_id else '—'
        history.append({
            'type': 'credit',
            'amount': str(p.amount),
            'label': f'Intervention #{ref}',
            'date': p.paid_at,
            'status': 'paid',
        })
    for w in withdrawals:
        history.append({
            'type': 'debit',
            'amount': str(w.amount),
            'fee': str(w.fee),
            'net_amount': str(w.net_amount),
            'label': f'Retrait {w.get_momo_provider_display()} — {w.momo_number}',
            'date': w.created_at,
            'status': w.status,
            'id': str(w.id),
        })
    history.sort(key=lambda x: x['date'] or timezone.now(), reverse=True)

    withdrawal_number = profile.withdrawal_number or profile.user.phone or ''

    # Calcul éventuel du lockout 72h après dernier changement approuvé
    from apps.mechanics.models import MomoNumberChangeRequest
    import math
    lockout_until = None
    last_approved = (
        MomoNumberChangeRequest.objects
        .filter(mechanic=profile, status='approved')
        .order_by('-processed_at')
        .first()
    )
    if last_approved and last_approved.processed_at:
        delta = timezone.now() - last_approved.processed_at
        remaining = 72 * 3600 - delta.total_seconds()
        if remaining > 0:
            lockout_until = (last_approved.processed_at +
                             timezone.timedelta(hours=72)).isoformat()

    return Response({
        'balance': str(profile.balance),
        'withdrawal_number': withdrawal_number,
        'lockout_until': lockout_until,
        'history': history,
    })


@api_view(['POST'])
@permission_classes([IsApprovedMechanic])
def mechanic_withdraw(request):
    profile = request.user.mechanic_profile

    try:
        amount = Decimal(str(request.data.get('amount', '0'))).quantize(Decimal('1'))
    except Exception:
        return Response({'error': 'Montant invalide.'}, status=400)

    if amount < 2000:
        return Response({'error': 'Le montant minimum de retrait est 2 000 FCFA.'}, status=400)

    # Numéro de retrait = numéro enregistré (non modifiable depuis le formulaire)
    momo_number = profile.withdrawal_number or profile.user.phone or ''
    if not momo_number:
        return Response({'error': 'Aucun numéro MoMo configuré sur votre profil.'}, status=400)

    # Vérification lockout 72h après changement de numéro
    from apps.mechanics.models import MomoNumberChangeRequest
    import math
    last_approved = (
        MomoNumberChangeRequest.objects
        .filter(mechanic=profile, status='approved')
        .order_by('-processed_at')
        .first()
    )
    if last_approved and last_approved.processed_at:
        delta = timezone.now() - last_approved.processed_at
        remaining = 72 * 3600 - delta.total_seconds()
        if remaining > 0:
            remaining_h = math.ceil(remaining / 3600)
            return Response({
                'error': f'Retrait bloqué 72h après changement de numéro. Encore {remaining_h}h à attendre.'
            }, status=400)

    fee = (amount * settings.WITHDRAWAL_FEE_RATE).quantize(Decimal('1'), rounding=ROUND_DOWN)
    net_amount = amount
    total_deducted = amount + fee

    profile.refresh_from_db(fields=['balance'])
    if total_deducted > profile.balance:
        return Response({'error': 'Solde insuffisant (montant + frais).'}, status=400)

    profile.balance -= total_deducted
    profile.save(update_fields=['balance'])

    withdrawal = WithdrawalRequest.objects.create(
        mechanic=profile,
        amount=amount,
        fee=fee,
        net_amount=net_amount,
        momo_number=momo_number,
        momo_provider=request.data.get('momo_provider', 'mtn'),
        reason=(request.data.get('reason') or '').strip(),
    )

    from apps.accounts.models import User
    for admin in User.objects.filter(role='admin'):
        send_notification(
            admin,
            title='Demande de retrait',
            message=(
                f'{profile.user.full_name} demande un retrait de '
                f'{amount} FCFA vers {momo_number} '
                f'({withdrawal.get_momo_provider_display()}).'
            ),
            notif_type='WITHDRAWAL_REQUEST',
            reference_id=str(withdrawal.id),
        )

    return Response(WithdrawalRequestSerializer(withdrawal).data, status=201)


# ─── Admin : gestion des retraits ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_withdrawal_list(request):
    status_filter = request.query_params.get('status', '')
    qs = WithdrawalRequest.objects.select_related('mechanic__user', 'processed_by')
    if status_filter:
        qs = qs.filter(status=status_filter)
    return Response(WithdrawalRequestSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_withdrawal_process(request, pk):
    try:
        withdrawal = WithdrawalRequest.objects.select_related('mechanic__user').get(pk=pk)
    except WithdrawalRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)

    if withdrawal.status != 'pending':
        return Response({'error': 'Cette demande a déjà été traitée.'}, status=400)

    action = request.data.get('action')
    if action not in ('approve', 'reject'):
        return Response({'error': "action doit être 'approve' ou 'reject'."}, status=400)

    withdrawal.processed_by = request.user
    withdrawal.processed_at = timezone.now()
    withdrawal.admin_note = (request.data.get('admin_note') or '').strip()

    if action == 'approve':
        withdrawal.status = 'approved'
        send_notification(
            withdrawal.mechanic.user,
            title='Retrait approuvé ✓',
            message=(
                f'Votre retrait de {withdrawal.net_amount} FCFA a été approuvé '
                f'et envoyé sur le {withdrawal.momo_number}.'
            ),
            notif_type='WITHDRAWAL_APPROVED',
            reference_id=str(withdrawal.id),
        )
    else:
        withdrawal.status = 'rejected'
        from django.db.models import F
        withdrawal.mechanic.balance = F('balance') + withdrawal.amount + withdrawal.fee
        withdrawal.mechanic.save(update_fields=['balance'])
        send_notification(
            withdrawal.mechanic.user,
            title='Retrait refusé',
            message=(
                f'Votre retrait de {withdrawal.amount} FCFA a été refusé. '
                f'{withdrawal.admin_note or "Contactez l\'administration."}'
            ),
            notif_type='WITHDRAWAL_REJECTED',
            reference_id=str(withdrawal.id),
        )

    withdrawal.save()
    return Response(WithdrawalRequestSerializer(withdrawal).data)
