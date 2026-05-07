# apps/breakdowns/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.create_breakdown_request, name='breakdown-create'),
    path('my-requests/', views.my_breakdown_requests, name='breakdown-my-requests'),
    path('admin/', views.BreakdownAdminListView.as_view(), name='breakdown-admin-list'),
    path('admin/<uuid:pk>/', views.breakdown_detail_admin, name='breakdown-admin-detail'),
]