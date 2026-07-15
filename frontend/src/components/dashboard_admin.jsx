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

// Sous-pages admin reflétées dans l'URL, pour que le rechargement et le
// bouton retour du navigateur ramènent sur la bonne section.
// Namespace distinct de '/administrateur' (page de connexion, gérée par App.jsx)
// pour éviter toute collision de route avec le tableau de bord une fois connecté.
const VIEW_TO_PATH = {
  menu:         '/administrateur/tableau-de-bord',
  utilisateurs: '/administrateur/utilisateurs',
  interve:      '/administrateur/interventions',
  abonnements:  '/administrateur/abonnements',
  paieadmin:    '/administrateur/paiements',
  signal:       '/administrateur/signalements',
  avis:         '/administrateur/avis',
  messages:     '/administrateur/messages',
  retraits:     '/administrateur/retraits',
};
const PATH_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([v, p]) => [p, v])
);
const viewFromPath = () => PATH_TO_VIEW[window.location.pathname] || 'menu';

const DashboardAdmin = ({ onLogout }) => {
  const [view, setView] = useState(viewFromPath);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const intervalRef = useRef(null);
  const clockRef = useRef(null);
  const viewRef = useRef(view);

  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  // Au montage (typiquement juste après la connexion), remplace l'entrée
  // d'historique de la page de connexion par celle de la vue courante —
  // sinon "retour" ramène sur l'écran de connexion malgré la session active.
  useEffect(() => {
    const path = VIEW_TO_PATH[viewRef.current] || VIEW_TO_PATH.menu;
    if (window.location.pathname !== path) {
      window.history.replaceState({ adminView: viewRef.current }, '', path);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const restored = viewFromPath();
      viewRef.current = restored;
      setView(restored);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setViewSafe = (v) => {
    viewRef.current = v;
    setView(v);
    setSidebarOpen(false);
    const path = VIEW_TO_PATH[v] || VIEW_TO_PATH.menu;
    if (window.location.pathname !== path) {
      window.history.pushState({ adminView: v }, '', path);
    }
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
    <div className="h-screen flex flex-col bg-[#f0f2f5]">

      {/* Overlay mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── BODY: Sidebar + Main Area ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside className={`
          w-[260px] bg-[#0D2B0D] flex flex-col flex-shrink-0 overflow-y-auto
          fixed inset-y-0 left-0 z-30 lg:relative lg:inset-auto lg:z-auto
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#608C27] rounded-lg flex items-center justify-center shrink-0">
              <Wrench size={18} className="text-white" />
            </div>
            <div className="leading-none">
              <p className="text-white font-black text-base">Dépannage</p>
              <p className="text-[#608C27] text-xs font-semibold mt-0.5">Express Admin</p>
            </div>
          </div>
        </div>

        {/* Nav links — scrollable indépendamment */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ id, label, Icon, badge }) => {
            const isActive = view === id;
            return (
              <button
                key={id}
                onClick={() => setViewSafe(id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm font-medium
                  ${isActive
                    ? 'bg-[#608C27] text-white'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'}
                `}
              >
                <Icon size={18} className="shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Identité admin — épinglée en bas de la sidebar, hors du scroll */}
        <div className="shrink-0 px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#608C27]/30 rounded-full flex items-center justify-center shrink-0">
              <UserCircle size={18} className="text-[#608C27]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">Administrateur</p>
              <p className="text-white/40 text-xs">Super admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA: Header + Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── HEADER ── */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
          >
            <Menu size={22} />
          </button>

          <h1 className="text-[#1a1a2e] font-bold text-xl flex-1">
            {pageTitles[view] ?? 'Tableau de bord'}
          </h1>

          <div className="hidden md:flex flex-col items-end leading-none gap-1">
            <span className="text-[#1a1a2e] text-base font-semibold tabular-nums">{fmtTime(now)}</span>
            <span className="text-gray-400 text-xs capitalize">{fmtDate(now)}</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          )}
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className={`flex-1 min-h-0 min-w-0 ${view === 'messages' ? 'overflow-hidden' : 'overflow-y-auto p-6 lg:p-8'}`}>
          {view === 'menu' ? (
            <div className="space-y-8">

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="space-y-6">
                  {[4, 4, 3].map((cols, si) => (
                    <div key={si} className={`grid grid-cols-2 lg:grid-cols-${cols} gap-5`}>
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
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
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
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
          ) : view === 'messages' ? (
            <div className="h-full">{renderSubview()}</div>
          ) : (
            renderSubview()
          )}
        </main>

      </div>

    </div>

  </div>
  );
};

const SectionLabel = ({ children }) => (
  <p className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-4">{children}</p>
);

const KpiCard = ({ card }) => {
  const { Icon, label, value, color, bg, alert, hero } = card;

  if (hero) {
    return (
      <div className="bg-[#0D2B0D] rounded-xl p-6 shadow-sm h-full flex items-center gap-5 border border-[#608C27]/30">
        <div className="w-14 h-14 bg-[#608C27]/20 rounded-full flex items-center justify-center shrink-0">
          <Icon size={26} className="text-[#608C27]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wide leading-tight">
            {label}
          </p>
          <p className="text-[#608C27] text-[34px] font-black mt-1 leading-none truncate">
            {value}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border transition-shadow hover:shadow-md ${alert ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center shrink-0`}>
          <Icon size={20} className={color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wide leading-tight">
            {label}
          </p>
          <p className={`text-[30px] font-black mt-1 leading-none ${alert ? 'text-red-600' : 'text-[#1a1a2e]'}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
