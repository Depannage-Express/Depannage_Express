from decimal import Decimal, ROUND_DOWN

from django.conf import settings

FALLBACK_LABEL = 'Autre panne'


def compute_breakdown_amount(breakdown_type):
    """
    Montant total d'une demande à partir des pannes sélectionnées.

    `breakdown_type` est une liste de libellés séparés par ', ' (le conducteur
    peut cocher plusieurs pannes dans le formulaire). Chaque panne a son
    propre tarif (settings.BREAKDOWN_PRICING) ; la plus chère est facturée
    plein tarif, chacune des suivantes bénéficie d'une réduction de 20%.
    """
    labels = [label.strip() for label in (breakdown_type or '').split(',') if label.strip()]
    if not labels:
        labels = [FALLBACK_LABEL]

    fallback_price = settings.BREAKDOWN_PRICING[FALLBACK_LABEL]
    prices = sorted(
        (Decimal(str(settings.BREAKDOWN_PRICING.get(label, fallback_price))) for label in labels),
        reverse=True,
    )

    total = prices[0]
    for price in prices[1:]:
        discounted = (price * (Decimal('1') - settings.REPEAT_BREAKDOWN_DISCOUNT_RATE)).quantize(
            Decimal('1'), rounding=ROUND_DOWN
        )
        total += discounted

    return total
