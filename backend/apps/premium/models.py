# apps/premium/models.py
from django.db import models
from apps.core.models import TimestampedModel


class PremiumContactRequest(TimestampedModel):
    """
    Lorsqu'un visiteur veut contacter un mécanicien premium,
    il soumet un formulaire sécurisé. Le numéro n'est révélé
    qu'après validation de la demande.
    """
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
        ('expired', 'Expirée'),
    ]

    mechanic = models.ForeignKey(
        'mechanics.MechanicProfile', on_delete=models.CASCADE,
        related_name='contact_requests'
    )

    # Requester info
    requester_name = models.CharField(max_length=150)
    requester_phone = models.CharField(max_length=20)
    requester_reason = models.TextField()
    requester_ip = models.GenericIPAddressField(null=True, blank=True)
    requester_user_agent = models.TextField(blank=True)

    # Linked account (optional)
    requester_account = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='premium_contact_requests'
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_at = models.DateTimeField(null=True, blank=True)

    # Revealed contact (only after approval)
    contact_revealed_at = models.DateTimeField(null=True, blank=True)
    contact_reveal_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'premium_contact_request'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['mechanic', 'status']),
            models.Index(fields=['requester_ip']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Contact premium {self.requester_name} → {self.mechanic}"