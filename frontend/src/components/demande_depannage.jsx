import { useState } from "react";
import '../index.css';
import { createBreakdownRequest } from '../lib/api';

const Demande = ({ onConfirm }) => { 
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [position, setPosition] = useState(null);
    const [driverName, setDriverName] = useState('');
    const [phone, setPhone] = useState('');
    const [breakdownDescription, setBreakdownDescription] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [photoVehicule, setPhotoVehicule] = useState(null);
    const [photoSelfie, setPhotoSelfie] = useState(null);
    const [photoIdentite, setPhotoIdentite] = useState(null);
    const [vehicleFile, setVehicleFile] = useState(null);
    const [selfieFile, setSelfieFile] = useState(null);
    const [idCardFile, setIdCardFile] = useState(null);

    const handleCapture = (event, setter, fileSetter) => {
        const file = event.target.files[0];
        if (file) {
            fileSetter(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setter(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerCamera = (captureMode, setter, fileSetter) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (captureMode) input.capture = captureMode;
        
        input.onchange = (e) => handleCapture(e, setter, fileSetter);
        input.click();
    };

    const handleLocationAndSelfie = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationEnabled(true);
                    setPosition(position.coords);
                    triggerCamera('user', setPhotoSelfie, setSelfieFile);
                },
                () => {
                    alert("Désolé, tu dois activer la localisation pour faire le selfie.");
                }
            );
        }
    };


   const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!position) {
        setError('Active la geolocalisation avant d envoyer la demande.');
        return;
    }

    if (!driverName || !phone || !breakdownDescription) {
        setError('Renseigne ton nom, ton numero et la description de la panne.');
        return;
    }

    if (!vehicleFile || !selfieFile || !idCardFile) {
        setError('Ajoute la photo du vehicule, le selfie et la piece d identite.');
        return;
    }

    const formData = new FormData();
    formData.append('driver_name', driverName);
    formData.append('driver_phone', phone);
    formData.append('driver_id_card', idCardFile);
    formData.append('driver_selfie', selfieFile);
    formData.append('vehicle_description', 'Vehicule en panne');
    formData.append('vehicle_photo', vehicleFile);
    formData.append('breakdown_description', breakdownDescription);
    formData.append('breakdown_type', 'Panne generale');
    formData.append('latitude', String(position.latitude));
    formData.append('longitude', String(position.longitude));
    formData.append('address_description', 'Position transmise depuis le navigateur');

    setIsSubmitting(true);
    try {
        const breakdown = await createBreakdownRequest(formData);
        onConfirm(breakdown);
    } catch (submitError) {
        setError(submitError.message);
    } finally {
        setIsSubmitting(false);
    }
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
                        placeholder="Votre nom complet"
                        value={driverName}
                        onChange={(event) => setDriverName(event.target.value)}
                        className="w-full bg-[#D1D5DB] rounded-lg p-3 outline-none text-gray-700"
                    />
                    <input 
                        type="text" 
                        placeholder="Décrivez votre panne" 
                        value={breakdownDescription}
                        onChange={(event) => setBreakdownDescription(event.target.value)}
                        className="w-full bg-[#D1D5DB] rounded-lg p-3 outline-none text-gray-700" 
                    />

                    {/* Photo Véhicule */}
                    <button 
                        type="button"
                        onClick={() => triggerCamera('environment', setPhotoVehicule, setVehicleFile)}
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

                    <input
                        type="tel"
                        placeholder="Votre numéro de téléphone"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="w-full bg-[#D1D5DB] text-gray-700 rounded-lg p-3 outline-none"
                    />

                    {/* Pièce d'identité */}
                    <button
                        type="button" 
                        onClick={() => triggerCamera(null, setPhotoIdentite, setIdCardFile)}
                        className="w-full bg-[#D1D5DB] rounded-lg p-3 text-gray-700 hover:bg-gray-300 flex items-center justify-between"
                    >
                        <span>{photoIdentite ? "✓ Document chargé" : "Pièce d'identité"}</span>
                        {photoIdentite && <div className="w-10 h-10 bg-gray-400 rounded flex items-center justify-center text-[10px] text-white">DOC</div>}
                    </button>

                    <div className="w-full min-h-12 rounded-lg bg-[#D1D5DB] p-3 text-sm text-gray-700">
                        {error || (locationEnabled ? 'Geolocalisation activee.' : 'La geolocalisation sera demandee pour securiser la demande.')}
                    </div>

                    <div className="flex justify-end mt-6">
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-[#608C27] text-white px-8 py-2 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors"
                        >
                            {isSubmitting ? 'Envoi...' : 'Envoyer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Demande;
