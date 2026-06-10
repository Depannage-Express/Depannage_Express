import { useEffect, useRef, useState } from 'react';
import Utilisateurs from './utilisateurs';
import Signalements from './signal';
import GestionPaiements from './paiement_ad';
import Abonnements from './aboonnements';
import SupervisionInterventions from './supervisions_interv';
import GestionAvis from './gestion_avis';
import AdminMessages from './admin_messages';
import RetraitsAdmin from './retraits_admin';
import { ClipboardList, Bell, UserCircle, Activity, MessageCircle, Star, Loader, MessageSquareText, ArrowDownCircle, ArrowLeft } from 'lucide-react';
import { fetchAdminStats } from '../lib/api';

const POLL_INTERVAL_MS = 4_000;

const DashboardAdmin = () => {
  const [view, setView] = useState('menu');
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);
  const viewRef = useRef('menu');

  const setViewSafe = (v) => {
    viewRef.current = v;
    setView(v);
  };

  const loadDashboard = async ({ silent = false } = {}) => {
    if (silent && viewRef.current !== 'menu') return;
    if (!silent) setIsLoading(true);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (requestError) {
      if (!silent) setError(requestError.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    intervalRef.current = setInterval(() => loadDashboard({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  const menuItems = [
    { id: 'utilisateurs', title: "Utilisateurs", icon: <ClipboardList size={40} />, color: "bg-[#608C27]" },
    { id: 'interve', title: "Interventions", icon: <Bell size={40} />, color: "bg-[#608C27]" },
    { id: 'abonnements', title: "Abonnements premium", icon: <UserCircle size={40} />, color: "bg-[#608C27]" },
    { id: 'paieadmin', title: "Paiements", icon: <Activity size={40} />, color: "bg-[#608C27]" },
    { id: 'signal', title: "Signalements", icon: <MessageCircle size={40} />, color: "bg-[#608C27]" },
    { id: 'avis', title: "Gestion des avis", icon: <Star size={40} />, color: "bg-[#608C27]" },
    { id: 'messages', title: "Messages", icon: <MessageSquareText size={40} />, color: "bg-[#608C27]" },
    {
      id: 'retraits',
      title: "Retraits",
      icon: <ArrowDownCircle size={40} />,
      color: "bg-[#608C27]",
      badge: stats?.withdrawals?.pending_count || 0,
    },
  ];


  const renderContent = () => {
    switch (view) {
      case 'utilisateurs':
        return <Utilisateurs onBack={() => setViewSafe('menu')} />;
      
      // On peut ajouter les autres ici plus tard
      case 'interve':
                return <SupervisionInterventions onBack={() => setViewSafe('menu')} />;
      case 'abonnements':
                return <Abonnements onBack={() => setViewSafe('menu')} />;
      case 'paieadmin':
                return <GestionPaiements onBack={()=> setViewSafe('menu')}/>;
      case 'signal':
                return <Signalements onBack={() => setViewSafe('menu')} />;
      case 'avis':
                return <GestionAvis onBack={() => setViewSafe('menu')} />;
      case 'messages':
                return <AdminMessages onBack={() => setViewSafe('menu')} />;
      case 'retraits':
                return <RetraitsAdmin onBack={() => setViewSafe('menu')} />;
      default:
        return (
          <div className="p-10 text-center bg-white rounded-xl shadow-xl border-2 border-[#0D2B0D]">
            <h2 className="text-2xl mb-4 font-bold text-[#0D2B0D]">Page "{view}" en construction...</h2>
            <button onClick={() => setViewSafe('menu')} className="inline-flex items-center gap-2 bg-[#608C27] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#0D2B0D]">
              <ArrowLeft size={16} /> Retour au menu
            </button>
          </div>
        );
      
    }
  };

  // Si on n'est pas sur le menu, on exécute la fonction renderContent()
  if (view !== 'menu') {
    return (
      <div className="min-h-screen bg-gray-200 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-5xl">
          {renderContent()} 
        </div>
      </div>
    );
  }

  return (<div className="flex items-center justify-center w-full py-6 md:py-12 px-4">  {/* Conteneur Principal (Similaire à ton schéma) */}

      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-[#0D2B0D]">
        
        {/* En-tête du Menu */}
        <div className="bg-[#0D2B0D] py-4 text-center">
          <h2 className="text-white text-2xl font-bold uppercase tracking-widest">
            Votre menu principal
          </h2>
          {error ? <p className="mt-2 text-sm text-red-200">{error}</p> : null}
        </div>

        <div className="border-b border-slate-200 bg-slate-50 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader className="text-[#608C27] animate-spin" size={28} />
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <StatCard label="Utilisateurs" value={stats.users.total} />
                <StatCard label="Mécaniciens" value={(stats.mechanics.by_status.approved || 0) + (stats.mechanics.by_status.pending || 0)} />
                <StatCard label="Profils en attente" value={stats.mechanics.by_status.pending || 0} />
                <StatCard label="Demandes totales" value={stats.breakdowns.total} />
                <StatCard label="Demandes assignées" value={stats.breakdowns.by_status.assigned || 0} />
                <StatCard label="Terminées" value={stats.breakdowns.by_status.completed || 0} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  label="Revenus encaissés"
                  value={`${stats.payments.total_revenue_xof.toLocaleString('fr-FR')} XOF`}
                  highlight
                />
                <StatCard label="Paiements confirmés" value={stats.payments.paid_count} />
                <StatCard label="Paiements en attente" value={stats.payments.pending_count} />
                <StatCard
                  label="Retraits en attente"
                  value={stats.withdrawals?.pending_count || 0}
                  highlight={(stats.withdrawals?.pending_count || 0) > 0}
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Grille des fonctionnalités */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center justify-items-center">
          
          {/* Listes des Utilisateurs  */}
          <MenuCard 
            item={menuItems[0]} 
            onClick={() => setViewSafe('utilisateurs')}
          />

          {/* Mon Compte (Centre) - On le place au milieu dans la grille */}
          <div className="lg:row-span-2 flex items-center">
             <MenuCard item={menuItems[2]} isLarge={true} 
                  onClick={() => setViewSafe('abonnements')}
             />
          </div>

          {/* Notification (Droite Haut) */}
          <MenuCard 
            item={menuItems[1]} 
            onClick={() => setViewSafe('interve')}
          />

          {/* Statut des missions (Gauche Bas) */}
          <MenuCard item={menuItems[3]} 
            onClick={() => setViewSafe('paieadmin')}
          />

          {/* Signalements (Droite Bas) */}
          <MenuCard item={menuItems[4]}
            onClick={() => setViewSafe('signal')}
          />

          {/* Gestion des avis */}
          <MenuCard item={menuItems[5]}
            onClick={() => setViewSafe('avis')}
          />

          {/* Messages conducteurs & mécaniciens */}
          <MenuCard item={menuItems[6]}
            onClick={() => setViewSafe('messages')}
          />

          {/* Retraits mécaniciens */}
          <MenuCard item={menuItems[7]}
            onClick={() => setViewSafe('retraits')}
          />

        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, highlight = false }) => (
  <div className={`rounded-2xl p-4 text-center shadow-sm ${highlight ? 'bg-[#0D2B0D]' : 'bg-white'}`}>
    <p className={`text-xs font-bold uppercase tracking-wide ${highlight ? 'text-[#608C27]' : 'text-slate-500'}`}>{label}</p>
    <p className={`mt-2 text-xl font-black ${highlight ? 'text-white' : 'text-[#0D2B0D]'}`}>{value}</p>
  </div>
);

// Sous-composant pour les cartes du menu pour éviter la répétition
const MenuCard = ({ item, isLarge = false , onClick}) => {
  return (
    <button
      onClick={onClick}
      className={`
      relative ${item.color} p-4 rounded-3xl shadow-lg border-4 border-[#608C27]
      transform transition-all hover:scale-105 active:scale-95
      flex flex-col items-center justify-center text-white
      ${isLarge ? 'w-56 h-72' : 'w-48 h-40'}
    `}
    >
      {item.badge > 0 ? (
        <span className="absolute top-4 right-4 bg-white text-[#0D2B0D] text-xs font-black px-2 py-1 rounded-full border border-[#608C27]">
          {item.badge}
        </span>
      ) : null}
      <div className="bg-[#0D2B0D] p-4 rounded-xl mb-4 shadow-inner">
        {item.icon}
      </div>
      <span className="text-center font-bold text-sm uppercase leading-tight">
        {item.title}
      </span>
    </button>
  );
};

export default DashboardAdmin;
