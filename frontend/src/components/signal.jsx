import { Filter, Search, ChevronUp } from 'lucide-react';

const Signalements = ({ onBack }) => {
  const signalements = [
    { id: 12, titre: "ABUS DE LANGAGE", gravite: "Élevé", emetteur: "Moussa A.", cible: "Sara T.", date: "11/05/2026, 14:15", color: "text-red-600" },
    { id: 11, titre: "RETARD IMPORTANT", gravite: "Moyen", emetteur: "Jean K.", cible: "Sara T.", date: "11/05/2026, 11:30", color: "text-yellow-600" },
    { id: 10, titre: "PROBLÈME DE PRIX", gravite: "Faible", emetteur: "Sara T.", cible: "Jean K.", date: "11/05/2026, 09:45", color: "text-gray-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#0D2B0D] text-white p-4 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-white text-sm font-bold hover:text-[#608C27] transition-colors shrink-0">
            ← Retour
          </button>
        )}
        <h2 className="text-xl sm:text-3xl font-bold flex-1 text-center">Gestion des Incidents</h2>
      </div>

      <div className="p-4 sm:p-6">
        {/* Barre de filtres */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-6 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <span className="font-bold text-gray-700 text-sm">FILTRER PAR :</span>
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-1 font-medium text-sm border px-3 py-1.5 rounded-lg">
              <Filter size={14} /> Gravité
            </button>
            <button className="flex items-center gap-1 font-medium text-sm border px-3 py-1.5 rounded-lg">
              <Filter size={14} /> Statut
            </button>
            <button className="flex items-center gap-1 font-medium text-sm border px-3 py-1.5 rounded-lg">
              <Filter size={14} /> Émetteur
            </button>
          </div>
          <div className="relative flex-1 min-w-[160px]">
            <input
              type="text"
              placeholder="Rechercher un incident #..."
              className="w-full bg-gray-100 rounded-md p-2 pl-4 outline-none text-sm"
            />
            <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File d'attente */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-bold text-gray-800 mb-3 uppercase text-sm">
              Signalements reçus (File d'attente)
            </h3>
            {signalements.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className={`text-xl shrink-0 ${s.color}`}>★</span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm uppercase leading-tight">
                      ID #{s.id} | {s.titre}{' '}
                      <span className="text-xs font-normal text-gray-500 normal-case">({s.gravite})</span>
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Émetteur: <span className="font-bold">{s.emetteur}</span> |{' '}
                      Cible: <span className="font-bold">{s.cible}</span> |{' '}
                      {s.date}
                    </p>
                  </div>
                </div>
                <button className="self-start sm:self-center shrink-0 text-xs font-bold bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Ouvrir
                </button>
              </div>
            ))}
          </div>

          {/* Détails à droite */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 uppercase text-sm">
              Historique détaillé & rapports
            </h3>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h4 className="font-bold text-xs uppercase">Détails signalement #12</h4>
                <ChevronUp size={16} />
              </div>
              <div className="text-xs space-y-3 leading-relaxed">
                <p>
                  <span className="font-bold">Description:</span> Le conducteur Moussa A. signale que la mécanicienne Sara T. a utilisé un langage inapproprié...
                </p>
                <p>
                  <span className="font-bold">Photos :</span>{' '}
                  <span className="text-blue-500 cursor-pointer">Photo1.jpg · Photo2.jpg</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button className="bg-orange-100 text-orange-700 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-orange-200 transition-colors">
                    Suspendre
                  </button>
                  <button className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-yellow-200 transition-colors">
                    Avertir
                  </button>
                  <button className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 transition-colors">
                    Rejeter
                  </button>
                </div>
              </div>
            </div>

            <button className="w-full py-3 border border-gray-300 rounded-full text-xs font-bold hover:bg-gray-50 uppercase shadow-sm transition-colors">
              Rapport mensuel PDF
            </button>
            <button className="w-full py-3 border border-gray-300 rounded-full text-xs font-bold hover:bg-gray-50 uppercase shadow-sm transition-colors">
              Rapport hebdomadaire PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signalements;
