from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interventions', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='intervention',
            name='driver_confirmed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='intervention',
            name='driver_confirmed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
