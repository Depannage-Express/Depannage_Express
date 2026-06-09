# apps/core/state_machine.py
"""
State machine centralisée pour les Interventions.
TOUTE modification de statut doit passer par transition_intervention().
"""
import logging

from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

logger = logging.getLogger(__name__)


# Graphe des transitions valides : état actuel → {action → nouvel état}
TRANSITION_GRAPH = {
    'pending_acceptance': {
        'accept': 'accepted',
        'refuse': 'refused',
    },
    'accepted': {
        'start': 'in_progress',
        'complete': 'completed',
        'cancel': 'cancelled',
    },
    'in_progress': {
        'complete': 'completed',
        'cancel': 'cancelled',
    },
    'completed': {
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
    'pay':     {'driver'},
    'review':  {'driver'},
}


class InvalidTransition(ValidationError):
    pass


class UnauthorizedTransition(PermissionDenied):
    pass


def get_actor_role(user) -> str:
    if user is None:
        return 'driver'
    if user.role == 'admin':
        return 'admin'
    if user.role in ('mechanic_standard', 'mechanic_premium'):
        try:
            if user.mechanic_profile.status != 'approved':
                raise UnauthorizedTransition("Votre profil mécanicien n'est pas approuvé.")
        except AttributeError:
            raise UnauthorizedTransition("Profil mécanicien introuvable.")
        return 'mechanic'
    raise UnauthorizedTransition("Rôle non reconnu pour cette action.")


def transition_intervention(intervention, action: str, actor_role: str, **kwargs):
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

    _apply_side_effects(intervention, action, kwargs)

    intervention.save()


def _apply_side_effects(intervention, action: str, data: dict):
    """Applique les champs métier liés à la transition."""
    now = timezone.now()

    if action == 'accept':
        intervention.accepted_at = now
        br = intervention.breakdown_request

        # Mode broadcast : annuler les autres interventions en attente pour ce dépannage
        from apps.interventions.models import Intervention
        Intervention.objects.filter(
            breakdown_request=br,
            status='pending_acceptance',
        ).exclude(pk=intervention.pk).update(status='cancelled')

        br.status = 'in_progress'
        br.assigned_mechanic = intervention.mechanic
        br.save(update_fields=['status', 'assigned_mechanic'])

    elif action == 'refuse':
        intervention.refused_at = now
        intervention.refusal_reason = data.get('refusal_reason', '')

        br = intervention.breakdown_request
        refused_ids = list(br.refused_mechanic_ids or [])
        refused_ids.append(intervention.mechanic_id)
        br.refused_mechanic_ids = refused_ids
        br.refusal_count = (br.refusal_count or 0) + 1
        br.assigned_mechanic = None
        br.assigned_at = None
        br.assignment_distance_km = None
        br.status = 'pending'
        br.phase_started_at = now
        br.save(update_fields=[
            'refused_mechanic_ids', 'refusal_count',
            'assigned_mechanic', 'assigned_at', 'assignment_distance_km', 'status',
            'phase_started_at',
        ])

        try:
            _reassign_after_refusal(br)
        except Exception:
            logger.exception("_reassign_after_refusal a échoué pour breakdown_request=%s", br.pk)

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
        intervention.breakdown_request.status = 'completed'
        intervention.breakdown_request.save(update_fields=['status'])
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


def _reassign_after_refusal(breakdown_request):
    """
    Ré-assigne une demande après refus.
    Cercles : 10 km → 20 km → 50 km (premium priorité dans chaque cercle).
    Fallback : broadcast à TOUS les mécaniciens disponibles (commune/ville),
    le premier à accepter gagne, les autres sont annulés.
    """
    from apps.geolocation.utils import find_mechanic_at_radius, find_all_available_for_broadcast, haversine_distance
    from apps.interventions.models import Intervention
    from apps.notifications.utils import send_notification

    if breakdown_request.latitude is None or breakdown_request.longitude is None:
        logger.error(
            "Réassignation impossible : latitude/longitude manquante pour breakdown_request=%s",
            breakdown_request.pk,
        )
        return

    lat = float(breakdown_request.latitude)
    lon = float(breakdown_request.longitude)
    specialty_id = breakdown_request.specialty_requested_id
    excluded = list(breakdown_request.refused_mechanic_ids or [])

    for radius in list(settings.SEARCH_RADII_KM.values()):
        mechanic, distance = find_mechanic_at_radius(lat, lon, radius, specialty_id, excluded)
        if mechanic:
            breakdown_request.assigned_mechanic = mechanic
            breakdown_request.assignment_distance_km = distance
            breakdown_request.assigned_at = timezone.now()
            breakdown_request.status = 'assigned'
            breakdown_request.save(update_fields=[
                'assigned_mechanic', 'assignment_distance_km', 'assigned_at', 'status',
            ])
            Intervention.objects.create(
                breakdown_request=breakdown_request,
                mechanic=mechanic,
                status='pending_acceptance',
            )
            send_notification(
                mechanic.user,
                title='Nouvelle demande de dépannage',
                message=f'Demande de {breakdown_request.driver_name} à {distance} km de vous.',
                notif_type='NEW_BREAKDOWN',
                reference_id=str(breakdown_request.id),
            )
            return

    # Broadcast commune/ville : tous les mécaniciens disponibles
    all_mechs = find_all_available_for_broadcast(specialty_id=specialty_id, exclude_ids=excluded)
    if not all_mechs:
        return

    first = all_mechs[0]
    first_dist = None
    if first.latitude and first.longitude:
        first_dist = round(haversine_distance(lat, lon, float(first.latitude), float(first.longitude)), 2)

    breakdown_request.assigned_mechanic = first
    breakdown_request.assignment_distance_km = first_dist
    breakdown_request.assigned_at = timezone.now()
    breakdown_request.status = 'assigned'
    breakdown_request.save(update_fields=[
        'assigned_mechanic', 'assignment_distance_km', 'assigned_at', 'status',
    ])

    for mech in all_mechs:
        mech_dist = None
        if mech.latitude and mech.longitude:
            mech_dist = round(haversine_distance(lat, lon, float(mech.latitude), float(mech.longitude)), 2)
        Intervention.objects.create(
            breakdown_request=breakdown_request,
            mechanic=mech,
            status='pending_acceptance',
        )
        dist_msg = f'à {mech_dist} km de vous. ' if mech_dist else ''
        send_notification(
            mech.user,
            title='Dépannage urgent — Répondez vite !',
            message=f'Demande de {breakdown_request.driver_name} {dist_msg}Le premier à accepter intervient.',
            notif_type='NEW_BREAKDOWN',
            reference_id=str(breakdown_request.id),
        )
