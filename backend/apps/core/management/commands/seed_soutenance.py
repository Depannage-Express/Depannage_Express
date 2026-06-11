"""
Management command: seed_soutenance
Génère les données de soutenance pour DépannageExpress.
Au moins 20 entrées par table métier.

Usage:
    python manage.py seed_soutenance
"""
from decimal import Decimal
from datetime import timedelta
import random

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.breakdowns.models import BreakdownRequest, Message
from apps.incidents.models import Incident
from apps.interventions.models import Intervention
from apps.mechanics.models import MechanicProfile, MechanicReview, Specialty
from apps.otp.models import DriverOTP
from apps.payments.models import PaymentTransaction, WithdrawalRequest
from apps.premium.models import PremiumContactRequest


ADMIN_EMAIL = 'admin.soutenance@depannage.bj'
ADMIN_PASSWORD = 'Admin@2024!'
DRIVER_PASSWORD = 'Driver@2024!'
MECHANIC_PASSWORD = 'Mechanic@2024!'


def _rdate(jours_max=60):
    return timezone.now() - timedelta(
        days=random.randint(0, jours_max),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )


# ── SPÉCIALITÉS (15) ──────────────────────────────────────────────────────────
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
]

# ── MÉCANICIENS (15) ──────────────────────────────────────────────────────────
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
        'status': 'approved', 'is_premium': False, 'years_experience': 10,
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
        'status': 'approved', 'is_premium': False, 'years_experience': 3,
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
        'status': 'approved', 'is_premium': False, 'years_experience': 6,
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
]

# ── CONDUCTEURS (19) ──────────────────────────────────────────────────────────
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

# Montants par type de panne
COSTS = {
    'moteur':        Decimal('18000'),
    'electrique':    Decimal('12000'),
    'pneu':          Decimal('8000'),
    'carburant':     Decimal('10000'),
    'demarrage':     Decimal('10000'),
    'general':       Decimal('15000'),
    'climatisation': Decimal('20000'),
    'freins':        Decimal('14000'),
}

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

# ── MESSAGES (30) ─────────────────────────────────────────────────────────────
# (bd_idx, [(sender_type, content, minutes_offset), ...])
MESSAGES_DATA = [
    (0, [
        ('driver',   "Bonjour, ma Toyota est en panne moteur devant la station Total. Je suis bloqué.", 0),
        ('mechanic', "Je suis en route, j'arrive dans 10 minutes.", 5),
        ('driver',   "Merci, je vous attends au bord de la route.", 7),
    ]),
    (1, [
        ('driver',   "Crevaison totale pneu arrière, je suis devant le marché Akpakpa.", 0),
        ('mechanic', "Bonjour, quelle est votre position exacte ?", 3),
        ('driver',   "Je suis garé devant le marché Dantokpa. Voiture blanche.", 5),
    ]),
    (2, [
        ('driver',   "Panne électrique sur mon Renault. Je suis à Kpébié Parakou.", 0),
        ('mechanic', "Bonjour, je suis disponible. J'arrive dans 15 minutes.", 8),
        ('driver',   "D'accord, pas de problème. Je vous attends.", 10),
    ]),
    (3, [
        ('driver',   "Panne sèche sur le boulevard, réservoir vide.", 0),
        ('mechanic', "Je suis en route avec du carburant. Avez-vous les papiers du véhicule ?", 5),
        ('driver',   "Oui, tout est dans la boîte à gants.", 7),
    ]),
    (4, [
        ('driver',   "Voiture en panne générale à Godomey. Je ne sais pas ce qui se passe.", 0),
        ('mechanic', "Décrivez les symptômes. Est-ce que le moteur démarre ?", 6),
        ('driver',   "Non, plus rien. Le moteur est complètement mort.", 8),
    ]),
    (5, [
        ('driver',   "Panne moteur à Albarika. Témoin moteur allumé depuis hier.", 0),
        ('mechanic', "Je suis en route depuis Parakou. Je commence les réparations.", 12),
        ('driver',   "Merci beaucoup pour votre aide.", 45),
    ]),
    (6, [
        ('driver',   "Crevaison à la rue des cheminots. Je suis coincé.", 0),
        ('mechanic', "Je serai là dans 5 minutes.", 4),
    ]),
    (7, [
        ('driver',   "Problème de freins à Agla. Pédale molle.", 0),
        ('mechanic', "Pouvez-vous m'envoyer votre position GPS ?", 3),
    ]),
    (9, [
        ('driver',   "Panne électrique à Haie Vive. Les lumières clignotent.",   0),
        ('mechanic', "Je commence les réparations. Le problème est plus sérieux que prévu.", 20),
        ('driver',   "Est-ce que ça va prendre longtemps ?", 25),
    ]),
    (10, [
        ('driver',   "Moteur qui cale sur Fidjrossè. Fumée blanche.",             0),
        ('mechanic', "Intervention terminée, tout est en ordre. Vous pouvez démarrer.", 60),
        ('driver',   "Merci, véhicule opérationnel.", 65),
    ]),
    (13, [
        ('driver',   "Crevaison à Bohicon face à la mairie. Voiture rouge, plaque 1234 AB.", 0),
        ('mechanic', "J'ai besoin d'une pièce, je reviens demain.", 15),
    ]),
    (14, [
        ('driver',   "Panne moteur au marché Arzèkè. Land Cruiser beige.",        0),
        ('mechanic', "Combien de temps encore ?",                                  5),
    ]),
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

# ── DEMANDES PREMIUM (10) ─────────────────────────────────────────────────────
# (meca_idx [non-premium approuvé], requester_name, requester_phone, reason, status)
PREMIUM_CONTACTS_DATA = [
    (2,  'Kofi Alabi',        '+22996200001', 'J\'ai besoin d\'un spécialiste pneus pour ma flotte de taxis.',    'pending'),
    (3,  'Akossiwa Sossa',    '+22996200002', 'Problème récurrent sur ma Dacia, je cherche un expert.',           'approved'),
    (4,  'Mensah Kplante',    '+22996200003', 'Besoin de dépannage régulier pour camion de livraison.',           'approved'),
    (6,  'Dossou Agbavon',    '+22996200004', 'Panne carburant fréquente, besoin de diagnostic complet.',         'pending'),
    (7,  'Houssou Gbesson',   '+22996200005', 'Direction assistée défaillante sur mon véhicule de fonction.',     'approved'),
    (9,  'Dada Tchibozo',     '+22996200006', 'Carrosserie endommagée après accident mineur, devis urgent.',      'rejected'),
    (10, 'Gbessemehlan Aho',  '+22996200007', 'Service de remorquage pour mon garage, contact professionnel.',    'pending'),
    (11, 'Chabi Oyedele',     '+22996200008', 'Problème électrique récurrent sur Toyota Corolla 2018.',           'approved'),
    (2,  'Adjovi Kpossou',    '+22996200009', 'Crevaison fréquente, besoin d\'un spécialiste de confiance.',      'pending'),
    (3,  'Gnansounou Boko',   '+22996200010', 'Frein à main défectueux, intervention urgente souhaitée.',         'rejected'),
]

# ── RETRAITS (10) ─────────────────────────────────────────────────────────────
# (meca_idx, amount, status)
WITHDRAWALS_DATA = [
    (0,  Decimal('20000'), 'approved'),
    (1,  Decimal('15000'), 'approved'),
    (2,  Decimal('8000'),  'pending'),
    (3,  Decimal('10000'), 'approved'),
    (4,  Decimal('12000'), 'rejected'),
    (5,  Decimal('15000'), 'approved'),
    (6,  Decimal('5000'),  'pending'),
    (7,  Decimal('10000'), 'approved'),
    (8,  Decimal('20000'), 'approved'),
    (9,  Decimal('8000'),  'pending'),
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
        self._create_reviews(mechanics, interventions)
        self._create_messages(breakdowns)
        self._create_otps(drivers)
        self._create_incidents(interventions)
        self._create_premium_contacts(mechanics, drivers)
        self._create_withdrawals(mechanics, admin)
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
        self.stdout.write(f"  Admin [{'+ créé' if created else '✓'}] : {ADMIN_EMAIL}")
        return admin

    # ── MÉCANICIENS ──────────────────────────────────────────────────────────
    def _create_mechanics(self, specialties, admin):
        mechanics = []
        for d in MECHANICS_DATA:
            role = 'mechanic_premium' if d['is_premium'] else 'mechanic_standard'
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

            validated_at = timezone.now() if d['status'] == 'approved' else None
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

            marker = f"+ créé ({'premium' if d['is_premium'] else 'standard'}, {d['status']})"
            self.stdout.write(f"  Mécanicien [{'+ créé' if u_created else '✓'}] : {user.full_name} — {d['city']}")
            mechanics.append(profile)
        return mechanics

    # ── CONDUCTEURS ──────────────────────────────────────────────────────────
    def _create_drivers(self):
        drivers = []
        for (fn, ln, email, phone) in DRIVERS_DATA:
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
            self.stdout.write(f"  Conducteur [{'+ créé' if created else '✓'}] : {fn} {ln}")
            drivers.append(user)
        return drivers

    # ── DEMANDES ─────────────────────────────────────────────────────────────
    def _create_breakdowns(self, mechanics, drivers, specialties):
        breakdowns = []
        now = timezone.now()
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
            created_date = now - timedelta(days=days_ago, hours=random.randint(0, 12))

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
                    'status':                bd_status,
                    'assigned_mechanic':     meca,
                    'assigned_at':           created_date + timedelta(minutes=30) if meca else None,
                    'assignment_distance_km':Decimal('3.50') if meca else None,
                    'ip_address':            '41.202.220.1',
                    'user_agent':            'SeedSoutenance/1.0',
                },
            )
            if created:
                BreakdownRequest.objects.filter(pk=br.pk).update(created_at=created_date)

            self.stdout.write(f"  Demande [{'+ créée' if created else '✓'}] : {driver_user.full_name} — {prompt_status} — {vehicle[:30]}")
            breakdowns.append(br)
        return breakdowns

    # ── INTERVENTIONS ────────────────────────────────────────────────────────
    def _create_interventions(self, breakdowns, mechanics):
        now = timezone.now()
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
            cost = COSTS[bd_type]
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
                    'estimated_cost': COSTS[BREAKDOWNS_DATA[bd_idx][1]],
                },
            )
            if created:
                Intervention.objects.filter(pk=intv.pk).update(created_at=refused_date)
                total_created += 1
            extra_refused.append((bd_idx, intv))
            self.stdout.write(f"  Intervention refused extra [{'+ créée' if created else '✓'}] : bd#{br.id} — {meca.user.full_name}")

        self.stdout.write(self.style.SUCCESS(f'  → {total_created} interventions créées.'))
        return interventions, extra_refused

    # ── PAIEMENTS ────────────────────────────────────────────────────────────
    def _create_payments(self, breakdowns, interventions, extra_refused):
        now = timezone.now()
        count = 0

        intv_payment_map = {
            'paid':               ('paid',    'intervention'),
            'reviewed':           ('paid',    'intervention'),
            'completed':          ('paid',    'intervention'),
            'in_progress':        ('pending', 'intervention'),
            'accepted':           ('pending', 'intervention'),
            'pending_acceptance': ('pending', 'intervention'),
            'refused':            ('pending', 'intervention'),
        }

        pay_idx = 1

        # Paiements pour les interventions principales (19)
        for bd_idx, intv in interventions.items():
            bd_type = BREAKDOWNS_DATA[bd_idx][1]
            cost = COSTS[bd_type]
            bd = breakdowns[bd_idx]
            pay_status, pay_for = intv_payment_map.get(intv.status, ('pending', 'intervention'))
            ref = f'FEDA_SOUT_{pay_idx:04d}'
            paid_at = intv.paid_at if pay_status == 'paid' else None

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
                    'paid_at':           paid_at,
                    'metadata':          {'source': 'seed_soutenance'},
                },
            )
            if created:
                count += 1
            pay_idx += 1

        # +1 paiement pour la 1re intervention refused (assure le minimum 20)
        if extra_refused:
            bd_idx, intv = extra_refused[0]
            bd = breakdowns[bd_idx]
            ref = f'FEDA_SOUT_{pay_idx:04d}'
            payment, created = PaymentTransaction.objects.get_or_create(
                provider_reference=ref,
                defaults={
                    'payer_name':        bd.driver_name,
                    'payer_phone':       bd.driver_phone,
                    'amount':            COSTS[BREAKDOWNS_DATA[bd_idx][1]],
                    'currency':          'XOF',
                    'payment_method':    'MTN Mobile Money',
                    'payment_for':       'intervention',
                    'status':            'pending',
                    'breakdown_request': bd,
                    'intervention':      intv,
                    'mechanic':          intv.mechanic,
                    'paid_at':           None,
                    'metadata':          {'source': 'seed_soutenance'},
                },
            )
            if created:
                count += 1

        self.stdout.write(self.style.SUCCESS(f'  → {count} paiements créés.'))

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
            if created:
                count += 1

        self.stdout.write(self.style.SUCCESS(f'  → {count} avis créés.'))

    # ── MESSAGES ─────────────────────────────────────────────────────────────
    def _create_messages(self, breakdowns):
        count = 0
        for (bd_idx, exchanges) in MESSAGES_DATA:
            br = breakdowns[bd_idx]
            if Message.objects.filter(breakdown_request=br).exists():
                continue
            base_time = br.created_at
            for (sender_type, content, minutes_offset) in exchanges:
                sender_name = br.driver_name if sender_type == 'driver' else (
                    br.assigned_mechanic.user.full_name if br.assigned_mechanic else 'Mécanicien'
                )
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
        self.stdout.write(self.style.SUCCESS(f'  → {count} messages créés.'))

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
            count += 1

        self.stdout.write(self.style.SUCCESS(f'  → {count} incidents créés.'))

    # ── DEMANDES PREMIUM ─────────────────────────────────────────────────────
    def _create_premium_contacts(self, mechanics, drivers):
        count = 0
        for i, (meca_idx, req_name, req_phone, reason, status) in enumerate(PREMIUM_CONTACTS_DATA):
            profile = mechanics[meca_idx]
            contact, created = PremiumContactRequest.objects.get_or_create(
                mechanic=profile,
                requester_phone=req_phone,
                defaults={
                    'requester_name':       req_name,
                    'requester_reason':     reason,
                    'requester_ip':         f'41.202.220.{i+10}',
                    'requester_user_agent': 'SeedSoutenance/1.0',
                    'status':               status,
                    'reviewed_at':          timezone.now() if status != 'pending' else None,
                },
            )
            if created:
                count += 1
        self.stdout.write(self.style.SUCCESS(f'  → {count} demandes premium créées.'))

    # ── RETRAITS ─────────────────────────────────────────────────────────────
    def _create_withdrawals(self, mechanics, admin):
        count = 0
        for (meca_idx, amount, status) in WITHDRAWALS_DATA:
            profile = mechanics[meca_idx]
            fee = (amount * Decimal('0.01')).quantize(Decimal('0.01'))
            net = amount - fee

            existing = WithdrawalRequest.objects.filter(
                mechanic=profile,
                amount=amount,
                status=status,
            ).first()
            if existing:
                continue

            wr = WithdrawalRequest.objects.create(
                mechanic=profile,
                amount=amount,
                fee=fee,
                net_amount=net,
                momo_number=profile.user.phone,
                momo_provider='mtn' if profile.user.phone.endswith(('1', '3', '5', '7', '9')) else 'moov',
                status=status,
                processed_by=admin if status in ('approved', 'rejected') else None,
                processed_at=timezone.now() if status in ('approved', 'rejected') else None,
            )
            count += 1
        self.stdout.write(self.style.SUCCESS(f'  → {count} retraits créés.'))

    # ── RAPPORT FINAL ────────────────────────────────────────────────────────
    def _print_report(self):
        from apps.mechanics.models import Specialty, MechanicProfile, MechanicReview
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
            ('mechanics_specialty',    Specialty.objects.count()),
            ('accounts_user',          User.objects.count()),
            ('mechanics_profile',      MechanicProfile.objects.count()),
            ('breakdowns_request',     BreakdownRequest.objects.count()),
            ('interventions_intervention', Intervention.objects.count()),
            ('payments_transaction',   PaymentTransaction.objects.count()),
            ('mechanics_review',       MechanicReview.objects.count()),
            ('breakdowns_message',     Message.objects.count()),
            ('otp_driver_otp',         DriverOTP.objects.count()),
            ('incidents_incident',     Incident.objects.count()),
            ('premium_contact_request',PremiumContactRequest.objects.count()),
            ('payments_withdrawal',    WithdrawalRequest.objects.count()),
        ]
        minimums = [15, 35, 15, 25, 22, 20, 20, 30, 20, 20, 10, 10]
        total = 0
        for (table, cnt), minimum in zip(rows, minimums):
            ok = '✅' if cnt >= minimum else '⚠️ '
            self.stdout.write(f'  {ok}  {table:<32s} {cnt:>4d}  (min {minimum})')
            total += cnt
        self.stdout.write(sep)
        self.stdout.write(self.style.SUCCESS(f'  TOTAL entrées : {total}'))
        self.stdout.write(sep + '\n')
        self.stdout.write(f'  Admin       : {ADMIN_EMAIL}  /  {ADMIN_PASSWORD}')
        self.stdout.write(f'  Mécaniciens : <prenom.nom>@depannage.bj  /  {MECHANIC_PASSWORD}')
        self.stdout.write(f'  Conducteurs : voir DRIVERS_DATA  /  {DRIVER_PASSWORD}')
        self.stdout.write(sep + '\n')
