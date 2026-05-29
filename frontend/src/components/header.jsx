import { useState } from 'react' 
import '../index.css'
import logo from '../assets/logo.png';
import { Search, Menu, X } from 'lucide-react' 

const Header = ({ onSignUpClick, onNavClick, currentView = 'accueil' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getLinkClass = (pageName) => {
    return currentView === pageName 
      ? 'text-[#608C27] font-extrabold border-b-2 border-[#608C27] pb-1' 
      : 'text-slate-700 hover:text-[#608C27] transition-colors';
  };

  return (
    /* MODIFICATION : On change xl:flex en lg:flex pour s'adapter à partir de 1024px (Nest Hub) */
    <header className="w-full bg-white py-2 px-4 md:px-8 grid grid-cols-3 md:flex md:items-center md:justify-between shadow-sm relative z-50">
      
      {/* 1. BLOC GAUCHE : Logo et Nom */}
      <div className="flex items-center gap-2 md:gap-3 my-1 justify-self-start md:justify-start shrink-0">
        <img src={logo} alt="Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
        <p className="font-bold text-xs md:text-sm lg:text-base leading-tight text-slate-800">
          Dépannage <br /> Express
        </p>
      </div>

      {/* 2. BLOC CENTRAL : Recherche */}
      <div className="flex items-center justify-center relative w-full md:max-w-xs md:mx-4 justify-self-center">         
        {/* Version Desktop / Tablette (md et plus) */}
        <div className="hidden md:block relative w-full">
          <input 
            type="text" 
            placeholder='Rechercher...'
            className='text-[#0D2B0D] border border-[#0D2B0D] pl-4 pr-10 py-1.5 rounded-lg w-full transition-all duration-300 text-sm'
          />
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0D2B0D]" />
        </div>
        
        {/* Version Mobile (sous md) */}
        <div className="md:hidden flex items-center justify-center w-full">
          {isSearchOpen ? (
            <div className="absolute left-1/2 -translate-x-1/2 top-[-14px] flex items-center bg-white border border-[#0D2B0D] rounded-lg px-2 py-1 shadow-lg z-50 w-[150px]">
              <input 
                autoFocus
                type="text" 
                placeholder='Rechercher...'
                className='text-[#0D2B0D] w-full bg-transparent outline-none p-1 text-xs'
              />
              <button onClick={() => setIsSearchOpen(false)}>
                <X size={16} className="text-[#0D2B0D] shrink-0" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsSearchOpen(true)} 
              className="p-2 text-[#0D2B0D] hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center"
            >
              <Search size={22} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Navigation Desktop (MODIFICATION : visible à partir de lg au lieu de xl) */}
      <nav className="hidden lg:flex items-center gap-6 font-semibold">
        <ul className="flex gap-4 lg:gap-6 items-center text-sm lg:text-base">
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
          className="bg-[#608C27] text-white px-4 lg:px-5 py-2 rounded-lg font-bold hover:bg-[#0D2B0D] transition-colors shadow-md text-sm whitespace-nowrap">
          Connexion
        </button>
      </nav>

      {/* 4. Menu Burger (MODIFICATION : caché à partir de lg au lieu de xl) */}
      <div className="lg:hidden flex items-center justify-self-end md:justify-end">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-800 p-2 hover:bg-slate-100 rounded-full transition-colors focus:outline-none">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Menu Dropdown Mobile (MODIFICATION : caché à partir de lg) */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setIsMenuOpen(false)}></div>
          <div className="absolute top-full left-0 w-full bg-white border-t shadow-lg py-6 flex flex-col items-center gap-6 lg:hidden z-50">
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