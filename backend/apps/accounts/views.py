# apps/accounts/views.py
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenBlacklistView

from apps.core.permissions import IsAdmin
from apps.security.utils import log_security_event
from .models import User
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    ChangePasswordSerializer, UserMiniSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    refresh = RefreshToken.for_user(user)
    log_security_event(request, user, 'REGISTER', f'Nouveau compte : {user.email}')

    return Response({
        'success': True,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = serializer.validated_data['user']
    user.failed_login_attempts = 0
    user.last_login_ip = request.META.get('REMOTE_ADDR')
    user.save(update_fields=['failed_login_attempts', 'last_login_ip'])

    refresh = RefreshToken.for_user(user)
    log_security_event(request, user, 'LOGIN', 'Connexion réussie')

    return Response({
        'success': True,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
        log_security_event(request, request.user, 'LOGOUT', 'Déconnexion')
    except Exception:
        pass
    return Response({'success': True, 'message': 'Déconnecté avec succès.'})


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)

    serializer = UserSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    log_security_event(request, request.user, 'PASSWORD_CHANGE', 'Mot de passe modifié')
    return Response({'success': True, 'message': 'Mot de passe modifié avec succès.'})


# ─── Admin user management ────────────────────────────────────────────────────

class UserListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        is_blocked = self.request.query_params.get('is_blocked')
        if role:
            qs = qs.filter(role=role)
        if is_blocked is not None:
            qs = qs.filter(is_blocked=is_blocked == 'true')
        return qs


@api_view(['POST'])
@permission_classes([IsAdmin])
def block_user_view(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable.'}, status=404)

    reason = request.data.get('reason', '')
    user.is_blocked = True
    user.block_reason = reason
    user.save(update_fields=['is_blocked', 'block_reason'])

    log_security_event(request, request.user, 'BLOCK_USER', f'Blocage de {user.email}: {reason}')
    return Response({'success': True, 'message': f'{user.full_name} bloqué.'})


@api_view(['POST'])
@permission_classes([IsAdmin])
def unblock_user_view(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable.'}, status=404)

    user.is_blocked = False
    user.block_reason = ''
    user.save(update_fields=['is_blocked', 'block_reason'])

    log_security_event(request, request.user, 'UNBLOCK_USER', f'Déblocage de {user.email}')
    return Response({'success': True, 'message': f'{user.full_name} débloqué.'})