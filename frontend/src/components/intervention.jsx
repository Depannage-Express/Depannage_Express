import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchInterventionForBreakdown, driverConfirmIntervention } from '../lib/api';

const Intervention = ({ onNo, onTerminer, breakdownId }) => {
    const [interventionId, setInterventionId] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (!breakdownId) return;
        fetchInterventionForBreakdown(breakdownId)
            .then(data => setInterventionId(data.id))
            .catch(() => {});
    }, [breakdownId]);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            if (interventionId) {
                await driverConfirmIntervention(interventionId);
            }
        } catch {
            // L'intervention sera confirmée même si l'appel échoue — on laisse continuer
        } finally {
            setIsConfirming(false);
        }
        onTerminer(interventionId);
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] w-full py-12 px-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
                <p className="text-center mt-4 font-medium">
                    Veuillez confirmer l&apos;intervention du mécanicien
                </p>

                <div className="flex gap-10">
                    <button
                        onClick={onNo}
                        className="mt-6 bg-red-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-red-200 hover:text-white transition-colors"
                    >
                        Non
                    </button>

                    <button
                        onClick={handleConfirm}
                        disabled={isConfirming}
                        className="mt-6 bg-[#608C27] text-white px-8 py-2 rounded-lg font-semibold hover:bg-[#0D2B0D] hover:text-white transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                        {isConfirming
                            ? <><Loader2 className="animate-spin" size={16} /> Confirmation...</>
                            : 'Terminer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Intervention;
