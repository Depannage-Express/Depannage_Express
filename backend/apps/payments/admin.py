from django.contrib import admin
from .models import PaymentTransaction


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'payer_name', 'payer_phone', 'amount', 'currency', 'payment_for', 'status', 'paid_at', 'created_at')
    list_filter = ('status', 'payment_for', 'payment_method')
    search_fields = ('payer_name', 'payer_phone', 'provider_reference')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'paid_at')
    raw_id_fields = ('breakdown_request', 'intervention', 'mechanic')

    fieldsets = (
        ('Payeur', {'fields': ('payer_name', 'payer_phone')}),
        ('Transaction', {'fields': ('amount', 'currency', 'payment_method', 'payment_for', 'status', 'provider_reference', 'paid_at')}),
        ('Liens', {'fields': ('breakdown_request', 'intervention', 'mechanic')}),
        ('Métadonnées', {'fields': ('id', 'metadata', 'created_at', 'updated_at')}),
    )
