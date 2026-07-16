from django.urls import path

from . import views


urlpatterns = [
    path('', views.create_payment, name='payment-create'),
    path('<uuid:pk>/confirm/', views.confirm_payment, name='payment-confirm'),
    path('callback/', views.payment_callback, name='payment-callback'),
    path('admin/', views.admin_list_payments, name='payment-admin-list'),
    path('admin/stats/', views.admin_payment_stats, name='payment-admin-stats'),
    path('subscription/', views.create_subscription_payment, name='subscription-create'),
    path('subscription/pending/', views.pending_subscription_payment, name='subscription-pending'),
    path('subscription/cancel/', views.cancel_subscription_payment, name='subscription-cancel'),
    path('subscription/<uuid:pk>/confirm/', views.confirm_subscription_payment, name='subscription-confirm'),

    # Portefeuille mécanicien
    path('wallet/', views.mechanic_wallet, name='mechanic-wallet'),
    path('withdraw/', views.mechanic_withdraw, name='mechanic-withdraw'),

    # Admin retraits
    path('admin/withdrawals/', views.admin_withdrawal_list, name='admin-withdrawal-list'),
    path('admin/withdrawals/<uuid:pk>/process/', views.admin_withdrawal_process, name='admin-withdrawal-process'),
]
