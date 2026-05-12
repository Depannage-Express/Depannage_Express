import { useEffect, useState } from 'react';
import { MapPin, Clock, Wrench} from 'lucide-react'; 
import { fetchMechanicRequests } from '../lib/api';

const ListesCommandes = () => {
  const [allCommands, setAllCommands] = useState([]);
  const [openCommandId, setOpenCommandId] = useState(-1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await fetchMechanicRequests();
        setAllCommands(data.results || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, []);

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

        {isLoading ? (
          <div className="text-center text-slate-600 font-semibold">Chargement des demandes...</div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-center text-red-700">{error}</div>
        ) : null}

        {!isLoading && !error && allCommands.length === 0 ? (
          <div className="text-center text-slate-600 font-semibold">
            Aucune demande assignee pour le moment.
          </div>
        ) : null}

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
                      {command.breakdown_type || 'Demande de depannage'}
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Clock size={14} /> {new Date(command.created_at).toLocaleString('fr-FR')}
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
                  
                  <DetailItem title="Client" value={command.driver_name} icon={<Wrench size={20}/>} />
                  <DetailItem title="Description detaillee" value={command.breakdown_description} icon={<Wrench size={20}/>} />
                  <DetailItem title="Localisation" value={command.address_description || 'Position GPS recue'} icon={<MapPin size={20}/>}/>
                  <DetailItem title="Distance estimee" value={command.assignment_distance_km ? `${command.assignment_distance_km} km` : 'Non calculee'} icon={<MapPin size={20}/>}/>
                  
                 
                  
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
