import { useState } from 'react';
import { createPayment } from '../lib/api';

const OPERATORS = [
  { value: '', label: 'Choisir un opérateur' },
  { value: 'MTN Mobile Money', label: 'MTN Mobile Money' },
  { value: 'Moov Money', label: 'Moov Money' },
  { value: 'Celtiis Cash', label: 'Celtiis Cash' },
  { value: 'Carte Bancaire', label: 'Carte Bancaire' },
];

const Paiement = ({ onPayerClick, payerName, amount, breakdownId, driverToken }) => {
  const [operator, setOperator] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('01');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePayer = async () => {
    setError('');

    if (!operator) {
      setError('Veuillez sélectionner un moyen de paiement.');
      return;
    }
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 8) {
      setError('Veuillez entrer un numéro de téléphone valide (8 chiffres minimum).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payment = await createPayment({
        payer_name: payerName || 'Conducteur',
        payer_phone: `+229${phoneNumber.replace(/\D/g, '')}`,
        amount: amount || 15000,
        payment_method: operator,
        payment_for: 'intervention',
        breakdown_request: breakdownId || null,
        driver_token: driverToken || null,
      });
      onPayerClick(payment);
    } catch (err) {
      setError(err.message || 'Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#608C27] p-4">
      <div className="bg-[#0D2B0D] p-12 rounded-lg shadow-sm w-full max-w-2xl min-h-[400px] flex flex-col justify-center">

        <div className="flex justify-center mb-10">
          <h2 className="bg-[#608C27] text-white text-2xl font-bold px-12 py-2 rounded-full shadow-md">
            Paiement
          </h2>
        </div>

        {amount ? (
          <p className="text-center text-white font-bold text-lg mb-6">
            Montant : {amount.toLocaleString('fr-FR')} FCFA
          </p>
        ) : null}

        <div className="space-y-6">

          {/* Opérateur */}
          <div>
            <label className="block text-white/70 text-[11px] font-bold uppercase tracking-widest mb-2 pl-1">
              Moyen de paiement
            </label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full bg-gray-200 px-4 py-3 rounded-xl border-none outline-none text-gray-800 font-semibold text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-[#608C27] transition-all"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value} disabled={op.value === ''}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Numéro */}
          <div>
            <label className="block text-white/70 text-[11px] font-bold uppercase tracking-widest mb-2 pl-1">
              Votre numéro
            </label>
            <div className="flex items-center bg-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#608C27] transition-all">
              <div className="flex items-center gap-2 border-r border-gray-400 pr-3 mr-3 shrink-0">
                <span className="text-xl">🇧🇯</span>
                <span className="font-bold text-gray-700 text-sm">+229</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={10}
                className="bg-transparent w-full outline-none text-gray-800 font-semibold text-sm placeholder-gray-500"
                placeholder="0197654321"
              />
            </div>
          </div>

          {error && (
            <div className="w-full rounded-xl bg-gray-400 text-center text-[#0D2B0D] text-sm font-medium italic px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={handlePayer}
            disabled={isSubmitting}
            className="w-full bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-white hover:text-[#0D2B0D] transition-all shadow-lg tracking-wide text-sm disabled:opacity-60 mt-2"
          >
            {isSubmitting ? 'Traitement...' : 'Confirmer le paiement'}
          </button>

        </div>
      </div>
    </div>
  );
};

export default Paiement;
