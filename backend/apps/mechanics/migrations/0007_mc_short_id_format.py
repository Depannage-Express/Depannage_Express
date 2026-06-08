from django.db import migrations, models


def alter_short_id_postgres(apps, schema_editor):
    # SQLite ne supporte pas ALTER COLUMN TYPE ni varchar_pattern_ops
    if schema_editor.connection.vendor != 'postgresql':
        return
    schema_editor.execute(
        "DROP INDEX IF EXISTS mechanics_profile_short_id_1cfb3b51_like"
    )
    schema_editor.execute(
        "ALTER TABLE mechanics_profile ALTER COLUMN short_id TYPE varchar(10)"
    )
    schema_editor.execute(
        "CREATE INDEX IF NOT EXISTS mechanics_profile_short_id_1cfb3b51_like"
        " ON mechanics_profile (short_id varchar_pattern_ops)"
    )


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
        # Gestion manuelle de l'AlterField pour éviter le double CREATE INDEX _like
        # que Django génère quand db_index=True + unique=True sont tous les deux présents.
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    alter_short_id_postgres,
                    migrations.RunPython.noop,
                ),
            ],
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
