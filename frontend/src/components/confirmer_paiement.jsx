import { useEffect, useState } from 'react';
import { CheckCircle, MapPin, Phone } from 'lucide-react';
import { confirmPayment, fetchInterventionForBreakdown, reverseGeocode } from '../lib/api';

const GeoInfo = ({ lat, lon, label, colorClass }) => {
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    if (!lat || !lon) return;
    reverseGeocode(lat, lon).then(setGeo);
  }, [lat, lon]);

  if (!lat || !lon) return null;

  return (
    <div className={`w-full rounded-xl px-5 py-4 flex flex-col gap-1 border ${colorClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <MapPin size={16} className="flex-shrink-0" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {geo ? (
        <>
          {geo.city && <p className="text-sm"><span className="font-medium">Ville :</span> {geo.city}</p>}
          {geo.neighbourhood && <p className="text-sm"><span className="font-medium">Quartier :</span> {geo.neighbourhood}</p>}
        </>
      ) : (
        <p className="text-xs text-gray-400">Chargement de la localisation...</p>
      )}
      <p className="text-xs text-gray-400 mt-1">{parseFloat(lat).toFixed(5)}, {parseFloat(lon).toFixed(5)}</p>
    </div>
  );
};

const ConfirmerPaiement = ({ onabout, paymentId, breakdownId, driverLat, driverLon }) => {
  const [mechanicPhone, setMechanicPhone] = useState(null);
  const [mechanicLat, setMechanicLat] = useState(null);
  const [mechanicLon, setMechanicLon] = useState(null);

  useEffect(() => {
    if (!paymentId || !breakdownId) return;
    confirmPayment(paymentId, breakdownId).catch(() => {});
  }, [paymentId, breakdownId]);

  useEffect(() => {
    if (!breakdownId) return;
    fetchInterventionForBreakdown(breakdownId)
      .then((data) => {
        if (data?.mechanic_phone) setMechanicPhone(data.mechanic_phone);
        if (data?.mechanic_latitude) setMechanicLat(data.mechanic_latitude);
        if (data?.mechanic_longitude) setMechanicLon(data.mechanic_longitude);
      })
      .catch(() => {});
  }, [breakdownId]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white px-10 py-8 rounded-xl shadow-2xl flex flex-col items-center gap-4 w-full max-w-md">

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
          <div className="mt-1 bg-[#f0f7e6] border border-[#608C27] rounded-xl px-6 py-4 flex flex-col items-center gap-2 w-full">
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

        <div className="w-full flex flex-col gap-3 mt-1">
          <GeoInfo
            lat={driverLat}
            lon={driverLon}
            label="Votre position"
            colorClass="bg-blue-50 border-blue-200 text-blue-900"
          />
          <GeoInfo
            lat={mechanicLat}
            lon={mechanicLon}
            label="Position du mécanicien"
            colorClass="bg-[#f0f7e6] border-[#608C27] text-[#0D2B0D]"
          />
        </div>

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
