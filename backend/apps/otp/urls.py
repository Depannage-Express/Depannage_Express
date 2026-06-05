from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.request_otp, name='otp-request'),
    path('verify/', views.verify_otp, name='otp-verify'),
]
