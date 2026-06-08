from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.request_otp, name='otp-request'),
    path('verify/', views.verify_otp, name='otp-verify'),
    path('phone/request/', views.request_phone_otp, name='otp-phone-request'),
    path('phone/verify/', views.verify_phone_otp, name='otp-phone-verify'),
]
