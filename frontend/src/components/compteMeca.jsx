import  { useState } from 'react';
import { User, History, ArrowDownCircle,ArrowLeft, CheckCircle } from 'lucide-react';

const MonCompte = ({onBack}) => {
  const [notifSucces, setNotifSucces] = useState(false);

  // Simulation des données
  const profil = {
    nom: "Junior MAKE",
    id: "45125426645",
    tel: "+2290158565221",
    email: "jujnior@gmail.com",
    specialite: "auto-mecanique"
  };

  const compte = {
    id: "2568752686",
    solde: "50.000 FcFa"
  };

  const historique = [
    { type: "Retrait", montant: "50000", date: "20/02/2025 15:30", frais: "125" },
    { type: "Retrait", montant: "20000", date: "02/02/2025 20:30", frais: "50" },
    { type: "Reçu", montant: "50000", date: "20/02/2025 15:30", frais: "0" },
    { type: "Retrait", montant: "50000", date: "20/02/2025 15:30", frais: "125" },
    { type: "Retrait", montant: "50000", date: "20/02/2025 15:30", frais: "125" },
  ];

  const handleRetrait = (e) => {
    e.preventDefault();
    setNotifSucces(true);
    setTimeout(() => setNotifSucces(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]  p-4 md:p-8 rounded-2xl">
      <div className="bg-[#0D2B0D] p-6 flex items-center justify-between rounded-2xl">
        <button onClick={onBack} className="text-white hover:text-[#608C27] flex items-center gap-2 font-bold">
          <ArrowLeft size={24} /> Retour
        </button>
        <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-3">
          Mon Compte
        </h2>
        <div className="w-10"></div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- BLOC PROFIL --- */}
        <div className="space-y-6 mt-8">
          <div className="bg-white p-6 rounded-3xl shadow-lg border-t-4 border-[#608C27] flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4 border-4 border-[#0D2B0D]">
              <User size={64} className="text-[#0D2B0D]" />
            </div>
            <h3 className="text-xl font-bold text-[#0D2B0D]">Profil</h3>
          </div>

          <div className="bg-[#D9D9D9] p-6 rounded-3xl shadow-md space-y-3">
            <p className="text-black font-bold">Nom: <span className="font-medium">{profil.nom}</span></p>
            <p className="text-black font-bold">Id: <span className="font-medium">{profil.id}</span></p>
            <p className="text-black font-bold">Tel: <span className="font-medium">{profil.tel}</span></p>
            <p className="text-black font-bold">Email: <span className="font-medium">{profil.email}</span></p>
            <p className="text-black font-bold">Spécialité: <span className="font-medium">{profil.specialite}</span></p>
          </div>
        </div>

        {/* --- BLOC SOLDE ET RETRAIT --- */}
        <div className="space-y-6 mt-8">
          <div className="bg-[#0D2B0D] p-8 rounded-3xl shadow-xl text-white text-center">
            <p className="text-lg opacity-80 mb-2">Id compte : {compte.id}</p>
            <h3 className="text-3xl font-bold">Solde: {compte.solde}</h3>
          </div>

          <form onSubmit={handleRetrait} className="bg-white p-6 rounded-3xl shadow-lg border-2 border-gray-100">
            <h4 className="text-[#0D2B0D] font-bold text-center mb-6 text-xl">Formulaire de retrait</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-100 p-3 rounded-xl">
                <span className="font-bold text-[#0D2B0D]">Montant :</span>
                <input type="number" placeholder="20000" className="bg-transparent outline-none text-right w-24 font-bold" />
              </div>
              <div className="flex justify-between items-center bg-gray-100 p-3 rounded-xl">
                <span className="font-bold text-[#0D2B0D]">Motif :</span>
                <input type="text" placeholder="Exemple" className="bg-transparent outline-none text-right w-24 font-medium" />
              </div>
              <div className="text-center py-2 bg-green-50 rounded-lg">
                <p className="text-[#608C27] font-bold">Frais (0.25%) : 50 FcFa</p>
              </div>

              <div className="relative pt-4">
                {notifSucces && (
                  <div className="absolute -top-6 left-0 flex items-center gap-1 text-red-600 font-bold animate-bounce">
                    <CheckCircle size={16} /> Notif de succès
                  </div>
                )}
                <button type="submit" className="w-full bg-[#0D2B0D] text-white py-4 rounded-2xl font-bold text-xl hover:bg-[#608C27] transition-all flex items-center justify-center gap-2">
                  <ArrowDownCircle size={24} /> Retrait
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* --- BLOC HISTORIQUE --- */}
        <div className="bg-[#D9D9D9] rounded-3xl shadow-lg flex flex-col h-fit overflow-hidden border-2 border-[#0D2B0D] mt-8">
          <div className="bg-[#0D2B0D] text-white p-4 flex items-center justify-center gap-2">
            <History size={24} />
            <h3 className="text-xl font-bold">Historique</h3>
          </div>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide">
            {historique.map((item, index) => (
              <div key={index} className="border-b border-gray-400 pb-3 last:border-0">
                <div className="flex justify-between text-sm font-bold text-[#0D2B0D]">
                  <span>{item.type}: {item.montant}</span>
                  <span className="font-medium opacity-70">{item.date}</span>
                </div>
                {item.frais !== "0" && (
                  <p className="text-[10px] text-gray-600 font-semibold italic text-right">frais: {item.frais}</p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MonCompte;