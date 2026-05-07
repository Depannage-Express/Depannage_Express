# apps/premium/serializers.py
from rest_framework import serializers
from .models import PremiumContactRequest


class PremiumContactRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PremiumContactRequest
        fields = [
            'id', 'mechanic', 'requester_name', 'requester_phone',
            'requester_reason', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def validate_requester_phone(self, value):
        cleaned = ''.join(filter(str.isdigit, value.replace('+', '')))
        if len(cleaned) < 8:
            raise serializers.ValidationError('Numéro invalide.')
        return value


class PremiumContactDetailSerializer(serializers.ModelSerializer):
    """Version admin avec numéro de téléphone visible."""
    mechanic_phone = serializers.CharField(source='mechanic.user.phone', read_only=True)

    class Meta:
        model = PremiumContactRequest
        fields = [
            'id', 'mechanic', 'mechanic_phone',
            'requester_name', 'requester_phone', 'requester_reason',
            'requester_ip', 'status', 'reviewed_at',
            'contact_revealed_at', 'contact_reveal_count', 'created_at',
        ]


# apps/premium/views.py
from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import generics

from apps.core.permissions import IsAdmin
from apps.security.utils import log_security_event, check_rate_limit
from apps.notifications.utils import send_notification
from .models import PremiumContactRequest
from .serializers import PremiumContactRequestSerializer, PremiumContactDetailSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def request_premium_contact(request):
    """
    Formulaire sécurisé pour contacter un mécanicien premium.
    Le numéro n'est jamais retourné ici.
    """
    ip = request.META.get('REMOTE_ADDR')

    # Rate limiting: max 5 demandes par IP par jour
    max_per_day = getattr(settings, 'PREMIUM_CONTACT_MAX_ATTEMPTS_PER_DAY', 5)
    today_count = PremiumContactRequest.objects.filter(
        requester_ip=ip,
        created_at__date=timezone.now().date()
    ).count()

    if today_count >= max_per_day:
        return Response(
            {'error': f'Limite de {max_per_day} demandes par jour atteinte.'},
            status=429
        )

    serializer = PremiumContactRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    instance = serializer.save(
        requester_ip=ip,
        requester_user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        requester_account=request.user if request.user.is_authenticated else None,
    )

    log_security_event(
        request, None,
        'PREMIUM_CONTACT_REQUEST',
        f'Demande contact premium mécanicien {instance.mechanic_id} par {instance.requester_name}'
    )

    # Notify admin
    from apps.accounts.models import User
    admins = User.objects.filter(role='admin', is_active=True)
    for admin in admins:
        send_notification(
            admin,
            title='Nouvelle demande contact premium',
            message=f'{instance.requester_name} demande à contacter {instance.mechanic.user.full_name}.',
            notif_type='PREMIUM_CONTACT_PENDING',
            reference_id=str(instance.id),
        )

    return Response({
        'success': True,
        'message': 'Votre demande a été soumise. L\'admin va valider votre accès.',
        'request_id': str(instance.id),
    }, status=201)


@api_view(['POST'])
@permission_classes([IsAdmin])
def approve_contact_request(request, pk):
    try:
        contact_req = PremiumContactRequest.objects.get(pk=pk)
    except PremiumContactRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)

    contact_req.status = 'approved'
    contact_req.reviewed_at = timezone.now()
    contact_req.save(update_fields=['status', 'reviewed_at'])

    log_security_event(
        request, request.user,
        'PREMIUM_CONTACT_APPROVED',
        f'Demande contact premium {pk} approuvée'
    )

    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAdmin])
def reject_contact_request(request, pk):
    try:
        contact_req = PremiumContactRequest.objects.get(pk=pk)
    except PremiumContactRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)

    contact_req.status = 'rejected'
    contact_req.reviewed_at = timezone.now()
    contact_req.save(update_fields=['status', 'reviewed_at'])

    return Response({'success': True})


@api_view(['GET'])
@permission_classes([AllowAny])
def reveal_mechanic_contact(request, pk):
    """
    Retourne le numéro seulement si la demande est approuvée.
    Trace chaque révélation.
    """
    try:
        contact_req = PremiumContactRequest.objects.select_related('mechanic__user').get(pk=pk)
    except PremiumContactRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=404)

    if contact_req.status != 'approved':
        return Response({'error': 'Accès non autorisé.'}, status=403)

    contact_req.contact_revealed_at = timezone.now()
    contact_req.contact_reveal_count += 1
    contact_req.save(update_fields=['contact_revealed_at', 'contact_reveal_count'])

    log_security_event(
        request, None,
        'PREMIUM_CONTACT_REVEALED',
        f'Numéro mécanicien {contact_req.mechanic_id} révélé à {contact_req.requester_name}'
    )

    return Response({
        'mechanic_name': contact_req.mechanic.user.full_name,
        'mechanic_phone': contact_req.mechanic.user.phone,
    })


class ContactRequestAdminListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = PremiumContactDetailSerializer

    def get_queryset(self):
        qs = PremiumContactRequest.objects.select_related(
            'mechanic__user'
        ).order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs