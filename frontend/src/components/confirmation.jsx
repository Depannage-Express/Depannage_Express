import { useEffect } from "react";
import { Loader2, CheckCircle } from "lucide-react";

const Confirmation = ({ onValidation, requestId }) => {
    useEffect(() => {
        const timer = window.setTimeout(() => {
            onValidation();
        }, 2500);
        return () => window.clearTimeout(timer);
    }, [onValidation]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#608C27] p-4">
            <div className="bg-[#0D2B0D] p-10 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center max-w-sm w-full text-center">

                <div className="bg-[#608C27] p-5 rounded-full mb-6 shadow-lg">
                    <CheckCircle className="text-white w-12 h-12" />
                </div>

                <h2 className="text-white text-2xl font-extrabold uppercase tracking-wide mb-2">
                    Demande envoyée !
                </h2>
                <p className="text-white/60 text-sm mt-1 leading-relaxed">
                    Nous recherchons un mécanicien disponible près de vous…
                </p>

                {requestId && (
                    <p className="text-[#608C27] text-xs font-bold mt-4 bg-white/5 px-4 py-2 rounded-xl">
                        Réf. #{requestId}
                    </p>
                )}

                <div className="flex items-center gap-3 mt-8 text-white/50 text-sm">
                    <Loader2 className="animate-spin text-[#608C27] w-5 h-5 shrink-0" />
                    <span>Redirection en cours…</span>
                </div>
            </div>
        </div>
    );
};

export default Confirmation;
