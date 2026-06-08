import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Wrench, ChevronRight } from 'lucide-react';
import { fetchMechanicRequests } from '../lib/api';

const POLL_INTERVAL_MS = 4_000;

const STATUS_LABELS = {
  pending: 'En attente',
  assigned: 'Assignée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const Notifications = ({ onBack }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const intervalRef = useRef(null);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await fetchMechanicRequests();
      setRequests(data.results || []);
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  const isNew = (req) => req.status === 'assigned' || req.status === 'pending';

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-[#0D2B0D]">

      <div className="bg-[#0D2B0D] p-6 flex items-center justify-between">
        <button onClick={onBack} className="text-white hover:text-[#608C27] flex items-center gap-2 font-bold">
          <ArrowLeft size={24} /> Retour
        </button>
        <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-3">
          <Wrench className="text-[#608C27]" /> Notifications
        </h2>
        <div className="w-10" />
      </div>

      <div className="p-4 md:p-8 space-y-4 bg-gray-50">

        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Chargement...</p>
        ) : null}

        {error ? (
          <p className="text-center text-red-600 py-8">{error}</p>
        ) : null}

        {!isLoading && !error && requests.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucune demande reçue pour le moment.</p>
        ) : null}

        {requests.map((req) => (
          <div key={req.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            <div
              onClick={() => setActiveId(activeId === req.id ? null : req.id)}
              className={`p-5 flex items-center gap-4 cursor-pointer transition-all border-l-8 ${isNew(req) ? 'border-[#608C27]' : 'border-gray-300'}`}
            >
              <div className={`p-3 rounded-full shrink-0 ${isNew(req) ? 'bg-[#608C27]/10 text-[#608C27]' : 'bg-gray-100 text-gray-400'}`}>
                <Wrench size={24} />
              </div>

              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Description</p>
                  <p className="font-bold text-[#0D2B0D]">{req.breakdown_type || req.breakdown_description}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase">Date</p>
                  <p className="text-sm font-semibold text-gray-600">{new Date(req.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Client</p>
                  <p className="text-sm font-medium text-gray-700">{req.driver_name}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase">Distance</p>
                  <p className="text-sm font-medium text-gray-700">
                    {req.assignment_distance_km ? `${req.assignment_distance_km} km` : '—'}
                  </p>
                </div>
              </div>

              {isNew(req) ? (
                <span className="bg-[#0D2B0D] text-white text-[10px] px-2 py-1 rounded-full font-bold shrink-0">
                  {STATUS_LABELS[req.status] || 'NOUVEAU'}
                </span>
              ) : (
                <span className="text-gray-400 text-xs shrink-0">{STATUS_LABELS[req.status] || req.status}</span>
              )}

              <ChevronRight className={`text-gray-300 transition-transform shrink-0 ${activeId === req.id ? 'rotate-90' : ''}`} />
            </div>

            {activeId === req.id ? (
              <div className="bg-[#0D2B0D] p-6 border-t border-[#608C27] text-white space-y-2">
                <p className="text-sm"><span className="font-bold text-[#608C27]">Téléphone :</span> {req.driver_phone}</p>
                <p className="text-sm"><span className="font-bold text-[#608C27]">Description :</span> {req.breakdown_description}</p>
                <p className="text-sm"><span className="font-bold text-[#608C27]">Localisation :</span> {req.address_description || 'GPS transmis'}</p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
