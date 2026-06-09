import { useEffect, useState } from 'react';
import { CheckCircle, MapPin, Phone, User, Wrench, Navigation } from 'lucide-react';
import { confirmPayment, fetchInterventionForBreakdown } from '../lib/api';
import GeoLabel from './geo_label';

const InfoRow = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#608C27] shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#608C27]">{label}</p>
        <p className="text-sm text-[#0D2B0D] font-medium">{value}</p>
      </div>
    </div>
  );
};

const ConfirmerPaiement = ({ onabout, paymentId, breakdownId, driverLat, driverLon, driverToken }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!paymentId || !breakdownId) return;
    confirmPayment(paymentId, breakdownId, driverToken)
      .catch((err) => setError(err?.message || 'Erreur lors de la confirmation du paiement.'))
      .finally(() => {
        fetchInterventionForBreakdown(breakdownId).then(setData).catch(() => {});
      });
  }, [paymentId, breakdownId, driverToken]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white px-8 py-8 rounded-2xl shadow-2xl flex flex-col items-center gap-5 w-full max-w-md">

        <CheckCircle size={52} className="text-white fill-[#0D2B0D]" strokeWidth={3} />
        <div className="text-center">
          <p className="font-bold text-xl text-[#0D2B0D]">Paiement réussi</p>
          <p className="text-sm text-gray-500 mt-1">Votre mécanicien est en route</p>
        </div>

        {error && (
          <div className="w-full bg-red-50 border border-red-300 rounded-xl p-4 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Carte mécanicien */}
        {data && (
          <div className="w-full bg-[#f0f7e6] border border-[#608C27] rounded-2xl p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#608C27] border-b border-[#608C27]/30 pb-2">
              Votre mécanicien
            </p>
            <InfoRow
              icon={<User size={16} />}
              label="Nom"
              value={data.mechanic_name}
            />
            <InfoRow
              icon={<Phone size={16} />}
              label="Téléphone"
              value={
                data.mechanic_phone
                  ? <a href={`tel:${data.mechanic_phone}`} className="hover:text-[#608C27] transition-colors">{data.mechanic_phone}</a>
                  : null
              }
            />
            <InfoRow
              icon={<Wrench size={16} />}
              label="Type de panne"
              value={data.breakdown_type}
            />
            <InfoRow
              icon={<Wrench size={16} />}
              label="Description"
              value={data.breakdown_description}
            />
            <div className="flex items-start gap-3">
              <div className="text-[#608C27] shrink-0 mt-0.5"><MapPin size={16} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#608C27]">Position mécanicien</p>
                <p className="text-sm text-[#0D2B0D] font-medium">
                  <GeoLabel lat={data.mechanic_latitude} lon={data.mechanic_longitude} fallback={data.mechanic_city} />
                </p>
              </div>
            </div>
            {data.assignment_distance_km && (
              <InfoRow
                icon={<Navigation size={16} />}
                label="Distance estimée"
                value={`${parseFloat(data.assignment_distance_km).toFixed(2)} km`}
              />
            )}
          </div>
        )}

        {/* Votre position */}
        {(driverLat || driverLon) && (
          <div className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-blue-200 pb-2 mb-3">
              Votre position
            </p>
            <div className="flex items-center gap-2 text-blue-900 text-sm font-medium">
              <MapPin size={15} className="text-blue-500 flex-shrink-0" />
              <GeoLabel lat={driverLat} lon={driverLon} />
            </div>
          </div>
        )}

        <button
          onClick={onabout}
          className="w-full bg-[#608C27] text-white py-3 rounded-xl font-bold hover:bg-[#0D2B0D] transition-colors"
        >
          OK — Continuer
        </button>

      </div>
    </div>
  );
};

export default ConfirmerPaiement;
