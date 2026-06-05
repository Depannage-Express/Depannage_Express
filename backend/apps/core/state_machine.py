# apps/core/state_machine.py
"""
State machine centralisée pour les Interventions.
TOUTE modification de statut doit passer par transition_intervention().
"""
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError


# Graphe des transitions valides : état actuel → {action → nouvel état}
TRANSITION_GRAPH = {
    'pending_acceptance': {
        'accept': 'accepted',
        'refuse': 'refused',
    },
    'accepted': {
        'start': 'in_progress',
        'cancel': 'cancelled',
    },
    'in_progress': {
        'complete': 'completed',
        'cancel': 'cancelled',
    },
    'completed': {
        'pay': 'paid',
    },
    'ending_acceptance': {
        'pay': 'paid',
    },
    'paid': {
        'review': 'reviewed',
    },
    # États terminaux : pas de transition sortante
    'refused': {},
    'cancelled': {},
    'reviewed': {},
}

# Qui peut déclencher quelle action
ACTION_ROLES = {
    'accept':  {'mechanic'},
    'refuse':  {'mechanic'},
    'start':   {'mechanic'},
    'complete': {'mechanic'},
    'cancel':  {'admin'},
    'pay':     {'driver'},    # déclenché lors de la confirmation de paiement
    'review':  {'driver'},
}


class InvalidTransition(ValidationError):
    pass


class UnauthorizedTransition(PermissionDenied):
    pass


def get_actor_role(user) -> str:
    """
    Retourne le rôle canonique de l'acteur pour la state machine.
    Lève une exception si l'utilisateur n'est pas qualifié.
    """
    if user is None:
        return 'driver'  # conducteur anonyme
    if user.role == 'admin':
        return 'admin'
    if user.role in ('mechanic_standard', 'mechanic_premium'):
        try:
            if user.mechanic_profile.status != 'approved':
                raise UnauthorizedTransition(
                    "Votre profil mécanicien n'est pas approuvé."
                )
        except AttributeError:
            raise UnauthorizedTransition("Profil mécanicien introuvable.")
        return 'mechanic'
    raise UnauthorizedTransition("Rôle non reconnu pour cette action.")


def transition_intervention(intervention, action: str, actor_role: str, **kwargs):
    """
    Applique une transition à une Intervention.

    :param intervention: instance Intervention
    :param action: clé de transition ('accept', 'refuse', 'start', 'complete', 'pay', 'review', 'cancel')
    :param actor_role: 'mechanic' | 'driver' | 'admin'
    :param kwargs: données supplémentaires (refusal_reason, final_cost, mechanic_notes, reviewer_name, rating, comment…)
    :raises InvalidTransition: si la transition est impossible depuis l'état courant
    :raises UnauthorizedTransition: si le rôle n'est pas autorisé pour cette action
    """
    current = intervention.status
    allowed = TRANSITION_GRAPH.get(current, {})

    if action not in allowed:
        raise InvalidTransition(
            f"Action '{action}' impossible depuis l'état '{current}'. "
            f"Actions disponibles : {list(allowed.keys()) or 'aucune'}."
        )

    authorized_roles = ACTION_ROLES.get(action, set())
    if actor_role not in authorized_roles:
        raise UnauthorizedTransition(
            f"L'acteur '{actor_role}' n'est pas autorisé à effectuer l'action '{action}'."
        )

    new_status = allowed[action]
    intervention.status = new_status

    # Effets de bord selon l'action
    _apply_side_effects(intervention, action, kwargs)

    intervention.save()


def _apply_side_effects(intervention, action: str, data: dict):
    """Applique les champs métier liés à la transition."""
    now = timezone.now()

    if action == 'accept':
        intervention.accepted_at = now
        # Synchronise le BreakdownRequest
        intervention.breakdown_request.status = 'in_progress'
        intervention.breakdown_request.save(update_fields=['status'])

    elif action == 'refuse':
        intervention.refused_at = now
        intervention.refusal_reason = data.get('refusal_reason', '')

    elif action == 'start':
        intervention.started_at = now
        before_photo = data.get('before_photo')
        if before_photo:
            intervention.before_photo = before_photo

    elif action == 'complete':
        intervention.completed_at = now
        notes = data.get('mechanic_notes', '')
        if notes:
            intervention.mechanic_notes = notes
        final_cost = data.get('final_cost')
        if final_cost is not None:
            try:
                intervention.final_cost = float(final_cost)
            except (TypeError, ValueError):
                raise InvalidTransition("final_cost doit être un nombre.")
        after_photo = data.get('after_photo')
        if after_photo:
            intervention.after_photo = after_photo
        # Synchronise le BreakdownRequest
        intervention.breakdown_request.status = 'completed'
        intervention.breakdown_request.save(update_fields=['status'])
        # Incrémente les stats mécanicien
        profile = intervention.mechanic
        profile.total_interventions += 1
        profile.save(update_fields=['total_interventions'])

    elif action == 'pay':
        intervention.paid_at = now
        intervention.driver_confirmed = True
        intervention.driver_confirmed_at = now

    elif action == 'review':
        from apps.mechanics.models import MechanicReview
        rating = data.get('rating')
        if rating is None:
            raise InvalidTransition("La note est requise pour laisser un avis.")
        try:
            rating = int(rating)
            if not (1 <= rating <= 5):
                raise ValueError()
        except (TypeError, ValueError):
            raise InvalidTransition("La note doit être un entier entre 1 et 5.")

        if MechanicReview.objects.filter(intervention=intervention).exists():
            raise InvalidTransition("Un avis a déjà été soumis pour cette intervention.")

        reviewer_name = (
            data.get('reviewer_name')
            or intervention.breakdown_request.driver_name
            or 'Conducteur anonyme'
        )
        MechanicReview.objects.create(
            mechanic=intervention.mechanic,
            intervention=intervention,
            reviewer_name=reviewer_name,
            rating=rating,
            comment=data.get('comment', ''),
            is_visible=True,
        )

    elif action == 'cancel':
        if intervention.status not in ('refused', 'cancelled'):
            intervention.breakdown_request.status = 'cancelled'
            intervention.breakdown_request.save(update_fields=['status'])
