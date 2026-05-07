import { useState } from "react";
import '../index.css';

const Demande = ({ onConfirm }) => { 
    const [locationEnabled, setLocationEnabled] = useState(false);
    
    // États pour stocker les aperçus d'images
    const [photoVehicule, setPhotoVehicule] = useState(null);
    const [photoSelfie, setPhotoSelfie] = useState(null);
    const [photoIdentite, setPhotoIdentite] = useState(null);

    // Fonction pour gérer la sélection de fichier et créer l'aperçu
    const handleCapture = (event, setter) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setter(reader.result); // On stocke l'image en base64 pour l'affichage
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerCamera = (captureMode, setter) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (captureMode) input.capture = captureMode;
        
        input.onchange = (e) => handleCapture(e, setter);
        input.click();
    };

    const handleLocationAndSelfie = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationEnabled(true);
                    triggerCamera('user', setPhotoSelfie); // Caméra frontale
                },
                (error) => {
                    alert("Désolé, tu dois activer la localisation pour faire le selfie.");
                }
            );
        }
    };


   const handleSubmit = (e) => {
    e.preventDefault(); 

    onConfirm(); // Appelle la fonction de confirmation dans App.jsx
    
    
};

    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-[#608C27]">
            <div className="bg-[#0D2B0D] p-8 rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <span className="bg-[#608C27] text-white px-6 py-2 rounded-lg font-bold text-sm uppercase">
                        Demande de dépannage
                    </span>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        placeholder="Décrivez votre panne" 
                        className="w-full bg-[#D1D5DB] rounded-lg p-3 outline-none text-gray-700" 
                    />

                    {/* Photo Véhicule */}
                    <button 
                        type="button"
                        onClick={() => triggerCamera('environment', setPhotoVehicule)}
                        className="w-full bg-[#D1D5DB] rounded-lg p-3 text-gray-700 hover:bg-gray-300 flex items-center justify-between"
                    >
                        <span>{photoVehicule ? "✓ Photo Véhicule" : "Photo du Véhicule"}</span>
                        {photoVehicule && <img src={photoVehicule} alt="Aperçu" className="w-10 h-10 rounded object-cover" />}
                    </button>

                    {/* Photo Selfie */}
                    <button 
                        type="button"
                        onClick={handleLocationAndSelfie}
                        className={`w-full rounded-lg p-3 transition-colors flex items-center justify-between ${locationEnabled ? 'bg-green-100 text-green-800' : 'bg-[#D1D5DB] text-gray-700 hover:bg-gray-300'}`}
                    >
                        <span>{photoSelfie ? "✓ Selfie capturé" : "Photo selfie de vous"}</span>
                        {photoSelfie && <img src={photoSelfie} alt="Aperçu" className="w-10 h-10 rounded-full object-cover" />}
                    </button>

                    <input type="tel" placeholder="Votre numéro de téléphone" className="w-full bg-[#D1D5DB] text-gray-700 rounded-lg p-3 outline-none" />

                    {/* Pièce d'identité */}
                    <button
                        type="button" 
                        onClick={() => triggerCamera(null, setPhotoIdentite)}
                        className="w-full bg-[#D1D5DB] rounded-lg p-3 text-gray-700 hover:bg-gray-300 flex items-center justify-between"
                    >
                        <span>{photoIdentite ? "✓ Document chargé" : "Pièce d'identité"}</span>
                        {photoIdentite && <div className="w-10 h-10 bg-gray-400 rounded flex items-center justify-center text-[10px] text-white">DOC</div>}
                    </button>

                    <div className="flex justify-end mt-6">
                        <button 
                            type="submit" 
                            className="bg-[#608C27] text-white px-8 py-2 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors"
                        >
                            Envoyer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Demande;