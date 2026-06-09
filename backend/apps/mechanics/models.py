# apps/mechanics/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import TimestampedModel
from cloudinary.models import CloudinaryField


class Specialty(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'mechanics_specialty'
        verbose_name_plural = 'Specialties'

    def __str__(self):
        return self.name


class MechanicProfile(TimestampedModel):
    STATUS_CHOICES = [
        ('pending', 'En attente de validation'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
        ('suspended', 'Suspendu'),
    ]

    user = models.OneToOneField(
        'accounts.User', on_delete=models.CASCADE,
        related_name='mechanic_profile'
    )
    bio = models.TextField(blank=True)
    years_experience = models.PositiveSmallIntegerField(default=0)
    specialties = models.ManyToManyField(Specialty, blank=True, related_name='mechanics')

    # Localisation
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True, default='', verbose_name='Département')
    neighborhood = models.CharField(max_length=100, blank=True, default='', verbose_name='Quartier')
    country = models.CharField(max_length=100, default='Bénin')

    # Disponibilité
    is_available = models.BooleanField(default=True)
    available_from = models.TimeField(null=True, blank=True)
    available_to = models.TimeField(null=True, blank=True)
    works_weekends = models.BooleanField(default=True)

    # Documents
    id_card_front = CloudinaryField(
        'id_card_front',
        folder='depannage_express/documents',
        blank=True, null=True,
        resource_type='auto',
    )
    id_card_back = CloudinaryField(
        'id_card_back',
        folder='depannage_express/documents',
        blank=True, null=True,
        resource_type='auto',
    )
    certification_doc = CloudinaryField(
        'certification_doc',
        folder='depannage_express/documents',
        blank=True, null=True,
        resource_type='auto',
    )
    profile_photo = CloudinaryField(
        'profile_photo',
        folder='depannage_express/mechanics',
        blank=True, null=True,
        resource_type='auto',
    )

    # Validation admin
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    validated_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='validated_mechanics'
    )
    validated_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    # Statistiques
    total_interventions = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    total_reviews = models.PositiveIntegerField(default=0)

    # Identifiant court lisible (format MC00001)
    short_id = models.CharField(max_length=10, unique=True, blank=True, db_index=True)

    # Portefeuille virtuel
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Numéro de retrait MoMo (vide = utilise user.phone)
    withdrawal_number = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'mechanics_profile'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['is_available']),
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['city']),
        ]

    def save(self, *args, **kwargs):
        if not self.short_id:
            existing = MechanicProfile.objects.filter(
                short_id__startswith='MC'
            ).values_list('short_id', flat=True)
            max_num = 0
            for sid in existing:
                try:
                    max_num = max(max_num, int(sid[2:]))
                except (ValueError, IndexError):
                    pass
            self.short_id = f'MC{max_num + 1:05d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Profil de {self.user.full_name}"

    def update_rating(self, new_rating: float):
        """Recalcule la note moyenne."""
        from decimal import Decimal
        total = float(self.average_rating) * self.total_reviews + float(new_rating)
        self.total_reviews += 1
        self.average_rating = Decimal(str(round(total / self.total_reviews, 2)))
        self.save(update_fields=['average_rating', 'total_reviews'])


class MechanicReview(TimestampedModel):
    mechanic = models.ForeignKey(
        MechanicProfile, on_delete=models.CASCADE, related_name='reviews'
    )
    intervention = models.OneToOneField(
        'interventions.Intervention', on_delete=models.CASCADE,
        related_name='review', null=True, blank=True
    )
    reviewer_name = models.CharField(max_length=100)
    reviewer_phone_hash = models.CharField(max_length=64, blank=True)  # hashed
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    is_visible = models.BooleanField(default=True)

    class Meta:
        db_table = 'mechanics_review'
        indexes = [models.Index(fields=['mechanic', 'is_visible'])]

    def __str__(self):
        return f"Avis {self.rating}/5 pour {self.mechanic}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            self.mechanic.update_rating(float(self.rating))


class MomoNumberChangeRequest(TimestampedModel):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
    ]
    mechanic = models.ForeignKey(
        MechanicProfile, on_delete=models.CASCADE,
        related_name='momo_change_requests'
    )
    new_number = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_note = models.TextField(blank=True)
    processed_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='processed_momo_changes'
    )
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'mechanics_momo_change_request'
        ordering = ['-created_at']

    def __str__(self):
        return f"Changement MoMo {self.mechanic.user.full_name} → {self.new_number} [{self.status}]"


class MechanicAdminMessage(TimestampedModel):
    """Canal de messagerie 1-1 entre un mécanicien et l'administration."""
    SENDER_CHOICES = [
        ('mechanic', 'Mécanicien'),
        ('admin', 'Administrateur'),
    ]

    mechanic = models.ForeignKey(
        MechanicProfile, on_delete=models.CASCADE, related_name='admin_messages'
    )
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES)
    sender_name = models.CharField(max_length=150)
    content = models.TextField()

    class Meta:
        db_table = 'mechanics_admin_message'
        ordering = ['created_at']

    def __str__(self):
        return f"Message {self.sender_type} ↔ admin (mécanicien #{self.mechanic_id})"
