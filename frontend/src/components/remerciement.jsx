import { useState } from 'react';
import { CheckCircle, Star } from 'lucide-react';
import { submitReviewForIntervention } from '../lib/api';

const Remerciement = ({ onRemerc, interventionId, reviewerName, driverToken }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Veuillez sélectionner une note avant de valider.');
      return;
    }

    if (interventionId) {
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
      } catch (err) {
        setError(err.message);
        setIsSubmitting(false);
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    onRemerc();
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

        {!submitted && (
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
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>

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
              {isSubmitting ? 'Envoi...' : 'Valider mon avis'}
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
