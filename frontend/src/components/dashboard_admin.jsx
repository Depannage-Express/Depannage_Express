import { useEffect, useRef, useState } from 'react';
import Utilisateurs from './utilisateurs';
import Signalements from './signal';
import GestionPaiements from './paiement_ad';
import Abonnements from './aboonnements';
import SupervisionInterventions from './supervisions_interv';
import GestionAvis from './gestion_avis';
import AdminMessages from './admin_messages';
import RetraitsAdmin from './retraits_admin';
import {
  LayoutDashboard, Users, Activity, UserCircle, CreditCard,
  Bell, Star, MessageSquareText, ArrowDownCircle,
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  LogOut, Menu, Wrench, ClipboardList,
} from 'lucide-react';
import { fetchAdminStats, fetchAdminIncidentStats } from '../lib/api';

const POLL_INTERVAL_MS = 4_000;

const DashboardAdmin = ({ onLogout }) => {
  const [view, setView] = useState('menu');
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const intervalRef = useRef(null);
  const clockRef = useRef(null);
  const viewRef = useRef('menu');

  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  const setViewSafe = (v) => {
    viewRef.current = v;
    setView(v);
    setSidebarOpen(false);
  };

  const loadDashboard = async ({ silent = false } = {}) => {
    if (silent && viewRef.current !== 'menu') return;
    if (!silent) setIsLoading(true);
    try {
      const [statsRes, incidentRes] = await Promise.allSettled([
        fetchAdminStats(),
        fetchAdminIncidentStats(),
      ]);
      let data = statsRes.status === 'fulfilled' ? statsRes.value : null;
      if (incidentRes.status === 'fulfilled') {
        data = { ...(data || {}), reports: { pending_count: incidentRes.value.pending || 0 } };
      }
      setStats(data);
    } catch (requestError) {
      if (!silent) setError(requestError.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    intervalRef.current = setInterval(() => loadDashboard({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  const pendingRetraits = (stats?.withdrawals?.pending_count || 0) + (stats?.momo_changes?.pending_count || 0);

  const navItems = [
    { id: 'menu',        label: 'Tableau de bord',  Icon: LayoutDashboard,  badge: 0 },
    { id: 'utilisateurs',label: 'Utilisateurs',      Icon: Users,            badge: stats?.mechanics?.by_status?.pending || 0 },
    { id: 'interve',     label: 'Interventions',     Icon: Activity,         badge: stats?.breakdowns?.by_status?.pending || 0 },
    { id: 'abonnements', label: 'Abonnements',       Icon: UserCircle,       badge: stats?.subscriptions?.pending_count || 0 },
    { id: 'paieadmin',   label: 'Paiements',         Icon: CreditCard,       badge: stats?.payments?.pending_count || 0 },
    { id: 'signal',      label: 'Signalements',      Icon: Bell,             badge: stats?.reports?.pending_count || 0 },
    { id: 'avis',        label: 'Gestion des avis',  Icon: Star,             badge: 0 },
    { id: 'messages',    label: 'Messages',          Icon: MessageSquareText,badge: 0 },
    { id: 'retraits',    label: 'Retraits',          Icon: ArrowDownCircle,  badge: pendingRetraits },
  ];

  const pageTitles = {
    menu:         'Tableau de bord',
    utilisateurs: 'Utilisateurs',
    interve:      'Interventions',
    abonnements:  'Abonnements premium',
    paieadmin:    'Paiements',
    signal:       'Signalements',
    avis:         'Gestion des avis',
    messages:     'Messages',
    retraits:     'Retraits',
  };

  const renderSubview = () => {
    switch (view) {
      case 'utilisateurs': return <Utilisateurs onBack={() => setViewSafe('menu')} />;
      case 'interve':      return <SupervisionInterventions onBack={() => setViewSafe('menu')} />;
      case 'abonnements':  return <Abonnements onBack={() => setViewSafe('menu')} />;
      case 'paieadmin':    return <GestionPaiements onBack={() => setViewSafe('menu')} />;
      case 'signal':       return <Signalements onBack={() => setViewSafe('menu')} />;
      case 'avis':         return <GestionAvis onBack={() => setViewSafe('menu')} />;
      case 'messages':     return <AdminMessages onBack={() => setViewSafe('menu')} />;
      case 'retraits':     return <RetraitsAdmin onBack={() => setViewSafe('menu')} />;
      default:             return null;
    }
  };

  const fmtTime = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate = (d) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex">

      {/* Overlay mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed top-0 left-0 h-screen w-[220px] bg-[#0D2B0D] flex flex-col z-30
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#608C27] rounded-lg flex items-center justify-center shrink-0">
              <Wrench size={15} className="text-white" />
            </div>
            <div className="leading-none">
              <p className="text-white font-black text-sm">Dépannage</p>
              <p className="text-[#608C27] text-[11px] font-semibold">Express Admin</p>
            </div>
          </div>
        </div>

        {/* Nav links — entièrement scrollable */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
          {navItems.map(({ id, label, Icon, badge }) => {
            const isActive = view === id;
            return (
              <button
                key={id}
                onClick={() => setViewSafe(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-[13px] font-medium
                  ${isActive
                    ? 'bg-[#608C27] text-white'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'}
                `}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Identité admin — dans le scroll, ne concurrence plus le footer */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-7 h-7 bg-[#608C27]/30 rounded-full flex items-center justify-center shrink-0">
                <UserCircle size={15} className="text-[#608C27]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">Administrateur</p>
                <p className="text-white/40 text-[10px]">Super admin</p>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="lg:ml-[220px] flex-1 flex flex-col min-w-0">

        {/* ── HEADER ── */}
        <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
          >
            <Menu size={20} />
          </button>

          <h1 className="text-[#1a1a2e] font-bold text-[15px] flex-1">
            {pageTitles[view] ?? 'Tableau de bord'}
          </h1>

          <div className="hidden md:flex flex-col items-end leading-none gap-0.5">
            <span className="text-[#1a1a2e] text-[13px] font-semibold tabular-nums">{fmtTime(now)}</span>
            <span className="text-gray-400 text-[10px] capitalize">{fmtDate(now)}</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 transition-all"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          )}
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 p-5 min-w-0">
          {view === 'menu' ? (
            <div className="space-y-6">

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="space-y-6">
                  {[4, 4, 3].map((cols, si) => (
                    <div key={si} className={`grid grid-cols-2 lg:grid-cols-${cols} gap-4`}>
                      {Array.from({ length: cols }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl h-[88px] animate-pulse" />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* ── SECTION 1 : Finances & Alertes ── */}
                  <section>
                    <SectionLabel>Finances &amp; Alertes prioritaires</SectionLabel>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Revenue — occupe 2 colonnes desktop */}
                      <div className="col-span-2">
                        <KpiCard card={{
                          label: 'Revenus encaissés',
                          value: stats ? `${(stats.payments?.total_revenue_xof || 0).toLocaleString('fr-FR')} XOF` : '—',
                          Icon: TrendingUp,
                          color: 'text-white',
                          bg: 'bg-[#608C27]/20',
                          hero: true,
                        }} />
                      </div>
                      <KpiCard card={{
                        label: 'Signalements en attente',
                        value: stats?.reports?.pending_count ?? '—',
                        Icon: AlertTriangle,
                        color: 'text-red-500',
                        bg: 'bg-red-50',
                        alert: (stats?.reports?.pending_count || 0) > 0,
                      }} />
                      <KpiCard card={{
                        label: 'Retraits en attente',
                        value: pendingRetraits,
                        Icon: ArrowDownCircle,
                        color: 'text-orange-500',
                        bg: 'bg-orange-50',
                        alert: pendingRetraits > 0,
                      }} />
                    </div>
                  </section>

                  {/* ── SECTION 2 : Communauté ── */}
                  <section>
                    <SectionLabel>Communauté</SectionLabel>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <KpiCard card={{
                        label: 'Conducteurs inscrits',
                        value: stats?.users?.total ?? '—',
                        Icon: Users,
                        color: 'text-blue-500',
                        bg: 'bg-blue-50',
                      }} />
                      <KpiCard card={{
                        label: 'Mécaniciens actifs',
                        value: stats?.mechanics?.by_status?.approved ?? '—',
                        Icon: Wrench,
                        color: 'text-emerald-500',
                        bg: 'bg-emerald-50',
                      }} />
                      <KpiCard card={{
                        label: 'Profils en attente',
                        value: stats?.mechanics?.by_status?.pending ?? '—',
                        Icon: Clock,
                        color: 'text-amber-500',
                        bg: 'bg-amber-50',
                        alert: (stats?.mechanics?.by_status?.pending || 0) > 0,
                      }} />
                      <KpiCard card={{
                        label: 'Abonnements en attente',
                        value: stats?.subscriptions?.pending_count ?? '—',
                        Icon: UserCircle,
                        color: 'text-violet-500',
                        bg: 'bg-violet-50',
                        alert: (stats?.subscriptions?.pending_count || 0) > 0,
                      }} />
                    </div>
                  </section>

                  {/* ── SECTION 3 : Activité ── */}
                  <section>
                    <SectionLabel>Activité</SectionLabel>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <KpiCard card={{
                        label: 'Demandes totales',
                        value: stats?.breakdowns?.total ?? '—',
                        Icon: ClipboardList,
                        color: 'text-violet-500',
                        bg: 'bg-violet-50',
                      }} />
                      <KpiCard card={{
                        label: 'Interventions terminées',
                        value: stats?.breakdowns?.by_status?.completed ?? '—',
                        Icon: CheckCircle,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                      }} />
                      <KpiCard card={{
                        label: 'Paiements en attente',
                        value: stats?.payments?.pending_count ?? '—',
                        Icon: CreditCard,
                        color: 'text-orange-500',
                        bg: 'bg-orange-50',
                        alert: (stats?.payments?.pending_count || 0) > 0,
                      }} />
                    </div>
                  </section>
                </>
              )}
            </div>
          ) : (
            renderSubview()
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer className="bg-white border-t border-gray-200 px-5 py-3 mt-auto">
          <p className="text-[11px] text-gray-400 text-center">
            © {new Date().getFullYear()} Dépannage Express · Panneau d'administration
          </p>
        </footer>

      </div>
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <p className="text-[11px] font-bold uppercase tracking-widest text-[#6b7280] mb-3">{children}</p>
);

const KpiCard = ({ card }) => {
  const { Icon, label, value, color, bg, alert, hero } = card;

  if (hero) {
    return (
      <div className="bg-[#0D2B0D] rounded-xl p-5 shadow-sm h-full flex items-center gap-4 border border-[#608C27]/30">
        <div className="w-12 h-12 bg-[#608C27]/20 rounded-full flex items-center justify-center shrink-0">
          <Icon size={22} className="text-[#608C27]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/60 text-[11px] font-semibold uppercase tracking-wide leading-tight">
            {label}
          </p>
          <p className="text-[#608C27] text-[28px] font-black mt-0.5 leading-none truncate">
            {value}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border transition-shadow hover:shadow-md ${alert ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center shrink-0`}>
          <Icon size={18} className={color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#6b7280] text-[11px] font-semibold uppercase tracking-wide leading-tight">
            {label}
          </p>
          <p className={`text-[26px] font-black mt-0.5 leading-none ${alert ? 'text-red-600' : 'text-[#1a1a2e]'}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
