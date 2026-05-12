# apps/breakdowns/models.py
from django.db import models
from apps.core.models import TimestampedModel


class BreakdownRequest(TimestampedModel):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('assigned', 'Mécanicien assigné'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    ]

    # Driver info (no account needed)
    driver_name = models.CharField(max_length=150)
    driver_phone = models.CharField(max_length=20)
    driver_id_card = models.FileField(upload_to='breakdowns/id_cards/')
    driver_selfie = models.FileField(upload_to='breakdowns/selfies/')

    # Linked account (optional)
    driver_account = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='breakdown_requests'
    )

    # Vehicle & breakdown
    vehicle_description = models.CharField(max_length=200)
    vehicle_photo = models.FileField(upload_to='breakdowns/vehicles/')
    breakdown_description = models.TextField()
    breakdown_type = models.CharField(max_length=100, blank=True)
    specialty_requested = models.ForeignKey(
        'mechanics.Specialty', on_delete=models.SET_NULL,
        null=True, blank=True
    )

    # Location
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    address_description = models.TextField(blank=True)

    # Assignment
    assigned_mechanic = models.ForeignKey(
        'mechanics.MechanicProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_breakdowns'
    )
    assignment_distance_km = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    assigned_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Traceability
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        db_table = 'breakdowns_request'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['driver_phone']),
            models.Index(fields=['assigned_mechanic']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Demande #{self.id} - {self.driver_name} ({self.status})"
