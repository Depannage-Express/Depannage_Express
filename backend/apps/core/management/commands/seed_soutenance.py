"""
Management command: seed_soutenance
Génère les données de soutenance pour DépannageExpress.
Au moins 20 entrées par table métier.

Usage:
    python manage.py seed_soutenance
"""
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_DOWN
import math
import random

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.breakdowns.models import BreakdownRequest, Message
from apps.geolocation.utils import is_agglomeration_zone
from apps.incidents.models import Incident
from apps.interventions.models import Intervention
from apps.mechanics.models import MechanicAdminMessage, MechanicProfile, MechanicReview, Specialty
from apps.otp.models import DriverOTP
from apps.payments.models import PaymentTransaction, WithdrawalRequest
from apps.premium.models import PremiumContactRequest


ADMIN_EMAIL = 'admin.soutenance@depannage.bj'
ADMIN_PASSWORD = 'Admin@2024!'
DRIVER_PASSWORD = 'Driver@2024!'
MECHANIC_PASSWORD = 'Mechanic@2024!'

# Fenêtre de dates des données de démo : 10/06/2026 → 16/07/2026 (36 jours).
# Ancrée sur une date fixe (pas timezone.now()) pour que les données restent
# cohérentes quelle que soit l'heure réelle à laquelle le script est lancé —
# sinon tout se retrouve collé à l'heure d'exécution (souvent la nuit).
SEED_TODAY = timezone.make_aware(datetime(2026, 7, 16, 12, 0))
SEED_WINDOW_DAYS = 36
_OLD_MAX_DAYS_AGO = 58  # échelle d'origine des BREAKDOWNS_DATA, pour reproportionner


def _scale_days_ago(days_ago):
    """Reproportionne un days_ago pensé sur 0-58 jours vers la fenêtre 0-36 jours."""
    return round(days_ago * SEED_WINDOW_DAYS / _OLD_MAX_DAYS_AGO)


def _daytime_hour():
    """Heure réaliste : très majoritairement le jour, la nuit reste rare."""
    if random.random() < 0.88:
        return random.randint(7, 20)
    return random.choice([21, 22, 23, 0, 1, 2, 3, 4, 5, 6])


def _seeded_datetime(days_ago, hour=None, minute=None):
    """Date/heure dans la fenêtre SEED_TODAY - SEED_WINDOW_DAYS, indépendante
    de l'heure réelle d'exécution du script."""
    days_ago = max(0, min(days_ago, SEED_WINDOW_DAYS))
    h = hour if hour is not None else _daytime_hour()
    m = minute if minute is not None else random.randint(0, 59)
    return (SEED_TODAY - timedelta(days=days_ago)).replace(hour=h, minute=m, second=random.randint(0, 59))


def _haversine(lat1, lon1, lat2, lon2):
    """Distance en km entre deux points GPS (formule haversine)."""
    R = 6371.0
    dlat = math.radians(float(lat2) - float(lat1))
    dlon = math.radians(float(lon2) - float(lon1))
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(float(lat1)))
         * math.cos(math.radians(float(lat2)))
         * math.sin(dlon / 2) ** 2)
    return round(R * 2 * math.asin(math.sqrt(a)), 2)


# ── SPÉCIALITÉS (20) ──────────────────────────────────────────────────────────
SPECIALTIES_DATA = [
    {'name': 'Panne moteur',                    'description': 'Diagnostic et réparation des pannes moteur',           'icon': 'engine'},
    {'name': 'Crevaison / Pneus',               'description': 'Changement et réparation de pneus crevés',             'icon': 'tire'},
    {'name': 'Panne électrique',                'description': 'Diagnostics et réparations des circuits électriques',  'icon': 'zap'},
    {'name': 'Panne de carburant',              'description': 'Assistance en cas de panne sèche ou fuite carburant',  'icon': 'fuel'},
    {'name': 'Problème de démarrage',           'description': 'Batterie, démarreur, alternateur et allumage',         'icon': 'key'},
    {'name': 'Climatisation',                   'description': 'Entretien et réparation du système de climatisation',  'icon': 'wind'},
    {'name': 'Transmission / Boîte de vitesses','description': 'Réparation boîte de vitesses et transmission',        'icon': 'gear'},
    {'name': 'Freins',                          'description': 'Remplacement plaquettes, disques et étriers',          'icon': 'disc'},
    {'name': 'Remorquage',                      'description': 'Service de remorquage toutes distances',               'icon': 'truck'},
    {'name': 'Dépannage général',               'description': 'Dépannage polyvalent toutes marques',                  'icon': 'wrench'},
    {'name': 'Carrosserie',                     'description': 'Débosselage, soudure et tôlerie',                      'icon': 'car'},
    {'name': 'Suspension / Amortisseurs',       'description': 'Remplacement amortisseurs et train roulant',           'icon': 'spring'},
    {'name': 'Système de refroidissement',      'description': 'Radiateur, thermostat et circuit de refroidissement',  'icon': 'thermometer'},
    {'name': 'Direction assistée',              'description': 'Réparation direction hydraulique et électrique',       'icon': 'steering'},
    {'name': 'Diagnostic électronique',         'description': 'Lecture codes erreurs et diagnostic OBD',              'icon': 'cpu'},
    {'name': 'Vidange / Entretien courant',     'description': 'Vidange, filtres et entretien périodique',             'icon': 'oil'},
    {'name': 'Éclairage / Phares',              'description': 'Réparation phares, feux et signalisation',             'icon': 'lightbulb'},
    {'name': 'Échappement',                     'description': "Réparation et remplacement du système d'échappement",  'icon': 'wind-arrow'},
    {'name': 'Injection / Carburateur',         'description': "Nettoyage et réglage du système d'injection",          'icon': 'droplet'},
    {'name': 'Antivol / Démarrage électronique','description': 'Diagnostic antidémarrage et systèmes antivol',         'icon': 'lock'},
]

# ── MÉCANICIENS (20) ──────────────────────────────────────────────────────────
MECHANICS_DATA = [
    # 0 — premium
    {
        'email': 'koffi.mensah@depannage.bj',
        'first_name': 'Koffi', 'last_name': 'Mensah',
        'phone': '+22997100001',
        'lat': Decimal('6.3654'), 'lng': Decimal('2.4183'),
        'city': 'Cotonou', 'dept': 'Littoral', 'neighborhood': 'Cadjehoun',
        'status': 'approved', 'is_premium': True, 'years_experience': 8,
        'specialties': ['Panne moteur', 'Dépannage général'],
        'bio': 'Mécanicien expérimenté spécialisé moteurs diesel et essence.',
    },
    # 1 — premium
    {
        'email': 'abdoulaye.idrissou@depannage.bj',
        'first_name': 'Abdoulaye', 'last_name': 'Idrissou',
        'phone': '+22997100002',
        'lat': Decimal('9.3370'), 'lng': Decimal('2.6280'),
        'city': 'Parakou', 'dept': 'Borgou', 'neighborhood': 'Kpébié',
        'status': 'approved', 'is_premium': True, 'years_experience': 12,
        'specialties': ['Panne électrique', 'Diagnostic électronique'],
        'bio': "Expert en pannes électriques et systèmes d'allumage.",
    },
    # 2 — standard
    {
        'email': 'marcellin.boffi@depannage.bj',
        'first_name': 'Marcellin', 'last_name': 'Boffi',
        'phone': '+22997100003',
        'lat': Decimal('6.3676'), 'lng': Decimal('2.3915'),
        'city': 'Cotonou', 'dept': 'Littoral', 'neighborhood': 'Akpakpa',
        'status': 'approved', 'is_premium': False, 'years_experience': 5,
        'specialties': ['Crevaison / Pneus', 'Remorquage'],
        'bio': 'Spécialiste crevaisons, intervention rapide.',
    },
    # 3 — standard
    {
        'email': 'seraphin.houessou@depannage.bj',
        'first_name': 'Séraphin', 'last_name': 'Houessou',
        'phone': '+22997100004',
        'lat': Decimal('6.4969'), 'lng': Decimal('2.6289'),
        'city': 'Abomey-Calavi', 'dept': 'Atlantique', 'neighborhood': 'Godomey',
        'status': 'approved', 'is_premium': False, 'years_experience': 7,
        'specialties': ['Dépannage général', 'Freins'],
        'bio': 'Mécanicien polyvalent disponible 24h/24.',
    },
    # 4 — standard
    {
        'email': 'toussaint.dossou@depannage.bj',
        'first_name': 'Toussaint', 'last_name': 'Dossou',
        'phone': '+22997100005',
        'lat': Decimal('7.1671'), 'lng': Decimal('2.0854'),
        'city': 'Lokossa', 'dept': 'Mono', 'neighborhood': 'Lokossa Centre',
        'status': 'approved', 'is_premium': True, 'years_experience': 10,
        'specialties': ['Transmission / Boîte de vitesses', 'Suspension / Amortisseurs'],
        'bio': 'Expert transmission et boîte de vitesses.',
    },
    # 5 — premium
    {
        'email': 'ibrahim.chabi@depannage.bj',
        'first_name': 'Ibrahim', 'last_name': 'Chabi',
        'phone': '+22997100006',
        'lat': Decimal('10.3003'), 'lng': Decimal('1.3878'),
        'city': 'Kandi', 'dept': 'Alibori', 'neighborhood': 'Kandi Centre',
        'status': 'approved', 'is_premium': True, 'years_experience': 6,
        'specialties': ['Climatisation', 'Système de refroidissement'],
        'bio': 'Spécialiste climatisation et refroidissement.',
    },
    # 6 — standard
    {
        'email': 'gerard.ahouansou@depannage.bj',
        'first_name': 'Gérard', 'last_name': 'Ahouansou',
        'phone': '+22997100007',
        'lat': Decimal('6.3676'), 'lng': Decimal('2.4266'),
        'city': 'Cotonou', 'dept': 'Littoral', 'neighborhood': 'Fidjrossè',
        'status': 'approved', 'is_premium': False, 'years_experience': 4,
        'specialties': ['Panne de carburant', 'Problème de démarrage'],
        'bio': 'Spécialiste pannes carburant.',
    },
    # 7 — standard
    {
        'email': 'patrice.lokossou@depannage.bj',
        'first_name': 'Patrice', 'last_name': 'Lokossou',
        'phone': '+22997100008',
        'lat': Decimal('6.3545'), 'lng': Decimal('2.4183'),
        'city': 'Cotonou', 'dept': 'Littoral', 'neighborhood': 'Agla',
        'status': 'approved', 'is_premium': False, 'years_experience': 9,
        'specialties': ['Direction assistée', 'Freins'],
        'bio': 'Expert direction et freinage.',
    },
    # 8 — premium
    {
        'email': 'moussa.zakari@depannage.bj',
        'first_name': 'Moussa', 'last_name': 'Zakari',
        'phone': '+22997100009',
        'lat': Decimal('9.3500'), 'lng': Decimal('2.6200'),
        'city': 'Parakou', 'dept': 'Borgou', 'neighborhood': 'Albarika',
        'status': 'approved', 'is_premium': True, 'years_experience': 15,
        'specialties': ['Diagnostic électronique', 'Panne moteur'],
        'bio': "Senior mécanicien, 15 ans d'expérience.",
    },
    # 9 — standard
    {
        'email': 'felix.agbossou@depannage.bj',
        'first_name': 'Félix', 'last_name': 'Agbossou',
        'phone': '+22997100010',
        'lat': Decimal('6.3700'), 'lng': Decimal('2.3900'),
        'city': 'Cotonou', 'dept': 'Littoral', 'neighborhood': 'Gbégamey',
        'status': 'approved', 'is_premium': True, 'years_experience': 3,
        'specialties': ['Carrosserie', 'Dépannage général'],
        'bio': 'Spécialiste carrosserie et tôlerie.',
    },
    # 10 — standard
    {
        'email': 'stanislas.dedenou@depannage.bj',
        'first_name': 'Stanislas', 'last_name': 'Dèdènou',
        'phone': '+22997100011',
        'lat': Decimal('7.2000'), 'lng': Decimal('2.3500'),
        'city': 'Bohicon', 'dept': 'Zou', 'neighborhood': 'Bohicon Centre',
        'status': 'approved', 'is_premium': False, 'years_experience': 11,
        'specialties': ['Remorquage', 'Panne moteur'],
        'bio': 'Service de remorquage disponible 24h/24.',
    },
    # 11 — standard
    {
        'email': 'cyrille.gbaguidi@depannage.bj',
        'first_name': 'Cyrille', 'last_name': 'Gbaguidi',
        'phone': '+22997100012',
        'lat': Decimal('6.4700'), 'lng': Decimal('2.6100'),
        'city': 'Abomey-Calavi', 'dept': 'Atlantique', 'neighborhood': 'Akassato',
        'status': 'approved', 'is_premium': True, 'years_experience': 6,
        'specialties': ['Panne électrique', 'Problème de démarrage'],
        'bio': 'Électricien auto certifié.',
    },
    # 12 — pending
    {
        'email': 'alphonse.senou@depannage.bj',
        'first_name': 'Alphonse', 'last_name': 'Sènou',
        'phone': '+22997100013',
        'lat': Decimal('6.3600'), 'lng': Decimal('2.4300'),
        'city': 'Cotonou', 'dept': 'Littoral', 'neighborhood': 'Mènontin',
        'status': 'pending', 'is_premium': False, 'years_experience': 2,
        'specialties': ['Crevaison / Pneus'],
        'bio': 'En attente de validation administrative.',
    },
    # 13 — pending
    {
        'email': 'theodore.kpakpo@depannage.bj',
        'first_name': 'Théodore', 'last_name': 'Kpakpo',
        'phone': '+22997100014',
        'lat': Decimal('8.9900'), 'lng': Decimal('2.4800'),
        'city': 'Djougou', 'dept': 'Donga', 'neighborhood': 'Djougou Centre',
        'status': 'pending', 'is_premium': False, 'years_experience': 5,
        'specialties': ['Dépannage général'],
        'bio': 'Mécanicien du nord Bénin, en cours de validation.',
    },
    # 14 — rejected
    {
        'email': 'lionel.assogba@depannage.bj',
        'first_name': 'Lionel', 'last_name': 'Assogba',
        'phone': '+22997100015',
        'lat': Decimal('6.3500'), 'lng': Decimal('2.4200'),
        'city': 'Cotonou', 'dept': 'Littoral', 'neighborhood': 'Jéricho',
        'status': 'rejected', 'is_premium': False, 'years_experience': 1,
        'specialties': [],
        'bio': 'Profil refusé — documents non conformes.',
    },
    # 15 — standard
    {
        'email': 'emile.houenassou@depannage.bj',
        'first_name': 'Émile', 'last_name': 'Houénassou',
        'phone': '+22997100016',
        'lat': Decimal('6.4966'), 'lng': Decimal('2.6289'),
        'city': 'Porto-Novo', 'dept': 'Ouémé', 'neighborhood': 'Ouando',
        'status': 'approved', 'is_premium': False, 'years_experience': 9,
        'specialties': ['Vidange / Entretien courant', 'Freins'],
        'bio': 'Entretien courant et vidange, intervention à domicile.',
    },
    # 16 — standard
    {
        'email': 'bernadette.ainamon@depannage.bj',
        'first_name': 'Bernadette', 'last_name': 'Aïnamon',
        'phone': '+22997100017',
        'lat': Decimal('6.3583'), 'lng': Decimal('2.0855'),
        'city': 'Ouidah', 'dept': 'Atlantique', 'neighborhood': 'Ouidah Centre',
        'status': 'approved', 'is_premium': False, 'years_experience': 7,
        'specialties': ['Éclairage / Phares', 'Panne électrique'],
        'bio': 'Spécialiste éclairage automobile et circuits électriques.',
    },
    # 17 — premium
    {
        'email': 'constant.zinsou@depannage.bj',
        'first_name': 'Constant', 'last_name': 'Zinsou',
        'phone': '+22997100018',
        'lat': Decimal('10.3003'), 'lng': Decimal('1.3878'),
        'city': 'Natitingou', 'dept': 'Atacora', 'neighborhood': 'Natitingou Centre',
        'status': 'approved', 'is_premium': True, 'years_experience': 13,
        'specialties': ['Échappement', 'Diagnostic électronique'],
        'bio': "Expert échappement et diagnostic électronique, région Atacora.",
    },
    # 18 — standard
    {
        'email': 'solange.keke@depannage.bj',
        'first_name': 'Solange', 'last_name': 'Kèkè',
        'phone': '+22997100019',
        'lat': Decimal('7.9339'), 'lng': Decimal('1.9761'),
        'city': 'Savalou', 'dept': 'Collines', 'neighborhood': 'Savalou Centre',
        'status': 'approved', 'is_premium': True, 'years_experience': 6,
        'specialties': ['Injection / Carburateur', 'Panne moteur'],
        'bio': "Nettoyage injection et réglage carburateur, toutes marques.",
    },
    # 19 — standard
    {
        'email': 'damien.houngbedji@depannage.bj',
        'first_name': 'Damien', 'last_name': 'Houngbédji',
        'phone': '+22997100020',
        'lat': Decimal('7.7581'), 'lng': Decimal('2.1834'),
        'city': 'Dassa-Zoumè', 'dept': 'Collines', 'neighborhood': 'Dassa Centre',
        'status': 'approved', 'is_premium': True, 'years_experience': 4,
        'specialties': ['Antivol / Démarrage électronique', 'Problème de démarrage'],
        'bio': 'Diagnostic antidémarrage et systèmes de démarrage électronique.',
    },
]

# ── CONDUCTEURS (21) ──────────────────────────────────────────────────────────
# (first_name, last_name, email, phone)
DRIVERS_DATA = [
    ('Jean-Baptiste', 'Agossa',    'jb.agossa@gmail.com',      '+22961100001'),
    ('Fatima',        'Orou',       'fatima.orou@gmail.com',     '+22961100002'),
    ('Rodrigue',      'Sossou',     'rodrigue.s@gmail.com',      '+22961100003'),
    ('Clémentine',    'Amoussou',   'clementine.a@gmail.com',    '+22961100004'),
    ('Prosper',       'Gbèha',      'prosper.g@gmail.com',       '+22961100005'),
    ('Nadège',        'Hounsa',     'nadege.h@gmail.com',        '+22961100006'),
    ('Firmin',        'Tossou',     'firmin.t@gmail.com',        '+22961100007'),
    ('Raïssa',        'Kpossou',    'raissa.k@gmail.com',        '+22961100008'),
    ('Valentin',      'Adjovi',     'valentin.a@gmail.com',      '+22961100009'),
    ('Sandrine',      'Azonhiho',   'sandrine.az@gmail.com',     '+22961100010'),
    ('Hervé',         'Dansou',     'herve.d@gmail.com',         '+22961100011'),
    ('Mireille',      'Hounto',     'mireille.h@gmail.com',      '+22961100012'),
    ('Théophile',     'Gnancadja',  'theophile.g@gmail.com',     '+22961100013'),
    ('Vanessa',       'Tokoudagba', 'vanessa.t@gmail.com',       '+22961100014'),
    ('Gildas',        'Vodounou',   'gildas.v@gmail.com',        '+22961100015'),
    ('Edwige',        'Bocovo',     'edwige.b@gmail.com',        '+22961100016'),
    ('Narcisse',      'Agoli',      'narcisse.a@gmail.com',      '+22961100017'),
    ('Patience',      'Houndji',    'patience.h@gmail.com',      '+22961100018'),
    ('Léonce',        'Gbaguidi',   'leonce.g@gmail.com',        '+22961100019'),
    ('Odile',         'Kindji',     'odile.k@gmail.com',         '+22961100020'),
    ('Isidore',       'Ahouanvoedo','isidore.a@gmail.com',       '+22961100021'),
]

# GPS coords indexed by city name
GPS = {
    'Cotonou':       (Decimal('6.3654'), Decimal('2.4183')),
    'Parakou':       (Decimal('9.3370'), Decimal('2.6280')),
    'Abomey-Calavi': (Decimal('6.4969'), Decimal('2.6289')),
    'Bohicon':       (Decimal('7.2000'), Decimal('2.3500')),
    'Lokossa':       (Decimal('7.1671'), Decimal('2.0854')),
    'Porto-Novo':    (Decimal('6.4966'), Decimal('2.6289')),
    'Ouidah':        (Decimal('6.3583'), Decimal('2.0855')),
    'Natitingou':    (Decimal('10.3003'),Decimal('1.3878')),
    'Kandi':         (Decimal('11.1299'),Decimal('2.9374')),
    'Abomey':        (Decimal('7.1870'), Decimal('1.9916')),
}

# Montants par type de panne — (agglomération, hors agglomération).
# Une intervention hors agglomération coûte plus cher (déplacement) ; le prix
# varie aussi selon la gravité de la panne. Toujours dans la fourchette
# réaliste 30 000 - 300 000 XOF.
COST_TABLE = {
    'pneu':          (Decimal('30000'),  Decimal('48000')),
    'carburant':     (Decimal('33000'),  Decimal('50000')),
    'demarrage':     (Decimal('32000'),  Decimal('52000')),
    'general':       (Decimal('45000'),  Decimal('75000')),
    'freins':        (Decimal('55000'),  Decimal('85000')),
    'electrique':    (Decimal('65000'),  Decimal('100000')),
    'climatisation': (Decimal('95000'),  Decimal('140000')),
    'moteur':        (Decimal('160000'), Decimal('280000')),
}


def _cost_for(bd_type, is_agglomeration):
    agglo_cost, hors_cost = COST_TABLE[bd_type]
    return agglo_cost if is_agglomeration else hors_cost

# ── DEMANDES (25) ─────────────────────────────────────────────────────────────
# (driver_idx, bd_type, prompt_status, meca_idx|None, city, address, vehicle, days_ago)
# prompt_status: paid|completed|in_progress|assigned|pending|refused|reviewed
BREAKDOWNS_DATA = [
    # 5 paid → BD completed, intervention paid
    (0,  'moteur',       'paid',       0,  'Cotonou',       'Station Total de Cadjehoun',                     'Toyota Corolla 2019 - Gris',           55),
    (1,  'pneu',         'paid',       2,  'Cotonou',       'Carrefour Akpakpa, près du marché',              'Honda Civic 2020 - Blanc',             50),
    (2,  'electrique',   'paid',       1,  'Parakou',       'Avenue Kpébié, Parakou',                         'Renault Symbol 2018 - Rouge',          45),
    (3,  'carburant',    'paid',       6,  'Cotonou',       'Boulevard de la République',                     'Peugeot 208 2017 - Bleu',              40),
    (4,  'general',      'paid',       3,  'Abomey-Calavi', 'Godomey Carrefour, pharmacie Ste-Anne',          'Toyota RAV4 2016 - Noir',              35),
    # 4 completed → BD completed, intervention completed
    (5,  'moteur',       'completed',  8,  'Parakou',       'Quartier Albarika, Parakou',                     'Nissan Note 2018 - Argenté',           30),
    (6,  'pneu',         'completed',  2,  'Cotonou',       'Rue des Cheminots, Cotonou',                     'Kia Picanto 2021 - Rouge',             28),
    (7,  'freins',       'completed',  7,  'Cotonou',       'Carrefour Agla, Cotonou',                        'Hyundai i10 2019 - Blanc',             25),
    (8,  'demarrage',    'completed', 11,  'Abomey-Calavi', 'Akassato, route de Calavi',                      'Suzuki Swift 2020 - Bleu',             22),
    # 4 in_progress → BD in_progress, intervention in_progress
    (9,  'electrique',   'in_progress',1,  'Cotonou',       'Haie Vive, pharmacie centrale',                  'Toyota Yaris 2022 - Gris',             10),
    (10, 'moteur',       'in_progress',0,  'Cotonou',       'Fidjrossè plage, derrière le restaurant',        'Honda Accord 2017 - Noir',              7),
    (11, 'climatisation','in_progress',5,  'Kandi',         'Route de Banikoara, Kandi',                      'Mitsubishi Pajero 2015 - Beige',        5),
    (12, 'general',      'in_progress',3,  'Abomey-Calavi', 'Godomey, près de la station Oryx',               'Dacia Duster 2020 - Orange',            3),
    # 4 assigned → BD assigned, intervention pending_acceptance/accepted
    (13, 'pneu',         'assigned',   2,  'Bohicon',       'Carrefour Bohicon, face à la mairie',            'Renault Clio 2019 - Vert',              2),
    (14, 'moteur',       'assigned',   8,  'Parakou',       'Marché Arzèkè, Parakou',                         'Toyota Land Cruiser 2018 - Beige',      2),
    (15, 'freins',       'assigned',   7,  'Cotonou',       'Jéricho, rue des palmiers',                      'Ford Fiesta 2021 - Rouge',              1),
    (16, 'demarrage',    'assigned',   6,  'Cotonou',       'Station Shell de Cadjehoun',                     'Volkswagen Polo 2020 - Blanc',          1),
    # 4 pending → BD pending, pas d'intervention
    (17, 'general',      'pending',   None,'Porto-Novo',    "Ouando, Porto-Novo, près du lycée",              'Opel Astra 2016 - Gris',                0),
    (18, 'electrique',   'pending',   None,'Ouidah',        "Centre-ville d'Ouidah, face au temple python",   'Citroën C3 2018 - Bleu',                0),
    ( 0, 'moteur',       'pending',   None,'Natitingou',    'Natitingou centre, carrefour principal',          'Toyota Hilux 2019 - Blanc',             0),
    ( 1, 'pneu',         'pending',   None,'Kandi',         'Kandi, route nationale 2',                       'Hyundai Tucson 2020 - Noir',            0),
    # 2 refused → BD cancelled, pas d'intervention
    ( 2, 'carburant',    'refused',   None,'Cotonou',       'Pont de Cotonou, direction Porto-Novo',          'Peugeot 301 2017 - Argent',            15),
    ( 3, 'general',      'refused',   None,'Bohicon',       "Bohicon, route d'Abomey",                        'Toyota Camry 2016 - Beige',            12),
    # 2 reviewed → BD completed, intervention reviewed
    ( 4, 'freins',       'reviewed',   7,  'Cotonou',       'Jéricho, carrefour PTT',                         'Kia Rio 2020 - Rouge',                 58),
    ( 5, 'moteur',       'reviewed',   0,  'Cotonou',       "Cadjehoun, derrière l'aéroport",                 'Toyota Corolla 2021 - Gris',           52),
    # 9 compléments 'completed' pour garantir reviews ≤ interventions terminées par mécanicien
    # indices 25-33
    ( 6, 'moteur',       'completed',  0,  'Cotonou',       'Carrefour Fidjrossè, côté nord',                 'Ford Focus 2018 - Bleu',               20),
    ( 7, 'electrique',   'completed',  1,  'Parakou',       'Rue du marché central, Parakou',                 'Mitsubishi Canter 2017 - Blanc',        18),
    ( 8, 'freins',       'completed',  3,  'Abomey-Calavi', "Route de l'université, Abomey-Calavi",           'Toyota Wish 2019 - Argent',             16),
    ( 9, 'general',      'completed',  4,  'Lokossa',       'Lokossa, carrefour principal',                   'Nissan Tiida 2016 - Gris',              14),
    (10, 'climatisation','completed',  5,  'Kandi',         'Kandi, avenue de la gare',                       'Kia Cerato 2020 - Noir',                12),
    (11, 'freins',       'completed',  7,  'Cotonou',       'Jéricho, rue du commerce',                       'Opel Corsa 2018 - Rouge',               10),
    (12, 'moteur',       'completed',  8,  'Parakou',       'Marché Arzèkè nord, Parakou',                    'Peugeot 206 2015 - Beige',               8),
    (13, 'general',      'completed',  9,  'Cotonou',       'Gbégamey, rue du lycée',                         'Toyota Auris 2017 - Bleu',               6),
    (14, 'moteur',       'completed', 10,  'Bohicon',       'Bohicon, côté gare routière',                    'Land Rover Discovery 2016 - Noir',       4),
]

# Mapping statut prompt → statut BD réel
_BD_STATUS_MAP = {
    'paid':       'completed',
    'completed':  'completed',
    'in_progress':'in_progress',
    'assigned':   'assigned',
    'pending':    'pending',
    'refused':    'cancelled',
    'reviewed':   'completed',
}

# ── INTERVENTIONS EXTRA (refused, pour atteindre 22) ─────────────────────────
# (bd_idx, extra_meca_idx, days_ago)  — status='refused' pour chacune
EXTRA_REFUSED_INTERVENTIONS = [
    (9,  4, 11),  # bd electrique in_progress : Toussaint Dossou avait refusé
    (13, 9, 3),   # bd pneu assigned : Félix Agbossou avait refusé
    (14, 4, 3),   # bd moteur assigned : Toussaint Dossou avait refusé
]

# ── MESSAGES conducteur ↔ admin (32) ─────────────────────────────────────────
# Mécanisme réel : conductor écrit à l'ADMIN via breakdown_messages.
# sender_type valide : 'driver' ou 'admin' uniquement (vue breakdown_messages l.548).
# (bd_idx, [(sender_type, content, minutes_offset), ...])
MESSAGES_DATA = [
    (0, [
        ('driver', "Bonjour, ma Toyota est en panne moteur devant la station Total. Je suis bloqué.", 0),
        ('admin',  "Votre demande est bien reçue. Un mécanicien vient d'être assigné, il arrive.", 5),
        ('driver', "Merci, je vous attends au bord de la route.", 7),
    ]),
    (1, [
        ('driver', "Crevaison totale pneu arrière, je suis devant le marché Akpakpa.", 0),
        ('admin',  "Demande prise en charge. Le mécanicien est en route vers votre position.", 3),
        ('driver', "Je suis garé devant le marché Dantokpa. Voiture blanche.", 5),
    ]),
    (2, [
        ('driver', "Panne électrique sur mon Renault. Je suis à Kpébié Parakou.", 0),
        ('admin',  "Prise en charge confirmée, le technicien sera là dans 15 à 20 minutes.", 8),
        ('driver', "D'accord, pas de problème. Je vous attends.", 10),
    ]),
    (3, [
        ('driver', "Panne sèche sur le boulevard, réservoir vide.", 0),
        ('admin',  "Un mécanicien avec du carburant est en route. Restez près de votre véhicule.", 5),
        ('driver', "Merci, j'attends votre mécanicien.", 7),
    ]),
    (4, [
        ('driver', "Voiture en panne générale à Godomey. Je ne sais pas ce qui se passe.", 0),
        ('admin',  "Nous avons envoyé un mécanicien polyvalent vers vous. Il arrive sous peu.", 6),
        ('driver', "D'accord, le moteur ne démarre plus du tout.", 8),
    ]),
    (5, [
        ('driver', "Panne moteur à Albarika. Témoin moteur allumé depuis hier.", 0),
        ('admin',  "Votre demande est traitée, le mécanicien est en cours d'intervention.", 12),
        ('driver', "Merci beaucoup pour votre aide.", 45),
    ]),
    (6, [
        ('driver', "Crevaison à la rue des cheminots. Je suis coincé.", 0),
        ('admin',  "Intervention confirmée, le mécanicien sera là dans 5 minutes.", 4),
    ]),
    (7, [
        ('driver', "Problème de freins à Agla. Pédale molle.", 0),
        ('admin',  "Demande reçue. Pouvez-vous nous confirmer votre adresse exacte ?", 3),
    ]),
    (9, [
        ('driver', "Panne électrique à Haie Vive. Les lumières clignotent.", 0),
        ('admin',  "Le mécanicien est en cours d'intervention. Le diagnostic révèle un problème complexe.", 20),
        ('driver', "Est-ce que ça va prendre longtemps ?", 25),
    ]),
    (10, [
        ('driver', "Moteur qui cale sur Fidjrossè. Fumée blanche.", 0),
        ('admin',  "L'intervention est terminée selon le rapport du mécanicien. Votre véhicule est prêt.", 60),
        ('driver', "Merci, véhicule opérationnel.", 65),
    ]),
    (13, [
        ('driver', "Crevaison à Bohicon face à la mairie. Voiture rouge, plaque 1234 AB.", 0),
        ('admin',  "Mécanicien assigné. Une pièce supplémentaire pourrait être nécessaire.", 15),
    ]),
    (14, [
        ('driver', "Panne moteur au marché Arzèkè. Land Cruiser beige.", 0),
        ('admin',  "Le mécanicien est en route. Durée estimée : 30 à 45 minutes.", 5),
    ]),
]

# ── MESSAGES mécanicien → admin (20) ─────────────────────────────────────────
# Mécanisme réel : mécanicien écrit à l'admin via mechanics_admin_message.
# (meca_idx, sender_type, content)
MECH_ADMIN_MESSAGES_DATA = [
    (0,  'mechanic', "Bonjour, je voudrais signaler un problème avec mon compte MoMo."),
    (0,  'admin',    "Bonjour, pouvez-vous nous indiquer le nouveau numéro à enregistrer ?"),
    (1,  'mechanic', "Je n'arrive pas à modifier ma disponibilité dans l'application."),
    (1,  'admin',    "Le souci est résolu, merci de réessayer et de nous confirmer."),
    (2,  'mechanic', "Pouvez-vous valider mon profil premium s'il vous plaît ?"),
    (3,  'mechanic', "J'ai un souci avec une intervention marquée non terminée."),
    (3,  'admin',    "Nous vérifions le dossier et revenons vers vous sous 24h."),
    (5,  'mechanic', "Question concernant mes retraits : le dernier n'a pas été traité."),
    (5,  'admin',    "Votre retrait a été validé, le virement MoMo est en cours."),
    (6,  'mechanic', "Un client conteste le prix final de l'intervention, que dois-je faire ?"),
    (7,  'mechanic', "Je souhaite mettre à jour mes spécialités sur mon profil."),
    (7,  'admin',    "Vous pouvez le faire depuis 'Mon compte', section spécialités."),
    (8,  'mechanic', "Ma zone de couverture a changé, je suis maintenant basé à Parakou centre."),
    (9,  'mechanic', "Un avis reçu me semble injustifié, pouvez-vous le vérifier ?"),
    (10, 'mechanic', "Je n'ai pas reçu de notification pour la dernière demande assignée."),
    (10, 'admin',    "Nous avons identifié le bug de notification, correctif en cours."),
    (11, 'mechanic', "Puis-je suspendre temporairement mon compte pour congé ?"),
    (11, 'admin',    "Oui, utilisez le bouton 'Indisponible' dans votre profil."),
    (15, 'mechanic', "Bonjour, mon document de certification n'a pas pu être téléversé."),
    (16, 'mechanic', "Je confirme la réception du paiement de la dernière intervention."),
    (18, 'mechanic', "Pouvez-vous m'indiquer pourquoi mon compte est encore en standard ?"),
    (19, 'mechanic', "J'aimerais des informations sur le passage au statut premium."),
]

# ── AVIS (20) ─────────────────────────────────────────────────────────────────
# (meca_idx, reviewer_name, rating, comment, bd_idx_for_intervention|None)
REVIEWS_DATA = [
    # linked to interventions reviewed/paid
    (7,  'Kia Rio — conducteur',          5, 'Excellent mécanicien, très professionnel !',           23),
    (0,  'Toyota Corolla — conducteur',   5, 'Rapide et efficace, je recommande.',                   24),
    (0,  'Jean-Baptiste Agossa',          5, 'Excellent mécanicien, très professionnel !',            0),
    (2,  'Fatima Orou',                   4, 'Très bon service, prix raisonnable.',                   1),
    (1,  'Rodrigue Sossou',               5, 'Ponctuel et compétent, merci !',                        2),
    (6,  'Clémentine Amoussou',           4, 'Super intervention, problème résolu.',                  3),
    (3,  'Prosper Gbèha',                 5, 'Très satisfait du service rendu.',                      4),
    # standalone (intervention=None)
    (8,  'Nadège Hounsa',                 5, 'Mécanicien sérieux et honnête.',                       None),
    (8,  'Firmin Tossou',                 4, 'Travail impeccable, bravo !',                           None),
    (2,  'Raïssa Kpossou',                3, 'Arrivée très tardive, mauvaise communication.',         None),
    (7,  'Valentin Adjovi',               5, 'Rapide et efficace, je recommande.',                    None),
    (7,  'Sandrine Azonhiho',             4, 'Très bon service, prix raisonnable.',                   None),
    (0,  'Hervé Dansou',                  5, 'Excellent mécanicien, très professionnel !',             None),
    (1,  'Mireille Hounto',               2, 'Prix final différent du devis annoncé.',                None),
    (3,  'Théophile Gnancadja',           5, 'Ponctuel et compétent, merci !',                        None),
    (4,  'Vanessa Tokoudagba',            4, 'Super intervention, problème résolu.',                  None),
    (5,  'Gildas Vodounou',               5, 'Très satisfait du service rendu.',                      None),
    (9,  'Edwige Bocovo',                 1, 'Travail bâclé, problème non résolu.',                   None),
    (10, 'Narcisse Agoli',                4, 'Mécanicien sérieux et honnête.',                        None),
    (11, 'Patience Houndji',              5, 'Rapide et efficace, je recommande.',                    None),
]

# ── INCIDENTS (20) ────────────────────────────────────────────────────────────
# (bd_idx, emitter_type, emitter_name, target_name, incident_type, gravity, status, description)
INCIDENTS_DATA = [
    # abuse x4
    (0,  'driver',   'Jean-Baptiste Agossa',  'Koffi Mensah',
     'abuse', 'medium', 'pending',
     'Le mécanicien a utilisé un langage inapproprié lors de l\'intervention.'),
    (1,  'mechanic', 'Marcellin Boffi',        'Fatima Orou',
     'abuse', 'high', 'resolved',
     'La conductrice a insulté le mécanicien après le diagnostic.'),
    (5,  'driver',   'Nadège Hounsa',          'Moussa Zakari',
     'abuse', 'medium', 'resolved',
     'Échange tendu, propos déplacés de part et d\'autre.'),
    (6,  'mechanic', 'Marcellin Boffi',        'Raïssa Kpossou',
     'abuse', 'high', 'pending',
     'Conductrice agressive lors du paiement.'),
    # delay x6
    (2,  'driver',   'Rodrigue Sossou',        'Abdoulaye Idrissou',
     'delay', 'medium', 'pending',
     'Le mécanicien est arrivé 2 heures après l\'heure convenue sans prévenir.'),
    (3,  'driver',   'Clémentine Amoussou',    'Gérard Ahouansou',
     'delay', 'low', 'resolved',
     'Retard de 45 minutes sans explication.'),
    (7,  'driver',   'Valentin Adjovi',        'Patrice Lokossou',
     'delay', 'medium', 'resolved',
     'Arrivée tardive malgré confirmation de l\'ETA.'),
    (8,  'driver',   'Sandrine Azonhiho',      'Cyrille Gbaguidi',
     'delay', 'low', 'rejected',
     'Léger retard de 20 minutes dû au trafic.'),
    (9,  'driver',   'Hervé Dansou',           'Abdoulaye Idrissou',
     'delay', 'medium', 'pending',
     'Mécanicien non joignable pendant 1 heure après acceptation.'),
    (10, 'driver',   'Mireille Hounto',        'Koffi Mensah',
     'delay', 'low', 'rejected',
     'Retard mineur de 15 minutes.'),
    # price x5
    (4,  'driver',   'Prosper Gbèha',          'Séraphin Houessou',
     'price', 'high', 'pending',
     'Le montant final (25 000 XOF) est le double du devis initial (12 000 XOF).'),
    (0,  'driver',   'Jean-Baptiste Agossa',   'Koffi Mensah',
     'price', 'high', 'resolved',
     'Facturation de pièces non demandées lors de l\'intervention.'),
    (5,  'driver',   'Nadège Hounsa',          'Moussa Zakari',
     'price', 'medium', 'resolved',
     'Tarif de déplacement non mentionné dans le devis.'),
    (6,  'driver',   'Raïssa Kpossou',         'Marcellin Boffi',
     'price', 'medium', 'rejected',
     'Contestation mineure sur le coût de la main d\'œuvre.'),
    (7,  'driver',   'Valentin Adjovi',        'Patrice Lokossou',
     'price', 'low', 'pending',
     'Différence de 1 000 XOF entre devis et facture finale.'),
    # quality x3
    (8,  'driver',   'Sandrine Azonhiho',      'Cyrille Gbaguidi',
     'quality', 'medium', 'resolved',
     'Problème non résolu après intervention. Retour en panne 2 jours plus tard.'),
    (9,  'driver',   'Hervé Dansou',           'Abdoulaye Idrissou',
     'quality', 'medium', 'resolved',
     'Mauvaise qualité des pièces remplacées.'),
    (10, 'driver',   'Mireille Hounto',        'Koffi Mensah',
     'quality', 'low', 'pending',
     'Travail peu soigné, taches d\'huile non nettoyées.'),
    # fraud x2
    (11, 'driver',   'Théophile Gnancadja',    'Ibrahim Chabi',
     'fraud', 'high', 'pending',
     'Le mécanicien a demandé un paiement en espèces puis a prétendu ne pas avoir reçu.'),
    (12, 'driver',   'Firmin Tossou',          'Séraphin Houessou',
     'fraud', 'high', 'pending',
     'Fausse pièce présentée comme neuve lors du remplacement.'),
]

# ── DEMANDES PREMIUM (20) ─────────────────────────────────────────────────────
# (meca_idx [non-premium approuvé], requester_name, requester_phone, reason, status)
PREMIUM_CONTACTS_DATA = [
    (2,  'Kofi Alabi',        '+22996200001', 'J\'ai besoin d\'un spécialiste pneus pour ma flotte de taxis.',    'pending'),
    (3,  'Akossiwa Sossa',    '+22996200002', 'Problème récurrent sur ma Dacia, je cherche un expert.',           'approved'),
    (2,  'Mensah Kplante',    '+22996200003', 'Besoin de dépannage régulier pour camion de livraison.',           'approved'),
    (6,  'Dossou Agbavon',    '+22996200004', 'Panne carburant fréquente, besoin de diagnostic complet.',         'pending'),
    (7,  'Houssou Gbesson',   '+22996200005', 'Direction assistée défaillante sur mon véhicule de fonction.',     'approved'),
    (16, 'Dada Tchibozo',     '+22996200006', 'Carrosserie endommagée après accident mineur, devis urgent.',      'rejected'),
    (10, 'Gbessemehlan Aho',  '+22996200007', 'Service de remorquage pour mon garage, contact professionnel.',    'pending'),
    (6, 'Chabi Oyedele',     '+22996200008', 'Problème électrique récurrent sur Toyota Corolla 2018.',           'approved'),
    (2,  'Adjovi Kpossou',    '+22996200009', 'Crevaison fréquente, besoin d\'un spécialiste de confiance.',      'pending'),
    (3,  'Gnansounou Boko',   '+22996200010', 'Frein à main défectueux, intervention urgente souhaitée.',         'rejected'),
    (15, 'Rachidi Boukari',   '+22996200011', 'Besoin de vidange régulière pour véhicule de société.',            'approved'),
    (16, 'Espérance Dovonou', '+22996200012', 'Phares défectueux, contrôle technique dans 3 jours.',              'pending'),
    (7, 'Yacoubou Sanni',    '+22996200013', 'Bruit suspect au niveau du carburateur, diagnostic souhaité.',     'approved'),
    (10, 'Célestine Hessou',  '+22996200014', 'Voiture qui ne démarre plus, suspicion antivol défectueux.',       'pending'),
    (6,  'Basile Kougblenou', '+22996200015', 'Recherche mécanicien de confiance pour flotte de motos-taxis.',    'approved'),
    (7,  'Aurélie Zannou',    '+22996200016', 'Direction qui tire à droite, besoin d\'un avis rapide.',           'rejected'),
    (15,  'Innocent Dagba',    '+22996200017', 'Carrosserie à réparer suite à un accrochage léger.',               'pending'),
    (10, 'Marlène Gansou',    '+22996200018', 'Contrat d\'entretien annuel pour véhicule de fonction.',           'approved'),
    (15, 'Théophile Aholou',  '+22996200019', 'Odeur de brûlé au niveau du moteur, urgence.',                     'pending'),
    (16, 'Colette Sagbo',     '+22996200020', 'Panne électrique intermittente, plusieurs pannes ce mois-ci.',     'approved'),
]

# ── ABONNEMENTS PREMIUM ───────────────────────────────────────────────────────
# Le mécanicien paie la plateforme (pas de commission/mécanicien ici) pour
# passer/rester premium. Certains ont renouvelé plusieurs mois de suite.
# (meca_idx, montant mensuel, [mois d'ancienneté du paiement, le plus ancien en premier])
PREMIUM_SUBSCRIPTIONS_DATA = [
    (0,  Decimal('5350'),  [3, 2, 1]),        # Koffi Mensah — 3 renouvellements
    (1,  Decimal('12000'), [2, 1]),           # Abdoulaye Idrissou — 2 renouvellements
    (5,  Decimal('8000'),  [1]),              # Ibrahim Chabi
    (8,  Decimal('25000'), [5, 4, 3, 2, 1]),  # Moussa Zakari — abonné de longue date
    (17, Decimal('15000'), [1]),              # Constant Zinsou — nouveau premium
]

# ── RETRAITS (20) ─────────────────────────────────────────────────────────────
# Le retrait déduit du solde (amount + frais WITHDRAWAL_FEE_RATE) ; le
# mécanicien reçoit exactement `amount`. Le montant dépend de ce qu'il a
# accumulé — modeste pour la plupart, nettement plus élevé pour les
# mécaniciens premium/vétérans à fort volume.
# (meca_idx, amount, status)
WITHDRAWALS_DATA = [
    (2,  Decimal('8000'),   'pending'),
    (3,  Decimal('10000'),  'approved'),
    (4,  Decimal('12000'),  'rejected'),
    (6,  Decimal('5000'),   'pending'),
    (7,  Decimal('18000'),  'approved'),
    (9,  Decimal('8000'),   'pending'),
    (10, Decimal('22000'),  'approved'),
    (11, Decimal('6000'),   'pending'),
    (12, Decimal('2000'),   'pending'),
    (13, Decimal('15000'),  'approved'),
    (14, Decimal('4000'),   'rejected'),
    (15, Decimal('14000'),  'approved'),
    (16, Decimal('7000'),   'pending'),
    (18, Decimal('11000'),  'approved'),
    (19, Decimal('6500'),   'pending'),
    (0,  Decimal('380000'),  'approved'),  # Koffi Mensah
    (1,  Decimal('260000'),  'approved'),  # Abdoulaye Idrissou
    (5,  Decimal('190000'),  'approved'),  # Ibrahim Chabi
    (8,  Decimal('1850000'), 'approved'),  # Moussa Zakari — plus gros volume de la plateforme
    (17, Decimal('950000'),  'approved'),  # Constant Zinsou
]

# ── SOLDES MÉCANICIENS ────────────────────────────────────────────────────────
# Solde restant après les retraits ci-dessus (les rejetés sont remboursés,
# donc sans effet net). 0 pour les profils pending/rejected (jamais payés).
# (meca_idx, balance)
BALANCES_DATA = [
    (0,  Decimal('145000')), (1,  Decimal('98000')),  (2,  Decimal('22000')),
    (3,  Decimal('35000')),  (4,  Decimal('18000')),  (5,  Decimal('67000')),
    (6,  Decimal('12000')),  (7,  Decimal('41000')),  (8,  Decimal('620000')),
    (9,  Decimal('15000')),  (10, Decimal('28000')),  (11, Decimal('19000')),
    (12, Decimal('0')),      (13, Decimal('0')),      (14, Decimal('0')),
    (15, Decimal('31000')),  (16, Decimal('24000')),  (17, Decimal('210000')),
    (18, Decimal('17000')),  (19, Decimal('9000')),
]


class Command(BaseCommand):
    help = "Génère les données de soutenance pour DépannageExpress"

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Seed Soutenance — DépannageExpress ===\n'))

        specialties = self._create_specialties()
        admin       = self._create_admin()
        mechanics   = self._create_mechanics(specialties, admin)
        drivers     = self._create_drivers()
        breakdowns  = self._create_breakdowns(mechanics, drivers, specialties)
        interventions, extra_refused = self._create_interventions(breakdowns, mechanics)
        self._create_payments(breakdowns, interventions, extra_refused)
        self._create_premium_subscriptions(mechanics)
        self._create_reviews(mechanics, interventions)
        self._create_messages(breakdowns)
        self._create_mechanic_admin_messages(mechanics)
        self._create_otps(drivers)
        self._create_incidents(interventions)
        self._create_premium_contacts(mechanics, drivers)
        self._create_withdrawals(mechanics, admin)
        self._create_balances(mechanics)
        self._print_report()

    # ── SPÉCIALITÉS ──────────────────────────────────────────────────────────
    def _create_specialties(self):
        result = {}
        for d in SPECIALTIES_DATA:
            obj, created = Specialty.objects.get_or_create(
                name=d['name'],
                defaults={'description': d['description'], 'icon': d['icon']},
            )
            result[d['name']] = obj
            self.stdout.write(f"  Spécialité [{'+ créée' if created else '✓'}] : {d['name']}")
        return result

    # ── ADMIN ────────────────────────────────────────────────────────────────
    def _create_admin(self):
        admin, created = User.objects.get_or_create(
            email=ADMIN_EMAIL,
            defaults={
                'first_name': 'Admin', 'last_name': 'Soutenance',
                'phone': '+22990000099',
                'role': 'admin', 'is_staff': True, 'is_superuser': True, 'is_active': True,
            },
        )
        if created:
            admin.set_password(ADMIN_PASSWORD)
            admin.save()
            User.objects.filter(pk=admin.pk).update(created_at=_seeded_datetime(SEED_WINDOW_DAYS, hour=9))
        self.stdout.write(f"  Admin [{'+ créé' if created else '✓'}] : {ADMIN_EMAIL}")
        return admin

    # ── MÉCANICIENS ──────────────────────────────────────────────────────────
    def _create_mechanics(self, specialties, admin):
        mechanics = []
        for d in MECHANICS_DATA:
            role = 'mechanic_premium' if d['is_premium'] else 'mechanic_standard'
            registered_at = _seeded_datetime(random.randint(28, SEED_WINDOW_DAYS))
            user, u_created = User.objects.get_or_create(
                email=d['email'],
                defaults={
                    'first_name': d['first_name'], 'last_name': d['last_name'],
                    'phone': d['phone'], 'role': role, 'is_active': True,
                },
            )
            if u_created:
                user.set_password(MECHANIC_PASSWORD)
                user.save()
                User.objects.filter(pk=user.pk).update(created_at=registered_at)

            validated_at = registered_at + timedelta(days=random.randint(1, 3)) if d['status'] == 'approved' else None
            profile, p_created = MechanicProfile.objects.get_or_create(
                user=user,
                defaults={
                    'bio': d['bio'],
                    'years_experience': d['years_experience'],
                    'latitude': d['lat'], 'longitude': d['lng'],
                    'address': f"{d['neighborhood']}, {d['city']}",
                    'city': d['city'], 'department': d['dept'],
                    'neighborhood': d['neighborhood'],
                    'country': 'Bénin',
                    'is_available': d['status'] == 'approved',
                    'works_weekends': True,
                    'status': d['status'],
                    'validated_by': admin if d['status'] == 'approved' else None,
                    'validated_at': validated_at,
                    'average_rating': Decimal('0.00'),
                    'total_reviews': 0,
                    'total_interventions': 0,
                },
            )
            if p_created:
                specs = [specialties[s] for s in d['specialties'] if s in specialties]
                profile.specialties.set(specs)
                MechanicProfile.objects.filter(pk=profile.pk).update(created_at=registered_at)

            marker = f"+ créé ({'premium' if d['is_premium'] else 'standard'}, {d['status']})"
            self.stdout.write(f"  Mécanicien [{'+ créé' if u_created else '✓'}] : {user.full_name} — {d['city']}")
            mechanics.append(profile)
        return mechanics

    # ── CONDUCTEURS ──────────────────────────────────────────────────────────
    def _create_drivers(self):
        drivers = []
        for (fn, ln, email, phone) in DRIVERS_DATA:
            registered_at = _seeded_datetime(random.randint(0, SEED_WINDOW_DAYS))
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': fn, 'last_name': ln,
                    'phone': phone, 'role': 'driver', 'is_active': True,
                },
            )
            if created:
                user.set_password(DRIVER_PASSWORD)
                user.save()
                User.objects.filter(pk=user.pk).update(created_at=registered_at)
            self.stdout.write(f"  Conducteur [{'+ créé' if created else '✓'}] : {fn} {ln}")
            drivers.append(user)
        return drivers

    # ── DEMANDES ─────────────────────────────────────────────────────────────
    def _create_breakdowns(self, mechanics, drivers, specialties):
        breakdowns = []
        for (drv_idx, bd_type, prompt_status, meca_idx, city, address, vehicle, days_ago) in BREAKDOWNS_DATA:
            driver_user = drivers[drv_idx]
            bd_status = _BD_STATUS_MAP[prompt_status]
            meca = mechanics[meca_idx] if meca_idx is not None else None

            # Trouver une spécialité correspondante
            spec_map = {
                'moteur': 'Panne moteur', 'electrique': 'Panne électrique',
                'pneu': 'Crevaison / Pneus', 'carburant': 'Panne de carburant',
                'demarrage': 'Problème de démarrage', 'general': 'Dépannage général',
                'climatisation': 'Climatisation', 'freins': 'Freins',
            }
            spec_name = spec_map.get(bd_type)
            specialty = specialties.get(spec_name)

            lat, lng = GPS[city]
            created_date = _seeded_datetime(_scale_days_ago(days_ago))

            br, created = BreakdownRequest.objects.get_or_create(
                driver_phone=driver_user.phone,
                vehicle_description=vehicle,
                defaults={
                    'driver_name':           driver_user.full_name,
                    'driver_account':        driver_user,
                    'vehicle_photo':         'demo/placeholder_vehicle.jpg',
                    'breakdown_description': f"Panne de type {bd_type} signalée à {address}.",
                    'breakdown_type':        spec_name or bd_type,
                    'specialty_requested':   specialty,
                    'latitude':              lat,
                    'longitude':             lng,
                    'address_description':   address,
                    'is_agglomeration':      is_agglomeration_zone(float(lat), float(lng)),
                    'status':                bd_status,
                    'assigned_mechanic':     meca,
                    'assigned_at':           created_date + timedelta(minutes=30) if meca else None,
                    'assignment_distance_km': (
                        Decimal(str(_haversine(lat, lng, meca.latitude, meca.longitude)))
                        if meca and meca.latitude and meca.longitude else None
                    ),
                    'ip_address':            '41.202.220.1',
                    'user_agent':            'SeedSoutenance/1.0',
                },
            )
            if created:
                BreakdownRequest.objects.filter(pk=br.pk).update(created_at=created_date)
                br.created_at = created_date  # .update() ne rafraîchit pas l'objet en mémoire

            self.stdout.write(f"  Demande [{'+ créée' if created else '✓'}] : {driver_user.full_name} — {prompt_status} — {vehicle[:30]}")
            breakdowns.append(br)
        return breakdowns

    # ── INTERVENTIONS ────────────────────────────────────────────────────────
    def _create_interventions(self, breakdowns, mechanics):
        interventions = {}  # bd_idx → Intervention (principal)
        total_created = 0

        # Statut intervention selon prompt_status de la demande
        intv_status_map = {
            'paid':       'paid',
            'completed':  'completed',
            'in_progress':'in_progress',
            'assigned':   'accepted',      # bd 13,14 ; pending_acceptance pour 15,16
            'reviewed':   'reviewed',
        }
        # bd 15 et 16 → pending_acceptance (les 2 derniers "assigned")
        pending_acceptance_bds = {15, 16}

        for idx, (drv_idx, bd_type, prompt_status, meca_idx, city, address, vehicle, days_ago) in enumerate(BREAKDOWNS_DATA):
            if meca_idx is None:
                continue  # pending ou refused : pas d'intervention
            br = breakdowns[idx]
            meca = mechanics[meca_idx]
            cost = _cost_for(bd_type, br.is_agglomeration)
            created_date = br.created_at

            if prompt_status == 'assigned' and idx in pending_acceptance_bds:
                intv_status = 'pending_acceptance'
            else:
                intv_status = intv_status_map.get(prompt_status, 'completed')

            completed_at = None
            if intv_status in ('completed', 'paid', 'reviewed'):
                completed_at = created_date + timedelta(hours=random.randint(1, 3))

            intv, created = Intervention.objects.get_or_create(
                breakdown_request=br,
                mechanic=meca,
                defaults={
                    'status':          intv_status,
                    'accepted_at':     created_date + timedelta(minutes=15),
                    'started_at':      created_date + timedelta(minutes=40) if intv_status not in ('pending_acceptance', 'accepted') else None,
                    'completed_at':    completed_at,
                    'paid_at':         completed_at + timedelta(minutes=30) if intv_status in ('paid', 'reviewed') else None,
                    'estimated_cost':  cost,
                    'final_cost':      cost if intv_status not in ('pending_acceptance', 'accepted', 'in_progress') else None,
                    'mechanic_notes':  f"Intervention {bd_type} — {address}.",
                },
            )
            if created:
                Intervention.objects.filter(pk=intv.pk).update(created_at=created_date)
                intv.created_at = created_date
                total_created += 1
            interventions[idx] = intv
            self.stdout.write(f"  Intervention [{'+ créée' if created else '✓'}] : #{br.id} — {intv_status}")

        # 3 interventions extra "refused" pour atteindre 22
        extra_refused = []
        for (bd_idx, extra_meca_idx, days_ago) in EXTRA_REFUSED_INTERVENTIONS:
            br = breakdowns[bd_idx]
            meca = mechanics[extra_meca_idx]
            refused_date = br.created_at + timedelta(minutes=5)
            intv, created = Intervention.objects.get_or_create(
                breakdown_request=br,
                mechanic=meca,
                defaults={
                    'status':         'refused',
                    'accepted_at':    None,
                    'refused_at':     refused_date,
                    'refusal_reason': 'Mécanicien indisponible au moment de la demande.',
                    'estimated_cost': _cost_for(BREAKDOWNS_DATA[bd_idx][1], br.is_agglomeration),
                },
            )
            if created:
                Intervention.objects.filter(pk=intv.pk).update(created_at=refused_date)
                intv.created_at = refused_date
                total_created += 1
            extra_refused.append((bd_idx, intv))
            self.stdout.write(f"  Intervention refused extra [{'+ créée' if created else '✓'}] : bd#{br.id} — {meca.user.full_name}")

        self.stdout.write(self.style.SUCCESS(f'  → {total_created} interventions créées.'))

        # Mécaniciens en intervention in_progress → is_available=False
        in_progress_meca_indices = set()
        for _, _, prompt_status, meca_idx, *__ in BREAKDOWNS_DATA:
            if prompt_status == 'in_progress' and meca_idx is not None:
                in_progress_meca_indices.add(meca_idx)
        for mi in in_progress_meca_indices:
            profile = mechanics[mi]
            MechanicProfile.objects.filter(pk=profile.pk).update(is_available=False)
            profile.is_available = False
            self.stdout.write(f'  is_available=False : {profile.user.full_name}')

        # Mise à jour total_interventions (statuts terminés)
        for profile in mechanics:
            cnt = Intervention.objects.filter(
                mechanic=profile,
                status__in=['completed', 'paid', 'reviewed'],
            ).count()
            MechanicProfile.objects.filter(pk=profile.pk).update(total_interventions=cnt)
            profile.total_interventions = cnt

        return interventions, extra_refused

    # ── PAIEMENTS ────────────────────────────────────────────────────────────
    def _calc_commission(self, amount, mechanic, breakdown):
        """Retourne (commission, net_amount) selon le rôle du mécanicien et la zone de la demande."""
        if mechanic.user.role == 'mechanic_premium':
            commission = Decimal('0')
        else:
            commission = (Decimal(str(amount)) * breakdown.commission_rate).quantize(
                Decimal('0.01'), rounding=ROUND_DOWN
            )
        return commission, Decimal(str(amount)) - commission

    def _create_payments(self, breakdowns, interventions, extra_refused):
        count = 0
        fixed = 0

        intv_payment_map = {
            'paid':               ('paid',    'intervention'),
            'reviewed':           ('paid',    'intervention'),
            'completed':          ('pending', 'intervention'),  # travail terminé mais pas encore payé
            'in_progress':        ('pending', 'intervention'),
            'accepted':           ('pending', 'intervention'),
            'pending_acceptance': ('pending', 'intervention'),
            'refused':            ('pending', 'intervention'),
        }

        pay_idx = 1

        # Paiements pour les interventions principales (19)
        for bd_idx, intv in interventions.items():
            bd_type = BREAKDOWNS_DATA[bd_idx][1]
            bd = breakdowns[bd_idx]
            cost = _cost_for(bd_type, bd.is_agglomeration)
            pay_status, pay_for = intv_payment_map.get(intv.status, ('pending', 'intervention'))
            ref = f'FEDA_SOUT_{pay_idx:04d}'
            paid_at = intv.paid_at if pay_status == 'paid' else None
            commission, net = self._calc_commission(cost, intv.mechanic, bd)

            payment, created = PaymentTransaction.objects.get_or_create(
                provider_reference=ref,
                defaults={
                    'payer_name':        bd.driver_name,
                    'payer_phone':       bd.driver_phone,
                    'amount':            cost,
                    'currency':          'XOF',
                    'payment_method':    random.choice(['MTN Mobile Money', 'Moov Money']),
                    'payment_for':       pay_for,
                    'status':            pay_status,
                    'breakdown_request': bd,
                    'intervention':      intv,
                    'mechanic':          intv.mechanic,
                    'commission_amount': commission,
                    'net_amount':        net,
                    'paid_at':           paid_at,
                    'metadata':          {'source': 'seed_soutenance'},
                },
            )
            if created:
                PaymentTransaction.objects.filter(pk=payment.pk).update(created_at=bd.created_at)
                count += 1
            elif payment.commission_amount == Decimal('0') and payment.net_amount == Decimal('0'):
                payment.commission_amount = commission
                payment.net_amount = net
                payment.save(update_fields=['commission_amount', 'net_amount'])
                fixed += 1
            pay_idx += 1

        # +1 paiement pour la 1re intervention refused (assure le minimum 20)
        if extra_refused:
            bd_idx, intv = extra_refused[0]
            bd = breakdowns[bd_idx]
            ref = f'FEDA_SOUT_{pay_idx:04d}'
            cost = _cost_for(BREAKDOWNS_DATA[bd_idx][1], bd.is_agglomeration)
            commission, net = self._calc_commission(cost, intv.mechanic, bd)
            payment, created = PaymentTransaction.objects.get_or_create(
                provider_reference=ref,
                defaults={
                    'payer_name':        bd.driver_name,
                    'payer_phone':       bd.driver_phone,
                    'amount':            cost,
                    'currency':          'XOF',
                    'payment_method':    'MTN Mobile Money',
                    'payment_for':       'intervention',
                    'status':            'pending',
                    'breakdown_request': bd,
                    'intervention':      intv,
                    'mechanic':          intv.mechanic,
                    'commission_amount': commission,
                    'net_amount':        net,
                    'paid_at':           None,
                    'metadata':          {'source': 'seed_soutenance'},
                },
            )
            if created:
                PaymentTransaction.objects.filter(pk=payment.pk).update(created_at=bd.created_at)
                count += 1
            elif payment.commission_amount == Decimal('0') and payment.net_amount == Decimal('0'):
                payment.commission_amount = commission
                payment.net_amount = net
                payment.save(update_fields=['commission_amount', 'net_amount'])
                fixed += 1

        # Corriger tous les paiements orphelins (commission=0, net=0, non-premium)
        for p in PaymentTransaction.objects.filter(
            payment_for='intervention',
            commission_amount=Decimal('0'),
            net_amount=Decimal('0'),
            mechanic__isnull=False,
        ).select_related('mechanic__user', 'breakdown_request'):
            if p.mechanic.user.role != 'mechanic_premium':
                commission = (p.amount * p.breakdown_request.commission_rate).quantize(
                    Decimal('0.01'), rounding=ROUND_DOWN
                )
                p.commission_amount = commission
                p.net_amount = p.amount - commission
                p.save(update_fields=['commission_amount', 'net_amount'])
                fixed += 1

        self.stdout.write(self.style.SUCCESS(f'  → {count} paiements créés, {fixed} corrigés (commission).'))

    # ── ABONNEMENTS PREMIUM ──────────────────────────────────────────────────
    def _create_premium_subscriptions(self, mechanics):
        count = 0
        # Renouvellements espacés de ~7 jours pour rester dans la fenêtre de
        # 36 jours tout en racontant un historique de plusieurs paiements.
        for (meca_idx, monthly_amount, periods_ago_list) in PREMIUM_SUBSCRIPTIONS_DATA:
            profile = mechanics[meca_idx]
            for periods_ago in periods_ago_list:
                ref = f'FEDA_SOUT_SUB_{meca_idx}_{periods_ago}'
                paid_at = _seeded_datetime(periods_ago * 7)
                payment, created = PaymentTransaction.objects.get_or_create(
                    provider_reference=ref,
                    defaults={
                        'payer_name':     profile.user.full_name,
                        'payer_phone':    profile.user.phone,
                        'amount':         monthly_amount,
                        'currency':       'XOF',
                        'payment_method': 'MTN Mobile Money' if periods_ago % 2 else 'Moov Money',
                        'payment_for':    'premium_subscription',
                        'status':         'paid',
                        'mechanic':       profile,
                        'paid_at':        paid_at,
                        'metadata':       {'source': 'seed_soutenance'},
                    },
                )
                if created:
                    PaymentTransaction.objects.filter(pk=payment.pk).update(created_at=paid_at)
                    count += 1
        self.stdout.write(self.style.SUCCESS(f'  → {count} paiements abonnement premium créés.'))

    # ── AVIS ─────────────────────────────────────────────────────────────────
    def _create_reviews(self, mechanics, interventions):
        count = 0
        for (meca_idx, reviewer_name, rating, comment, bd_idx) in REVIEWS_DATA:
            profile = mechanics[meca_idx]

            # Trouver l'intervention liée si bd_idx fourni
            linked_intv = None
            if bd_idx is not None:
                linked_intv = interventions.get(bd_idx)

            if linked_intv:
                review, created = MechanicReview.objects.get_or_create(
                    mechanic=profile,
                    intervention=linked_intv,
                    defaults={
                        'reviewer_name': reviewer_name,
                        'rating':        rating,
                        'comment':       comment,
                        'is_visible':    True,
                    },
                )
                review_date = (linked_intv.completed_at or linked_intv.created_at) + timedelta(hours=random.randint(1, 48))
            else:
                review, created = MechanicReview.objects.get_or_create(
                    mechanic=profile,
                    reviewer_name=reviewer_name,
                    defaults={
                        'rating':     rating,
                        'comment':    comment,
                        'is_visible': True,
                    },
                )
                review_date = _seeded_datetime(random.randint(0, SEED_WINDOW_DAYS))
            if created:
                MechanicReview.objects.filter(pk=review.pk).update(created_at=review_date)
                count += 1

        self.stdout.write(self.style.SUCCESS(f'  → {count} avis créés.'))

    # ── MESSAGES conducteur ↔ admin ──────────────────────────────────────────
    def _create_messages(self, breakdowns):
        count = 0
        for (bd_idx, exchanges) in MESSAGES_DATA:
            br = breakdowns[bd_idx]
            if Message.objects.filter(breakdown_request=br).exists():
                continue
            base_time = br.created_at
            for (sender_type, content, minutes_offset) in exchanges:
                sender_name = br.driver_name if sender_type == 'driver' else 'Administration'
                msg = Message.objects.create(
                    breakdown_request=br,
                    sender_type=sender_type,
                    sender_name=sender_name,
                    content=content,
                )
                Message.objects.filter(pk=msg.pk).update(
                    created_at=base_time + timedelta(minutes=minutes_offset)
                )
                count += 1
        self.stdout.write(self.style.SUCCESS(f'  → {count} messages conducteur↔admin créés.'))

    # ── MESSAGES mécanicien → admin ───────────────────────────────────────────
    def _create_mechanic_admin_messages(self, mechanics):
        count = 0
        for (meca_idx, sender_type, content) in MECH_ADMIN_MESSAGES_DATA:
            profile = mechanics[meca_idx]
            sender_name = profile.user.full_name if sender_type == 'mechanic' else 'Administration'
            msg, created = MechanicAdminMessage.objects.get_or_create(
                mechanic=profile,
                sender_type=sender_type,
                content=content,
                defaults={'sender_name': sender_name},
            )
            if created:
                MechanicAdminMessage.objects.filter(pk=msg.pk).update(
                    created_at=_seeded_datetime(random.randint(0, SEED_WINDOW_DAYS))
                )
                count += 1
        self.stdout.write(self.style.SUCCESS(f'  → {count} messages mécanicien→admin créés.'))

    # ── OTP ──────────────────────────────────────────────────────────────────
    def _create_otps(self, drivers):
        count = 0
        now = timezone.now()
        for i, user in enumerate(drivers):
            code = str(100001 + i)
            otp, created = DriverOTP.objects.get_or_create(
                phone=user.phone,
                code=code,
                defaults={
                    'expires_at': now + timedelta(minutes=10),
                    'is_used':    (i % 2 == 0),
                    'attempts':   0,
                },
            )
            if created:
                count += 1

        # 20e OTP : 2e OTP pour le 1er conducteur (is_used=False)
        code_extra = '100020'
        otp_extra, created = DriverOTP.objects.get_or_create(
            phone=drivers[0].phone,
            code=code_extra,
            defaults={
                'expires_at': now + timedelta(minutes=10),
                'is_used':    False,
                'attempts':   0,
            },
        )
        if created:
            count += 1

        self.stdout.write(self.style.SUCCESS(f'  → {count} OTP créés.'))

    # ── INCIDENTS ────────────────────────────────────────────────────────────
    def _create_incidents(self, interventions):
        count = 0
        for (bd_idx, emitter_type, emitter_name, target_name,
             incident_type, gravity, status, description) in INCIDENTS_DATA:

            linked_intv = interventions.get(bd_idx)
            existing = Incident.objects.filter(
                emitter_name=emitter_name,
                incident_type=incident_type,
                target_name=target_name,
            ).first()
            if existing:
                continue

            incident = Incident.objects.create(
                intervention=linked_intv,
                emitter_type=emitter_type,
                emitter_name=emitter_name,
                target_name=target_name,
                incident_type=incident_type,
                gravity=gravity,
                description=description,
                status=status,
            )
            incident_date = (
                (linked_intv.completed_at or linked_intv.created_at) + timedelta(hours=random.randint(1, 72))
                if linked_intv else _seeded_datetime(random.randint(0, SEED_WINDOW_DAYS))
            )
            Incident.objects.filter(pk=incident.pk).update(created_at=incident_date)
            count += 1

        self.stdout.write(self.style.SUCCESS(f'  → {count} incidents créés.'))

    # ── DEMANDES PREMIUM ─────────────────────────────────────────────────────
    def _create_premium_contacts(self, mechanics, drivers):
        count = 0
        for i, (meca_idx, req_name, req_phone, reason, status) in enumerate(PREMIUM_CONTACTS_DATA):
            profile = mechanics[meca_idx]
            request_date = _seeded_datetime(random.randint(0, SEED_WINDOW_DAYS))
            reviewed_date = request_date + timedelta(hours=random.randint(1, 24)) if status != 'pending' else None
            contact, created = PremiumContactRequest.objects.get_or_create(
                mechanic=profile,
                requester_phone=req_phone,
                defaults={
                    'requester_name':       req_name,
                    'requester_reason':     reason,
                    'requester_ip':         f'41.202.220.{i+10}',
                    'requester_user_agent': 'SeedSoutenance/1.0',
                    'status':               status,
                    'reviewed_at':          reviewed_date,
                },
            )
            if created:
                PremiumContactRequest.objects.filter(pk=contact.pk).update(created_at=request_date)
                count += 1
        self.stdout.write(self.style.SUCCESS(f'  → {count} demandes premium créées.'))

    # ── RETRAITS ─────────────────────────────────────────────────────────────
    def _create_withdrawals(self, mechanics, admin):
        count = 0
        for (meca_idx, amount, status) in WITHDRAWALS_DATA:
            profile = mechanics[meca_idx]
            # Même formule que mechanic_withdraw (views.py) : frais = amount *
            # WITHDRAWAL_FEE_RATE, le mécanicien reçoit `amount` pile, le solde
            # est débité de amount + frais.
            fee = (amount * settings.WITHDRAWAL_FEE_RATE).quantize(Decimal('1'), rounding=ROUND_DOWN)

            existing = WithdrawalRequest.objects.filter(
                mechanic=profile,
                amount=amount,
                status=status,
            ).first()
            if existing:
                continue

            requested_date = _seeded_datetime(random.randint(0, SEED_WINDOW_DAYS))
            processed_date = requested_date + timedelta(hours=random.randint(1, 48))

            wr = WithdrawalRequest.objects.create(
                mechanic=profile,
                amount=amount,
                fee=fee,
                net_amount=amount,
                momo_number=profile.user.phone,
                momo_provider='mtn' if profile.user.phone.endswith(('1', '3', '5', '7', '9')) else 'moov',
                status=status,
                processed_by=admin if status in ('approved', 'rejected') else None,
                processed_at=processed_date if status in ('approved', 'rejected') else None,
            )
            WithdrawalRequest.objects.filter(pk=wr.pk).update(created_at=requested_date)
            count += 1
        self.stdout.write(self.style.SUCCESS(f'  → {count} retraits créés.'))

    # ── SOLDES MÉCANICIENS ───────────────────────────────────────────────────
    def _create_balances(self, mechanics):
        for (meca_idx, balance) in BALANCES_DATA:
            profile = mechanics[meca_idx]
            MechanicProfile.objects.filter(pk=profile.pk).update(balance=balance)
            profile.balance = balance
        self.stdout.write(self.style.SUCCESS(f'  → {len(BALANCES_DATA)} soldes mécaniciens mis à jour.'))

    # ── RAPPORT FINAL ────────────────────────────────────────────────────────
    def _print_report(self):
        from apps.mechanics.models import Specialty, MechanicProfile, MechanicReview, MechanicAdminMessage
        from apps.breakdowns.models import BreakdownRequest, Message
        from apps.interventions.models import Intervention
        from apps.payments.models import PaymentTransaction, WithdrawalRequest
        from apps.otp.models import DriverOTP
        from apps.incidents.models import Incident
        from apps.premium.models import PremiumContactRequest

        sep = '═' * 58
        self.stdout.write('\n' + sep)
        self.stdout.write(self.style.SUCCESS('  RAPPORT SEED SOUTENANCE'))
        self.stdout.write(sep)
        rows = [
            ('mechanics_specialty',       Specialty.objects.count()),
            ('accounts_user',             User.objects.count()),
            ('mechanics_profile',         MechanicProfile.objects.count()),
            ('breakdowns_request',        BreakdownRequest.objects.count()),
            ('interventions_intervention',Intervention.objects.count()),
            ('payments_transaction',      PaymentTransaction.objects.count()),
            ('mechanics_review',          MechanicReview.objects.count()),
            ('breakdowns_message',        Message.objects.count()),
            ('mechanics_admin_message',   MechanicAdminMessage.objects.count()),
            ('otp_driver_otp',            DriverOTP.objects.count()),
            ('incidents_incident',        Incident.objects.count()),
            ('premium_contact_request',   PremiumContactRequest.objects.count()),
            ('payments_withdrawal',       WithdrawalRequest.objects.count()),
        ]
        minimums = [20, 40, 20, 25, 22, 20, 20, 30, 20, 20, 20, 20, 20]
        # NB: au moins 20 entrées par table métier, noms locaux (Bénin)
        total = 0
        for (table, cnt), minimum in zip(rows, minimums):
            ok = '✅' if cnt >= minimum else '⚠️ '
            self.stdout.write(f'  {ok}  {table:<34s} {cnt:>4d}  (min {minimum})')
            total += cnt
        self.stdout.write(sep)
        self.stdout.write(self.style.SUCCESS(f'  TOTAL entrées : {total}'))
        self.stdout.write(sep + '\n')
        self.stdout.write(f'  Admin       : {ADMIN_EMAIL}  /  {ADMIN_PASSWORD}')
        self.stdout.write(f'  Mécaniciens : <prenom.nom>@depannage.bj  /  {MECHANIC_PASSWORD}')
        self.stdout.write(f'  Conducteurs : voir DRIVERS_DATA  /  {DRIVER_PASSWORD}')
        self.stdout.write(sep + '\n')
