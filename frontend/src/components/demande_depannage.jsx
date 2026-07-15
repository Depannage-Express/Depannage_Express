import { useState, useRef, useEffect } from "react";
import {
  Camera, FileText, MapPin, User, Phone, AlignLeft, Search, X,
  Wrench, Battery, Thermometer, Car, Zap, Wind, Fuel,
  AlertTriangle, Settings, Droplets, Lightbulb, Snowflake,
  HelpCircle, RefreshCw, Layers,
} from 'lucide-react';
import '../index.css';
import { createBreakdownRequest } from '../lib/api';

const BREAKDOWN_TYPES = [
  { icon: <Wrench size={16} />,      label: 'Panne moteur' },
  { icon: <Battery size={16} />,     label: 'Batterie déchargée' },
  { icon: <Layers size={16} />,      label: 'Pneu crevé' },
  { icon: <Fuel size={16} />,        label: 'Panne de carburant' },
  { icon: <Thermometer size={16} />, label: 'Surchauffe moteur' },
  { icon: <Car size={16} />,         label: 'Problème de démarrage' },
  { icon: <Zap size={16} />,         label: 'Panne électrique' },
  { icon: <Wind size={16} />,        label: 'Courroie cassée' },
  { icon: <AlertTriangle size={16} />, label: 'Frein défaillant' },
  { icon: <Settings size={16} />,    label: 'Embrayage' },
  { icon: <Droplets size={16} />,    label: 'Fuite de liquide' },
  { icon: <Wind size={16} />,        label: 'Moteur fumant' },
  { icon: <Lightbulb size={16} />,   label: 'Éclairage en panne' },
  { icon: <Car size={16} />,         label: 'Boîte de vitesses' },
  { icon: <RefreshCw size={16} />,   label: 'Alternateur' },
  { icon: <Snowflake size={16} />,   label: 'Climatisation' },
  { icon: <Layers size={16} />,      label: 'Vitre / Serrure' },
  { icon: <Settings size={16} />,    label: 'Tableau de bord' },
  { icon: <Zap size={16} />,         label: 'Accident / Collision' },
  { icon: <Wrench size={16} />,      label: 'Suspension / Amortisseurs' },
  { icon: <Droplets size={16} />,    label: 'Radiateur' },
  { icon: <HelpCircle size={16} />,  label: 'Autre panne' },
];

const STEPS = ['Identité', 'Localisation', 'Panne', 'Photos'];
const DRAFT_KEY = 'demande_depannage_draft';

const loadDraft = () => {
    try {
        const draftRaw = sessionStorage.getItem(DRAFT_KEY);
        return draftRaw ? JSON.parse(draftRaw) : null;
    } catch {
        sessionStorage.removeItem(DRAFT_KEY);
        return null;
    }
};

const Demande = ({ onConfirm }) => {
    const initialDriver = (() => {
        const draft = loadDraft();
        const savedName = localStorage.getItem('driver_name');
        const savedPhone = localStorage.getItem('driver_phone');
        return {
            name: draft?.driverName || savedName || '',
            phone: draft?.phone || savedPhone || '01',
            returning: !!(savedName && savedPhone),
        };
    })();

    const [currentStep, setCurrentStep] = useState(() => loadDraft()?.currentStep ?? 0);
    const [locationEnabled, setLocationEnabled] = useState(() => !!loadDraft()?.locationEnabled);
    const [position, setPosition] = useState(() => loadDraft()?.position ?? null);
    const [driverName, setDriverName] = useState(initialDriver.name);
    const [phone, setPhone] = useState(initialDriver.phone);
    const [isReturningDriver, setIsReturningDriver] = useState(initialDriver.returning);
    const [vehicleType, setVehicleType] = useState(() => loadDraft()?.vehicleType ?? '');
    const [vehicleBrand, setVehicleBrand] = useState(() => loadDraft()?.vehicleBrand ?? '');
    const [breakdownTypes, setBreakdownTypes] = useState(() => loadDraft()?.breakdownTypes ?? []);
    const [typeQuery, setTypeQuery] = useState('');
    const [breakdownDescription, setBreakdownDescription] = useState(() => loadDraft()?.breakdownDescription ?? '');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [photoVehicule, setPhotoVehicule] = useState(null);
    const [photoSelfie, setPhotoSelfie] = useState(null);
    const [photoIdentite, setPhotoIdentite] = useState(null);
    const [vehicleFile, setVehicleFile] = useState(null);
    const [selfieFile, setSelfieFile] = useState(null);
    const [idCardFile, setIdCardFile] = useState(null);

    useEffect(() => {
        const draft = {
            currentStep,
            driverName,
            phone,
            vehicleType,
            vehicleBrand,
            breakdownTypes,
            breakdownDescription,
            locationEnabled,
            position: position ? { latitude: position.latitude, longitude: position.longitude } : null,
        };
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, [currentStep, driverName, phone, vehicleType, vehicleBrand, breakdownTypes, breakdownDescription, locationEnabled, position]);

    const requestLocation = (onSuccess) => {
        setError('');
        if (!('geolocation' in navigator)) {
            setError('La géolocalisation n\'est pas supportée par votre navigateur.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocationEnabled(true);
                setPosition(pos.coords);
                setError('');
                if (typeof onSuccess === 'function') {
                    onSuccess();
                }
            },
            () => setError('Activez la géolocalisation pour continuer.'),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleSelfieClick = () => {
        if (!locationEnabled) {
            requestLocation(() => {
                selfieInputRef.current?.click();
            });
        } else {
            selfieInputRef.current.click();
        }
    };

    const handleLocationClick = () => {
        requestLocation();
    };

    // Refs vers les inputs cachés — toujours dans le DOM, compatibles tous navigateurs
    const vehicleInputRef = useRef(null);
    const selfieInputRef = useRef(null);
    const idCardInputRef = useRef(null);

    const toggleType = (label) => {
      setBreakdownTypes(prev =>
        prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
      );
    };

    const handlePhoneChange = (val) => {
      const digits = val.replace(/\D/g, '').slice(0, 10);
      setPhone(digits);
    };

    const filteredTypes = typeQuery.trim()
      ? BREAKDOWN_TYPES.filter(t => t.label.toLowerCase().includes(typeQuery.trim().toLowerCase()))
      : BREAKDOWN_TYPES;

    const handleFileChange = (e, setter, fileSetter) => {
        const file = e.target.files[0];
        if (!file) return;
        fileSetter(file);
        const reader = new FileReader();
        reader.onloadend = () => setter(reader.result);
        reader.readAsDataURL(file);
        // Réinitialiser la valeur pour permettre de resélectionner le même fichier
        e.target.value = '';
    };

    const validateStep = (step) => {
        if (step === 0) {
            if (!driverName.trim()) return 'Renseignez votre nom complet.';
            if (phone.length < 8) return 'Renseignez un numéro de téléphone valide.';
            if (!vehicleType) return 'Choisissez le type de véhicule.';
            return '';
        }
        if (step === 1) {
            if (!position) return "Activez la géolocalisation pour continuer.";
            return '';
        }
        if (step === 2) {
            if (breakdownTypes.length === 0) return 'Choisissez au moins un type de panne.';
            return '';
        }
        return '';
    };

    const goNext = () => {
        const stepError = validateStep(currentStep);
        if (stepError) {
            setError(stepError);
            return;
        }
        setError('');
        setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
    };

    const goBack = () => {
        setError('');
        setCurrentStep((step) => Math.max(step - 1, 0));
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
    if (!vehicleFile) {
        setError('Ajoutez la photo du véhicule.');
        return;
    }
    if (!isReturningDriver && (!selfieFile || !idCardFile)) {
        setError("Ajoutez le selfie et la pièce d'identité.");
        return;
    }

    const formData = new FormData();
    formData.append('driver_name', driverName);
    formData.append('driver_phone', '+229' + phone);
    if (idCardFile) formData.append('driver_id_card', idCardFile);
    if (selfieFile) formData.append('driver_selfie', selfieFile);
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
        localStorage.setItem('driver_name', driverName);
        localStorage.setItem('driver_phone', phone);
        sessionStorage.removeItem(DRAFT_KEY);
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

                {/* Inputs fichiers cachés — toujours dans le DOM pour compatibilité Firefox */}
                <input
                    ref={vehicleInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setPhotoVehicule, setVehicleFile)}
                />
                <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setPhotoSelfie, setSelfieFile)}
                />
                <input
                    ref={idCardInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setPhotoIdentite, setIdCardFile)}
                />

                {/* Titre */}
                <div className="flex justify-center mb-4">
                    <h2 className="bg-[#608C27] text-white text-xl font-bold px-10 py-2 rounded-full shadow-md tracking-wide">
                        Demande de dépannage
                    </h2>
                </div>

                {/* Barre de progression */}
                <div className="mb-5">
                    <div className="flex items-center mb-2">
                        {STEPS.map((label, idx) => (
                            <div key={label} className="flex-1 flex items-center last:flex-none">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${idx <= currentStep ? 'bg-[#608C27] text-white' : 'bg-white/10 text-white/40'}`}>
                                    {idx + 1}
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-1 transition-colors ${idx < currentStep ? 'bg-[#608C27]' : 'bg-white/10'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-white/50 text-[11px] uppercase tracking-widest font-bold">
                        Étape {currentStep + 1}/{STEPS.length} — {STEPS[currentStep]}
                    </p>
                </div>

                {/* Bandeau conducteur connu */}
                {currentStep === 0 && isReturningDriver && (
                    <div className="mb-5 bg-[#608C27]/20 border border-[#608C27]/40 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[#608C27] font-bold text-sm">Bon retour, {driverName} !</p>
                            <p className="text-white/50 text-xs mt-0.5">Vos informations ont été pré-remplies. Selfie et CNI optionnels.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsReturningDriver(false);
                                setDriverName('');
                                setPhone('01');
                            }}
                            className="text-white/30 text-xs hover:text-white/60 transition-colors shrink-0"
                        >
                            Changer
                        </button>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>

                    {currentStep === 0 && (
                    <>
                    {/* Nom + Téléphone côte à côte */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Nom complet</label>
                            <div className="relative">
                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Kocou Agossou"
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
                    </>
                    )}

                    {currentStep === 1 && (
                    <div className="rounded-3xl border border-[#608C27] bg-white/5 p-4 text-sm text-white/90 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-white/80 font-bold">Localisation requise</p>
                                <p className="text-[13px] text-white/70 mt-1">
                                    Votre position est nécessaire pour trouver un mécanicien proche.
                                </p>
                            </div>
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${locationEnabled ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-white/80'}`}>
                                {locationEnabled ? 'Partagée' : 'À activer'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleLocationClick}
                            className="w-full rounded-2xl bg-[#608C27] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#4f6e25]"
                        >
                            {locationEnabled ? 'Mettre à jour ma position' : 'Autoriser la localisation'}
                        </button>
                        {position && (
                            <p className="text-xs text-white/60">
                                Position capturée : {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
                                {position.accuracy ? ` (précision ~${Math.round(position.accuracy)} m)` : ''}
                            </p>
                        )}
                        {position?.accuracy > 2000 && (
                            <p className="text-xs text-amber-300 font-semibold">
                                ⚠ Position peu précise (GPS non disponible, localisation approximative par réseau).
                                Activez le GPS de votre téléphone et sortez à l'extérieur, puis appuyez sur « Mettre à jour ma position ».
                            </p>
                        )}
                    </div>
                    )}

                    {currentStep === 2 && (
                    <>
                    {/* Type de panne */}
                    <div>
                        <label className={labelClass}>
                            Type de panne <span className="text-red-400">*</span>
                            <span className="ml-2 text-white/30 normal-case font-normal">Plusieurs choix possibles</span>
                        </label>

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
                                        <span className="shrink-0">{t.icon}</span>
                                        <span className="leading-tight flex-1">{t.label}</span>
                                        {selected && <span className="text-xs shrink-0">✓</span>}
                                    </button>
                                );
                            })}
                        </div>

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

                    {/* Détails supplémentaires */}
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
                    </>
                    )}

                    {currentStep === 3 && (
                    <>
                    {/* Section Photos */}
                    <div className="space-y-3">
                        <p className={labelClass}>Photo de la panne <span className="text-red-400">*</span></p>

                        {/* Photo Véhicule — toujours obligatoire */}
                        <button
                            type="button"
                            onClick={() => vehicleInputRef.current.click()}
                            className="w-full bg-gray-200 hover:bg-gray-300 rounded-xl px-4 py-3 text-sm font-semibold transition-all flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <Camera size={16} className={photoVehicule ? 'text-[#608C27]' : 'text-gray-500'} />
                                <span className={photoVehicule ? 'text-[#608C27]' : 'text-gray-700'}>
                                    {photoVehicule ? '✓ Photo du véhicule' : 'Photo du véhicule en panne'}
                                </span>
                            </div>
                            {photoVehicule && <img src={photoVehicule} alt="Aperçu" className="w-10 h-10 rounded-lg object-cover" />}
                        </button>

                        {/* Selfie + CNI : uniquement pour les nouveaux conducteurs */}
                        {!isReturningDriver && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleSelfieClick}
                                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all flex items-center justify-between ${locationEnabled ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className={locationEnabled ? 'text-green-600' : 'text-gray-500'} />
                                        <span className={locationEnabled ? 'text-green-700' : 'text-gray-700'}>
                                            {photoSelfie
                                                ? '✓ Selfie + localisation'
                                                : locationEnabled
                                                    ? 'Prendre le selfie'
                                                    : 'Selfie + géolocalisation'}
                                        </span>
                                    </div>
                                    {photoSelfie && <img src={photoSelfie} alt="Aperçu" className="w-10 h-10 rounded-full object-cover" />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => idCardInputRef.current.click()}
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
                            </>
                        )}
                    </div>
                    </>
                    )}

                    {/* Zone notification */}
                    <div className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-center ${error ? 'bg-gray-400 text-[#0D2B0D]' : locationEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-400 text-[#0D2B0D] italic'}`}>
                        {error || (
                            currentStep === 0
                                ? 'Renseignez vos informations et le véhicule concerné.'
                                : currentStep === 1
                                    ? (locationEnabled
                                        ? '✓ Position partagée.'
                                        : isReturningDriver
                                            ? 'Partagez votre position pour trouver un mécanicien proche.'
                                            : 'La géolocalisation sera demandée pour sécuriser la demande.')
                                    : currentStep === 2
                                        ? 'Choisissez un ou plusieurs types de panne.'
                                        : "Ajoutez les photos requises avant l'envoi."
                        )}
                    </div>

                    <div className="flex gap-3 mt-2">
                        {currentStep > 0 && (
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex-1 bg-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all tracking-wide text-sm"
                            >
                                Précédent
                            </button>
                        )}
                        {currentStep < STEPS.length - 1 ? (
                            <button
                                type="button"
                                onClick={goNext}
                                className="flex-1 bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-white hover:text-[#0D2B0D] transition-all shadow-lg tracking-wide text-sm"
                            >
                                Suivant
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-[#608C27] text-white font-bold py-4 rounded-2xl hover:bg-white hover:text-[#0D2B0D] transition-all shadow-lg tracking-wide text-sm disabled:opacity-60"
                            >
                                {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Demande;
