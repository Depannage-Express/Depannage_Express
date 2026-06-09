# apps/interventions/serializers.py
from rest_framework import serializers
from .models import Intervention
from apps.breakdowns.serializers import BreakdownRequestSerializer, BreakdownRequestPublicSerializer
from apps.accounts.serializers import _cloudinary_url


class InterventionSerializer(serializers.ModelSerializer):
    breakdown_request_detail = BreakdownRequestPublicSerializer(
        source='breakdown_request', read_only=True
    )
    before_photo_url = serializers.SerializerMethodField()
    after_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Intervention
        fields = [
            'id', 'breakdown_request', 'breakdown_request_detail',
            'mechanic', 'status',
            'accepted_at', 'refused_at', 'refusal_reason',
            'started_at', 'completed_at',
            'mechanic_notes', 'estimated_cost', 'final_cost',
            'before_photo', 'before_photo_url',
            'after_photo', 'after_photo_url',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'mechanic', 'status', 'accepted_at', 'refused_at',
            'started_at', 'completed_at'
        ]

    def get_before_photo_url(self, obj):
        return _cloudinary_url(obj.before_photo, width=800, crop='limit')

    def get_after_photo_url(self, obj):
        return _cloudinary_url(obj.after_photo, width=800, crop='limit')


class InterventionAcceptedSerializer(InterventionSerializer):
    """Expose driver_phone uniquement quand l'intervention a été acceptée."""
    breakdown_request_detail = serializers.SerializerMethodField()

    def get_breakdown_request_detail(self, obj):
        if obj.status in ['accepted', 'in_progress', 'completed', 'paid', 'reviewed']:
            return BreakdownRequestSerializer(obj.breakdown_request).data
        return BreakdownRequestPublicSerializer(obj.breakdown_request).data