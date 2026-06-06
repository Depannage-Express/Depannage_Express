from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('breakdowns', '0005_alter_message_sender_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='breakdownrequest',
            name='refusal_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='breakdownrequest',
            name='refused_mechanic_ids',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
