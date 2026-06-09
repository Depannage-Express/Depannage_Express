import hashlib
import hmac as hmac_lib

import requests
from django.conf import settings


def create_transaction(
    amount, description,
    customer_name, customer_phone,
    callback_url
):
    env = getattr(settings, 'FEDAPAY_ENVIRONMENT', 'sandbox')

    if env == 'live':
        base = 'https://api.fedapay.com/v1'
        checkout_base = 'https://app.fedapay.com/checkout'
    else:
        base = 'https://sandbox-api.fedapay.com/v1'
        checkout_base = 'https://sandbox.fedapay.com/checkout'

    headers = {
        'Authorization': f'Bearer {settings.FEDAPAY_SECRET_KEY}',
        'Content-Type': 'application/json',
    }

    payload = {
        'description': description,
        'amount': int(amount),
        'currency': {'iso': 'XOF'},
        'callback_url': callback_url,
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

    token_resp = requests.post(
        f'{base}/transactions/{transaction_id}/token',
        headers=headers,
        timeout=10,
    )

    print('FedaPay token response:', token_resp.text)
    token_resp.raise_for_status()

    token_data = token_resp.json()
    token = (
        token_data.get('v1/token', {}).get('token') or
        token_data.get('token') or
        token_data.get('v1/transaction', {}).get('token')
    )

    payment_url = f'{checkout_base}/{token}'

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
