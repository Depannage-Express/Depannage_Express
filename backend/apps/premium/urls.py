# apps/premium/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('contact/request/', views.request_premium_contact, name='premium-contact-request'),
    path('contact/<uuid:pk>/reveal/', views.reveal_mechanic_contact, name='premium-contact-reveal'),
    path('admin/contacts/', views.ContactRequestAdminListView.as_view(), name='premium-admin-contacts'),
    path('admin/contacts/<uuid:pk>/approve/', views.approve_contact_request, name='premium-approve'),
    path('admin/contacts/<uuid:pk>/reject/', views.reject_contact_request, name='premium-reject'),

]