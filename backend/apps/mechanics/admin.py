from django.contrib import admin
from .models import MechanicProfile, Specialty, MechanicReview


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'icon')
    search_fields = ('name',)


@admin.register(MechanicProfile)
class MechanicProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'status', 'is_available', 'average_rating', 'total_interventions', 'created_at')
    list_filter = ('status', 'is_available', 'works_weekends')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'city')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'validated_at', 'total_interventions', 'average_rating', 'total_reviews')
    filter_horizontal = ('specialties',)
    raw_id_fields = ('user',)

    fieldsets = (
        ('Compte', {'fields': ('user', 'bio', 'profile_photo')}),
        ('Spécialités & expérience', {'fields': ('specialties', 'years_experience')}),
        ('Localisation', {'fields': ('latitude', 'longitude', 'address', 'city', 'country')}),
        ('Disponibilité', {'fields': ('is_available', 'available_from', 'available_to', 'works_weekends')}),
        ('Documents', {'fields': ('id_card_front', 'id_card_back', 'certification_doc')}),
        ('Validation', {'fields': ('status', 'validated_at', 'rejection_reason')}),
        ('Statistiques', {'fields': ('total_interventions', 'average_rating', 'total_reviews')}),
        ('Métadonnées', {'fields': ('id', 'created_at', 'updated_at')}),
    )


@admin.register(MechanicReview)
class MechanicReviewAdmin(admin.ModelAdmin):
    list_display = ('mechanic', 'reviewer_name', 'rating', 'is_visible', 'created_at')
    list_filter = ('rating', 'is_visible')
    search_fields = ('reviewer_name', 'comment')
    ordering = ('-created_at',)
