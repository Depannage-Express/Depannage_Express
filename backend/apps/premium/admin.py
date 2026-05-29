from django.contrib import admin
from .models import PremiumContactRequest


@admin.register(PremiumContactRequest)
class PremiumContactRequestAdmin(admin.ModelAdmin):
    list_display = ('requester_name', 'requester_phone', 'mechanic', 'status', 'contact_reveal_count', 'created_at')
    list_filter = ('status',)
    search_fields = ('requester_name', 'requester_phone', 'mechanic__user__email')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'reviewed_at', 'contact_revealed_at', 'requester_ip', 'requester_user_agent')
    raw_id_fields = ('mechanic', 'requester_account')

    fieldsets = (
        ('Demandeur', {'fields': ('requester_name', 'requester_phone', 'requester_reason', 'requester_account', 'requester_ip', 'requester_user_agent')}),
        ('Mécanicien ciblé', {'fields': ('mechanic',)}),
        ('Statut', {'fields': ('status', 'reviewed_at', 'contact_revealed_at', 'contact_reveal_count')}),
        ('Métadonnées', {'fields': ('id', 'created_at', 'updated_at')}),
    )
