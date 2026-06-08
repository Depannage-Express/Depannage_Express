import { useEffect, useState } from 'react';
import { User, History, ArrowDownCircle, ArrowLeft, CheckCircle, MapPin, LocateFixed, TrendingUp, TrendingDown, Clock, AlertCircle, Phone, Edit2 } from 'lucide-react';
import { fetchCurrentUser, fetchMechanicProfile, updateMyMechanicLocation, fetchMechanicWallet, createWithdrawalRequest, fetchMyMomoChangeRequests, createMomoChangeRequest } from '../lib/api';

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
  const [wMomoProvider, setWMomoProvider] = useState('mtn');
  const [wReason, setWReason] = useState('');
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState('');

  // MoMo change request
  const [momoRequests, setMomoRequests] = useState([]);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [newMomoNumber, setNewMomoNumber] = useState('01');
  const [momoChangeLoading, setMomoChangeLoading] = useState(false);
  const [momoChangeError, setMomoChangeError] = useState('');
  const [momoChangeSent, setMomoChangeSent] = useState(false);

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
    fetchMyMomoChangeRequests()
      .then(data => setMomoRequests(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [profileDetails]);

  const balance = wallet ? parseFloat(wallet.balance) : 0;
  const withdrawalNumber = wallet?.withdrawal_number || profil?.phone || '';
  const lockoutUntil = wallet?.lockout_until ? new Date(wallet.lockout_until) : null;
  const isLocked = lockoutUntil && lockoutUntil > new Date();
  const fee = wAmount ? Math.floor(parseFloat(wAmount) * 0.0075) : 0;
  const net = wAmount ? parseFloat(wAmount) : 0;
  const totalDeducted = net + fee;
  const hasPendingMomoChange = momoRequests.some(r => r.status === 'pending');

  const handleRetrait = async (e) => {
    e.preventDefault();
    setWError('');
    const amount = parseFloat(wAmount);
    if (!amount || amount < 2000) { setWError('Montant minimum : 2 000 FCFA.'); return; }
    if (isLocked) { setWError('Retrait bloqué 72h après changement de numéro.'); return; }
    const feeCalc = Math.floor(amount * 0.0075);
    if (amount + feeCalc > balance) { setWError('Solde insuffisant (montant + frais).'); return; }
    if (!wMomoNumber.trim()) { setWError('Numéro MoMo obligatoire.'); return; }
    setWLoading(true);
    try {
      await createWithdrawalRequest({
        amount: Math.round(amount),
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

  const handleMomoChangeRequest = async (e) => {
    e.preventDefault();
    setMomoChangeError('');
    if (newMomoNumber.trim().length !== 10) {
      setMomoChangeError('Numéro invalide (10 chiffres requis).'); return;
    }
    setMomoChangeLoading(true);
    try {
      await createMomoChangeRequest('+229' + newMomoNumber.trim());
      setMomoChangeSent(true);
      setShowChangeForm(false);
      setNewMomoNumber('01');
      const updated = await fetchMyMomoChangeRequests();
      setMomoRequests(Array.isArray(updated) ? updated : []);
    } catch (err) {
      setMomoChangeError(err.message);
    } finally {
      setMomoChangeLoading(false);
    }
  };

  const handleUpdateGps = () => {
    if (!navigator.geolocation) { setGpsMessage('Géolocalisation non disponible.'); return; }
    setGpsUpdating(true);
    setGpsMessage('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const updated = await updateMyMechanicLocation(
            pos.coords.latitude.toFixed(6),
            pos.coords.longitude.toFixed(6),
          );
          setProfileDetails(updated);
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
            <div className="w-32 h-32 rounded-full mb-4 border-4 border-[#0D2B0D] overflow-hidden bg-gray-200 flex items-center justify-center">
              {profileDetails?.profile_photo || profil?.mechanic_profile_photo
                ? <img src={profileDetails?.profile_photo || profil?.mechanic_profile_photo} alt="Photo profil" className="w-full h-full object-cover" />
                : <User size={64} className="text-[#0D2B0D]" />}
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
            <p className="text-xs opacity-40 uppercase tracking-widest mb-1">Votre identifiant</p>
            <p className="text-3xl font-black tracking-[0.3em] text-[#608C27] mb-3">
              {profileDetails?.short_id || '—'}
            </p>
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
            <>
              {/* Numéro MoMo enregistré */}
              <div className="bg-white p-5 rounded-3xl shadow-lg border-2 border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[#0D2B0D] font-bold flex items-center gap-2">
                    <Phone size={16} className="text-[#608C27]" /> Numéro MoMo de retrait
                  </p>
                  {!hasPendingMomoChange && (
                    <button
                      onClick={() => { setShowChangeForm(v => !v); setMomoChangeError(''); setMomoChangeSent(false); }}
                      className="text-xs text-[#608C27] hover:text-[#0D2B0D] flex items-center gap-1 font-bold"
                    >
                      <Edit2 size={13} /> Modifier
                    </button>
                  )}
                </div>
                <p className="font-mono text-xl font-bold text-[#0D2B0D] text-center py-2 bg-gray-50 rounded-xl">
                  {walletLoading ? '…' : (withdrawalNumber || '—')}
                </p>
                {isLocked && (
                  <p className="text-xs text-orange-600 font-semibold mt-2 text-center">
                    Retraits bloqués jusqu'au {lockoutUntil.toLocaleString('fr-FR')} (72h après changement)
                  </p>
                )}
                {hasPendingMomoChange && (
                  <p className="text-xs text-yellow-600 font-semibold mt-2 text-center flex items-center justify-center gap-1">
                    <Clock size={12} /> Demande de changement en attente de validation admin
                  </p>
                )}
                {momoChangeSent && (
                  <p className="text-xs text-green-600 font-semibold mt-2 text-center flex items-center justify-center gap-1">
                    <CheckCircle size={12} /> Demande envoyée — l'admin va valider
                  </p>
                )}

                {showChangeForm && (
                  <form onSubmit={handleMomoChangeRequest} className="mt-4 space-y-3 border-t pt-4">
                    <p className="text-xs text-gray-500 text-center">
                      Après approbation, un délai de <strong>72h</strong> s'applique avant tout retrait.
                    </p>
                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl">
                      <span className="text-sm font-bold text-[#0D2B0D] whitespace-nowrap">+229</span>
                      <input
                        type="tel"
                        value={newMomoNumber}
                        onChange={e => setNewMomoNumber(e.target.value)}
                        maxLength={10}
                        className="bg-transparent outline-none flex-1 font-medium"
                        placeholder="0197654321"
                      />
                    </div>
                    {momoChangeError && (
                      <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} /> {momoChangeError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={momoChangeLoading}
                      className="w-full bg-[#608C27] text-white py-2 rounded-xl font-bold text-sm hover:bg-[#0D2B0D] transition-all disabled:opacity-60"
                    >
                      {momoChangeLoading ? 'Envoi…' : 'Envoyer la demande'}
                    </button>
                  </form>
                )}
              </div>

              {/* Formulaire de retrait */}
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
                      min="2000"
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
                    <span className="font-bold text-[#0D2B0D]">Motif :</span>
                    <input
                      type="text"
                      placeholder="Optionnel"
                      value={wReason}
                      onChange={e => setWReason(e.target.value)}
                      className="bg-transparent outline-none text-right w-28 font-medium"
                    />
                  </div>

                  {wAmount && parseFloat(wAmount) >= 2000 && (
                    <div className="text-center py-2 bg-green-50 rounded-lg space-y-1">
                      <p className="text-[#608C27] font-bold">Frais (0,75 %) : {fee.toLocaleString('fr-FR')} FCFA</p>
                      <p className="text-[#0D2B0D] font-bold text-sm">Vous recevrez : {net.toLocaleString('fr-FR')} FCFA</p>
                      <p className="text-gray-500 text-xs">Total débité du solde : {totalDeducted.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  )}

                  {wError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                      <AlertCircle size={16} /> {wError}
                    </div>
                  )}

                  {isLocked && (
                    <div className="flex items-center gap-2 text-orange-600 text-sm bg-orange-50 p-3 rounded-xl">
                      <AlertCircle size={16} /> Retraits bloqués — changement de numéro récent (72h)
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
                      disabled={wLoading || isLocked}
                      className="w-full bg-[#0D2B0D] text-white py-4 rounded-2xl font-bold text-xl hover:bg-[#608C27] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <ArrowDownCircle size={24} /> {wLoading ? 'Traitement…' : 'Retrait'}
                    </button>
                  </div>
                </div>
              </form>
            </>
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
