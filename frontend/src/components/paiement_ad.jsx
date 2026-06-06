import { useEffect, useState } from 'react';
import { Filter, Search, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { fetchAdminPayments } from '../lib/api';

const STATUS_LABELS = {
  pending: { label: 'En attente', color: 'text-yellow-500' },
  authorized: { label: 'Autorisé', color: 'text-blue-500' },
  paid: { label: 'Payé', color: 'text-green-600' },
  failed: { label: 'Échoué', color: 'text-red-500' },
  refunded: { label: 'Remboursé', color: 'text-purple-500' },
  cancelled: { label: 'Annulé', color: 'text-gray-400' },
};

const GestionPaiements = ({ onBack }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminPayments()
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.results ?? []);
        setTransactions(items.map((t) => ({
          id: t.id,
          titre: t.payment_for === 'premium_subscription' ? 'Contact Premium' : 'Intervention Mécanique',
          client: t.payer_name || 'Client inconnu',
          meca: t.mechanic_name || t.mechanic_display || '—',
          montant: `${Number(t.amount).toLocaleString('fr-FR')} FCFA`,
          date: t.created_at ? new Date(t.created_at).toLocaleString('fr-FR') : '—',
          statut: STATUS_LABELS[t.status]?.label || t.status,
          color: STATUS_LABELS[t.status]?.color || 'text-gray-500',
          raw: t,
        })));
      })
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-200 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#0D2B0D] rounded-t-[1.5rem] p-4">
        {onBack && (
          <button onClick={onBack} className="text-white text-sm font-bold hover:text-[#608C27] transition-colors shrink-0">
            ← Retour
          </button>
        )}
        <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight italic flex-1 text-center">
          Gestion des Paiements
        </h2>
      </div>

      <div className="bg-white rounded-b-[1.5rem] p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* COLONNE GAUCHE */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow border border-gray-100">
              <h3 className="font-black uppercase text-xs mb-3">Filtrage & Recherche</h3>
              <div className="flex gap-2 mb-3 flex-wrap">
                <button className="flex-1 min-w-[60px] bg-gray-50 border p-2 rounded-xl text-xs font-bold flex justify-between items-center">
                  Tous <ChevronDown size={12} />
                </button>
                <button className="flex-1 min-w-[60px] bg-gray-50 border p-2 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Filter size={12} /> Gravité
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full bg-gray-50 border rounded-xl p-2 text-xs outline-none pr-7"
                />
                <Search className="absolute right-2 top-2.5 text-gray-400" size={13} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow border border-gray-100">
              <h3 className="font-black uppercase text-xs mb-3">Transactions Récentes</h3>
              <div className="space-y-3">
                {transactions.slice(0, 3).map((t) => (
                  <div key={t.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="font-black text-xs truncate">{t.client.toUpperCase()}</p>
                    <p className="text-gray-400 text-[10px] truncate">ID: {String(t.id).slice(0, 12)}…</p>
                    <p className="text-xs mt-1">💰 {t.date}</p>
                  </div>
                ))}
                {!loading && transactions.length === 0 && (
                  <p className="text-gray-400 text-xs text-center py-2">Aucune transaction</p>
                )}
              </div>
            </div>
          </div>

          {/* COLONNE CENTRE */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-xs text-gray-700 uppercase px-1 tracking-widest">
              Transactions — File d'attente
            </h3>
            {loading && (
              <p className="text-center text-gray-400 text-sm py-8 animate-pulse">Chargement des transactions…</p>
            )}
            {!loading && transactions.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Aucune transaction pour le moment.</p>
            )}
            {transactions.map((t) => (
              <div key={t.id} className="bg-white p-4 sm:p-5 rounded-[2rem] shadow-lg border border-gray-100 flex flex-col gap-3">
                {/* Info transaction */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="flex gap-3">
                    <Star className={`${t.color} fill-current shrink-0 mt-0.5`} size={22} />
                    <div>
                      <h4 className="font-black text-xs sm:text-sm uppercase italic leading-tight">
                        ID #{t.id} | {t.titre}
                      </h4>
                      <div className="text-xs mt-2 space-y-1 text-gray-600">
                        <p>👤 <span className="font-bold text-blue-600">Client:</span> {t.client}</p>
                        <p>👷 <span className="font-bold text-yellow-600">Mécanicien:</span> {t.meca}</p>
                      </div>
                      <p className="font-black text-base text-black mt-2">Montant: {t.montant}</p>
                    </div>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="text-xs font-bold">
                      <span className={t.color}>{t.statut}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">{t.date}</p>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex flex-wrap justify-end gap-2">
                  <button className="bg-[#1a301a] text-white text-xs px-4 py-2 rounded-xl font-bold hover:scale-105 transition-transform">
                    Contrôler
                  </button>
                  <button className="bg-[#608C27] text-white text-xs px-4 py-2 rounded-xl font-bold hover:scale-105 transition-transform">
                    Valider
                  </button>
                  <button className="bg-red-600 text-white text-xs px-4 py-2 rounded-xl font-bold hover:scale-105 transition-transform">
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* COLONNE DROITE */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs text-gray-700 uppercase tracking-widest">Historique & Rapports</h3>
            <div className="bg-white p-4 rounded-[2rem] shadow-lg border border-gray-100">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                <h4 className="font-black text-xs uppercase">Détails Transaction #34</h4>
                <ChevronUp size={16} />
              </div>
              <div className="text-xs space-y-3 leading-relaxed text-gray-600">
                <p><span className="font-black">Description:</span> Intervention mécanique complète pour moteur diesel...</p>
                <p>
                  <span className="font-black">Preuves :</span>{' '}
                  <span className="text-blue-500 underline cursor-pointer">Photo facture · Photo paiement</span>
                </p>
                <div className="pt-2 space-y-2">
                  <p className="font-bold uppercase text-[10px] text-gray-400">Actions rapides</p>
                  <div className="flex flex-wrap gap-2">
                    <button className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 transition-colors">
                      Contacter
                    </button>
                    <button className="bg-red-50 text-red-500 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-red-100 transition-colors">
                      Signaler
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full py-3 border-2 border-gray-300 rounded-full text-xs font-black uppercase hover:bg-gray-50 transition-all shadow-sm">
              Rapport mensuel PDF
            </button>
            <button className="w-full py-3 border-2 border-gray-300 rounded-full text-xs font-black uppercase hover:bg-gray-50 transition-all shadow-sm">
              Rapport hebdomadaire PDF
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GestionPaiements;
