from django.urls import path

from . import views


urlpatterns = [
    path('', views.create_payment, name='payment-create'),
    path('<uuid:pk>/confirm/', views.confirm_payment, name='payment-confirm'),
    path('admin/', views.PaymentAdminListView.as_view(), name='payment-admin-list'),
    path('subscription/', views.create_subscription_payment, name='subscription-create'),
    path('subscription/<uuid:pk>/confirm/', views.confirm_subscription_payment, name='subscription-confirm'),
]
