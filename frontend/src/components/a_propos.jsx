import { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, Shield, Clock, Users, Phone, Mail, MapPin, Star, CheckCircle, Wrench, CreditCard, MessageCircle, Code, PenTool } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: "Comment fonctionne DépannageExpress ?",
    a: "Vous signalez votre panne via le formulaire en ligne. Notre système localise automatiquement le mécanicien le plus proche disponible et l'assigne à votre demande. Vous suivez l'intervention en temps réel.",
  },
  {
    q: "Combien coûte une intervention ?",
    a: "Les tarifs varient selon le type de panne : démarrage (10 000 FCFA), batterie (12 000 FCFA), moteur (18 000 FCFA), pneu (8 000 FCFA). Le paiement s'effectue en ligne avant l'intervention.",
  },
  {
    q: "Comment devenir mécanicien sur la plateforme ?",
    a: "Créez un compte mécanicien, renseignez vos informations professionnelles et justificatifs. Notre équipe examine votre dossier sous 24 à 48 heures. Une fois validé, vous recevez les demandes de dépannage dans votre zone.",
  },
  {
    q: "Est-ce disponible partout au Bénin ?",
    a: "DépannageExpress est actuellement disponible dans les principales villes du Bénin. La couverture s'étend progressivement selon la densité des mécaniciens inscrits dans chaque zone.",
  },
  {
    q: "Que faire si aucun mécanicien n'est disponible ?",
    a: "Si aucun mécanicien n'est disponible dans votre zone dans les 25 minutes, vous êtes notifié et invité à réessayer ultérieurement. Votre demande est conservée dans votre historique.",
  },
  {
    q: "Comment suivre mon historique de pannes sans compte ?",
    a: "Grâce au système OTP, vous pouvez accéder à votre historique en entrant votre numéro de téléphone. Un code de vérification vous est envoyé par SMS.",
  },
];

const STEPS = [
  { icon: <Wrench size={28} className="text-[#608C27]" />, title: "1. Signalez votre panne", desc: "Remplissez le formulaire en ligne avec votre localisation et le type de panne." },
  { icon: <Users size={28} className="text-[#608C27]" />, title: "2. Assignation automatique", desc: "Notre système trouve le mécanicien certifié le plus proche de vous en quelques secondes." },
  { icon: <CreditCard size={28} className="text-[#608C27]" />, title: "3. Paiement sécurisé", desc: "Réglez l'intervention en ligne via notre plateforme avant le déplacement du mécanicien." },
  { icon: <CheckCircle size={28} className="text-[#608C27]" />, title: "4. Intervention et avis", desc: "Le mécanicien intervient. Vous confirmez la fin de l'intervention et laissez votre avis." },
];

const TEAM = [
  { name: "Équipe Développement", role: "Conception & Backend", icon: <Code size={32} color="#0D2B0D" /> },
  { name: "Équipe Design", role: "Interface & Expérience", icon: <PenTool size={32} color="#608C27" /> },
  { name: "Équipe Terrain", role: "Réseau mécaniciens", icon: <Wrench size={32} color="#e85d04" /> },
];

const FaqItem = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-sm text-[#0D2B0D] pr-4">{item.q}</span>
        {open ? <ChevronUp size={18} className="text-[#608C27] shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
};

const APropos = () => {
  return (
    <div className="bg-gray-50 pb-20">

      {/* Hero */}
      <div className="bg-[#0D2B0D] py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
          DépannageExpress
        </h1>
        <p className="text-[#608C27] font-semibold text-lg mt-2">La mobilité sans stress au Bénin</p>
        <p className="text-white/70 text-sm mt-4 max-w-xl mx-auto leading-relaxed">
          Connecter instantanément les conducteurs en panne avec les meilleurs mécaniciens certifiés de leur zone — vite, fiable, transparent.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-14 mt-12">

        {/* Problème résolu */}
        <section>
          <h2 className="text-xl font-black uppercase text-[#0D2B0D] mb-6 border-l-4 border-[#608C27] pl-4">Le problème que nous résolvons</h2>
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
            <p className="text-gray-700 leading-relaxed">
              Une panne de voiture au Bénin représente une situation de stress majeur : pas de contact fiable sous la main, risque de se faire arnaquer par des dépanneurs inconnus, absence de suivi, paiement en espèces sans garantie.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong className="text-[#0D2B0D]">DépannageExpress</strong> élimine ce stress en offrant une plateforme digitale transparente où chaque intervention est traçable, chaque mécanicien certifié, et chaque paiement sécurisé.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section>
          <h2 className="text-xl font-black uppercase text-[#0D2B0D] mb-6 border-l-4 border-[#608C27] pl-4">Mission & Vision</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0D2B0D] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#608C27] p-2 rounded-lg"><Zap size={20} /></div>
                <h3 className="font-black text-[#608C27] uppercase text-sm">Notre Mission</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Offrir une solution digitale moderne qui simplifie le dépannage d'urgence en permettant aux conducteurs de localiser rapidement des mécaniciens fiables à proximité, tout en garantissant des échanges sécurisés et des interventions efficaces.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#608C27] p-2 rounded-lg text-white"><Star size={20} /></div>
                <h3 className="font-black text-[#0D2B0D] uppercase text-sm">Notre Vision</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Devenir la plateforme de référence pour la mobilité urbaine en Afrique de l'Ouest, capable d'éliminer le stress des pannes imprévues et d'instaurer un environnement de confiance entre professionnels et usagers.
              </p>
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section>
          <h2 className="text-xl font-black uppercase text-[#0D2B0D] mb-6 border-l-4 border-[#608C27] pl-4">Comment ça marche</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {STEPS.map((step) => (
              <div key={step.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex gap-4 items-start">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 shrink-0">{step.icon}</div>
                <div>
                  <p className="font-bold text-sm text-[#0D2B0D] mb-1">{step.title}</p>
                  <p className="text-gray-600 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Avantages */}
        <section>
          <h2 className="text-xl font-black uppercase text-[#0D2B0D] mb-6 border-l-4 border-[#608C27] pl-4">Pourquoi choisir DépannageExpress ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Clock size={24} />, title: "Rapidité", desc: "Mécanicien assigné en moins de 2 minutes" },
              { icon: <Shield size={24} />, title: "Fiabilité", desc: "Mécaniciens vérifiés et certifiés par notre équipe" },
              { icon: <MessageCircle size={24} />, title: "Transparence", desc: "Suivi en temps réel et messagerie intégrée" },
              { icon: <Users size={24} />, title: "Réseau local", desc: "Mécaniciens de proximité dans votre ville" },
            ].map((item) => (
              <div key={item.title} className="bg-[#608C27] text-white rounded-2xl p-5 text-center">
                <div className="flex justify-center mb-3">{item.icon}</div>
                <p className="font-bold text-sm mb-1">{item.title}</p>
                <p className="text-white/80 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Équipe */}
        <section>
          <h2 className="text-xl font-black uppercase text-[#0D2B0D] mb-6 border-l-4 border-[#608C27] pl-4">L'équipe projet</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
                <span className="flex justify-center">{member.icon}</span>
                <p className="font-bold text-[#0D2B0D] mt-3 text-sm">{member.name}</p>
                <p className="text-gray-500 text-xs mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-black uppercase text-[#0D2B0D] mb-6 border-l-4 border-[#608C27] pl-4">Contact & Coordonnées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#608C27]/10 p-2 rounded-lg"><MapPin size={18} className="text-[#608C27]" /></div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Adresse</p>
                  <p className="text-sm font-semibold text-[#0D2B0D]">Parakou, Bénin</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#608C27]/10 p-2 rounded-lg"><Mail size={18} className="text-[#608C27]" /></div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Email</p>
                  <p className="text-sm font-semibold text-[#0D2B0D]">contact.depannageexpress@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#608C27]/10 p-2 rounded-lg"><Phone size={18} className="text-[#608C27]" /></div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Téléphone</p>
                  <p className="text-sm font-semibold text-[#0D2B0D]">+2290161133224 / +2290199802214</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0D2B0D] rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <p className="font-black text-[#608C27] uppercase text-sm mb-2">Vous êtes mécanicien ?</p>
                <p className="text-white/70 text-sm leading-relaxed">
                  Rejoignez notre réseau, recevez des demandes d'intervention et développez votre activité avec DépannageExpress.
                </p>
              </div>
              <div className="mt-4 bg-[#608C27]/20 rounded-xl p-3">
                <p className="text-xs text-white/60">Inscription gratuite · Validation sous 48h · Paiements sécurisés</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-black uppercase text-[#0D2B0D] mb-6 border-l-4 border-[#608C27] pl-4">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} item={item} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default APropos;
