import logging

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from apps.breakdowns.models import BreakdownRequest
from .models import DriverOTP

logger = logging.getLogger(__name__)


class OTPRequestThrottle(AnonRateThrottle):
    rate = '10/hour'
    scope = 'otp_request'


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([OTPRequestThrottle])
def request_otp(request):
    phone = (request.data.get('phone') or '').strip()
    if not phone:
        return Response({'error': 'Le numéro de téléphone est obligatoire.'}, status=400)

    if not BreakdownRequest.objects.filter(driver_phone=phone).exists():
        return Response(
            {'error': 'Aucune demande trouvée pour ce numéro de téléphone.'},
            status=404,
        )

    otp = DriverOTP.create_for_phone(phone)
    _send_otp_sms(phone, otp.code)

    response_data = {'message': f'Code OTP envoyé au {phone}.'}

    # En DEBUG ou avec OTP_SHOW_CODE=True : renvoie le code dans la réponse (démo / dev)
    if settings.DEBUG or getattr(settings, 'OTP_SHOW_CODE', False):
        response_data['otp_code'] = otp.code

    return Response(response_data, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    phone = (request.data.get('phone') or '').strip()
    code = (request.data.get('code') or '').strip()

    if not phone or not code:
        return Response(
            {'error': 'Le numéro de téléphone et le code sont obligatoires.'},
            status=400,
        )

    otp = DriverOTP.objects.filter(phone=phone, is_used=False).order_by('-created_at').first()

    if not otp or not otp.is_valid():
        return Response(
            {'error': 'Code OTP expiré ou invalide. Demandez un nouveau code.'},
            status=400,
        )

    otp.attempts += 1

    if otp.code != code:
        if otp.attempts >= 3:
            otp.is_used = True
            otp.save(update_fields=['is_used', 'attempts'])
            return Response(
                {'error': 'Code invalide. Trop de tentatives — demandez un nouveau code.'},
                status=400,
            )
        otp.save(update_fields=['attempts'])
        remaining = 3 - otp.attempts
        return Response(
            {'error': f'Code incorrect. {remaining} tentative(s) restante(s).'},
            status=400,
        )

    otp.is_used = True
    otp.save(update_fields=['is_used', 'attempts'])

    return Response(_get_driver_history(phone), status=200)


def _get_driver_history(phone):
    breakdowns = (
        BreakdownRequest.objects
        .filter(driver_phone=phone)
        .select_related('intervention__mechanic__user', 'specialty_requested')
        .order_by('-created_at')
    )

    driver_name = breakdowns[0].driver_name if breakdowns else ''

    history = []
    for bd in breakdowns:
        entry = {
            'id': str(bd.id),
            'date': bd.created_at.isoformat(),
            'breakdown_type': bd.breakdown_type or bd.breakdown_description[:60],
            'vehicle_description': bd.vehicle_description,
            'address_description': bd.address_description,
            'status': bd.status,
            'intervention': None,
        }

        try:
            iv = bd.intervention
            mechanic_name = ''
            if iv.mechanic and iv.mechanic.user:
                u = iv.mechanic.user
                mechanic_name = f"{u.first_name} {u.last_name}".strip()

            entry['intervention'] = {
                'id': str(iv.id),
                'status': iv.status,
                'final_cost': str(iv.final_cost) if iv.final_cost else None,
                'estimated_cost': str(iv.estimated_cost) if iv.estimated_cost else None,
                'mechanic_name': mechanic_name,
                'completed_at': iv.completed_at.isoformat() if iv.completed_at else None,
            }
        except Exception:
            pass

        history.append(entry)

    return {
        'driver_name': driver_name,
        'driver_phone': phone,
        'count': len(history),
        'history': history,
    }


def _send_otp_sms(phone, code):
    backend = getattr(settings, 'SMS_BACKEND', 'console')
    if backend == 'twilio':
        _send_via_twilio(phone, code)
    else:
        logger.info("OTP [CONSOLE] phone=%s code=%s", phone, code)


def _send_via_twilio(phone, code):
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=f"Votre code DépannageExpress est : {code}. Valide 10 minutes.",
            from_=settings.TWILIO_FROM_NUMBER,
            to=phone,
        )
    except Exception as exc:
        logger.error("Twilio SMS échoué pour %s : %s", phone, exc)
        raise
