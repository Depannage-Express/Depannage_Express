from django.db import models

from apps.core.models import TimestampedModel


class PaymentTransaction(TimestampedModel):
    PAYMENT_FOR_CHOICES = [
        ('intervention', 'Intervention standard'),
        ('premium_subscription', 'Abonnement premium'),
    ]

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('authorized', 'Autorise'),
        ('paid', 'Paye'),
        ('failed', 'Echoue'),
        ('refunded', 'Rembourse'),
        ('cancelled', 'Annule'),
    ]

    payer_name = models.CharField(max_length=150)
    payer_phone = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='XOF')
    payment_method = models.CharField(max_length=50)
    payment_for = models.CharField(max_length=30, choices=PAYMENT_FOR_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    breakdown_request = models.ForeignKey(
        'breakdowns.BreakdownRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
    )
    intervention = models.ForeignKey(
        'interventions.Intervention',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
    )
    mechanic = models.ForeignKey(
        'mechanics.MechanicProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
    )

    provider_reference = models.CharField(max_length=120, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'payments_transaction'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['payment_for']),
            models.Index(fields=['payer_phone']),
            models.Index(fields=['provider_reference']),
        ]

    def __str__(self):
        return f"Paiement {self.id} - {self.payment_for} - {self.status}"
