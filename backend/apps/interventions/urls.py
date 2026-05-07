# apps/interventions/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('my/', views.my_interventions, name='intervention-my-list'),
    path('<uuid:pk>/accept/', views.accept_intervention, name='intervention-accept'),
    path('<uuid:pk>/refuse/', views.refuse_intervention, name='intervention-refuse'),
    path('<uuid:pk>/start/', views.start_intervention, name='intervention-start'),
    path('<uuid:pk>/complete/', views.complete_intervention, name='intervention-complete'),
    path('admin/', views.InterventionAdminListView.as_view(), name='intervention-admin-list'),
]