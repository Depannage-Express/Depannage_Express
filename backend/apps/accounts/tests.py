from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User


class AuthenticationApiTests(APITestCase):
    def test_register_returns_tokens_and_user_payload(self):
        payload = {
            'email': 'meca@example.com',
            'first_name': 'Junior',
            'last_name': 'Make',
            'phone': '+22901020304',
            'role': 'mechanic_standard',
            'password': 'DepannageExpress123!',
            'password_confirm': 'DepannageExpress123!',
        }

        response = self.client.post(reverse('auth-register'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], payload['email'])
        self.assertTrue(User.objects.filter(email=payload['email']).exists())

    def test_login_returns_tokens_for_existing_user(self):
        user = User.objects.create_user(
            email='meca@example.com',
            password='DepannageExpress123!',
            first_name='Junior',
            last_name='Make',
            role='mechanic_standard',
        )

        response = self.client.post(reverse('auth-login'), {
            'email': user.email,
            'password': 'DepannageExpress123!',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['id'], str(user.id))

    def test_profile_requires_authentication(self):
        response = self.client.get(reverse('auth-profile'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
