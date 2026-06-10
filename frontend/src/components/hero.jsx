import '../index.css'
import { useEffect, useState } from 'react';
import { Loader, Star, Info } from 'lucide-react';
import logo from '../assets/arriere.jpeg';
import { fetchPublicMechanics, fetchPlatformStats } from '../lib/api';

const StatBox = ({ value, label, dark }) => (
  <div
    className={`${
      dark
        ? 'bg-[#0D2B0D] shadow-lg'
        : 'border-2 border-[#0D2B0D]'
    } rounded-xl p-2 flex-1 md:flex-none md:w-52 lg:w-64 xl:w-72 h-16 md:h-[70px] text-center flex flex-col justify-center`}
  >
    <h3 className={`text-lg md:text-2xl font-bold ${dark ? 'text-white' : 'text-[#0D2B0D]'}`}>
      {value !== null ? `${value}+` : '—'}
    </h3>
    <p className={`font-semibold text-[10px] md:text-sm leading-tight ${dark ? 'text-white' : 'text-[#0D2B0D]'}`}>
      {label}
    </p>
  </div>
);

const MechanicCard = ({ tech, index, onVoir, onContact }) => {
  const isDark = index === 1 || index === 3;
  return (
    <div
      className={`${
        isDark ? 'bg-[#0D2B0D] text-white' : 'bg-white text-[#0D2B0D]'
      } rounded-xl p-3 md:p-4 shadow-lg w-full max-w-[256px] lg:max-w-[280px] border-2 border-[#0D2B0D]`}
    >
      <div className="flex items-center gap-2 md:gap-3 mb-3">
        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-[#608C27] shrink-0">
          <img
            src={tech.profile_photo || tech.user_avatar || "/Male construction worker.jpeg"}
            alt={tech.user_name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h4 className={`font-bold leading-tight text-xs md:text-sm truncate ${isDark ? 'text-white' : 'text-[#0D2B0D]'}`}>
            {tech.user_name}
          </h4>
          <p className="text-[10px] font-medium inline-flex items-center gap-1">
            ({tech.average_rating ? Number(tech.average_rating).toFixed(1) : '—'}{' '}
            <Star size={10} className="text-yellow-500 fill-yellow-500" />)
          </p>
        </div>
      </div>

      <div className="space-y-1 mb-3 text-[10px] md:text-xs">
        <p className="truncate">
          <span className="font-bold">Spécialité:</span>{' '}
          {tech.specialties?.length > 0 ? tech.specialties[0].name : 'Mécanicien auto'}
        </p>
        <p>
          <span className="font-bold">Expérience:</span>{' '}
          {tech.years_experience ? `${tech.years_experience} ans` : 'Non renseigné'}
        </p>
      </div>

      <div className="flex justify-between items-center gap-1">
        <button
          onClick={onVoir}
          className="bg-[#608C27] text-white text-[9px] md:text-[10px] px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-bold hover:bg-black transition-colors"
        >
          Voir plus
        </button>
        <button
          onClick={onContact}
          className={`${
            isDark ? 'bg-white text-[#0D2B0D]' : 'bg-black text-white'
          } text-[9px] md:text-[10px] px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-bold hover:opacity-80 transition-colors`}
        >
          Contacter
        </button>
      </div>
    </div>
  );
};

const StatsAndTechs = ({ onContact, onVoir }) => {
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total_interventions: null,
    total_mechanics: null,
    total_requests: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mechanicsData, statsData] = await Promise.all([
          fetchPublicMechanics(),
          fetchPlatformStats(),
        ]);
        const list = Array.isArray(mechanicsData)
          ? mechanicsData
          : mechanicsData.results || [];
        setTechnicians(list.filter((tech) => tech.is_premium));
        setStats(statsData);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setTechnicians([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <section className="bg-[#608C27] border-t-4 border-[#608C27]">

      {/* Ligne stats + cartes */}
      <div className="flex flex-col md:flex-row">

        {/* GAUCHE : stats — ligne horizontale sur mobile, colonne sur desktop */}
        <div className="w-full md:w-1/3 xl:w-1/4 bg-white flex flex-row md:flex-col items-center justify-center py-5 md:py-6 xl:py-10 px-3 md:px-4 gap-3 md:gap-8 xl:gap-10">
          <StatBox value={stats.total_interventions} label="de services rendus" />
          <StatBox value={stats.total_mechanics} label="de mécaniciens" dark />
          <StatBox value={stats.total_requests} label="de demandes" />
        </div>

        {/* DROITE : cartes mécaniciens */}
        <div className="w-full md:w-2/3 xl:w-3/4 bg-[#608C27] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center gap-4 py-6 lg:py-8 xl:py-10 px-4 xl:px-8 max-h-[500px] xl:max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-8">
              <Loader className="text-white animate-spin" size={32} />
            </div>
          ) : technicians.length === 0 ? (
            <div className="col-span-full text-white text-center py-8 font-semibold text-sm">
              Aucun mécanicien premium disponible pour le moment
            </div>
          ) : (
            technicians.slice(0, 6).map((tech, index) => (
              <MechanicCard
                key={tech.id}
                tech={tech}
                index={index}
                onVoir={onVoir}
                onContact={onContact}
              />
            ))
          )}
        </div>

      </div>

      {/* Note informative compacte — en dehors du flex-row */}
      <div className="bg-[#0D2B0D]/70 border-t border-white/10 px-4 py-2 flex items-center justify-center gap-2">
        <Info size={13} className="text-white/60 shrink-0" />
        <p className="text-xs text-white/60 text-center leading-snug">
          Contacter un mécanicien premium lance le même processus que votre première demande.
        </p>
      </div>

    </section>
  );
};

const Hero = ({ onStartClick, onVoir }) => {
  return (
    <>
      {/* HERO */}
      <section className="bg-[#0D2B0D] mt-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center px-4 md:px-16 py-8 md:py-12 gap-8 md:gap-10">

          {/* TEXTE */}
          <div className="w-full md:w-1/2 space-y-4 md:space-y-6 text-center md:text-left flex flex-col items-center md:items-start">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Bienvenue sur <br />
              Dépannage Express
            </h1>
            <p className="text-base md:text-xl text-white/90 max-w-md">
              Une plateforme qui vous permet de trouver une solution
              le plus tôt possible à vos pannes techniques.
            </p>
            <button
              onClick={onStartClick}
              className="bg-black text-white text-sm md:text-lg px-6 md:px-8 py-3 md:py-4 rounded-full font-bold hover:bg-[#608C27] transition-colors shadow-xl w-fit"
            >
              Demander un dépannage
            </button>
          </div>

          {/* IMAGE */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-end">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-green-950 w-full max-w-sm md:max-w-none">
              <img
                src={logo}
                alt="Mécanicien au travail"
                className="w-full md:w-[600px] h-48 sm:h-64 md:h-[400px] object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* STATS + TECHNICIENS */}
      <StatsAndTechs onContact={onStartClick} onVoir={onVoir} />
    </>
  );
};

export default Hero;
