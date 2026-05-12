import { Filter, Search,ChevronUp } from 'lucide-react';

const Signalements = () => {
  const signalements = [
    { id: 12, titre: "ABUS DE LANGAGE", gravite: "Élevé", emetteur: "Moussa A.", cible: "Sara T.", date: "11/05/2026, 14:15", color: "text-red-600" },
    { id: 11, titre: "RETARD IMPORTANT", gravite: "Moyen", emetteur: "Jean K.", cible: "Sara T.", date: "11/05/2026, 11:30", color: "text-yellow-600" },
    { id: 10, titre: "PROBLÈME DE PRIX", gravite: "Faible", emetteur: "Sara T.", cible: "Jean K.", date: "11/05/2026, 09:45", color: "text-gray-500" },
  ];

  return (
        <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-[#0D2B0D] text-white p-4 flex justify-center">
            <h2 className="text-3xl font-bold mb-6  flex ">Gestion des Incidents </h2>
            </div>

            <div className="p-6">
          
          {/* Barre de filtres */}
            <div className="flex flex-wrap items-center gap-6 mb-8 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                <span className="font-bold text-gray-700">FILTRER PAR :</span>
                <button className="flex items-center gap-1 font-medium"><Filter size={16}/> Gravité</button>
                <button className="flex items-center gap-1 font-medium"><Filter size={16}/> Statut</button>
                <button className="flex items-center gap-1 font-medium"><Filter size={16}/> Émetteur</button>
                <div className="flex-1 relative">
                    <input type="text" placeholder="[Rechercher un incident #...]" className="w-full bg-gray-100 rounded-md p-2 pl-4 outline-none" />
                    <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* File d'attente */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-gray-800 mb-4 uppercase">Signalements reçus (File d'attente)</h3>
                    {signalements.map((s) => (
                    <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                            <span className={`text-xl ${s.color}`}>★</span>
                            <div>
                                <h4 className="font-bold text-sm uppercase">ID #{s.id} | {s.titre} <span className="text-xs font-normal text-gray-500">({s.gravite})</span></h4>
                                <p className="text-[11px] text-gray-600 mt-1">
                                    Émetteur: <span className="font-bold">{s.emetteur}</span> | Cible: <span className="font-bold">{s.cible}</span> | Date: {s.date} | Action: <span className="text-gray-400 cursor-pointer">[Ouvrir]</span>
                                </p>
                            </div>
                        </div>
                        <button className="text-xs font-bold bg-white border border-gray-200 px-3 py-1 rounded">Action: [Ouvrir]</button>
                    </div>
                    ))}
                </div>

                {/* Détails à droite */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 mb-4 uppercase">Historique détaillé & rapports</h3>
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h4 className="font-bold text-xs uppercase">Détails signalement #12</h4>
                            <ChevronUp size={16} />
                        </div>
                        <div className="text-[11px] space-y-4 leading-relaxed">
                            <p><span className="font-bold">Description:</span> Le conducteur Moussa A. signale que la mécanicienne Sara T. a utilisé un langage inapproprié...</p>
                            <p><span className="font-bold">Photos:</span> <span className="text-blue-500 cursor-pointer text-[10px]">[Photo1.jpg] [Photo2.jpg]</span></p>
                            <p><span className="font-bold">Actions:</span> [Suspendre Cible] [Avertir Cible] [Rejeter]</p>
                        </div>
                    </div>
              
                    <button className="w-full py-3 border border-gray-300 rounded-full text-xs font-bold hover:bg-gray-50 uppercase shadow-sm">[Rapport Mensuel PDF]</button>
                    <button className="w-full py-3 border border-gray-300 rounded-full text-xs font-bold hover:bg-gray-50 uppercase shadow-sm">[Rapport Hebdomadaire PDF]</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Signalements;