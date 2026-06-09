from rest_framework import serializers
from .models import Incident


class IncidentSerializer(serializers.ModelSerializer):
    incident_type_display = serializers.CharField(
        source='get_incident_type_display', read_only=True
    )
    gravity_display = serializers.CharField(
        source='get_gravity_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    emitter_type_display = serializers.CharField(
        source='get_emitter_type_display', read_only=True
    )

    class Meta:
        model = Incident
        fields = '__all__'


class IncidentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = [
            'intervention',
            'emitter_type',
            'emitter_name',
            'target_name',
            'incident_type',
            'gravity',
            'description',
        ]
