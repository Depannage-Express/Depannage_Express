import { useState, useEffect, useRef } from 'react';
import ListesCommandes from './listes_demandes';
import Notifications from './notification';
import DiscussionMeca from './discussion_meca';
import StatutMissions from './statut';
import MonCompte from './compteMeca';
import Abonnement from './abonnement';
import { ClipboardList, Bell, UserCircle, Activity, MessageCircle, Crown, ArrowLeft } from 'lucide-react';
import { fetchMechanicRequests, fetchMyInterventions, fetchMechanicAdminMessages, fetchMechanicWallet, fetchMyMomoChangeRequests } from '../lib/api';

const POLL_MS = 4_000;
const LAST_DISCUTER_KEY = 'meca_last_discuter_ts';

const DashboardMecanicien = ({ currentUser }) => {
  const [view, setView] = useState(() => {
    return localStorage.getItem('meca_dashboard_view') || 'menu';
  });

  const [pendingCount, setPendingCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [activeMissions, setActiveMissions] = useState(0);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [pendingWithdrawCount, setPendingWithdrawCount] = useState(0);
  const [pendingMomoChangeCount, setPendingMomoChangeCount] = useState(0);
  const pollRef = useRef(null);

  const loadCounts = async () => {
    try {
      const [reqData, intervData, msgData, walletData, momoData] = await Promise.allSettled([
        fetchMechanicRequests(),
        fetchMyInterventions(),
        fetchMechanicAdminMessages(),
        fetchMechanicWallet(),
        fetchMyMomoChangeRequests(),
      ]);

      if (reqData.status === 'fulfilled') {
        const reqs = reqData.value.results || [];
        setNotifCount(reqs.filter(r => r.status === 'assigned' || r.status === 'pending').length);
      }

      if (intervData.status === 'fulfilled') {
        const intervs = intervData.value.results || [];
        setPendingCount(intervs.filter(iv => iv.status === 'pending_acceptance').length);
        setActiveMissions(intervs.filter(iv => iv.status === 'accepted' || iv.status === 'in_progress').length);
      }

      if (msgData.status === 'fulfilled') {
        const msgs = Array.isArray(msgData.value) ? msgData.value : [];
        const lastVisit = localStorage.getItem(LAST_DISCUTER_KEY);
        const adminMsgs = msgs.filter(m => m.sender_type === 'admin');
        if (lastVisit) {
          setNewMsgCount(adminMsgs.filter(m => new Date(m.created_at) > new Date(lastVisit)).length);
        } else {
          setNewMsgCount(adminMsgs.length);
        }
      }

      if (walletData.status === 'fulfilled') {
        const wallet = walletData.value || {};
        const pending = Array.isArray(wallet.history)
          ? wallet.history.filter(item => item.type === 'debit' && item.status === 'pending').length
          : 0;
        setPendingWithdrawCount(pending);
      }

      if (momoData.status === 'fulfilled') {
        const requests = Array.isArray(momoData.value) ? momoData.value : [];
        setPendingMomoChangeCount(requests.filter(r => r.status === 'pending').length);
      }
    } catch {
      // ignore polling errors
    }
  };

  useEffect(() => {
    loadCounts();
    pollRef.current = setInterval(loadCounts, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleSetView = (newView) => {
    if (newView === 'discuter') {
      localStorage.setItem(LAST_DISCUTER_KEY, new Date().toISOString());
      setNewMsgCount(0);
    }
    setView(newView);
    if (newView === 'menu') {
      localStorage.removeItem('meca_dashboard_view');
    } else {
      localStorage.setItem('meca_dashboard_view', newView);
    }
  };

  const isPremium = currentUser?.role === 'mechanic_premium';

  const menuItems = [
    { id: 'liste-commandes', title: "Listes des Demandes", icon: <ClipboardList size={40} />, color: "bg-[#608C27]", badge: pendingCount },
    { id: 'notif', title: "Notification", icon: <Bell size={40} />, color: "bg-[#608C27]", badge: notifCount },
    {
      id: 'compte',
      title: "Mon compte",
      icon: <UserCircle size={40} />,
      color: "bg-[#608C27]",
      badge: pendingWithdrawCount + pendingMomoChangeCount,
    },
    { id: 'statut', title: "Statut des missions", icon: <Activity size={40} />, color: "bg-[#608C27]", badge: activeMissions },
    { id: 'discuter', title: "Discuter", icon: <MessageCircle size={40} />, color: "bg-[#608C27]", badge: newMsgCount },
    {
      id: 'abonnement',
      title: isPremium ? "Plan Premium" : "Passer Premium",
      icon: <Crown size={40} />,
      color: isPremium ? "bg-yellow-500" : "bg-[#0D2B0D]",
      badge: 0,
    },
  ];

  const renderContent = () => {
    switch (view) {
      case 'liste-commandes':
        return <ListesCommandes onBack={() => handleSetView('menu')} />;
      case 'notif':
        return <Notifications onBack={() => handleSetView('menu')} />;
      case 'compte':
        return <MonCompte onBack={() => handleSetView('menu')} />;
      case 'statut':
        return <StatutMissions onBack={() => handleSetView('menu')} />;
      case 'discuter':
        return <DiscussionMeca onBack={() => handleSetView('menu')} currentUser={currentUser} />;
      case 'abonnement':
        return <Abonnement onBack={() => handleSetView('menu')} currentUser={currentUser} />;
      default:
        return (
          <div className="p-10 text-center bg-white rounded-xl shadow-xl border-2 border-[#0D2B0D]">
            <h2 className="text-2xl mb-4 font-bold text-[#0D2B0D]">Page "{view}" en construction...</h2>
            <button onClick={() => handleSetView('menu')} className="inline-flex items-center gap-2 bg-[#608C27] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#0D2B0D]">
              <ArrowLeft size={16} /> Retour au menu
            </button>
          </div>
        );
    }
  };

  if (view !== 'menu') {
    return (
      <div className="min-h-screen bg-gray-200 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-5xl">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-[#0D2B0D]">

        <div className="bg-[#0D2B0D] py-4 px-6 flex items-center justify-between">
          <div className="text-center flex-1">
            <h2 className="text-white text-2xl font-bold uppercase tracking-widest">
              Votre menu principal
            </h2>
            {currentUser ? (
              <p className="text-sm text-white/80 mt-1">
                Connecté en tant que {currentUser.full_name}
              </p>
            ) : null}
          </div>
          <button
            onClick={() => handleSetView('abonnement')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all shrink-0 ${
              isPremium
                ? 'bg-yellow-400 text-[#0D2B0D] border-yellow-300 hover:bg-yellow-300'
                : 'bg-[#608C27] text-white border-[#608C27] hover:bg-yellow-400 hover:text-[#0D2B0D] hover:border-yellow-400'
            }`}
          >
            <Crown size={18} />
            {isPremium ? 'Premium' : 'Passer Premium'}
          </button>
        </div>

        <div className="p-3 md:p-8 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 items-stretch md:items-center justify-items-center">

          <MenuCard item={menuItems[0]} onClick={() => handleSetView('liste-commandes')} />

          <div className="lg:row-span-2 flex md:items-center w-full md:w-auto h-full">
            <MenuCard item={menuItems[2]} isLarge={true} onClick={() => handleSetView('compte')} />
          </div>

          <MenuCard item={menuItems[1]} onClick={() => handleSetView('notif')} />

          <MenuCard item={menuItems[3]} onClick={() => handleSetView('statut')} />

          <MenuCard item={menuItems[4]} onClick={() => handleSetView('discuter')} />

        </div>
      </div>
    </div>
  );
};

const MenuCard = ({ item, isLarge = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative ${item.color} p-4 rounded-3xl shadow-lg border-4 border-[#608C27]
      transform transition-all hover:scale-105 active:scale-95
      flex flex-col items-center justify-center text-white
      ${isLarge ? 'w-full h-full md:w-56 md:h-72' : 'w-full h-full md:w-48 md:h-40'}
    `}>
      {item.badge > 0 && (
        <span className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-1.5 shadow-lg border-2 border-white z-10">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
      <div className="bg-[#0D2B0D] p-4 rounded-xl mb-4 shadow-inner">
        {item.icon}
      </div>
      <span className="text-center font-bold text-sm uppercase leading-tight">
        {item.title}
      </span>
    </button>
  );
};

export default DashboardMecanicien;
