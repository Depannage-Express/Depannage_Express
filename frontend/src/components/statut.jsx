import { useEffect, useState } from 'react';
import { fetchMechanicRequests } from '../lib/api';

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

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMechanicRequests();
        setMissions(data.results || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
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
              <p className="text-black font-bold text-lg">
                Localisation : <span className="font-medium">{mission.address_description || 'GPS'}</span>
              </p>
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
