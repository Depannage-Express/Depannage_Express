import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { loginMechanic, setAuthTokens } from '../lib/api';

const Connexion = ({
  onInscriptionClick,
  onLoginClick,
  title = 'Connexion',
  submitLabel = 'Connexion',
  hideSignup = false,
  loginGuard,
}) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const authPayload = await loginMechanic({ email, password });
      if (loginGuard) {
        loginGuard(authPayload);
      }
      setAuthTokens(authPayload);
      onLoginClick(authPayload);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClass = "block text-white/70 text-[11px] font-bold uppercase tracking-widest mb-1 pl-1";
  const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-200 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#608C27] font-semibold text-sm transition-all";

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="bg-[#0D2B0D] w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white/10">

        {/* Titre */}
        <div className="flex justify-center mb-10">
          <h2 className="bg-[#608C27] text-white text-xl font-bold px-12 py-2 rounded-full shadow-md tracking-wide">
            {title}
          </h2>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              placeholder="exemple@mail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <div className="w-full rounded-xl bg-red-100 border border-red-400 text-red-700 text-center text-sm font-medium italic px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-white hover:text-[#0D2B0D] transition-all shadow-lg tracking-wide text-sm mt-2"
          >
            {isSubmitting ? `${submitLabel}...` : submitLabel}
          </button>
        </form>

        {/* Lien vers Inscription */}
        {!hideSignup && (
          <div className="mt-7">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-white/40 text-xs font-medium">ou</span>
              <div className="flex-1 h-px bg-white/15" />
            </div>
            <div className="mt-5 text-center">
              <p className="text-white/50 text-xs mb-2">Pas encore inscrit ?</p>
              <button
                onClick={onInscriptionClick}
                className="inline-flex items-center gap-1 text-[#608C27] font-bold text-sm hover:text-white transition-colors"
              >
                Créer un compte <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Connexion;
