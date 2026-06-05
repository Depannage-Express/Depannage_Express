
const Nofinish = ({ onFinish }) => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-200 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-lg">

        <p className="text-center text-xl font-bold text-red-600 mb-1">
          Intervention non satisfaisante
        </p>
        <p className="text-center text-sm text-gray-500 mb-6">
          Décrivez le problème rencontré. Nous ferons le suivi avec le mécanicien.
        </p>

        <div className="w-full">
          <label className="block text-[#0D2B0D] text-[11px] font-bold uppercase tracking-widest mb-2 pl-1">
            Description du problème
          </label>
          <textarea
            className="w-full bg-gray-200 rounded-xl px-4 py-3 outline-none text-black font-medium resize-none text-sm placeholder-gray-500 focus:ring-2 focus:ring-[#608C27] transition-all"
            placeholder="Expliquez ce qui s'est mal passé..."
            rows={5}
          />
        </div>

        <button
          onClick={onFinish}
          type="button"
          className="w-full bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-[#0D2B0D] transition-all shadow-lg tracking-wide text-sm mt-6"
        >
          Envoyer le signalement
        </button>

      </div>
    </div>
  );
};

export default Nofinish;
