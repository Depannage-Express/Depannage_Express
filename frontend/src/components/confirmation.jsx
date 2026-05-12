import { Loader2 } from "lucide-react";

const Confirmation = ({ onValidation, requestId }) => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-200 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
                <Loader2 className="animate-spin text-[#608C27] w-12 h-12" />
                <p className="text-center mt-4 font-medium">Recherche d'un mécanicien proche...</p>
                {requestId ? (
                    <p className="text-center mt-2 text-sm text-gray-600">Reference : {requestId}</p>
                ) : null}

                <button
                    onClick={onValidation} 
                    className="mt-6 bg-[#608C27] text-white px-8 py-2 rounded-lg font-semibold hover:bg-[#0D2B0D] hover:text-white transition-colors"
                >
                    D&apos;ACCORD
                </button>
            </div>
        </div>
    );
};

export default Confirmation;
