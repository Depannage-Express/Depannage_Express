import { useState } from 'react'; 
import Header from './components/header';
import Hero from './components/hero';
import Demande from './components/demande_depannage'; 
import Confirmation from './components/confirmation';
import Suivre from './components/suivre_demande';
import Footer from './components/footer';
import Inscription from './components/inscription';
import Connexion from './components/login';
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
import './index.css';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isInscription, setIsInscription] = useState(false);
  const [isConnexion, setIsConnexion] = useState(false);
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
  const ouvrirInscription = () => {
    setIsConnexion(false);
    setIsInscription(true);
  };

  const ouvrirConnexion = () => {
    setIsInscription(false);
    setIsConnexion(true);
  };
  // 3. Crée la fonction de retour à l'accueil
  const retournerAccueil = () => {
    setIsInfo(false);
    setIsConnexion(false);
    setIsInscription(false);
    setShowForm(false); 
    setIsConfirmed(false);
    setIsFollowing(false);
    setIsFacturation(false);
    setIsPaiement(false);
    setIsConfirmerPaiement(false);
    setIsIntervention(false);
    setIsRemerciement(false); 
    setIsDashboardMeca(false); 
    setIsDiscussioncond(false); 
    setIsDiscussionmeca(false); 
    setIsNofinish(false);
  };

  // Fonction pour passer du Suivi à la Facturation
  const allerAFacturation = () => {
    setIsFollowing(false); 
    setIsConfirmed(false);
    setShowForm(false);
    setIsFacturation(true);    
  };
  return (
    <div className="min-h-screen flex flex-col bg-[#608C27]">
      <Header 
        
        onSignUpClick={() => setIsConnexion(true)} 
        onNavClick={(page) => {
          switch(page) {
            case 'accueil':
              retournerAccueil();
              break;
            case 'a-propos':
              setIsInfo(true);
              break;
            case 'nos-techniciens':
              retournerAccueil();
              break;
          }
        }} />
      
      <main className="flex-grow">
        {
        
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
            onLoginClick={() => {
              setIsConnexion(false);
              setIsDashboardMeca(true);
            }} 
            
          />
         ):isInscription ? (
          <Inscription 
            onSignUpClick={ouvrirConnexion} 
            onInfo={() => setIsInfo(true)}
          />
        ) 
        :isDashboardMeca ?(
          <DashboardMecanicien/>
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
      onPayer={() => {
        setIsPaiement(true);
        setIsRemerciement(false);
      }} 
      onDisctuter={() => {
        setIsDiscussioncond(true);
        setIsFacturation(false);
      } } 
    />
  ) :!showForm ? (
          <Hero onStartClick={() => setShowForm(true)} />
        ) : isFollowing ? (
          <Suivre 
            onbout={allerAFacturation}
          />
        ) : isConfirmed ? (
          <Confirmation 
            onValidation={() => setIsFollowing(true)}
            
          />
        ) : (
          <div className="relative">
            
            <Demande onConfirm={() => setIsConfirmed(true)} />
          </div>
        )}
      </main>

      {/* CHANGEMENT ICI : La balise est auto-fermante /> */}
      <Footer /> 
    </div>
  );
}

export default App;