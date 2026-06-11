import { useState } from 'react';
import { Search, ArrowLeft, Phone } from 'lucide-react';
import { fetchBreakdownByPhone } from '../lib/api';

const STATUS_LABELS = {
  pending: 'En recherche de mécanicien',
  assigned: 'Mécanicien contacté',
  in_progress: 'Mécanicien en route',
  paid: 'Paiement effectué',
};

const RecupererDemande = ({ onFound, onBack }) => {
  const [phone, setPhone] = useState('01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fullPhone = '+229' + phone;
    if (phone.length !== 10) {
      setError('Le numéro doit contenir exactement 10 chiffres après +229.');
      return;
    }

    setLoading(true);
    try {
      const breakdown = await fetchBreakdownByPhone(fullPhone);
      onFound(breakdown);
    } catch (err) {
      setError(err.message || 'Aucune demande active trouvée pour ce numéro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#608C27] p-4">
      <div className="bg-[#0D2B0D] rounded-3xl shadow-2xl border border-white/10 w-full max-w-md p-8 flex flex-col gap-6">

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-[#608C27] p-4 rounded-full shadow-lg">
            <Search className="text-white w-8 h-8" />
          </div>
          <h2 className="text-white text-xl font-extrabold uppercase tracking-wide">
            Retrouver ma demande
          </h2>
          <p className="text-white/60 text-sm">
            Entrez le numéro utilisé lors de votre demande pour reprendre le suivi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-white/70 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Phone size={12} /> Numéro de téléphone
            </label>
            <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5">
              <span className="bg-[#608C27]/30 text-white font-bold px-3 flex items-center text-sm border-r border-white/10 shrink-0">
                +229
              </span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setPhone(val);
                }}
                maxLength={10}
                placeholder="0101234567"
                className="bg-transparent text-white placeholder-white/30 px-3 py-3 flex-1 outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || phone.length !== 10}
            className="bg-[#608C27] text-white font-bold py-3 rounded-xl hover:bg-[#4a6d1e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Search size={16} />
            )}
            {loading ? 'Recherche…' : 'Retrouver ma demande'}
          </button>
        </form>

        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 text-white/40 text-xs hover:text-white/70 transition-colors"
        >
          <ArrowLeft size={14} /> Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default RecupererDemande;
