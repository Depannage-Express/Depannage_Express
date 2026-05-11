const StatutMissions = () => {
  // Données simulées basées sur ton image
  const missions = [
    {
      id: 1,
      description: "Panne de moteur",
      localisation: "Banikani",
      avis: "Très satisfait",
      date: "07:50 20/04/2026",
      distance: "3 km",
      credit: "+ 2"
    },
    {
      id: 2,
      description: "Panne de moteur",
      localisation: "Banikani",
      avis: "Très satisfait",
      date: "07:50 20/04/2026",
      distance: "3 km",
      credit: "+ 2"
    },
    {
      id: 3,
      description: "Panne de moteur",
      localisation: "Banikani",
      avis: "Très satisfait",
      date: "07:50 20/04/2026",
      distance: "3 km",
      credit: "+ 2"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D2B0D] p-4 md:p-8 flex flex-col items-center rounded-2xl">
      
      <div className="bg-[#0D2B0D] p-6 flex  justify-between">
        
        <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-3">
            Statut des missions
        </h2>
        <div className="w-10"></div>
      </div>
      
      {/* Liste des cartes */}
      <div className="w-full max-w-4xl space-y-4">
        {missions.map((mission) => (
          <div 
            key={mission.id} 
            className="bg-white rounded-3xl p-6 shadow-lg flex flex-col md:flex-row justify-between gap-4"
          >
            {/* Colonne Gauche */}
            <div className="space-y-2">
              <p className="text-black font-bold text-lg">
                Description : <span className="font-medium">{mission.description}</span>
              </p>
              <p className="text-black font-bold text-lg">
                Localisation : <span className="font-medium">{mission.localisation}</span>
              </p>
              <p className="text-black font-bold text-lg mt-4">
                Avis : <span className="font-medium">{mission.avis}</span>
              </p>
            </div>

            {/* Colonne Droite */}
            <div className="space-y-2 md:text-left">
              <p className="text-black font-bold text-lg">
                Date : <span className="font-medium">{mission.date}</span>
              </p>
              <p className="text-black font-bold text-lg">
                Distance : <span className="font-medium">{mission.distance}</span>
              </p>
              <p className="text-black font-bold text-lg mt-4">
                Crédit : <span className="font-medium">{mission.credit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatutMissions;