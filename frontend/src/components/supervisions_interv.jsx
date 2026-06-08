import { useEffect, useRef, useState } from 'react';
import { MapPin, Clock, Wrench, Search, X, RefreshCcw, ChevronDown, ChevronUp, User, Phone, ShieldAlert, Eye } from 'lucide-react';
import { fetchAdminBreakdowns, adminCancelBreakdown } from '../lib/api';

const STATUS_LABEL = {
  pending:     { text: 'En attente',         color: 'bg-yellow-100 text-yellow-700 border-yellow-400' },
  assigned:    { text: 'Mécanicien assigné',  color: 'bg-blue-100 text-blue-700 border-blue-400' },
  in_progress: { text: 'En cours',            color: 'bg-orange-100 text-orange-700 border-orange-400' },
  completed:   { text: 'Terminée',            color: 'bg-green-100 text-green-700 border-green-400' },
  cancelled:   { text: 'Annulée',             color: 'bg-red-100 text-red-700 border-red-400' },
};

const ALL_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];

const StatusBadge = ({ status }) => {
  const cfg = STATUS_LABEL[status] || { text: status, color: 'bg-gray-100 text-gray-600 border-gray-300' };
  return (
    <span className={`inline-block text-xs font-bold uppercase border rounded-full px-2 py-0.5 ${cfg.color}`}>
      {cfg.text}
    </span>
  );
};

const POLL_INTERVAL_MS = 4_000;

const SupervisionInterventions = ({ onBack }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openId, setOpenId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const intervalRef = useRef(null);
  const statusFilterRef = useRef('');

  const load = async (status = statusFilterRef.current, { silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    if (!silent) setError('');
    try {
      const data = await fetchAdminBreakdowns(status || undefined);
      setRequests(data.results || (Array.isArray(data) ? data : []));
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(statusFilterRef.current, { silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleStatusFilter = (s) => {
    const next = s === statusFilter ? '' : s;
    setStatusFilter(next);
    statusFilterRef.current = next;
    load(next);
  };

  const handleCancelBreakdown = async (id) => {
    if (!window.confirm('Annuler cette demande pour identité suspecte ? Le mécanicien sera notifié.')) return;
    setCancelLoading(id);
    setCancelError('');
    try {
      await adminCancelBreakdown(id);
      await load(statusFilterRef.current, { silent: true });
    } catch (e) {
      setCancelError(e.message);
    } finally {
      setCancelLoading(null);
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? requests.filter(r =>
        (r.driver_name || '').toLowerCase().includes(q) ||
        (r.driver_phone || '').toLowerCase().includes(q) ||
        (r.breakdown_type || '').toLowerCase().includes(q) ||
        (r.breakdown_description || '').toLowerCase().includes(q) ||
        (r.address_description || '').toLowerCase().includes(q) ||
        (r.vehicle_description || '').toLowerCase().includes(q)
      )
    : requests;

  return (
    <div className="min-h-screen bg-gray-200 font-sans">

      {/* En-tête */}
      <div className="bg-[#0D2B0D] rounded-t-[1.5rem] p-4 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-white text-sm font-bold hover:text-[#608C27] transition-colors shrink-0">
            ← Retour
          </button>
        )}
        <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight italic text-center flex-1">
          Supervision des Demandes
        </h2>
        <button
          onClick={() => load()}
          className="text-white hover:text-[#608C27] transition-colors shrink-0"
          title="Actualiser"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="bg-white rounded-b-[1.5rem] p-4 sm:p-6">

        {/* Filtres + Recherche */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Barre de recherche */}
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher par client, type de panne, adresse…"
              className="w-full border-2 border-[#0D2B0D] rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27]"
            />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D2B0D]" />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filtres statut */}
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => handleStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-colors ${
                  statusFilter === s
                    ? 'bg-[#0D2B0D] text-white border-[#0D2B0D]'
                    : 'bg-white text-[#0D2B0D] border-gray-300 hover:border-[#0D2B0D]'
                }`}
              >
                {STATUS_LABEL[s]?.text || s}
              </button>
            ))}
          </div>
        </div>

        {/* Compteur */}
        <p className="text-sm text-gray-500 mb-4 font-medium">
          {isLoading ? 'Chargement…' : `${filtered.length} demande${filtered.length !== 1 ? 's' : ''}`}
          {statusFilter ? ` — filtre : ${STATUS_LABEL[statusFilter]?.text}` : ''}
          {q ? ` — recherche : "${query}"` : ''}
        </p>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 p-4 text-center text-red-700 text-sm">{error}</div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 font-semibold">
            Aucune demande trouvée.
          </div>
        )}

        {/* Liste des demandes */}
        <div className="space-y-4">
          {filtered.map(req => {
            const isOpen = openId === req.id;
            const cfg = STATUS_LABEL[req.status] || { text: req.status, color: 'bg-gray-100 text-gray-600 border-gray-300' };

            return (
              <div
                key={req.id}
                className={`rounded-2xl border-2 overflow-hidden transition-all ${
                  isOpen ? 'border-[#608C27]' : 'border-gray-200'
                } bg-white shadow-md`}
              >
                {/* En-tête cliquable */}
                <div
                  className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  onClick={() => setOpenId(isOpen ? null : req.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full shrink-0 ${isOpen ? 'bg-[#608C27] text-white' : 'bg-gray-100 text-[#0D2B0D]'}`}>
                      <Wrench size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-[#0D2B0D] leading-tight">
                        {req.breakdown_type || 'Demande de dépannage'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <User size={11} /> {req.driver_name || '—'}
                        {req.driver_phone && (
                          <span className="ml-2 flex items-center gap-1">
                            <Phone size={11} /> {req.driver_phone}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock size={11} /> {new Date(req.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={req.status} />
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Détails dépliables */}
                {isOpen && (
                  <div className="bg-[#0D2B0D] p-5 sm:p-6 text-white space-y-4 border-t-2 border-[#608C27]">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      {/* Infos conducteur */}
                      <Section title="Conducteur">
                        <Row label="Nom" value={req.driver_name} />
                        <Row label="Téléphone" value={req.driver_phone} />
                        <Row label="Véhicule" value={req.vehicle_description} />
                        {/* Photos d'identité */}
                        {(req.driver_id_card || req.driver_selfie) && (
                          <div className="mt-2 space-y-2">
                            {req.driver_id_card && (
                              <div>
                                <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                                  <Eye size={11} /> Pièce d'identité
                                </p>
                                <a href={req.driver_id_card} target="_blank" rel="noreferrer">
                                  <img
                                    src={req.driver_id_card}
                                    alt="Pièce d'identité conducteur"
                                    className="w-full rounded-lg max-h-36 object-cover border border-[#608C27]/40 hover:opacity-80 transition-opacity cursor-pointer"
                                  />
                                </a>
                              </div>
                            )}
                            {req.driver_selfie && (
                              <div>
                                <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                                  <Eye size={11} /> Selfie conducteur
                                </p>
                                <a href={req.driver_selfie} target="_blank" rel="noreferrer">
                                  <img
                                    src={req.driver_selfie}
                                    alt="Selfie conducteur"
                                    className="w-full rounded-lg max-h-36 object-cover border border-[#608C27]/40 hover:opacity-80 transition-opacity cursor-pointer"
                                  />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </Section>

                      {/* Infos panne */}
                      <Section title="Panne">
                        <Row label="Type" value={req.breakdown_type} />
                        <Row label="Description" value={req.breakdown_description} />
                        <Row label="Spécialité demandée" value={req.specialty_requested?.name} />
                      </Section>

                      {/* Localisation */}
                      <Section title="Localisation">
                        <Row label="Adresse" value={req.address_description} icon={<MapPin size={12} />} />
                        <Row label="GPS" value={
                          req.latitude && req.longitude
                            ? `${parseFloat(req.latitude).toFixed(5)}, ${parseFloat(req.longitude).toFixed(5)}`
                            : null
                        } />
                      </Section>

                      {/* Mécanicien assigné */}
                      <Section title="Mécanicien assigné">
                        {req.assigned_mechanic ? (
                          <>
                            <Row label="Nom" value={
                              req.assigned_mechanic.user_name ||
                              `${req.assigned_mechanic.first_name || ''} ${req.assigned_mechanic.last_name || ''}`.trim()
                            } />
                            <Row label="Ville" value={req.assigned_mechanic.city} />
                            <Row label="Distance" value={req.assignment_distance_km ? `${req.assignment_distance_km} km` : null} />
                            <Row label="Assigné le" value={req.assigned_at ? new Date(req.assigned_at).toLocaleString('fr-FR') : null} />
                          </>
                        ) : (
                          <p className="text-white/50 text-xs italic">Aucun mécanicien assigné</p>
                        )}
                      </Section>

                    </div>

                    {/* Identifiants techniques + action admin */}
                    <div className="border-t border-white/10 pt-3 mt-2">
                      <p className="text-white/40 text-xs font-mono">ID demande : {req.id}</p>
                      {req.refusal_count > 0 && (
                        <p className="text-orange-400 text-xs mt-1">
                          {req.refusal_count} refus enregistré{req.refusal_count > 1 ? 's' : ''}
                        </p>
                      )}
                      {cancelError && <p className="text-red-400 text-xs mt-1">{cancelError}</p>}
                      {!['completed', 'cancelled'].includes(req.status) && (
                        <button
                          onClick={() => handleCancelBreakdown(req.id)}
                          disabled={cancelLoading === req.id}
                          className="mt-3 w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                        >
                          <ShieldAlert size={14} />
                          {cancelLoading === req.id ? 'Annulation…' : 'Annuler — identité suspecte'}
                        </button>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div>
    <p className="text-[#608C27] text-xs font-black uppercase tracking-wider mb-2">{title}</p>
    <div className="space-y-1">{children}</div>
  </div>
);

const Row = ({ label, value, icon }) => (
  <div className="flex items-start gap-1.5 text-xs">
    {icon && <span className="text-[#608C27] mt-0.5 shrink-0">{icon}</span>}
    <span className="text-white/50 shrink-0">{label} :</span>
    <span className="text-white font-medium">{value || '—'}</span>
  </div>
);

export default SupervisionInterventions;
