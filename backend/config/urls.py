from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/', include('apps.accounts.urls')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Core apps
    path('api/mechanics/', include('apps.mechanics.urls')),
    path('api/drivers/', include('apps.drivers.urls')),
    path('api/breakdowns/', include('apps.breakdowns.urls')),
    path('api/interventions/', include('apps.interventions.urls')),
    path('api/geolocation/', include('apps.geolocation.urls')),

    # Premium & subscriptions
    path('api/premium/', include('apps.premium.urls')),
    path('api/subscriptions/', include('apps.subscriptions.urls')),

    # Payments
    path('api/payments/', include('apps.payments.urls')),

    # Communication
    path('api/messaging/', include('apps.messaging.urls')),
    path('api/notifications/', include('apps.notifications.urls')),

    # Safety
    path('api/reports/', include('apps.reports.urls')),
    path('api/security/', include('apps.security.urls')),

    # Dashboard
    path('api/dashboard/', include('apps.dashboard.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)