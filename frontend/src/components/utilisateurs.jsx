import { useEffect, useMemo, useState } from 'react';
import { Clock, CheckCircle, RefreshCcw, Search, X } from 'lucide-react';
import { blockAdminUser, fetchAdminUsers, unblockAdminUser } from '../lib/api';

const Utilisateurs = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState('');
  const [query, setQuery] = useState('');

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

  useEffect(() => { loadUsers(); }, []);

  const q = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!q) return users;
    return users.filter(u =>
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.first_name || '').toLowerCase().includes(q) ||
      (u.last_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    );
  }, [users, q]);

  const groupedUsers = useMemo(() => ({
    standards: filteredUsers.filter((u) => u.role === 'mechanic_standard'),
    premium: filteredUsers.filter((u) => u.role === 'mechanic_premium'),
    admins: filteredUsers.filter((u) => u.role === 'admin'),
  }), [filteredUsers]);

  const handleAction = async (user, type) => {
    if (type === 'supprimer' || type === 'suspendre') {
      setError("Cette action n'est pas encore disponible.");
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
        <div className="min-w-0 pr-2">
          <h4 className="font-bold text-[#0D2B0D] uppercase text-sm truncate">
            {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
          </h4>
          <p className="text-[10px] text-gray-500 font-mono truncate">ID: {user.id}</p>
          <p className="text-xs text-gray-700 truncate">Email: {user.email}</p>
          <p className="text-xs text-gray-700">📞 {user.phone || '-'}</p>
        </div>
        {user.is_blocked
          ? <Clock size={16} className="text-red-500 animate-pulse shrink-0" />
          : <CheckCircle size={16} className="text-green-500 shrink-0" />}
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
          {user.is_blocked ? 'Débloquer' : 'Bloquer'}
        </button>
        <button onClick={() => handleAction(user, 'suspendre')} className="bg-orange-500 text-white text-[9px] py-2 rounded-lg hover:bg-orange-600 uppercase font-bold">Suspendre</button>
        <button onClick={() => handleAction(user, 'supprimer')} className="bg-red-600 text-white text-[9px] py-2 rounded-lg hover:bg-red-800 uppercase font-bold">Supprimer</button>
      </div>
    </div>
  );

  const totalFiltered = groupedUsers.standards.length + groupedUsers.premium.length + groupedUsers.admins.length;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] w-full py-12 px-4">
      <div className="max-w-7xl w-full mx-auto bg-gray-100 rounded-[3rem] p-6 md:p-10 shadow-2xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b-2 border-gray-300 pb-6 gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl bg-[#608C27] px-4 py-2 text-sm font-bold text-white hover:bg-[#0D2B0D]">
                ← Retour
              </button>
            )}
            <h2 className="text-2xl font-black text-[#0D2B0D] tracking-tighter">GESTION UTILISATEURS</h2>
          </div>
          <button onClick={loadUsers} className="inline-flex items-center gap-2 rounded-xl bg-[#0D2B0D] px-4 py-2 text-sm font-bold text-white hover:bg-[#608C27]">
            <RefreshCcw size={16} />
            Actualiser
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-6 max-w-md">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone…"
            className="w-full border-2 border-[#0D2B0D] rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27] bg-white"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D2B0D]" />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X size={16} />
            </button>
          )}
        </div>

        {q && (
          <p className="text-sm text-gray-500 mb-4">
            {totalFiltered} utilisateur{totalFiltered !== 1 ? 's' : ''} trouvé{totalFiltered !== 1 ? 's' : ''} pour "{query}"
          </p>
        )}

        {isLoading && <div className="mb-6 text-center font-semibold text-slate-700">Chargement des utilisateurs…</div>}
        {error && <div className="mb-6 rounded-2xl bg-red-50 p-4 text-center text-red-700">{error}</div>}

        {/* Grille */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

          {/* CONDUCTEURS */}
          <section>
            <div className="bg-[#0D2B0D] text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg">
              CONDUCTEURS
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-xs font-bold text-blue-700 uppercase mb-2">Service anonyme</p>
              <p className="text-[11px] text-blue-600 leading-relaxed">
                Les conducteurs utilisent l'application <strong>sans créer de compte</strong>.
                Chaque demande est identifiée par un UUID unique et le numéro de téléphone fourni.
              </p>
              <p className="text-[10px] text-blue-400 mt-3 italic">MVP — Gestion des conducteurs prévue en V2</p>
            </div>
          </section>

          {/* MÉCANICIENS STANDARDS */}
          <section>
            <div className="bg-[#0D2B0D] text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg">
              MÉCANICIENS STANDARDS
            </div>
            {groupedUsers.standards.length === 0 && q ? (
              <p className="text-center text-sm text-gray-400 py-4">Aucun résultat</p>
            ) : groupedUsers.standards.map(user => <UserCard key={user.id} user={user} />)}
          </section>

          {/* MÉCANICIENS PREMIUM */}
          <section>
            <div className="bg-gray-500 text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg">
              MÉCANICIENS PREMIUM
            </div>
            {groupedUsers.premium.length === 0 && q ? (
              <p className="text-center text-sm text-gray-400 py-4">Aucun résultat</p>
            ) : groupedUsers.premium.map(user => <UserCard key={user.id} user={user} />)}
          </section>

          {/* ADMINISTRATEURS */}
          <section>
            <div className="bg-[#608C27] text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg">
              ADMINISTRATEURS
            </div>
            {groupedUsers.admins.length === 0 && q ? (
              <p className="text-center text-sm text-gray-400 py-4">Aucun résultat</p>
            ) : groupedUsers.admins.map(user => <UserCard key={user.id} user={user} />)}
          </section>

        </div>
      </div>
    </div>
  );
};

export default Utilisateurs;
