import { useEffect, useState } from 'react';
import { CheckCircle, Phone } from 'lucide-react';
import { confirmPayment, fetchInterventionForBreakdown } from '../lib/api';

const ConfirmerPaiement = ({ onabout, paymentId, breakdownId }) => {
  const [mechanicPhone, setMechanicPhone] = useState(null);

  useEffect(() => {
    if (!paymentId || !breakdownId) return;
    confirmPayment(paymentId, breakdownId).catch(() => {});
  }, [paymentId, breakdownId]);

  useEffect(() => {
    if (!breakdownId) return;
    fetchInterventionForBreakdown(breakdownId)
      .then((data) => {
        if (data?.mechanic_phone) setMechanicPhone(data.mechanic_phone);
      })
      .catch(() => {});
  }, [breakdownId]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white px-12 py-10 rounded-xl shadow-2xl flex flex-col items-center gap-4">

        <CheckCircle
          size={50}
          className="text-white fill-[#0D2B0D] mb-2"
          strokeWidth={3}
        />
        <p className="text-center font-medium text-lg">Paiement réussi avec succès</p>
        <p className="text-center font-bold">
          Statut : <span className="text-[#608C27] font-bold ml-2">Accepté</span>
        </p>

        {mechanicPhone && (
          <div className="mt-2 bg-[#f0f7e6] border border-[#608C27] rounded-xl px-6 py-4 flex flex-col items-center gap-2 w-full">
            <p className="text-sm text-gray-600 font-medium">Numéro de votre mécanicien</p>
            <div className="flex items-center gap-2">
              <Phone size={20} className="text-[#608C27]" />
              <a
                href={`tel:${mechanicPhone}`}
                className="text-[#0D2B0D] font-bold text-lg hover:text-[#608C27] transition-colors"
              >
                {mechanicPhone}
              </a>
            </div>
            <p className="text-xs text-gray-400">Appelez-le directement pour coordination</p>
          </div>
        )}

        <button
          onClick={onabout}
          className="mt-2 bg-[#608C27] text-white px-10 py-2 rounded-lg font-semibold hover:bg-[#0D2B0D] transition-colors"
        >
          OK
        </button>

      </div>
    </div>
  );
};

export default ConfirmerPaiement;
