# Guide de test FedaPay Sandbox — Dépannage Express

## Prérequis

```bash
cd backend
pip install -r requirements.txt   # installe fedapay==0.3.0
```

## Variables d'environnement (backend/.env)

```env
FEDAPAY_SECRET_KEY=sk_sandbox_XXXX   # clé secrète FedaPay sandbox
FEDAPAY_ENVIRONMENT=sandbox
BACKEND_BASE_URL=http://localhost:8000
```

> Récupérer `sk_sandbox_XXXX` sur https://sandbox.fedapay.com → Paramètres → API.

## Lancer le projet

```bash
# Terminal 1 — backend
cd backend
python manage.py migrate
python manage.py seed_demo      # peuple la BDD de test
python manage.py runserver

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

## Cartes et numéros de test

### Mobile Money Bénin (succès)
| Opérateur | Numéro    |
|-----------|-----------|
| MTN       | 97000001  |
| Moov      | 96000001  |

### Mobile Money Bénin (échec)
| Opérateur | Numéro    |
|-----------|-----------|
| MTN       | 97000002  |

### Cartes bancaires (succès)
| Réseau | Numéro           | Date    | CVV |
|--------|------------------|---------|-----|
| Visa   | 4111111111111111 | 12/26   | 123 |
| MC     | 5555555555554444 | 12/26   | 123 |

### Carte (échec)
| Réseau | Numéro           |
|--------|------------------|
| Visa   | 4242424242424242 |

## Scénario de test complet

1. **Conducteur** soumet une demande de dépannage → note le `driver_token` affiché.
2. **Mécanicien** (dashboard) accepte la mission.
3. **Conducteur** clique "Payer" → saisit un opérateur + numéro de test.
4. Le frontend redirige vers `sandbox.fedapay.com/checkout/…`.
5. Saisir le numéro `97000001` (MTN succès) et valider.
6. FedaPay envoie le webhook → `POST /api/payments/callback/` → paiement passe à `paid`.
7. Le navigateur revient sur l'app → écran de confirmation affiché automatiquement.
8. Vérifier dans le dashboard FedaPay : transaction = **approved ✅**.

## Vérification signature webhook (local)

Pour rejouer un callback en local avec `curl` :

```bash
BODY='{"entity":"transaction","event":"transaction.approved","object":{"id":"<TX_ID>","status":"approved"}}'
SECRET="sk_sandbox_XXXX"
SIG="sha256=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"

curl -X POST http://localhost:8000/api/payments/callback/ \
  -H "Content-Type: application/json" \
  -H "X-Fedapay-Signature: $SIG" \
  -d "$BODY"
```

## Checklist finale

- [x] `fedapay_client.py` créé avec `create_transaction()`
- [x] `fedapay_client.py` créé avec `verify_webhook_signature()`
- [x] `create_payment` utilise `fedapay_client` (plus de simulation)
- [x] `payment_callback` vérifie signature + met à jour `PaymentTransaction`
- [x] `payment_callback` idempotent (double appel FedaPay géré)
- [x] `payment_url` retourné au frontend
- [x] Frontend redirige vers `payment_url` (dynamique)
- [x] `BACKEND_BASE_URL` dans `settings.py` et `.env.example`
- [x] `SANDBOX_SETUP.md` généré
