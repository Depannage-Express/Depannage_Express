import  { useState, useEffect } from 'react';
import { Clock, CheckCircle } from 'lucide-react';

const Utilisateurs = () => {
  
  const [data, setData] = useState({
    conducteurs: [
      { id: "03468431061", name: "Moussa ADEBAYO", tel: "081 232 3330", status: "actif", blockedUntil: null },
      { id: "025123009", name: "Moussa ADEBAYO", tel: "081 232 3330", status: "actif", blockedUntil: null }
    ],
    standards: [
      { id: "0917223338", name: "Jean KOFFI", tel: "091 722 3338", status: "actif", blockedUntil: null },
    ],
    premium: [
      { id: "0817323330", name: "Sara TCHAKOR", tel: "081 732 3330", status: "actif", blockedUntil: null },
    ]
  });

  // Vérifie chaque seconde si une sanction a expiré
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let hasChanged = false;
      const newData = { ...data };

      Object.keys(newData).forEach(category => {
        newData[category] = newData[category].map(user => {
          if (user.blockedUntil && new Date(user.blockedUntil) <= now) {
            hasChanged = true;
            return { ...user, status: "actif", blockedUntil: null };
          }
          return user;
        });
      });

      if (hasChanged) setData(newData);
    }, 1000); 
    return () => clearInterval(interval);
  }, [data]);

  // 3. FONCTION UNIFIÉE POUR LES ACTIONS
  const handleAction = (category, userId, type) => {
    const now = new Date();
    
    if (type === 'supprimer') {
      if (window.confirm("Supprimer définitivement cet utilisateur de la base ?")) {
        setData({ ...data, [category]: data[category].filter(u => u.id !== userId) });
      }
      return;
    }

    let expiration = new Date();
    let statusLabel = "";

    if (type === 'bloquer') {
      expiration.setDate(now.getDate() + 2);
      statusLabel = "bloqué";
    } else if (type === 'suspendre') {
      expiration.setMonth(now.getMonth() + 1); 
      statusLabel = "suspendu";
    }

    setData({
      ...data,
      [category]: data[category].map(u => 
        u.id === userId ? { ...u, status: statusLabel, blockedUntil: expiration.toISOString() } : u
      )
    });
  };

  // 4. COMPOSANT CARTE UTILISATEUR
  const UserCard = ({ user, category }) => (
    <div className={`bg-white rounded-2xl p-4 shadow-md border-2 mb-4 transition-all ${
      user.status === 'bloqué' ? 'border-red-500 bg-red-50' : 
      user.status === 'suspendu' ? 'border-orange-500 bg-orange-50' : 'border-transparent'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-[#0D2B0D] uppercase text-sm">{user.name}</h4>
          <p className="text-[10px] text-gray-500 font-mono">ID: {user.id}</p>
          <p className="text-xs text-gray-700">📞 {user.tel}</p>
        </div>
        {user.status === 'actif' ? <CheckCircle size={16} className="text-green-500" /> : <Clock size={16} className="text-red-500 animate-pulse" />}
      </div>

      {user.blockedUntil && (
        <p className="text-[9px] font-bold text-red-600 mt-2 bg-white/50 p-1 rounded">
           Libération : {new Date(user.blockedUntil).toLocaleString()}
        </p>
      )}

      <div className="grid grid-cols-3 gap-1 mt-4">
        <button onClick={() => handleAction(category, user.id, 'bloquer')} className="bg-gray-800 text-white text-[9px] py-2 rounded-lg hover:bg-black uppercase font-bold">Bloquer</button>
        <button onClick={() => handleAction(category, user.id, 'suspendre')} className="bg-orange-500 text-white text-[9px] py-2 rounded-lg hover:bg-orange-600 uppercase font-bold">Suspendre</button>
        <button onClick={() => handleAction(category, user.id, 'supprimer')} className="bg-red-600 text-white text-[9px] py-2 rounded-lg hover:bg-red-800 uppercase font-bold">Supprimer</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#608C27] p-4 md:p-8 rounded-2xl">
      <div className="max-w-7xl mx-auto bg-gray-100 rounded-[3rem] p-6 md:p-10 shadow-2xl">
        
        {/* Header Utilisateurs*/}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b-2 border-gray-300 pb-6 gap-4">
          <h2 className="text-2xl font-black text-[#0D2B0D] tracking-tighter">GESTION UTILISATEURS</h2>
        </div>

        {/* Grille 3 Colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLONNE 1 : CONDUCTEURS */}
          <section>
            <div className="bg-[#0D2B0D] text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg">
              CONDUCTEURS
            </div>
            {data.conducteurs.map(user => <UserCard key={user.id} user={user} category="conducteurs" />)}
          </section>

          {/* COLONNE 2 : MÉCANICIENS STANDARDS */}
          <section>
            <div className="bg-[#0D2B0D] text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg">
              MÉCANICIENS STANDARDS
            </div>
            {data.standards.map(user => <UserCard key={user.id} user={user} category="standards" />)}
          </section>

          {/* COLONNE 3 : MÉCANICIENS PREMIUM */}
          <section>
            <div className="bg-gray-500 text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg">
              MÉCANICIENS PREMIUM
            </div>
            {data.premium.map(user => <UserCard key={user.id} user={user} category="premium" />)}
          </section>

        </div>
      </div>
    </div>
  );
};

export default Utilisateurs;