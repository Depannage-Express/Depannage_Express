import '../index.css'
import logo from '../assets/arriere.jpeg';

// On garde StatsAndTechs ici, mais on ne l'exporte pas par défaut
const StatsAndTechs = ({onContact,onVoir}) => {
  const technicians = [
    { name: "Nom & Prénom", rating: "4.8", exp: "5 ans", specialty: "Mécanicien auto", img: "/Male construction worker.jpeg" },
    { name: "Nom & Prénom", rating: "4.8", exp: "5 ans", specialty: "Mécanicien auto", img: "/Mécanicien automobile.jpeg" },
    { name: "Nom & Prénom", rating: "4.8", exp: "5 ans", specialty: "Mécanicien auto", img: "/Mechanic Quotes.jpeg" },
  ];

  return (
    // Responsive: flex-col sur mobile, flex-row sur desktop (md:)
    <section className="flex flex-col md:flex-row bg-[#608C27] border-t-4 border-[#608C27]">
      
      {/* PARTIE GAUCHE : STATISTIQUES */}
      {/* Responsive: w-full sur mobile, md:w-1/3 sur desktop */}
      <div className="w-full md:w-1/3 bg-white flex flex-col justify-center items-center py-8 gap-4">
        <div className="border-2 border-[#0D2B0D] rounded-2xl p-2 w-64 h-[70px] text-center flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-[#0D2B0D]">250+</h3>
          <p className="font-semibold text-[#0D2B0D] text-sm">de service rendus</p>
        </div>
        <div className="bg-[#0D2B0D] rounded-2xl p-2 w-64 h-[70px] text-center flex flex-col justify-center shadow-lg">
          <h3 className="text-2xl font-bold text-white">30+</h3>
          <p className="font-semibold text-white text-sm">de mécaniciens</p>
        </div>
        <div className="border-2 border-[#0D2B0D] rounded-2xl p-2 w-64 h-[70px] text-center flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-[#0D2B0D]">100+</h3>
          <p className="font-semibold text-[#0D2B0D] text-sm">de clients</p>
        </div>
      </div>

      {/* PARTIE DROITE : TECHNICIENS */}
      {/* Responsive: w-full, flex-wrap pour que les cartes reviennent à la ligne */}
<div className="w-full md:w-2/3 bg-[#608C27] flex flex-col md:flex-row items-center justify-center gap-4 py-8 px-4">        {technicians.map((tech, index) => (
          <div 
            key={index} 
            // Ta logique de couleur sur la 2ème carte (index === 1) est conservée
            className={`${
              index === 1 ? 'bg-[#0D2B0D] text-white' : 'bg-white text-[#0D2B0D]'
            } rounded-xl p-4 shadow-lg w-full max-w-[280px] border-2 border-[#0D2B0D] flex-grow md:flex-grow-0`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#608C27] shrink-0">
                <img src={tech.img} alt={tech.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className={`font-bold leading-tight text-sm md:text-base ${index === 1 ? 'text-white' : 'text-[#0D2B0D]'}`}>
                  {tech.name}
                </h4>
                <p className="text-xs font-medium">({tech.rating} avis)</p>
              </div>
            </div>

            <div className="space-y-1 mb-4 text-xs md:text-sm">
              <p><span className="font-bold">Spécialité:</span> {tech.specialty}</p>
              <p><span className="font-bold">Expérience:</span> {tech.exp}</p>
            </div>

            <div className="flex justify-between items-center gap-2">
              <button 
                onClick={onVoir}
                className="bg-[#608C27] text-white text-[10px] md:text-xs px-3 py-2 rounded-lg font-bold hover:bg-black transition-colors">
                Voir plus
              </button>
              <button 
                onClick={onContact}
                className={`${index === 1 ? 'bg-white text-[#0D2B0D]' : 'bg-black text-white'} text-[10px] md:text-xs px-3 py-2 rounded-lg font-bold hover:opacity-80 transition-colors`}>
                Contacter
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Hero = ({ onStartClick ,onVoir}) => {
  return (
    <>
      {/* Responsive: px-4 sur mobile, md:px-16 sur desktop. flex-col vs flex-row */}
      <section className="bg-[#0D2B0D] min-h-[500px] flex flex-col md:flex-row items-center px-4 md:px-16 py-12 gap-10 mt-5">
        
        {/* Responsive: texte centré sur mobile, aligné à gauche sur desktop */}
        <div className="w-full md:w-1/2 space-y-6 text-center md:text-left flex flex-col items-center md:items-start">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Bienvenue sur <br /> Dépannage Express
          </h1>
          <p className="text-lg md:text-xl text-white max-w-md">
            Une plateforme qui vous permet de trouver une solution le plus tôt possible à vos pannes techniques.
          </p>
          <button 
              onClick={onStartClick} 
              className="bg-black text-white text-base md:text-lg px-8 py-4 rounded-full font-bold hover:bg-[#608C27] transition-transform shadow-xl w-fit"
          >
            Demander un dépannage
          </button>
        </div>

        {/* Côté Image - Responsive: Centré sur mobile */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-green-950 max-w-full">
            <img 
              src={logo} 
              alt="Mécanicien au travail" 
              // Responsive: largeur auto sur desktop, full width sur mobile
              className="w-full md:w-[600px] h-auto md:h-[400px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* ON APPELLE LE COMPOSANT ICI POUR QU'IL S'AFFICHE */}
      <StatsAndTechs 
      onContact={onStartClick} 
      onVoir={onVoir}
      />
    </>
  );
};

export default Hero;