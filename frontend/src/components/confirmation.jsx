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
        <div className="flex justify-center items-center min-h-screen bg-gray-200 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center">
                <CheckCircle className="text-[#608C27] w-12 h-12 mb-3" />
                <p className="font-bold text-lg text-[#0D2B0D]">Demande envoyée !</p>
                <p className="text-gray-500 text-sm mt-2">Nous recherchons un mécanicien disponible près de vous...</p>
                {requestId ? (
                    <p className="text-xs text-gray-400 mt-3">Référence : {requestId}</p>
                ) : null}
                <Loader2 className="animate-spin text-[#608C27] w-6 h-6 mt-5" />
            </div>
        </div>
    );
};

export default Confirmation;
