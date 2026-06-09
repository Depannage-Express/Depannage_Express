import { useEffect, useRef, useState } from 'react';
import { MapPin, Clock, Wrench, Search, X, CheckCircle, XCircle, Phone, FlagTriangleRight, Car, User, ChevronDown, Navigation, AlertTriangle } from 'lucide-react';
import { fetchMechanicRequests, fetchMyInterventions, acceptIntervention, refuseIntervention, completeIntervention } from '../lib/api';
import GeoLabel from './geo_label';

const POLL_INTERVAL_MS = 4_000;

const ListesCommandes = ({ onBack }) => {
  const [allCommands, setAllCommands] = useState([]);
  const [interventionMap, setInterventionMap] = useState({});
  const [openCommandId, setOpenCommandId] = useState(-1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');
  const intervalRef = useRef(null);

  const loadAll = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const [reqData, intervData] = await Promise.all([
        fetchMechanicRequests(),
        fetchMyInterventions(),
      ]);
      setAllCommands(reqData.results || []);
      const map = {};
      (intervData.results || []).forEach((iv) => {
        const bdId = iv.breakdown_request;
        if (!map[bdId]) {
          map[bdId] = iv;
        } else if (iv.status === 'pending_acceptance' && map[bdId].status !== 'pending_acceptance') {
          map[bdId] = iv;
        }
      });
      setInterventionMap(map);
    } catch (requestError) {
      if (!silent) setError(requestError.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    intervalRef.current = setInterval(() => loadAll({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleAccept = async (interventionId) => {
    setActionLoading(interventionId + '_accept');
    setActionError('');
    try {
      await acceptIntervention(interventionId);
      await loadAll({ silent: true });
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefuse = async (interventionId) => {
    setActionLoading(interventionId + '_refuse');
    setActionError('');
    try {
      await refuseIntervention(interventionId);
      await loadAll({ silent: true });
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (interventionId) => {
    setActionLoading(interventionId + '_complete');
    setActionError('');
    try {
      await completeIntervention(interventionId);
      await loadAll({ silent: true });
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleCommand = (id) => {
    setOpenCommandId(openCommandId === id ? -1 : id);
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? allCommands.filter(c =>
        (c.driver_name || '').toLowerCase().includes(q) ||
        (c.breakdown_type || '').toLowerCase().includes(q) ||
        (c.breakdown_description || '').toLowerCase().includes(q) ||
        (c.address_description || '').toLowerCase().includes(q)
      )
    : allCommands;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 bg-[#0D2B0D] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#608C27] transition-colors text-sm shrink-0"
            >
              ← Retour
            </button>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0D2B0D] uppercase tracking-wide">
              Mes Demandes
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Missions assignées en temps réel</p>
          </div>
          {onBack && <span className="w-20 shrink-0" />}
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par client, type de panne…"
            className="w-full border-2 border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27] focus:border-transparent bg-white shadow-sm"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-8 h-8 border-4 border-[#608C27] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm font-medium">Chargement des missions…</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-center text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        {actionError && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-center text-red-700 text-sm">
            {actionError}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-700 font-semibold text-lg mb-1">
              {q ? `Aucun résultat pour "${query}"` : 'Aucune demande pour le moment'}
            </p>
            <p className="text-slate-400 text-sm">
              {q ? 'Essayez un autre mot-clé' : 'Les nouvelles missions apparaîtront ici automatiquement'}
            </p>
            {q && (
              <button onClick={() => setQuery('')} className="mt-4 text-[#608C27] font-bold text-sm underline">
                Effacer la recherche
              </button>
            )}
          </div>
        )}

        {q && filtered.length > 0 && (
          <p className="text-xs text-slate-400 text-center mb-4 font-medium">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour «&nbsp;{query}&nbsp;»
          </p>
        )}

        {/* Command cards */}
        <div className="space-y-4">
          {filtered.map((command) => {
            const intervention = interventionMap[command.id];
            const isPending = intervention?.status === 'pending_acceptance';
            const isAccepted = intervention?.status === 'accepted';
            const isInProgress = intervention?.status === 'in_progress';
            const isPaid = intervention?.status === 'paid' || intervention?.status === 'reviewed';
            const isOpen = openCommandId === command.id;

            const driverPhone = intervention?.breakdown_request_detail?.driver_phone || command.driver_phone;
            const showPhone = (isAccepted || isInProgress || isPaid) && driverPhone;

            const borderClass = isPending
              ? 'border-amber-400'
              : isAccepted
              ? 'border-blue-400'
              : isInProgress
              ? 'border-orange-400'
              : isPaid
              ? 'border-emerald-400'
              : 'border-slate-200';

            const iconClass = isPending
              ? 'bg-amber-100 text-amber-600'
              : isAccepted
              ? 'bg-blue-100 text-blue-600'
              : isInProgress
              ? 'bg-orange-100 text-orange-600'
              : isPaid
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-slate-100 text-slate-500';

            return (
              <div
                key={command.id}
                className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden transition-shadow hover:shadow-lg ${borderClass}`}
              >
                {/* Status banner */}
                {isPending && (
                  <div className="bg-amber-500 px-5 py-1.5 text-white text-xs font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse inline-block" />
                    Nouvelle mission — répondez maintenant
                  </div>
                )}
                {isAccepted && (
                  <div className="bg-blue-600 px-5 py-1.5 text-white text-xs font-bold uppercase tracking-widest text-center">
                    Mission acceptée — en route vers le client
                  </div>
                )}
                {isInProgress && (
                  <div className="bg-orange-500 px-5 py-1.5 text-white text-xs font-bold uppercase tracking-widest text-center">
                    Intervention en cours
                  </div>
                )}
                {isPaid && (
                  <div className="bg-emerald-600 px-5 py-1.5 text-white text-xs font-bold uppercase tracking-widest text-center">
                    Mission terminée &amp; payée
                  </div>
                )}

                {/* Card header — clickable */}
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleCommand(command.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                      <Wrench size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-base leading-tight truncate">
                        {command.breakdown_type || 'Demande de dépannage'}
                      </p>
                      <p className="text-sm text-slate-500 font-medium mt-0.5">{command.driver_name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        {new Date(command.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isOpen ? 'bg-[#0D2B0D] text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                {/* Accordion detail */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1400px]' : 'max-h-0'}`}>
                  <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-3 rounded-b-2xl">

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <InfoCard icon={<User size={15} />} label="Client" value={command.driver_name} variant="default" />
                      <InfoCard
                        icon={<Car size={15} />}
                        label="Véhicule"
                        value={[command.vehicle_brand, command.vehicle_type].filter(Boolean).join(' · ') || 'Non précisé'}
                        variant="default"
                      />
                      <InfoCard
                        icon={<Navigation size={15} />}
                        label="Distance"
                        value={command.assignment_distance_km ? `${command.assignment_distance_km} km` : 'Non calculée'}
                        variant="blue"
                      />
                      <InfoCard
                        icon={<AlertTriangle size={15} />}
                        label="Type de panne"
                        value={command.breakdown_type || '—'}
                        variant="orange"
                      />
                    </div>

                    {/* Phone — highlighted when available */}
                    {showPhone ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Phone size={18} className="text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Téléphone conducteur</p>
                            <p className="text-base font-bold text-emerald-900">{driverPhone}</p>
                          </div>
                        </div>
                        <a
                          href={`tel:${driverPhone}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Appeler
                        </a>
                      </div>
                    ) : (isAccepted || isInProgress || isPaid) && (
                      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                        <Phone size={18} className="text-slate-400" />
                        <p className="text-sm text-slate-500 italic">Téléphone non disponible</p>
                      </div>
                    )}

                    {/* Description */}
                    {command.breakdown_description && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">Description de la panne</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{command.breakdown_description}</p>
                      </div>
                    )}

                    {/* Location */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-[#0D2B0D] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MapPin size={16} className="text-[#608C27]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Localisation</p>
                          <p className="text-sm text-slate-800 font-medium leading-snug">
                            {isPaid
                              ? <GeoLabel lat={command.latitude} lon={command.longitude} fallback={command.address_description} />
                              : (command.address_description || 'Position GPS reçue')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {isPending && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <button
                          onClick={() => handleAccept(intervention.id)}
                          disabled={!!actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-[#608C27] hover:bg-[#4a6e1e] active:scale-95 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-60 shadow-sm"
                        >
                          <CheckCircle size={20} />
                          {actionLoading === intervention.id + '_accept' ? 'Acceptation…' : 'Accepter la mission'}
                        </button>
                        <button
                          onClick={() => handleRefuse(intervention.id)}
                          disabled={!!actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-red-50 active:scale-95 text-red-600 border-2 border-red-300 font-bold py-3.5 rounded-2xl transition-all disabled:opacity-60"
                        >
                          <XCircle size={20} />
                          {actionLoading === intervention.id + '_refuse' ? 'Refus…' : 'Refuser'}
                        </button>
                      </div>
                    )}

                    {(isAccepted || isInProgress) && (
                      <div className="pt-1">
                        <button
                          onClick={() => handleComplete(intervention.id)}
                          disabled={!!actionLoading}
                          className="w-full flex items-center justify-center gap-2 bg-[#0D2B0D] hover:bg-[#608C27] active:scale-95 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-60 shadow-sm"
                        >
                          <FlagTriangleRight size={20} />
                          {actionLoading === intervention.id + '_complete' ? 'Finalisation…' : 'Marquer comme terminée'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value, variant = 'default' }) => {
  const styles = {
    default: 'bg-white border-slate-200 text-slate-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };
  return (
    <div className={`border rounded-xl p-3 ${styles[variant] || styles.default}`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-60">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold leading-tight">{value || '—'}</p>
    </div>
  );
};

export default ListesCommandes;
