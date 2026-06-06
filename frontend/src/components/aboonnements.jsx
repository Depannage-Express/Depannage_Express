import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const Abonnements = ({ onBack }) => {
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
    <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">

      {/* Header — pas de marges négatives */}
      <div className="bg-[#0D2B0D] text-white p-4 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-white text-sm font-bold hover:text-[#608C27] transition-colors shrink-0">
            ← Retour
          </button>
        )}
        <h2 className="text-xl sm:text-3xl font-bold flex-1 text-center">Liste Abonnés Premium</h2>
      </div>

      <div className="p-4 sm:p-6 md:p-10">

        {/* SECTION 1: LISTE ABONNÉS */}
        <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 shadow-md mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="text-sm font-bold border-b border-white">
                  <th className="pb-4 px-2">Nom</th>
                  <th className="pb-4 px-2">ID</th>
                  <th className="pb-4 px-2">Téléphone</th>
                  <th className="pb-4 px-2 hidden sm:table-cell">Email</th>
                  <th className="pb-4 px-2 text-center">Actif</th>
                  <th className="pb-4 px-2"></th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {abonnes.map((user, idx) => (
                  <tr key={idx} className="border-b border-white hover:bg-white transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-full overflow-hidden shrink-0">
                          <img src={`https://i.pravatar.cc/150?u=${user.id}`} alt="avatar" />
                        </div>
                        <span className="font-bold">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">{user.id}</td>
                    <td className="py-3 px-2 whitespace-nowrap">{user.tel}</td>
                    <td className="py-3 px-2 hidden sm:table-cell">{user.email}</td>
                    <td className="py-3 px-2 text-center text-green-600">
                      {user.active && <Check size={16} className="mx-auto" />}
                    </td>
                    <td className="py-3 px-2">
                      <button className="bg-white px-3 py-1.5 rounded shadow-sm text-xs font-bold hover:bg-gray-300 transition-colors whitespace-nowrap">
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* SECTION 2: PAIEMENTS */}
          <div className="lg:col-span-2 bg-gray-50 rounded-2xl p-4 sm:p-6 shadow-md">
            <h2 className="text-lg font-black uppercase mb-4 tracking-tighter">Paiements & Renouvellements</h2>
            <div className="bg-gray-50 rounded-xl p-4 border border-white">
              <h3 className="text-xs font-bold mb-4 uppercase border-b pb-2">Paiements récents</h3>
              <div className="space-y-4">
                {paiements.map((p, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-white pb-3 last:border-0">
                    <div className="min-w-0">
                      <p className="font-black uppercase text-xs leading-tight">PAIEMENT #{p.id} | {p.type}</p>
                      <p className="text-gray-400 italic text-xs mt-1">
                        Abonnée: {p.abonne} | {p.montant} | {p.date} {p.star && '⭐'}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold italic whitespace-nowrap">
                        [{p.statut}]
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 mt-4">
              <button className="bg-gray-200 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-300 uppercase transition-colors">
                Générer reçu
              </button>
              <button className="bg-gray-400 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-500 uppercase transition-colors">
                Rapport PDF mensuel
              </button>
            </div>
          </div>

          {/* SECTION 3: SUIVI & EXPIRATIONS */}
          <div className="space-y-4">
            <h2 className="text-lg font-black uppercase tracking-tighter">Suivi & Expirations</h2>

            <div className="bg-white rounded-2xl p-4 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-xs uppercase">Détails abonnement #P025</h4>
                <ChevronUp size={16} />
              </div>
              <div className="text-xs leading-relaxed space-y-3">
                <p>
                  <span className="font-bold underline">Description:</span> L'abonnement de Sara TCHAKOR arrive bientôt à expiration. Cotonou, Benin.
                </p>
                <p>
                  <span className="font-bold underline">Date Expiration:</span> 12/06/2026 (Dans 1 Mois)
                </p>
                <p>
                  <span className="font-bold underline">Plan:</span> Annuel
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors">
                    Avertir
                  </button>
                  <button className="bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-green-100 transition-colors">
                    Renouveler
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-md flex justify-between items-center opacity-80">
              <h4 className="font-bold text-xs uppercase">Détails abonnement #P024</h4>
              <ChevronDown size={16} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Abonnements;
