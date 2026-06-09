import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Eye, Loader, RefreshCcw, User } from 'lucide-react';
import { fetchAdminUsers, fetchAdminPayments } from '../lib/api';

const POLL_INTERVAL_MS = 4_000;

const STATUS_LABEL = {
  authorized: { text: 'En attente',  cls: 'bg-yellow-100 text-yellow-700' },
  paid:       { text: 'Payé',        cls: 'bg-green-100 text-green-700' },
  pending:    { text: 'En cours',    cls: 'bg-blue-100 text-blue-700' },
  failed:     { text: 'Échoué',      cls: 'bg-red-100 text-red-700' },
  refunded:   { text: 'Remboursé',   cls: 'bg-gray-100 text-gray-700' },
};

const Abonnements = ({ onBack }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const pollRef = useRef(null);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const [usersData, paymentsData] = await Promise.all([
        fetchAdminUsers('mechanic_premium'),
        fetchAdminPayments(),
      ]);
      const userList = Array.isArray(usersData) ? usersData : (usersData?.results ?? []);
      const payList = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.results ?? []);
      setSubscribers(userList);
      setPayments(payList.filter(p => p.payment_for === 'premium_subscription'));
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  const formatDate = (dt) =>
    dt ? new Date(dt).toLocaleString('fr-FR') : '—';

  const formatAmount = (amount) =>
    amount ? `${Number(amount).toLocaleString('fr-FR')} XOF` : '—';

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">

      <div className="bg-[#0D2B0D] text-white p-4 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-white text-sm font-bold hover:text-[#608C27] transition-colors shrink-0">
            ← Retour
          </button>
        )}
        <h2 className="text-xl sm:text-3xl font-bold flex-1 text-center">Liste Abonnés Premium</h2>
        <button
          onClick={() => load()}
          className="text-white hover:text-[#608C27] transition-colors shrink-0"
          title="Actualiser"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="p-4 sm:p-6 md:p-10">

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader className="text-[#608C27] animate-spin" size={28} />
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-center text-red-700">{error}</div>
        )}

        {!isLoading && !error && (
          <>
            {/* SECTION 1: LISTE ABONNÉS */}
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 shadow-md mb-6">
              <h2 className="text-lg font-black uppercase mb-4 tracking-tighter">
                Abonnés actifs ({subscribers.length})
              </h2>
              {subscribers.length === 0 ? (
                <p className="text-center text-sm text-gray-400 italic py-4">Aucun abonné premium pour le moment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="text-sm font-bold border-b border-gray-200">
                        <th className="pb-4 px-2">Nom</th>
                        <th className="pb-4 px-2">ID</th>
                        <th className="pb-4 px-2">Téléphone</th>
                        <th className="pb-4 px-2 hidden sm:table-cell">Email</th>
                        <th className="pb-4 px-2 text-center">Actif</th>
                        <th className="pb-4 px-2"></th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {subscribers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-white transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                                {user.mechanic_profile_photo
                                  ? <img src={user.mechanic_profile_photo} alt="" className="w-full h-full object-cover" />
                                  : <User size={16} className="text-gray-500" />}
                              </div>
                              <span className="font-bold">{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '—'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 font-mono text-[#608C27] font-black">{user.mechanic_short_id || user.id.slice(0, 8)}</td>
                          <td className="py-3 px-2 whitespace-nowrap">{user.phone || '—'}</td>
                          <td className="py-3 px-2 hidden sm:table-cell">{user.email || '—'}</td>
                          <td className="py-3 px-2 text-center text-green-600">
                            <Check size={16} className="mx-auto" />
                          </td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                              className="flex items-center gap-1 bg-white px-3 py-1.5 rounded shadow-sm text-xs font-bold hover:bg-gray-100 transition-colors whitespace-nowrap border border-gray-200"
                            >
                              <Eye size={12} />
                              Détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* SECTION 2: PAIEMENTS */}
              <div className="lg:col-span-2 bg-gray-50 rounded-2xl p-4 sm:p-6 shadow-md">
                <h2 className="text-lg font-black uppercase mb-4 tracking-tighter">Paiements & Renouvellements</h2>
                {payments.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 italic py-4">Aucun paiement d'abonnement enregistré.</p>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 border border-white">
                    <h3 className="text-xs font-bold mb-4 uppercase border-b pb-2">Paiements récents</h3>
                    <div className="space-y-4">
                      {payments.slice(0, 10).map((p) => {
                        const cfg = STATUS_LABEL[p.status] || { text: p.status, cls: 'bg-gray-100 text-gray-700' };
                        return (
                          <div key={p.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-white pb-3 last:border-0">
                            <div className="min-w-0">
                              <p className="font-black uppercase text-xs leading-tight">
                                ABONNEMENT PREMIUM — {p.payment_method || 'Mobile Money'}
                              </p>
                              <p className="text-gray-400 italic text-xs mt-1">
                                {p.payer_name || '—'} | {formatAmount(p.amount)} | {formatDate(p.created_at)}
                              </p>
                            </div>
                            <div className="shrink-0">
                              <span className={`px-3 py-1 rounded text-xs font-bold italic whitespace-nowrap ${cfg.cls}`}>
                                [{cfg.text}]
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: SUIVI ABONNÉ SÉLECTIONNÉ */}
              <div className="space-y-4">
                <h2 className="text-lg font-black uppercase tracking-tighter">Suivi & Expirations</h2>

                {expandedId ? (() => {
                  const sub = subscribers.find(u => u.id === expandedId);
                  if (!sub) return null;
                  return (
                    <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-[#608C27]">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-xs uppercase flex items-center gap-1">
                          <Eye size={13} className="text-[#608C27]" />
                          {sub.full_name || sub.email}
                        </h4>
                        <button onClick={() => setExpandedId(null)} className="text-gray-400 hover:text-gray-700">
                          <ChevronUp size={16} />
                        </button>
                      </div>
                      <div className="text-xs leading-relaxed space-y-2">
                        <p><span className="font-bold">Email :</span> {sub.email || '—'}</p>
                        <p><span className="font-bold">Téléphone :</span> {sub.phone || '—'}</p>
                        <p><span className="font-bold">ID :</span> <span className="font-mono text-[#608C27]">{sub.mechanic_short_id || sub.id.slice(0, 8)}</span></p>
                        <p><span className="font-bold">Plan :</span> Premium ★</p>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="bg-white rounded-2xl p-4 shadow-md flex justify-between items-center opacity-80">
                    <p className="text-xs text-gray-500 italic">Cliquez "Détails" sur un abonné pour le voir ici.</p>
                    <ChevronDown size={16} />
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Abonnements;
