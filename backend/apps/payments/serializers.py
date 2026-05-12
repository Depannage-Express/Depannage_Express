from rest_framework import serializers

from .models import PaymentTransaction


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'payer_name', 'payer_phone', 'amount', 'currency',
            'payment_method', 'payment_for', 'status',
            'breakdown_request', 'intervention', 'mechanic',
            'provider_reference', 'paid_at', 'metadata',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'status', 'provider_reference', 'paid_at', 'created_at', 'updated_at'
        ]

    def validate_payer_phone(self, value):
        cleaned = ''.join(filter(str.isdigit, value.replace('+', '')))
        if len(cleaned) < 8:
            raise serializers.ValidationError('Numero de telephone invalide.')
        return value


class PaymentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = ['id', 'status', 'provider_reference', 'paid_at']
