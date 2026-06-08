from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('breakdowns', '0009_search_phase_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='breakdownrequest',
            name='vehicle_type',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('moto', 'Moto'),
                    ('tricycle', 'Tricycle'),
                    ('voiture', 'Voiture'),
                    ('camion', 'Camion'),
                    ('bus', 'Bus'),
                    ('camionnette', 'Camionnette'),
                    ('autre', 'Autre'),
                ],
                blank=True,
                default='',
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='breakdownrequest',
            name='vehicle_brand',
            field=models.CharField(max_length=100, blank=True, default=''),
            preserve_default=False,
        ),
    ]
