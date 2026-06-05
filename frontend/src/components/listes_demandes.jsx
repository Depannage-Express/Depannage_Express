import { useEffect, useState } from 'react';
import { MapPin, Clock, Wrench, Search, X } from 'lucide-react';
import { fetchMechanicRequests } from '../lib/api';

const ListesCommandes = ({ onBack }) => {
  const [allCommands, setAllCommands] = useState([]);
  const [openCommandId, setOpenCommandId] = useState(-1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await fetchMechanicRequests();
        setAllCommands(data.results || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadRequests();
  }, []);

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

        {/* Compteur si filtré */}
        {q && filtered.length > 0 && (
          <p className="text-sm text-gray-500 text-center mb-4">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour "{query}"
          </p>
        )}

        <div className="space-y-6">
          {filtered.map((command) => (
            <div key={command.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">

              <div
                className="p-6 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                onClick={() => toggleCommand(command.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${openCommandId === command.id ? 'bg-[#608C27] text-white' : 'bg-slate-100 text-[#0D2B0D]'}`}>
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

              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openCommandId === command.id ? 'max-h-[800px] border-t border-[#608C27]' : 'max-h-0'}`}>
                <div className="bg-[#0D2B0D] p-8 space-y-6 text-white rounded-b-2xl">
                  <DetailItem title="Client" value={command.driver_name} icon={<Wrench size={20} />} />
                  <DetailItem title="Description détaillée" value={command.breakdown_description} icon={<Wrench size={20} />} />
                  <DetailItem title="Localisation" value={command.address_description || 'Position GPS reçue'} icon={<MapPin size={20} />} />
                  <DetailItem title="Distance estimée" value={command.assignment_distance_km ? `${command.assignment_distance_km} km` : 'Non calculée'} icon={<MapPin size={20} />} />
                </div>
              </div>

            </div>
          ))}
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
