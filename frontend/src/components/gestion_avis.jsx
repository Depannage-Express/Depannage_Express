import { useEffect, useState } from 'react';
import { Star, Trash2, ArrowLeft, Loader, RefreshCw } from 'lucide-react';
import { fetchAdminReviews, deleteAdminReview } from '../lib/api';

const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={13}
        className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ))}
  </div>
);

const GestionAvis = ({ onBack }) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (filterRating) params.rating = filterRating;
      const data = await fetchAdminReviews(params);
      setReviews(Array.isArray(data) ? data : (data.results || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterRating]);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement cet avis ?')) return;
    setDeletingId(id);
    try {
      await deleteAdminReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border-2 border-[#0D2B0D] overflow-hidden">

      {/* Header */}
      <div className="bg-[#0D2B0D] py-4 px-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-white hover:text-[#608C27] transition-colors"
          title="Retour"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-white text-xl font-bold uppercase tracking-widest flex-1">
          Gestion des avis
        </h2>
        <button
          onClick={load}
          className="text-white hover:text-[#608C27] transition-colors"
          title="Actualiser"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="p-6">

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div>
            <label className="block text-[#0D2B0D] text-[10px] font-bold uppercase tracking-widest mb-1">
              Filtrer par note
            </label>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27]"
            >
              <option value="">Toutes les notes</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} étoile{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Compteur */}
        {!isLoading && (
          <p className="text-sm text-gray-500 mb-4">
            {reviews.length} avis trouvé{reviews.length !== 1 ? 's' : ''}
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-[#608C27]" size={32} />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Star size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Aucun avis trouvé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-gray-200 rounded-xl p-4 flex items-start justify-between hover:border-[#608C27] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <StarDisplay rating={review.rating} />
                    <span className="text-sm font-bold text-[#0D2B0D]">
                      {review.rating}/5
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {review.reviewer_name}
                  </p>

                  {review.mechanic_name && (
                    <p className="text-xs text-[#608C27] font-medium">
                      Mécanicien : {review.mechanic_name}
                    </p>
                  )}

                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-2 italic line-clamp-2">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(review.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  className="ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 shrink-0"
                  title="Supprimer cet avis"
                >
                  {deletingId === review.id
                    ? <Loader size={18} className="animate-spin" />
                    : <Trash2 size={18} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionAvis;
