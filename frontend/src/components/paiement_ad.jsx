import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, ArrowLeft, User, UserCheck, Wrench, Tag } from 'lucide-react';
import { fetchAdminPayments, fetchAdminPaymentStats } from '../lib/api';

const STATUS_CONFIG = {
  pending:    { label: 'En attente',  bg: 'bg-yellow-100', text: 'text-yellow-700' },
  authorized: { label: 'Autorisé',    bg: 'bg-blue-100',   text: 'text-blue-700'   },
  paid:       { label: 'Payé',        bg: 'bg-green-100',  text: 'text-green-700'  },
  failed:     { label: 'Échoué',      bg: 'bg-red-100',    text: 'text-red-700'    },
  refunded:   { label: 'Remboursé',   bg: 'bg-purple-100', text: 'text-purple-700' },
  cancelled:  { label: 'Annulé',      bg: 'bg-gray-100',   text: 'text-gray-500'   },
};

const FILTERS = [
  { key: 'all',        label: 'Tous' },
  { key: 'paid',       label: 'Payés' },
  { key: 'authorized', label: 'Autorisés' },
  { key: 'pending',    label: 'En attente' },
  { key: 'failed',     label: 'Échoués' },
];

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');
const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

const GestionPaiements = ({ onBack }) => {
  const [payments, setPayments]         = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]             = useState('');

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchAdminPaymentStats();
      setStats(data);
    } catch {}
  }, []);

  const loadPayments = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const data = await fetchAdminPayments(params);
      setPayments(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (err) {
      if (!silent) setError(err.message || 'Erreur de chargement');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadPayments();
    loadStats();
    const interval = setInterval(() => {
      loadPayments({ silent: true });
      loadStats();
    }, 4000);
    return () => clearInterval(interval);
  }, [loadPayments, loadStats]);

  return (
    <div className="min-h-screen bg-gray-200 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#0D2B0D] rounded-t-[1.5rem] p-4">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-white text-sm font-bold hover:text-[#608C27] transition-colors shrink-0"
          >
            <ArrowLeft size={16} /> Retour
          </button>
        )}
        <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight italic flex-1 text-center">
          Gestion des Paiements
        </h2>
      </div>

      <div className="bg-white rounded-b-[1.5rem] p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-black uppercase text-green-700 tracking-wide">Total encaissé</p>
            <p className="text-lg font-black text-green-800 mt-1">
              {fmt(stats?.total_paid)} <span className="text-xs">FCFA</span>
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-black uppercase text-purple-700 tracking-wide">Commission plateforme</p>
            <p className="text-lg font-black text-purple-800 mt-1">
              {fmt(stats?.total_commission)} <span className="text-xs">FCFA</span>
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-black uppercase text-blue-700 tracking-wide">Revenu net</p>
            <p className="text-lg font-black text-blue-800 mt-1">
              {fmt(stats?.total_net)} <span className="text-xs">FCFA</span>
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-black uppercase text-yellow-700 tracking-wide">Payées</p>
            <p className="text-3xl font-black text-yellow-800 mt-1">{stats?.count_paid ?? '—'}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-black uppercase text-gray-700 tracking-wide">Taux commission</p>
            <p className="text-lg font-black text-gray-800 mt-1">
              {stats?.platform_commission_rate ? `${(stats.platform_commission_rate * 100).toFixed(0)}%` : '—'}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-black uppercase text-red-700 tracking-wide">Échouées</p>
            <p className="text-3xl font-black text-red-800 mt-1">{stats?.count_failed ?? '—'}</p>
          </div>
        </div>

        {/* Filtres + Recherche */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === f.key
                    ? 'bg-[#0D2B0D] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Référence ou nom conducteur…"
              className="w-full bg-gray-50 border rounded-xl p-2 text-xs outline-none pr-7"
            />
            <Search className="absolute right-2 top-2.5 text-gray-400" size={13} />
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <p className="text-red-700 text-sm font-bold">{error}</p>
            <button
              onClick={() => { loadPayments(); loadStats(); }}
              className="flex items-center gap-1 bg-red-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold hover:bg-red-700 transition-colors shrink-0"
            >
              <RefreshCw size={12} /> Réessayer
            </button>
          </div>
        )}

        {/* Spinner */}
        {loading && !error && (
          <p className="text-center text-gray-400 text-sm py-12 animate-pulse">
            Chargement des transactions…
          </p>
        )}

        {/* Vide */}
        {!loading && !error && payments.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">
            Aucune transaction pour le moment.
          </p>
        )}

        {/* Liste transactions */}
        {!loading && !error && payments.length > 0 && (
          <div className="space-y-3">
            {payments.map(t => {
              const cfg = STATUS_CONFIG[t.status] ?? { label: t.status, bg: 'bg-gray-100', text: 'text-gray-600' };
              return (
                <div
                  key={t.id}
                  className="bg-white border border-gray-100 rounded-[1.5rem] shadow p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <p className="font-black text-xs sm:text-sm uppercase italic">
                        {t.payment_for === 'premium_subscription'
                          ? 'Abonnement Premium'
                          : 'Intervention Mécanique'}
                      </p>
                      <div className="text-xs mt-2 space-y-1 text-gray-600">
                        {t.driver_name && (
                          <p className="flex items-center gap-1">
                            <User size={12} /> <span className="font-bold text-blue-600">Conducteur :</span>{' '}
                            {t.driver_name}
                          </p>
                        )}
                        {t.mechanic_name && (
                          <p className="flex items-center gap-1">
                            <UserCheck size={12} /> <span className="font-bold text-yellow-600">Mécanicien :</span>{' '}
                            {t.mechanic_name}
                          </p>
                        )}
                        {t.breakdown_type && (
                          <p className="flex items-center gap-1">
                            <Wrench size={12} /> <span className="font-bold">Type de panne :</span>{' '}
                            {t.breakdown_type}
                          </p>
                        )}
                        {t.provider_reference && (
                          <p className="flex items-center gap-1">
                            <Tag size={12} /> <span className="font-bold">Référence :</span>{' '}
                            <span className="font-mono">{t.provider_reference}</span>
                          </p>
                        )}
                      </div>
                      <p className="font-black text-base text-black mt-2">
                        {fmt(t.amount)} FCFA
                      </p>
                      {t.commission_amount != null && t.net_amount != null && (
                        <div className="mt-2 space-y-1 text-xs text-gray-600">
                          <p className="flex items-center justify-between gap-2">
                            <span>Commission</span>
                            <span className="font-bold">{fmt(t.commission_amount)} FCFA</span>
                          </p>
                          <p className="flex items-center justify-between gap-2">
                            <span>Net reçu</span>
                            <span className="font-black text-gray-900">{fmt(t.net_amount)} FCFA</span>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="sm:text-right shrink-0 space-y-1">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}
                      >
                        {cfg.label}
                      </span>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {fmtDate(t.created_at)}
                      </p>
                      {t.paid_at && (
                        <p className="text-[10px] text-green-600 font-bold">
                          Payé le {fmtDate(t.paid_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionPaiements;
