import { useState } from 'react' 
import '../index.css'
import logo from '../assets/logo.png';
import { Search, Menu, X } from 'lucide-react' 

const Header = ({onSignUpClick, onNavClick}) => {
  // État pour savoir si le menu mobile est ouvert ou fermé
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white py-1 px-4 md:px-8 flex justify-between items-center shadow-sm relative z-50">
      {/* Logo et Nom */}
      <div className="flex items-center gap-1 md:gap-3 m-4">
        <img src={logo} alt="Logo" className="w-12 h-12 md:w-20 md:h-20 object-contain" />
        <p className="font-bold text-sm md:text-xl leading-tight text-slate-800">
          Dépannage <br /> Express
        </p>
      </div>

      {/* Barre de recherche (Icône seule sur mobile) */}
      <div className="relative flex items-center">
        <input 
          type="text" 
          placeholder='Recherchez un Mécanicien'
          className='hidden md:block text-[#0D2B0D] border border-[#0D2B0D] pl-4 pr-10 py-2 rounded-lg w-64'
        />
        <Search 
          size={18} 
          className="absolute right-3 text-[#0D2B0D] hidden md:block" 
        />
        {/* Icône recherche mobile */}
        <div className="md:hidden p-2 text-[#0D2B0D]">
          <Search size={24} />
        </div>
      </div>

      {/* Navigation Desktop */}
      <nav className="hidden lg:flex items-center gap-10">
        <ul className="flex gap-8 font-semibold text-slate-700">
          <li className="font-bold text-lg cursor-pointer hover:text-[#608C27] transition">
            <button 
              onClick={() => onNavClick('accueil')} 
              className="hover:text-[#608C27] font-bold"
            >
            Accueil
            </button>
          </li>
          <li className="font-bold text-lg cursor-pointer hover:text-[#608C27] transition">
            <button 
              onClick={() => onNavClick('a-propos')} 
              className="hover:text-[#608C27] font-bold"
            >
            A Propos
            </button>
          </li>
          <li className="font-bold text-lg cursor-pointer hover:text-[#608C27] transition">
            <button 
              onClick={() => onNavClick('nos-techniciens')} 
              className="hover:text-[#608C27] font-bold"
            >
            Nos Techniciens
            </button>
          </li>
        </ul>
        <button 
          onClick={onSignUpClick}
          className="bg-[#608C27] text-white px-6 py-2 m-7 rounded-lg font-bold hover:bg-[#0D2B0D] transition-colors shadow-md">
          Connexion
        </button>
      </nav>

      {/* Bouton Hamburger */}
      <div className="lg:hidden flex items-center">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-800 focus:outline-none">
          {isMenuOpen ? <X size={30} /> : <Menu size={30} />}
        </button>
      </div>

     
      {/* Menu Mobile  */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-t shadow-lg py-6 flex flex-col items-center gap-6 lg:hidden animate-in fade-in slide-in-from-top-5">
            <ul className="flex flex-col items-center gap-6 font-semibold text-slate-700 w-full">
              {/* CORRECTION ICI : Ajouter onNavClick sur chaque élément mobile */}
              <li 
                className="text-xl py-2 border-b w-4/5 text-center cursor-pointer" 
                onClick={() => { onNavClick('accueil'); setIsMenuOpen(false); }}
              >
                Accueil
              </li>
              <li 
                className="text-xl py-2 border-b w-4/5 text-center cursor-pointer" 
                onClick={() => { onNavClick('a-propos'); setIsMenuOpen(false); }}
              >
                A Propos
              </li>
              <li 
              
                className="text-xl py-2 border-b w-4/5 text-center cursor-pointer" 
                onClick={() => { onNavClick('nos-techniciens'); setIsMenuOpen(false); }}
              >
                Nos Techniciens
              </li>
            </ul>
    
            <button 
              onClick={() => { onSignUpClick(); setIsMenuOpen(false); }}
              className="bg-[#608C27] text-white w-4/5 py-3 rounded-lg font-bold shadow-md"
            >
              Connexion
            </button>
          </div>
        )}
    </header>
  );
};

export default Header;