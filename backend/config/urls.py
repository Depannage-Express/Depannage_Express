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

    # Core business apps
    path('api/mechanics/', include('apps.mechanics.urls')),
    path('api/breakdowns/', include('apps.breakdowns.urls')),
    path('api/interventions/', include('apps.interventions.urls')),
    path('api/geolocation/', include('apps.geolocation.urls')),

    # Premium contacts
    path('api/premium/', include('apps.premium.urls')),

    # Payments
    path('api/payments/', include('apps.payments.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
