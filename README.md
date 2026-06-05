# Depannage_Express

Application full-stack composee de:

- un backend Django REST dans `backend`
- un frontend React + Vite dans `frontend`

## Preconditions

- Node.js `22.12.0` recommande (`20.19+` minimum)
- Python `3.10+`

Avec `nvm`:

```bash
nvm use
```

## Backend

Creer et activer un environnement virtuel:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

Installer les dependances:

```bash
pip install -r requirements.txt
```

Verifier la configuration:

- copier `.env.example` vers `.env` si besoin
- par defaut le projet utilise SQLite

Appliquer les migrations puis lancer le serveur:

```bash
python manage.py migrate
python manage.py runserver
```

Le backend repondra sur `http://127.0.0.1:8000/`.

## Frontend

Dans un autre terminal:

```bash
cd frontend
npm install
npm run dev
```

Le frontend attend par defaut:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Verifier que `frontend/.env` correspond bien a l'URL du backend.

## Verification rapide

1. Lancer le backend.
2. Lancer le frontend.
3. Ouvrir l'application Vite affichee dans le terminal.
4. Tester une action qui appelle l'API, par exemple connexion ou creation de demande.

## Blocages connus identifies

- Sans dependances Python installees, `python manage.py check` echoue avec `No module named 'django'`.
- Sans Node `20.19+`, `vite` ne demarre pas.
