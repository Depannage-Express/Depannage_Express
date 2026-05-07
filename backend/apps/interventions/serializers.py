# apps/interventions/serializers.py
from rest_framework import serializers
from .models import Intervention
from apps.breakdowns.serializers import BreakdownRequestSerializer


class InterventionSerializer(serializers.ModelSerializer):
    breakdown_request_detail = BreakdownRequestSerializer(
        source='breakdown_request', read_only=True
    )

    class Meta:
        model = Intervention
        fields = [
            'id', 'breakdown_request', 'breakdown_request_detail',
            'mechanic', 'status',
            'accepted_at', 'refused_at', 'refusal_reason',
            'started_at', 'completed_at',
            'mechanic_notes', 'estimated_cost', 'final_cost',
            'before_photo', 'after_photo',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'mechanic', 'status', 'accepted_at', 'refused_at',
            'started_at', 'completed_at'
        ]


# apps/interventions/views.py  (inline here for cohesion)