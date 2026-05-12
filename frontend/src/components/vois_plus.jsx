import { Star } from 'lucide-react';

const InfoMecanicien = () => {
  const avis = [
    { id: 3012, auteur: "Moussa A.", type: "Panne de moteur", date: "11/05/2026", note: 5, commentaire: "Intervention rapide, très professionnel." },
    { id: 3016, auteur: "Moussa A.", type: "Panne de moteur", date: "11/05/2026", note: 5, commentaire: "Excellente prestation sur ma voiture, je recommande." },
    { id: 3014, auteur: "Moussa A.", type: "Panne de moteur", date: "11/05/2026", note: 5, commentaire: "Excellente prestation sur ma voiture, je recommande." },
  ];

  return (
    <div className="min-h-screen bg-gray-200 p-4 md:p-8 font-sans">
      {/* HEADER DE LA CARTE PRINCIPALE */}
      <div className="max-w-6xl mx-auto bg-white rounded-[2rem] shadow-xl overflow-hidden border-8 border-[#e8e8e8]">
        <div className="bg-[#0D2B0D] p-6 text-center">
          <h2 className="text-white text-2xl font-black uppercase italic">Info Mécanicien Détaillée</h2>
        </div>

        <div className="p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* SECTION PROFIL (GAUCHE) */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
               <h3 className="font-black text-xl uppercase tracking-tighter">Profil Mécanicien</h3>
               <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg overflow-hidden">
                    <img src="/Male construction worker.jpeg" alt="Profil" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
               </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-black text-sm w-32 uppercase">Nom Complet:</label>
                <input type="text" readOnly value="Sara T." className="flex-grow bg-gray-100 p-3 rounded-xl border border-gray-300 font-bold" />
              </div>
              <div className="flex items-center gap-4">
                <label className="font-black text-sm w-32 uppercase">Spécialité:</label>
                <div className="flex-grow relative">
                  <select disabled className="w-full bg-gray-100 p-3 rounded-xl border border-gray-300 font-bold appearance-none">
                    <option>Mécanicien auto, Moto</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="font-black text-sm w-32 uppercase">Expérience:</label>
                <input type="text" readOnly value="5 ans" className="flex-grow bg-gray-100 p-3 rounded-xl border border-gray-300 font-bold" />
              </div>
              <div className="flex items-center gap-4">
                <label className="font-black text-sm w-32 uppercase">Rating:</label>
                <div className="flex items-center gap-2 font-black">
                  <span>4.8</span>
                  <Star className="text-yellow-500 fill-yellow-500" size={20} />
                  <span className="text-gray-500 font-medium">(150 avis)</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="font-black text-sm w-32 uppercase">Statut Actif:</label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked readOnly className="w-5 h-5 accent-green-600" />
                  <span className="font-bold">Actif</span>
                </div>
              </div>
            </div>

            
          </div>

          {/* SECTION AVIS (DROITE) */}
          <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-200">
            <h3 className="font-black text-xl uppercase tracking-tighter mb-6 flex items-center gap-2">
              Historique des avis
            </h3>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <div className="flex items-center gap-2 mb-4">
                <Star size={24} fill="black" />
                <span className="font-black text-xl">Avis</span>
              </div>

              {avis.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                    <img src="/Mechanic Quotes.jpeg" alt="Avis" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-sm">{item.auteur}</h4>
                        <p className="text-[10px] text-gray-500">ID: {item.id}</p>
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-[11px] uppercase">{item.type}</h4>
                        <p className="text-[10px] text-gray-500">Intervention ID, {item.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 my-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-700 italic">{item.commentaire}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InfoMecanicien;