import { useState } from 'react';
import { Upload, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { registerMechanic, setAuthTokens } from '../lib/api';

const Inscription = ({ onInfo, onSignUpClick, onRegisterSuccess }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '01',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePhoneChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setForm((f) => ({ ...f, phone: digits }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.phone || form.phone.replace(/\D/g, '').length < 8) {
      setError('Entrez un numéro de téléphone valide (au moins 8 chiffres).');
      return;
    }
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
      const authPayload = await registerMechanic({ ...form, phone: '+229' + form.phone, role: 'mechanic_standard' });
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

          <div className="flex justify-center mb-8">
            <h2 className="bg-[#608C27] text-white text-xl font-bold px-10 py-2 rounded-full shadow-md tracking-wide">
              Inscription
            </h2>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>

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
              <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-[#608C27] transition-all">
                <span className="flex items-center bg-gray-100 px-3 text-gray-600 font-bold text-sm select-none shrink-0 border-r border-gray-200">
                  +229
                </span>
                <input
                  type="tel"
                  placeholder="0197654321"
                  value={form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  maxLength={10}
                  className={inputClass + ' rounded-l-none border-0'}
                />
              </div>
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

            <div className="relative">
              <label className={labelClass}>Mot de passe</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <label className={labelClass}>Confirmer le mot de passe</label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                name="password_confirm"
                value={form.password_confirm}
                onChange={handleChange}
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

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

            {error ? (
              <div className="w-full rounded-xl bg-red-100 border border-red-400 text-red-700 text-center text-sm font-medium italic px-4 py-3 min-h-[44px] flex items-center justify-center">
                {error}
              </div>
            ) : success ? (
              <div className="w-full rounded-xl bg-green-100 border border-green-400 text-green-700 text-center text-sm font-medium italic px-4 py-3 min-h-[44px] flex items-center justify-center">
                {success}
              </div>
            ) : (
              <div className="w-full rounded-xl bg-gray-400 text-center text-[#0D2B0D] text-sm font-medium italic px-4 py-3 min-h-[44px] flex items-center justify-center">
                Le dossier de vérification sera complété dans le profil mécanicien.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-white hover:text-[#0D2B0D] transition-all shadow-lg mt-2 tracking-wide text-sm"
            >
              {isSubmitting ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </form>

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
                className="inline-flex items-center gap-1 text-[#608C27] font-bold text-sm hover:text-white transition-colors"
              >
                Se connecter <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Inscription;
