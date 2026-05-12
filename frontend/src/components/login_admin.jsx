import { useState } from 'react';
const ConnexionAdmin = ({ onInscriptionClickAd, onLoginClickAd}) => {
  const [error, setError] = useState("");
  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="bg-[#0D2B0D] w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white/10">
        
        {/* Titre Connexion */}
        <div className="flex justify-center mb-10">
          <h2 className="bg-[#608C27] text-white text-2xl font-bold px-12 py-2 rounded-full shadow-md">
            Connexion
          </h2>
        </div>

        <form className="space-y-6">
          {/* Champ ID */}
          <div>
            <input 
              type="text" 
              placeholder="id:" 
              className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
            />
          </div>
          
          {/* Champ Mot de passe */}
          <div>
            <input 
              type="password" 
              placeholder="Mot de passe:" 
              className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
            />
          </div>

          {/* Zone de notification d'erreur */}
          
          <div className="w-full p-4 rounded-xl bg-gray-400 text-center text-[#0D2B0D] text-sm font-medium italic">
            {error || "?! notification en cas d'erreur ?!"}
          </div>

          {/* Bouton Connexion */}
          <div className="flex justify-end mt-6">
            <button 
              type="submit" 
              onClick={onLoginClickAd}
              className="bg-[#608C27] text-white font-bold py-3 px-8 rounded-2xl hover:bg-black transition-all shadow-lg"
            >
              Connexion
            </button>
          </div>
        </form>

        {/* Lien vers Inscription */}
        <div className="mt-8 text-center">
          <button 
            onClick={onInscriptionClickAd}
            className="text-white hover:text-[#608C27] text-sm font-bold transition-colors"
          >
            Cliquez ici si vous n'avez pas encore un compte
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConnexionAdmin;