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
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.password_confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setIsSubmitting(true);

    try {
      const authPayload = await registerMechanic({ ...form, role: 'mechanic_standard' });
      setAuthTokens(authPayload);
      setSuccess('Compte créé. Complétez ensuite le profil mécanicien et les justificatifs.');
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

  const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-200 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold text-sm transition-all";
  const labelClass = "block text-white/70 text-[11px] font-bold uppercase tracking-widest mb-1 pl-1";

  return (
    <div className="min-h-screen flex flex-col bg-[#608C27]">
      <div className="flex-grow flex items-center justify-center py-10 px-4">
        <div className="bg-[#0D2B0D] w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white/10">

          {/* Titre */}
          <div className="flex justify-center mb-8">
            <h2 className="bg-[#608C27] text-white text-xl font-bold px-10 py-2 rounded-full shadow-md tracking-wide">
              Inscription
            </h2>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* Nom + Prénom côte à côte */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nom</label>
                <input
                  type="text"
                  placeholder="Dupont"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Prénom</label>
                <input
                  type="text"
                  placeholder="Jean"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Téléphone</label>
              <input
                type="tel"
                placeholder="+229 01 00 00 00 00"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                placeholder="exemple@mail.com"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                name="password_confirm"
                value={form.password_confirm}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Preuve de compétence */}
            <div>
              <label className={labelClass}>Preuve de compétence</label>
              <label className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 cursor-pointer transition-all group">
                <div className="flex items-center gap-3">
                  <Upload size={18} className="text-[#608C27] shrink-0" />
                  <span className="text-gray-600 text-sm font-semibold group-hover:text-black transition-colors">
                    {fileName || 'Diplôme ou attestation'}
                  </span>
                </div>
                <span className="text-[10px] text-[#608C27] font-bold uppercase tracking-wider border border-[#608C27] px-2 py-1 rounded-lg">
                  Parcourir
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                />
              </label>
            </div>

            {/* Zone notification */}
            <div className="w-full rounded-xl bg-gray-400 text-center text-[#0D2B0D] text-sm font-medium italic px-4 py-3 min-h-[44px] flex items-center justify-center">
              {error || success || "Le dossier de vérification sera complété dans le profil mécanicien."}
            </div>

            {/* Bouton Soumettre */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-white hover:text-[#0D2B0D] transition-all shadow-lg mt-2 tracking-wide text-sm"
            >
              {isSubmitting ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </form>

          {/* Séparateur + lien connexion */}
          <div className="mt-7">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-white/40 text-xs font-medium">ou</span>
              <div className="flex-1 h-px bg-white/15" />
            </div>
            <div className="mt-5 text-center">
              <p className="text-white/50 text-xs mb-2">Vous avez déjà un compte ?</p>
              <button
                onClick={onSignUpClick}
                className="text-[#608C27] font-bold text-sm hover:text-white transition-colors"
              >
                Se connecter →
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Inscription;
