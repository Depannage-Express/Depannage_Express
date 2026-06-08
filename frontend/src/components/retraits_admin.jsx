import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle, TrendingDown } from 'lucide-react';
import { fetchAdminWithdrawals, processWithdrawal } from '../lib/api';

const STATUS_TABS = [
  { value: 'pending',  label: 'En attente' },
  { value: 'approved', label: 'Approuvés' },
  { value: 'rejected', label: 'Refusés' },
];

const RetraitsAdmin = ({ onBack }) => {
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

  useEffect(() => { load(activeTab); }, [activeTab]);

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

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              activeTab === tab.value
                ? 'bg-[#608C27] text-white'
                : 'text-[#0D2B0D] hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-[300px]">

        {feedback && (
          <div className="bg-[#0D2B0D] text-white text-sm font-bold px-4 py-3 rounded-xl text-center">
            {feedback}
          </div>
        )}

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
    </div>
  );
};

export default RetraitsAdmin;
