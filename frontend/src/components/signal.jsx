import { useEffect, useState, useCallback } from 'react';
import { Filter, Search, X, ArrowLeft } from 'lucide-react';
import {
  fetchAdminIncidents,
  fetchAdminIncidentStats,
  resolveIncident,
  rejectIncident,
  suspendIncident,
} from '../lib/api';

const GRAVITY_LABELS = { high: 'Élevé', medium: 'Moyen', low: 'Faible' };
const TYPE_LABELS = {
  abuse:   'Abus de langage',
  delay:   'Retard important',
  price:   'Problème de prix',
  fraud:   'Fraude',
  quality: 'Qualité du service',
  review:  'Avis litigieux',
  other:   'Autre',
};
const STATUS_LABELS = {
  pending:   'En attente',
  resolved:  'Résolu',
  rejected:  'Rejeté',
  suspended: 'Suspendu',
};

function typeBadge(type) {
  if (type === 'review') return 'inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700';
  return null;
}

function gravityBadge(gravity) {
  const base = 'inline-block text-xs font-bold px-2 py-0.5 rounded-full';
  if (gravity === 'high')   return `${base} bg-red-100 text-red-700`;
  if (gravity === 'medium') return `${base} bg-orange-100 text-orange-700`;
  return `${base} bg-yellow-100 text-yellow-700`;
}

function statusBadge(status) {
  const base = 'inline-block text-xs font-bold px-2 py-0.5 rounded-full';
  if (status === 'resolved')  return `${base} bg-green-100 text-green-700`;
  if (status === 'rejected')  return `${base} bg-gray-100 text-gray-600`;
  if (status === 'suspended') return `${base} bg-orange-100 text-orange-700`;
  return `${base} bg-blue-100 text-blue-700`;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ReviewDescription({ raw }) {
  const sections = {};
  const commentaireMatch = raw.match(/COMMENTAIRE ORIGINAL :\n([\s\S]*?)\n\nNOTE/);
  const noteMatch = raw.match(/NOTE DONNÉE : (.+?)\/5/);
  const explicationMatch = raw.match(/EXPLICATION DU CONDUCTEUR :\n([\s\S]*?)\n\nMOTS/);
  const motsMatch = raw.match(/MOTS DÉTECTÉS : (.+)/);
  if (commentaireMatch) sections.commentaire = commentaireMatch[1].trim();
  if (noteMatch) sections.note = noteMatch[1].trim();
  if (explicationMatch) sections.explication = explicationMatch[1].trim();
  if (motsMatch) sections.mots = motsMatch[1].trim();

  return (
    <div className="space-y-2 mt-1">
      {sections.commentaire && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="font-bold text-red-700 text-xs mb-1">Commentaire original :</p>
          <p className="text-gray-700 text-xs italic">&laquo; {sections.commentaire} &raquo;</p>
        </div>
      )}
      {sections.note && (
        <p className="text-xs"><span className="font-bold">Note donnée&nbsp;:</span> {sections.note}/5</p>
      )}
      {sections.explication && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <p className="font-bold text-blue-700 text-xs mb-1">Explication du conducteur :</p>
          <p className="text-gray-700 text-xs">{sections.explication}</p>
        </div>
      )}
      {sections.mots && (
        <p className="text-xs text-orange-600">
          <span className="font-bold">Mots détectés&nbsp;:</span> {sections.mots}
        </p>
      )}
    </div>
  );
}

const Signalements = ({ onBack }) => {
  const [incidents, setIncidents]       = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [gravityFilter, setGravityFilter] = useState('');
  const [statusFilter, setStatusFilter]   = useState('pending');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]   = useState(null);

  const loadIncidents = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchAdminIncidents({
        status:  statusFilter || undefined,
        gravity: gravityFilter || undefined,
        search:  search || undefined,
      });
      setIncidents(Array.isArray(data) ? data : (data.results ?? []));
      setError(null);
    } catch (e) {
      if (!silent) setError('Impossible de charger les signalements.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [gravityFilter, statusFilter, search]);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchAdminIncidentStats();
      setStats(data);
    } catch { /* silencieux */ }
  }, []);

  useEffect(() => {
    loadIncidents();
    loadStats();
    const interval = setInterval(() => {
      loadIncidents({ silent: true });
      loadStats();
    }, 4000);
    return () => clearInterval(interval);
  }, [loadIncidents, loadStats]);

  const doAction = async (fn, id) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await fn(id);
      setSelected(null);
      await loadIncidents();
      await loadStats();
    } catch (e) {
      setActionError(e?.message ?? 'Erreur lors de l\'action.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#0D2B0D] text-white p-4 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-white text-sm font-bold hover:text-[#608C27] transition-colors shrink-0"
          >
            <ArrowLeft size={16} /> Retour
          </button>
        )}
        <h2 className="text-xl sm:text-3xl font-bold flex-1 text-center">
          Gestion des Incidents
        </h2>
      </div>

      <div className="p-4 sm:p-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total signalements', value: stats?.total ?? 0,        color: 'bg-gray-50  border-gray-200' },
            { label: 'En attente',         value: stats?.pending ?? 0,      color: 'bg-blue-50  border-blue-200' },
            { label: 'Gravité élevée',     value: stats?.high_gravity ?? 0, color: 'bg-red-50   border-red-200'  },
            { label: 'Résolus',            value: stats?.resolved ?? 0,     color: 'bg-green-50 border-green-200'},
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} border rounded-xl p-3 text-center`}>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-gray-600 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-6 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <span className="font-bold text-gray-700 text-sm">FILTRER PAR :</span>

          {/* Gravité */}
          <div className="flex flex-wrap gap-1">
            {[['', 'Tous'], ['low', 'Faible'], ['medium', 'Moyen'], ['high', 'Élevé']].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setGravityFilter(val)}
                className={`flex items-center gap-1 text-xs font-medium border px-3 py-1.5 rounded-lg transition-colors ${
                  gravityFilter === val
                    ? 'bg-[#0D2B0D] text-white border-[#0D2B0D]'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Filter size={12} /> {lbl}
              </button>
            ))}
          </div>

          {/* Statut */}
          <div className="flex flex-wrap gap-1">
            {[['pending', 'En attente'], ['resolved', 'Résolu'], ['rejected', 'Rejeté'], ['', 'Tous']].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`text-xs font-medium border px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === val
                    ? 'bg-[#0D2B0D] text-white border-[#0D2B0D]'
                    : 'hover:bg-gray-50'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="relative flex-1 min-w-[160px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un nom..."
              className="w-full bg-gray-100 rounded-md p-2 pl-4 outline-none text-sm"
            />
            <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-bold text-gray-800 mb-3 uppercase text-sm">
              Signalements reçus ({incidents.length})
            </h3>

            {loading && (
              <div className="text-center text-gray-400 py-8 text-sm">Chargement…</div>
            )}
            {error && (
              <div className="text-center text-red-500 py-4 text-sm">{error}</div>
            )}
            {!loading && !error && incidents.length === 0 && statusFilter === 'pending' && (
              <div className="text-center text-green-600 py-8 font-semibold">
                Aucun signalement en attente ✅
              </div>
            )}
            {!loading && !error && incidents.length === 0 && statusFilter !== 'pending' && (
              <div className="text-center text-gray-400 py-8 text-sm">Aucun résultat.</div>
            )}

            {incidents.map((inc) => (
              <div
                key={inc.id}
                className={`bg-white border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                  selected?.id === inc.id ? 'border-[#0D2B0D]' : 'border-gray-200'
                }`}
                onClick={() => { setSelected(inc); setActionError(null); }}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={gravityBadge(inc.gravity)}>
                        {GRAVITY_LABELS[inc.gravity] ?? inc.gravity}
                      </span>
                      <span className={statusBadge(inc.status)}>
                        {STATUS_LABELS[inc.status] ?? inc.status}
                      </span>
                      {typeBadge(inc.incident_type) ? (
                        <span className={typeBadge(inc.incident_type)}>
                          💬 {TYPE_LABELS[inc.incident_type]}
                        </span>
                      ) : (
                        <h4 className="font-bold text-sm uppercase leading-tight">
                          {TYPE_LABELS[inc.incident_type] ?? inc.incident_type}
                        </h4>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Émetteur&nbsp;: <span className="font-bold">{inc.emitter_name}</span>
                      {' '}→ Cible&nbsp;: <span className="font-bold">{inc.target_name}</span>
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(inc.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelected(inc); setActionError(null); }}
                  className="self-start sm:self-center shrink-0 text-xs font-bold bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ouvrir
                </button>
              </div>
            ))}
          </div>

          {/* Détail */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 uppercase text-sm">
              Détails &amp; actions
            </h3>

            {!selected ? (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-sm">
                Sélectionnez un signalement pour voir les détails.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h4 className="font-bold text-xs uppercase truncate max-w-[80%]">
                    {TYPE_LABELS[selected.incident_type] ?? selected.incident_type}
                  </h4>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="text-xs space-y-2 leading-relaxed">
                  <div className="flex gap-2 flex-wrap">
                    <span className={gravityBadge(selected.gravity)}>
                      {GRAVITY_LABELS[selected.gravity]}
                    </span>
                    <span className={statusBadge(selected.status)}>
                      {STATUS_LABELS[selected.status]}
                    </span>
                  </div>

                  <p>
                    <span className="font-bold">Émetteur&nbsp;:</span>{' '}
                    {selected.emitter_name}{' '}
                    <span className="text-gray-400">
                      ({selected.emitter_type === 'driver' ? 'Conducteur' : 'Mécanicien'})
                    </span>
                  </p>
                  <p>
                    <span className="font-bold">Cible&nbsp;:</span> {selected.target_name}
                  </p>
                  <p>
                    <span className="font-bold">Date&nbsp;:</span> {formatDate(selected.created_at)}
                  </p>
                  {selected.incident_type === 'review' && selected.description ? (
                    <ReviewDescription raw={selected.description} />
                  ) : selected.description ? (
                    <p>
                      <span className="font-bold">Description&nbsp;:</span>{' '}
                      {selected.description}
                    </p>
                  ) : null}
                  {selected.intervention && (
                    <p>
                      <span className="font-bold">Intervention liée&nbsp;:</span>{' '}
                      <span className="font-mono text-gray-500">
                        {String(selected.intervention).slice(0, 8)}…
                      </span>
                    </p>
                  )}
                  {selected.admin_note && (
                    <p>
                      <span className="font-bold">Note admin&nbsp;:</span> {selected.admin_note}
                    </p>
                  )}

                  {actionError && (
                    <p className="text-red-500 font-semibold">{actionError}</p>
                  )}

                  {selected.status === 'pending' && (
                    <div className="flex gap-2 flex-wrap pt-2">
                      <button
                        disabled={actionLoading}
                        onClick={() => doAction(resolveIncident, selected.id)}
                        className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? '…' : 'Résoudre'}
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => doAction(suspendIncident, selected.id)}
                        className="bg-orange-100 text-orange-700 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-orange-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? '…' : 'Suspendre'}
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => doAction(rejectIncident, selected.id)}
                        className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? '…' : 'Rejeter'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signalements;
