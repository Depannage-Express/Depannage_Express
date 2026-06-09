# Déploiement DépannageExpress

## Architecture

| Composant | Plateforme | Technologie |
|-----------|-----------|-------------|
| Frontend  | Vercel    | React + Vite |
| Backend   | Render    | Django 5 + Gunicorn |
| Base de données | Supabase | PostgreSQL 15 |
| Paiement  | FedaPay   | sandbox → live |

---

## Variables d'environnement — Render (backend)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `SECRET_KEY` | Clé secrète Django (50 chars aléatoires) | `django-insecure-...` |
| `DEBUG` | Mode debug | `False` |
| `DATABASE_URL` | URI Supabase | `postgresql://postgres:[PWD]@db.[REF].supabase.co:5432/postgres` |
| `ALLOWED_HOSTS` | Domaines autorisés (virgule) | `depannage-express.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | URL(s) frontend autorisées | `https://depannage-express.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | Même valeur que CORS | `https://depannage-express.vercel.app` |
| `FEDAPAY_SECRET_KEY` | Clé API FedaPay | `sk_sandbox_...` |
| `FEDAPAY_ENVIRONMENT` | Environnement FedaPay | `sandbox` |
| `FEDAPAY_WEBHOOK_SECRET` | Secret signature webhook | `whsec_...` |
| `BACKEND_BASE_URL` | URL publique du backend | `https://depannage-express.onrender.com` |
| `NOMINATIM_BASE_URL` | API géocodage | `https://nominatim.openstreetmap.org` |
| `PREMIUM_SUBSCRIPTION_AMOUNT` | Montant abonnement (FCFA) | `5000.00` |
| `SMS_BACKEND` | Backend SMS | `console` (ou `twilio`) |
| `OTP_SHOW_CODE` | Afficher code OTP en réponse (démo) | `False` |

> **Note Render :** `RENDER_EXTERNAL_HOSTNAME` est injecté automatiquement et ajouté aux `ALLOWED_HOSTS` sans configuration supplémentaire.

---

## Variables d'environnement — Vercel (frontend)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base de l'API backend (avec `/api`) | `https://depannage-express.onrender.com/api` |

---

## Déploiement initial

### 1. Base de données Supabase
1. Créer un projet Supabase
2. Copier la **connection string** depuis *Settings → Database → Connection string → URI*
3. La définir comme `DATABASE_URL` sur Render

### 2. Backend Render
```bash
# Depuis le Render Shell après déploiement
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo   # optionnel — données de démo
```

### 3. Frontend Vercel
- Connecter le repo GitHub
- Définir `VITE_API_BASE_URL` dans les variables d'environnement Vercel
- Build command : `npm run build`
- Output directory : `dist`

---

## Webhook FedaPay

**URL à enregistrer dans le dashboard FedaPay :**
```
https://[backend].onrender.com/api/payments/callback/
```

**Événements à activer :**
- `transaction.approved`
- `transaction.transferred`
- `transaction.declined`
- `transaction.canceled`

---

## Passage en production (FedaPay live)

1. Créer un compte live sur [app.fedapay.com](https://app.fedapay.com)
2. Remplacer `FEDAPAY_SECRET_KEY` par `sk_live_...`
3. Remplacer `FEDAPAY_ENVIRONMENT` par `live`
4. Reconfigurer le webhook avec la nouvelle clé live

---

## Génération d'une SECRET_KEY Django

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
