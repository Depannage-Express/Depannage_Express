from django.db import models
import uuid


class Incident(models.Model):

    GRAVITY_CHOICES = [
        ('low',    'Faible'),
        ('medium', 'Moyen'),
        ('high',   'Élevé'),
    ]

    STATUS_CHOICES = [
        ('pending',   'En attente'),
        ('resolved',  'Résolu'),
        ('rejected',  'Rejeté'),
        ('suspended', 'Suspendu'),
    ]

    TYPE_CHOICES = [
        ('abuse',   'Abus de langage'),
        ('delay',   'Retard important'),
        ('price',   'Problème de prix'),
        ('fraud',   'Fraude'),
        ('quality', 'Qualité du service'),
        ('review',  'Avis litigieux'),
        ('other',   'Autre'),
    ]

    EMITTER_TYPE_CHOICES = [
        ('driver',   'Conducteur'),
        ('mechanic', 'Mécanicien'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    intervention = models.ForeignKey(
        'interventions.Intervention',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='incidents',
    )
    emitter_type  = models.CharField(max_length=20, choices=EMITTER_TYPE_CHOICES)
    emitter_name  = models.CharField(max_length=200)
    target_name   = models.CharField(max_length=200)
    incident_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='other')
    gravity       = models.CharField(max_length=10, choices=GRAVITY_CHOICES, default='low')
    description   = models.TextField(blank=True)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_note    = models.TextField(blank=True, help_text='Note interne admin')
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return (
            f"Incident {self.incident_type} "
            f"— {self.emitter_name} → {self.target_name}"
        )
