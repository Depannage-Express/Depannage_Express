import { useState } from 'react';
import { ArrowLeft, Crown, CheckCircle, Star, Zap, Phone, CreditCard, Loader } from 'lucide-react';
import { createSubscriptionPayment, confirmSubscriptionPayment } from '../lib/api';

const PLAN_PRICE = '5 000 FCFA';
const PAYMENT_METHODS = ['MTN Mobile Money', 'Moov Money'];

const PREMIUM_BENEFITS = [
  'Apparaissez en tête des résultats de recherche',
  'Badge "Premium" visible sur votre profil',
  'Priorité dans l\'attribution des demandes de dépannage',
  'Votre numéro de téléphone visible aux clients',
  'Accès aux statistiques détaillées de vos interventions',
];

const Abonnement = ({ onBack, currentUser }) => {
  const isPremium = currentUser?.role === 'mechanic_premium';

  const [payerPhone, setPayerPhone] = useState(currentUser?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'success'
  const [pendingPaymentId, setPendingPaymentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payment = await createSubscriptionPayment({
        payer_name: currentUser?.full_name || '',
        payer_phone: payerPhone,
        payment_method: paymentMethod,
      });
      setPendingPaymentId(payment.id);
      setStep('confirm');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      await confirmSubscriptionPayment(pendingPaymentId);
      setStep('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-8 rounded-2xl">
      <div className="bg-[#0D2B0D] p-6 flex items-center justify-between rounded-2xl mb-8">
        <button
          onClick={onBack}
          className="text-white hover:text-[#608C27] flex items-center gap-2 font-bold"
        >
          <ArrowLeft size={24} /> Retour
        </button>
        <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-3">
          <Crown size={24} className="text-yellow-400" /> Abonnement Premium
        </h2>
        <div className="w-10" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8">

        {/* Statut actuel */}
        <div className={`rounded-3xl p-6 text-center shadow-lg border-4 ${isPremium ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-200'}`}>
          {isPremium ? (
            <div className="flex flex-col items-center gap-3">
              <Crown size={48} className="text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-700">Vous êtes déjà Mécanicien Premium</p>
              <p className="text-gray-600">Profitez de tous les avantages Premium.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Star size={48} className="text-gray-400" />
              <p className="text-xl font-bold text-[#0D2B0D]">Plan actuel : Standard</p>
              <p className="text-gray-500">Passez Premium pour booster votre activité.</p>
            </div>
          )}
        </div>

        {!isPremium && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Avantages */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border-t-4 border-[#608C27]">
              <h3 className="text-xl font-bold text-[#0D2B0D] mb-4 flex items-center gap-2">
                <Zap size={22} className="text-[#608C27]" /> Avantages Premium
              </h3>
              <ul className="space-y-3">
                {PREMIUM_BENEFITS.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <CheckCircle size={18} className="text-[#608C27] mt-0.5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 bg-[#0D2B0D] text-white text-center py-4 rounded-2xl">
                <p className="text-sm opacity-70">Tarif mensuel</p>
                <p className="text-3xl font-bold">{PLAN_PRICE}</p>
              </div>
            </div>

            {/* Formulaire / Confirmation / Succès */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border-t-4 border-[#0D2B0D]">

              {step === 'form' && (
                <>
                  <h3 className="text-xl font-bold text-[#0D2B0D] mb-6 flex items-center gap-2">
                    <CreditCard size={22} /> Paiement Mobile Money
                  </h3>
                  <form onSubmit={handleSubscribe} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-[#0D2B0D] mb-1">
                        Numéro Mobile Money
                      </label>
                      <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3">
                        <Phone size={18} className="text-[#608C27]" />
                        <input
                          type="tel"
                          value={payerPhone}
                          onChange={(e) => setPayerPhone(e.target.value)}
                          placeholder="ex: 97000000"
                          required
                          className="bg-transparent outline-none flex-1 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#0D2B0D] mb-1">
                        Opérateur
                      </label>
                      <div className="flex gap-3">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPaymentMethod(m)}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                              paymentMethod === m
                                ? 'bg-[#0D2B0D] text-white border-[#0D2B0D]'
                                : 'bg-white text-[#0D2B0D] border-gray-300 hover:border-[#608C27]'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-gray-600">Montant à payer</p>
                      <p className="text-2xl font-bold text-[#608C27]">{PLAN_PRICE}</p>
                    </div>

                    {error && (
                      <p className="text-red-600 font-medium text-sm text-center">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#608C27] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#0D2B0D] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {loading ? <Loader size={20} className="animate-spin" /> : <Crown size={20} />}
                      {loading ? 'Traitement...' : 'S\'abonner au Premium'}
                    </button>
                  </form>
                </>
              )}

              {step === 'confirm' && (
                <div className="flex flex-col items-center gap-6 py-4">
                  <Crown size={56} className="text-yellow-500" />
                  <div className="text-center">
                    <p className="text-xl font-bold text-[#0D2B0D] mb-2">Confirmer le paiement</p>
                    <p className="text-gray-600 text-sm">
                      Validez votre paiement de <strong>{PLAN_PRICE}</strong> via{' '}
                      <strong>{paymentMethod}</strong> au numéro <strong>{payerPhone}</strong>.
                    </p>
                  </div>

                  {error && (
                    <p className="text-red-600 font-medium text-sm text-center">{error}</p>
                  )}

                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="w-full bg-[#608C27] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#0D2B0D] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {loading ? <Loader size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                      {loading ? 'Activation...' : 'Confirmer et activer'}
                    </button>
                    <button
                      onClick={() => { setStep('form'); setError(''); }}
                      className="w-full border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:border-[#0D2B0D] transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center gap-6 py-6 text-center">
                  <CheckCircle size={64} className="text-[#608C27]" />
                  <div>
                    <p className="text-2xl font-bold text-[#0D2B0D]">Félicitations !</p>
                    <p className="text-gray-600 mt-2">
                      Vous êtes maintenant <strong>Mécanicien Premium</strong>.
                      Rechargez la page pour profiter de tous vos avantages.
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-[#0D2B0D] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#608C27] transition-all"
                  >
                    Actualiser
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Abonnement;
