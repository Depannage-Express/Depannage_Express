import { useEffect, useRef, useState } from 'react';
import { MapPin, Clock, Wrench, Search, X, CheckCircle, XCircle, Phone } from 'lucide-react';
import { fetchMechanicRequests, fetchMyInterventions, acceptIntervention, refuseIntervention } from '../lib/api';

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
        map[iv.breakdown_request] = iv;
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
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow container mx-auto px-4 py-10 max-w-5xl">

        <div className="flex items-center justify-between mb-8">
          {onBack ? (
            <button
              onClick={onBack}
              className="bg-[#0D2B0D] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#608C27] transition-colors"
            >
              ← Retour
            </button>
          ) : <span />}
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#608C27] text-center uppercase tracking-wide flex-1 px-4">
            Mes Demandes
          </h1>
          {onBack ? <span className="w-24" /> : null}
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-8 max-w-md mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par client, type de panne…"
            className="w-full border-2 border-[#0D2B0D] rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27]"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D2B0D]" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {isLoading && (
          <div className="text-center text-slate-600 font-semibold">Chargement des demandes…</div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-center text-red-700">{error}</div>
        )}

        {actionError && (
          <div className="mb-4 rounded-2xl bg-red-50 p-3 text-center text-red-700 text-sm">{actionError}</div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-600 font-semibold text-lg mb-2">
              {q ? `Aucun résultat pour "${query}"` : 'Aucune demande assignée pour le moment.'}
            </p>
            {q && (
              <button
                onClick={() => setQuery('')}
                className="mt-4 text-[#608C27] font-bold underline text-sm"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        )}

        {q && filtered.length > 0 && (
          <p className="text-sm text-gray-500 text-center mb-4">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour "{query}"
          </p>
        )}

        <div className="space-y-6">
          {filtered.map((command) => {
            const intervention = interventionMap[command.id];
            const isPending = intervention?.status === 'pending_acceptance';

            return (
              <div key={command.id} className={`bg-white rounded-2xl shadow-lg border overflow-hidden ${isPending ? 'border-[#608C27] border-2' : 'border-slate-200'}`}>

                {isPending && (
                  <div className="bg-[#608C27] px-6 py-2 text-white text-xs font-bold uppercase tracking-wider text-center">
                    Nouvelle demande — en attente de votre réponse
                  </div>
                )}

                <div
                  className="p-6 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  onClick={() => toggleCommand(command.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${openCommandId === command.id ? 'bg-[#608C27] text-white' : isPending ? 'bg-[#608C27]/20 text-[#608C27]' : 'bg-slate-100 text-[#0D2B0D]'}`}>
                      <Wrench size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-900 leading-tight">
                        {command.breakdown_type || 'Demande de dépannage'}
                      </p>
                      <p className="text-sm text-slate-500 font-medium">{command.driver_name}</p>
                      <p className="text-sm text-slate-600 flex items-center gap-1">
                        <Clock size={14} /> {new Date(command.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-slate-400 text-lg">
                    {openCommandId === command.id ? '▲' : '▼'}
                  </div>
                </div>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openCommandId === command.id ? 'max-h-[900px] border-t border-[#608C27]' : 'max-h-0'}`}>
                  <div className="bg-[#0D2B0D] p-8 space-y-6 text-white rounded-b-2xl">
                    <DetailItem title="Client" value={command.driver_name} icon={<Wrench size={20} />} />
                    <DetailItem title="Téléphone" value={command.driver_phone} icon={<Phone size={20} />} />
                    <DetailItem title="Description détaillée" value={command.breakdown_description} icon={<Wrench size={20} />} />
                    <DetailItem title="Localisation" value={command.address_description || 'Position GPS reçue'} icon={<MapPin size={20} />} />
                    <DetailItem title="Distance estimée" value={command.assignment_distance_km ? `${command.assignment_distance_km} km` : 'Non calculée'} icon={<MapPin size={20} />} />

                    {isPending && (
                      <div className="pt-4 border-t border-white/20 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleAccept(intervention.id)}
                          disabled={!!actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-[#608C27] hover:bg-[#4a6e1e] text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-60"
                        >
                          <CheckCircle size={20} />
                          {actionLoading === intervention.id + '_accept' ? 'Acceptation…' : 'Accepter la mission'}
                        </button>
                        <button
                          onClick={() => handleRefuse(intervention.id)}
                          disabled={!!actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-60"
                        >
                          <XCircle size={20} />
                          {actionLoading === intervention.id + '_refuse' ? 'Refus…' : 'Refuser'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

const DetailItem = ({ title, value, icon }) => (
  <div className="flex items-start gap-3">
    <div className="text-[#608C27] shrink-0">{icon}</div>
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-[#608C27]">{title}</p>
      <p className="text-base text-white">{value || '—'}</p>
    </div>
  </div>
);

export default ListesCommandes;
