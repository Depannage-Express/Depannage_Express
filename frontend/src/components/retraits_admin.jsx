import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle, TrendingDown, Phone } from 'lucide-react';
import { fetchAdminWithdrawals, processWithdrawal, fetchAdminMomoChanges, processAdminMomoChange } from '../lib/api';

const STATUS_TABS = [
  { value: 'pending',  label: 'En attente' },
  { value: 'approved', label: 'Approuvés' },
  { value: 'rejected', label: 'Refusés' },
];

const MAIN_TABS = [
  { value: 'withdrawals', label: 'Retraits' },
  { value: 'momo_changes', label: 'Changements numéro' },
];

const RetraitsAdmin = ({ onBack }) => {
  const [mainTab, setMainTab] = useState('withdrawals');

  // --- Retraits ---
  const [activeTab, setActiveTab] = useState('pending');
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [feedback, setFeedback] = useState('');

  const load = async (status) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminWithdrawals(status);
      setWithdrawals(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const withdrawalsIntervalRef = useRef(null);
  const momoIntervalRef = useRef(null);
  const POLL_INTERVAL_MS = 4000;

  useEffect(() => {
    if (mainTab !== 'withdrawals') return;

    load(activeTab);
    withdrawalsIntervalRef.current = setInterval(() => load(activeTab), POLL_INTERVAL_MS);
    return () => clearInterval(withdrawalsIntervalRef.current);
  }, [activeTab, mainTab]);

  const handleProcess = async (id, action) => {
    setProcessing(id + '_' + action);
    setFeedback('');
    try {
      await processWithdrawal(id, action, adminNotes[id] || '');
      setFeedback(action === 'approve' ? 'Retrait approuvé.' : 'Retrait refusé — solde restitué.');
      await load(activeTab);
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setProcessing(null);
    }
  };

  // --- Changements numéro MoMo ---
  const [momoTab, setMomoTab] = useState('pending');
  const [momoChanges, setMomoChanges] = useState([]);
  const [momoLoading, setMomoLoading] = useState(true);
  const [momoError, setMomoError] = useState('');
  const [momoProcessing, setMomoProcessing] = useState(null);
  const [momoNotes, setMomoNotes] = useState({});
  const [momoFeedback, setMomoFeedback] = useState('');

  const loadMomo = async (status) => {
    setMomoLoading(true);
    setMomoError('');
    try {
      const data = await fetchAdminMomoChanges(status);
      setMomoChanges(Array.isArray(data) ? data : []);
    } catch (e) {
      setMomoError(e.message);
    } finally {
      setMomoLoading(false);
    }
  };

  useEffect(() => {
    if (mainTab !== 'momo_changes') return;

    loadMomo(momoTab);
    momoIntervalRef.current = setInterval(() => loadMomo(momoTab), POLL_INTERVAL_MS);
    return () => clearInterval(momoIntervalRef.current);
  }, [momoTab, mainTab]);

  const handleMomoProcess = async (id, action) => {
    setMomoProcessing(id + '_' + action);
    setMomoFeedback('');
    try {
      await processAdminMomoChange(id, action, momoNotes[id] || '');
      setMomoFeedback(action === 'approve' ? 'Changement approuvé — numéro mis à jour.' : 'Demande refusée.');
      await loadMomo(momoTab);
    } catch (e) {
      setMomoFeedback(e.message);
    } finally {
      setMomoProcessing(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-[#0D2B0D]">
      <div className="bg-[#0D2B0D] p-6 flex items-center justify-between">
        <button onClick={onBack} className="text-white hover:text-[#608C27] flex items-center gap-2 font-bold">
          <ArrowLeft size={24} /> Retour
        </button>
        <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-3">
          <TrendingDown className="text-[#608C27]" /> Retraits mécaniciens
        </h2>
        <div className="w-24" />
      </div>

      {/* Onglets principaux */}
      <div className="flex border-b-2 border-gray-200">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setMainTab(tab.value); setFeedback(''); setMomoFeedback(''); }}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              mainTab === tab.value ? 'bg-[#0D2B0D] text-[#608C27]' : 'text-[#0D2B0D] hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Onglet Retraits ─── */}
      {mainTab === 'withdrawals' && <>
        <div className="flex border-b border-gray-200">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 py-3 text-sm font-bold transition-all ${
                activeTab === tab.value ? 'bg-[#608C27] text-white' : 'text-[#0D2B0D] hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-[300px]">
          {feedback && <div className="bg-[#0D2B0D] text-white text-sm font-bold px-4 py-3 rounded-xl text-center">{feedback}</div>}
          {loading && <p className="text-center text-gray-500 py-8">Chargement…</p>}
          {error && <p className="text-center text-red-600 py-4">{error}</p>}
          {!loading && !error && withdrawals.length === 0 && (
            <p className="text-center text-gray-500 py-8 italic">Aucun retrait dans cette catégorie.</p>
          )}
          {withdrawals.map(w => (
          <div key={w.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="font-bold text-[#0D2B0D] text-lg">{w.mechanic_name}</p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Montant :</span> {parseFloat(w.amount).toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Frais :</span> {parseFloat(w.fee).toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-sm text-[#608C27] font-bold">
                  À envoyer : {parseFloat(w.net_amount).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Réseau :</span> {w.momo_provider === 'mtn' ? 'MTN Mobile Money' : 'Moov Money'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Numéro :</span>{' '}
                  <span className="font-mono text-[#0D2B0D] font-bold">{w.momo_number}</span>
                </p>
                {w.reason && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Motif :</span> {w.reason}
                  </p>
                )}
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} /> {new Date(w.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>

            {w.status === 'pending' && (
              <div className="bg-gray-50 border-t border-gray-200 p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Note admin (optionnel — visible du mécanicien si refus)"
                  value={adminNotes[w.id] || ''}
                  onChange={e => setAdminNotes(prev => ({ ...prev, [w.id]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27]"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleProcess(w.id, 'approve')}
                    disabled={!!processing}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#608C27] hover:bg-[#4a6e1e] text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-60"
                  >
                    <CheckCircle size={18} />
                    {processing === w.id + '_approve' ? 'Traitement…' : 'Approuver'}
                  </button>
                  <button
                    onClick={() => handleProcess(w.id, 'reject')}
                    disabled={!!processing}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-60"
                  >
                    <XCircle size={18} />
                    {processing === w.id + '_reject' ? 'Traitement…' : 'Refuser'}
                  </button>
                </div>
              </div>
            )}

            {w.status !== 'pending' && (
              <div className={`border-t px-5 py-3 flex items-center gap-2 text-sm font-bold ${
                w.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {w.status === 'approved' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {w.status === 'approved' ? 'Approuvé' : 'Refusé'}
                {w.processed_at && (
                  <span className="ml-auto text-xs font-normal opacity-70">
                    {new Date(w.processed_at).toLocaleString('fr-FR')}
                  </span>
                )}
                {w.admin_note && (
                  <span className="ml-2 text-xs font-normal">— {w.admin_note}</span>
                )}
              </div>
            )}
          </div>
          ))}
        </div>
      </>}

      {/* ─── Onglet Changements numéro MoMo ─── */}
      {mainTab === 'momo_changes' && <>
        <div className="flex border-b border-gray-200">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setMomoTab(tab.value)}
              className={`flex-1 py-3 text-sm font-bold transition-all ${
                momoTab === tab.value ? 'bg-[#608C27] text-white' : 'text-[#0D2B0D] hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-[300px]">
          {momoFeedback && <div className="bg-[#0D2B0D] text-white text-sm font-bold px-4 py-3 rounded-xl text-center">{momoFeedback}</div>}
          {momoLoading && <p className="text-center text-gray-500 py-8">Chargement…</p>}
          {momoError && <p className="text-center text-red-600 py-4">{momoError}</p>}
          {!momoLoading && !momoError && momoChanges.length === 0 && (
            <p className="text-center text-gray-500 py-8 italic">Aucune demande dans cette catégorie.</p>
          )}

          {momoChanges.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 space-y-2">
                <p className="font-bold text-[#0D2B0D] text-lg">{r.mechanic_name}</p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone size={14} className="text-[#608C27]" />
                  <span className="font-semibold">Nouveau numéro demandé :</span>
                  <span className="font-mono font-bold text-[#0D2B0D]">{r.new_number}</span>
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} /> {new Date(r.created_at).toLocaleString('fr-FR')}
                </p>
              </div>

              {r.status === 'pending' && (
                <div className="bg-gray-50 border-t border-gray-200 p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Note admin (optionnel)"
                    value={momoNotes[r.id] || ''}
                    onChange={e => setMomoNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27]"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleMomoProcess(r.id, 'approve')}
                      disabled={!!momoProcessing}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#608C27] hover:bg-[#4a6e1e] text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-60"
                    >
                      <CheckCircle size={18} />
                      {momoProcessing === r.id + '_approve' ? 'Traitement…' : 'Approuver'}
                    </button>
                    <button
                      onClick={() => handleMomoProcess(r.id, 'reject')}
                      disabled={!!momoProcessing}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-60"
                    >
                      <XCircle size={18} />
                      {momoProcessing === r.id + '_reject' ? 'Traitement…' : 'Refuser'}
                    </button>
                  </div>
                </div>
              )}

              {r.status !== 'pending' && (
                <div className={`border-t px-5 py-3 flex items-center gap-2 text-sm font-bold ${
                  r.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {r.status === 'approved' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {r.status === 'approved' ? 'Approuvé — numéro mis à jour' : 'Refusé'}
                  {r.processed_at && (
                    <span className="ml-auto text-xs font-normal opacity-70">
                      {new Date(r.processed_at).toLocaleString('fr-FR')}
                    </span>
                  )}
                  {r.admin_note && <span className="ml-2 text-xs font-normal">— {r.admin_note}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </>}
    </div>
  );
};

export default RetraitsAdmin;
