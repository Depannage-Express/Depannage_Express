from django.contrib import admin
from .models import BreakdownRequest


@admin.register(BreakdownRequest)
class BreakdownRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'driver_name', 'driver_phone', 'breakdown_type', 'status', 'assigned_mechanic', 'assignment_distance_km', 'created_at')
    list_filter = ('status',)
    search_fields = ('driver_name', 'driver_phone', 'breakdown_description')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'ip_address', 'user_agent', 'assigned_at')
    raw_id_fields = ('assigned_mechanic', 'driver_account', 'specialty_requested')

    fieldsets = (
        ('Conducteur', {'fields': ('driver_name', 'driver_phone', 'driver_id_card', 'driver_selfie', 'driver_account')}),
        ('Véhicule & panne', {'fields': ('vehicle_description', 'vehicle_photo', 'breakdown_description', 'breakdown_type', 'specialty_requested')}),
        ('Localisation', {'fields': ('latitude', 'longitude', 'address_description')}),
        ('Assignation', {'fields': ('status', 'assigned_mechanic', 'assignment_distance_km', 'assigned_at')}),
        ('Métadonnées', {'fields': ('id', 'ip_address', 'user_agent', 'created_at', 'updated_at')}),
    )
