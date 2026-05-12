import { useState } from 'react';
import { Filter, Search, ChevronDown, ChevronUp, Star } from 'lucide-react';

const GestionPaiements = () => {
  const [transactions, setTransactions] = useState([
    { id: 34, titre: "Intervention Auto-Mécanique", client: "Moussa A.", meca: "Sara T.", montant: "150.000 FCFA", date: "11/05/2026 14:36", statut: "Non Vérifié", color: "text-green-600" },
    { id: 31, titre: "Intervention Auto-Mécanique", client: "Moussa A.", meca: "Sara T.", montant: "250.000 FCFA", date: "11/05/2026 11:20", statut: "En Cours", color: "text-yellow-500" },
  ]);

  return (
    /* FOND GLOBAL AVEC LA BANDE VERTE COMME IMAGE 1 */
    <div className="min-h-screen bg-gray-200 relative font-sans">
      
      {/* ENTETE INTERNE (Copie conforme Image 1) */}
      <div className="flex justify-center items-center bg-[#0D2B0D] rounded-t-[1.5rem] p-6 border-b border-gray-200 max-w-[95%] mx-auto mt-10">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Gestion des Paiements</h2>
      </div>

      <div className="bg-white rounded-b-[1.5rem] p-8 max-w-[95%] mx-auto shadow-2xl border-x-8 border-b-8 border-white">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* COLONNE GAUCHE */}
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100">
              <h3 className="font-black uppercase text-xs mb-4">Filtrage & Recherche</h3>
              <div className="flex gap-2 mb-4">
                <button className="flex-1 bg-gray-50 border p-2 rounded-xl text-[10px] font-bold flex justify-between items-center">Tous <ChevronDown size={12}/></button>
                <button className="flex-1 bg-gray-50 border p-2 rounded-xl text-[10px] font-bold flex justify-between items-center"><Filter size={12}/> Gravité</button>
              </div>
              <div className="relative">
                <input type="text" placeholder="[Rechercher...]" className="w-full bg-gray-50 border rounded-xl p-2 text-[10px] outline-none" />
                <Search className="absolute right-3 top-2 text-gray-400" size={14} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100">
              <h3 className="font-black uppercase text-[10px] mb-4">Transactions Récentes</h3>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-[10px]">
                    <p className="font-black">MOUSSA ADEBAYO</p>
                    <p className="text-gray-400 text-[8px]">ID: 0346831061</p>
                    <p className="mt-1">👤 Client: Moussa A.</p>
                    <p>💰 11/05/2026</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLONNE CENTRE (FILE D'ATTENTE) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-sm text-gray-700 uppercase px-2 tracking-widest">Transactions (File d'attente)</h3>
            {transactions.map((t) => (
              <div key={t.id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-50 relative group min-h-[180px]">
                <div className="flex justify-between items-stretch h-full">
                  {/* Partie Gauche : Détails et Montant */}
                  <div className="flex gap-4">
                    <Star className={`${t.color} fill-current`} size={28} />
                    <div className="flex flex-col justify-between">
                      <div>
                        <h4 className="font-black text-[13px] uppercase italic">ID #{t.id} | {t.titre}</h4>
                        <div className="text-[12px] mt-3 space-y-1 text-gray-600">
                          <p>👤 <span className="font-bold text-blue-600">Client:</span> {t.client}</p>
                          <p>👷 <span className="font-bold text-yellow-600">Mécanicien:</span> {t.meca}</p>
                        </div>
                      </div>
                      <p className="text-xl flex font-black text-black mt-4">Montant: {t.montant}</p>
                    </div>
                  </div>
                  
                  {/* Partie Droite : Statut et Boutons alignés en bas */}
                  <div className="flex flex-col justify-between items-end">
                    <div className="text-right">
                      <p className="text-[10px] font-bold">Payé ● {t.statut} <span className="text-red-500">●</span></p>
                      <p className="text-[9px] text-gray-400 font-bold">Date: {t.date}</p>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button className="bg-[#1a301a] text-white text-[10px] px-4 py-2 rounded-xl font-bold hover:scale-105 transition-transform">Contrôler</button>
                      <button className="bg-[#608C27] text-white text-[10px] px-4 py-2 rounded-xl font-bold hover:scale-105 transition-transform">Valider</button>
                      <button className="bg-red-600 text-white text-[10px] px-4 py-2 rounded-xl font-bold hover:scale-105 transition-transform">Rejeter</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* COLONNE DROITE */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-gray-700 uppercase tracking-widest">Historique & Rapports</h3>
            <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-100">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <h4 className="font-black text-[11px] uppercase">Détails Transaction #34</h4>
                <ChevronUp size={18} />
              </div>
              <div className="text-[11px] space-y-4 leading-relaxed text-gray-600">
                <p><span className="font-black">Description:</span> Intervention mécanique complète pour moteur diesel...</p>
                <p><span className="font-black">Preuves:</span> <span className="text-blue-500 underline">[Photo Facture] [Photo Paiement]</span></p>
                <div className="pt-4 space-y-2">
                  <p className="font-bold uppercase text-[9px] text-gray-400">Actions rapides</p>
                  <div className="flex flex-wrap gap-1">
                     <span className="bg-gray-100 p-1 rounded cursor-pointer">[Contacter]</span>
                     <span className="bg-gray-100 p-1 rounded cursor-pointer text-red-500">[Signalement]</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full py-4 border-2 border-gray-300 rounded-full text-[11px] font-black uppercase hover:bg-gray-50 transition-all shadow-sm">[Rapport Mensuel PDF]</button>
            <button className="w-full py-4 border-2 border-gray-300 rounded-full text-[11px] font-black uppercase hover:bg-gray-50 transition-all shadow-sm">[Rapport Hebdomadaire PDF]</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionPaiements;