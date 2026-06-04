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
    /* FOND GLOBAL AVEC LA BANDE VERTE COMME IMAGE 1 */
    <div className="min-h-screen bg-gray-200 relative font-sans">
      
      {/* ENTETE INTERNE (Copie conforme Image 1) */}
      <div className="flex justify-center items-center bg-[#0D2B0D] rounded-t-[1.5rem] p-6 border-b border-gray-200 max-w-[95%] mx-auto mt-10">
        {onBack && (
          <button onClick={onBack} className="text-white text-sm font-bold hover:text-[#608C27] transition-colors mr-4">
            ← Retour
          </button>
        )}
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Gestion des Paiements</h2>
      </div>

      <div className="bg-white rounded-b-[1.5rem] p-8 max-w-[95%] mx-auto shadow-2xl border-x-8 border-b-8 border-white">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* COLONNE GAUCHE */}
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100">
              <h3 className="font-black uppercase text-xs mb-4">Filtrage & Recherche</h3>
              <div className="flex gap-2 mb-4">
                <button className="flex-1 bg-gray-50 border p-2 rounded-xl text-[10px] font-bold flex justify-between items-center">Tous <ChevronDown size={12}/></button>
                <button className="flex-1 bg-gray-50 border p-2 rounded-xl text-[10px] font-bold flex justify-between items-center"><Filter size={12}/> Gravité</button>
              </div>
              <div className="relative">
                <input type="text" placeholder="Rechercher..." className="w-full bg-gray-50 border rounded-xl p-2 text-[10px] outline-none" />
                <Search className="absolute right-3 top-2 text-gray-400" size={14} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100">
              <h3 className="font-black uppercase text-[10px] mb-4">Transactions Récentes</h3>
              <div className="space-y-3">
                {transactions.slice(0, 3).map((t) => (
                  <div key={t.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-[10px]">
                    <p className="font-black truncate">{t.client.toUpperCase()}</p>
                    <p className="text-gray-400 text-[8px] truncate">ID: {String(t.id).slice(0, 12)}…</p>
                    <p className="mt-1">👤 {t.client}</p>
                    <p>💰 {t.date}</p>
                  </div>
                ))}
                {!loading && transactions.length === 0 && (
                  <p className="text-gray-400 text-[10px] text-center py-2">Aucune transaction</p>
                )}
              </div>
            </div>
          </div>

          {/* COLONNE CENTRE (FILE D'ATTENTE) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-sm text-gray-700 uppercase px-2 tracking-widest">Transactions (File d'attente)</h3>
            {loading && (
              <p className="text-center text-gray-400 text-sm py-8 animate-pulse">Chargement des transactions…</p>
            )}
            {!loading && transactions.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Aucune transaction pour le moment.</p>
            )}
            {transactions.map((t) => (
              <div key={t.id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-50 relative group min-h-[180px]">
                <div className="flex justify-between items-stretch h-full">
                  {/* Partie Gauche : Détails et Montant */}
                  <div className="flex gap-4">
                    <Star className={`${t.color} fill-current`} size={28} />
                    <div className="flex flex-col justify-between">
                      <div>
                        <h4 className="font-black text-[13px] uppercase italic">ID #{t.id} | {t.titre}</h4>
                        <div className="text-[12px] mt-3 space-y-1 text-gray-600">
                          <p>👤 <span className="font-bold text-blue-600">Client:</span> {t.client}</p>
                          <p>👷 <span className="font-bold text-yellow-600">Mécanicien:</span> {t.meca}</p>
                        </div>
                      </div>
                      <p className="text-xl flex font-black text-black mt-4">Montant: {t.montant}</p>
                    </div>
                  </div>
                  
                  {/* Partie Droite : Statut et Boutons alignés en bas */}
                  <div className="flex flex-col justify-between items-end">
                    <div className="text-right">
                      <p className="text-[10px] font-bold">Payé ● {t.statut} <span className="text-red-500">●</span></p>
                      <p className="text-[9px] text-gray-400 font-bold">Date: {t.date}</p>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button className="bg-[#1a301a] text-white text-[10px] px-4 py-2 rounded-xl font-bold hover:scale-105 transition-transform">Contrôler</button>
                      <button className="bg-[#608C27] text-white text-[10px] px-4 py-2 rounded-xl font-bold hover:scale-105 transition-transform">Valider</button>
                      <button className="bg-red-600 text-white text-[10px] px-4 py-2 rounded-xl font-bold hover:scale-105 transition-transform">Rejeter</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* COLONNE DROITE */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-gray-700 uppercase tracking-widest">Historique & Rapports</h3>
            <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-100">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <h4 className="font-black text-[11px] uppercase">Détails Transaction #34</h4>
                <ChevronUp size={18} />
              </div>
              <div className="text-[11px] space-y-4 leading-relaxed text-gray-600">
                <p><span className="font-black">Description:</span> Intervention mécanique complète pour moteur diesel...</p>
                <p><span className="font-black">Preuves :</span> <span className="text-blue-500 underline">Photo facture · Photo paiement</span></p>
                <div className="pt-4 space-y-2">
                  <p className="font-bold uppercase text-[9px] text-gray-400">Actions rapides</p>
                  <div className="flex flex-wrap gap-1">
                     <button className="bg-gray-100 text-gray-700 text-[9px] px-2 py-1 rounded font-bold hover:bg-gray-200">Contacter</button>
                     <button className="bg-red-50 text-red-500 text-[9px] px-2 py-1 rounded font-bold hover:bg-red-100">Signaler</button>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full py-4 border-2 border-gray-300 rounded-full text-[11px] font-black uppercase hover:bg-gray-50 transition-all shadow-sm">Rapport mensuel PDF</button>
            <button className="w-full py-4 border-2 border-gray-300 rounded-full text-[11px] font-black uppercase hover:bg-gray-50 transition-all shadow-sm">Rapport hebdomadaire PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionPaiements;