import { useState } from "react";
import { Camera, FileText, MapPin, User, Phone, AlignLeft } from 'lucide-react';
import '../index.css';
import { createBreakdownRequest } from '../lib/api';

const Demande = ({ onConfirm }) => { 
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [position, setPosition] = useState(null);
    const [driverName, setDriverName] = useState('');
    const [phone, setPhone] = useState('01');

    const handlePhoneChange = (val) => {
      let digits = val.replace(/\D/g, '').slice(0, 10);
      if (digits.length > 0 && !digits.startsWith('01')) {
        digits = '01' + digits.slice(2);
      }
      setPhone(digits);
    };
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
        setError("Activez la géolocalisation avant d'envoyer la demande.");
        return;
    }

    if (!driverName || phone.length !== 10 || !breakdownDescription) {
        setError('Renseignez votre nom, votre numéro (10 chiffres commençant par 01) et la description.');
        return;
    }

    if (!vehicleFile || !selfieFile || !idCardFile) {
        setError("Ajoutez la photo du véhicule, le selfie et la pièce d'identité.");
        return;
    }

    const formData = new FormData();
    formData.append('driver_name', driverName);
    formData.append('driver_phone', '+229' + phone);
    formData.append('driver_id_card', idCardFile);
    formData.append('driver_selfie', selfieFile);
    formData.append('vehicle_description', 'Véhicule en panne');
    formData.append('vehicle_photo', vehicleFile);
    formData.append('breakdown_description', breakdownDescription);
    formData.append('breakdown_type', 'Panne générale');
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

    const labelClass = "block text-white/70 text-[11px] font-bold uppercase tracking-widest mb-1 pl-1";
    const inputClass = "w-full bg-gray-200 rounded-xl px-4 py-3 outline-none text-gray-800 placeholder-gray-500 font-semibold text-sm focus:ring-2 focus:ring-[#608C27] transition-all";

    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-[#608C27]">
            <div className="bg-[#0D2B0D] p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10">

                {/* Titre */}
                <div className="flex justify-center mb-8">
                    <h2 className="bg-[#608C27] text-white text-xl font-bold px-10 py-2 rounded-full shadow-md tracking-wide">
                        Demande de dépannage
                    </h2>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>

                    {/* Nom + Téléphone côte à côte */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Nom complet</label>
                            <div className="relative">
                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Jean Dupont"
                                    value={driverName}
                                    onChange={(event) => setDriverName(event.target.value)}
                                    className="w-full bg-gray-200 rounded-xl pl-8 pr-3 py-3 outline-none text-gray-800 placeholder-gray-500 font-semibold text-sm focus:ring-2 focus:ring-[#608C27] transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Téléphone</label>
                            <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-[#608C27] transition-all">
                                <span className="flex items-center gap-1 bg-gray-300 px-3 text-gray-700 font-bold text-sm select-none shrink-0">
                                    <Phone size={13} /> +229
                                </span>
                                <input
                                    type="tel"
                                    placeholder="0197654321"
                                    value={phone}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    maxLength={10}
                                    className="flex-1 bg-gray-200 px-3 py-3 outline-none text-gray-800 placeholder-gray-500 font-semibold text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClass}>Description de la panne</label>
                        <div className="relative">
                            <AlignLeft size={14} className="absolute left-3 top-3 text-gray-500" />
                            <textarea
                                placeholder="Ex : moteur qui chauffe, pneu crevé, batterie..."
                                value={breakdownDescription}
                                onChange={(event) => setBreakdownDescription(event.target.value)}
                                rows={3}
                                className="w-full bg-gray-200 rounded-xl pl-8 pr-3 py-3 outline-none text-gray-800 placeholder-gray-500 font-semibold text-sm focus:ring-2 focus:ring-[#608C27] transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Section Photos */}
                    <div className="space-y-3">
                        <p className={labelClass}>Documents requis</p>

                        {/* Photo Véhicule */}
                        <button
                            type="button"
                            onClick={() => triggerCamera('environment', setPhotoVehicule, setVehicleFile)}
                            className="w-full bg-gray-200 hover:bg-gray-300 rounded-xl px-4 py-3 text-sm font-semibold transition-all flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <Camera size={16} className={photoVehicule ? 'text-[#608C27]' : 'text-gray-500'} />
                                <span className={photoVehicule ? 'text-[#608C27]' : 'text-gray-700'}>
                                    {photoVehicule ? '✓ Photo véhicule' : 'Photo du véhicule'}
                                </span>
                            </div>
                            {photoVehicule && <img src={photoVehicule} alt="Aperçu" className="w-10 h-10 rounded-lg object-cover" />}
                        </button>

                        {/* Selfie + Géolocalisation */}
                        <button
                            type="button"
                            onClick={handleLocationAndSelfie}
                            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all flex items-center justify-between ${locationEnabled ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-200 hover:bg-gray-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <MapPin size={16} className={locationEnabled ? 'text-green-600' : 'text-gray-500'} />
                                <span className={locationEnabled ? 'text-green-700' : 'text-gray-700'}>
                                    {photoSelfie ? '✓ Selfie + localisation' : 'Selfie + géolocalisation'}
                                </span>
                            </div>
                            {photoSelfie && <img src={photoSelfie} alt="Aperçu" className="w-10 h-10 rounded-full object-cover" />}
                        </button>

                        {/* Pièce d'identité */}
                        <button
                            type="button"
                            onClick={() => triggerCamera(null, setPhotoIdentite, setIdCardFile)}
                            className="w-full bg-gray-200 hover:bg-gray-300 rounded-xl px-4 py-3 text-sm font-semibold transition-all flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <FileText size={16} className={photoIdentite ? 'text-[#608C27]' : 'text-gray-500'} />
                                <span className={photoIdentite ? 'text-[#608C27]' : 'text-gray-700'}>
                                    {photoIdentite ? "✓ Pièce d'identité" : "Pièce d'identité"}
                                </span>
                            </div>
                            {photoIdentite && <div className="w-10 h-10 bg-[#608C27] rounded-lg flex items-center justify-center text-[10px] text-white font-bold">DOC</div>}
                        </button>
                    </div>

                    {/* Zone notification */}
                    <div className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-center ${error ? 'bg-gray-400 text-[#0D2B0D]' : locationEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-400 text-[#0D2B0D] italic'}`}>
                        {error || (locationEnabled ? '✓ Géolocalisation activée.' : 'La géolocalisation sera demandée pour sécuriser la demande.')}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-white hover:text-[#0D2B0D] transition-all shadow-lg tracking-wide text-sm disabled:opacity-60 mt-2"
                    >
                        {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Demande;
