# apps/breakdowns/models.py
import uuid
from django.db import models
from apps.core.models import TimestampedModel
from cloudinary.models import CloudinaryField


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
    driver_phone = models.CharField(max_length=15)
    # Jeton opaque remis au conducteur à la création — requis pour toute action driver
    driver_token = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
    driver_id_card = CloudinaryField(
        'driver_id_card',
        folder='depannage_express/breakdowns',
        resource_type='auto',
    )
    driver_selfie = CloudinaryField(
        'driver_selfie',
        folder='depannage_express/breakdowns',
        resource_type='auto',
    )

    # Linked account (optional)
    driver_account = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='breakdown_requests'
    )

    VEHICLE_TYPE_CHOICES = [
        ('moto', 'Moto'),
        ('tricycle', 'Tricycle'),
        ('voiture', 'Voiture'),
        ('camion', 'Camion'),
        ('bus', 'Bus'),
        ('camionnette', 'Camionnette'),
        ('autre', 'Autre'),
    ]

    # Vehicle & breakdown
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES, blank=True)
    vehicle_brand = models.CharField(max_length=100, blank=True)
    vehicle_description = models.CharField(max_length=200)
    vehicle_photo = CloudinaryField(
        'vehicle_photo',
        folder='depannage_express/breakdowns',
        resource_type='auto',
    )
    breakdown_description = models.TextField()
    breakdown_type = models.CharField(max_length=500, blank=True)
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

    # Refusal tracking
    refusal_count = models.PositiveIntegerField(default=0)
    refused_mechanic_ids = models.JSONField(default=list, blank=True)

    # Search phase (timeout escalation: 1=10km, 2=20km, 3=50km, 4=broadcast)
    search_phase = models.IntegerField(default=1)
    phase_started_at = models.DateTimeField(null=True, blank=True)

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


class Message(TimestampedModel):
    SENDER_CHOICES = [
        ('driver', 'Conducteur'),
        ('mechanic', 'Mécanicien'),  # conservé pour données existantes
        ('admin', 'Administrateur'),
    ]

    breakdown_request = models.ForeignKey(
        BreakdownRequest, on_delete=models.CASCADE, related_name='messages'
    )
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES)
    sender_name = models.CharField(max_length=150)
    content = models.TextField()

    class Meta:
        db_table = 'breakdowns_message'
        ordering = ['created_at']

    def __str__(self):
        return f"Message {self.sender_type} → demande #{self.breakdown_request_id}"
