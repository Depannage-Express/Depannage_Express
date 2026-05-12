const Suivre = ({ requestId }) => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-10 rounded-xl shadow-2xl flex flex-col items-center">
            
                <p className="text-center mt-4 font-medium">Votre demande a ete bien recue</p>
                <p className="text-center mt-2 font-bold">Statut: <span className="text-orange-700 font-bold ml-3">En cours</span></p>
                <p className="text-center mt-4 text-sm text-gray-600">
                    Veuillez patienter. Une notification vous sera envoyee si un mecanicien proche accepte votre demande.
                </p>
                {requestId ? (
                    <p className="text-center mt-3 text-xs text-gray-500">Reference : {requestId}</p>
                ) : null}
            </div>
        </div>
    );
};

export default Suivre;
