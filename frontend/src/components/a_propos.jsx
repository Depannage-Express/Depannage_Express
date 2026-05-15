import { Star, Truck, Settings, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const APropos = () => {
  return (
<div className="bg-white p-8 lg:p-12 pb-10 flex-1">        {/* ENTETE (Style image_e10af5.png) */}
        <div className="flex justify-center items-center bg-[#0D2B0D] p-8 border-b border-gray-200">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic">À PROPOS DE DEPANNAGE EXPRESS</h2>
        </div>

          <div className="bg-white p-8 lg:p-12 pb-20 md:pb-32 ">         
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 w-full">            <div className="space-y-6">
              <h3 className="font-black text-lg text-black uppercase tracking-tight">NOTRE MISSION & VISION</h3>
              
              <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-gray-50 space-y-8">                {/* Mission */}
                <div className="relative">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 max-w-full md:max-w-[70%]">                      <h4 className="font-black text-sm uppercase">NOTRE MISSION</h4>
                      <p className="text-[13px] leading-relaxed text-gray-700 font-medium">
                        Offrir une solution digitale moderne qui simplifie le dépannage d'urgence en permettant aux conducteurs de localiser rapidement des mécaniciens fiables à proximité, tout en garantissant des échanges sécurisés et des interventions efficaces.                      </p>
                    </div>
                    {/* Illustration Personnages */}
                    <div className="flex items-center gap-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xl">👨‍🔧</div>
                      <span className="text-[#608C27] font-bold">⇆</span>
                      <div className="w-10 h-10 bg-orange-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xl">👨</div>
                    </div>
                  </div>
                </div>

                {/* Vision */}
                <div className="space-y-2">
                  <h4 className="font-black text-sm uppercase">NOTRE VISION</h4>
                  <p className="text-[13px] leading-relaxed text-gray-700 font-medium">
Devenir la plateforme de référence pour la mobilité urbaine, capable d'éliminer le stress des pannes imprévues en optimisant la rapidité d'intervention et en instaurant un environnement de confiance entre professionnels et usagers.                  </p>
                </div>

                {/* Icônes de Valeurs (Bas de carte) */}
                  <div className="flex flex-wrap justify-between items-center pt-6 border-t border-gray-100 gap-4">                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-[#608C27] p-2 rounded-lg text-white shadow-md"><Star size={20} fill="currentColor" /></div>
                    <span className="text-[10px] font-black uppercase">Rapidité</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-[#608C27] p-2 rounded-lg text-white shadow-md"><Truck size={20} fill="currentColor" /></div>
                    <span className="text-[10px] font-black uppercase">Qualité</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-[#608C27] p-2 rounded-lg text-white shadow-md"><Settings size={20} /></div>
                    <span className="text-[10px] font-black uppercase">Fiabilité</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-[#608C27] p-2 rounded-lg text-white shadow-md"><Clock size={20} fill="currentColor" /></div>
                    <span className="text-[10px] font-black uppercase">Impact local</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLONNE DROITE : VALEURS & IMPACT */}
            <div className="space-y-6 md:pt-10">              
              <h3 className="font-black text-lg text-black uppercase tracking-tight">NOS VALEURS & IMPACT</h3>
              <div className="space-y-4">
                {/* Accordéon Valeurs */}
                <div className="bg-white p-6 rounded-[1.5rem] shadow-md border border-gray-100 flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="font-black text-[11px] uppercase">NOS VALEURS</h4>
                    <p className="text-[11px] text-gray-600 font-bold italic">Proximité, Transparence, Professionnalisme</p>
                  </div>
                  <ChevronUp size={20} className="text-black" />
                </div>

                {/* Accordéon Impact */}
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex justify-between items-center opacity-80">
                  <h4 className="font-black text-[11px] uppercase">IMPACT LOCAL</h4>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>

                {/* Accordéon Partenariats */}
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex justify-between items-center opacity-80">
                  <h4 className="font-black text-[11px] uppercase">PARTENARIATS</h4>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </div>

              {/* Boutons PDF Style Maquette */}
            <div className="flex flex-wrap items-center gap-4 pt-10">                <button className="bg-gray-100 px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-gray-200 transition-colors shadow-sm">
                  [Rapport d'Impact PDF]
                </button>
                <button className="bg-gray-100 px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-gray-200 transition-colors shadow-sm">
                  [Présentation PDF]
                </button>
              </div>

              
            </div>

          </div>
        </div>
      </div>
   
  );
};

export default APropos;