# apps/mechanics/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('specialties/', views.SpecialtyListView.as_view(), name='specialties-list'),
    path('profile/create/', views.create_profile_view, name='mechanic-create-profile'),
    path('profile/me/', views.my_profile_view, name='mechanic-my-profile'),
    path('profile/availability/', views.toggle_availability_view, name='mechanic-toggle-availability'),
    path('profile/<uuid:pk>/', views.mechanic_public_profile, name='mechanic-public-profile'),
    path('profile/<uuid:pk>/reviews/', views.ReviewListView.as_view(), name='mechanic-reviews'),

    # Admin
    path('admin/list/', views.MechanicListAdminView.as_view(), name='admin-mechanics-list'),
    path('admin/<uuid:pk>/validate/', views.validate_mechanic_view, name='admin-validate-mechanic'),
]