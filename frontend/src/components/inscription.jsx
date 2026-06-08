import { useState } from 'react';
import { Upload, Phone, KeyRound, RefreshCcw } from 'lucide-react';
import { registerMechanic, setAuthTokens, requestPhoneOtp, verifyPhoneOtp } from '../lib/api';

const Inscription = ({ onInfo, onSignUpClick, onRegisterSuccess }) => {
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [verifyToken, setVerifyToken] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fullPhone = '+229' + form.phone;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePhoneChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setForm((f) => ({ ...f, phone: digits }));
  };

  // Étape 1 : valider le form et demander l'OTP
  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Prénom et nom sont obligatoires.');
      return;
    }
    if (!form.phone || form.phone.replace(/\D/g, '').length < 8) {
      setError('Entrez un numéro de téléphone valide (au moins 8 chiffres).');
      return;
    }
    if (!form.email.trim()) {
      setError('Email obligatoire.');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (form.password !== form.password_confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPhoneOtp(fullPhone);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renvoyer le code
  const handleResendOtp = async () => {
    setError('');
    setOtpCode('');
    try {
      await requestPhoneOtp(fullPhone);
    } catch (err) {
      setError(err.message);
    }
  };

  // Étape 2 : vérifier l'OTP puis créer le compte
  const handleVerifyAndRegister = async (event) => {
    event.preventDefault();
    setError('');

    const code = otpCode.replace(/\D/g, '');
    if (code.length < 4) {
      setError('Entrez le code reçu par SMS.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Vérifier l'OTP → obtenir verify_token
      const otpRes = await verifyPhoneOtp(fullPhone, code);
      const token = otpRes.verify_token;
      setVerifyToken(token);

      // Créer le compte avec le token de vérification
      const authPayload = await registerMechanic({
        ...form,
        phone: fullPhone,
        role: 'mechanic_standard',
        phone_verify_token: token,
      });
      setAuthTokens(authPayload);
      setSuccess('Compte créé. Complétez ensuite le profil mécanicien et les justificatifs.');
      if (onRegisterSuccess) {
        onRegisterSuccess(authPayload);
      } else if (onInfo) {
        onInfo();
      }
    } catch (err) {
      setError(err.message);
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

          {/* ─── Étape 1 : formulaire ─── */}
          {step === 'form' && (
            <form className="space-y-4" onSubmit={handleRequestOtp}>

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
                <div className="w-full rounded-xl bg-red-100 border border-red-400 text-red-700 text-center text-sm font-medium italic px-4 py-3">
                  {error}
                </div>
              ) : (
                <div className="w-full rounded-xl bg-gray-400 text-center text-[#0D2B0D] text-sm font-medium italic px-4 py-3">
                  Le dossier de vérification sera complété dans le profil mécanicien.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-white hover:text-[#0D2B0D] transition-all shadow-lg mt-2 tracking-wide text-sm flex items-center justify-center gap-2"
              >
                <Phone size={16} />
                {isSubmitting ? 'Envoi du code…' : 'Vérifier mon numéro →'}
              </button>
            </form>
          )}

          {/* ─── Étape 2 : saisie OTP ─── */}
          {step === 'otp' && (
            <form className="space-y-5" onSubmit={handleVerifyAndRegister}>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="bg-[#608C27]/20 rounded-full p-4">
                    <KeyRound size={32} className="text-[#608C27]" />
                  </div>
                </div>
                <p className="text-white font-bold text-base">Vérification du numéro</p>
                <p className="text-white/60 text-sm mt-1">
                  Un code a été envoyé par SMS au
                </p>
                <p className="text-[#608C27] font-bold text-sm">{fullPhone}</p>
              </div>

              <div>
                <label className={labelClass}>Code reçu par SMS</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                  className={inputClass + ' text-center text-2xl tracking-[0.5em] font-black'}
                />
              </div>

              {error && (
                <div className="w-full rounded-xl bg-red-100 border border-red-400 text-red-700 text-center text-sm font-medium italic px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || otpCode.length < 4}
                className="w-full bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-white hover:text-[#0D2B0D] transition-all shadow-lg tracking-wide text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Vérification…' : 'Confirmer et créer le compte'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setError(''); setOtpCode(''); }}
                  className="text-white/50 text-xs hover:text-white transition-colors"
                >
                  ← Modifier mes infos
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-[#608C27] text-xs font-bold flex items-center gap-1 hover:text-white transition-colors"
                >
                  <RefreshCcw size={12} /> Renvoyer le code
                </button>
              </div>
            </form>
          )}

          {/* Séparateur + lien connexion */}
          {step === 'form' && (
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
          )}

        </div>
      </div>
    </div>
  );
};

export default Inscription;
