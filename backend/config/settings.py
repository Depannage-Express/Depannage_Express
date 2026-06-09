"""
Django settings for Dépannage Express
Clean production-ready configuration
"""

import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def env_list(name, default=''):
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(',') if item.strip()]

# ─────────────────────────────────────────
# SECURITY
# ─────────────────────────────────────────

SECRET_KEY = os.getenv('SECRET_KEY', 'change-me-in-production')

DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = env_list('ALLOWED_HOSTS', 'localhost,127.0.0.1,.onrender.com')

# Render injecte automatiquement RENDER_EXTERNAL_HOSTNAME
_render_host = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

# ─────────────────────────────────────────
# APPLICATIONS
# ─────────────────────────────────────────

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
]

LOCAL_APPS = [
    'apps.core',
    'apps.accounts',
    'apps.mechanics',
    'apps.breakdowns',
    'apps.interventions',
    'apps.payments',
    'apps.premium',
    'apps.geolocation',
    'apps.otp',
    'apps.incidents',
]

# Note : apps.notifications et apps.security sont des modules utilitaires sans modèles.
# Ils ne nécessitent pas d'être dans INSTALLED_APPS.
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ─────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',

    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',

    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# ─────────────────────────────────────────
# TEMPLATES
# ─────────────────────────────────────────

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ─────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────

import dj_database_url

DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    _db_config = dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600,
        conn_health_checks=True,
    )
    _db_config['OPTIONS'] = {'sslmode': 'require'}
    DATABASES = {'default': _db_config}
else:
    DATABASES = {
        'default': {
            'ENGINE': os.getenv('DB_ENGINE'),
            'NAME': os.getenv('DB_NAME'),
            'USER': os.getenv('DB_USER'),
            'PASSWORD': os.getenv('DB_PASSWORD'),
            'HOST': os.getenv('DB_HOST'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }

# ─────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─────────────────────────────────────────
# REST FRAMEWORK
# ─────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '5000/hour',
        'user': '10000/hour',
        'otp_request': '10/hour',
    },
}

# ─────────────────────────────────────────
# JWT
# ─────────────────────────────────────────

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ─────────────────────────────────────────
# CORS
# ─────────────────────────────────────────

CORS_ALLOWED_ORIGINS = env_list(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173'
)

CSRF_TRUSTED_ORIGINS = env_list(
    'CSRF_TRUSTED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173'
)

CORS_ALLOW_CREDENTIALS = True

# ─────────────────────────────────────────
# STATIC / MEDIA
# ─────────────────────────────────────────

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ─────────────────────────────────────────
# LOCALISATION
# ─────────────────────────────────────────

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Porto-Novo'

USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─────────────────────────────────────────
# HTTPS / PRODUCTION SECURITY
# ─────────────────────────────────────────

if not DEBUG:
    # Render termine le SSL en amont — Django reçoit HTTP en interne
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# ─────────────────────────────────────────
# EMAIL (DEV)
# ─────────────────────────────────────────

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ─────────────────────────────────────────
# GEOLOCATION
# ─────────────────────────────────────────

MAX_MECHANIC_SEARCH_RADIUS_KM = 50
DEFAULT_SEARCH_RADIUS_KM = 10

# ─────────────────────────────────────────
# SMS / OTP
# ─────────────────────────────────────────

# 'console' (log dans le terminal, code retourné en DEBUG) ou 'twilio'
SMS_BACKEND = os.getenv('SMS_BACKEND', 'console')

# True → renvoie le code OTP dans la réponse API (démo / soutenance)
OTP_SHOW_CODE = os.getenv('OTP_SHOW_CODE', 'False') == 'True'

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_FROM_NUMBER = os.getenv('TWILIO_FROM_NUMBER', '')

# ─────────────────────────────────────────
# FEDAPAY
# ─────────────────────────────────────────

FEDAPAY_SECRET_KEY = os.getenv('FEDAPAY_SECRET_KEY', '')
FEDAPAY_ENVIRONMENT = os.getenv('FEDAPAY_ENVIRONMENT', 'sandbox')
FEDAPAY_WEBHOOK_SECRET = os.getenv('FEDAPAY_WEBHOOK_SECRET', '')
BACKEND_BASE_URL = os.getenv('BACKEND_BASE_URL', 'http://localhost:8000')
NOMINATIM_BASE_URL = os.getenv('NOMINATIM_BASE_URL', 'https://nominatim.openstreetmap.org')
PREMIUM_SUBSCRIPTION_AMOUNT = os.getenv('PREMIUM_SUBSCRIPTION_AMOUNT', '5000.00')

# ─────────────────────────────────────────
# PRICING / SEARCH
# ─────────────────────────────────────────

BREAKDOWN_PRICING = {
    'demarrage': 10000,
    'batterie':  12000,
    'moteur':    18000,
    'pneu':       8000,
    'general':   15000,
}

SEARCH_RADII_KM = {1: 10, 2: 20, 3: 50}
