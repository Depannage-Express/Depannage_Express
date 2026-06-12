from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Vide les données de démo en gardant les admins'

    def handle(self, *args, **options):
        with transaction.atomic():
            from apps.mechanics.models import MechanicReview, MomoNumberChangeRequest, MechanicAdminMessage, MechanicProfile
            from apps.breakdowns.models import Message, BreakdownRequest
            from apps.incidents.models import Incident
            from apps.payments.models import PaymentTransaction, WithdrawalRequest
            from apps.premium.models import PremiumContactRequest
            from apps.interventions.models import Intervention
            from apps.otp.models import DriverOTP
            from apps.accounts.models import User

            r1  = MechanicReview.objects.all().delete()
            r2  = MomoNumberChangeRequest.objects.all().delete()
            r3  = MechanicAdminMessage.objects.all().delete()
            r4  = Message.objects.all().delete()
            r5  = PaymentTransaction.objects.all().delete()
            r6  = WithdrawalRequest.objects.all().delete()
            r7  = PremiumContactRequest.objects.all().delete()
            r8  = Incident.objects.all().delete()
            r9  = Intervention.objects.all().delete()
            r10 = DriverOTP.objects.all().delete()
            r11 = BreakdownRequest.objects.all().delete()
            r12 = MechanicProfile.objects.all().delete()
            r13 = User.objects.exclude(role='admin').delete()

            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Base vidée :\n'
                    f'  Avis supprimés              : {r1[0]}\n'
                    f'  Demandes MOMO supprimées    : {r2[0]}\n'
                    f'  Messages admin supprimés    : {r3[0]}\n'
                    f'  Messages supprimés          : {r4[0]}\n'
                    f'  Paiements supprimés         : {r5[0]}\n'
                    f'  Retraits supprimés          : {r6[0]}\n'
                    f'  Demandes premium supprimées : {r7[0]}\n'
                    f'  Incidents supprimés         : {r8[0]}\n'
                    f'  Interventions supprimées    : {r9[0]}\n'
                    f'  OTPs supprimés              : {r10[0]}\n'
                    f'  Demandes supprimées         : {r11[0]}\n'
                    f'  Mécaniciens supprimés       : {r12[0]}\n'
                    f'  Users supprimés             : {r13[0]}\n'
                    f'  Admins conservés ✅'
                )
            )
