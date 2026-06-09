import { useEffect, useState } from 'react';
import { Star, User, MessageCircle, SearchX, Send, X, ArrowLeft } from 'lucide-react';
import { fetchPublicMechanics, fetchMechanicReviews, postMechanicReview } from '../lib/api';
import SafeImage from './SafeImage';

const InfoMecanicien = ({ onBack, searchQuery = '', onClearSearch }) => {
  const [mechanics, setMechanics] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ reviewer_name: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await fetchPublicMechanics(searchQuery);
        const list = Array.isArray(data) ? data : (data.results || []);
        setMechanics(list);
        // Keep selection if still in results, otherwise select first
        setSelected(prev => {
          if (prev && list.find(m => m.id === prev.id)) return prev;
          return list.length > 0 ? list[0] : null;
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [searchQuery]);

  useEffect(() => {
    if (!selected?.id) { setReviews([]); return; }
    setShowReviewForm(false);
    setReviewForm({ reviewer_name: '', rating: 5, comment: '' });
    setReviewError('');
    setReviewSuccess(false);
    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const data = await fetchMechanicReviews(selected.id);
        setReviews(Array.isArray(data) ? data : (data.results || []));
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    loadReviews();
  }, [selected?.id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.reviewer_name.trim()) {
      setReviewError('Veuillez indiquer votre nom.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const newReview = await postMechanicReview(selected.id, reviewForm);
      setReviews(prev => [newReview, ...prev]);
      setSelected(prev => prev ? { ...prev, total_reviews: (prev.total_reviews || 0) + 1 } : prev);
      setReviewForm({ reviewer_name: '', rating: 5, comment: '' });
      setShowReviewForm(false);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      setReviewError(err.message || 'Erreur lors de la soumission.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <p className="text-[#0D2B0D] font-bold text-lg animate-pulse">
          {searchQuery ? `Recherche "${searchQuery}"…` : 'Chargement des mécaniciens…'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <p className="text-red-700 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-[2rem] shadow-xl overflow-hidden border-8 border-[#e8e8e8]">

        {/* Header barre */}
        <div className="bg-[#0D2B0D] p-6 flex items-center justify-between gap-4">
          <h2 className="text-white text-2xl font-black uppercase italic shrink-0">Nos Mécaniciens</h2>
          {searchQuery && (
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 min-w-0">
              <span className="text-white text-sm truncate">
                Résultats pour <strong>"{searchQuery}"</strong> — {mechanics.length} trouvé{mechanics.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={onClearSearch}
                className="text-white/70 hover:text-white transition-colors shrink-0 ml-1"
                title="Effacer la recherche"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {onBack ? (
            <button onClick={onBack} className="inline-flex items-center gap-1 text-white hover:text-[#608C27] font-bold text-sm shrink-0">
              <ArrowLeft size={16} /> Retour
            </button>
          ) : null}
        </div>

        {/* État vide quand aucun résultat */}
        {mechanics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 gap-6">
            <SearchX size={64} className="text-gray-300" />
            <div className="text-center">
              <p className="text-xl font-black text-[#0D2B0D] mb-2">
                {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucun mécanicien disponible'}
              </p>
              <p className="text-gray-500 text-sm mb-6">
                {searchQuery
                  ? 'Essayez un autre nom, une ville ou une spécialité.'
                  : 'Revenez plus tard, des mécaniciens seront bientôt disponibles.'}
              </p>
              {searchQuery && onClearSearch && (
                <button
                  onClick={onClearSearch}
                  className="bg-[#608C27] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0D2B0D] transition-colors"
                >
                  Voir tous les mécaniciens
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Liste de sélection */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {mechanics.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selected?.id === m.id ? 'border-[#608C27] bg-[#608C27]/10' : 'border-gray-200 hover:border-gray-400 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                      <SafeImage
                        src={m.profile_photo_url}
                        alt={m.user_name}
                        name={m.user_name}
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#0D2B0D] truncate">{m.user_name}</p>
                      <p className="text-xs text-gray-500 truncate">{[m.neighborhood, m.city, m.department].filter(Boolean).join(', ') || 'Localisation non renseignée'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />
                        <span className="text-xs font-semibold">{m.average_rating ? Number(m.average_rating).toFixed(1) : '—'}</span>
                        <span className="text-xs text-gray-400">({m.total_reviews})</span>
                      </div>
                    </div>
                    {m.is_available ? (
                      <div className="ml-auto w-3 h-3 rounded-full bg-green-500 shrink-0" title="Disponible" />
                    ) : (
                      <div className="ml-auto w-3 h-3 rounded-full bg-gray-300 shrink-0" title="Indisponible" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Détail mécanicien */}
            {selected ? (
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg overflow-hidden">
                      <SafeImage
                        src={selected.profile_photo_url}
                        alt={selected.user_name}
                        name={selected.user_name}
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                      />
                    </div>
                    {selected.is_available ? (
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-[#0D2B0D]">{selected.user_name}</h3>
                    <p className="text-gray-500 text-sm">{[selected.neighborhood, selected.city, selected.department].filter(Boolean).join(', ') || '—'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-bold">{selected.average_rating ? Number(selected.average_rating).toFixed(1) : '—'}</span>
                      <span className="text-gray-400 text-sm">({selected.total_reviews} avis)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="Spécialité" value={selected.specialties?.map(s => s.name).join(', ') || '—'} />
                  <InfoRow label="Expérience" value={selected.years_experience ? `${selected.years_experience} ans` : '—'} />
                  <InfoRow label="Interventions" value={selected.total_interventions ?? '—'} />
                  <InfoRow label="Statut" value={selected.is_available ? '🟢 Disponible' : '⚫ Indisponible'} />
                </div>

                {selected.bio ? (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <p className="text-sm font-bold text-[#0D2B0D] mb-2 uppercase">Bio</p>
                    <p className="text-gray-700 text-sm">{selected.bio}</p>
                  </div>
                ) : null}

                {selected.is_premium ? (
                  <div className="bg-[#608C27]/10 border border-[#608C27] rounded-2xl p-4 text-center">
                    <p className="text-[#608C27] font-bold flex items-center justify-center gap-2"><Star size={16} className="text-yellow-500 fill-yellow-500" /> Mécanicien Premium — Contact direct disponible</p>
                  </div>
                ) : null}

                {/* Témoignages */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-black text-[#0D2B0D] uppercase flex items-center gap-2">
                      <MessageCircle size={20} /> Témoignages ({reviews.length > 0 ? reviews.length : selected.total_reviews || 0})
                    </h4>
                    <button
                      onClick={() => { setShowReviewForm(f => !f); setReviewError(''); }}
                      className="text-sm font-bold text-[#608C27] hover:text-[#0D2B0D] transition-colors underline"
                    >
                      {showReviewForm ? 'Annuler' : '+ Laisser un avis'}
                    </button>
                  </div>

                  {reviewSuccess && (
                    <div className="bg-green-50 border border-green-300 rounded-xl p-3 mb-4 text-green-800 font-semibold text-sm text-center">
                      Merci pour votre avis ! Il a bien été enregistré.
                    </div>
                  )}

                  {showReviewForm && (
                    <form onSubmit={handleReviewSubmit} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 space-y-4">
                      <p className="font-black text-[#0D2B0D] text-sm uppercase">Votre avis sur {selected.user_name}</p>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Note</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                              className="p-1 transition-transform hover:scale-110"
                            >
                              <Star
                                size={28}
                                className={star <= reviewForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                              />
                            </button>
                          ))}
                          <span className="ml-2 self-center text-sm font-bold text-gray-700">{reviewForm.rating}/5</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Votre nom</label>
                        <input
                          type="text"
                          value={reviewForm.reviewer_name}
                          onChange={e => setReviewForm(f => ({ ...f, reviewer_name: e.target.value }))}
                          placeholder="Ex : Jean Dupont"
                          maxLength={100}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#608C27]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Commentaire (optionnel)</label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                          placeholder="Décrivez votre expérience avec ce mécanicien…"
                          rows={3}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#608C27] resize-none"
                        />
                      </div>

                      {reviewError && (
                        <p className="text-red-600 text-sm font-semibold">{reviewError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="flex items-center gap-2 bg-[#608C27] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0D2B0D] transition-colors disabled:opacity-50"
                      >
                        <Send size={16} />
                        {reviewSubmitting ? 'Envoi…' : 'Publier mon avis'}
                      </button>
                    </form>
                  )}

                  {reviewsLoading ? (
                    <div className="text-center py-6 text-gray-500 font-semibold">
                      Chargement des avis…
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
                      Aucun témoignage disponible pour le moment.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-bold text-[#0D2B0D]">{review.reviewer_name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment ? (
                            <p className="text-gray-700 text-sm">{review.comment}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-xl">
    <label className="font-black text-sm w-32 uppercase text-[#0D2B0D] shrink-0">{label}:</label>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
);

export default InfoMecanicien;
