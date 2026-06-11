import { useState } from 'react';
import { CheckCircle, Star, AlertTriangle } from 'lucide-react';
import { submitReviewForIntervention, createSignalementAvis } from '../lib/api';
import { detecterMotsInterdits, getNiveauGravite } from '../data/mots_interdits';

const Remerciement = ({ onRemerc, interventionId, reviewerName, driverToken }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [motsDetectes, setMotsDetectes] = useState([]);
  const [showExplication, setShowExplication] = useState(false);
  const [explication, setExplication] = useState('');
  const [signalementEnvoye, setSignalementEnvoye] = useState(false);

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setComment(value);
    const mots = detecterMotsInterdits(value);
    setMotsDetectes(mots);
    setShowExplication(mots.length > 0);
  };

  const submitAvisNormal = async () => {
    if (!interventionId) { onRemerc(); return; }
    setIsSubmitting(true);
    setError('');
    try {
      await submitReviewForIntervention(interventionId, {
        rating,
        comment,
        reviewer_name: reviewerName || 'Conducteur anonyme',
        driver_token: driverToken,
      });
      setSubmitted(true);
      onRemerc();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitSignalement = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await createSignalementAvis({
        intervention_id: interventionId,
        mechanic_name: 'Mécanicien',
        driver_name: reviewerName || 'Conducteur anonyme',
        commentaire_original: comment,
        explication,
        note: rating,
        mots_detectes: motsDetectes.join(', '),
        gravity: getNiveauGravite(motsDetectes),
        driver_token: driverToken,
      });
      setSignalementEnvoye(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Veuillez sélectionner une note avant de valider.');
      return;
    }
    if (motsDetectes.length === 0) {
      await submitAvisNormal();
      return;
    }
    if (!explication.trim()) {
      setError('Veuillez fournir une explication sur la situation.');
      return;
    }
    await submitSignalement();
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-200 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center w-full max-w-lg">

        <CheckCircle
          size={50}
          className="text-white fill-[#0D2B0D] mb-6"
          strokeWidth={3}
        />
        <p className="text-center text-2xl text-black mt-4 font-bold">
          Nous vous remercions pour <br /> votre confiance
        </p>

        {signalementEnvoye ? (
          <div className="text-center py-6">
            <CheckCircle size={48} className="text-[#2e7d32] fill-green-100 mx-auto mb-3" />
            <h3 className="text-[#2e7d32] font-bold text-lg mb-2">Retour enregistré</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Votre retour a été transmis à notre équipe qui contactera le mécanicien concerné.
              Merci pour votre signalement.
            </p>
            <button
              onClick={onRemerc}
              type="button"
              className="w-full bg-[#608C27] text-white font-bold py-3 rounded-2xl hover:bg-[#0D2B0D] transition-all text-sm"
            >
              Continuer
            </button>
          </div>
        ) : !submitted && (
          <>
            <p className="text-center text-sm text-gray-500 mt-3 mb-2">
              Souhaitez-vous évaluer ce mécanicien ?
            </p>

            {/* Étoiles */}
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={35}
                    className={`${
                      star <= (hover || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    } transition-colors duration-200`}
                  />
                </button>
              ))}
            </div>

            {/* Commentaire */}
            <div className="mt-6 w-full">
              <label className="block text-[#0D2B0D] text-[11px] font-bold uppercase tracking-widest mb-2 pl-1">
                Votre avis sur le service
              </label>
              <textarea
                className="w-full bg-gray-200 rounded-xl px-4 py-3 outline-none text-black font-medium resize-none text-sm placeholder-gray-500 focus:ring-2 focus:ring-[#608C27] transition-all"
                placeholder="Partagez votre expérience..."
                value={comment}
                onChange={handleCommentChange}
                rows={4}
              />
            </div>

            {/* Champ explication — affiché si mot interdit détecté */}
            {showExplication && (
              <div className="w-full mt-4 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-4">
                <p className="text-orange-700 font-semibold text-sm flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  Votre commentaire contient des termes qui nécessitent une vérification.
                </p>
                <p className="text-gray-500 text-xs mb-3 leading-relaxed">
                  Pouvez-vous nous expliquer poliment ce qui s'est passé ? Votre retour sera examiné par notre équipe.
                </p>
                <textarea
                  value={explication}
                  onChange={(e) => setExplication(e.target.value)}
                  placeholder="Décrivez la situation calmement..."
                  rows={3}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-amber-300 transition-all"
                />
              </div>
            )}

            {error && (
              <div className="w-full rounded-xl bg-gray-200 text-center text-red-600 text-sm font-medium px-4 py-2 mt-2">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              type="button"
              className="w-full bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-[#0D2B0D] transition-all shadow-lg tracking-wide text-sm mt-6 disabled:opacity-60"
            >
              {isSubmitting ? 'Envoi...' : (showExplication ? 'Envoyer le signalement' : 'Valider mon avis')}
            </button>

            <button
              onClick={onRemerc}
              type="button"
              className="mt-3 text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Passer
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Remerciement;
