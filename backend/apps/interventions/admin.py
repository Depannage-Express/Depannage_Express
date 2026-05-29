from django.contrib import admin
from .models import Intervention


@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    list_display = ('id', 'breakdown_request', 'mechanic', 'status', 'estimated_cost', 'final_cost', 'created_at')
    list_filter = ('status',)
    search_fields = ('mechanic__user__email', 'mechanic__user__first_name')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'accepted_at', 'refused_at', 'started_at', 'completed_at')
    raw_id_fields = ('breakdown_request', 'mechanic')

    fieldsets = (
        ('Liens', {'fields': ('breakdown_request', 'mechanic')}),
        ('Statut', {'fields': ('status', 'accepted_at', 'refused_at', 'refusal_reason', 'started_at', 'completed_at')}),
        ('Résultat', {'fields': ('mechanic_notes', 'estimated_cost', 'final_cost', 'before_photo', 'after_photo')}),
        ('Métadonnées', {'fields': ('id', 'created_at', 'updated_at')}),
    )
