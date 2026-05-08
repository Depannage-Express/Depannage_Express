

const Intervention = ({ onNo, onTerminer }) => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-200 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
                <p className="text-center mt-4 font-medium">Veuillez confirmer l’intervention du mécanicien</p>

                <div className="flex gap-10">
                    <button
                    onClick={onNo} 
                    className="mt-6 bg-red-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-red-200 hover:text-white transition-colors"
                >
                    Non
                </button>

                 <button
                    onClick={onTerminer} 
                    className="mt-6 bg-[#608C27] text-white px-8 py-2 rounded-lg font-semibold hover:bg-[#0D2B0D] hover:text-white transition-colors"
                >
                    Terminer
                </button>
                </div>
            </div>
        </div>
    );
};

export default Intervention;