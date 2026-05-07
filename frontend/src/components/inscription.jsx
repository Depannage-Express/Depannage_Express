import { Upload } from 'lucide-react';

const Inscription = ({ onInfo, onSignUpClick}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#608C27]">
      
      <div className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="bg-[#0D2B0D] w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white/10">
          
          {/* Titre Inscription */}
          <div className="flex justify-center mb-8">
            <h2 className="bg-[#608C27] text-white text-2xl font-bold px-10 py-2 rounded-full shadow-md">
              Inscription
            </h2>
          </div>

          <form className="space-y-5">
            {/* Champs de saisie */}
            <div>
              <input 
                type="text" 
                placeholder="Nom:" 
                className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
              />
            </div>
            
            <div>
              <input 
                type="text" 
                placeholder="Prénom:" 
                className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
              />
            </div>

            <div>
              <input 
                type="tel" 
                placeholder="Numéro:" 
                className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
              />
            </div>

            {/* Section Preuve de compétence */}
            <div className="space-y-2">
              <div className="w-full p-3 rounded-xl bg-gray-200 text-center font-bold text-gray-800">
                Preuve de compétence
              </div>
              <label className="flex flex-col items-center justify-center w-full h-24 bg-gray-400 rounded-xl cursor-pointer hover:bg-gray-500 transition-colors border-2 border-dashed border-gray-300">
                <div className="flex flex-col items-center justify-center pt-2">
                  <Upload size={24} className="text-[#0D2B0D] mb-1" />
                  <p className="text-[10px] text-[#0D2B0D] px-4 text-center leading-tight">
                    Cliquez ici pour ajouter un diplôme ou attestation (image ou pdf).fichier
                  </p>
                </div>
                <input type="file" className="hidden" />
              </label>
            </div>

            {/* Bouton Soumettre */}
            <div className="flex justify-end mt-6">
              <button 
                type="submit" 
                onClick={onInfo}
                className="bg-[#608C27] text-white font-bold py-3 px-8 rounded-2xl hover:bg-black transition-all shadow-lg transform hover:scale-105"
              >
                Soumettrre
              </button>
            </div>
          </form>

          {/* Lien de redirection */}
          <div className="mt-8 text-center">
            <button 
              onClick={onSignUpClick}
              className="text-white hover:text-[#608C27] text-sm font-bold transition-colors">
              Cliquez ici si vous avez déjà un compte
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Inscription;