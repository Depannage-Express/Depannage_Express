import { useEffect, useMemo, useState } from 'react';
import { Clock, CheckCircle, RefreshCcw, Search, X, AlertTriangle } from 'lucide-react';
import { blockAdminUser, fetchAdminUsers, unblockAdminUser, validateAdminMechanic } from '../lib/api';

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-700 border-green-400',
  pending:  'bg-yellow-100 text-yellow-700 border-yellow-400',
  rejected: 'bg-red-100 text-red-700 border-red-400',
  suspended:'bg-orange-100 text-orange-700 border-orange-400',
};

const STATUS_LABEL = {
  approved: 'Approuvé',
  pending:  'En attente',
  rejected: 'Refusé',
  suspended:'Suspendu',
};

const Utilisateurs = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState('');
  const [query, setQuery] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const groupedUsers = useMemo(() => {
    const standards = filteredUsers.filter(u => u.role === 'mechanic_standard');
    const premiums  = filteredUsers.filter(u => u.role === 'mechanic_premium');
    const allMechanics = [...standards, ...premiums];
    return {
      pendingMechanics: allMechanics.filter(u => u.mechanic_profile_status === 'pending' || !u.mechanic_profile_status),
      approvedStandards: standards.filter(u => u.mechanic_profile_status === 'approved'),
      approvedPremiums:  premiums.filter(u => u.mechanic_profile_status === 'approved'),
      otherMechanics: allMechanics.filter(u =>
        u.mechanic_profile_status === 'rejected' || u.mechanic_profile_status === 'suspended'
      ),
      admins: filteredUsers.filter(u => u.role === 'admin'),
    };
  }, [filteredUsers]);

  const handleBlockAction = async (user) => {
    const type = user.is_blocked ? 'debloquer' : 'bloquer';
    setPendingAction(`${type}-${user.id}`);
    setError('');
    try {
      if (user.is_blocked) {
        await unblockAdminUser(user.id);
      } else {
        await blockAdminUser(user.id, 'Blocage depuis le dashboard administrateur');
      }
      await loadUsers();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setPendingAction('');
    }
  };

  const handleApprove = async (user) => {
    if (!user.mechanic_profile_id) {
      setError("Ce mécanicien n'a pas encore soumis son profil complet.");
      return;
    }
    setPendingAction(`approve-${user.id}`);
    setError('');
    try {
      await validateAdminMechanic(user.mechanic_profile_id, 'approve');
      await loadUsers();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setPendingAction('');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget?.mechanic_profile_id) return;
    setPendingAction(`reject-${rejectTarget.id}`);
    setError('');
    try {
      await validateAdminMechanic(rejectTarget.mechanic_profile_id, 'reject', rejectReason);
      setRejectTarget(null);
      setRejectReason('');
      await loadUsers();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setPendingAction('');
    }
  };

  const ProfileStatusBadge = ({ status }) => {
    const cls = STATUS_BADGE[status] || 'bg-gray-100 text-gray-600 border-gray-300';
    return (
      <span className={`inline-block text-xs font-bold uppercase border rounded-full px-2 py-0.5 ${cls}`}>
        {STATUS_LABEL[status] || 'Inconnu'}
      </span>
    );
  };

  const UserCard = ({ user, showValidation = false }) => (
    <div className={`bg-white rounded-2xl p-4 shadow-md border-2 mb-4 transition-all ${
      user.is_blocked ? 'border-red-500 bg-red-50' : showValidation ? 'border-yellow-400 bg-yellow-50' : 'border-transparent'
    }`}>
      <div className="flex justify-between items-start">
        <div className="min-w-0 pr-2">
          <h4 className="font-bold text-[#0D2B0D] uppercase text-sm truncate">
            {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
          </h4>
          <p className="text-xs text-gray-500 font-mono truncate">ID: {user.id}</p>
          <p className="text-xs text-gray-700 truncate">Email: {user.email}</p>
          <p className="text-xs text-gray-700">📞 {user.phone || '-'}</p>
          {user.mechanic_profile_status && (
            <div className="mt-1">
              <ProfileStatusBadge status={user.mechanic_profile_status} />
            </div>
          )}
        </div>
        {user.is_blocked
          ? <Clock size={16} className="text-red-500 animate-pulse shrink-0" />
          : <CheckCircle size={16} className="text-green-500 shrink-0" />}
      </div>

      {user.is_blocked && user.block_reason ? (
        <p className="text-xs font-bold text-red-600 mt-2 bg-white/50 p-1 rounded">
          Motif: {user.block_reason}
        </p>
      ) : null}

      {/* Boutons validation pour mécaniciens en attente */}
      {showValidation && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => handleApprove(user)}
            disabled={!!pendingAction}
            className="bg-green-600 text-white text-xs py-2 rounded-xl hover:bg-green-700 uppercase font-bold disabled:opacity-60"
          >
            {pendingAction === `approve-${user.id}` ? '...' : '✓ Approuver'}
          </button>
          <button
            onClick={() => { setRejectTarget(user); setRejectReason(''); }}
            disabled={!!pendingAction}
            className="bg-red-600 text-white text-xs py-2 rounded-xl hover:bg-red-700 uppercase font-bold disabled:opacity-60"
          >
            ✕ Refuser
          </button>
        </div>
      )}

      {/* Boutons standard */}
      <div className="grid grid-cols-3 gap-1 mt-2">
        <button
          onClick={() => handleBlockAction(user)}
          disabled={pendingAction === `bloquer-${user.id}` || pendingAction === `debloquer-${user.id}`}
          className="bg-gray-800 text-white text-xs py-2 rounded-lg hover:bg-black uppercase font-bold disabled:opacity-60"
        >
          {user.is_blocked ? 'Débloquer' : 'Bloquer'}
        </button>
        <button className="bg-orange-500 text-white text-xs py-2 rounded-lg hover:bg-orange-600 uppercase font-bold opacity-50 cursor-not-allowed">
          Suspendre
        </button>
        <button className="bg-red-600 text-white text-xs py-2 rounded-lg hover:bg-red-800 uppercase font-bold opacity-50 cursor-not-allowed">
          Supprimer
        </button>
      </div>
    </div>
  );

  const totalFiltered = groupedUsers.pendingMechanics.length
    + groupedUsers.approvedStandards.length
    + groupedUsers.approvedPremiums.length
    + groupedUsers.otherMechanics.length
    + groupedUsers.admins.length;

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

        {/* Section EN ATTENTE DE VALIDATION — mise en avant */}
        {groupedUsers.pendingMechanics.length > 0 && (
          <div className="mb-8 bg-yellow-50 border-2 border-yellow-400 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={22} className="text-yellow-600" />
              <h3 className="text-lg font-black text-yellow-800 uppercase tracking-tight">
                En attente de validation ({groupedUsers.pendingMechanics.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedUsers.pendingMechanics.map(user => (
                <UserCard key={user.id} user={user} showValidation />
              ))}
            </div>
          </div>
        )}

        {/* Grille principale */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* CONDUCTEURS */}
          <section>
            <div className="bg-[#0D2B0D] text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg text-sm">
              CONDUCTEURS
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-xs font-bold text-blue-700 uppercase mb-2">Service anonyme</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                Les conducteurs utilisent l'application <strong>sans créer de compte</strong>.
                Chaque demande est identifiée par un UUID unique et le numéro de téléphone fourni.
              </p>
              <p className="text-xs text-blue-400 mt-3 italic">MVP — V2</p>
            </div>
          </section>

          {/* MÉCANICIENS STANDARDS APPROUVÉS */}
          <section>
            <div className="bg-[#0D2B0D] text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg text-sm">
              STANDARDS
            </div>
            {groupedUsers.approvedStandards.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4 italic">Aucun approuvé</p>
            ) : groupedUsers.approvedStandards.map(user => <UserCard key={user.id} user={user} />)}
          </section>

          {/* MÉCANICIENS PREMIUM APPROUVÉS */}
          <section>
            <div className="bg-yellow-600 text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg text-sm">
              PREMIUM ★
            </div>
            {groupedUsers.approvedPremiums.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4 italic">Aucun approuvé</p>
            ) : groupedUsers.approvedPremiums.map(user => <UserCard key={user.id} user={user} />)}
          </section>

          {/* REFUSÉS / SUSPENDUS */}
          <section>
            <div className="bg-gray-500 text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg text-sm">
              REFUSÉS / SUSPENDUS
            </div>
            {groupedUsers.otherMechanics.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4 italic">Aucun</p>
            ) : groupedUsers.otherMechanics.map(user => <UserCard key={user.id} user={user} />)}
          </section>

          {/* ADMINISTRATEURS */}
          <section>
            <div className="bg-[#608C27] text-white text-center py-3 rounded-full font-bold mb-6 shadow-lg text-sm">
              ADMINS
            </div>
            {groupedUsers.admins.length === 0 && q ? (
              <p className="text-center text-sm text-gray-400 py-4">Aucun résultat</p>
            ) : groupedUsers.admins.map(user => <UserCard key={user.id} user={user} />)}
          </section>

        </div>
      </div>

      {/* Modal de refus */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-lg font-black text-[#0D2B0D] mb-2">Refuser le profil</h3>
            <p className="text-sm text-gray-600 mb-4">
              Mécanicien : <strong>{rejectTarget.full_name || rejectTarget.email}</strong>
            </p>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Motif du refus</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Expliquez la raison du refus…"
              rows={3}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-4 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!!pendingAction}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 disabled:opacity-60"
              >
                {pendingAction ? '...' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Utilisateurs;
