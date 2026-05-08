

const Info = ({ onInfo }) => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-200 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
                <p className="text-center mt-4 font-medium">Merci pour votre intéret à Dépannage Express. <br />Vous serez contacté dans les 24h pour une visite technique dans votre garage ! </p>

                <button
                    onClick={onInfo} 
                    className="mt-6 bg-[#608C27] text-white px-8 py-2 rounded-lg font-semibold hover:bg-[#0D2B0D] hover:text-white transition-colors"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default Info;