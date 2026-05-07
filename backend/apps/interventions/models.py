# apps/interventions/models.py
from django.db import models
from apps.core.models import TimestampedModel


class Intervention(TimestampedModel):
    STATUS_CHOICES = [
        ('pending_acceptance', 'En attente d\'acceptation'),
        ('accepted', 'Acceptée'),
        ('refused', 'Refusée'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('disputed', 'Litigieuse'),
        ('cancelled', 'Annulée'),
    ]

    breakdown_request = models.OneToOneField(
        'breakdowns.BreakdownRequest', on_delete=models.CASCADE,
        related_name='intervention'
    )
    mechanic = models.ForeignKey(
        'mechanics.MechanicProfile', on_delete=models.PROTECT,
        related_name='interventions'
    )

    status = models.CharField(
        max_length=25, choices=STATUS_CHOICES, default='pending_acceptance'
    )

    # Acceptance
    accepted_at = models.DateTimeField(null=True, blank=True)
    refused_at = models.DateTimeField(null=True, blank=True)
    refusal_reason = models.TextField(blank=True)

    # Progress
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Results
    mechanic_notes = models.TextField(blank=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    final_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Proof
    before_photo = models.ImageField(upload_to='interventions/photos/', null=True, blank=True)
    after_photo = models.ImageField(upload_to='interventions/photos/', null=True, blank=True)

    class Meta:
        db_table = 'interventions_intervention'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['mechanic', 'status']),
        ]

    def __str__(self):
        return f"Intervention #{self.id} - {self.status}"