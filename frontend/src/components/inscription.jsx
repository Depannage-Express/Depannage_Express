import { useState } from 'react';
import { Upload } from 'lucide-react';
import { registerMechanic, setAuthTokens } from '../lib/api';

const Inscription = ({ onInfo, onSignUpClick, onRegisterSuccess }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    password_confirm: '',
    role: 'mechanic_standard',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const authPayload = await registerMechanic(form);
      setAuthTokens(authPayload);
      setSuccess('Compte cree. Completer ensuite le profil mecanicien et les justificatifs.');
      if (onRegisterSuccess) {
        onRegisterSuccess(authPayload);
      } else if (onInfo) {
        onInfo();
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Champs de saisie */}
            <div>
              <input 
                type="text" 
                placeholder="Nom:" 
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
              />
            </div>
            
            <div>
              <input 
                type="text" 
                placeholder="Prénom:" 
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
              />
            </div>

            <div>
              <input 
                type="tel" 
                placeholder="Numéro:" 
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
              />
            </div>

            <div>
              <input
                type="email"
                placeholder="Email:"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Mot de passe:"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Confirmer le mot de passe:"
                name="password_confirm"
                value={form.password_confirm}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-gray-200 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
              />
            </div>

            <div>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-gray-200 text-black focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold"
              >
                <option value="mechanic_standard">Mecanicien standard</option>
                <option value="mechanic_premium">Mecanicien premium</option>
              </select>
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

            <div className="w-full min-h-12 rounded-xl bg-gray-400 text-center text-[#0D2B0D] text-sm font-medium italic p-3">
              {error || success || "Le dossier de verification sera complete dans le profil mecanicien."}
            </div>

            {/* Bouton Soumettre */}
            <div className="flex justify-end mt-6">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#608C27] text-white font-bold py-3 px-8 rounded-2xl hover:bg-black transition-all shadow-lg transform hover:scale-105"
              >
                {isSubmitting ? 'Envoi...' : 'Soumettre'}
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
