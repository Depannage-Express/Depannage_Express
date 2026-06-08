"""
Vide toutes les données de la base sauf les comptes administrateurs.
Usage : python manage.py purge_db
"""
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Supprime toutes les données sauf les comptes administrateurs."

    def handle(self, *args, **options):
        from apps.accounts.models import User
        from apps.breakdowns.models import BreakdownRequest, Message
        from apps.interventions.models import Intervention
        from apps.mechanics.models import (
            MechanicProfile, MechanicReview,
            MomoNumberChangeRequest, MechanicAdminMessage,
        )
        from apps.payments.models import PaymentTransaction, WithdrawalRequest
        from apps.premium.models import PremiumContactRequest
        from apps.otp.models import DriverOTP

        admin_ids = list(User.objects.filter(role='admin').values_list('id', flat=True))
        admin_emails = list(User.objects.filter(role='admin').values_list('email', flat=True))

        self.stdout.write(f"Admins conservés : {admin_emails}")

        with transaction.atomic():
            n = DriverOTP.objects.all().delete()[0]
            self.stdout.write(f"  DriverOTP supprimés : {n}")

            n = PremiumContactRequest.objects.all().delete()[0]
            self.stdout.write(f"  PremiumContactRequest supprimés : {n}")

            n = MechanicReview.objects.all().delete()[0]
            self.stdout.write(f"  MechanicReview supprimés : {n}")

            n = MechanicAdminMessage.objects.all().delete()[0]
            self.stdout.write(f"  MechanicAdminMessage supprimés : {n}")

            n = MomoNumberChangeRequest.objects.all().delete()[0]
            self.stdout.write(f"  MomoNumberChangeRequest supprimés : {n}")

            n = WithdrawalRequest.objects.all().delete()[0]
            self.stdout.write(f"  WithdrawalRequest supprimés : {n}")

            n = PaymentTransaction.objects.all().delete()[0]
            self.stdout.write(f"  PaymentTransaction supprimés : {n}")

            n = Message.objects.all().delete()[0]
            self.stdout.write(f"  Message supprimés : {n}")

            n = Intervention.objects.all().delete()[0]
            self.stdout.write(f"  Intervention supprimés : {n}")

            n = BreakdownRequest.objects.all().delete()[0]
            self.stdout.write(f"  BreakdownRequest supprimés : {n}")

            n = MechanicProfile.objects.all().delete()[0]
            self.stdout.write(f"  MechanicProfile supprimés : {n}")

            n = User.objects.exclude(id__in=admin_ids).delete()[0]
            self.stdout.write(f"  Utilisateurs non-admin supprimés : {n}")

        self.stdout.write(self.style.SUCCESS("\nBase de données purgée. Admins intacts."))
