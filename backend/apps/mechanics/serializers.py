# apps/mechanics/serializers.py
from rest_framework import serializers
from .models import MechanicProfile, Specialty, MechanicReview
from apps.accounts.serializers import UserMiniSerializer


class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ['id', 'name', 'description', 'icon']


class MechanicProfileSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    specialties = SpecialtySerializer(many=True, read_only=True)
    specialty_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Specialty.objects.all(),
        source='specialties', write_only=True, required=False
    )

    class Meta:
        model = MechanicProfile
        fields = [
            'id', 'user', 'bio', 'years_experience', 'specialties', 'specialty_ids',
            'latitude', 'longitude', 'address', 'city', 'country',
            'is_available', 'available_from', 'available_to', 'works_weekends',
            'id_card_front', 'id_card_back', 'certification_doc', 'profile_photo',
            'status', 'validated_at', 'rejection_reason',
            'total_interventions', 'average_rating', 'total_reviews',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'status', 'validated_at', 'rejection_reason',
            'total_interventions', 'average_rating', 'total_reviews'
        ]


class MechanicPublicSerializer(serializers.ModelSerializer):
    """Public profile — phone hidden for non-premium contact."""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    is_premium = serializers.BooleanField(source='user.is_premium', read_only=True)
    specialties = SpecialtySerializer(many=True, read_only=True)

    class Meta:
        model = MechanicProfile
        fields = [
            'id', 'user_name', 'user_avatar', 'is_premium',
            'bio', 'years_experience', 'specialties',
            'city', 'country',
            'is_available', 'available_from', 'available_to', 'works_weekends',
            'profile_photo', 'average_rating', 'total_reviews', 'total_interventions',
        ]


class MechanicValidationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['action'] == 'reject' and not attrs.get('rejection_reason'):
            raise serializers.ValidationError(
                {'rejection_reason': 'Motif requis pour un refus.'}
            )
        return attrs


class MechanicReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = MechanicReview
        fields = [
            'id', 'mechanic', 'reviewer_name', 'rating',
            'comment', 'is_visible', 'created_at'
        ]
        read_only_fields = ['id', 'is_visible', 'created_at']