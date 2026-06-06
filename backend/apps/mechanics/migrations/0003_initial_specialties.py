from django.db import migrations


SPECIALTIES = [
    ('Panne moteur',       'Diagnostic et réparation moteur toutes marques',   '🔧'),
    ('Crevaison / pneus',  'Changement et réparation de pneus sur place',       '🛞'),
    ('Panne électrique',   'Batterie, alternateur, démarreur, câblage',         '⚡'),
    ('Remorquage',         'Remorquage et dépannage sur route',                  '🚛'),
    ('Panne de carburant', 'Livraison de carburant et vidange de réservoir',    '⛽'),
    ('Climatisation',      'Recharge et réparation système de climatisation',   '❄️'),
    ('Transmission',       'Boîte de vitesses, embrayage, différentiel',        '⚙️'),
    ('Freins',             'Plaquettes, disques, liquide de frein',              '🛑'),
    ('Pneu crevé',         'Remplacement roue de secours sur place',            '🔩'),
    ('Dépannage général',  'Tout type de panne, diagnostic multi-marques',      '🏎️'),
]


def add_specialties(apps, schema_editor):
    Specialty = apps.get_model('mechanics', 'Specialty')
    for name, description, icon in SPECIALTIES:
        Specialty.objects.get_or_create(
            name=name,
            defaults={'description': description, 'icon': icon},
        )


def remove_specialties(apps, schema_editor):
    Specialty = apps.get_model('mechanics', 'Specialty')
    Specialty.objects.filter(name__in=[s[0] for s in SPECIALTIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('mechanics', '0002_mechanicadminmessage'),
    ]

    operations = [
        migrations.RunPython(add_specialties, reverse_code=remove_specialties),
    ]
