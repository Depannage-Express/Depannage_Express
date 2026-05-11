import  { useState } from 'react';
import { ArrowLeft, Wrench, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
const Notifications = ({ onBack }) => {
  const [commands] = useState([
    { id: 1, desc: "Panne de moteur", loc: "Banikani", date: "07:50 20/04/2026", dist: "3 km", new: true },
    { id: 2, desc: "Panne de moteur", loc: "Banikani", date: "15:50 20/04/2026", dist: "1 km", new: false },
    { id: 3, desc: "Panne de pneu", loc: "Savè", date: "15:50 20/04/2026", dist: "2 km", new: false },
  ]);

  const [activeId, setActiveId] = useState(null);

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-[#0D2B0D]">
      
      <div className="bg-[#0D2B0D] p-6 flex items-center justify-between">
        <button onClick={onBack} className="text-white hover:text-[#608C27] flex items-center gap-2 font-bold">
          <ArrowLeft size={24} /> Retour
        </button>
        <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-3">
          <Wrench className="text-[#608C27]" /> Notifications
        </h2>
        <div className="w-10"></div>
      </div>

      <div className="p-4 md:p-8 space-y-4 bg-gray-50">
        {commands.map((cmd) => (
          <div key={cmd.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            <div 
              onClick={() => setActiveId(activeId === cmd.id ? null : cmd.id)}
              className={`p-5 flex items-center gap-4 cursor-pointer transition-all border-l-8 ${cmd.new ? 'border-[#608C27]' : 'border-gray-300'}`}
            >
              <div className={`p-3 rounded-full ${cmd.new ? 'bg-[#608C27]/10 text-[#608C27]' : 'bg-gray-100 text-gray-400'}`}>
                <Wrench size={24} />
              </div>

              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Description</p>
                  <p className="font-bold text-[#0D2B0D]">{cmd.desc}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase">Date</p>
                  <p className="text-sm font-semibold text-gray-600">{cmd.date}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Localisation</p>
                  <p className="text-sm font-medium text-gray-700">{cmd.loc}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase">Distance</p>
                  <p className="text-sm font-medium text-gray-700">{cmd.dist}</p>
                </div>
              </div>

              {cmd.new && (
                <span className="bg-[#0D2B0D] text-white text-[10px] px-2 py-1 rounded-full font-bold">NOUVEAU</span>
              )}
              <ChevronRight className={`text-gray-300 transition-transform ${activeId === cmd.id ? 'rotate-90' : ''}`} />
            </div>

            {activeId === cmd.id && (
              <div className="bg-gray-50 p-6 border-t border-gray-200 flex flex-wrap justify-center gap-4">
                <button className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition">
                  <XCircle size={18} /> Occuper
                </button>
                <button className="bg-[#00D084] text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-[#00b372] transition">
                  <CheckCircle size={18} /> Disponible
                </button>
                
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;