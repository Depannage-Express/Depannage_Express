# apps/geolocation/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('nearby/', views.mechanics_nearby_view, name='geolocation-nearby'),
]