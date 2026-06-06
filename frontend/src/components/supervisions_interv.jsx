import { Search, ChevronDown, ChevronUp, Star } from 'lucide-react';

const SupervisionInterventions = ({ onBack }) => {
  const interventions = [
    { id: 45, titre: "Panne de moteur (Conducteur)", client: "Moussa A.", meca: "Sara T.", montant: "150.000", heure: "11/05/2026, 12:15", statut: "Intervenant affecté", sIcon: "✅" },
    { id: 45, titre: "Panne de moteur (Conducteur)", client: "Moussa A.", montant: "Montant/Crédit FCFA", heure: "11/05/2026, 12:15", statut: "En route", sIcon: "🟡" },
    { id: 47, titre: "Panne de moteur (Conducteur)", client: "Moussa A.", montant: "Montant/Crédit FCFA", heure: "11/05/2026, 12:15", statut: "Intervention lancée", sIcon: "🔴" },
  ];

  return (
    <div className="min-h-screen bg-gray-200 font-sans">
      <div className="bg-[#0D2B0D] rounded-t-[1.5rem] p-4 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-white text-sm font-bold hover:text-[#608C27] transition-colors shrink-0">
            ← Retour
          </button>
        )}
        <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight italic text-center flex-1">
          Supervision des Interventions
        </h2>
      </div>

      <div className="bg-white rounded-b-[1.5rem] p-4 sm:p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* COLONNE GAUCHE : FILTRAGE */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100">
              <h3 className="font-black uppercase text-xs mb-4">Filtrage & Recherche</h3>
              <div className="flex gap-2 mb-4 flex-wrap">
                <button className="flex-1 min-w-[70px] border p-2 rounded-xl text-xs font-bold flex justify-between items-center bg-gray-50">
                  Type <ChevronDown size={14} />
                </button>
                <button className="flex-1 min-w-[70px] border p-2 rounded-xl text-xs font-bold bg-gray-50">Gravité</button>
                <button className="flex-1 min-w-[70px] border p-2 rounded-xl text-xs font-bold bg-gray-50">Statut</button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher une intervention"
                  className="w-full bg-gray-50 border rounded-xl p-2 text-xs outline-none pr-7"
                />
                <Search className="absolute right-2 top-2.5 text-gray-400" size={14} />
              </div>
            </div>
          </div>

          {/* COLONNE CENTRE : FILE D'ATTENTE */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-black text-xs text-gray-800 uppercase px-1 tracking-widest">
              Interventions Actives — File d'attente
            </h3>
            {interventions.map((item, idx) => (
              <div key={idx} className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col gap-3">
                {/* Info intervention */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="flex gap-3">
                    <Star className="text-green-500 fill-current shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-black text-xs sm:text-sm uppercase italic leading-tight">
                        ID #{item.id} | {item.titre}
                      </h4>
                      <div className="text-xs mt-2 space-y-1 text-gray-700">
                        <p>👤 <span className="font-bold text-blue-600">Client:</span> {item.client}</p>
                        {item.meca && (
                          <p>👷 <span className="font-bold text-yellow-600">Mécanicien:</span> {item.meca}{' '}
                            <span className="font-black text-black ml-1">{item.montant}</span>
                          </p>
                        )}
                        {!item.meca && <p className="font-black text-black uppercase text-xs">{item.montant}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="text-xs font-bold">{item.statut} {item.sIcon}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase italic">
                      {item.heure}
                    </p>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex flex-wrap justify-end gap-2">
                  <button className="bg-[#1a301a] text-white text-xs px-4 py-2 rounded-xl font-bold uppercase shadow-sm hover:scale-105 transition-transform">
                    Contrôler
                  </button>
                  <button className="bg-[#608C27] text-white text-xs px-4 py-2 rounded-xl font-bold uppercase shadow-sm hover:scale-105 transition-transform">
                    Valider
                  </button>
                  <button className="bg-black text-white text-xs px-4 py-2 rounded-xl font-bold uppercase shadow-sm hover:scale-105 transition-transform">
                    Signaler
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* COLONNE DROITE : HISTORIQUE */}
          <div className="space-y-4">
            <h3 className="font-black text-xs text-gray-800 uppercase tracking-widest">
              Historique & Rapports
            </h3>
            <div className="bg-white p-4 rounded-[2rem] shadow-lg border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-black text-xs uppercase">Détails Intervention</p>
                <p className="font-black text-xs">#45</p>
              </div>
              <ChevronUp size={20} />
            </div>
            {[44, 43].map((num) => (
              <div key={num} className="bg-white p-4 rounded-[1.8rem] shadow-sm flex justify-between items-center opacity-80 border border-gray-100">
                <p className="font-black text-xs">#{num}</p>
                <ChevronDown size={18} className="text-gray-400" />
              </div>
            ))}
            <div className="space-y-3 pt-4">
              <button className="w-full text-left text-xs font-bold p-1 hover:underline text-gray-600">
                Rapport hebdomadaire PDF
              </button>
              <button className="w-full text-left text-xs font-bold p-1 hover:underline text-gray-600">
                Rapport mensuel PDF
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SupervisionInterventions;
