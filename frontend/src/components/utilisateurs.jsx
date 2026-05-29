import { useEffect, useMemo, useState } from 'react';
import { Clock, CheckCircle, RefreshCcw } from 'lucide-react';
import { blockAdminUser, fetchAdminUsers, unblockAdminUser } from '../lib/api';

const Utilisateurs = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState('');

  const loadUsers = async () => {
    setError('');
    setIsLoading(true);
    try {
      const allUsers = await fetchAdminUsers();
      setUsers(Array.isArray(allUsers) ? allUsers : []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const groupedUsers = useMemo(() => ({
    conducteurs: users.filter((user) => user.role === 'driver'),
    standards: users.filter((user) => user.role === 'mechanic_standard'),
    premium: users.filter((user) => user.role === 'mechanic_premium'),
    admins: users.filter((user) => user.role === 'admin'),
  }), [users]);

  const handleAction = async (user, type) => {
    if (type === 'supprimer' || type === 'suspendre') {
      setError("Cette action n'est pas encore branchee a une route backend.");
      return;
    }

    setPendingAction(`${type}-${user.id}`);
    setError('');

    try {
      if (type === 'bloquer') {
        await blockAdminUser(user.id, 'Blocage depuis le dashboard administrateur');
      } else if (type === 'debloquer') {
        await unblockAdminUser(user.id);
      }
      await loadUsers();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setPendingAction('');
    }
  };

  const UserCard = ({ user }) => (
    <div className={`bg-white rounded-2xl p-4 shadow-md border-2 mb-4 transition-all ${
      user.is_blocked ? 'border-red-500 bg-red-50' : 'border-transparent'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-[#0D2B0D] uppercase text-sm">{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}</h4>
          <p className="text-[10px] text-gray-500 font-mono">ID: {user.id}</p>
          <p className="text-xs text-gray-700">Email: {user.email}</p>
          <p className="text-xs text-gray-700">📞 {user.phone || '-'}</p>
        </div>
        {user.is_blocked ? <Clock size={16} className="text-red-500 animate-pulse" /> : <CheckCircle size={16} className="text-green-500" />}
      </div>

      {user.is_blocked && user.block_reason ? (
        <p className="text-[9px] font-bold text-red-600 mt-2 bg-white/50 p-1 rounded">
          Motif: {user.block_reason}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-1 mt-4">
        <button
          onClick={() => handleAction(user, user.is_blocked ? 'debloquer' : 'bloquer')}
          disabled={pendingAction === `bloquer-${user.id}` || pendingAction === `debloquer-${user.id}`}
          className="bg-gray-800 text-white text-[9px] py-2 rounded-lg hover:bg-black uppercase font-bold disabled:opacity-60"
        >
          {user.is_blocked ? 'Debloquer' : 'Bloquer'}
        </button>
        <button onClick={() => handleAction(user, 'suspendre')} className="bg-orange-500 text-white text-[9px] py-2 rounded-lg hover:bg-orange-600 uppercase font-bold">Suspendre</button>
        <button onClick={() => handleAction(user, 'supprimer')} className="bg-red-600 text-white text-[9px] py-2 rounded-lg hover:bg-red-800 uppercase font-bold">Supprimer</button>
      </div>
    </div>
  );

  return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] w-full py-12 px-4">      <div className="max-w-7xl mx-auto bg-gray-100 rounded-[3rem] p-6 md:p-10 shadow-2xl">
        
        {/* Header Utilisateurs*/}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b-2 border-gray-300 pb-6 gap-4">
          <h2 className="text-2xl font-black text-[#0D2B0D] tracking-tighter">GESTION UTILISATEURS</h2>
          <button onClick={loadUsers} className="inline-flex items-center gap-2 rounded-xl bg-[#0D2B0D] px-4 py-2 text-sm font-bold text-white hover:bg-[#608C27]">
            <RefreshCcw size={16} />
            Actualiser
          </button>
        </div>

        {isLoading ? <div className="mb-6 text-center font-semibold text-slate-700">Chargement des utilisateurs...</div> : null}
        {error ? <div className="mb-6 rounded-2xl bg-red-50 p-4 text-center text-red-700">{error}</div> : null}

        {/* Grille 3 Colonnes */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* COLONNE 1 : CONDUCTEURS */}
          <section>
            <div className="bg-[#0D2B0D] text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg">
              CONDUCTEURS
            </div>
            {groupedUsers.conducteurs.map(user => <UserCard key={user.id} user={user} />)}
          </section>

          {/* COLONNE 2 : MÉCANICIENS STANDARDS */}
          <section>
            <div className="bg-[#0D2B0D] text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg">
              MÉCANICIENS STANDARDS
            </div>
            {groupedUsers.standards.map(user => <UserCard key={user.id} user={user} />)}
          </section>

          {/* COLONNE 3 : MÉCANICIENS PREMIUM */}
          <section>
            <div className="bg-gray-500 text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg">
              MÉCANICIENS PREMIUM
            </div>
            {groupedUsers.premium.map(user => <UserCard key={user.id} user={user} />)}
          </section>

          <section>
            <div className="bg-[#608C27] text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg">
              ADMINISTRATEURS
            </div>
            {groupedUsers.admins.map(user => <UserCard key={user.id} user={user} />)}
          </section>

        </div>
      </div>
    </div>
  );
};

export default Utilisateurs;
