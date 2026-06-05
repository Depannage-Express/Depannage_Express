# apps/breakdowns/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.create_breakdown_request, name='breakdown-create'),
    path('my-requests/', views.my_breakdown_requests, name='breakdown-my-requests'),
    path('stats/', views.platform_stats, name='breakdown-stats'),
    path('admin/stats/', views.admin_stats, name='breakdown-admin-stats'),
    path('admin/', views.BreakdownAdminListView.as_view(), name='breakdown-admin-list'),
    path('admin/<uuid:pk>/', views.breakdown_detail_admin, name='breakdown-admin-detail'),
    path('status/<uuid:pk>/', views.breakdown_status_public, name='breakdown-status-public'),
    path('<uuid:pk>/intervention/', views.get_intervention_by_breakdown, name='breakdown-intervention'),
    path('<uuid:pk>/messages/', views.breakdown_messages, name='breakdown-messages'),
]