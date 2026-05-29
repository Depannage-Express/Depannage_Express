# apps/geolocation/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import serializers as drf_serializers

from .utils import find_mechanics_nearby
from apps.mechanics.serializers import MechanicPublicSerializer


class NearbySearchSerializer(drf_serializers.Serializer):
    latitude = drf_serializers.FloatField()
    longitude = drf_serializers.FloatField()
    radius_km = drf_serializers.FloatField(default=10, min_value=1, max_value=50)
    specialty_id = drf_serializers.IntegerField(required=False)


@api_view(['POST'])
@permission_classes([AllowAny])
def mechanics_nearby_view(request):
    serializer = NearbySearchSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    results = find_mechanics_nearby(
        latitude=data['latitude'],
        longitude=data['longitude'],
        radius_km=data['radius_km'],
        specialty_id=data.get('specialty_id'),
    )

    return Response({
        'count': len(results),
        'radius_km': data['radius_km'],
        'results': [
            {
                **MechanicPublicSerializer(r['profile']).data,
                'distance_km': r['distance_km']
            }
            for r in results
        ]
    })