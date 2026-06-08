import { MessageCircle, CreditCard, CheckCircle } from 'lucide-react';

const Facturation = ({ onDiscuter, onPayer, amount }) => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-[#608C27] p-4">
            <div className="bg-[#0D2B0D] w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-white/10 flex flex-col items-center gap-6">

                {/* Icône de confirmation */}
                <div className="bg-[#608C27]/20 rounded-full p-5">
                    <CheckCircle size={48} className="text-[#608C27]" strokeWidth={1.5} />
                </div>

                {/* Message */}
                <div className="text-center space-y-2">
                    <p className="text-white font-black text-lg uppercase tracking-tight">
                        Demande prise en compte
                    </p>
                    <p className="text-white/60 text-sm">
                        Un mécanicien a été assigné à votre demande.
                    </p>
                </div>

                {/* Montant */}
                <div className="w-full bg-[#608C27]/15 border border-[#608C27]/30 rounded-2xl px-6 py-4 text-center">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Montant à régler</p>
                    <p className="text-[#608C27] text-3xl font-black tracking-tight">
                        {amount.toLocaleString('fr-FR')}
                        <span className="text-lg ml-1">FCFA</span>
                    </p>
                </div>

                {/* Boutons */}
                <div className="w-full flex flex-col gap-3">
                    <button
                        onClick={onPayer}
                        className="w-full flex items-center justify-center gap-2 bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-white hover:text-[#0D2B0D] transition-all shadow-lg tracking-wide text-sm"
                    >
                        <CreditCard size={16} />
                        Payer maintenant
                    </button>
                    <button
                        onClick={onDiscuter}
                        className="w-full flex items-center justify-center gap-2 bg-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all tracking-wide text-sm border border-white/20"
                    >
                        <MessageCircle size={16} />
                        Discuter avec le mécanicien
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Facturation;
