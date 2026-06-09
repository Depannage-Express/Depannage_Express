# apps/breakdowns/serializers.py
from rest_framework import serializers
from .models import BreakdownRequest
from apps.mechanics.serializers import MechanicPublicSerializer


class BreakdownRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreakdownRequest
        fields = [
            'driver_name', 'driver_phone', 'driver_id_card', 'driver_selfie',
            'vehicle_type', 'vehicle_brand', 'vehicle_description', 'vehicle_photo',
            'breakdown_description', 'breakdown_type',
            'specialty_requested',
            'latitude', 'longitude', 'address_description',
        ]

    def validate_driver_phone(self, value):
        # Basic phone sanitization
        cleaned = ''.join(filter(str.isdigit, value.replace('+', '')))
        if len(cleaned) < 8:
            raise serializers.ValidationError('Numéro de téléphone invalide.')
        return value

    def validate_latitude(self, value):
        if value is not None and not (-90 <= value <= 90):
            raise serializers.ValidationError(
                "La latitude doit être comprise entre -90 et 90."
            )
        return value

    def validate_longitude(self, value):
        if value is not None and not (-180 <= value <= 180):
            raise serializers.ValidationError(
                "La longitude doit être comprise entre -180 et 180."
            )
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
            'vehicle_type', 'vehicle_brand', 'vehicle_description', 'vehicle_photo',
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


class BreakdownRequestPublicSerializer(serializers.ModelSerializer):
    """Serializer sans données sensibles du conducteur — destiné aux mécaniciens."""
    assigned_mechanic_detail = MechanicPublicSerializer(
        source='assigned_mechanic', read_only=True
    )

    class Meta:
        model = BreakdownRequest
        fields = [
            'id', 'driver_name',
            'vehicle_type', 'vehicle_brand', 'vehicle_description', 'vehicle_photo',
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
