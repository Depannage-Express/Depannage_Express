import random
from datetime import timedelta

from django.db import models
from django.utils import timezone


class DriverOTP(models.Model):
    phone = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'otp_driver_otp'
        indexes = [models.Index(fields=['phone', 'is_used', 'expires_at'])]

    @classmethod
    def create_for_phone(cls, phone):
        cls.objects.filter(phone=phone, is_used=False).update(is_used=True)
        code = f"{random.randint(100000, 999999)}"
        return cls.objects.create(
            phone=phone,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()
