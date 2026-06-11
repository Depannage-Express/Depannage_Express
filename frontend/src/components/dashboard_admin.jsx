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
import { fetchAdminStats, fetchAdminIncidentStats } from '../lib/api';
import Badge from './Badge';

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
      const [statsRes, incidentRes] = await Promise.allSettled([
        fetchAdminStats(),
        fetchAdminIncidentStats(),
      ]);

      let data = statsRes.status === 'fulfilled' ? statsRes.value : null;
      if (incidentRes.status === 'fulfilled') {
        data = { ...(data || {}), reports: { pending_count: incidentRes.value.pending || 0 } };
      }

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
    { id: 'utilisateurs', title: "Utilisateurs", icon: <ClipboardList size={20} />, color: "bg-[#608C27]", badge: stats?.mechanics?.by_status?.pending || 0 },
    { id: 'interve', title: "Interventions", icon: <Bell size={20} />, color: "bg-[#608C27]", badge: stats?.breakdowns?.by_status?.pending || stats?.breakdowns?.by_status?.authorized || 0 },
    { id: 'abonnements', title: "Abonnements premium", icon: <UserCircle size={20} />, color: "bg-[#608C27]", badge: stats?.subscriptions?.pending_count || 0 },
    { id: 'paieadmin', title: "Paiements", icon: <Activity size={20} />, color: "bg-[#608C27]", badge: stats?.payments?.pending_count || 0 },
    { id: 'signal', title: "Signalements", icon: <MessageCircle size={20} />, color: "bg-[#608C27]", badge: stats?.reports?.pending_count || 0 },
    { id: 'avis', title: "Gestion des avis", icon: <Star size={20} />, color: "bg-[#608C27]", badge: 0 },
    { id: 'messages', title: "Messages", icon: <MessageSquareText size={20} />, color: "bg-[#608C27]", badge: 0 },
    {
      id: 'retraits',
      title: "Retraits",
      icon: <ArrowDownCircle size={20} />,
      color: "bg-[#608C27]",
      badge: (stats?.withdrawals?.pending_count || 0) + (stats?.momo_changes?.pending_count || 0),
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
      <div className="min-h-screen bg-gray-200 flex flex-col items-center py-10">
        <div className="w-[96%] mx-auto">
          {renderContent()} 
        </div>
      </div>
    );
  }

  return (<div className="flex items-center justify-center w-full py-3">

      <div className="w-[96%] mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-[#0D2B0D]">

        {/* En-tête du Menu */}
        <div className="bg-[#0D2B0D] py-2 text-center">
          <h2 className="text-white text-lg font-bold uppercase tracking-widest">
            Votre menu principal
          </h2>
          {error ? <p className="mt-1 text-sm text-red-200">{error}</p> : null}
        </div>

        <div className="border-b border-slate-200 bg-slate-50 p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader className="text-[#608C27] animate-spin" size={24} />
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                <StatCard label="Utilisateurs" value={stats.users.total} />
                <StatCard label="Mécaniciens" value={(stats.mechanics.by_status.approved || 0) + (stats.mechanics.by_status.pending || 0)} />
                <StatCard label="Profils en attente" value={stats.mechanics.by_status.pending || 0} />
                <StatCard label="Demandes totales" value={stats.breakdowns.total} />
                <StatCard label="Demandes assignées" value={stats.breakdowns.by_status.assigned || 0} />
                <StatCard label="Terminées" value={stats.breakdowns.by_status.completed || 0} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
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
                <StatCard
                  label="Changements MoMo en attente"
                  value={stats.momo_changes?.pending_count || 0}
                  highlight={(stats.momo_changes?.pending_count || 0) > 0}
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Grille des fonctionnalités */}
        <div className="p-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {menuItems.map((item) => (
            <MenuCard key={item.id} item={item} onClick={() => setViewSafe(item.id)} />
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, highlight = false }) => (
  <div className={`rounded-xl p-2.5 text-center shadow-sm ${highlight ? 'bg-[#0D2B0D]' : 'bg-white'}`}>
    <p className={`text-xs font-bold uppercase tracking-wide leading-tight ${highlight ? 'text-[#608C27]' : 'text-slate-500'}`}>{label}</p>
    <p className={`mt-0.5 text-base font-black ${highlight ? 'text-white' : 'text-[#0D2B0D]'}`}>{value}</p>
  </div>
);

const MenuCard = ({ item, onClick }) => (
  <button
    onClick={onClick}
    className={`
      relative ${item.color} px-3 py-2.5 rounded-2xl shadow-md border-2 border-[#608C27]
      transform transition-all hover:scale-105 active:scale-95
      flex flex-row items-center text-white gap-2.5 w-full
    `}
  >
    <Badge count={item.badge} className="top-1.5 right-1.5 px-1.5 py-0.5 text-xs" />
    <div className="bg-[#0D2B0D] p-2 rounded-lg shadow-inner flex-shrink-0">
      {item.icon}
    </div>
    <span className="text-left font-bold text-xs uppercase leading-tight">
      {item.title}
    </span>
  </button>
);

export default DashboardAdmin;
