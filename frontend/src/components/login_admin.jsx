import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
const ConnexionAdmin = ({ onInscriptionClickAd, onLoginClickAd}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = (event) => {
    event.preventDefault();
    if (onLoginClickAd) {
      onLoginClickAd({ email, password });
    }
  };
  return (
<div className="flex items-center justify-center min-h-[calc(100vh-80px)] w-full py-12 px-4">      <div className="bg-[#0D2B0D] w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white/10">
        
        {/* Titre Connexion */}
        <div className="flex justify-center mb-10">
          <h2 className="bg-[#608C27] text-white text-2xl font-bold px-12 py-2 rounded-full shadow-md">
            Connexion
          </h2>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Champ ID */}
          <div>
            <input 
              type="text" 
              placeholder="Email ou identifiant" 
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
            />
          </div>
          
          {/* Champ Mot de passe */}
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Mot de passe:" 
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Zone de notification d'erreur */}
          
          <div className="w-full p-4 rounded-xl bg-gray-400 text-center text-[#0D2B0D] text-sm font-medium italic">
            {error || "?! notification en cas d'erreur ?!"}
          </div>

          {/* Bouton Connexion */}
          <div className="flex justify-end mt-6">
            <button 
              type="submit" 
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