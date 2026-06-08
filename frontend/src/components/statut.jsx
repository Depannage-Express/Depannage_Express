import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { fetchMechanicRequests } from '../lib/api';
import GeoLabel from './geo_label';

const POLL_INTERVAL_MS = 4_000;

const STATUS_LABELS = {
  pending: 'En attente',
  assigned: 'Assignée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const StatutMissions = ({ onBack }) => {
  const [missions, setMissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await fetchMechanicRequests();
      setMissions(data.results || []);
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

  return (
    <div className="min-h-screen bg-[#0D2B0D] p-4 md:p-8 flex flex-col items-center rounded-2xl">

      <div className="p-6 flex justify-between w-full max-w-4xl">
        {onBack && (
          <button onClick={onBack} className="text-white font-bold hover:text-[#608C27] transition-colors">
            ← Retour
          </button>
        )}
        <h2 className="text-white text-xl font-bold uppercase tracking-widest">
          Statut des missions
        </h2>
      </div>

      {isLoading ? (
        <p className="text-white/70 mt-10">Chargement...</p>
      ) : null}

      {error ? (
        <p className="text-red-400 mt-6">{error}</p>
      ) : null}

      {!isLoading && !error && missions.length === 0 ? (
        <p className="text-white/70 mt-10">Aucune mission pour le moment.</p>
      ) : null}

      <div className="w-full max-w-4xl space-y-4">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="bg-white rounded-3xl p-6 shadow-lg flex flex-col md:flex-row justify-between gap-4"
          >
            <div className="space-y-2">
              <p className="text-black font-bold text-lg">
                Description : <span className="font-medium">{mission.breakdown_description || mission.breakdown_type || '—'}</span>
              </p>
              <p className="text-black font-bold text-lg">
                Client : <span className="font-medium">{mission.driver_name}</span>
              </p>
              <p className="text-black font-bold text-lg flex items-center gap-1">
                <MapPin size={18} className="text-[#608C27] flex-shrink-0" />
                <span className="font-bold">Localisation :</span>&nbsp;
                <span className="font-medium">
                  <GeoLabel
                    lat={mission.latitude}
                    lon={mission.longitude}
                    fallback={mission.address_description}
                  />
                </span>
              </p>
              {mission.address_description && (mission.latitude || mission.longitude) && (
                <p className="text-gray-500 text-sm pl-6">{mission.address_description}</p>
              )}
            </div>

            <div className="space-y-2 md:text-right">
              <p className="text-black font-bold text-lg">
                Date : <span className="font-medium">{new Date(mission.created_at).toLocaleString('fr-FR')}</span>
              </p>
              {mission.assignment_distance_km ? (
                <p className="text-black font-bold text-lg">
                  Distance : <span className="font-medium">{mission.assignment_distance_km} km</span>
                </p>
              ) : null}
              <p className="text-black font-bold text-lg">
                Statut :{' '}
                <span className={`font-medium ${mission.status === 'completed' ? 'text-green-600' : mission.status === 'cancelled' ? 'text-red-600' : 'text-orange-600'}`}>
                  {STATUS_LABELS[mission.status] || mission.status}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatutMissions;
