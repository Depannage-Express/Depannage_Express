# apps/mechanics/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import TimestampedModel


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
    country = models.CharField(max_length=100, default='Bénin')

    # Disponibilité
    is_available = models.BooleanField(default=True)
    available_from = models.TimeField(null=True, blank=True)
    available_to = models.TimeField(null=True, blank=True)
    works_weekends = models.BooleanField(default=True)

    # Documents
    id_card_front = models.FileField(upload_to='mechanics/id_cards/', null=True, blank=True)
    id_card_back = models.FileField(upload_to='mechanics/id_cards/', null=True, blank=True)
    certification_doc = models.FileField(upload_to='mechanics/certifications/', null=True, blank=True)
    profile_photo = models.FileField(upload_to='mechanics/photos/', null=True, blank=True)

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

    class Meta:
        db_table = 'mechanics_profile'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['is_available']),
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['city']),
        ]

    def __str__(self):
        return f"Profil de {self.user.full_name}"

    def update_rating(self, new_rating: float):
        """Recalcule la note moyenne."""
        total = self.average_rating * self.total_reviews + new_rating
        self.total_reviews += 1
        self.average_rating = round(total / self.total_reviews, 2)
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
