import hashlib
import hmac as hmac_lib
from urllib.parse import urlencode

import requests
from django.conf import settings


def create_transaction(
    amount, description,
    customer_name, customer_phone,
    breakdown_id=None,
    return_params=None,
):
    """
    NB : `callback_url` dans l'API FedaPay n'est PAS un webhook serveur-à-serveur —
    c'est l'URL vers laquelle FedaPay redirige le navigateur du client (GET, avec
    `?id=<transaction_id>&status=<statut>` ajoutés) une fois le paiement terminé.
    `return_url`/`cancel_url` n'existent pas dans leur API et sont ignorés.
    Le vrai webhook signé (payment_callback, POST + HMAC) doit être enregistré une
    fois pour toutes dans le dashboard FedaPay (section Webhooks), pas ici.
    """
    env = getattr(settings, 'FEDAPAY_ENVIRONMENT', 'sandbox')
    base = 'https://api.fedapay.com/v1' if env == 'live' else 'https://sandbox-api.fedapay.com/v1'

    headers = {
        'Authorization': f'Bearer {settings.FEDAPAY_SECRET_KEY}',
        'Content-Type': 'application/json',
    }

    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173')

    if return_params is None:
        return_params = {'payment_return': '1'}
        if breakdown_id:
            return_params['breakdown_id'] = breakdown_id

    payload = {
        'description': description,
        'amount': int(float(amount)),
        'currency': {'iso': 'XOF'},
        'callback_url': f'{frontend_base}?{urlencode(return_params)}',
        'customer': {
            'firstname': customer_name or 'Conducteur',
            'lastname': '.',
            'email': f'{customer_phone}@depannage.bj',
            'phone_number': {
                'number': str(customer_phone),
                'country': 'bj',
            },
        },
    }

    resp = requests.post(
        f'{base}/transactions',
        json=payload,
        headers=headers,
        timeout=20,
    )

    print('FedaPay create response:', resp.text)
    resp.raise_for_status()

    data = resp.json()
    transaction = (
        data.get('v1/transaction') or
        data.get('transaction') or
        data
    )
    transaction_id = transaction['id']
    payment_url = transaction.get('payment_url') or fetch_payment_url(transaction_id, env=env)

    return {
        'transaction_id': str(transaction_id),
        'payment_url': payment_url,
        'status': transaction.get('status', 'pending'),
    }


def get_transaction(transaction_id):
    """
    État réel d'une transaction côté FedaPay — source de vérité à consulter avant
    de proposer une reprise de checkout (une transaction déjà déclinée/annulée
    côté FedaPay ne peut pas être « relancée » via /token, ça mène à un blocage
    sur sandbox-process.fedapay.com) ou pour rattraper un webhook jamais reçu.
    """
    env = getattr(settings, 'FEDAPAY_ENVIRONMENT', 'sandbox')
    base = 'https://api.fedapay.com/v1' if env == 'live' else 'https://sandbox-api.fedapay.com/v1'
    headers = {'Authorization': f'Bearer {settings.FEDAPAY_SECRET_KEY}'}
    resp = requests.get(f'{base}/transactions/{transaction_id}', headers=headers, timeout=20)
    resp.raise_for_status()
    data = resp.json()
    return data.get('v1/transaction') or data.get('transaction') or data


def fetch_payment_url(transaction_id, env=None):
    """
    Redemande à FedaPay un lien de checkout valide pour une transaction déjà créée.
    Sert à la fois de repli si `create_transaction` ne renvoie pas payment_url
    directement, et à reprendre un paiement laissé en cours (retour arrière
    accidentel du client avant la fin du checkout).
    """
    env = env or getattr(settings, 'FEDAPAY_ENVIRONMENT', 'sandbox')
    base = 'https://api.fedapay.com/v1' if env == 'live' else 'https://sandbox-api.fedapay.com/v1'
    headers = {
        'Authorization': f'Bearer {settings.FEDAPAY_SECRET_KEY}',
        'Content-Type': 'application/json',
    }
    token_resp = requests.post(
        f'{base}/transactions/{transaction_id}/token',
        headers=headers,
        timeout=20,
    )
    print('FedaPay token response:', token_resp.text)
    token_resp.raise_for_status()
    token_data = token_resp.json()
    return (
        token_data.get('v1/transaction', {}).get('payment_url') or
        token_data.get('url')
    )


def verify_webhook_signature(raw_body: bytes, signature_header: str) -> bool:
    """Vérifie la signature HMAC-SHA256 envoyée par FedaPay (header X-Fedapay-Signature)."""
    if not signature_header:
        return False
    try:
        import fedapay  # noqa: F401 — kept for future SDK use
    except ImportError:
        pass
    secret = settings.FEDAPAY_WEBHOOK_SECRET.encode('utf-8')
    expected_hex = hmac_lib.new(secret, raw_body, hashlib.sha256).hexdigest()
    expected = f"sha256={expected_hex}"
    return hmac_lib.compare_digest(expected, signature_header)
