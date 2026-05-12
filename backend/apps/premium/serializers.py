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
            raise serializers.ValidationError('Numero invalide.')
        return value


class PremiumContactDetailSerializer(serializers.ModelSerializer):
    mechanic_phone = serializers.CharField(source='mechanic.user.phone', read_only=True)

    class Meta:
        model = PremiumContactRequest
        fields = [
            'id', 'mechanic', 'mechanic_phone',
            'requester_name', 'requester_phone', 'requester_reason',
            'requester_ip', 'status', 'reviewed_at',
            'contact_revealed_at', 'contact_reveal_count', 'created_at',
        ]
