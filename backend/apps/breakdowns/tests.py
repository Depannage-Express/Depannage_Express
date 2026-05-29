import tempfile
import shutil

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.breakdowns.models import BreakdownRequest
from apps.mechanics.models import MechanicProfile, Specialty


PNG_BYTES = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
    b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00'
    b'\x02\x00\x01\xe2!\xbc3\x00\x00\x00\x00IEND\xaeB`\x82'
)


class BreakdownApiTests(APITestCase):
    @classmethod
    def setUpClass(cls):
        cls._temp_media_dir = tempfile.mkdtemp(dir='/home/juju/Depannage_Express/backend')
        super().setUpClass()
        cls._override = override_settings(MEDIA_ROOT=cls._temp_media_dir)
        cls._override.enable()

    @classmethod
    def tearDownClass(cls):
        cls._override.disable()
        shutil.rmtree(cls._temp_media_dir, ignore_errors=True)
        super().tearDownClass()

    def test_create_breakdown_assigns_nearest_approved_mechanic(self):
        specialty = Specialty.objects.create(name='Moteur')
        mechanic_user = User.objects.create_user(
            email='pro@example.com',
            password='DepannageExpress123!',
            first_name='Pro',
            last_name='Mechanic',
            role='mechanic_premium',
        )
        mechanic_profile = MechanicProfile.objects.create(
            user=mechanic_user,
            status='approved',
            is_available=True,
            latitude=6.3703000,
            longitude=2.3912000,
            city='Cotonou',
        )
        mechanic_profile.specialties.add(specialty)

        response = self.client.post(reverse('breakdown-create'), {
            'driver_name': 'Client Test',
            'driver_phone': '+22901020304',
            'driver_id_card': SimpleUploadedFile('id.png', PNG_BYTES, content_type='image/png'),
            'driver_selfie': SimpleUploadedFile('selfie.png', PNG_BYTES, content_type='image/png'),
            'vehicle_description': 'Toyota Corolla grise',
            'vehicle_photo': SimpleUploadedFile('vehicle.png', PNG_BYTES, content_type='image/png'),
            'breakdown_description': 'Le moteur ne demarre plus',
            'breakdown_type': 'Demarrage',
            'specialty_requested': specialty.id,
            'latitude': '6.3705000',
            'longitude': '2.3915000',
            'address_description': 'Cotonou centre',
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'assigned')
        self.assertEqual(str(response.data['assigned_mechanic']), str(mechanic_profile.id))
        self.assertIsNotNone(response.data['assignment_distance_km'])
        self.assertEqual(BreakdownRequest.objects.count(), 1)

    def test_mechanic_can_list_only_assigned_breakdowns(self):
        mechanic_user = User.objects.create_user(
            email='meca@example.com',
            password='DepannageExpress123!',
            first_name='Junior',
            last_name='Make',
            role='mechanic_standard',
        )
        mechanic_profile = MechanicProfile.objects.create(
            user=mechanic_user,
            status='approved',
            is_available=True,
        )
        BreakdownRequest.objects.create(
            driver_name='Client A',
            driver_phone='+22901020304',
            driver_id_card=SimpleUploadedFile('id.png', PNG_BYTES, content_type='image/png'),
            driver_selfie=SimpleUploadedFile('selfie.png', PNG_BYTES, content_type='image/png'),
            vehicle_description='Yaris',
            vehicle_photo=SimpleUploadedFile('vehicle.png', PNG_BYTES, content_type='image/png'),
            breakdown_description='Panne batterie',
            latitude=6.1,
            longitude=2.3,
            assigned_mechanic=mechanic_profile,
            status='assigned',
        )

        self.client.force_authenticate(user=mechanic_user)
        response = self.client.get(reverse('breakdown-my-requests'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['driver_name'], 'Client A')
