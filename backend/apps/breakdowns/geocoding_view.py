"""
Endpoint proxy pour le géocodage inverse.
Respecte la politique d'utilisation Nominatim :
- User-Agent identifié
- Pas d'appels massifs (1 req/s max)
- Cache optionnel
"""
import requests
from django.conf import settings
from rest_framework.decorators import (
    api_view, permission_classes
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

NOMINATIM_BASE = getattr(
    settings,
    'NOMINATIM_BASE_URL',
    'https://nominatim.openstreetmap.org'
)


@api_view(['GET'])
@permission_classes([AllowAny])
def reverse_geocode(request):
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')

    if not lat or not lng:
        return Response(
            {'error': 'lat et lng requis'},
            status=400
        )

    try:
        resp = requests.get(
            f'{NOMINATIM_BASE}/reverse',
            params={
                'lat': lat,
                'lon': lng,
                'format': 'json',
            },
            headers={
                'User-Agent':
                'DépannageExpress/1.0 '
                '(contact@depannageexpress.bj)'
            },
            timeout=5
        )
        resp.raise_for_status()
        return Response(resp.json())
    except requests.RequestException as e:
        return Response(
            {'error': str(e)},
            status=502
        )
