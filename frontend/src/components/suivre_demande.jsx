import { useState } from "react";

const Suivre = ({onbout}) => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-10 rounded-xl shadow-2xl flex flex-col items-center">
            
                <p className="text-center mt-4 font-medium">Votre demande a été bien reçu</p>
                <p className="text-center mt-2 font-bold">Statut:   <span className="text-orange-700 font-bold ml-3">En cours</span></p>

                <button 
                    onClick={onbout}
                    className="mt-6 bg-[#608C27] text-white px-8 py-2 rounded-lg font-semibold hover:bg-[#0D2B0D] hover:text-white transition-colors"
                >
                    OK
                </button>
               
            </div>
        </div>
    );
};

export default Suivre;