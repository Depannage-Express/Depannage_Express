from rest_framework import serializers

from .models import PaymentTransaction, WithdrawalRequest


class PaymentTransactionSerializer(serializers.ModelSerializer):
    mechanic_name = serializers.SerializerMethodField()

    def get_mechanic_name(self, obj):
        if obj.mechanic and obj.mechanic.user:
            return obj.mechanic.user.full_name
        return None

    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'payer_name', 'payer_phone', 'amount', 'currency',
            'payment_method', 'payment_for', 'status', 'mechanic_name',
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


class PaymentAdminSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()
    breakdown_type = serializers.SerializerMethodField()
    mechanic_name = serializers.SerializerMethodField()

    def get_driver_name(self, obj):
        if obj.breakdown_request:
            return obj.breakdown_request.driver_name
        return obj.payer_name

    def get_breakdown_type(self, obj):
        if obj.breakdown_request:
            return obj.breakdown_request.breakdown_type
        return None

    def get_mechanic_name(self, obj):
        if obj.mechanic and obj.mechanic.user:
            return obj.mechanic.user.full_name
        return None

    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'amount', 'status', 'provider_reference', 'payment_for',
            'driver_name', 'breakdown_type', 'mechanic_name',
            'payer_name', 'created_at', 'paid_at',
        ]


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    mechanic_name = serializers.SerializerMethodField()
    processed_by_name = serializers.SerializerMethodField()

    def get_mechanic_name(self, obj):
        return obj.mechanic.user.full_name if obj.mechanic and obj.mechanic.user else None

    def get_processed_by_name(self, obj):
        return obj.processed_by.full_name if obj.processed_by else None

    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'mechanic', 'mechanic_name',
            'amount', 'fee', 'net_amount',
            'momo_number', 'momo_provider', 'reason',
            'status', 'admin_note',
            'processed_by', 'processed_by_name', 'processed_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'fee', 'net_amount', 'status',
            'processed_by', 'processed_at', 'created_at', 'updated_at',
        ]
