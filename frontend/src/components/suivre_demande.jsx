import { useEffect, useRef, useState } from 'react';
import { fetchBreakdownStatus } from '../lib/api';

const STATUS_LABELS = {
  pending: { text: 'En attente d\'un mécanicien...', color: 'text-orange-600' },
  assigned: { text: 'Mécanicien trouvé !', color: 'text-green-600' },
  in_progress: { text: 'Intervention en cours', color: 'text-blue-600' },
  completed: { text: 'Intervention terminée', color: 'text-gray-600' },
  cancelled: { text: 'Demande annulée', color: 'text-red-600' },
};

const NO_MECHANIC_TIMEOUT_MS = 25000;

const Suivre = ({ requestId, onBack, onMechanicAssigned }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [noMechanicAvailable, setNoMechanicAvailable] = useState(false);
  const noMechanicTimerRef = useRef(null);
  const assignedCalledRef = useRef(false);

  useEffect(() => {
    if (!requestId) return;

    const poll = async () => {
      try {
        const result = await fetchBreakdownStatus(requestId);
        setData(result);
        setError('');

        if (result.status !== 'pending') {
          clearTimeout(noMechanicTimerRef.current);
        }

        if (result.status === 'assigned' && !assignedCalledRef.current && onMechanicAssigned) {
          assignedCalledRef.current = true;
          window.setTimeout(() => onMechanicAssigned(result), 1500);
        }
      } catch (e) {
        setError(e.message);
      }
    };

    poll();
    const interval = window.setInterval(poll, 10000);

    noMechanicTimerRef.current = window.setTimeout(() => {
      setNoMechanicAvailable(true);
    }, NO_MECHANIC_TIMEOUT_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(noMechanicTimerRef.current);
    };
  }, [requestId, onMechanicAssigned]);

  const statusInfo = data ? (STATUS_LABELS[data.status] || { text: data.status, color: 'text-gray-600' }) : null;

  if (noMechanicAvailable && data?.status === 'pending') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-10 rounded-xl shadow-2xl flex flex-col items-center max-w-md w-full text-center">
          <p className="text-4xl mb-4">😔</p>
          <p className="font-bold text-xl text-[#0D2B0D] mb-2">Aucun mécanicien disponible</p>
          <p className="text-gray-500 text-sm mb-6">
            Aucun mécanicien n'est disponible dans votre zone pour le moment.
            Veuillez réessayer ultérieurement.
          </p>
          {onBack ? (
            <button
              onClick={onBack}
              className="bg-[#608C27] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0D2B0D] transition-colors"
            >
              Retour à l'accueil
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-10 rounded-xl shadow-2xl flex flex-col items-center max-w-md w-full">

        <p className="text-center font-medium text-lg mb-4">Votre demande a été bien reçue</p>

        {requestId ? (
          <p className="text-center text-xs text-gray-500 mb-4">Référence : {requestId}</p>
        ) : null}

        {error ? (
          <p className="text-center text-red-600 text-sm mb-4">{error}</p>
        ) : null}

        {statusInfo ? (
          <p className={`text-center font-bold text-xl mb-6 ${statusInfo.color}`}>
            {statusInfo.text}
          </p>
        ) : (
          <p className="text-center text-gray-500 mb-6">Chargement du statut...</p>
        )}

        {data?.assigned_mechanic ? (
          <div className="w-full bg-[#0D2B0D] text-white rounded-xl p-6 space-y-2">
            <p className="font-bold text-[#608C27] uppercase text-sm mb-3">Mécanicien assigné</p>
            <p className="font-semibold">{data.assigned_mechanic.user_name}</p>
            {data.assigned_mechanic.city ? (
              <p className="text-sm opacity-80">Ville : {data.assigned_mechanic.city}</p>
            ) : null}
            {data.assignment_distance_km ? (
              <p className="text-sm opacity-80">Distance : {data.assignment_distance_km} km</p>
            ) : null}
            {data.assigned_mechanic.specialties?.length > 0 ? (
              <p className="text-sm opacity-80">
                Spécialité : {data.assigned_mechanic.specialties.map(s => s.name).join(', ')}
              </p>
            ) : null}
            <p className="text-xs text-[#608C27] mt-3 animate-pulse">Redirection vers la facturation...</p>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 mt-4">
            Recherche d'un mécanicien proche en cours. Actualisé toutes les 10 secondes.
          </p>
        )}
      </div>
    </div>
  );
};

export default Suivre;
