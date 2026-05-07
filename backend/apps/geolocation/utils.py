# apps/geolocation/utils.py
import math
from typing import Optional
from django.conf import settings


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcule la distance en km entre deux points GPS (formule de Haversine).
    """
    R = 6371  # Rayon Terre en km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def find_nearest_mechanic(
    latitude: float,
    longitude: float,
    radius_km: Optional[float] = None,
    specialty_id: Optional[int] = None,
):
    """
    Retourne le mécanicien approuvé et disponible le plus proche.
    Priorise les mécaniciens premium.
    """
    from apps.mechanics.models import MechanicProfile

    if radius_km is None:
        radius_km = getattr(settings, 'DEFAULT_SEARCH_RADIUS_KM', 10)

    max_radius = getattr(settings, 'MAX_MECHANIC_SEARCH_RADIUS_KM', 50)
    radius_km = min(radius_km, max_radius)

    qs = MechanicProfile.objects.filter(
        status='approved',
        is_available=True,
        latitude__isnull=False,
        longitude__isnull=False,
    ).select_related('user')

    if specialty_id:
        qs = qs.filter(specialties__id=specialty_id)

    # Filtrage grossier par bounding box avant calcul précis
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * math.cos(math.radians(latitude)))

    qs = qs.filter(
        latitude__range=(latitude - lat_delta, latitude + lat_delta),
        longitude__range=(longitude - lon_delta, longitude + lon_delta),
    )

    candidates = []
    for profile in qs:
        dist = haversine_distance(
            latitude, longitude,
            float(profile.latitude), float(profile.longitude)
        )
        if dist <= radius_km:
            candidates.append((dist, profile))

    if not candidates:
        return None, None

    # Priorité premium, puis distance
    candidates.sort(key=lambda x: (0 if x[1].user.is_premium else 1, x[0]))
    distance, mechanic = candidates[0]
    return mechanic, round(distance, 2)


def find_mechanics_nearby(
    latitude: float,
    longitude: float,
    radius_km: float = 10,
    specialty_id: Optional[int] = None,
):
    """
    Retourne la liste des mécaniciens dans le rayon,
    triés par premium d'abord puis par distance.
    """
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
        dist = haversine_distance(
            latitude, longitude,
            float(profile.latitude), float(profile.longitude)
        )
        if dist <= radius_km:
            results.append({'profile': profile, 'distance_km': round(dist, 2)})

    results.sort(key=lambda x: (0 if x['profile'].user.is_premium else 1, x['distance_km']))
    return results