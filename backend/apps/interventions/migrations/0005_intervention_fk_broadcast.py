import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('breakdowns', '0006_breakdown_refusal_tracking'),
        ('interventions', '0004_add_driver_token_and_paid_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='intervention',
            name='breakdown_request',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='interventions',
                to='breakdowns.breakdownrequest',
            ),
        ),
    ]
