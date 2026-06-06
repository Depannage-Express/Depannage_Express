# apps/mechanics/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('specialties/', views.SpecialtyListView.as_view(), name='specialties-list'),
    path('public/', views.MechanicPublicListView.as_view(), name='mechanics-public-list'),
    path('profile/create/', views.create_profile_view, name='mechanic-create-profile'),
    path('profile/me/', views.my_profile_view, name='mechanic-my-profile'),
    path('profile/availability/', views.toggle_availability_view, name='mechanic-toggle-availability'),
    path('profile/<uuid:pk>/', views.mechanic_public_profile, name='mechanic-public-profile'),
    path('profile/<uuid:pk>/reviews/', views.mechanic_reviews, name='mechanic-reviews'),

    # Admin
    path('admin/list/', views.MechanicListAdminView.as_view(), name='admin-mechanics-list'),
    path('admin/<uuid:pk>/validate/', views.validate_mechanic_view, name='admin-validate-mechanic'),
    path('admin/complete-approve/<uuid:user_id>/', views.admin_complete_and_approve, name='admin-complete-approve'),
    path('admin/reviews/', views.ReviewAdminListView.as_view(), name='admin-reviews-list'),
    path('admin/reviews/<int:pk>/', views.admin_delete_review, name='admin-review-delete'),

    # Messagerie mécanicien ↔ admin
    path('messages/admin/', views.mechanic_admin_messages, name='mechanic-admin-messages'),
    path('messages/admin/conversations/', views.mechanic_admin_conversations, name='mechanic-admin-conversations'),
]