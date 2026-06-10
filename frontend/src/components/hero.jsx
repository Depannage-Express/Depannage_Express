import '../index.css'
import { useEffect, useState } from 'react';
import { Loader, Star } from 'lucide-react';
import logo from '../assets/arriere.jpeg';
import { fetchPublicMechanics, fetchPlatformStats } from '../lib/api';

const StatsAndTechs = ({ onContact, onVoir }) => {
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total_interventions: null, total_mechanics: null, total_requests: null });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mechanicsData, statsData] = await Promise.all([
          fetchPublicMechanics(),
          fetchPlatformStats(),
        ]);
        const list = Array.isArray(mechanicsData) ? mechanicsData : (mechanicsData.results || []);
        setTechnicians(list.filter(tech => tech.is_premium));
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
<section className="flex flex-col md:flex-row bg-[#608C27] border-t-4 border-[#608C27]">
      {/* PARTIE GAUCHE : STATISTIQUES */}
      <div className="w-full md:w-1/3 xl:w-1/4 bg-white flex flex-col lg:flex-col items-center justify-center py-4 lg:py-6 xl:py-10 gap-8 xl:gap-10">

        <div className="border-2 border-[#0D2B0D] rounded-2xl p-2 w-64 md:w-52 lg:w-64 xl:w-72 h-[70px] text-center flex flex-col justify-center">
          <h3 className="lg:text-2xl md:text-2xl text-3xl font-bold text-[#0D2B0D]">
            {stats.total_interventions !== null ? `${stats.total_interventions}+` : '—'}
          </h3>
          <p className="font-semibold text-[#0D2B0D] lg:text-sm md:text-sm text-2xl">
            de services rendus
          </p>
        </div>

        <div className="bg-[#0D2B0D] rounded-2xl p-2 w-64 md:w-52 lg:w-64 xl:w-72 h-[70px] text-center flex flex-col justify-center shadow-lg">
          <h3 className="lg:text-2xl md:text-2xl text-3xl font-bold text-white">
            {stats.total_mechanics !== null ? `${stats.total_mechanics}+` : '—'}
          </h3>
          <p className="font-semibold text-white lg:text-sm md:text-sm text-2xl">
            de mécaniciens
          </p>
        </div>

        <div className="border-2 border-[#0D2B0D] rounded-2xl p-2 w-64 md:w-52 lg:w-64 xl:w-72 h-[70px] text-center flex flex-col justify-center">
          <h3 className="lg:text-2xl md:text-2xl text-3xl font-bold text-[#0D2B0D]">
            {stats.total_requests !== null ? `${stats.total_requests}+` : '—'}
          </h3>
          <p className="font-semibold text-[#0D2B0D] lg:text-sm md:text-sm text-2xl">
            de demandes
          </p>
        </div>

      </div>

      {/* PARTIE DROITE : TECHNICIENS */}
<div className="w-full md:w-2/3 xl:w-3/4 bg-[#608C27] grid grid-cols-1 justify-items-center md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-6 lg:py-8 xl:py-10 px-4 xl:px-8 max-h-[500px] xl:max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <Loader className="text-white animate-spin" size={32} />
          </div>
        ) : technicians.length === 0 ? (
          <div className="col-span-full text-white text-center py-8 font-semibold">
            Aucun mécanicien premium disponible pour le moment
          </div>
        ) : (
          technicians.slice(0, 6).map((tech, index) => (
            <div
              key={tech.id}
              className={`${
                index === 1 || index === 3
                  ? 'bg-[#0D2B0D] text-white'
                  : 'bg-white text-[#0D2B0D]'
              } rounded-xl p-4 shadow-lg w-full max-w-[256px] lg:max-w-[280px] border-2 border-[#0D2B0D]`}
            >

              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#608C27] shrink-0">
                  <img
                    src={tech.profile_photo || tech.user_avatar || "/Male construction worker.jpeg"}
                    alt={tech.user_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h4
                    className={`font-bold leading-tight text-sm md:text-base ${
                      index === 1
                        ? 'text-white'
                        : 'text-[#0D2B0D]'
                    }`}
                  >
                    {tech.user_name}
                  </h4>

                  <p className="text-xs font-medium inline-flex items-center gap-1">
                    ({tech.average_rating ? Number(tech.average_rating).toFixed(1) : "—"} <Star size={11} className="text-yellow-500 fill-yellow-500" />)
                  </p>
                </div>
              </div>

              <div className="space-y-1 mb-4 text-xs md:text-sm">
                <p>
                  <span className="font-bold">Spécialité:</span>{' '}
                  {tech.specialties?.length > 0 ? tech.specialties[0].name : 'Mécanicien auto'}
                </p>

                <p>
                  <span className="font-bold">Expérience:</span>{' '}
                  {tech.years_experience ? `${tech.years_experience} ans` : "Non renseigné"}
                </p>
              </div>

              <div className="flex justify-between items-center gap-2">

                <button
                  onClick={() => onVoir()}
                  className="bg-[#608C27] text-white text-[10px] md:text-xs px-3 py-2 rounded-lg font-bold hover:bg-black transition-colors"
                >
                  Voir plus
                </button>

                <button
                  onClick={() => onContact()}
                  className={`${
                    index === 1
                      ? 'bg-white text-[#0D2B0D]'
                      : 'bg-black text-white'
                  } text-[10px] md:text-xs px-3 py-2 rounded-lg font-bold hover:opacity-80 transition-colors`}
                >
                  Contacter
                </button>

              </div>
            </div>
          ))
        )}
      </div>
      <div className="w-full bg-white/10 border-t border-white/20 px-4 py-4 text-center text-xs text-white/80">
        Contacter un mécanicien premium lance le même processus de demande que votre première intervention, et il fonctionne de la même façon pour vos prochaines demandes.
      </div>
    </section>
  );
};

const Hero = ({ onStartClick, onVoir }) => {
  return (
    <>
      {/* HERO */}
      <section className="bg-[#0D2B0D] mt-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center px-4 md:px-16 py-12 gap-10">

        {/* TEXTE */}
        <div className="w-full md:w-1/2 space-y-6 text-center md:text-left flex flex-col items-center md:items-start">

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Bienvenue sur <br />
            Dépannage Express
          </h1>

          <p className="text-lg md:text-xl text-white max-w-md">
            Une plateforme qui vous permet de trouver une solution
            le plus tôt possible à vos pannes techniques.
          </p>

          <button
            onClick={onStartClick}
            className="bg-black text-white text-base md:text-lg px-8 py-4 rounded-full font-bold hover:bg-[#608C27] transition-transform shadow-xl w-fit"
          >
            Demander un dépannage
          </button>
        </div>

        {/* IMAGE */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end">

          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-green-950 max-w-full">

            <img
              src={logo}
              alt="Mécanicien au travail"
              className="w-full md:w-[600px] h-auto md:h-[400px] object-cover"
            />

          </div>
        </div>
        </div>
      </section>

      {/* STATS + TECHNICIENS */}
      <StatsAndTechs
        onContact={onStartClick}
        onVoir={onVoir}
      />
    </>
  );
};

export default Hero;