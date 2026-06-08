import { useState } from "react";
import { Camera, FileText, MapPin, User, Phone, AlignLeft, Search, X } from 'lucide-react';
import '../index.css';
import { createBreakdownRequest } from '../lib/api';

const BREAKDOWN_TYPES = [
  { emoji: '🔧', label: 'Panne moteur' },
  { emoji: '🔋', label: 'Batterie déchargée' },
  { emoji: '🛞', label: 'Pneu crevé' },
  { emoji: '⛽', label: 'Panne de carburant' },
  { emoji: '🌡️', label: 'Surchauffe moteur' },
  { emoji: '🚗', label: 'Problème de démarrage' },
  { emoji: '⚡', label: 'Panne électrique' },
  { emoji: '💨', label: 'Courroie cassée' },
  { emoji: '🛑', label: 'Frein défaillant' },
  { emoji: '🔩', label: 'Embrayage' },
  { emoji: '💧', label: 'Fuite de liquide' },
  { emoji: '🌫️', label: 'Moteur fumant' },
  { emoji: '🔦', label: 'Éclairage en panne' },
  { emoji: '🏎️', label: 'Boîte de vitesses' },
  { emoji: '🔄', label: 'Alternateur' },
  { emoji: '❄️', label: 'Climatisation' },
  { emoji: '🪟', label: 'Vitre / Serrure' },
  { emoji: '📟', label: 'Tableau de bord' },
  { emoji: '💥', label: 'Accident / Collision' },
  { emoji: '🔧', label: 'Suspension / Amortisseurs' },
  { emoji: '🌊', label: 'Radiateur' },
  { emoji: '❓', label: 'Autre panne' },
];

const Demande = ({ onConfirm }) => {
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [position, setPosition] = useState(null);
    const [driverName, setDriverName] = useState('');
    const [phone, setPhone] = useState('01');
    const [vehicleType, setVehicleType] = useState('');
    const [vehicleBrand, setVehicleBrand] = useState('');
    const [breakdownTypes, setBreakdownTypes] = useState([]);
    const [typeQuery, setTypeQuery] = useState('');

    const toggleType = (label) => {
      setBreakdownTypes(prev =>
        prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
      );
    };

    const handlePhoneChange = (val) => {
      const digits = val.replace(/\D/g, '').slice(0, 10);
      setPhone(digits);
    };

    const [breakdownDescription, setBreakdownDescription] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredTypes = typeQuery.trim()
      ? BREAKDOWN_TYPES.filter(t => t.label.toLowerCase().includes(typeQuery.trim().toLowerCase()))
      : BREAKDOWN_TYPES;

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
        input.style.display = 'none';
        document.body.appendChild(input);
        input.onchange = (e) => {
            handleCapture(e, setter, fileSetter);
            document.body.removeChild(input);
        };
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

    if (!driverName || phone.length < 8 || breakdownTypes.length === 0 || !vehicleType) {
        setError('Renseignez votre nom, votre numéro, le type de véhicule et au moins un type de panne.');
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
    formData.append('vehicle_type', vehicleType);
    formData.append('vehicle_brand', vehicleBrand);
    formData.append('vehicle_description', [vehicleType, vehicleBrand].filter(Boolean).join(' ') || 'Véhicule en panne');
    formData.append('vehicle_photo', vehicleFile);
    const typeLabel = breakdownTypes.join(', ');
    formData.append('breakdown_description', breakdownDescription || typeLabel);
    formData.append('breakdown_type', typeLabel);
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

                    {/* Type et marque de véhicule */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Type de véhicule <span className="text-red-400">*</span></label>
                            <select
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                                className={`${inputClass} appearance-none cursor-pointer`}
                            >
                                <option value="">— Choisir —</option>
                                <option value="moto">Moto</option>
                                <option value="tricycle">Tricycle</option>
                                <option value="voiture">Voiture</option>
                                <option value="camion">Camion</option>
                                <option value="bus">Bus</option>
                                <option value="camionnette">Camionnette</option>
                                <option value="autre">Autre</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Marque <span className="text-white/30 normal-case font-normal">(optionnel)</span></label>
                            <input
                                type="text"
                                placeholder="Ex : Yamaha, Toyota…"
                                value={vehicleBrand}
                                onChange={(e) => setVehicleBrand(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Type de panne */}
                    <div>
                        <label className={labelClass}>
                            Type de panne <span className="text-red-400">*</span>
                            <span className="ml-2 text-white/30 normal-case font-normal">Plusieurs choix possibles</span>
                        </label>

                        {/* Barre de recherche */}
                        <div className="relative mb-2">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Rechercher une panne…"
                                value={typeQuery}
                                onChange={(e) => setTypeQuery(e.target.value)}
                                className="w-full bg-gray-200 rounded-xl pl-8 pr-8 py-2.5 outline-none text-gray-800 placeholder-gray-500 font-semibold text-sm focus:ring-2 focus:ring-[#608C27] transition-all"
                            />
                            {typeQuery && (
                                <button type="button" onClick={() => setTypeQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Grille de sélection */}
                        <div className="max-h-44 overflow-y-auto rounded-xl grid grid-cols-2 gap-1.5 pr-0.5">
                            {filteredTypes.length === 0 && (
                                <p className="col-span-2 text-center text-gray-400 text-xs py-4">Aucun résultat</p>
                            )}
                            {filteredTypes.map((t) => {
                                const selected = breakdownTypes.includes(t.label);
                                return (
                                    <button
                                        key={t.label}
                                        type="button"
                                        onClick={() => toggleType(t.label)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border-2 text-left ${
                                            selected
                                                ? 'bg-[#608C27] text-white border-[#608C27]'
                                                : 'bg-gray-200 text-gray-700 border-transparent hover:border-[#608C27] hover:bg-gray-300'
                                        }`}
                                    >
                                        <span className="text-base shrink-0">{t.emoji}</span>
                                        <span className="leading-tight flex-1">{t.label}</span>
                                        {selected && <span className="text-xs shrink-0">✓</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Chips des sélections */}
                        {breakdownTypes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {breakdownTypes.map(label => (
                                    <span key={label} className="flex items-center gap-1 bg-[#608C27] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                        {label}
                                        <button type="button" onClick={() => toggleType(label)} className="hover:text-red-200 ml-0.5">
                                            <X size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Détails supplémentaires (optionnel) */}
                    <div>
                        <label className={labelClass}>Détails supplémentaires <span className="text-white/30">(optionnel)</span></label>
                        <div className="relative">
                            <AlignLeft size={14} className="absolute left-3 top-3 text-gray-500" />
                            <textarea
                                placeholder="Précisions supplémentaires…"
                                value={breakdownDescription}
                                onChange={(event) => setBreakdownDescription(event.target.value)}
                                rows={2}
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
