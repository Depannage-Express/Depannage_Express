import { useState } from 'react'; 
import ListesCommandes from './listes_demandes';
import Notifications from './notification';
import DiscussionMeca from './discussion_meca'; 
import StatutMissions from './statut';
import MonCompte from './compteMeca';
import { ClipboardList, Bell, UserCircle, Activity, MessageCircle } from 'lucide-react';

const DashboardMecanicien = ({ currentUser }) => {

  // 1. Créer l'état pour savoir quelle "sous-page" afficher
  const [view, setView] = useState('menu');
  // Données pour les cartes du menu
  const menuItems = [
    { id: 'liste-commandes', title: "Listes des Demandes", icon: <ClipboardList size={40} />, color: "bg-[#608C27]" },
    { id: 'notif', title: "Notification", icon: <Bell size={40} />, color: "bg-[#608C27]" },
    { id: 'compte', title: "Mon compte", icon: <UserCircle size={40} />, color: "bg-[#608C27]" },
    { id: 'statut', title: "Statut des missions", icon: <Activity size={40} />, color: "bg-[#608C27]" },
    { id: 'discuter', title: "Discuter", icon: <MessageCircle size={40} />, color: "bg-[#608C27]" },
  ];


  const renderContent = () => {
    switch (view) {
      case 'liste-commandes':
        return <ListesCommandes onBack={() => setView('menu')} />;
      
      // On peut ajouter les autres ici plus tard
      case 'notif':
        return <Notifications onBack={() => setView('menu')} />;
      case 'compte':
                return <MonCompte onBack={() => setView('menu')} />;
      case 'statut':
                return <StatutMissions onBack={()=> setView('menu')}/>;
      case 'discuter':
                return <DiscussionMeca onBack={() => setView('menu')} />;
      default:
        return (
          <div className="p-10 text-center bg-white rounded-xl shadow-xl border-2 border-[#0D2B0D]">
            <h2 className="text-2xl mb-4 font-bold text-[#0D2B0D]">Page "{view}" en construction...</h2>
            <button onClick={() => setView('menu')} className="bg-[#608C27] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#0D2B0D]">
              ← Retour au menu
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

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center py-10 px-4">
      {/* Conteneur Principal (Similaire à ton schéma) */}
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-[#0D2B0D]">
        
        {/* En-tête du Menu */}
        <div className="bg-[#0D2B0D] py-4 text-center">
          <h2 className="text-white text-2xl font-bold uppercase tracking-widest">
            Votre menu principal
          </h2>
          {currentUser ? (
            <p className="text-sm text-white/80 mt-2">
              Connecte en tant que {currentUser.full_name}
            </p>
          ) : null}
        </div>

        {/* Grille des fonctionnalités */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center justify-items-center">
          
          {/* Listes des Demandes (Gauche Haut) */}
          <MenuCard 
            item={menuItems[0]} 
            onClick={() => setView('liste-commandes')}
          />

          {/* Mon Compte (Centre) - On le place au milieu dans la grille */}
          <div className="lg:row-span-2 flex items-center">
             <MenuCard item={menuItems[2]} isLarge={true} 
                  onClick={() => setView('compte')}
             />
          </div>

          {/* Notification (Droite Haut) */}
          <MenuCard 
            item={menuItems[1]} 
            onClick={() => setView('notif')}
          />

          {/* Statut des missions (Gauche Bas) */}
          <MenuCard item={menuItems[3]} 
            onClick={() => setView('statut')}
          />

          {/* Discuter (Droite Bas) */}
          <MenuCard item={menuItems[4]} 
            onClick={() => setView('discuter')}
          />

        </div>
      </div>
    </div>
  );
};

// Sous-composant pour les cartes du menu pour éviter la répétition
const MenuCard = ({ item, isLarge = false , onClick}) => {
  return (
    <button 
      onClick={onClick}
      className={`
      ${item.color} p-4 rounded-3xl shadow-lg border-4 border-[#608C27]
      transform transition-all hover:scale-105 active:scale-95
      flex flex-col items-center justify-center text-white
      ${isLarge ? 'w-56 h-72' : 'w-48 h-40'}
    `}>
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
