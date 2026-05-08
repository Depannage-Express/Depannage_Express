import { useState } from 'react';

import { MapPin, Clock, Wrench} from 'lucide-react'; 

const ListesCommandes = () => {
  // Données de test (à remplacer par des données API plus tard)
  const allCommands = [
    {
      id: 1,
      shortDescription: "Panne de moteur (Bruit suspect)",
      date: "15:50 20/04/2026",
      details: {
        description: "Bruit de claquement fort dans le moteur après 3000 tr/min. Le voyant moteur est allumé.",
        localization: "Cotonou, Zone du Port, Rue 200",
        distance: "3.5 km",
        originalStatut: "En attente d'approbation"
      }
    },
    {
      id: 2,
      shortDescription: "Problème de démarrage (Batterie ?)",
      date: "16:00 04/02/2016",
      details: {
        description: "Le moteur ne tourne pas du tout. Les phares sont très faibles. Probable problème de batterie ou alternateur.",
        localization: "Godomey, Route Nationale 1, face Pharmacie",
        distance: "7.2 km",
        originalStatut: "En attente d'approbation"
      }
    }
  ];

  // État pour savoir quelle commande est ouverte (-1 = aucune)
  const [openCommandId, setOpenCommandId] = useState(-1);

  // Fonction pour gérer l'accordéon
  const toggleCommand = (id) => {
    setOpenCommandId(openCommandId === id ? -1 : id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* 2. Main Content */}
      <main className="flex-grow container mx-auto px-4 py-10 max-w-5xl">
        
        {/* Titre de section (Vert olive) */}
        <h1 className="text-4xl font-extrabold text-[#608C27] text-center mb-12 uppercase tracking-wide">
          Listes des Demandes de Service
        </h1>

        <div className="space-y-6">
          {allCommands.map((command) => (
            <div key={command.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              
              {/* --- PARTIE VISIBLE (Entête de la commande) --- */}
              <div 
                className="p-6 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                onClick={() => toggleCommand(command.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${openCommandId === command.id ? 'bg-[#608C27] text-white' : 'bg-slate-100 text-[#0D2B0D]'}`}>
                    <Wrench size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-slate-900 leading-tight">
                      {command.shortDescription}
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Clock size={14} /> {command.date}
                    </p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {openCommandId === command.id ? '▲' : '▼'}
                </div>
              </div>

              {/* --- PARTIE DÉTAILS (Accordéon Vert Foncé) --- */}
              <div className={`transition-all duration-300 ease-in-out ${openCommandId === command.id ? 'max-h-[800px] border-t border-[#608C27]' : 'max-h-0'}`}>
                <div className="bg-[#0D2B0D] p-8 space-y-6 text-white rounded-b-2xl">
                  
                  <DetailItem title="Description détaillée" value={command.details.description} icon={<Wrench size={20}/>} />
                  <DetailItem title="Localisation" value={command.details.localization} icon={<MapPin size={20}/>}/>
                  <DetailItem title="Distance estimée" value={command.details.distance} icon={<MapPin size={20}/>}/>
                  
                 
                  
                </div>
              </div>

            </div>
          ))}
        </div>
      </main>

    </div>
  );
};

// Sous-composant pour les éléments de détails pour éviter la répétition
const DetailItem = ({ title, value, icon }) => (
  <div className="flex items-start gap-3">
    <div className="text-[#608C27] shrink-0">{icon}</div>
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-[#608C27]">{title}</p>
      <p className="text-base text-white">{value}</p>
    </div>
  </div>
);
export default ListesCommandes;