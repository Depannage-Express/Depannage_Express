import { CheckCircle } from 'lucide-react';
const ConfirmerPaiement = ({onabout}) => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white px-20 p-10 rounded-xl shadow-2xl flex flex-col items-center">
            
                <CheckCircle 
                    size={50} 
                    className="text-white fill-[#0D2B0D] mb-6" 
                    strokeWidth={3}
                />
                <p className="text-center mt-4 font-medium">Paiement réussi <br /> avec succès</p>
                <p className="text-center mt-2 font-bold">Statut:   <span className="text-[#608C27] font-bold ml-3">Acceper</span></p>

                <button 
                    onClick={onabout}
                    className="mt-6 bg-[#608C27] text-white px-8 py-2 rounded-lg font-semibold hover:bg-[#0D2B0D] hover:text-white transition-colors"
                >
                    OK
                </button>
               
            </div>
        </div>
    );
};

export default ConfirmerPaiement;