# apps/core/permissions.py
"""
RBAC centralisé — source unique de vérité pour tous les contrôles d'accès.

Hiérarchie des rôles :
  admin  >  mechanic (approved)  >  driver (anonyme avec token)

Règles d'or :
- Tout endpoint non public doit utiliser au moins IsAuthenticated
- Les mécaniciens doivent être approved pour agir sur les interventions
- Les conducteurs anonymes s'authentifient via driver_token + breakdown_id
"""
from rest_framework.permissions import BasePermission

from apps.breakdowns.models import BreakdownRequest


# ─── Rôles authentifiés ───────────────────────────────────────────────────────

class IsAdmin(BasePermission):
    """Admin Django (role='admin')."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and not request.user.is_blocked
            and request.user.role == 'admin'
        )


class IsMechanic(BasePermission):
    """Mécanicien authentifié (standard ou premium), sans condition de statut profil."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and not request.user.is_blocked
            and request.user.role in ('mechanic_standard', 'mechanic_premium')
        )


class IsApprovedMechanic(BasePermission):
    """
    Mécanicien dont le profil a été APPROUVÉ par l'admin.
    À utiliser pour toute action opérationnelle (accepter, démarrer, terminer).
    """
    message = "Votre profil mécanicien doit être approuvé pour effectuer cette action."

    def has_permission(self, request, view):
        if not (
            request.user.is_authenticated
            and not request.user.is_blocked
            and request.user.role in ('mechanic_standard', 'mechanic_premium')
        ):
            return False
        try:
            return request.user.mechanic_profile.status == 'approved'
        except Exception:
            return False


class IsMechanicPremium(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and not request.user.is_blocked
            and request.user.role == 'mechanic_premium'
        )


class IsAdminOrMechanic(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and not request.user.is_blocked
            and request.user.role in ('admin', 'mechanic_standard', 'mechanic_premium')
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level: propriétaire ou admin uniquement."""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        owner = getattr(obj, 'user', getattr(obj, 'mechanic', None))
        return owner == request.user


# ─── Conducteurs anonymes ─────────────────────────────────────────────────────

class IsValidDriverToken(BasePermission):
    """
    Vérifie que la requête contient un driver_token valide associé
    au breakdown_request_id fourni.

    Paramètres attendus (dans request.data OU request.query_params) :
      - driver_token   : UUID du conducteur
      - breakdown_id   : UUID de la demande de dépannage

    En cas de succès, attache request.driver_breakdown à la requête.
    """
    message = "Token conducteur invalide ou demande de dépannage introuvable."

    def has_permission(self, request, view):
        token = (
            request.data.get('driver_token')
            or request.query_params.get('driver_token')
        )
        breakdown_id = (
            request.data.get('breakdown_id')
            or request.query_params.get('breakdown_id')
            or view.kwargs.get('pk')  # certains endpoints utilisent pk = breakdown_id
        )

        if not token or not breakdown_id:
            return False

        try:
            breakdown = BreakdownRequest.objects.get(
                pk=breakdown_id,
                driver_token=token,
            )
        except (BreakdownRequest.DoesNotExist, Exception):
            return False

        # Attacher la demande à la requête pour éviter une 2e requête DB
        request.driver_breakdown = breakdown
        return True


class IsValidDriverTokenForIntervention(BasePermission):
    """
    Vérifie que la requête contient un driver_token valide pour
    l'Intervention identifiée par pk dans l'URL.

    En cas de succès, attache request.driver_breakdown à la requête.
    """
    message = "Token conducteur invalide pour cette intervention."

    def has_permission(self, request, view):
        from apps.interventions.models import Intervention

        token = (
            request.data.get('driver_token')
            or request.query_params.get('driver_token')
        )
        intervention_pk = view.kwargs.get('pk')

        if not token or not intervention_pk:
            return False

        try:
            intervention = Intervention.objects.select_related(
                'breakdown_request'
            ).get(pk=intervention_pk)
            breakdown = intervention.breakdown_request
            if str(breakdown.driver_token) != str(token):
                return False
        except Exception:
            return False

        request.driver_breakdown = breakdown
        request.driver_intervention = intervention
        return True
