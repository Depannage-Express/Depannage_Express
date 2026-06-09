import hashlib
import hmac as hmac_lib

import fedapay as feda_sdk
from django.conf import settings


def _init():
    feda_sdk.api_key = settings.FEDAPAY_SECRET_KEY
    feda_sdk.environment = settings.FEDAPAY_ENVIRONMENT


def create_transaction(description: str, amount: int, callback_url: str, payer_phone: str) -> tuple[str, str]:
    """
    Crée une transaction FedaPay et retourne (transaction_id, payment_url).
    Lève une exception en cas d'échec SDK.
    """
    _init()
    transaction = feda_sdk.Transaction.create(
        description=description,
        amount=int(amount),
        currency={'iso': 'XOF'},
        callback_url=callback_url,
        customer={
            'phone_number': {
                'number': payer_phone,
                'country': 'BJ',
            }
        },
    )
    token = transaction.generateToken()
    return str(transaction.id), token.url


def verify_webhook_signature(raw_body: bytes, signature_header: str) -> bool:
    """Vérifie la signature HMAC-SHA256 envoyée par FedaPay (header X-Fedapay-Signature)."""
    if not signature_header:
        return False
    secret = settings.FEDAPAY_SECRET_KEY.encode('utf-8')
    expected_hex = hmac_lib.new(secret, raw_body, hashlib.sha256).hexdigest()
    expected = f"sha256={expected_hex}"
    return hmac_lib.compare_digest(expected, signature_header)
