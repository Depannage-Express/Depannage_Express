import { Search, ChevronDown, ChevronUp, Star } from 'lucide-react';

const SupervisionInterventions = () => {
  const interventions = [
    { id: 45, titre: "Panne de moteur (Conducteur)", client: "Moussa A.", meca: "Sara T.", montant: "150.000", heure: "11/05/2026, 12:15", statut: "Intervenant affecté", sIcon: "✅" },
    { id: 45, titre: "Panne de moteur (Conducteur)", client: "Moussa A.", montant: "Montant/Crédit FCFA", heure: "11/05/2026, 12:15", statut: "En route", sIcon: "🟡" },
    { id: 47, titre: "Panne de moteur (Conducteur)", client: "Moussa A.", montant: "Montant/Crédit FCFA", heure: "11/05/2026, 12:15", statut: "Intervention lancée", sIcon: "🔴" },
  ];

  return (
    <div className="min-h-screen bg-gray-200 relative font-sans">
     

     
        
        {/* ENTETE (Respectant ton style souligné) */}
        <div className="flex justify-center items-center bg-[#0D2B0D] rounded-t-[1.5rem] p-6 border-b border-gray-200">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Supervision des Interventions</h2>
        </div>

        <div className="bg-white rounded-b-[1.5rem] p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* COLONNE GAUCHE : FILTRAGE & CARTE */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 h-[300px]">
                <h3 className="font-black uppercase text-xs mb-4">Filtrage & Recherche</h3>
                <div className="flex gap-2 mb-4">
                  <button className="flex-1 border p-2 rounded-xl text-[10px] font-bold flex justify-between items-center bg-gray-50">Type <ChevronDown size={14}/></button>
                  <button className="flex-1 border p-2 rounded-xl text-[10px] font-bold bg-gray-50">Gravité</button>
                  <button className="flex-1 border p-2 rounded-xl text-[10px] font-bold bg-gray-50">Statut</button>
                </div>
                <div className="relative">
                  <input type="text" placeholder="Rechercher une intervention" className="w-full bg-gray-50 border rounded-xl p-2 text-[10px] outline-none" />
                  <Search className="absolute right-1 top-2 text-gray-400" size={15} />
                </div>
              </div>

              
            </div>

            {/* COLONNE CENTRE : FILE D'ATTENTE */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-black text-xs text-gray-800 uppercase px-2 tracking-widest">Interventions Actives - File d'attente</h3>
              {interventions.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-50 min-h-[160px] flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <Star className="text-green-500 fill-current" size={24} />
                      <div>
                        <h4 className="font-black text-[13px] uppercase italic">ID #{item.id} | {item.titre}</h4>
                        <div className="text-[12px] mt-2 space-y-1 text-gray-700">
                          <p>👤 <span className="font-bold text-blue-600">Client:</span> {item.client}</p>
                          {item.meca && <p>👷 <span className="font-bold text-yellow-600">Mécanicien:</span> {item.meca} <span className="font-black text-black ml-1 text-sm">{item.montant}</span></p>}
                          {!item.meca && <p className="font-black text-black text-sm uppercase">{item.montant}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <p className="text-[10px] font-bold">{item.statut} {item.sIcon}</p>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase italic">Heure: {item.heure}</p>
                    </div>
                  </div>

                  {/* Boutons alignés en bas à droite */}
                  <div className="flex justify-end gap-2 mt-4">
                    <button className="bg-[#1a301a] text-white text-[10px] px-5 py-2 rounded-xl font-bold uppercase tracking-tight shadow-sm hover:scale-105 transition-transform">[Contrôler]</button>
                    <button className="bg-[#608C27] text-white text-[10px] px-5 py-2 rounded-xl font-bold uppercase tracking-tight shadow-sm hover:scale-105 transition-transform">Valider</button>
                    <button className="bg-black text-white text-[10px] px-5 py-2 rounded-xl font-bold uppercase tracking-tight shadow-sm hover:scale-105 transition-transform">[Signaler]</button>
                  </div>
                </div>
              ))}
            </div>

            {/* COLONNE DROITE : HISTORIQUE */}
            <div className="space-y-4">
              <h3 className="font-black text-xs text-gray-800 uppercase tracking-widest">Historique détaillé & Rapports</h3>
              <div className="bg-white p-5 rounded-[2rem] shadow-lg border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="font-black text-[11px] uppercase">Détails Intervention</p>
                  <p className="font-black text-[11px]">#45</p>
                </div>
                <ChevronUp size={20} />
              </div>

              {[44, 43].map((num) => (
                <div key={num} className="bg-white p-4 rounded-[1.8rem] shadow-sm flex justify-between items-center opacity-80 border border-gray-100">
                  <p className="font-black text-[11px]">#{num}</p>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
              ))}

              <div className="space-y-3 pt-6">
                <button className="w-full text-left text-[10px] font-bold p-1 hover:underline text-gray-600">[Rapport Hebdomadaire PDF]</button>
                <button className="w-full text-left text-[10px] font-bold p-1 hover:underline text-gray-600">[Rapport Mensuel PDF]</button>
              </div>

              
            </div>

          </div>
        </div>
      </div>
    
  );
};

export default SupervisionInterventions;