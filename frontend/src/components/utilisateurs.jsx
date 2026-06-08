import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, CheckCircle, RefreshCcw, Search, X, AlertTriangle, UserCheck, MapPin, Camera, LocateFixed } from 'lucide-react';
import {
  blockAdminUser,
  fetchAdminUsers,
  unblockAdminUser,
  validateAdminMechanic,
  fetchSpecialties,
  adminCompleteAndApproveMechanic,
  adminFixMechanicLocation,
} from '../lib/api';
import { DEPARTMENTS, getCitiesForDept, getQuartiersForCity, getCoordsForQuartier } from '../lib/benin_locations';

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

const EMPTY_FORM = {
  bio: '',
  years_experience: '',
  city: '',
  address: '',
  latitude: '',
  longitude: '',
  specialty_ids: [],
  profile_photo: null,
};

const Utilisateurs = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState('');
  const [query, setQuery] = useState('');

  // Modal refus
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Modal GPS fix
  const [gpsFixTarget, setGpsFixTarget] = useState(null); // { profileId, name }
  const [gpsFixLat, setGpsFixLat] = useState('');
  const [gpsFixLng, setGpsFixLng] = useState('');
  const [gpsFixLoading, setGpsFixLoading] = useState(false);
  const [gpsFixError, setGpsFixError] = useState('');

  // Modal compléter le profil
  const [completeTarget, setCompleteTarget] = useState(null);
  const [completeForm, setCompleteForm] = useState(EMPTY_FORM);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedQuartier, setSelectedQuartier] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSource, setGpsSource] = useState(''); // 'photo' | 'city' | 'gps'
  const [specialties, setSpecialties] = useState([]);
  const [specialtiesLoaded, setSpecialtiesLoaded] = useState(false);
  const [completeError, setCompleteError] = useState('');
  const photoInputRef = useRef(null);

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

  const openCompleteModal = async (user) => {
    setCompleteTarget(user);
    setCompleteForm({ ...EMPTY_FORM, specialty_ids: [] });
    setSelectedDept('');
    setSelectedCity('');
    setSelectedQuartier('');
    setGpsSource('');
    setCompleteError('');
    try {
      const data = await fetchSpecialties();
      const list = Array.isArray(data) ? data : (data.results || []);
      setSpecialties(list);
      setSpecialtiesLoaded(true);
    } catch {
      setSpecialties([]);
      setSpecialtiesLoaded(true);
    }
  };

  const handleDeptChange = (dept) => {
    setSelectedDept(dept);
    setSelectedCity('');
    setSelectedQuartier('');
    setCompleteForm(f => ({ ...f, city: '', latitude: '', longitude: '' }));
    setGpsSource('');
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setSelectedQuartier('');
    setCompleteForm(f => ({ ...f, city, latitude: '', longitude: '' }));
    setGpsSource('');
  };

  const handleQuartierChange = (quartier) => {
    setSelectedQuartier(quartier);
    const coords = getCoordsForQuartier(selectedDept, selectedCity, quartier);
    setCompleteForm(f => ({
      ...f,
      latitude:  coords ? String(coords.lat) : '',
      longitude: coords ? String(coords.lng) : '',
    }));
    if (coords) setGpsSource('quartier');
  };

  const requestGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCompleteForm(f => ({
          ...f,
          latitude:  pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGpsSource('gps');
        setGpsLoading(false);
      },
      () => { setGpsLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCompleteForm(f => ({ ...f, profile_photo: file }));
    // Géolocalisation automatique à la prise de photo
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCompleteForm(f => ({
            ...f,
            latitude:  pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          }));
          setGpsSource('photo');
          setGpsLoading(false);
        },
        () => { setGpsLoading(false); },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  };

  const toggleSpecialty = (id) => {
    setCompleteForm(prev => {
      const ids = prev.specialty_ids.includes(id)
        ? prev.specialty_ids.filter(s => s !== id)
        : [...prev.specialty_ids, id];
      return { ...prev, specialty_ids: ids };
    });
  };

  const handleCompleteSubmit = async () => {
    if (!completeTarget) return;

    // Validation des champs obligatoires
    const missingFields = [];
    if (!selectedCity)                    missingFields.push('Commune / Ville');
    if (!selectedQuartier)                missingFields.push('Quartier / Zone');
    if (!completeForm.latitude.trim())    missingFields.push('Latitude');
    if (!completeForm.longitude.trim())   missingFields.push('Longitude');
    if (specialties.length > 0 && completeForm.specialty_ids.length === 0) {
      missingFields.push('au moins une Spécialité');
    }
    if (missingFields.length > 0) {
      setCompleteError(`Champs obligatoires manquants : ${missingFields.join(', ')}.`);
      return;
    }

    setCompleteError('');
    setPendingAction(`complete-${completeTarget.id}`);

    const fd = new FormData();
    if (completeForm.bio)              fd.append('bio', completeForm.bio);
    if (completeForm.years_experience) fd.append('years_experience', completeForm.years_experience);
    if (completeForm.city)             fd.append('city', completeForm.city);
    if (selectedQuartier)              fd.append('address', selectedQuartier);
    if (completeForm.latitude)         fd.append('latitude', completeForm.latitude);
    if (completeForm.longitude)        fd.append('longitude', completeForm.longitude);
    completeForm.specialty_ids.forEach(id => fd.append('specialty_ids', id));
    if (completeForm.profile_photo)    fd.append('profile_photo', completeForm.profile_photo);

    try {
      await adminCompleteAndApproveMechanic(completeTarget.id, fd);
      setCompleteTarget(null);
      await loadUsers();
    } catch (err) {
      setCompleteError(err.message || 'Une erreur est survenue.');
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

  const openGpsFix = (user) => {
    setGpsFixTarget({ profileId: user.mechanic_profile_id, name: user.full_name || user.email });
    setGpsFixLat('');
    setGpsFixLng('');
    setGpsFixError('');
  };

  const requestGpsForFix = () => {
    if (!navigator.geolocation) return;
    setGpsFixLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsFixLat(pos.coords.latitude.toFixed(6));
        setGpsFixLng(pos.coords.longitude.toFixed(6));
        setGpsFixLoading(false);
      },
      () => { setGpsFixLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleGpsFixSubmit = async () => {
    if (!gpsFixLat || !gpsFixLng) { setGpsFixError('Entrez les coordonnées ou utilisez le GPS.'); return; }
    setGpsFixLoading(true);
    setGpsFixError('');
    try {
      await adminFixMechanicLocation(gpsFixTarget.profileId, gpsFixLat, gpsFixLng);
      setGpsFixTarget(null);
    } catch (e) {
      setGpsFixError(e.message);
    } finally {
      setGpsFixLoading(false);
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
            onClick={() => openCompleteModal(user)}
            disabled={!!pendingAction}
            className="flex items-center justify-center gap-1 bg-green-600 text-white text-xs py-2 rounded-xl hover:bg-green-700 uppercase font-bold disabled:opacity-60"
          >
            <UserCheck size={13} />
            Compléter & Valider
          </button>
          <button
            onClick={() => {
              if (!user.mechanic_profile_id) {
                setError("Aucun profil soumis — utilisez 'Compléter & Valider' pour créer le profil.");
                return;
              }
              setRejectTarget(user);
              setRejectReason('');
            }}
            disabled={!!pendingAction}
            className="bg-red-600 text-white text-xs py-2 rounded-xl hover:bg-red-700 uppercase font-bold disabled:opacity-60"
          >
            ✕ Refuser
          </button>
        </div>
      )}

      {/* Bouton corriger GPS (mécaniciens approuvés seulement) */}
      {user.mechanic_profile_id && user.mechanic_profile_status === 'approved' && (
        <button
          onClick={() => openGpsFix(user)}
          className="w-full mt-2 flex items-center justify-center gap-1 bg-[#608C27]/10 text-[#608C27] border border-[#608C27]/40 text-xs py-2 rounded-xl hover:bg-[#608C27] hover:text-white transition-colors font-bold uppercase"
        >
          <MapPin size={12} /> Corriger GPS
        </button>
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

      {/* ── Modal : Compléter le profil mécanicien ── */}
      {completeTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg my-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black text-[#0D2B0D]">Compléter le profil</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {completeTarget.full_name || completeTarget.email}
                </p>
              </div>
              <button onClick={() => setCompleteTarget(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 mb-5">
              Les champs marqués <span className="text-red-500 font-bold">*</span> sont obligatoires pour que le mécanicien soit trouvable par le système.
            </p>

            <div className="space-y-4">

              {/* Photo de profil + géolocalisation automatique */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Photo de profil
                  <span className="ml-2 text-[#608C27] font-normal normal-case">— déclenche le GPS automatiquement</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex items-center gap-2 bg-[#0D2B0D] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#608C27] transition-colors"
                  >
                    <Camera size={15} />
                    {completeForm.profile_photo ? 'Changer la photo' : 'Prendre / Choisir une photo'}
                  </button>
                  {gpsLoading && (
                    <span className="text-xs text-[#608C27] animate-pulse flex items-center gap-1">
                      <LocateFixed size={13} /> GPS en cours…
                    </span>
                  )}
                  {gpsSource === 'photo' && !gpsLoading && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <LocateFixed size={13} /> GPS capturé
                    </span>
                  )}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                {completeForm.profile_photo && (
                  <p className="text-xs text-green-700 mt-1.5 font-medium">✓ {completeForm.profile_photo.name}</p>
                )}
              </div>

              {/* Spécialités */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  Spécialités {specialties.length > 0 && <span className="text-red-500">*</span>}
                </label>
                {!specialtiesLoaded ? (
                  <p className="text-xs text-gray-400 italic">Chargement des spécialités…</p>
                ) : specialties.length === 0 ? (
                  <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                    Aucune spécialité disponible — validation permise sans sélection.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {specialties.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSpecialty(String(s.id))}
                        className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-colors ${
                          completeForm.specialty_ids.includes(String(s.id))
                            ? 'bg-[#608C27] text-white border-[#608C27]'
                            : 'bg-white text-[#0D2B0D] border-gray-300 hover:border-[#608C27]'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Localisation — cascade Département → Commune */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-black uppercase text-gray-500 flex items-center gap-1">
                  <MapPin size={13} /> Localisation <span className="text-red-500 ml-0.5">*</span>
                </p>

                {/* Ligne 1 : Département + Commune */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Département</label>
                    <select
                      value={selectedDept}
                      onChange={e => handleDeptChange(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27] bg-white"
                    >
                      <option value="">— Choisir —</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Commune / Ville <span className="text-red-500">*</span></label>
                    <select
                      value={selectedCity}
                      onChange={e => handleCityChange(e.target.value)}
                      disabled={!selectedDept}
                      className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27] bg-white disabled:opacity-50"
                    >
                      <option value="">— Choisir —</option>
                      {getCitiesForDept(selectedDept).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Ligne 2 : Quartier / Zone */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Quartier / Zone <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedQuartier}
                    onChange={e => handleQuartierChange(e.target.value)}
                    disabled={!selectedCity}
                    className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27] bg-white disabled:opacity-50"
                  >
                    <option value="">— Choisir un quartier —</option>
                    {Object.keys(getQuartiersForCity(selectedDept, selectedCity)).map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                {/* Coordonnées — auto-remplies, modifiables manuellement */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Latitude <span className="text-red-500">*</span>
                      {gpsSource === 'quartier' && <span className="text-[#608C27] ml-1">(quartier)</span>}
                      {gpsSource === 'gps' && <span className="text-green-600 ml-1">(GPS précis)</span>}
                      {gpsSource === 'photo' && <span className="text-green-600 ml-1">(GPS photo)</span>}
                    </label>
                    <input
                      type="text"
                      value={completeForm.latitude}
                      onChange={e => setCompleteForm(f => ({ ...f, latitude: e.target.value }))}
                      placeholder="6.3702"
                      className={`w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27] ${
                        completeForm.latitude ? 'border-green-400 bg-green-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Longitude <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={completeForm.longitude}
                      onChange={e => setCompleteForm(f => ({ ...f, longitude: e.target.value }))}
                      placeholder="2.4183"
                      className={`w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27] ${
                        completeForm.longitude ? 'border-green-400 bg-green-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                {/* Bouton GPS précis */}
                <button
                  type="button"
                  onClick={requestGPS}
                  disabled={gpsLoading}
                  className="flex items-center gap-2 text-xs font-bold text-[#608C27] hover:text-[#0D2B0D] transition-colors disabled:opacity-60"
                >
                  <LocateFixed size={13} />
                  {gpsLoading ? 'Localisation en cours…' : 'Utiliser ma position GPS actuelle (plus précis)'}
                </button>
              </div>

              {/* Années d'expérience + Bio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Années d'exp.</label>
                  <input
                    type="number"
                    min="0"
                    value={completeForm.years_experience}
                    onChange={e => setCompleteForm(f => ({ ...f, years_experience: e.target.value }))}
                    placeholder="5"
                    className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Bio / Description</label>
                  <textarea
                    value={completeForm.bio}
                    onChange={e => setCompleteForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Mécanicien spécialisé en moteurs diesel depuis 10 ans…"
                    rows={2}
                    className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27] resize-none"
                  />
                </div>
              </div>

            </div>

            {completeError && (
              <p className="text-red-600 text-sm mt-4 bg-red-50 rounded-xl px-3 py-2">{completeError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCompleteTarget(null)}
                className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleCompleteSubmit}
                disabled={!!pendingAction}
                className="flex-1 bg-[#608C27] text-white font-bold py-3 rounded-2xl hover:bg-[#0D2B0D] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <UserCheck size={16} />
                {pendingAction ? 'Validation...' : 'Valider & Activer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : Corriger GPS mécanicien ── */}
      {gpsFixTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-black text-[#0D2B0D] flex items-center gap-2">
                  <MapPin size={18} className="text-[#608C27]" /> Corriger la position GPS
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{gpsFixTarget.name}</p>
              </div>
              <button onClick={() => setGpsFixTarget(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
              Si vous êtes <strong>physiquement à l'atelier du mécanicien</strong>, utilisez "Ma position GPS". Sinon, saisissez les coordonnées manuellement.
            </p>

            <button
              onClick={requestGpsForFix}
              disabled={gpsFixLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#0D2B0D] text-white text-sm font-bold py-3 rounded-2xl hover:bg-[#608C27] transition-colors mb-4 disabled:opacity-60"
            >
              <LocateFixed size={15} />
              {gpsFixLoading ? 'Localisation…' : 'Utiliser ma position GPS actuelle'}
            </button>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude</label>
                <input
                  type="text"
                  value={gpsFixLat}
                  onChange={e => setGpsFixLat(e.target.value)}
                  placeholder="9.339800"
                  className={`w-full border-2 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27] ${gpsFixLat ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude</label>
                <input
                  type="text"
                  value={gpsFixLng}
                  onChange={e => setGpsFixLng(e.target.value)}
                  placeholder="2.619700"
                  className={`w-full border-2 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27] ${gpsFixLng ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}
                />
              </div>
            </div>

            {gpsFixError && <p className="text-red-600 text-xs mt-2 mb-2">{gpsFixError}</p>}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setGpsFixTarget(null)} className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-300">
                Annuler
              </button>
              <button
                onClick={handleGpsFixSubmit}
                disabled={gpsFixLoading || !gpsFixLat || !gpsFixLng}
                className="flex-1 bg-[#608C27] text-white font-bold py-3 rounded-2xl hover:bg-[#0D2B0D] disabled:opacity-60"
              >
                {gpsFixLoading ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : Refus ── */}
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
