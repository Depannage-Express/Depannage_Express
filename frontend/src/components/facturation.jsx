
// On ajoute la prop onBackHome
const Facturation = ({ onDisctuter, onPayer }) => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-200 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
                <p className="text-center mt-4 font-medium">Votre demande a été prise en compte, <br />vous serez facturé à (n)FCA</p>

                <div className="flex gap-10">
                    <button
                    onClick={onDisctuter} 
                    className="mt-6 bg-blue-400 text-white px-8 py-2 rounded-lg font-semibold hover:bg-[#0D2B0D] hover:text-white transition-colors"
                >
                    Discuter
                </button>

                 <button
                    onClick={onPayer} 
                    className="mt-6 bg-[#608C27] text-white px-8 py-2 rounded-lg font-semibold hover:bg-[#0D2B0D] hover:text-white transition-colors"
                >
                    Payer
                </button>
                </div>
            </div>
        </div>
    );
};

export default Facturation;