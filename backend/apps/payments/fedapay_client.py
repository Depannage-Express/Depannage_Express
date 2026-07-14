import hashlib
import hmac as hmac_lib
from urllib.parse import urlencode

import requests
from django.conf import settings


def create_transaction(
    amount, description,
    customer_name, customer_phone,
    callback_url,
    breakdown_id=None,
    return_params=None,
):
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
        'callback_url': callback_url,
        'return_url': f'{frontend_base}?{urlencode(return_params)}',
        'cancel_url': f'{frontend_base}?payment_cancelled=1',
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
        timeout=10,
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
    payment_url = transaction.get('payment_url')

    if not payment_url:
        # Repli si l'API ne renvoie pas payment_url directement (ancien comportement observé)
        token_resp = requests.post(
            f'{base}/transactions/{transaction_id}/token',
            headers=headers,
            timeout=10,
        )
        print('FedaPay token response:', token_resp.text)
        token_resp.raise_for_status()
        token_data = token_resp.json()
        payment_url = (
            token_data.get('v1/transaction', {}).get('payment_url') or
            token_data.get('url')
        )

    return {
        'transaction_id': str(transaction_id),
        'payment_url': payment_url,
        'status': transaction.get('status', 'pending'),
    }


def verify_webhook_signature(raw_body: bytes, signature_header: str) -> bool:
    """Vérifie la signature HMAC-SHA256 envoyée par FedaPay (header X-Fedapay-Signature)."""
    if not signature_header:
        return False
    try:
        import fedapay  # noqa: F401 — kept for future SDK use
    except ImportError:
        pass
    secret = settings.FEDAPAY_SECRET_KEY.encode('utf-8')
    expected_hex = hmac_lib.new(secret, raw_body, hashlib.sha256).hexdigest()
    expected = f"sha256={expected_hex}"
    return hmac_lib.compare_digest(expected, signature_header)
