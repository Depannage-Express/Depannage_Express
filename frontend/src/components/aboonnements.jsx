import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const Abonnements = () => {
  const abonnes = [
    { id: "P001", name: "Sara TCHAKOR", tel: "+229 93457761", email: "sarakoff@gmail.com", active: true },
    { id: "P002", name: "Sara TCHAKOR", tel: "+229 93457762", email: "sarakoffk@gmail.com", active: true },
    { id: "P003", name: "Jean KOFFI", tel: "+229 9311347123", email: "jeankoffi@gmail.com", active: true },
  ];

  const paiements = [
    { id: "P025", type: "ABONNEMENT ANNUEL (Premium)", abonne: "Sara TCHAKOR", montant: "25000 FCFA", date: "12/05/2026, 11:15", statut: "Payé" },
    { id: "P024", type: "RENOUVELLEMENT MENSUEL", abonne: "Moussa ADEBAYO", montant: "2500 FCFA", date: "11/05/2026, 09:30", statut: "Payé" },
    { id: "P023", type: "NOUVEL ABONNEMENT ANNUEL", abonne: "Jean KOFFI", montant: "25000 FCFA", date: "10/05/2026, 16:45", statut: "Payé", star: true },
  ];

  return (
  
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden p-6 md:p-10">
        
        <div className="bg-[#0D2B0D] text-white -mt-10 -ml-10 -mr-10 p-4 flex justify-center">
            <h2 className="text-3xl font-bold mb-6  flex ">Liste Abonnés Premium </h2>
            </div>

            <div className="p-6"></div>

        {/* --- SECTION 1: LISTE ABONNÉS --- */}
        <div className="bg-gray-50 rounded-2xl p-6 shadow-md mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-sm font-bold border-b border-white">
                  <th className="pb-4 px-2">Name</th>
                  <th className="pb-4 px-2">ID</th>
                  <th className="pb-4 px-2">Téléphone</th>
                  <th className="pb-4 px-2">Email</th>
                  <th className="pb-4 px-2 text-center">Active</th>
                  <th className="pb-4 px-2"></th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {abonnes.map((user, idx) => (
                  <tr key={idx} className="border-b border-white hover:bg-white transition-colors">
                    <td className="py-4 px-2 flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-full overflow-hidden">
                        <img src={`https://i.pravatar.cc/150?u=${user.id}`} alt="avatar" />
                      </div>
                      <span className="font-bold">{user.name}</span>
                    </td>
                    <td className="py-4 px-2">{user.id}</td>
                    <td className="py-4 px-2">{user.tel}</td>
                    <td className="py-4 px-2">{user.email}</td>
                    <td className="py-4 px-2 text-center text-green-600">
                      {user.active && <Check size={18} className="mx-auto" />}
                    </td>
                    <td className="py-4 px-2">
                      <button className="bg-white px-4 py-1 rounded shadow-sm text-[10px] font-bold hover:bg-gray-300">Détails: [Ouvrir]</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- SECTION 2: PAIEMENTS --- */}
          <div className="lg:col-span-2 bg-gray-50 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-black uppercase mb-6 tracking-tighter">Paiements & Renouvellements</h2>
            <div className="bg-gray-50 rounded-xl p-4 border border-white">
              <h3 className="text-xs font-bold mb-4 uppercase border-b pb-2">Paiements récents</h3>
              <div className="space-y-4">
                {paiements.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] border-b border-white pb-3 last:border-0">
                    <div>
                      <p className="font-black uppercase">PAIEMENT #{p.id} | {p.type}</p>
                      <p className="text-gray-400 italic">Abonnée: {p.abonne} | Montant: {p.montant} | Date: {p.date} {p.star && '⭐'}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-600 text-white px-3 py-1 rounded text-[10px] font-bold italic">Statut: [{p.statut}]</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="bg-gray-200 px-4 py-2 rounded-lg text-[10px] font-bold shadow-sm hover:bg-gray-300 uppercase">[Générer Reçu]</button>
              <button className="bg-gray-400 text-white px-4 py-2 rounded-lg text-[10px] font-bold shadow-sm hover:bg-white0 uppercase">[Rapport PDF mensuel]</button>
            </div>
          </div>

          {/* --- SECTION 3: SUIVI & EXPIRATIONS --- */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tighter">Suivi & Expirations</h2>
            
            <div className="bg-white rounded-2xl p-5 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-[10px] uppercase">Détails abonnement #P025</h4>
                <ChevronUp size={16} />
              </div>
              <div className="text-[10px] leading-relaxed space-y-3">
                <p><span className="font-bold underline">Description:</span> L'abonnement de Sara TCHAKOR arrive bientôt à expiration. Cotonou, Benin.</p>
                <p><span className="font-bold underline">Date Expiration:</span> 12/06/2026 (Dans 1 Mois)</p>
                <p><span className="font-bold underline">Plan:</span> Annuel</p>
                <p><span className="font-bold underline">Actions:</span> <span className="cursor-pointer hover:text-blue-600">[Avertir l'utilisateur]</span> <span className="cursor-pointer hover:text-blue-600">[Manuel Renouvellement]</span></p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-md flex justify-between items-center opacity-80">
              <h4 className="font-bold text-[10px] uppercase">Détails abonnement #P024</h4>
              <ChevronDown size={16} />
            </div>

            
          </div>

        </div>
      </div>
      
    
  );
};

export default Abonnements;