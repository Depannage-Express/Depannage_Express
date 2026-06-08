from django.db import migrations, models


def reassign_mc_ids(apps, schema_editor):
    MechanicProfile = apps.get_model('mechanics', 'MechanicProfile')
    profiles = list(MechanicProfile.objects.all().order_by('created_at'))
    for i, profile in enumerate(profiles, start=1):
        profile.short_id = f'MC{i:05d}'
        profile.save(update_fields=['short_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('mechanics', '0006_add_short_id'),
    ]

    operations = [
        # Pas d'opération DB : l'AlterField (varchar 8→10) déclenchait un double
        # CREATE INDEX _like sur PostgreSQL. MC00001 = 7 chars, ça tient dans varchar(8).
        # On met à jour uniquement l'état Django interne.
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name='mechanicprofile',
                    name='short_id',
                    field=models.CharField(blank=True, db_index=True, max_length=10, unique=True),
                ),
            ],
        ),
        migrations.RunPython(reassign_mc_ids, migrations.RunPython.noop),
    ]
