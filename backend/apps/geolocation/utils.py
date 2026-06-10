# apps/geolocation/utils.py
import math
from typing import Optional
from django.conf import settings
from django.utils import timezone


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _build_qs(latitude, longitude, radius_km, specialty_id, exclude_ids, premium_only=False, avoid_mechanic_ids=None):
    from apps.mechanics.models import MechanicProfile

    qs = MechanicProfile.objects.filter(
        status='approved',
        is_available=True,
        latitude__isnull=False,
        longitude__isnull=False,
    ).select_related('user')

    if specialty_id:
        qs = qs.filter(specialties__id=specialty_id)
    if exclude_ids:
        qs = qs.exclude(pk__in=exclude_ids)
    if avoid_mechanic_ids:
        qs = qs.exclude(pk__in=avoid_mechanic_ids)
    if premium_only:
        qs = qs.filter(user__role='mechanic_premium')

    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * math.cos(math.radians(latitude)))
    qs = qs.filter(
        latitude__range=(latitude - lat_delta, latitude + lat_delta),
        longitude__range=(longitude - lon_delta, longitude + lon_delta),
    )

    candidates = []
    for profile in qs:
        dist = haversine_distance(latitude, longitude, float(profile.latitude), float(profile.longitude))
        if dist <= radius_km:
            candidates.append((dist, profile))

    if premium_only:
        candidates.sort(key=lambda x: x[0])
    else:
        candidates.sort(key=lambda x: (0 if x[1].user.is_premium else 1, x[0]))
    return candidates


def _same_day_zone_premium_mechanic_ids(latitude, longitude, zone_radius_km):
    from apps.breakdowns.models import BreakdownRequest

    today = timezone.localtime().date()
    lat_delta = zone_radius_km / 111.0
    lon_delta = zone_radius_km / (111.0 * math.cos(math.radians(latitude)))

    return list(
        BreakdownRequest.objects.filter(
            created_at__date=today,
            assigned_mechanic__isnull=False,
            assigned_mechanic__user__role='mechanic_premium',
            latitude__range=(latitude - lat_delta, latitude + lat_delta),
            longitude__range=(longitude - lon_delta, longitude + lon_delta),
        ).values_list('assigned_mechanic_id', flat=True).distinct()
    )


def _any_available_mechanic(specialty_id, exclude_ids):
    """Fallback sans contrainte de distance : n'importe quel mécanicien approuvé disponible."""
    from apps.mechanics.models import MechanicProfile
    from django.db.models import Case, When, Value, IntegerField
    qs = MechanicProfile.objects.filter(
        status='approved',
        is_available=True,
    ).select_related('user')
    if specialty_id:
        qs = qs.filter(specialties__id=specialty_id)
    if exclude_ids:
        qs = qs.exclude(pk__in=exclude_ids)
    # Premium en premier (user__role='mechanic_premium'), puis par date d'inscription
    qs = qs.annotate(
        premium_order=Case(
            When(user__role='mechanic_premium', then=Value(0)),
            default=Value(1),
            output_field=IntegerField(),
        )
    ).order_by('premium_order', 'user__created_at')
    return qs.first()


def find_nearest_mechanic(
    latitude: float,
    longitude: float,
    radius_km: Optional[float] = None,
    specialty_id: Optional[int] = None,
    exclude_ids: Optional[list] = None,
):
    """Retourne le mécanicien disponible le plus proche (premium en priorité).
    Fallback progressif : rayon par défaut → rayon max → sans contrainte de distance.
    """
    default_radius = getattr(settings, 'DEFAULT_SEARCH_RADIUS_KM', 10)
    max_radius = getattr(settings, 'MAX_MECHANIC_SEARCH_RADIUS_KM', 50)

    search_radius = min(radius_km, max_radius) if radius_km else default_radius
    zone_radius = getattr(settings, 'SAME_ZONE_RADIUS_KM', default_radius)
    recent_premium_ids = _same_day_zone_premium_mechanic_ids(latitude, longitude, zone_radius)

    # 1er essai : premium disponibles dans le rayon, en évitant ceux déjà assignés aujourd'hui dans la même zone
    premium_candidates = _build_qs(
        latitude, longitude, search_radius,
        specialty_id, exclude_ids,
        premium_only=True,
        avoid_mechanic_ids=recent_premium_ids,
    )
    if premium_candidates:
        distance, mechanic = premium_candidates[0]
        return mechanic, round(distance, 2)

    # 2e essai : si des premium existent mais ont déjà traité la zone aujourd'hui,
    # on peut retomber sur eux plutôt que de choisir un standard.
    premium_candidates = _build_qs(
        latitude, longitude, search_radius,
        specialty_id, exclude_ids,
        premium_only=True,
    )
    if premium_candidates:
        distance, mechanic = premium_candidates[0]
        return mechanic, round(distance, 2)

    # 3e essai : rayon demandé ou par défaut
    candidates = _build_qs(latitude, longitude, search_radius, specialty_id, exclude_ids)
    if candidates:
        distance, mechanic = candidates[0]
        return mechanic, round(distance, 2)

    # 4e essai : rayon max si on n'était pas déjà dessus
    if search_radius < max_radius:
        candidates = _build_qs(latitude, longitude, max_radius, specialty_id, exclude_ids)
        if candidates:
            distance, mechanic = candidates[0]
            return mechanic, round(distance, 2)

    # 3e essai : sans contrainte de distance (toute la plateforme)
    mechanic = _any_available_mechanic(specialty_id, exclude_ids)
    if mechanic:
        dist = None
        if mechanic.latitude and mechanic.longitude:
            dist = round(haversine_distance(
                latitude, longitude,
                float(mechanic.latitude), float(mechanic.longitude)
            ), 2)
        return mechanic, dist

    return None, None


def find_top_mechanics(
    latitude: float,
    longitude: float,
    n: int = 10,
    radius_km: Optional[float] = None,
    specialty_id: Optional[int] = None,
    exclude_ids: Optional[list] = None,
):
    """Retourne les n meilleurs mécaniciens disponibles pour le mode broadcast."""
    if radius_km is None:
        radius_km = getattr(settings, 'DEFAULT_SEARCH_RADIUS_KM', 10)
    radius_km = min(radius_km, getattr(settings, 'MAX_MECHANIC_SEARCH_RADIUS_KM', 50))

    candidates = _build_qs(latitude, longitude, radius_km, specialty_id, exclude_ids)
    return [
        {'profile': profile, 'distance_km': round(dist, 2)}
        for dist, profile in candidates[:n]
    ]


def find_mechanic_at_radius(
    latitude: float,
    longitude: float,
    radius_km: float,
    specialty_id: Optional[int] = None,
    exclude_ids: Optional[list] = None,
):
    """Cherche le mécanicien le plus proche strictement dans radius_km, sans fallback."""
    zone_radius = getattr(settings, 'SAME_ZONE_RADIUS_KM', radius_km)
    recent_premium_ids = _same_day_zone_premium_mechanic_ids(latitude, longitude, zone_radius)

    premium_candidates = _build_qs(
        latitude, longitude, radius_km,
        specialty_id, exclude_ids,
        premium_only=True,
        avoid_mechanic_ids=recent_premium_ids,
    )
    if premium_candidates:
        dist, profile = premium_candidates[0]
        return profile, round(dist, 2)

    premium_candidates = _build_qs(latitude, longitude, radius_km, specialty_id, exclude_ids, premium_only=True)
    if premium_candidates:
        dist, profile = premium_candidates[0]
        return profile, round(dist, 2)

    candidates = _build_qs(latitude, longitude, radius_km, specialty_id, exclude_ids)
    if not candidates:
        return None, None
    dist, profile = candidates[0]
    return profile, round(dist, 2)


def find_all_available_for_broadcast(specialty_id=None, exclude_ids=None):
    """Retourne tous les mécaniciens disponibles (premium en premier) pour le broadcast commune/ville."""
    from apps.mechanics.models import MechanicProfile
    from django.db.models import Case, When, Value, IntegerField
    qs = MechanicProfile.objects.filter(
        status='approved',
        is_available=True,
    ).select_related('user')
    if specialty_id:
        qs = qs.filter(specialties__id=specialty_id)
    if exclude_ids:
        qs = qs.exclude(pk__in=exclude_ids)
    qs = qs.annotate(
        premium_order=Case(
            When(user__role='mechanic_premium', then=Value(0)),
            default=Value(1),
            output_field=IntegerField(),
        )
    ).order_by('premium_order', 'user__created_at')
    return list(qs)


def find_mechanics_nearby(
    latitude: float,
    longitude: float,
    radius_km: float = 10,
    specialty_id: Optional[int] = None,
):
    """Retourne la liste des mécaniciens dans le rayon, triés premium puis distance."""
    from apps.mechanics.models import MechanicProfile

    qs = MechanicProfile.objects.filter(
        status='approved',
        is_available=True,
        latitude__isnull=False,
        longitude__isnull=False,
    ).select_related('user').prefetch_related('specialties')

    if specialty_id:
        qs = qs.filter(specialties__id=specialty_id)

    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * math.cos(math.radians(latitude)))
    qs = qs.filter(
        latitude__range=(latitude - lat_delta, latitude + lat_delta),
        longitude__range=(longitude - lon_delta, longitude + lon_delta),
    )

    results = []
    for profile in qs:
        dist = haversine_distance(latitude, longitude, float(profile.latitude), float(profile.longitude))
        if dist <= radius_km:
            results.append({'profile': profile, 'distance_km': round(dist, 2)})

    results.sort(key=lambda x: (0 if x['profile'].user.is_premium else 1, x['distance_km']))
    return results
