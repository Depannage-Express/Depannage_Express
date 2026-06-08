import { useState } from 'react';
import { requestOTP, verifyOTP } from '../lib/api';

const STATUS_LABELS = {
  pending: 'En attente',
  assigned: 'Mécanicien assigné',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const INTERVENTION_LABELS = {
  pending_acceptance: "En attente d'acceptation",
  accepted: 'Acceptée',
  refused: 'Refusée',
  in_progress: 'En cours',
  completed: 'Terminée',
  paid: 'Payée',
  reviewed: 'Évaluée',
  cancelled: 'Annulée',
};

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-800',
  reviewed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-gray-100 text-gray-700',
  pending_acceptance: 'bg-gray-100 text-gray-700',
  refused: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistoryList({ data, onBack }) {
  return (
    <div className="min-h-screen bg-[#608C27] flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <button
          onClick={onBack}
          className="mb-6 text-white font-semibold hover:underline flex items-center gap-2"
        >
          ← Retour
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#0D2B0D] mb-1">Mon historique</h2>
          <p className="text-slate-600 text-sm">
            {data.driver_name} — {data.driver_phone}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            {data.count} demande{data.count !== 1 ? 's' : ''} trouvée{data.count !== 1 ? 's' : ''}
          </p>
        </div>

        {data.count === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-slate-500">
            Aucune demande enregistrée pour ce numéro.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.history.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-md p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-[#0D2B0D] text-lg capitalize">
                      {item.breakdown_type || 'Panne non précisée'}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">{formatDate(item.date)}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>

                <div className="text-sm text-slate-700 space-y-1 mb-3">
                  <p>
                    <span className="font-medium">Véhicule :</span> {item.vehicle_description}
                  </p>
                  {item.address_description && (
                    <p>
                      <span className="font-medium">Lieu :</span> {item.address_description}
                    </p>
                  )}
                </div>

                {item.intervention ? (
                  <div className="border-t pt-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">Intervention</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[item.intervention.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {INTERVENTION_LABELS[item.intervention.status] || item.intervention.status}
                      </span>
                    </div>
                    {item.intervention.mechanic_name && (
                      <p className="text-slate-600">
                        <span className="font-medium">Mécanicien :</span>{' '}
                        {item.intervention.mechanic_name}
                      </p>
                    )}
                    {item.intervention.final_cost && (
                      <p className="text-slate-600">
                        <span className="font-medium">Coût :</span>{' '}
                        <span className="text-[#608C27] font-bold">
                          {Number(item.intervention.final_cost).toLocaleString('fr-FR')} FCFA
                        </span>
                      </p>
                    )}
                    {!item.intervention.final_cost && item.intervention.estimated_cost && (
                      <p className="text-slate-600">
                        <span className="font-medium">Coût estimé :</span>{' '}
                        {Number(item.intervention.estimated_cost).toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                    {item.intervention.completed_at && (
                      <p className="text-slate-500 text-xs">
                        Terminée le {formatDate(item.intervention.completed_at)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="border-t pt-3 text-xs text-slate-400 italic">
                    Aucune intervention associée.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoriqueOTP({ onBack }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('01');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyData, setHistoryData] = useState(null);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (phone.trim().length !== 10) {
      setError('Entrez votre numéro de téléphone (10 chiffres).');
      return;
    }
    setLoading(true);
    try {
      const res = await requestOTP('+229' + phone.trim());
      if (res.otp_code) setDevCode(res.otp_code);
      setStep('code');
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi du code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Entrez le code reçu par SMS.');
      return;
    }
    setLoading(true);
    try {
      const data = await verifyOTP('+229' + phone.trim(), code.trim());
      setHistoryData(data);
    } catch (err) {
      setError(err.message || 'Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  if (historyData) {
    return <HistoryList data={historyData} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen bg-[#608C27] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <button
          onClick={onBack}
          className="text-[#608C27] font-semibold hover:underline text-sm mb-6 flex items-center gap-1"
        >
          ← Retour
        </button>

        <h2 className="text-2xl font-bold text-[#0D2B0D] mb-2">Mon historique</h2>
        <p className="text-slate-500 text-sm mb-6">
          {step === 'phone'
            ? 'Entrez le numéro utilisé lors de vos demandes de dépannage.'
            : `Un code à 6 chiffres a été envoyé au +229${phone}.`}
        </p>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Numéro de téléphone
              </label>
              <div className="flex items-center border border-slate-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-[#608C27]">
                <span className="font-bold text-slate-700 text-sm mr-3 whitespace-nowrap">+229</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  placeholder="0197654321"
                  className="flex-1 outline-none text-slate-800 bg-transparent"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#608C27] text-white font-bold py-3 rounded-lg hover:bg-[#0D2B0D] transition-colors disabled:opacity-60"
            >
              {loading ? 'Envoi en cours...' : 'Recevoir le code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Code reçu par SMS
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 text-center text-2xl tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-[#608C27]"
              />
            </div>

            {devCode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800">
                <span className="font-bold">Mode démo —</span> votre code : <span className="font-mono font-bold">{devCode}</span>
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#608C27] text-white font-bold py-3 rounded-lg hover:bg-[#0D2B0D] transition-colors disabled:opacity-60"
            >
              {loading ? 'Vérification...' : 'Voir mon historique'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setCode('');
                setError('');
                setDevCode('');
              }}
              className="w-full text-slate-500 text-sm hover:text-slate-700 underline"
            >
              Changer de numéro
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
