import { useEffect, useState } from 'react'; 
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

import { clearAuthTokens, fetchCurrentUser, getAccessToken } from './lib/api';

import ConnexionAdmin from './components/login_admin';
import DashboardAdmin from './components/dashboard_admin';
import APropos from './components/a_propos';
ff18644 (Nouveau)
import './index.css';

const BREAKDOWN_PRICING = {
  demarrage: 10000,
  batterie: 12000,
  moteur: 18000,
  pneu: 8000,
  general: 15000,
};

function getBreakdownAmount(breakdown) {
  const breakdownType = (breakdown?.breakdown_type || '').toLowerCase();

  if (breakdownType.includes('demarrage')) {
    return BREAKDOWN_PRICING.demarrage;
  }
  if (breakdownType.includes('batterie')) {
    return BREAKDOWN_PRICING.batterie;
  }
  if (breakdownType.includes('moteur')) {
    return BREAKDOWN_PRICING.moteur;
  }
  if (breakdownType.includes('pneu')) {
    return BREAKDOWN_PRICING.pneu;
  }

  return BREAKDOWN_PRICING.general;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isBootstrappingUser, setIsBootstrappingUser] = useState(true);
  const [currentBreakdown, setCurrentBreakdown] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isInscription, setIsInscription] = useState(false);
  const [isConnexion, setIsConnexion] = useState(false);
  const [isVoir, setIsVoir] = useState(false);
  const [isInfo, setIsInfo] = useState(false);
  const [isDashboardMeca, setIsDashboardMeca] = useState(false);
  const [isFacturation, setIsFacturation] = useState(false);
  const [isRemerciement, setIsRemerciement] = useState(false);
  const [isPaiement, setIsPaiement] = useState(false);
  const [isConfirmerPaiement, setIsConfirmerPaiement] = useState(false);
  const [isIntervention, setIsIntervention] = useState(false);
  const [isNofinish, setIsNofinish] = useState(false);
  const [isDiscussioncond, setIsDiscussioncond] = useState(false);
  const [isDiscussionmeca, setIsDiscussionmeca] = useState(false);


  useEffect(() => {
    const hydrateUser = async () => {
      if (!getAccessToken()) {
        setIsBootstrappingUser(false);
        return;
      }

      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
        setIsDashboardMeca(true);
      } catch {
        clearAuthTokens();
      } finally {
        setIsBootstrappingUser(false);
      }
    };

    hydrateUser();
  }, []);

  useEffect(() => {
    if (!isFollowing || !currentBreakdown || currentBreakdown.status !== 'assigned') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsFollowing(false);
      setIsFacturation(true);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [isFollowing, currentBreakdown]);

  const [isConnexionAd, setIsConnexionAd] = useState(false);
  const [isDashboardAd, setIsDashboardAd] = useState(false);
  const [isapropos, setIsApropos] = useState(false);  
ff18644 (Nouveau)

  const ouvrirInscription = () => {
    setIsConnexion(false);
    setIsInscription(true);
  };

  const ouvrirConnexion = () => {
    setIsInscription(false);
    setIsConnexion(true);
  };
  
  const retournerAccueil = () => {
    setIsInfo(false);
    setIsConnexion(false);
    setIsInscription(false);
    setIsApropos(false);
    setShowForm(false); 
    setIsConfirmed(false);
    setIsFollowing(false);
    setIsFacturation(false);
    setIsPaiement(false);
    setIsConfirmerPaiement(false);
    setIsIntervention(false);
    setIsRemerciement(false); 
    setIsDashboardMeca(false); 
    setIsDashboardAd(false);
    setIsDiscussioncond(false); 
    setIsDiscussionmeca(false); 
    setIsConnexionAd(false);
    setIsNofinish(false);
    setIsVoir(false); 
  };


  const handleMechanicAuth = (authPayload) => {
    setCurrentUser(authPayload?.user || null);
    setIsConnexion(false);
    setIsInscription(false);
    setIsDashboardMeca(true);
  };

  const handleBreakdownCreated = (breakdown) => {
    setCurrentBreakdown(breakdown);
    setIsConfirmed(true);
  };

  const confirmerDemandeConducteur = () => {
    setIsConfirmed(false);
    setIsFollowing(true);
  };

  const currentAmount = getBreakdownAmount(currentBreakdown);


 // Fonction pour passer du Suivi à la Facturation
  const allerAFacturation = () => {
    setIsFollowing(false); 
    setIsConfirmed(false);
    setShowForm(false);
    setIsFacturation(true);    
  };

 ff18644 (Nouveau)
  return (
    <div className="min-h-screen flex flex-col bg-[#608C27]">
      <Header 
        onSignUpClick={() => 
          setIsConnexion(true)} 
        onNavClick={(page) => {
          switch(page) {
            case 'accueil': retournerAccueil(); break;
            case 'a-propos': setIsApropos(true); break;
            case 'nos-techniciens': retournerAccueil(); break;
            case 'administrateur': setIsConnexionAd(true); break;
            default: break;
          }
        }} 
      />
      
      <main className="flex-grow">

        {isBootstrappingUser ? (
          <div className="min-h-[50vh] flex items-center justify-center text-white font-bold">
            Connexion au serveur...
          </div>
        ) : (
        
          isDiscussioncond ? (
          <DiscussionCond
            onBackClick={() => 
              setIsDiscussioncond(false)}
          />
        
        ):isDiscussionmeca ?(
          <DiscussionMeca
            onBackClick={() => 
              setIsDiscussionmeca(false)}
          />
        ):isInfo ? (
          <Info
            onInfo={retournerAccueil}
          />
        ):isConnexion ? (
          /* Si l'utilisateur a cliqué sur Connexion/Inscription */
          <Connexion 
            onInscriptionClick={ouvrirInscription}
            onLoginClick={handleMechanicAuth} 
            
          />
         ):isInscription ? (
          <Inscription 
            onSignUpClick={ouvrirConnexion} 
            onRegisterSuccess={handleMechanicAuth}
            onInfo={() => setIsInfo(true)}
          />
        ) 
        :isDashboardMeca ?(
          <DashboardMecanicien currentUser={currentUser} />
        )
        
        :isRemerciement ?(
          <Remerciement 
            onRemerc={retournerAccueil}
          />
        ):isNofinish ?(
          <Nofinish 
            onFinish={retournerAccueil}
          />
        ):isIntervention ?(
          <Intervention 
            onNo={
             () => {
              setIsNofinish(true);
              setIsRemerciement(false);
            }
            }
            onTerminer={
              () => {
                setIsIntervention(false);
                setIsRemerciement(true);
              }
            }
          />
        ):isConfirmerPaiement ?(
          <ConfirmerPaiement 
            onabout={
              () => {
                setIsConfirmerPaiement(false);
                setIsIntervention(true);
              }
            }
          />
        ):isPaiement ? (
          <Paiement 
            onPayerClick={() => {
              setIsPaiement(false);
              setIsConfirmerPaiement(true);
            }}
          />
        ):isFacturation ? (
    <Facturation 
      amount={currentAmount}
      onPayer={() => {
        setIsPaiement(true);
        setIsRemerciement(false);
      }} 
      onDiscuter={() => {
        setIsDiscussioncond(true);
        setIsFacturation(false);
      } } 
    />
  ) :!showForm ? (
          <Hero onStartClick={() => setShowForm(true)} />
        ) : isFollowing ? (
          <Suivre 
            requestId={currentBreakdown?.id}
          />
        ) : isConfirmed ? (
          <Confirmation 
            onValidation={confirmerDemandeConducteur}
            requestId={currentBreakdown?.id}
            
          />
        ) : (
          <div className="relative">
            
            <Demande onConfirm={handleBreakdownCreated} />
          </div>
        ))}
        
        {isVoir ? (
            <InfoMecanicien onBack={() => 
              setIsVoir(false)} />
        ) : isapropos ? (
            <APropos/>
        ) : isDashboardAd ? (
            <DashboardAdmin/>
        ) : isConnexionAd ? (
            <ConnexionAdmin onLoginClickAd={() => 
              setIsDashboardAd(true)} />
        ) : isDiscussioncond ? (
            <DiscussionCond onBackClick={() => 
              setIsDiscussioncond(false)} />
        ) : isDiscussionmeca ? (
            <DiscussionMeca onBackClick={() => 
              setIsDiscussionmeca(false)} />
        ) : isInfo ? (
            <Info onInfo={retournerAccueil} />
        ) : isConnexion ? (
            <Connexion onInscriptionClick={ouvrirInscription} 
              onLoginClick={() => { 
                setIsConnexion(false); 
                setIsDashboardMeca(true); }} />
        ) : isInscription ? (
            <Inscription onSignUpClick={ouvrirConnexion} onInfo={() => setIsInfo(true)} />
        ) : isDashboardMeca ? (
            <DashboardMecanicien/>
        ) : isRemerciement ? (
            <Remerciement onRemerc={retournerAccueil} />
        ) : isNofinish ? (
            <Nofinish onFinish={retournerAccueil} />
        ) : isIntervention ? (
            <Intervention onNo={() => { 
              setIsNofinish(true); 
              setIsRemerciement(false); }} 
            onTerminer={() => { 
              setIsIntervention(false); 
              setIsRemerciement(true); }} />
        ) : isConfirmerPaiement ? (
            <ConfirmerPaiement onabout={() => { 
              setIsConfirmerPaiement(false); 
              setIsIntervention(true); }} />
        ) : isPaiement ? (
            <Paiement onPayerClick={() => { 
              setIsPaiement(false); 
              setIsConfirmerPaiement(true); }} />
        ) : isFacturation ? (
            <Facturation onPayer={() => { 
              setIsPaiement(true); 
              setIsRemerciement(false); }} 
            onDisctuter={() => { 
              setIsDiscussioncond(true); 
              setIsFacturation(false); } } />
        ) : !showForm ? (
            <Hero 
              onStartClick={() => setShowForm(true)} 
              onVoir={() => setIsVoir(true)} 
            />
        ) : isFollowing ? (
            <Suivre onbout={allerAFacturation} />
        ) : isConfirmed ? (
            <Confirmation onValidation={() => 
              setIsFollowing(true)} />
        ) : (
            <Demande onConfirm={() => 
              setIsConfirmed(true)} />
        )}
ff18644 (Nouveau)
      </main>
 {/* CHANGEMENT ICI : La balise est auto-fermante /> */}
      <Footer /> 
    </div>
  );
}

export default App;
