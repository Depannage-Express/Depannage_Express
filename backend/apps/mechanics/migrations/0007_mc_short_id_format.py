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
        migrations.RunSQL(
            sql="DROP INDEX IF EXISTS mechanics_profile_short_id_1cfb3b51_like;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterField(
            model_name='mechanicprofile',
            name='short_id',
            field=models.CharField(blank=True, db_index=True, max_length=10, unique=True),
        ),
        migrations.RunPython(reassign_mc_ids, migrations.RunPython.noop),
    ]
