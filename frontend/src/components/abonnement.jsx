import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Crown, CheckCircle, Star, Zap, Phone, CreditCard, Loader } from 'lucide-react';
import { createSubscriptionPayment, fetchCurrentUser, fetchPendingSubscriptionPayment, cancelSubscriptionPayment } from '../lib/api';

const PLAN_PRICE = '5 000 FCFA';
const PAYMENT_METHODS = ['MTN Mobile Money', 'Moov Money'];
// Numéros de test sandbox FedaPay (scénario succès) par opérateur
const OPERATOR_TEST_NUMBERS = {
  'MTN Mobile Money': '0166000001',
  'Moov Money': '0164000001',
};
const POLL_INTERVAL_MS = 2000;
const POLL_SLOW_MS = 40000;
const POLL_HARD_STOP_MS = 5 * 60 * 1000;

const PREMIUM_BENEFITS = [
  'Apparaissez en tête des résultats de recherche',
  'Badge "Premium" visible sur votre profil',
  'Priorité dans l\'attribution des demandes de dépannage',
  'Votre numéro de téléphone visible aux clients',
  'Accès aux statistiques détaillées de vos interventions',
];

const Abonnement = ({ onBack, currentUser, onUserUpdated }) => {
  const isPremium = currentUser?.role === 'mechanic_premium';

  const [payerPhone, setPayerPhone] = useState(OPERATOR_TEST_NUMBERS[PAYMENT_METHODS[0]]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (OPERATOR_TEST_NUMBERS[method]) {
      setPayerPhone(OPERATOR_TEST_NUMBERS[method]);
    }
  };
  // 'form' | 'resume' | 'waiting' | 'success' | 'timeout' — 'waiting' dès le retour de FedaPay (?subscription_return=1)
  const [step, setStep] = useState(() =>
    new URLSearchParams(window.location.search).get('subscription_return') === '1' ? 'waiting' : 'form'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumeUrl, setResumeUrl] = useState(null);
  const pollRef = useRef(null);

  // Retour arrière accidentel depuis FedaPay (ou la page en attend) sans avoir
  // fini le checkout : un paiement 'authorized' traîne déjà, on propose de le
  // reprendre plutôt que de laisser resoumettre le formulaire (double transaction).
  useEffect(() => {
    if (isPremium || step !== 'form') return;
    fetchPendingSubscriptionPayment()
      .then((res) => {
        if (res.confirmed) {
          fetchCurrentUser()
            .then((user) => onUserUpdated?.(user))
            .catch(() => {})
            .finally(() => setStep('success'));
        } else if (res.pending && res.payment_url) {
          setResumeUrl(res.payment_url);
          setStep('resume');
        }
      })
      .catch(() => {});
  }, []);

  // Retour de FedaPay : sonde le statut jusqu'à confirmation du webhook.
  // Continue silencieusement en arrière-plan (pas besoin que l'utilisateur
  // actualise) — seul un affichage "ça prend plus de temps" change après 40s,
  // et un vrai abandon n'intervient qu'après POLL_HARD_STOP_MS.
  useEffect(() => {
    if (step !== 'waiting' && step !== 'slow') return;
    window.history.replaceState({}, '', window.location.pathname);

    const startedAt = Date.now();
    const poll = () => {
      fetchCurrentUser()
        .then((user) => {
          if (user.role === 'mechanic_premium') {
            clearInterval(pollRef.current);
            onUserUpdated?.(user);
            setStep('success');
            return;
          }
          const elapsed = Date.now() - startedAt;
          if (elapsed >= POLL_HARD_STOP_MS) {
            setStep('timeout');
            clearInterval(pollRef.current);
          } else if (elapsed >= POLL_SLOW_MS) {
            setStep((s) => (s === 'waiting' ? 'slow' : s));
          }
        })
        .catch(() => {});
    };
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [step === 'waiting' || step === 'slow']);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payment = await createSubscriptionPayment({
        payer_name: currentUser?.full_name || '',
        payer_phone: '+229' + payerPhone,
        payment_method: paymentMethod,
      });
      if (!payment.payment_url) {
        throw new Error("FedaPay n'a pas renvoyé de lien de paiement. Réessayez.");
      }
      localStorage.setItem('meca_dashboard_view', 'abonnement');
      window.location.href = payment.payment_url;
    } catch (err) {
      setError(err.message);
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
                        <span className="font-bold text-sm text-[#0D2B0D] whitespace-nowrap">+229</span>
                        <input
                          type="tel"
                          value={payerPhone}
                          onChange={(e) => setPayerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          maxLength={10}
                          placeholder="0197654321"
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
                            onClick={() => handlePaymentMethodChange(m)}
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

              {step === 'resume' && (
                <div className="flex flex-col items-center gap-6 py-8 text-center">
                  <CreditCard size={56} className="text-[#608C27]" />
                  <div>
                    <p className="text-xl font-bold text-[#0D2B0D] mb-2">Paiement en cours</p>
                    <p className="text-gray-600 text-sm">
                      Vous avez déjà un paiement d'abonnement initié. Reprenez-le là où vous
                      vous étiez arrêté pour finaliser votre passage en Premium.
                    </p>
                  </div>
                  <button
                    onClick={() => { window.location.href = resumeUrl; }}
                    className="w-full bg-[#608C27] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#0D2B0D] transition-all flex items-center justify-center gap-2"
                  >
                    <Crown size={20} /> Finaliser mon paiement
                  </button>
                  <button
                    onClick={() => {
                      cancelSubscriptionPayment().finally(() => setStep('form'));
                    }}
                    className="text-sm text-gray-500 underline hover:text-gray-700"
                  >
                    Annuler et recommencer
                  </button>
                </div>
              )}

              {step === 'waiting' && (
                <div className="flex flex-col items-center gap-6 py-8 text-center">
                  <Loader size={56} className="text-[#608C27] animate-spin" />
                  <div>
                    <p className="text-xl font-bold text-[#0D2B0D] mb-2">Confirmation du paiement…</p>
                    <p className="text-gray-600 text-sm">
                      Nous attendons la confirmation de FedaPay, un instant.
                    </p>
                  </div>
                </div>
              )}

              {step === 'slow' && (
                <div className="flex flex-col items-center gap-6 py-8 text-center">
                  <Loader size={56} className="text-[#608C27] animate-spin" />
                  <div>
                    <p className="text-xl font-bold text-[#0D2B0D] mb-2">Ça prend un peu plus de temps…</p>
                    <p className="text-gray-600 text-sm">
                      FedaPay met plus de temps que prévu à confirmer. Pas besoin d'actualiser,
                      la page se met à jour automatiquement dès que c'est confirmé.
                    </p>
                  </div>
                </div>
              )}

              {step === 'timeout' && (
                <div className="flex flex-col items-center gap-6 py-8 text-center">
                  <Crown size={56} className="text-orange-500" />
                  <div>
                    <p className="text-xl font-bold text-[#0D2B0D] mb-2">Confirmation en attente</p>
                    <p className="text-gray-600 text-sm">
                      FedaPay met vraiment beaucoup de temps à confirmer. Rechargez la page pour
                      vérifier si votre abonnement a été activé, ou réessayez plus tard.
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

              {step === 'success' && (
                <div className="flex flex-col items-center gap-6 py-6 text-center">
                  <CheckCircle size={64} className="text-[#608C27]" />
                  <div>
                    <p className="text-2xl font-bold text-[#0D2B0D]">Félicitations !</p>
                    <p className="text-gray-600 mt-2">
                      Vous êtes maintenant <strong>Mécanicien Premium</strong>.
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
