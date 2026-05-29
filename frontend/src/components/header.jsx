import { useState } from 'react' 
import '../index.css'
import logo from '../assets/logo.png';
import { Search, Menu, X } from 'lucide-react' 

/* 1. On s'assure que le Header reçoit bien la prop currentView */
const Header = ({ onSignUpClick, onNavClick, currentView = 'accueil' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  /* 2. La fonction magique qui change la couleur selon la page active */
  const getLinkClass = (pageName) => {
    return currentView === pageName 
      ? 'text-[#608C27] font-extrabold border-b-2 border-[#608C27] pb-1' 
      : 'text-slate-700 hover:text-[#608C27] transition-colors';
  };

  return (
    <header className="w-full bg-white py-2 px-4 md:px-8 flex items-center justify-between shadow-sm relative z-50">
      
      {/* Logo */}
      <div className="flex items-center gap-2 md:gap-3 my-1 justify-start shrink-0">
        <img src={logo} alt="Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
        <p className="font-bold text-xs md:text-sm lg:text-base leading-tight text-slate-800">
          Dépannage <br /> Express
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="relative flex items-center justify-center max-w-xs w-full mx-4">         
        <input 
          type="text" 
          placeholder='Rechercher...'
          className='hidden md:block text-[#0D2B0D] border border-[#0D2B0D] pl-4 pr-10 py-1.5 rounded-lg w-full transition-all duration-300 text-sm'
        />
        <Search size={16} className="absolute right-3 text-[#0D2B0D] hidden md:block" />
      </div>

      {/* Navigation Desktop : Remplacement des classes fixes par la fonction getLinkClass */}
      <nav className="hidden xl:flex items-center gap-6 font-semibold">
        <ul className="flex gap-6 items-center text-sm lg:text-base">
          <li className="cursor-pointer">
            <button onClick={() => onNavClick('accueil')} className={getLinkClass('accueil')}>Accueil</button>
          </li>
          <li className="cursor-pointer">
            <button onClick={() => onNavClick('a-propos')} className={getLinkClass('a-propos')}>A Propos</button>
          </li>
          <li className="cursor-pointer">
            <button onClick={() => onNavClick('nos-techniciens')} className={getLinkClass('nos-techniciens')}>Nos Techniciens</button>
          </li>
          <li className="cursor-pointer">
            <button onClick={() => onNavClick('administrateur')} className={getLinkClass('administrateur')}>Administrateur</button>
          </li>
        </ul>
        <button 
          onClick={onSignUpClick}
          className="bg-[#608C27] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#0D2B0D] transition-colors shadow-md text-sm whitespace-nowrap">
          Connexion
        </button>
      </nav>

      {/* Menu Burger (Mobile & Tablette) */}
      <div className="xl:hidden flex items-center">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-800 focus:outline-none">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Menu Dropdown Mobile */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 xl:hidden" onClick={() => setIsMenuOpen(false)}></div>
          <div className="absolute top-full left-0 w-full bg-white border-t shadow-lg py-6 flex flex-col items-center gap-6 xl:hidden z-50">
            <ul className="flex flex-col items-center gap-6 font-semibold text-slate-700 w-full">
              <li className={`text-lg py-2 border-b w-4/5 text-center cursor-pointer ${currentView === 'accueil' ? 'text-[#608C27] font-bold' : ''}`} onClick={() => { onNavClick('accueil'); setIsMenuOpen(false); }}>Accueil</li>
              <li className={`text-lg py-2 border-b w-4/5 text-center cursor-pointer ${currentView === 'a-propos' ? 'text-[#608C27] font-bold' : ''}`} onClick={() => { onNavClick('a-propos'); setIsMenuOpen(false); }}>A Propos</li>
              <li className={`text-lg py-2 border-b w-4/5 text-center cursor-pointer ${currentView === 'nos-techniciens' ? 'text-[#608C27] font-bold' : ''}`} onClick={() => { onNavClick('nos-techniciens'); setIsMenuOpen(false); }}>Nos Techniciens</li>
              <li className={`text-lg py-2 border-b w-4/5 text-center cursor-pointer ${currentView === 'administrateur' ? 'text-[#608C27] font-bold' : ''}`} onClick={() => { onNavClick('administrateur'); setIsMenuOpen(false); }}>Administrateur</li>
            </ul>
            <button onClick={() => { onSignUpClick(); setIsMenuOpen(false); }} className="bg-[#608C27] text-white w-4/5 py-3 rounded-lg font-bold">Connexion</button>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;