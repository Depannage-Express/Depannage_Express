# apps/breakdowns/serializers.py
from rest_framework import serializers
from .models import BreakdownRequest
from apps.mechanics.serializers import MechanicPublicSerializer
from apps.accounts.serializers import _cloudinary_url


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
        extra_kwargs = {
            'driver_id_card': {'required': False},
            'driver_selfie': {'required': False},
        }

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
    driver_id_card_url = serializers.SerializerMethodField()
    driver_selfie_url = serializers.SerializerMethodField()
    vehicle_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = BreakdownRequest
        fields = [
            'id', 'driver_name', 'driver_phone',
            'driver_id_card', 'driver_id_card_url',
            'driver_selfie', 'driver_selfie_url',
            'vehicle_type', 'vehicle_brand', 'vehicle_description',
            'vehicle_photo', 'vehicle_photo_url',
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

    def get_driver_id_card_url(self, obj):
        return _cloudinary_url(obj.driver_id_card)

    def get_driver_selfie_url(self, obj):
        return _cloudinary_url(obj.driver_selfie)

    def get_vehicle_photo_url(self, obj):
        return _cloudinary_url(obj.vehicle_photo, width=600, crop='limit')


class BreakdownRequestAdminSerializer(BreakdownRequestSerializer):
    """Réservé aux vues admin (IsAdmin) — expose le téléphone du mécanicien
    assigné pour permettre à l'administration d'agir en cas de litige.
    Ne JAMAIS réutiliser côté conducteur/public : le numéro reste caché
    tant que le mécanicien n'est pas premium (cf. MechanicPublicSerializer)."""
    assigned_mechanic_phone = serializers.CharField(
        source='assigned_mechanic.user.phone', read_only=True, default=None
    )

    class Meta(BreakdownRequestSerializer.Meta):
        fields = BreakdownRequestSerializer.Meta.fields + ['assigned_mechanic_phone']


class BreakdownRequestPublicSerializer(serializers.ModelSerializer):
    """Serializer sans données sensibles du conducteur — destiné aux mécaniciens."""
    assigned_mechanic_detail = MechanicPublicSerializer(
        source='assigned_mechanic', read_only=True
    )
    vehicle_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = BreakdownRequest
        fields = [
            'id', 'driver_name',
            'vehicle_type', 'vehicle_brand', 'vehicle_description',
            'vehicle_photo', 'vehicle_photo_url',
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

    def get_vehicle_photo_url(self, obj):
        return _cloudinary_url(obj.vehicle_photo, width=600, crop='limit')
