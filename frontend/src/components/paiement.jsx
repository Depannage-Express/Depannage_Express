
const Paiement = ({ onPayerClick }) => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#608C27] p-4">
      <div className="bg-[#0D2B0D] p-12 rounded-lg shadow-sm w-full max-w-2xl min-h-[400px] flex flex-col justify-center">
        
        <div className="flex justify-center mb-10">
          <h2 className="bg-[#608C27] text-white text-2xl font-bold px-12 py-2 rounded-full shadow-md">
            Paiement
          </h2>
        </div>
        
        <div className="space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <label className="font-bold text-white text-lg w-48">
              Moyen de paiement
            </label>
            <div className="flex-1">
              <select className="w-full bg-[#D9D9D9] p-3 rounded-xl border-none outline-none text-gray-700 font-medium appearance-none cursor-pointer">
                <option>Type de paiement</option>
                <option>MTN Mobile Money</option>
                <option>Moov Money</option>
                <option>Celtiis</option>
                <option>Carte Bancaire</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <label className="font-bold text-white text-lg w-48">
              Votre numéros
            </label>
            <div className="flex-1 flex items-center bg-[#D9D9D9] rounded-xl px-4 py-3">

              <div className="flex items-center gap-2 border-r border-gray-400 pr-3 mr-3">
                <span className="text-2xl">🇧🇯</span>
                <span className="font-bold text-gray-700">+229</span>
              </div>
              <input 
                type="text" 
                className="bg-transparent w-full outline-none text-gray-700 font-medium"
                placeholder="Numéro de téléphone"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button 
              onClick={onPayerClick}
              className="bg-[#608C27] hover:bg-[#218838] text-white px-10 py-2 rounded-2xl font-bold text-xl transition-transform active:scale-95 shadow-md"
            >
              Payer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Paiement;