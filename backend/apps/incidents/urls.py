from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_incidents),
    path('stats/', views.incident_stats),
    path('report/', views.create_incident),
    path('report/avis/', views.report_avis),
    path('<uuid:pk>/', views.incident_detail),
    path('<uuid:pk>/resolve/', views.resolve_incident),
    path('<uuid:pk>/reject/', views.reject_incident),
    path('<uuid:pk>/suspend/', views.suspend_incident),
]
