"""
Management command: seed_demo
Génère les données de démonstration pour DépannageExpress.

Usage:
    python manage.py seed_demo           # crée (idempotent)
    python manage.py seed_demo --flush   # supprime puis recrée
"""
from decimal import Decimal
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.breakdowns.models import BreakdownRequest, Message
from apps.interventions.models import Intervention
from apps.mechanics.models import MechanicProfile, MechanicReview, Specialty
from apps.payments.models import PaymentTransaction


ADMIN_EMAIL = 'admin@depannage.bj'
ADMIN_PASSWORD = 'Admin2024!'
DEMO_PASSWORD = 'Demo2024!'

SPECIALTIES = [
    {'name': 'Mécanique générale',       'description': 'Réparations mécaniques courantes',              'icon': 'wrench'},
    {'name': 'Électricité automobile',    'description': 'Diagnostics et réparations électriques',        'icon': 'zap'},
    {'name': 'Pneumatiques & pneus',      'description': 'Changement et réparation de pneus',             'icon': 'circle'},
    {'name': 'Climatisation',             'description': 'Entretien et réparation de climatisation',      'icon': 'wind'},
    {'name': 'Poids lourds & camions',    'description': 'Dépannage véhicules lourds et utilitaires',     'icon': 'truck'},
]

MECHANICS_DATA = [
    # ── 6 PREMIUM (index 0 à 5) ────────────────────────────────────────
    {
        'email': 'kodjo.agbossou@depannage.bj',
        'first_name': 'Kodjo', 'last_name': 'Agbossou',
        'phone': '+22997001001',
        'role': 'mechanic_premium',
        'bio': "Mécanicien expérimenté spécialisé en mécanique générale et électricité auto. 12 ans d'expérience à Cotonou.",
        'years_experience': 12,
        'latitude': Decimal('6.3703000'), 'longitude': Decimal('2.3912000'),
        'address': 'Rue du Gouverneur, Cotonou Centre',
        'city': 'Cotonou',
        'specialties': ['Mécanique générale', 'Électricité automobile'],
        'rating': Decimal('4.80'), 'reviews': 47, 'interventions_count': 120,
    },
    {
        'email': 'sara.hounkpatin@depannage.bj',
        'first_name': 'Sara', 'last_name': 'Hounkpatin',
        'phone': '+22997002002',
        'role': 'mechanic_premium',
        'bio': "Spécialiste en climatisation et électricité auto. Certifiée constructeur, 8 ans d'expérience.",
        'years_experience': 8,
        'latitude': Decimal('6.3560000'), 'longitude': Decimal('2.4345000'),
        'address': 'Carrefour Akpakpa, Cotonou Est',
        'city': 'Cotonou',
        'specialties': ['Climatisation', 'Électricité automobile'],
        'rating': Decimal('4.60'), 'reviews': 31, 'interventions_count': 85,
    },
    {
        'email': 'felix.kpodo@depannage.bj',
        'first_name': 'Félix', 'last_name': 'Kpodo',
        'phone': '+22997003003',
        'role': 'mechanic_premium',
        'bio': "Spécialiste poids lourds et véhicules de transport. 15 ans d'expérience en dépannage lourd.",
        'years_experience': 15,
        'latitude': Decimal('6.3825000'), 'longitude': Decimal('2.3645000'),
        'address': 'Fidjrossè Plage, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Poids lourds & camions', 'Mécanique générale'],
        'rating': Decimal('4.90'), 'reviews': 58, 'interventions_count': 145,
    },
    {
        'email': 'romuald.gnansounou@depannage.bj',
        'first_name': 'Romuald', 'last_name': 'Gnansounou',
        'phone': '+22997004004',
        'role': 'mechanic_premium',
        'bio': "Expert en diagnostic électronique et systèmes embarqués. Certifié Bosch Car Service.",
        'years_experience': 10,
        'latitude': Decimal('6.3680000'), 'longitude': Decimal('2.4100000'),
        'address': 'Agla, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Électricité automobile', 'Mécanique générale'],
        'rating': Decimal('4.75'), 'reviews': 39, 'interventions_count': 98,
    },
    {
        'email': 'clarisse.azonhiho@depannage.bj',
        'first_name': 'Clarisse', 'last_name': 'Azonhiho',
        'phone': '+22997005005',
        'role': 'mechanic_premium',
        'bio': "Mécanicienne premium spécialisée en climatisation et entretien véhicules japonais.",
        'years_experience': 9,
        'latitude': Decimal('6.3490000'), 'longitude': Decimal('2.4200000'),
        'address': 'Vèdoko, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Climatisation', 'Mécanique générale'],
        'rating': Decimal('4.65'), 'reviews': 27, 'interventions_count': 73,
    },
    {
        'email': 'stephane.kossou@depannage.bj',
        'first_name': 'Stéphane', 'last_name': 'Kossou',
        'phone': '+22997006006',
        'role': 'mechanic_premium',
        'bio': "Spécialiste pneumatiques et géométrie de train roulant. Équipement professionnel.",
        'years_experience': 11,
        'latitude': Decimal('6.4100000'), 'longitude': Decimal('2.3200000'),
        'address': 'Abomey-Calavi Centre',
        'city': 'Abomey-Calavi',
        'specialties': ['Pneumatiques & pneus', 'Mécanique générale'],
        'rating': Decimal('4.55'), 'reviews': 34, 'interventions_count': 89,
    },
    # ── 14 STANDARD (index 6 à 19) ─────────────────────────────────────
    {
        'email': 'marc.dossou@depannage.bj',
        'first_name': 'Marc', 'last_name': 'Dossou',
        'phone': '+22997007007',
        'role': 'mechanic_standard',
        'bio': "Mécanicien généraliste, dépannage rapide sur route. Disponible 7j/7.",
        'years_experience': 5,
        'latitude': Decimal('6.3641000'), 'longitude': Decimal('2.3798000'),
        'address': 'Cadjehoun, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Mécanique générale', 'Pneumatiques & pneus'],
        'rating': Decimal('4.20'), 'reviews': 18, 'interventions_count': 52,
    },
    {
        'email': 'aline.gbedou@depannage.bj',
        'first_name': 'Aline', 'last_name': 'Gbedou',
        'phone': '+22997008008',
        'role': 'mechanic_standard',
        'bio': "Mécanicienne certifiée, spécialiste pneumatiques et mécanique légère.",
        'years_experience': 6,
        'latitude': Decimal('6.4004000'), 'longitude': Decimal('2.3375000'),
        'address': 'Godomey Carrefour, Abomey-Calavi',
        'city': 'Abomey-Calavi',
        'specialties': ['Pneumatiques & pneus', 'Mécanique générale'],
        'rating': Decimal('4.70'), 'reviews': 15, 'interventions_count': 38,
    },
    {
        'email': 'ibrahim.sanni@depannage.bj',
        'first_name': 'Ibrahim', 'last_name': 'Sanni',
        'phone': '+22997009009',
        'role': 'mechanic_standard',
        'bio': "Mécanicien polyvalent, intervention rapide dans tout Cotonou.",
        'years_experience': 4,
        'latitude': Decimal('6.3590000'), 'longitude': Decimal('2.3850000'),
        'address': 'Zogbo, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Mécanique générale'],
        'rating': Decimal('3.90'), 'reviews': 11, 'interventions_count': 29,
    },
    {
        'email': 'prudence.adossou@depannage.bj',
        'first_name': 'Prudence', 'last_name': 'Adossou',
        'phone': '+22997010010',
        'role': 'mechanic_standard',
        'bio': "Spécialiste en électricité auto et diagnostic moteur, 7 ans d'expérience.",
        'years_experience': 7,
        'latitude': Decimal('6.3720000'), 'longitude': Decimal('2.3650000'),
        'address': 'Gbèdjromèdé, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Électricité automobile'],
        'rating': Decimal('4.30'), 'reviews': 20, 'interventions_count': 61,
    },
    {
        'email': 'therese.gandonou@depannage.bj',
        'first_name': 'Thérèse', 'last_name': 'Gandonou',
        'phone': '+22997011011',
        'role': 'mechanic_standard',
        'bio': "Mécanicienne véhicules légers. Forte expérience en entretien courant et vidange.",
        'years_experience': 3,
        'latitude': Decimal('6.3800000'), 'longitude': Decimal('2.4050000'),
        'address': 'Avotrou, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Mécanique générale'],
        'rating': Decimal('4.00'), 'reviews': 8, 'interventions_count': 21,
    },
    {
        'email': 'oscar.tokpanou@depannage.bj',
        'first_name': 'Oscar', 'last_name': 'Tokpanou',
        'phone': '+22997012012',
        'role': 'mechanic_standard',
        'bio': "Dépannage poids lourds et engins de chantier. Région de Bohicon.",
        'years_experience': 8,
        'latitude': Decimal('7.1850000'), 'longitude': Decimal('2.0720000'),
        'address': 'Bohicon Centre',
        'city': 'Bohicon',
        'specialties': ['Poids lourds & camions'],
        'rating': Decimal('4.10'), 'reviews': 14, 'interventions_count': 44,
    },
    {
        'email': 'sylvie.houeha@depannage.bj',
        'first_name': 'Sylvie', 'last_name': 'Houéha',
        'phone': '+22997013013',
        'role': 'mechanic_standard',
        'bio': "Mécanicienne généraliste basée à Porto-Novo. Intervention rapide.",
        'years_experience': 5,
        'latitude': Decimal('6.4960000'), 'longitude': Decimal('2.6280000'),
        'address': 'Ouando, Porto-Novo',
        'city': 'Porto-Novo',
        'specialties': ['Mécanique générale', 'Pneumatiques & pneus'],
        'rating': Decimal('4.15'), 'reviews': 12, 'interventions_count': 33,
    },
    {
        'email': 'bertrand.vigan@depannage.bj',
        'first_name': 'Bertrand', 'last_name': 'Vigan',
        'phone': '+22997014014',
        'role': 'mechanic_standard',
        'bio': "Expert en climatisation auto. Recharge de gaz et dépannage compresseur.",
        'years_experience': 6,
        'latitude': Decimal('6.3510000'), 'longitude': Decimal('2.4300000'),
        'address': 'Kpankpan, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Climatisation'],
        'rating': Decimal('4.25'), 'reviews': 16, 'interventions_count': 47,
    },
    {
        'email': 'justin.azondekon@depannage.bj',
        'first_name': 'Justin', 'last_name': 'Azondekon',
        'phone': '+22997015015',
        'role': 'mechanic_standard',
        'bio': "Mécanicien auto expérimenté, spécialité freinage et suspension.",
        'years_experience': 9,
        'latitude': Decimal('6.3760000'), 'longitude': Decimal('2.3700000'),
        'address': 'Jéricho, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Mécanique générale'],
        'rating': Decimal('4.35'), 'reviews': 23, 'interventions_count': 70,
    },
    {
        'email': 'nadege.yekpe@depannage.bj',
        'first_name': 'Nadège', 'last_name': 'Yèkpè',
        'phone': '+22997016016',
        'role': 'mechanic_standard',
        'bio': "Technicienne pneus et jantes. Montage équilibrage sur place.",
        'years_experience': 4,
        'latitude': Decimal('6.3630000'), 'longitude': Decimal('2.3920000'),
        'address': 'Jonquet, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Pneumatiques & pneus'],
        'rating': Decimal('4.05'), 'reviews': 9, 'interventions_count': 25,
    },
    {
        'email': 'aurelien.hounnou@depannage.bj',
        'first_name': 'Aurélien', 'last_name': 'Hounnou',
        'phone': '+22997017017',
        'role': 'mechanic_standard',
        'bio': "Mécanicien moteur diesel, dépannage camions et minibus.",
        'years_experience': 12,
        'latitude': Decimal('6.3920000'), 'longitude': Decimal('2.3500000'),
        'address': 'Togba, Abomey-Calavi',
        'city': 'Abomey-Calavi',
        'specialties': ['Poids lourds & camions', 'Mécanique générale'],
        'rating': Decimal('4.45'), 'reviews': 26, 'interventions_count': 80,
    },
    {
        'email': 'patricia.daho@depannage.bj',
        'first_name': 'Patricia', 'last_name': 'Daho',
        'phone': '+22997018018',
        'role': 'mechanic_standard',
        'bio': "Mécanicienne auto formée au Maroc. Entretien complet toutes marques.",
        'years_experience': 7,
        'latitude': Decimal('6.3540000'), 'longitude': Decimal('2.4180000'),
        'address': 'Sainte-Rita, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Mécanique générale', 'Électricité automobile'],
        'rating': Decimal('4.50'), 'reviews': 19, 'interventions_count': 57,
    },
    {
        'email': 'severin.biaou@depannage.bj',
        'first_name': 'Séverin', 'last_name': 'Biaou',
        'phone': '+22997019019',
        'role': 'mechanic_standard',
        'bio': "Dépannage toutes marques. Parakou et environs. Disponible 24h/24.",
        'years_experience': 10,
        'latitude': Decimal('9.3380000'), 'longitude': Decimal('2.6290000'),
        'address': 'Marché Arzèkè, Parakou',
        'city': 'Parakou',
        'specialties': ['Mécanique générale', 'Pneumatiques & pneus'],
        'rating': Decimal('4.20'), 'reviews': 17, 'interventions_count': 55,
    },
    {
        'email': 'gilberte.codjo@depannage.bj',
        'first_name': 'Gilberte', 'last_name': 'Codjo',
        'phone': '+22997020020',
        'role': 'mechanic_standard',
        'bio': "Spécialiste entretien véhicules légers et utilitaires. Zona Cotonou.",
        'years_experience': 5,
        'latitude': Decimal('6.3660000'), 'longitude': Decimal('2.3760000'),
        'address': 'Wologuèdè, Cotonou',
        'city': 'Cotonou',
        'specialties': ['Mécanique générale'],
        'rating': Decimal('3.95'), 'reviews': 10, 'interventions_count': 28,
    },
]

# Tuple: (driver_name, driver_phone, vehicle, description, specialty_name, lat, lng, address, status, mechanic_idx_or_None, days_ago)
BREAKDOWNS_DATA = [
    ('Moussa Ahouannou',    '+22996001001', 'Toyota Corolla 2018 - Gris métallisé',
     "Voiture refuse de démarrer. Batterie déchargée, témoin batterie allumé.",
     'Électricité automobile', '6.3720000', '2.3950000',
     'Carrefour Saint-Michel, Cotonou', 'completed', 1, 30),

    ('Aminata Kpêdékpo',    '+22996002002', 'Honda CR-V 2020 - Blanc nacré',
     "Crevaison pneu arrière gauche sur l'autoroute, impossible de continuer.",
     'Pneumatiques & pneus', '6.3580000', '2.4280000',
     'Boulevard de la Marina, Cotonou', 'completed', 2, 25),

    ('Rodrigue Togbé',      '+22996003003', 'Renault Sandero 2019 - Rouge',
     "Témoin moteur allumé depuis ce matin, perte de puissance progressive.",
     'Mécanique générale', '6.3660000', '2.3820000',
     'Akpakpa Donatin, Cotonou', 'in_progress', 0, 5),

    ('Céleste Houenou',     '+22996004004', 'Peugeot 308 2017 - Noir',
     "Climatisation ne souffle plus que de l'air chaud, bruit anormal au démarrage.",
     'Climatisation', '6.3750000', '2.3870000',
     'Haie Vive, Cotonou', 'assigned', 1, 3),

    ('Patrice Adanhounmè',  '+22996005005', 'Mercedes Actros 2015 - Blanc',
     "Camion en panne sur nationale 1. Problème de boîte de vitesses.",
     'Poids lourds & camions', '6.3820000', '2.3710000',
     'Route Nationale 1, vers Porto-Novo', 'completed', 3, 20),

    ('Moussa Ahouannou',    '+22996001001', 'Hyundai Tucson 2021 - Bleu nuit',
     "Pédale de frein molle, bruit de grincement à chaque freinage.",
     'Mécanique générale', '6.3690000', '2.3980000',
     'Rue des Cheminots, Cotonou', 'completed', 2, 15),

    ('Aminata Kpêdékpo',    '+22996002002', 'Kia Sportage 2022 - Argent',
     "Voiture sortie de route dans le fossé, besoin de remorquage urgent.",
     'Mécanique générale', '6.4010000', '2.3350000',
     'Voie Express Godomey, direction Calavi', 'pending', None, 1),

    ('Rodrigue Togbé',      '+22996003003', 'Toyota Land Cruiser 2019 - Beige',
     "Surchauffe moteur, aiguille température dans le rouge, vapeur visible.",
     'Mécanique générale', '6.3630000', '2.4010000',
     "Près du Stade de l'Amitié, Cotonou", 'pending', None, 0),

    ('Céleste Houenou',     '+22996004004', 'Dacia Duster 2020 - Orange',
     "Deux pneus simultanément crevés après passage sur des débris de chantier.",
     'Pneumatiques & pneus', '6.3550000', '2.4450000',
     'Pont de Cotonou, direction Porto-Novo', 'assigned', 4, 2),

    ('Patrice Adanhounmè',  '+22996005005', 'Mitsubishi L200 2018 - Gris anthracite',
     "Batterie morte, aucun démarrage possible. Klaxon et lumières faibles.",
     'Électricité automobile', '6.3870000', '2.3600000',
     'Agence BIBE, Cotonou Nord', 'in_progress', 1, 0),
]

# (mechanic_email, reviewer_name, rating, comment)
REVIEWS_DATA = [
    # Kodjo Agbossou — avg 4.8
    ('kodjo.agbossou@depannage.bj', 'Moussa Hounsa', 5, "Intervention rapide et professionnelle. Problème résolu en moins d'une heure. Je recommande !"),
    ('kodjo.agbossou@depannage.bj', 'Fatou Bello', 5, "Excellent mécanicien. Très compétent en électricité auto. Prix raisonnable."),
    ('kodjo.agbossou@depannage.bj', 'René Dossou', 5, "Kodjo a diagnostiqué le problème en 10 minutes. Travail soigné et rapide."),
    ('kodjo.agbossou@depannage.bj', 'Sylvie Amoussou', 4, "Bon travail, ponctuel. Explications claires sur la panne."),
    ('kodjo.agbossou@depannage.bj', 'Joël Azonnou', 5, "Super service ! Disponible le dimanche matin. Batterie changée rapidement."),
    # Sara Hounkpatin — avg 4.6
    ('sara.hounkpatin@depannage.bj', 'Céleste Vodounou', 5, "Sara est une experte en climatisation. Ma voiture refroidit comme neuf !"),
    ('sara.hounkpatin@depannage.bj', 'Ghislain Akpo', 4, "Bonne intervention sur mon système électrique. Légèrement en retard mais très pro."),
    ('sara.hounkpatin@depannage.bj', 'Mariama Alabi', 5, "Très compétente, rapide et souriante. Je la recommande à tout le monde."),
    ('sara.hounkpatin@depannage.bj', 'Théodore Codjo', 4, "Bon travail sur ma batterie. Diagnostic précis."),
    ('sara.hounkpatin@depannage.bj', 'Carine Hounwanou', 5, "Excellente prestation. Elle a trouvé le problème que 2 autres mécaniciens n'ont pas vu."),
    # Félix Kpodo — avg 4.9
    ('felix.kpodo@depannage.bj', 'Patrice Adanhounmè', 5, "Félix est le meilleur pour les poids lourds. Mon camion repart en 3h. Merci !"),
    ('felix.kpodo@depannage.bj', 'Édouard Bossou', 5, "Intervention sur mon bus. Très professionnel, matériel de qualité."),
    ('felix.kpodo@depannage.bj', 'Agathe Tossou', 5, "Incroyable ! Il a réparé ma camionnette sur le bord de la route en 2h. Top !"),
    ('felix.kpodo@depannage.bj', 'Léonce Houéha', 5, "Mécanicien d'exception. Tarifs justes pour une qualité premium."),
    ('felix.kpodo@depannage.bj', 'Noëllie Sagbo', 5, "Le meilleur ! Disponible 24h/24. N'hésitez pas à l'appeler."),
    # Romuald Gnansounou — avg 4.75
    ('romuald.gnansounou@depannage.bj', 'Achille Toffa', 5, "Diagnostic électronique parfait. Problème identifié avec l'outil OBD en 5 min."),
    ('romuald.gnansounou@depannage.bj', 'Inès Goudja', 5, "Très compétent, explique tout clairement. Certifié Bosch, ça se voit !"),
    ('romuald.gnansounou@depannage.bj', 'Oscar Zannou', 4, "Bon travail sur mon électronique. Un peu cher mais qualité irréprochable."),
    ('romuald.gnansounou@depannage.bj', 'Bénédicte Ahouagbe', 5, "Rapide et efficace. Mon tableau de bord remarche parfaitement."),
    # Clarisse Azonhiho — avg 4.65
    ('clarisse.azonhiho@depannage.bj', 'Véronique Assogba', 5, "Ma Toyota refroidit comme il faut. Clarisse est une vraie pro de la climatisation."),
    ('clarisse.azonhiho@depannage.bj', 'Augustin Favi', 4, "Bonne intervention, rapide et propre. Rien à redire."),
    ('clarisse.azonhiho@depannage.bj', 'Mariam Gbaguidi', 5, "Excellente ! Elle connaît très bien les véhicules japonais. Je reviendrai."),
    ('clarisse.azonhiho@depannage.bj', 'Francis Hounton', 4, "Bonne prestation sur ma clim. Prix raisonnable."),
    # Stéphane Kossou — avg 4.55
    ('stephane.kossou@depannage.bj', 'Wilfried Ahyi', 5, "Géométrie refaite au millimètre. Ma voiture tient parfaitement la route maintenant."),
    ('stephane.kossou@depannage.bj', 'Rosine Dossa', 4, "Bonne prestation sur mes pneus. Équipement professionnel visible."),
    ('stephane.kossou@depannage.bj', 'Gontran Akpovi', 5, "4 pneus changés et équilibrés en 45 min. Excellent rapport qualité/prix."),
    ('stephane.kossou@depannage.bj', 'Adèle Soglo', 4, "Travail sérieux et rapide. Je recommande pour les pneus."),
    # Marc Dossou — avg 4.2
    ('marc.dossou@depannage.bj', 'Hyacinthe Vigan', 4, "Bon dépannage sur route. Rapide et efficace."),
    ('marc.dossou@depannage.bj', 'Odette Loko', 4, "Marc est disponible 7j/7, ça aide vraiment. Bon travail."),
    ('marc.dossou@depannage.bj', 'Lambert Glele', 5, "Pneu changé en 20 min sur l'autoroute. Super réactif !"),
    ('marc.dossou@depannage.bj', 'Clarisse Gbedo', 3, "Travail correct mais un peu long pour une crevaison simple."),
    # Aline Gbedou — avg 4.7
    ('aline.gbedou@depannage.bj', 'Théophile Akindes', 5, "Aline maîtrise parfaitement les pneumatiques. Très professionnelle."),
    ('aline.gbedou@depannage.bj', 'Émilienne Cossou', 4, "Bonne intervention, rapide et soignée. Je recommande."),
    ('aline.gbedou@depannage.bj', 'Gaston Fonton', 5, "Excellente mécanicienne. Pneus montés et équilibrés impeccablement."),
    # Prudence Adossou — avg 4.3
    ('prudence.adossou@depannage.bj', 'Joséphine Bocco', 4, "Bon diagnostic moteur. Problème résolu au premier coup."),
    ('prudence.adossou@depannage.bj', 'Romain Sossou', 5, "Très compétente en électricité auto. Mérite sa bonne réputation."),
    ('prudence.adossou@depannage.bj', 'Alexis Sonou', 4, "Bonne prestation. Explications claires sur la panne."),
    # Aurélien Hounnou — avg 4.45
    ('aurelien.hounnou@depannage.bj', 'Denis Aïssi', 5, "Spécialiste diesel très compétent. Mon camion repart nickel."),
    ('aurelien.hounnou@depannage.bj', 'Martine Gnaho', 4, "Bon travail sur le moteur diesel. Sérieux et ponctuel."),
    ('aurelien.hounnou@depannage.bj', 'Bernard Gnibi', 4, "Intervention correcte, prix juste pour un diesel."),
    # Patricia Daho — avg 4.5
    ('patricia.daho@depannage.bj', 'Colette Dovi', 5, "Formation au Maroc, ça se sent ! Très professionnelle, toutes marques maîtrisées."),
    ('patricia.daho@depannage.bj', 'Maxime Akakpo', 4, "Bonne prestation, entretien complet réalisé rapidement."),
    ('patricia.daho@depannage.bj', 'Yolande Hounsou', 4, "Patricia est sérieuse et compétente. Je reviens systématiquement."),
    # Séverin Biaou — avg 4.2
    ('severin.biaou@depannage.bj', 'Roland Kpanou', 4, "Disponible 24h/24 à Parakou. Intervention rapide sur ma voiture."),
    ('severin.biaou@depannage.bj', 'Albertine Zannou', 5, "Excellent service ! Il est venu à 23h sans hésiter. Bravo !"),
    ('severin.biaou@depannage.bj', 'Josias Hounsa', 4, "Dépannage correct, bonne connaissance des véhicules locaux."),
    # Justin Azondekon — avg 4.35
    ('justin.azondekon@depannage.bj', 'Sébastien Adjagbe', 5, "Freins réparés impeccablement. Voiture comme neuve !"),
    ('justin.azondekon@depannage.bj', 'Nadine Codjia', 4, "Bon travail sur ma suspension. Tarifs corrects."),
    ('justin.azondekon@depannage.bj', 'Blaise Goudoukpo', 4, "Sérieux et efficace. Je recommande pour la mécanique générale."),
]

# (bd_idx, status, est_cost, final_cost, notes, hours_to_complete_or_None)
INTERVENTIONS_DATA = [
    (0, 'completed', Decimal('25000'),  Decimal('22000'),  "Remplacement batterie 60Ah + câblage vérifié.", 2),
    (1, 'completed', Decimal('15000'),  Decimal('15000'),  "Montage roue de secours + changement valve.",   1),
    (4, 'completed', Decimal('120000'), Decimal('115000'), "Remplacement sélecteur boîte de vitesses.",    3),
    (5, 'completed', Decimal('35000'),  Decimal('32000'),  "Remplacement plaquettes + disques avant.",     2),
    (2, 'in_progress', Decimal('45000'), None,             "Diagnostic en cours, capteur O2 suspect.",     None),
]

# (bd_idx, intervention_idx_or_None, payment_for, amount, method, days_ago)
PAYMENTS_DATA = [
    (0, 0, 'intervention',          Decimal('22000'),  'MTN Mobile Money',   29),
    (1, 1, 'intervention',          Decimal('15000'),  'Moov Money',         24),
    (4, 2, 'intervention',          Decimal('115000'), 'MTN Mobile Money',   19),
    (5, 3, 'intervention',          Decimal('32000'),  'Carte bancaire',     14),
    (3, None, 'premium_subscription', Decimal('5000'), 'MTN Mobile Money',    2),
]

# (bd_idx, [(sender_type, sender_name, content, minutes_after_creation), ...])
MESSAGES_DATA = [
    (0, [
        ('driver',   'Moussa Ahouannou',  "Bonjour, ma voiture ne démarre plus depuis ce matin. Je suis au carrefour Saint-Michel.", 0),
        ('mechanic', 'Sara Hounkpatin',   "Bonjour Moussa, je suis disponible. Quel est le modèle exact et l'année de votre véhicule ?", 5),
        ('driver',   'Moussa Ahouannou',  "Toyota Corolla 2018. Le témoin batterie est allumé sur le tableau de bord.", 8),
        ('mechanic', 'Sara Hounkpatin',   "D'accord, c'est probablement la batterie ou l'alternateur. J'arrive dans 15 minutes.", 10),
        ('driver',   'Moussa Ahouannou',  "Merci beaucoup ! Je reste sur place.", 12),
    ]),
    (1, [
        ('driver',   'Aminata Kpêdékpo', "Crevaison totale sur le boulevard. Je suis bloquée, j'ai une réunion dans 30 min !", 0),
        ('mechanic', 'Marc Dossou',       "Bonjour Aminata, j'arrive rapidement. Avez-vous une roue de secours dans le coffre ?", 3),
        ('driver',   'Aminata Kpêdékpo', "Oui il y en a une mais je ne sais pas comment la changer.", 5),
        ('mechanic', 'Marc Dossou',       "Pas de problème, je m'en occupe. Environ 10 minutes.", 7),
    ]),
    (2, [
        ('driver',   'Rodrigue Togbé',   "Le témoin moteur s'est allumé et la voiture perd de la puissance. Je suis à Akpakpa.", 0),
        ('mechanic', 'Kodjo Agbossou',   "Rodrigue, j'arrive. Ne coupez pas le moteur si possible, je vais faire un diagnostic OBD.", 10),
        ('driver',   'Rodrigue Togbé',   "Compris. La voiture avance encore mais très lentement.", 15),
        ('mechanic', 'Kodjo Agbossou',   "Premier diagnostic : code erreur capteur oxygène. Je commande la pièce, 30 minutes.", 45),
    ]),
    (3, [
        ('driver',   'Céleste Houenou', "Ma clim ne souffle que chaud. Je suis à Haie Vive, c'est insupportable par cette chaleur.", 0),
        ('mechanic', 'Sara Hounkpatin',  "Bonjour Céleste, je viens dès que possible. Pouvez-vous préciser l'adresse exacte ?", 8),
        ('driver',   'Céleste Houenou', "Devant la pharmacie Centrale de Haie Vive, plaque grise sur Toyota.", 12),
    ]),
    (4, [
        ('driver',   'Patrice Adanhounmè', "Camion Mercedes en panne sur la RN1, impossible de passer les vitesses. URGENT.", 0),
        ('mechanic', 'Félix Kpodo',        "Je suis spécialiste poids lourds. J'arrive avec mon matériel de diagnostic. ETA 20 min.", 5),
        ('driver',   'Patrice Adanhounmè', "Merci, j'attends. Le camion est sur le bas-côté, je mets les triangles de signalisation.", 8),
        ('mechanic', 'Félix Kpodo',        "Diagnostic terminé : sélecteur boîte de vitesses HS. Je commence les réparations.", 35),
        ('driver',   'Patrice Adanhounmè', "Parfait, combien de temps pour la réparation ?", 40),
        ('mechanic', 'Félix Kpodo',        "Environ 2h30. Intervention terminée, vous pouvez reprendre la route !", 220),
    ]),
    (9, [
        ('driver',   'Patrice Adanhounmè', "Batterie complètement morte sur le parking de l'agence BIBE. Aucun son au démarrage.", 0),
        ('mechanic', 'Sara Hounkpatin',    "Bonjour, je suis disponible. C'est votre L200 diesel ? Je prends un chargeur de batterie.", 5),
        ('driver',   'Patrice Adanhounmè', "Oui, diesel 2018. Merci de venir rapidement, j'ai des livraisons à faire.", 7),
    ]),
]


class Command(BaseCommand):
    help = "Génère les données de démonstration pour DépannageExpress"

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Supprimer les données de démo existantes avant de recréer',
        )

    def handle(self, *args, **options):
        if options['flush']:
            self._flush()

        now = timezone.now()

        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Seed DépannageExpress ===\n'))

        specialties = self._create_specialties()
        admin = self._create_admin()
        mechanics = self._create_mechanics(specialties, admin)
        breakdowns = self._create_breakdowns(mechanics, specialties, now)
        interventions = self._create_interventions(breakdowns, mechanics, now)
        self._create_payments(breakdowns, interventions, mechanics, now)
        self._create_messages(breakdowns, now)
        self._create_reviews(now)

        self._print_summary(admin, mechanics)

    # ------------------------------------------------------------------ #
    # REVIEWS                                                               #
    # ------------------------------------------------------------------ #
    def _create_reviews(self, now):
        self.stdout.write('\n  Création des avis mécaniciens...')
        created_count = 0
        for (email, reviewer_name, rating, comment) in REVIEWS_DATA:
            try:
                profile = MechanicProfile.objects.get(user__email=email)
            except MechanicProfile.DoesNotExist:
                continue
            if MechanicReview.objects.filter(mechanic=profile, reviewer_name=reviewer_name).exists():
                continue
            MechanicReview.objects.create(
                mechanic=profile,
                reviewer_name=reviewer_name,
                rating=rating,
                comment=comment,
                is_visible=True,
            )
            created_count += 1
        self.stdout.write(self.style.SUCCESS(f'  → {created_count} avis créés.'))

    # ------------------------------------------------------------------ #
    # FLUSH                                                                 #
    # ------------------------------------------------------------------ #
    def _flush(self):
        self.stdout.write('Suppression des données de démo existantes...')
        demo_emails = [m['email'] for m in MECHANICS_DATA] + [ADMIN_EMAIL]
        users = User.objects.filter(email__in=demo_emails)
        mechanic_profiles = MechanicProfile.objects.filter(user__in=users)
        breakdown_phones = [row[1] for row in BREAKDOWNS_DATA]

        PaymentTransaction.objects.filter(payer_phone__in=breakdown_phones).delete()
        breakdown_qs = BreakdownRequest.objects.filter(driver_phone__in=breakdown_phones)
        Intervention.objects.filter(breakdown_request__in=breakdown_qs).delete()
        Message.objects.filter(breakdown_request__in=breakdown_qs).delete()
        breakdown_qs.delete()
        MechanicReview.objects.filter(mechanic__in=mechanic_profiles).delete()
        mechanic_profiles.delete()
        users.delete()
        self.stdout.write(self.style.WARNING('  → Données existantes supprimées.'))

    # ------------------------------------------------------------------ #
    # SPECIALTIES                                                          #
    # ------------------------------------------------------------------ #
    def _create_specialties(self):
        result = {}
        for data in SPECIALTIES:
            spec, created = Specialty.objects.get_or_create(
                name=data['name'],
                defaults={'description': data['description'], 'icon': data['icon']},
            )
            result[data['name']] = spec
            marker = '+ créée' if created else '✓ existe'
            self.stdout.write(f"  Spécialité [{marker}] : {data['name']}")
        return result

    # ------------------------------------------------------------------ #
    # ADMIN                                                                #
    # ------------------------------------------------------------------ #
    def _create_admin(self):
        admin, created = User.objects.get_or_create(
            email=ADMIN_EMAIL,
            defaults={
                'first_name': 'Super',
                'last_name': 'Admin',
                'phone': '+22990000000',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            },
        )
        if created:
            admin.set_password(ADMIN_PASSWORD)
            admin.save()
            self.stdout.write(f"  Admin [+ créé] : {ADMIN_EMAIL}")
        else:
            self.stdout.write(f"  Admin [✓ existe] : {ADMIN_EMAIL}")
        return admin

    # ------------------------------------------------------------------ #
    # MECHANICS                                                            #
    # ------------------------------------------------------------------ #
    def _create_mechanics(self, specialties, admin):
        mechanics = []
        for data in MECHANICS_DATA:
            user, u_created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name':  data['last_name'],
                    'phone':      data['phone'],
                    'role':       data['role'],
                    'is_active':  True,
                },
            )
            if u_created:
                user.set_password(DEMO_PASSWORD)
                user.save()

            profile, p_created = MechanicProfile.objects.get_or_create(
                user=user,
                defaults={
                    'bio':               data['bio'],
                    'years_experience':  data['years_experience'],
                    'latitude':          data['latitude'],
                    'longitude':         data['longitude'],
                    'address':           data['address'],
                    'city':              data['city'],
                    'country':           'Bénin',
                    'is_available':      True,
                    'works_weekends':    True,
                    'status':            'approved',
                    'validated_by':      admin,
                    'validated_at':      timezone.now(),
                    'average_rating':    data['rating'],
                    'total_reviews':     data['reviews'],
                    'total_interventions': data['interventions_count'],
                },
            )

            if p_created:
                specs = [specialties[s] for s in data['specialties'] if s in specialties]
                profile.specialties.set(specs)
            else:
                # Update stats in case of re-run with different data
                MechanicProfile.objects.filter(pk=profile.pk).update(
                    average_rating=data['rating'],
                    total_reviews=data['reviews'],
                    total_interventions=data['interventions_count'],
                )

            marker = f"+ créé ({data['role']})" if u_created else f"✓ existe ({data['role']})"
            self.stdout.write(f"  Mécanicien [{marker}] : {user.full_name} — {data['city']}")
            mechanics.append(profile)

        return mechanics

    # ------------------------------------------------------------------ #
    # BREAKDOWNS                                                           #
    # ------------------------------------------------------------------ #
    def _create_breakdowns(self, mechanics, specialties, now):
        breakdowns = []
        for row in BREAKDOWNS_DATA:
            (driver_name, driver_phone, vehicle, description,
             spec_name, lat, lng, address, status, meca_idx, days_ago) = row

            br, created = BreakdownRequest.objects.get_or_create(
                driver_phone=driver_phone,
                vehicle_description=vehicle,
                defaults={
                    'driver_name':           driver_name,
                    'driver_id_card':        'demo/placeholder_id.jpg',
                    'driver_selfie':         'demo/placeholder_selfie.jpg',
                    'vehicle_photo':         'demo/placeholder_vehicle.jpg',
                    'breakdown_description': description,
                    'breakdown_type':        spec_name,
                    'specialty_requested':   specialties.get(spec_name),
                    'latitude':              Decimal(lat),
                    'longitude':             Decimal(lng),
                    'address_description':   address,
                    'status':                status,
                    'assigned_mechanic':     mechanics[meca_idx] if meca_idx is not None else None,
                    'assigned_at':           now - timedelta(days=days_ago - 1) if meca_idx is not None and days_ago > 0 else None,
                    'assignment_distance_km': Decimal('2.50') if meca_idx is not None else None,
                    'ip_address':            '127.0.0.1',
                    'user_agent':            'DemoSeedScript/1.0',
                },
            )

            marker = '+ créée' if created else '✓ existe'
            self.stdout.write(f"  Demande [{marker}] : {driver_name} — {status} — {vehicle[:30]}")
            breakdowns.append(br)

        return breakdowns

    # ------------------------------------------------------------------ #
    # INTERVENTIONS                                                        #
    # ------------------------------------------------------------------ #
    def _create_interventions(self, breakdowns, mechanics, now):
        interventions = {}
        for (bd_idx, status, est_cost, final_cost, notes, hours) in INTERVENTIONS_DATA:
            bd = breakdowns[bd_idx]
            meca = bd.assigned_mechanic
            if meca is None:
                continue

            intervention, created = Intervention.objects.get_or_create(
                breakdown_request=bd,
                defaults={
                    'mechanic':       meca,
                    'status':         status,
                    'accepted_at':    now - timedelta(days=30 - bd_idx * 3, hours=1),
                    'started_at':     now - timedelta(days=30 - bd_idx * 3),
                    'completed_at':   now - timedelta(days=30 - bd_idx * 3) + timedelta(hours=hours) if hours else None,
                    'mechanic_notes': notes,
                    'estimated_cost': est_cost,
                    'final_cost':     final_cost,
                },
            )

            marker = '+ créée' if created else '✓ existe'
            self.stdout.write(f"  Intervention [{marker}] : #{bd.id} — {status} — {meca.user.full_name}")
            interventions[bd_idx] = intervention

        return interventions

    # ------------------------------------------------------------------ #
    # PAYMENTS                                                             #
    # ------------------------------------------------------------------ #
    def _create_payments(self, breakdowns, interventions, mechanics, now):
        for idx, (bd_idx, intv_idx, payment_for, amount, method, days_ago) in enumerate(PAYMENTS_DATA):
            bd = breakdowns[bd_idx]
            intv = interventions.get(intv_idx) if intv_idx is not None else None
            ref = f"PAY-DEMO-{idx + 1:04d}"

            payment, created = PaymentTransaction.objects.get_or_create(
                provider_reference=ref,
                defaults={
                    'payer_name':    bd.driver_name,
                    'payer_phone':   bd.driver_phone,
                    'amount':        amount,
                    'currency':      'XOF',
                    'payment_method': method,
                    'payment_for':   payment_for,
                    'status':        'paid',
                    'breakdown_request': bd,
                    'intervention':  intv,
                    'mechanic':      bd.assigned_mechanic,
                    'paid_at':       now - timedelta(days=days_ago),
                    'metadata':      {'source': 'demo_seed'},
                },
            )

            marker = '+ créé' if created else '✓ existe'
            montant = f"{int(amount):,}".replace(',', ' ')
            self.stdout.write(f"  Paiement [{marker}] : {bd.driver_name} — {montant} XOF — {method}")

    # ------------------------------------------------------------------ #
    # MESSAGES                                                             #
    # ------------------------------------------------------------------ #
    def _create_messages(self, breakdowns, now):
        for bd_idx, exchanges in MESSAGES_DATA:
            bd = breakdowns[bd_idx]
            # Skip if messages already exist for this breakdown
            if Message.objects.filter(breakdown_request=bd).exists():
                self.stdout.write(f"  Messages [✓ existent] : demande #{bd.id}")
                continue

            bd_created_at = now - timedelta(days=BREAKDOWNS_DATA[bd_idx][10])
            for (sender_type, sender_name, content, minutes_offset) in exchanges:
                msg = Message(
                    breakdown_request=bd,
                    sender_type=sender_type,
                    sender_name=sender_name,
                    content=content,
                )
                msg.save()
                # Backdate the message
                Message.objects.filter(pk=msg.pk).update(
                    created_at=bd_created_at + timedelta(minutes=minutes_offset)
                )

            self.stdout.write(
                f"  Messages [+ créés] : demande #{bd.id} — {len(exchanges)} échanges"
            )

    # ------------------------------------------------------------------ #
    # RÉSUMÉ FINAL                                                         #
    # ------------------------------------------------------------------ #
    def _print_summary(self, admin, mechanics):
        sep = '─' * 60
        self.stdout.write('\n' + sep)
        self.stdout.write(self.style.SUCCESS('  DONNÉES DE DÉMONSTRATION CRÉÉES'))
        self.stdout.write(sep)

        self.stdout.write('\n  ADMIN')
        self.stdout.write(self.style.SUCCESS(f'  Email    : {ADMIN_EMAIL}'))
        self.stdout.write(self.style.SUCCESS(f'  Mot de passe : {ADMIN_PASSWORD}'))

        self.stdout.write('\n  MÉCANICIENS')
        for profile in mechanics:
            u = profile.user
            role_label = 'PREMIUM' if u.role == 'mechanic_premium' else 'standard'
            self.stdout.write(
                self.style.SUCCESS(
                    f'  [{role_label:8s}]  {u.full_name:<22s}  {u.email:<36s}  mdp: {DEMO_PASSWORD}'
                )
            )

        self.stdout.write('\n  CONDUCTEURS (sans compte — données dans les demandes)')
        drivers_seen = {}
        for row in BREAKDOWNS_DATA:
            name, phone = row[0], row[1]
            if phone not in drivers_seen:
                drivers_seen[phone] = name
        for phone, name in drivers_seen.items():
            self.stdout.write(f'  {name:<25s}  {phone}')

        self.stdout.write('\n' + sep)
        self.stdout.write(self.style.SUCCESS('  Seed terminé avec succès.'))
        self.stdout.write(sep + '\n')
