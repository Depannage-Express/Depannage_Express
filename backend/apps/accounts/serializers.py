# apps/accounts/serializers.py
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
import cloudinary

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=True, min_length=8, max_length=20)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'role', 'password', 'password_confirm']
        extra_kwargs = {
            'role': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Les mots de passe ne correspondent pas.'})
        if attrs.get('role') == 'admin':
            raise serializers.ValidationError({'role': 'Impossible de créer un compte admin via API.'})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs['email'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError('Email ou mot de passe incorrect.')
        if not user.is_active:
            raise serializers.ValidationError('Compte désactivé.')
        if user.is_blocked:
            raise serializers.ValidationError(f'Compte bloqué. Raison : {user.block_reason}')
        if user.locked_until and user.locked_until > timezone.now():
            raise serializers.ValidationError('Compte temporairement verrouillé.')
        attrs['user'] = user
        return attrs


def _cloudinary_url(field, **opts):
    if not field:
        return None
    try:
        return cloudinary.CloudinaryImage(str(field)).build_url(
            quality='auto', fetch_format='auto', **opts
        )
    except Exception:
        return None


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    mechanic_profile_status = serializers.SerializerMethodField()
    mechanic_profile_id = serializers.SerializerMethodField()
    mechanic_short_id = serializers.SerializerMethodField()
    mechanic_profile_photo = serializers.SerializerMethodField()
    mechanic_city = serializers.SerializerMethodField()
    mechanic_department = serializers.SerializerMethodField()
    mechanic_neighborhood = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'avatar', 'avatar_url', 'is_active', 'is_blocked',
            'mechanic_profile_status', 'mechanic_profile_id', 'mechanic_short_id',
            'mechanic_profile_photo', 'mechanic_city', 'mechanic_department',
            'mechanic_neighborhood', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'role', 'is_blocked', 'created_at', 'updated_at']

    def get_avatar_url(self, obj):
        return _cloudinary_url(obj.avatar, width=200, height=200, crop='fill', gravity='face')

    def get_mechanic_profile_status(self, obj):
        if obj.role in ('mechanic_standard', 'mechanic_premium'):
            try:
                return obj.mechanic_profile.status
            except Exception:
                return None
        return None

    def get_mechanic_profile_id(self, obj):
        if obj.role in ('mechanic_standard', 'mechanic_premium'):
            try:
                return str(obj.mechanic_profile.pk)
            except Exception:
                return None
        return None

    def get_mechanic_short_id(self, obj):
        if obj.role in ('mechanic_standard', 'mechanic_premium'):
            try:
                return obj.mechanic_profile.short_id
            except Exception:
                return None
        return None

    def get_mechanic_profile_photo(self, obj):
        if obj.role in ('mechanic_standard', 'mechanic_premium'):
            try:
                return _cloudinary_url(
                    obj.mechanic_profile.profile_photo,
                    width=300, height=300, crop='fill', gravity='face',
                )
            except Exception:
                pass
        return None

    def get_mechanic_city(self, obj):
        if obj.role in ('mechanic_standard', 'mechanic_premium'):
            try:
                return obj.mechanic_profile.city or None
            except Exception:
                return None
        return None

    def get_mechanic_department(self, obj):
        if obj.role in ('mechanic_standard', 'mechanic_premium'):
            try:
                return obj.mechanic_profile.department or None
            except Exception:
                return None
        return None

    def get_mechanic_neighborhood(self, obj):
        if obj.role in ('mechanic_standard', 'mechanic_premium'):
            try:
                return obj.mechanic_profile.neighborhood or None
            except Exception:
                return None
        return None


class UserMiniSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'role', 'avatar', 'avatar_url']

    def get_avatar_url(self, obj):
        return _cloudinary_url(obj.avatar, width=200, height=200, crop='fill', gravity='face')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Mot de passe actuel incorrect.')
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class TokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()