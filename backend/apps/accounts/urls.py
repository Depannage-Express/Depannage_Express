# apps/accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view, name='auth-register'),
    path('login/', views.login_view, name='auth-login'),
    path('logout/', views.logout_view, name='auth-logout'),
    path('profile/', views.profile_view, name='auth-profile'),
    path('change-password/', views.change_password_view, name='auth-change-password'),

    # Admin
    path('users/', views.UserListView.as_view(), name='admin-users-list'),
    path('users/<uuid:pk>/block/', views.block_user_view, name='admin-block-user'),
    path('users/<uuid:pk>/unblock/', views.unblock_user_view, name='admin-unblock-user'),
]