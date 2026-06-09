# apps/mechanics/serializers.py
from rest_framework import serializers
import cloudinary
from .models import MechanicProfile, Specialty, MechanicReview, MechanicAdminMessage, MomoNumberChangeRequest
from apps.accounts.serializers import UserMiniSerializer, _cloudinary_url


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
    profile_photo_url = serializers.SerializerMethodField()
    id_card_front_url = serializers.SerializerMethodField()
    id_card_back_url = serializers.SerializerMethodField()
    certification_doc_url = serializers.SerializerMethodField()

    class Meta:
        model = MechanicProfile
        fields = [
            'id', 'short_id', 'user', 'bio', 'years_experience', 'specialties', 'specialty_ids',
            'latitude', 'longitude', 'address', 'city', 'department', 'neighborhood', 'country',
            'is_available', 'available_from', 'available_to', 'works_weekends',
            'id_card_front', 'id_card_front_url',
            'id_card_back', 'id_card_back_url',
            'certification_doc', 'certification_doc_url',
            'profile_photo', 'profile_photo_url',
            'status', 'validated_at', 'rejection_reason',
            'total_interventions', 'average_rating', 'total_reviews',
            'withdrawal_number', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'status', 'validated_at', 'rejection_reason',
            'total_interventions', 'average_rating', 'total_reviews'
        ]

    def get_profile_photo_url(self, obj):
        return _cloudinary_url(obj.profile_photo, width=300, height=300, crop='fill', gravity='face')

    def get_id_card_front_url(self, obj):
        return _cloudinary_url(obj.id_card_front)

    def get_id_card_back_url(self, obj):
        return _cloudinary_url(obj.id_card_back)

    def get_certification_doc_url(self, obj):
        return _cloudinary_url(obj.certification_doc)

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


class MechanicPublicSerializer(serializers.ModelSerializer):
    """Public profile — phone hidden for non-premium contact."""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar_url = serializers.SerializerMethodField()
    is_premium = serializers.BooleanField(source='user.is_premium', read_only=True)
    specialties = SpecialtySerializer(many=True, read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = MechanicProfile
        fields = [
            'id', 'user_name', 'user_avatar_url', 'is_premium',
            'bio', 'years_experience', 'specialties',
            'city', 'department', 'neighborhood', 'country',
            'is_available', 'available_from', 'available_to', 'works_weekends',
            'profile_photo', 'profile_photo_url',
            'average_rating', 'total_reviews', 'total_interventions',
        ]

    def get_user_avatar_url(self, obj):
        return _cloudinary_url(obj.user.avatar, width=200, height=200, crop='fill', gravity='face')

    def get_profile_photo_url(self, obj):
        return _cloudinary_url(obj.profile_photo, width=300, height=300, crop='fill', gravity='face')


class MechanicValidationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['action'] == 'reject' and not attrs.get('rejection_reason'):
            raise serializers.ValidationError(
                {'rejection_reason': 'Motif requis pour un refus.'}
            )
        return attrs


class MechanicAdminMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MechanicAdminMessage
        fields = ['id', 'sender_type', 'sender_name', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']


class MomoChangeRequestSerializer(serializers.ModelSerializer):
    mechanic_name = serializers.CharField(source='mechanic.user.full_name', read_only=True)
    mechanic_id = serializers.CharField(source='mechanic.id', read_only=True)
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = MomoNumberChangeRequest
        fields = [
            'id', 'mechanic_id', 'mechanic_name', 'new_number',
            'status', 'admin_note', 'processed_by_name', 'processed_at', 'created_at',
        ]
        read_only_fields = ['id', 'mechanic_id', 'mechanic_name', 'processed_by_name', 'processed_at', 'created_at']

    def get_processed_by_name(self, obj):
        return obj.processed_by.full_name if obj.processed_by else None


class MechanicReviewSerializer(serializers.ModelSerializer):
    mechanic_name = serializers.CharField(source='mechanic.user.full_name', read_only=True)

    class Meta:
        model = MechanicReview
        fields = [
            'id', 'mechanic', 'mechanic_name', 'intervention',
            'reviewer_name', 'rating', 'comment', 'is_visible', 'created_at'
        ]
        read_only_fields = ['id', 'mechanic_name', 'is_visible', 'created_at']