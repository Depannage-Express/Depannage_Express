# apps/breakdowns/serializers.py
from rest_framework import serializers
from .models import BreakdownRequest
from apps.mechanics.serializers import MechanicPublicSerializer


class BreakdownRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreakdownRequest
        fields = [
            'driver_name', 'driver_phone', 'driver_id_card', 'driver_selfie',
            'vehicle_description', 'vehicle_photo', 'breakdown_description',
            'breakdown_type',
            'specialty_requested',
            'latitude', 'longitude', 'address_description',
        ]

    def validate_driver_phone(self, value):
        # Basic phone sanitization
        cleaned = ''.join(filter(str.isdigit, value.replace('+', '')))
        if len(cleaned) < 8:
            raise serializers.ValidationError('Numéro de téléphone invalide.')
        return value


class BreakdownRequestSerializer(serializers.ModelSerializer):
    assigned_mechanic_detail = MechanicPublicSerializer(
        source='assigned_mechanic', read_only=True
    )

    class Meta:
        model = BreakdownRequest
        fields = [
            'id', 'driver_name', 'driver_phone',
            'driver_id_card', 'driver_selfie',
            'vehicle_description', 'vehicle_photo',
            'breakdown_description', 'breakdown_type', 'specialty_requested',
            'latitude', 'longitude', 'address_description',
            'assigned_mechanic', 'assigned_mechanic_detail',
            'assignment_distance_km', 'assigned_at',
            'status', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'assigned_mechanic', 'assignment_distance_km',
            'assigned_at', 'status'
        ]
