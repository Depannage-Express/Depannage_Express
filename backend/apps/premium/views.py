from django.conf import settings
from django.utils import timezone
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.core.permissions import IsAdmin
from apps.notifications.utils import send_notification
from apps.security.utils import log_security_event
from .models import PremiumContactRequest
from .serializers import PremiumContactRequestSerializer, PremiumContactDetailSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def request_premium_contact(request):
    """
    Demande securisee de contact avec un mecanicien premium.
    Le numero n'est revele qu'apres validation.
    """
    ip = request.META.get('REMOTE_ADDR')
    max_per_day = getattr(settings, 'PREMIUM_CONTACT_MAX_ATTEMPTS_PER_DAY', 5)
    today_count = PremiumContactRequest.objects.filter(
        requester_ip=ip,
        created_at__date=timezone.now().date(),
    ).count()

    if today_count >= max_per_day:
        return Response(
            {'error': f'Limite de {max_per_day} demandes par jour atteinte.'},
            status=429,
        )

    serializer = PremiumContactRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    contact_request = serializer.save(
        requester_ip=ip,
        requester_user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        requester_account=request.user if request.user.is_authenticated else None,
    )

    log_security_event(
        request,
        None,
        'PREMIUM_CONTACT_REQUEST',
        f'Demande premium creee pour le mecanicien {contact_request.mechanic_id}',
    )

    from apps.accounts.models import User

    admins = User.objects.filter(role='admin', is_active=True)
    for admin in admins:
        send_notification(
            admin,
            title='Nouvelle demande premium',
            message=(
                f'{contact_request.requester_name} souhaite contacter '
                f'{contact_request.mechanic.user.full_name}.'
            ),
            notif_type='PREMIUM_CONTACT_PENDING',
            reference_id=str(contact_request.id),
        )

    return Response(
        {
            'success': True,
            'message': 'Demande enregistree. Validation administrative en attente.',
            'request_id': str(contact_request.id),
        },
        status=201,
    )


@api_view(['POST'])
@permission_classes([IsAdmin])
def approve_contact_request(request, pk):
    try:
        contact_request = PremiumContactRequest.objects.get(pk=pk)
    except PremiumContactRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)

    contact_request.status = 'approved'
    contact_request.reviewed_at = timezone.now()
    contact_request.save(update_fields=['status', 'reviewed_at'])

    log_security_event(request, request.user, 'PREMIUM_CONTACT_APPROVED', f'Demande {pk} approuvee')
    return Response({'success': True, 'status': contact_request.status})


@api_view(['POST'])
@permission_classes([IsAdmin])
def reject_contact_request(request, pk):
    try:
        contact_request = PremiumContactRequest.objects.get(pk=pk)
    except PremiumContactRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)

    contact_request.status = 'rejected'
    contact_request.reviewed_at = timezone.now()
    contact_request.save(update_fields=['status', 'reviewed_at'])

    log_security_event(request, request.user, 'PREMIUM_CONTACT_REJECTED', f'Demande {pk} rejetee')
    return Response({'success': True, 'status': contact_request.status})


@api_view(['GET'])
@permission_classes([AllowAny])
def reveal_mechanic_contact(request, pk):
    try:
        contact_request = PremiumContactRequest.objects.select_related('mechanic__user').get(pk=pk)
    except PremiumContactRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)

    if contact_request.status != 'approved':
        return Response({'error': 'Acces non autorise.'}, status=403)

    contact_request.contact_revealed_at = timezone.now()
    contact_request.contact_reveal_count += 1
    contact_request.save(update_fields=['contact_revealed_at', 'contact_reveal_count'])

    log_security_event(
        request,
        None,
        'PREMIUM_CONTACT_REVEALED',
        f'Numero du mecanicien {contact_request.mechanic_id} revele',
    )

    return Response(
        {
            'mechanic_name': contact_request.mechanic.user.full_name,
            'mechanic_phone': contact_request.mechanic.user.phone,
        }
    )


class ContactRequestAdminListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = PremiumContactDetailSerializer

    def get_queryset(self):
        queryset = PremiumContactRequest.objects.select_related('mechanic__user').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset
