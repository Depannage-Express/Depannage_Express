from django.test import TestCase, override_settings

from apps.accounts.models import User
from apps.mechanics.models import MechanicProfile, Specialty
from apps.geolocation.utils import find_nearest_mechanic


@override_settings(
    DEFAULT_SEARCH_RADIUS_KM=10,
    MAX_MECHANIC_SEARCH_RADIUS_KM=50,
    ABSOLUTE_MAX_MECHANIC_SEARCH_RADIUS_KM=150,
)
class FindNearestMechanicLastResortTests(TestCase):
    """Parakou (9.337, 2.628) sans mécanicien local couvrant la spécialité demandée."""

    def _make_mechanic(self, email, latitude, longitude, specialty):
        user = User.objects.create_user(
            email=email, password='x', first_name='A', last_name='B',
            role='mechanic_standard',
        )
        profile = MechanicProfile.objects.create(
            user=user, status='approved', is_available=True,
            latitude=latitude, longitude=longitude, city='Test',
        )
        profile.specialties.add(specialty)
        return profile

    def test_matches_distant_mechanic_within_absolute_max(self):
        specialty = Specialty.objects.create(name='Crevaison / Pneus')
        # ~92 km de Parakou : hors MAX_MECHANIC_SEARCH_RADIUS_KM (50) mais dans le plafond absolu (150)
        mechanic = self._make_mechanic('m1@test.bj', 8.5, 2.6, specialty)

        result, distance = find_nearest_mechanic(9.337, 2.628, specialty_id=specialty.id)

        self.assertEqual(result, mechanic)
        self.assertLess(distance, 150)
        self.assertGreater(distance, 50)

    def test_does_not_match_mechanic_beyond_absolute_max(self):
        specialty = Specialty.objects.create(name='Crevaison / Pneus')
        # Cotonou : ~330 km de Parakou, au-delà du plafond absolu (150)
        self._make_mechanic('m2@test.bj', 6.3676, 2.3915, specialty)

        result, distance = find_nearest_mechanic(9.337, 2.628, specialty_id=specialty.id)

        self.assertIsNone(result)
        self.assertIsNone(distance)
