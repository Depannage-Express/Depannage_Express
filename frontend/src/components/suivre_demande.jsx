import { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle, MapPin, Wrench, Clock, ArrowLeft } from 'lucide-react';
import { fetchBreakdownStatus } from '../lib/api';

const POLL_MS = 4_000;

const PHASE_LABELS = {
  1: 'Recherche dans un rayon de 10 km…',
  2: 'Étendue à 20 km — recherche en cours…',
  3: 'Étendue à 50 km — recherche en cours…',
  4: 'Recherche ouverte — le premier mécanicien disponible vous sera assigné',
};

function getStatusInfo(data) {
  if (!data) return { text: 'Chargement…', color: 'text-white/60' };

  if (data.status === 'pending') {
    const phase = data.search_phase || 1;
    return { text: PHASE_LABELS[phase] || PHASE_LABELS[4], color: 'text-[#608C27]' };
  }
  if (data.status === 'assigned') {
    return {
      text: 'Mécanicien trouvé — en attente de sa confirmation…',
      color: 'text-yellow-400',
    };
  }
  if (data.status === 'in_progress') {
    return { text: 'Mécanicien confirmé ! En route vers vous…', color: 'text-green-400' };
  }
  if (data.status === 'completed') {
    return { text: 'Intervention terminée', color: 'text-gray-400' };
  }
  if (data.status === 'cancelled') {
    return { text: 'Demande annulée', color: 'text-red-400' };
  }
  return { text: data.status, color: 'text-white/60' };
}

const Suivre = ({ requestId, driverToken, onBack, onMechanicAssigned }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const assignedCalledRef = useRef(false);

  useEffect(() => {
    if (!requestId) return;

    let intervalId;
    const STATUTS_FINAUX = ['paid', 'cancelled', 'reviewed', 'canceled'];

    const poll = async () => {
      try {
        const result = await fetchBreakdownStatus(requestId, driverToken);
        setData(result);
        setError('');

        if (STATUTS_FINAUX.includes(result.status)) {
          window.clearInterval(intervalId);
        }

        if (result.status === 'in_progress' && !assignedCalledRef.current && onMechanicAssigned) {
          assignedCalledRef.current = true;
          window.setTimeout(() => onMechanicAssigned(result), 1500);
        }
      } catch (e) {
        setError(e.message);
      }
    };

    poll();
    intervalId = window.setInterval(poll, POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [requestId, onMechanicAssigned]);

  const statusInfo = getStatusInfo(data);
  const mechanic = data?.assigned_mechanic;
  const isBroadcast = (data?.search_phase >= 4) || (data?.refusal_count >= 3);

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#608C27] p-4">
      <div className="bg-[#0D2B0D] rounded-3xl shadow-2xl border border-white/10 w-full max-w-md p-8 flex flex-col items-center text-center gap-6">

        {/* En-tête */}
        <div className="bg-[#608C27] p-4 rounded-full shadow-lg">
          <Wrench className="text-white w-10 h-10" />
        </div>

        <div>
          <h2 className="text-white text-xl font-extrabold uppercase tracking-wide">
            Votre demande a bien été reçue
          </h2>
          {requestId && (
            <p className="text-[#608C27] text-xs font-bold mt-2 bg-white/5 px-3 py-1.5 rounded-xl inline-block">
              Réf. #{String(requestId).slice(0, 8).toUpperCase()}
            </p>
          )}
        </div>

        {/* Statut en cours */}
        <div className="w-full bg-white/5 rounded-2xl px-5 py-4 flex items-center gap-3">
          <Loader2 className={`shrink-0 w-5 h-5 animate-spin ${
            data?.status === 'assigned' ? 'text-yellow-400' :
            data?.status === 'in_progress' ? 'text-green-400' : 'text-[#608C27]'
          }`} />
          <p className={`text-sm font-bold text-left ${statusInfo.color}`}>
            {statusInfo.text}
          </p>
        </div>

        {/* Phase indicator */}
        {data?.status === 'pending' && (
          <div className="w-full flex gap-1.5">
            {[1, 2, 3, 4].map(p => (
              <div
                key={p}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  (data.search_phase || 1) >= p ? 'bg-[#608C27]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}

        {/* Mécanicien assigné */}
        {mechanic && data?.status === 'assigned' && (
          <div className="w-full bg-white/5 border border-[#608C27]/40 rounded-2xl p-5 text-left space-y-3">
            <p className="text-[#608C27] text-xs font-bold uppercase tracking-wider">
              {isBroadcast ? 'Mécaniciens contactés — premier à accepter' : 'Mécanicien contacté'}
            </p>
            <div className="flex items-center gap-3">
              <div className="bg-[#608C27] p-2 rounded-full">
                <Wrench size={18} className="text-white" />
              </div>
              <p className="text-white font-semibold">{mechanic.user_name}</p>
            </div>
            {mechanic.city && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <MapPin size={14} />
                <span>{mechanic.city}</span>
              </div>
            )}
            {data.assignment_distance_km && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <MapPin size={14} />
                <span>{data.assignment_distance_km} km de vous</span>
              </div>
            )}
            {mechanic.specialties?.length > 0 && (
              <p className="text-white/50 text-xs">
                {mechanic.specialties.map(s => s.name).join(', ')}
              </p>
            )}
            <p className="text-yellow-400 text-xs font-bold animate-pulse flex items-center gap-1.5">
              <Clock size={12} />
              En attente de confirmation du mécanicien…
            </p>
          </div>
        )}

        {/* Mécanicien confirmé */}
        {mechanic && data?.status === 'in_progress' && (
          <div className="w-full bg-[#608C27]/20 border border-[#608C27] rounded-2xl p-5 text-left space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-[#608C27]" />
              <p className="text-[#608C27] text-xs font-bold uppercase tracking-wider">Mécanicien confirmé !</p>
            </div>
            <p className="text-white font-semibold">{mechanic.user_name}</p>
            {data.assignment_distance_km && (
              <p className="text-white/60 text-sm">{data.assignment_distance_km} km de vous</p>
            )}
            <p className="text-[#608C27] text-xs animate-pulse">Redirection vers la facturation…</p>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-white/40 text-xs hover:text-white/70 transition-colors mt-2"
          >
            <ArrowLeft size={14} /> Retour à l'accueil
          </button>
        )}
      </div>
    </div>
  );
};

export default Suivre;
