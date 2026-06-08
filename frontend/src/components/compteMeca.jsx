import { useEffect, useState } from 'react';
import { User, History, ArrowDownCircle, ArrowLeft, CheckCircle, MapPin, LocateFixed, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { fetchCurrentUser, fetchMechanicProfile, updateMyMechanicLocation, fetchMechanicWallet, createWithdrawalRequest } from '../lib/api';

const MonCompte = ({onBack}) => {
  const [notifSucces, setNotifSucces] = useState(false);
  const [profil, setProfil] = useState(null);
  const [profileDetails, setProfileDetails] = useState(null);
  const [error, setError] = useState('');
  const [gpsUpdating, setGpsUpdating] = useState(false);
  const [gpsMessage, setGpsMessage] = useState('');

  // Wallet
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);

  // Withdrawal form
  const [wAmount, setWAmount] = useState('');
  const [wMomoNumber, setWMomoNumber] = useState('');
  const [wMomoProvider, setWMomoProvider] = useState('mtn');
  const [wReason, setWReason] = useState('');
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState('');

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [user, mechanicProfile] = await Promise.all([
          fetchCurrentUser(),
          fetchMechanicProfile().catch(() => null),
        ]);
        setProfil(user);
        setProfileDetails(mechanicProfile);
      } catch (requestError) {
        setError(requestError.message);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (!profileDetails || profileDetails?.status !== 'approved') {
      setWalletLoading(false);
      return;
    }
    fetchMechanicWallet()
      .then(data => setWallet(data))
      .catch(() => {})
      .finally(() => setWalletLoading(false));
  }, [profileDetails]);

  const balance = wallet ? parseFloat(wallet.balance) : 0;
  const fee = wAmount ? Math.floor(parseFloat(wAmount) * 0.0025) : 0;
  const net = wAmount ? parseFloat(wAmount) - fee : 0;

  const handleRetrait = async (e) => {
    e.preventDefault();
    setWError('');
    const amount = parseFloat(wAmount);
    if (!amount || amount <= 0) { setWError('Montant invalide.'); return; }
    if (amount > balance) { setWError('Solde insuffisant.'); return; }
    if (!wMomoNumber.trim()) { setWError('Numéro MoMo obligatoire.'); return; }
    setWLoading(true);
    try {
      await createWithdrawalRequest({
        amount: Math.round(amount),
        momo_number: wMomoNumber.trim(),
        momo_provider: wMomoProvider,
        reason: wReason.trim(),
      });
      setNotifSucces(true);
      setWAmount('');
      setWMomoNumber('');
      setWReason('');
      setTimeout(() => setNotifSucces(false), 4000);
      const updated = await fetchMechanicWallet();
      setWallet(updated);
    } catch (err) {
      setWError(err.message);
    } finally {
      setWLoading(false);
    }
  };

  const handleUpdateGps = () => {
    if (!navigator.geolocation) { setGpsMessage('Géolocalisation non disponible.'); return; }
    setGpsUpdating(true);
    setGpsMessage('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await updateMyMechanicLocation(
            pos.coords.latitude.toFixed(6),
            pos.coords.longitude.toFixed(6),
          );
          setGpsMessage('Position mise à jour avec succès.');
        } catch (e) {
          setGpsMessage(e.message);
        } finally {
          setGpsUpdating(false);
        }
      },
      () => { setGpsMessage('Impossible d\'obtenir votre position.'); setGpsUpdating(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const statusColor = (s) => {
    if (s === 'approved') return 'text-green-600';
    if (s === 'rejected') return 'text-red-500';
    return 'text-yellow-500';
  };
  const statusLabel = (s) => {
    if (s === 'approved') return 'Approuvé';
    if (s === 'rejected') return 'Refusé';
    if (s === 'paid') return 'Crédité';
    return 'En attente';
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-8 rounded-2xl">
      <div className="bg-[#0D2B0D] p-6 flex items-center justify-between rounded-2xl">
        <button onClick={onBack} className="text-white hover:text-[#608C27] flex items-center gap-2 font-bold">
          <ArrowLeft size={24} /> Retour
        </button>
        <h2 className="text-white text-xl font-bold uppercase tracking-widest">Mon Compte</h2>
        <div className="w-10"></div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- BLOC PROFIL --- */}
        <div className="space-y-6 mt-8">
          <div className="bg-white p-6 rounded-3xl shadow-lg border-t-4 border-[#608C27] flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4 border-4 border-[#0D2B0D]">
              <User size={64} className="text-[#0D2B0D]" />
            </div>
            <h3 className="text-xl font-bold text-[#0D2B0D]">Profil</h3>
          </div>

          <div className="bg-[#D9D9D9] p-6 rounded-3xl shadow-md space-y-3">
            {error ? <p className="text-red-700 font-medium">{error}</p> : null}
            <p className="text-black font-bold">Nom: <span className="font-medium">{profil?.full_name || '-'}</span></p>
            <p className="text-black font-bold">Tel: <span className="font-medium">{profil?.phone || '-'}</span></p>
            <p className="text-black font-bold">Email: <span className="font-medium">{profil?.email || '-'}</span></p>
            <p className="text-black font-bold">Rôle: <span className="font-medium">{profil?.role || '-'}</span></p>
            <p className="text-black font-bold">Spécialité: <span className="font-medium">{profileDetails?.specialties?.map((item) => item.name).join(', ') || 'Non renseigné'}</span></p>
            <p className="text-black font-bold">Ville: <span className="font-medium">{profileDetails?.city || '-'}</span></p>
            <p className="text-black font-bold">Statut profil: <span className="font-medium">{profileDetails?.status || 'En attente de création'}</span></p>
            {profileDetails?.latitude && profileDetails?.longitude && (
              <p className="text-black font-bold text-xs">GPS: <span className="font-mono font-normal">{parseFloat(profileDetails.latitude).toFixed(4)}, {parseFloat(profileDetails.longitude).toFixed(4)}</span></p>
            )}
          </div>

          {/* Mise à jour GPS */}
          {profileDetails?.status === 'approved' && (
            <div className="bg-white p-4 rounded-3xl shadow-md border-l-4 border-[#608C27]">
              <p className="text-sm font-bold text-[#0D2B0D] mb-1 flex items-center gap-2">
                <MapPin size={15} className="text-[#608C27]" /> Ma position de travail
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Mettez à jour votre position depuis votre atelier pour apparaître aux bons conducteurs.
              </p>
              <button
                onClick={handleUpdateGps}
                disabled={gpsUpdating}
                className="w-full flex items-center justify-center gap-2 bg-[#608C27] text-white text-sm font-bold py-3 rounded-2xl hover:bg-[#0D2B0D] transition-all disabled:opacity-60"
              >
                <LocateFixed size={15} />
                {gpsUpdating ? 'Localisation en cours…' : 'Mettre à jour ma position GPS'}
              </button>
              {gpsMessage && (
                <p className={`text-xs mt-2 text-center font-medium ${gpsMessage.includes('succès') ? 'text-green-600' : 'text-red-500'}`}>
                  {gpsMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {/* --- BLOC SOLDE ET RETRAIT --- */}
        <div className="space-y-6 mt-8">
          <div className="bg-[#0D2B0D] p-8 rounded-3xl shadow-xl text-white text-center">
            <p className="text-sm opacity-60 mb-1 break-all">Id : {profil?.id || '-'}</p>
            <p className="text-xs opacity-40 mb-3 uppercase tracking-widest">Solde disponible</p>
            {walletLoading ? (
              <p className="text-3xl font-bold opacity-50">…</p>
            ) : (
              <h3 className="text-3xl font-bold text-[#608C27]">
                {balance.toLocaleString('fr-FR')} <span className="text-lg">FCFA</span>
              </h3>
            )}
          </div>

          {profileDetails?.status === 'approved' && (
            <form onSubmit={handleRetrait} className="bg-white p-6 rounded-3xl shadow-lg border-2 border-gray-100">
              <h4 className="text-[#0D2B0D] font-bold text-center mb-6 text-xl">Formulaire de retrait</h4>
              <div className="space-y-4">

                <div className="flex justify-between items-center bg-gray-100 p-3 rounded-xl">
                  <span className="font-bold text-[#0D2B0D]">Montant :</span>
                  <input
                    type="number"
                    placeholder="20000"
                    value={wAmount}
                    onChange={e => setWAmount(e.target.value)}
                    className="bg-transparent outline-none text-right w-28 font-bold"
                    min="500"
                    max={balance}
                  />
                </div>

                <div className="flex justify-between items-center bg-gray-100 p-3 rounded-xl">
                  <span className="font-bold text-[#0D2B0D]">Réseau :</span>
                  <select
                    value={wMomoProvider}
                    onChange={e => setWMomoProvider(e.target.value)}
                    className="bg-transparent outline-none text-right font-medium"
                  >
                    <option value="mtn">MTN MoMo</option>
                    <option value="moov">Moov Money</option>
                  </select>
                </div>

                <div className="flex justify-between items-center bg-gray-100 p-3 rounded-xl">
                  <span className="font-bold text-[#0D2B0D]">Numéro MoMo :</span>
                  <input
                    type="tel"
                    placeholder="+22901XXXXXXXX"
                    value={wMomoNumber}
                    onChange={e => setWMomoNumber(e.target.value)}
                    className="bg-transparent outline-none text-right w-36 font-medium"
                  />
                </div>

                <div className="flex justify-between items-center bg-gray-100 p-3 rounded-xl">
                  <span className="font-bold text-[#0D2B0D]">Motif :</span>
                  <input
                    type="text"
                    placeholder="Optionnel"
                    value={wReason}
                    onChange={e => setWReason(e.target.value)}
                    className="bg-transparent outline-none text-right w-28 font-medium"
                  />
                </div>

                {wAmount && parseFloat(wAmount) > 0 && (
                  <div className="text-center py-2 bg-green-50 rounded-lg space-y-1">
                    <p className="text-[#608C27] font-bold">Frais (0,25 %) : {fee.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-[#0D2B0D] font-bold text-sm">Vous recevrez : {net.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                )}

                {wError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                    <AlertCircle size={16} /> {wError}
                  </div>
                )}

                <div className="relative pt-4">
                  {notifSucces && (
                    <div className="absolute -top-6 left-0 flex items-center gap-1 text-green-600 font-bold animate-bounce">
                      <CheckCircle size={16} /> Demande envoyée — l'admin va traiter votre retrait
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={wLoading}
                    className="w-full bg-[#0D2B0D] text-white py-4 rounded-2xl font-bold text-xl hover:bg-[#608C27] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <ArrowDownCircle size={24} /> {wLoading ? 'Traitement…' : 'Retrait'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* --- BLOC HISTORIQUE --- */}
        <div className="bg-[#D9D9D9] rounded-3xl shadow-lg flex flex-col h-fit overflow-hidden border-2 border-[#0D2B0D] mt-8">
          <div className="bg-[#0D2B0D] text-white p-4 flex items-center justify-center gap-2">
            <History size={24} />
            <h3 className="text-xl font-bold">Historique</h3>
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto scrollbar-hide">
            {walletLoading ? (
              <p className="text-center text-gray-600 italic text-sm py-6">Chargement…</p>
            ) : !wallet || wallet.history.length === 0 ? (
              <p className="text-center text-gray-600 italic text-sm py-6">Aucun historique disponible.</p>
            ) : wallet.history.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'credit'
                      ? <TrendingUp size={18} className="text-green-600 shrink-0" />
                      : <TrendingDown size={18} className="text-red-500 shrink-0" />
                    }
                    <div>
                      <p className="text-xs font-bold text-[#0D2B0D] leading-tight">{item.label}</p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {item.date ? new Date(item.date).toLocaleString('fr-FR') : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${item.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                      {item.type === 'credit' ? '+' : '-'}{parseFloat(item.amount).toLocaleString('fr-FR')} F
                    </p>
                    <p className={`text-[10px] font-semibold ${statusColor(item.status)}`}>
                      {statusLabel(item.status)}
                    </p>
                  </div>
                </div>
                {item.type === 'debit' && item.status === 'pending' && (
                  <p className="text-[10px] text-yellow-600 mt-1 font-medium">En attente de validation admin</p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MonCompte;
