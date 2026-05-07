# apps/core/permissions.py
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsMechanic(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'mechanic_standard', 'mechanic_premium'
        )


class IsMechanicPremium(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'mechanic_premium'


class IsAdminOrMechanic(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'admin', 'mechanic_standard', 'mechanic_premium'
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level: owner or admin only."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        owner = getattr(obj, 'user', getattr(obj, 'mechanic', None))
        return owner == request.user