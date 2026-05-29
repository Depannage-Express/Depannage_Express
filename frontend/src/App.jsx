import { useEffect, useState } from 'react';
import { clearAuthTokens, fetchCurrentUser, getAccessToken } from './lib/api';
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
};

function getBreakdownAmount(breakdown) {
  const breakdownType = (breakdown?.breakdown_type || '').toLowerCase();

  if (breakdownType.includes('demarrage')) return BREAKDOWN_PRICING.demarrage;
  if (breakdownType.includes('batterie')) return BREAKDOWN_PRICING.batterie;
  if (breakdownType.includes('moteur')) return BREAKDOWN_PRICING.moteur;
  if (breakdownType.includes('pneu')) return BREAKDOWN_PRICING.pneu;

  return BREAKDOWN_PRICING.general;
}

function getDashboardScreenForRole(role) {
  return role === 'admin' ? SCREENS.ADMIN_DASHBOARD : SCREENS.MECHANIC_DASHBOARD;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isBootstrappingUser, setIsBootstrappingUser] = useState(true);
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [currentBreakdown, setCurrentBreakdown] = useState(null);

  useEffect(() => {
    const hydrateUser = async () => {
      if (!getAccessToken()) {
        setIsBootstrappingUser(false);
        return;
      }

      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
        setScreen(getDashboardScreenForRole(user?.role));
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

  useEffect(() => {
    if (screen !== SCREENS.BREAKDOWN_TRACKING || currentBreakdown?.status !== 'assigned') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setScreen(SCREENS.BILLING);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [screen, currentBreakdown]);

  const resetBreakdownFlow = () => {
    setCurrentBreakdown(null);
  };

  const goHome = () => {
    resetBreakdownFlow();
    setScreen(SCREENS.HOME);
  };

  const openLogin = () => setScreen(SCREENS.LOGIN);
  const openRegister = () => setScreen(SCREENS.REGISTER);
  const openAdminLogin = () => setScreen(SCREENS.ADMIN_LOGIN);

  const handleNavClick = (page) => {
    switch (page) {
      case 'accueil':
        goHome();
        break;
      case 'a-propos':
        setScreen(SCREENS.ABOUT);
        break;
      case 'nos-techniciens':
        setScreen(SCREENS.MECHANIC_INFO);
        break;
      case 'administrateur':
        openAdminLogin();
        break;
      default:
        break;
    }
  };

  const handleMechanicAuth = (authPayload) => {
    const user = authPayload?.user || null;
    setCurrentUser(user);
    setScreen(getDashboardScreenForRole(user?.role));
  };

  const handleAdminAuth = (authPayload) => {
    const user = authPayload?.user || null;
    setCurrentUser(user);
    setScreen(getDashboardScreenForRole(user?.role));
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
      case SCREENS.DISCUSSION_DRIVER:
        return <DiscussionCond onBackClick={() => setScreen(SCREENS.BILLING)} />;
      case SCREENS.DISCUSSION_MECHANIC:
        return <DiscussionMeca onBackClick={() => setScreen(SCREENS.MECHANIC_DASHBOARD)} />;
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
        return <InfoMecanicien onBack={goHome} />;
      case SCREENS.ABOUT:
        return <APropos />;
      case SCREENS.THANK_YOU:
        return <Remerciement onRemerc={goHome} />;
      case SCREENS.NO_FINISH:
        return <Nofinish onFinish={goHome} />;
      case SCREENS.INTERVENTION:
        return (
          <Intervention
            onNo={() => setScreen(SCREENS.NO_FINISH)}
            onTerminer={() => setScreen(SCREENS.THANK_YOU)}
          />
        );
      case SCREENS.PAYMENT_CONFIRMATION:
        return <ConfirmerPaiement onabout={() => setScreen(SCREENS.INTERVENTION)} />;
      case SCREENS.PAYMENT:
        return <Paiement onPayerClick={() => setScreen(SCREENS.PAYMENT_CONFIRMATION)} />;
      case SCREENS.BILLING:
        return (
          <Facturation
            amount={currentAmount}
            onPayer={() => setScreen(SCREENS.PAYMENT)}
            onDiscuter={() => setScreen(SCREENS.DISCUSSION_DRIVER)}
          />
        );
      case SCREENS.BREAKDOWN_TRACKING:
        return <Suivre requestId={currentBreakdown?.id} />;
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
      case SCREENS.HOME:
      default:
        return <Hero onStartClick={() => setScreen(SCREENS.BREAKDOWN_FORM)} onVoir={() => setScreen(SCREENS.MECHANIC_INFO)} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#608C27]">
      <Header onSignUpClick={openLogin} onNavClick={handleNavClick} />

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
