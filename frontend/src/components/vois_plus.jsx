import { useEffect, useState } from 'react';
import { Star, User } from 'lucide-react';
import { fetchPublicMechanics } from '../lib/api';

const InfoMecanicien = ({ onBack }) => {
  const [mechanics, setMechanics] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPublicMechanics();
        const list = Array.isArray(data) ? data : (data.results || []);
        setMechanics(list);
        if (list.length > 0) setSelected(list[0]);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <p className="text-[#0D2B0D] font-bold text-lg">Chargement des mécaniciens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <p className="text-red-700 font-bold">{error}</p>
      </div>
    );
  }

  if (mechanics.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <p className="text-[#0D2B0D] font-semibold">Aucun mécanicien disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-[2rem] shadow-xl overflow-hidden border-8 border-[#e8e8e8]">
        <div className="bg-[#0D2B0D] p-6 flex items-center justify-between">
          <h2 className="text-white text-2xl font-black uppercase italic">Nos Mécaniciens</h2>
          {onBack ? (
            <button onClick={onBack} className="text-white hover:text-[#608C27] font-bold text-sm">
              ← Retour
            </button>
          ) : null}
        </div>

        <div className="p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Liste de sélection */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {mechanics.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selected?.id === m.id ? 'border-[#608C27] bg-[#608C27]/10' : 'border-gray-200 hover:border-gray-400 bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {m.profile_photo ? (
                      <img src={m.profile_photo} alt={m.user_name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#0D2B0D]">{m.user_name}</p>
                    <p className="text-xs text-gray-500">{m.city || 'Localisation non renseignée'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-semibold">{m.average_rating ? Number(m.average_rating).toFixed(1) : '—'}</span>
                      <span className="text-xs text-gray-400">({m.total_reviews})</span>
                    </div>
                  </div>
                  {m.is_available ? (
                    <div className="ml-auto w-3 h-3 rounded-full bg-green-500 shrink-0" title="Disponible" />
                  ) : (
                    <div className="ml-auto w-3 h-3 rounded-full bg-gray-300 shrink-0" title="Indisponible" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Détail du mécanicien sélectionné */}
          {selected ? (
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                    {selected.profile_photo ? (
                      <img src={selected.profile_photo} alt={selected.user_name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-gray-400" />
                    )}
                  </div>
                  {selected.is_available ? (
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
                  ) : null}
                </div>
                <div>
                  <h3 className="font-black text-xl text-[#0D2B0D]">{selected.user_name}</h3>
                  <p className="text-gray-500 text-sm">{selected.city}{selected.country ? `, ${selected.country}` : ''}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">{selected.average_rating ? Number(selected.average_rating).toFixed(1) : '—'}</span>
                    <span className="text-gray-400 text-sm">({selected.total_reviews} avis)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Spécialité" value={selected.specialties?.map(s => s.name).join(', ') || '—'} />
                <InfoRow label="Expérience" value={selected.years_experience ? `${selected.years_experience} ans` : '—'} />
                <InfoRow label="Interventions" value={selected.total_interventions ?? '—'} />
                <InfoRow label="Statut" value={selected.is_available ? 'Disponible' : 'Indisponible'} />
              </div>

              {selected.bio ? (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <p className="text-sm font-bold text-[#0D2B0D] mb-2 uppercase">Bio</p>
                  <p className="text-gray-700 text-sm">{selected.bio}</p>
                </div>
              ) : null}

              {selected.is_premium ? (
                <div className="bg-[#608C27]/10 border border-[#608C27] rounded-2xl p-4 text-center">
                  <p className="text-[#608C27] font-bold">⭐ Mécanicien Premium — Contact direct disponible</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-xl">
    <label className="font-black text-sm w-32 uppercase text-[#0D2B0D] shrink-0">{label}:</label>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
);

export default InfoMecanicien;
