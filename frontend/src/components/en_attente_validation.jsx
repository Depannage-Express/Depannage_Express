import { useState } from 'react';
import { Clock, XCircle, RefreshCw, LogOut } from 'lucide-react';
import { fetchCurrentUser } from '../lib/api';

const STATUS_CONFIG = {
  pending: {
    icon: <Clock size={64} className="text-yellow-400" />,
    title: 'Compte en attente de validation',
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/30 border-yellow-600',
    message:
      "Votre dossier a bien été reçu. Notre équipe administrateur est en train de vérifier vos informations et justificatifs. Vous recevrez une confirmation dès la validation.",
  },
  rejected: {
    icon: <XCircle size={64} className="text-red-400" />,
    title: 'Profil refusé',
    color: 'text-red-400',
    bg: 'bg-red-900/30 border-red-600',
    message:
      "Votre demande a été refusée par l'administrateur. Veuillez vérifier les motifs ci-dessous et contacter le support si nécessaire.",
  },
  suspended: {
    icon: <XCircle size={64} className="text-orange-400" />,
    title: 'Compte suspendu',
    color: 'text-orange-400',
    bg: 'bg-orange-900/30 border-orange-600',
    message: "Votre compte a été suspendu. Contactez le support pour plus d'informations.",
  },
  default: {
    icon: <Clock size={64} className="text-gray-400" />,
    title: 'Profil en cours de création',
    color: 'text-gray-300',
    bg: 'bg-gray-700/30 border-gray-500',
    message:
      "Votre compte a été créé. Votre profil mécanicien sera vérifié par notre équipe. La validation prend généralement 24 à 48 heures.",
  },
};

const EnAttenteValidation = ({ currentUser, onStatusChanged, onLogout }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState('');

  const profileStatus = currentUser?.mechanic_profile_status;
  const config = STATUS_CONFIG[profileStatus] || STATUS_CONFIG.default;

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setCheckMessage('');
    try {
      const freshUser = await fetchCurrentUser();
      if (freshUser.mechanic_profile_status === 'approved') {
        setCheckMessage('Votre profil a été approuvé ! Redirection...');
        setTimeout(() => {
          if (onStatusChanged) onStatusChanged(freshUser);
        }, 1000);
      } else {
        setCheckMessage("Statut inchangé — votre dossier est toujours en cours d'examen.");
      }
    } catch {
      setCheckMessage('Impossible de vérifier le statut. Réessayez plus tard.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="bg-[#0D2B0D] w-full max-w-lg rounded-3xl shadow-2xl p-8 border border-white/10 text-center">

        {/* Icône statut */}
        <div className="flex justify-center mb-6">
          {config.icon}
        </div>

        {/* Titre */}
        <h2 className={`text-2xl font-bold mb-4 ${config.color}`}>
          {config.title}
        </h2>

        {/* Message */}
        <div className={`rounded-2xl border p-4 mb-6 ${config.bg}`}>
          <p className="text-white/80 text-sm leading-relaxed">{config.message}</p>
        </div>

        {/* Motif de refus */}
        {currentUser?.mechanic_profile_rejection_reason && (
          <div className="bg-red-900/20 border border-red-500 rounded-xl p-4 mb-6 text-left">
            <p className="text-red-300 text-xs font-bold uppercase tracking-wider mb-1">Motif du refus :</p>
            <p className="text-white/80 text-sm">{currentUser.mechanic_profile_rejection_reason}</p>
          </div>
        )}

        {/* Infos utilisateur */}
        <div className="bg-white/5 rounded-2xl p-4 mb-6 text-left space-y-1">
          <p className="text-white/50 text-xs uppercase tracking-wider font-bold mb-2">Vos informations</p>
          <p className="text-white text-sm font-semibold">{currentUser?.full_name}</p>
          <p className="text-white/60 text-sm">{currentUser?.email}</p>
          <p className="text-white/60 text-sm">{currentUser?.phone || 'Téléphone non renseigné'}</p>
        </div>

        {/* Délai estimé */}
        {(!profileStatus || profileStatus === 'pending') && (
          <p className="text-white/40 text-xs mb-6 italic">
            Délai estimé : 24 à 48 heures ouvrables
          </p>
        )}

        {/* Message retour vérification */}
        {checkMessage && (
          <div className={`rounded-xl px-4 py-2 mb-4 text-sm font-medium ${
            checkMessage.includes('approuvé') ? 'bg-green-900/40 text-green-300' : 'bg-white/10 text-white/70'
          }`}>
            {checkMessage}
          </div>
        )}

        {/* Boutons */}
        <div className="flex flex-col gap-3">
          {(!profileStatus || profileStatus === 'pending') && (
            <button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="flex items-center justify-center gap-2 w-full bg-[#608C27] text-white font-bold py-3 rounded-2xl hover:bg-[#4a6e1e] transition-all shadow-md disabled:opacity-60"
            >
              <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
              {isChecking ? 'Vérification...' : 'Vérifier mon statut'}
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full bg-white/10 text-white/70 font-semibold py-3 rounded-2xl hover:bg-white/20 transition-all"
          >
            <LogOut size={18} />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnAttenteValidation;
