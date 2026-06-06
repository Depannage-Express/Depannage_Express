import { useEffect, useState } from 'react';
import { clearAuthTokens, fetchCurrentUser, getAccessToken, logoutMechanic } from './lib/api';
import Header from './components/header';
import Hero from './components/hero';
import Demande from './components/demande_depannage';
import Confirmation from './components/confirmation';
import Suivre from './components/suivre_demande';
import Footer from './components/footer';
import Inscription from './components/inscription';
import Connexion from './components/login';
import InfoMecanicien from './components/vois_plus';
import Info from './components/info';
import DashboardMecanicien from './components/dashbard_meca';
import Facturation from './components/facturation';
import Remerciement from './components/remerciement';
import Paiement from './components/paiement';
import ConfirmerPaiement from './components/confirmer_paiement';
import Intervention from './components/intervention';
import Nofinish from './components/nofinish';
import DiscussionCond from './components/discussion';
import DiscussionMeca from './components/discussion_meca';
import DashboardAdmin from './components/dashboard_admin';
import APropos from './components/a_propos';
import EnAttenteValidation from './components/en_attente_validation';
import HistoriqueOTP from './components/historique_otp';
import './index.css';

const BREAKDOWN_PRICING = {
  demarrage: 10000,
  batterie: 12000,
  moteur: 18000,
  pneu: 8000,
  general: 15000,
};

const SCREENS = {
  HOME: 'home',
  LOGIN: 'login',
  REGISTER: 'register',
  ABOUT: 'about',
  INFO: 'info',
  MECHANIC_INFO: 'mechanic_info',
  MECHANIC_DASHBOARD: 'mechanic_dashboard',
  ADMIN_LOGIN: 'admin_login',
  ADMIN_DASHBOARD: 'admin_dashboard',
  DISCUSSION_DRIVER: 'discussion_driver',
  DISCUSSION_MECHANIC: 'discussion_mechanic',
  BREAKDOWN_FORM: 'breakdown_form',
  BREAKDOWN_CONFIRMATION: 'breakdown_confirmation',
  BREAKDOWN_TRACKING: 'breakdown_tracking',
  BILLING: 'billing',
  PAYMENT: 'payment',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  INTERVENTION: 'intervention',
  NO_FINISH: 'no_finish',
  THANK_YOU: 'thank_you',
  PENDING_VALIDATION: 'pending_validation',
  HISTORY_OTP: 'history_otp',
};

function getBreakdownAmount(breakdown) {
  const breakdownType = (breakdown?.breakdown_type || '').toLowerCase();

  if (breakdownType.includes('demarrage')) return BREAKDOWN_PRICING.demarrage;
  if (breakdownType.includes('batterie')) return BREAKDOWN_PRICING.batterie;
  if (breakdownType.includes('moteur')) return BREAKDOWN_PRICING.moteur;
  if (breakdownType.includes('pneu')) return BREAKDOWN_PRICING.pneu;

  return BREAKDOWN_PRICING.general;
}

function getScreenForUser(user) {
  if (!user) return SCREENS.HOME;
  if (user.role === 'admin') return SCREENS.ADMIN_DASHBOARD;
  // Mécanicien : uniquement si profil approuvé
  if (user.mechanic_profile_status === 'approved') return SCREENS.MECHANIC_DASHBOARD;
  return SCREENS.PENDING_VALIDATION;
}
const SCREEN_TO_NAV_MAP = {
  [SCREENS.HOME]: 'accueil',
  [SCREENS.ABOUT]: 'a-propos',
  [SCREENS.MECHANIC_INFO]: 'nos-techniciens',
  [SCREENS.ADMIN_LOGIN]: 'administrateur',
  [SCREENS.ADMIN_DASHBOARD]: 'administrateur',
  [SCREENS.MECHANIC_DASHBOARD]: 'accueil',
  [SCREENS.PENDING_VALIDATION]: 'accueil',
  [SCREENS.HISTORY_OTP]: 'historique',
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isBootstrappingUser, setIsBootstrappingUser] = useState(true);
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [currentBreakdown, setCurrentBreakdown] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [currentIntervention, setCurrentIntervention] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const hydrateUser = async () => {
      if (!getAccessToken()) {
        setIsBootstrappingUser(false);
        return;
      }

      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
        setScreen(getScreenForUser(user));
      } catch {
        clearAuthTokens();
        setCurrentUser(null);
        setScreen(SCREENS.HOME);
      } finally {
        setIsBootstrappingUser(false);
      }
    };

    hydrateUser();
  }, []);


  const resetBreakdownFlow = () => {
    setCurrentBreakdown(null);
    setCurrentPayment(null);
    setCurrentIntervention(null);
  };

  const handleLogout = async () => {
    try {
      await logoutMechanic();
    } catch {
      // ignore logout errors
    } finally {
      clearAuthTokens();
      localStorage.removeItem('meca_dashboard_view');
      setCurrentUser(null);
      setSearchQuery('');
      setScreen(SCREENS.HOME);
    }
  };

  const goHome = () => {
    resetBreakdownFlow();
    setScreen(SCREENS.HOME);
  };

  const openLogin = () => setScreen(SCREENS.LOGIN);
  const openRegister = () => setScreen(SCREENS.REGISTER);
  const openAdminLogin = () => setScreen(SCREENS.ADMIN_LOGIN);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      setScreen(SCREENS.MECHANIC_INFO);
    }
  };

  const handleNavClick = (page) => {
    switch (page) {
      case 'accueil':
        setSearchQuery('');
        if (currentUser) {
          setScreen(getScreenForUser(currentUser));
        } else {
          goHome();
        }
        break;
      case 'a-propos':
        setSearchQuery('');
        setScreen(SCREENS.ABOUT);
        break;
      case 'nos-techniciens':
        setScreen(SCREENS.MECHANIC_INFO);
        break;
      case 'administrateur':
        openAdminLogin();
        break;
      case 'historique':
        setScreen(SCREENS.HISTORY_OTP);
        break;
      default:
        break;
    }
  };

  const handleMechanicAuth = (authPayload) => {
    const user = authPayload?.user || null;
    setCurrentUser(user);
    setScreen(getScreenForUser(user));
  };

  const handleAdminAuth = (authPayload) => {
    const user = authPayload?.user || null;
    setCurrentUser(user);
    setScreen(getScreenForUser(user));
  };

  const ensureAdminUser = (authPayload) => {
    if (authPayload?.user?.role !== 'admin') {
      throw new Error("Ce compte n'a pas les droits administrateur.");
    }
  };

  const handleBreakdownCreated = (breakdown) => {
    setCurrentBreakdown(breakdown);
    setScreen(SCREENS.BREAKDOWN_CONFIRMATION);
  };

  const currentAmount = getBreakdownAmount(currentBreakdown);

  const renderMainScreen = () => {
    switch (screen) {
      case SCREENS.PENDING_VALIDATION:
        return (
          <EnAttenteValidation
            currentUser={currentUser}
            onLogout={handleLogout}
            onStatusChanged={(freshUser) => {
              setCurrentUser(freshUser);
              setScreen(getScreenForUser(freshUser));
            }}
          />
        );
      case SCREENS.DISCUSSION_DRIVER:
        return (
          <DiscussionCond
            onBackClick={() => setScreen(SCREENS.BILLING)}
            breakdownRequestId={currentBreakdown?.id}
            driverName={currentBreakdown?.driver_name}
            driverToken={currentBreakdown?.driver_token}
          />
        );
      case SCREENS.DISCUSSION_MECHANIC:
        return (
          <DiscussionMeca
            onBack={() => setScreen(SCREENS.MECHANIC_DASHBOARD)}
            currentUser={currentUser}
          />
        );
      case SCREENS.INFO:
        return <Info onInfo={goHome} />;
      case SCREENS.LOGIN:
        return (
          <Connexion
            onInscriptionClick={openRegister}
            onLoginClick={handleMechanicAuth}
          />
        );
      case SCREENS.REGISTER:
        return (
          <Inscription
            onSignUpClick={openLogin}
            onRegisterSuccess={handleMechanicAuth}
            onInfo={() => setScreen(SCREENS.INFO)}
          />
        );
      case SCREENS.MECHANIC_DASHBOARD:
        return <DashboardMecanicien currentUser={currentUser} />;
      case SCREENS.ADMIN_LOGIN:
        return (
          <Connexion
            title="Connexion Administrateur"
            submitLabel="Connexion"
            hideSignup
            loginGuard={ensureAdminUser}
            onLoginClick={handleAdminAuth}
          />
        );
      case SCREENS.ADMIN_DASHBOARD:
        return <DashboardAdmin />;
      case SCREENS.MECHANIC_INFO:
        return (
          <InfoMecanicien
            onBack={() => {
              setSearchQuery('');
              if (currentUser) {
                setScreen(getScreenForUser(currentUser));
              } else {
                goHome();
              }
            }}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        );
      case SCREENS.ABOUT:
        return <APropos />;
      case SCREENS.THANK_YOU:
        return (
          <Remerciement
            onRemerc={goHome}
            interventionId={currentIntervention?.id}
            reviewerName={currentBreakdown?.driver_name}
          />
        );
      case SCREENS.NO_FINISH:
        return <Nofinish onFinish={goHome} />;
      case SCREENS.INTERVENTION:
        return (
          <Intervention
            breakdownId={currentBreakdown?.id}
            onNo={() => setScreen(SCREENS.NO_FINISH)}
            onTerminer={(interventionId) => {
              if (interventionId) setCurrentIntervention({ id: interventionId });
              setScreen(SCREENS.THANK_YOU);
            }}
          />
        );
      case SCREENS.PAYMENT_CONFIRMATION:
        return (
          <ConfirmerPaiement
            onabout={() => setScreen(SCREENS.INTERVENTION)}
            paymentId={currentPayment?.id}
            breakdownId={currentBreakdown?.id}
          />
        );
      case SCREENS.PAYMENT:
        return (
          <Paiement
            onPayerClick={(payment) => {
              setCurrentPayment(payment);
              setScreen(SCREENS.PAYMENT_CONFIRMATION);
            }}
            payerName={currentBreakdown?.driver_name}
            amount={currentAmount}
            breakdownId={currentBreakdown?.id}
            driverToken={currentBreakdown?.driver_token}
          />
        );
      case SCREENS.BILLING:
        return (
          <Facturation
            amount={currentAmount}
            onPayer={() => setScreen(SCREENS.PAYMENT)}
            onDiscuter={() => setScreen(SCREENS.DISCUSSION_DRIVER)}
          />
        );
      case SCREENS.BREAKDOWN_TRACKING:
        return (
          <Suivre
            requestId={currentBreakdown?.id}
            onBack={goHome}
            onMechanicAssigned={() => setScreen(SCREENS.BILLING)}
          />
        );
      case SCREENS.BREAKDOWN_CONFIRMATION:
        return (
          <Confirmation
            onValidation={() => setScreen(SCREENS.BREAKDOWN_TRACKING)}
            requestId={currentBreakdown?.id}
          />
        );
      case SCREENS.BREAKDOWN_FORM:
        return (
          <div className="relative">
            <Demande onConfirm={handleBreakdownCreated} />
          </div>
        );
      case SCREENS.HISTORY_OTP:
        return <HistoriqueOTP onBack={goHome} />;
      case SCREENS.HOME:
      default:
        return <Hero onStartClick={() => setScreen(SCREENS.BREAKDOWN_FORM)} onVoir={() => setScreen(SCREENS.MECHANIC_INFO)} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#608C27]">
      <Header
        currentView={SCREEN_TO_NAV_MAP[screen] || 'accueil'}
        onSignUpClick={openLogin}
        onLogoutClick={handleLogout}
        currentUser={currentUser}
        onNavClick={handleNavClick}
        onSearch={handleSearch}
        searchQuery={searchQuery}
      />
      <main className="flex-1">
        {isBootstrappingUser ? (
          <div className="flex items-center justify-center text-white font-bold">
            Connexion au serveur...
          </div>
        ) : (
          renderMainScreen()
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
