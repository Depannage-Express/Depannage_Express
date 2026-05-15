import { useState } from 'react' 
import '../index.css'
import logo from '../assets/logo.png';
import { Search, Menu, X } from 'lucide-react' 

const Header = ({onSignUpClick, onNavClick}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="w-full bg-white py-1 px-4 md:px-8 flex items-center shadow-sm relative z-50">
      {/* 1. Logo et Nom */}
      <div className="flex items-center gap-2 md:gap-3 my-2 md:my-3 shrink-0">
        <img src={logo} alt="Logo" className="w-10 h-10 md:w-16 md:h-16 object-contain" />
        <p className="font-bold text-xs md:text-lg leading-tight text-slate-800">
          Dépannage <br /> Express
        </p>
      </div>

      {/* 2. Barre de recherche  */}
      <div className="relative flex items-center ml-4 md:ml-12 shrink-0">
        {/* Input  */}
        <input 
          type="text" 
          placeholder='Rechercher...'
          className='hidden md:block text-[#0D2B0D] border border-[#0D2B0D] pl-4 pr-10 py-2 rounded-lg w-32 lg:w-60 focus:w-44 lg:focus:w-64 transition-all duration-300'
        />
        {/* Loupe interne  */}
        <Search 
          size={18} 
          className="absolute right-3 text-[#0D2B0D] hidden md:block" 
        />
        
        {/* Recherche Mobile */}
        <div className="md:hidden flex items-center">
          {isSearchOpen ? (
            <div className="absolute left-0 top-[-8px] flex items-center bg-white border border-[#0D2B0D] rounded-lg px-2 py-1 shadow-lg z-50 w-[180px]">
              <input 
                autoFocus
                type="text" 
                placeholder='Rechercher...'
                className='text-[#0D2B0D] w-full bg-transparent outline-none p-1 text-xs'
              />
              <button onClick={() => setIsSearchOpen(false)}>
                <X size={18} className="text-[#0D2B0D]" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#0D2B0D]"
            >
              <Search size={22} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Navigation Desktop */}
      <nav className="hidden lg:flex items-center ml-auto">
        <ul className="flex gap-4 xl:gap-8 font-semibold text-slate-700">
          <li className="font-bold text-sm xl:text-lg cursor-pointer">
            <button onClick={() => onNavClick('accueil')} className="hover:text-[#608C27] transition-colors">Accueil</button>
          </li>
          <li className="font-bold text-sm xl:text-lg cursor-pointer">
            <button onClick={() => onNavClick('a-propos')} className="hover:text-[#608C27] transition-colors">A Propos</button>
          </li>
          <li className="font-bold text-sm xl:text-lg cursor-pointer">
            <button onClick={() => onNavClick('nos-techniciens')} className="hover:text-[#608C27] transition-colors">Nos Techniciens</button>
          </li>
          <li className="font-bold text-sm xl:text-lg cursor-pointer">
            <button onClick={() => onNavClick('administrateur')} className="hover:text-[#608C27] transition-colors">Administrateur</button>
          </li>
        </ul>
        <button 
          onClick={onSignUpClick}
          className="bg-[#608C27] text-white px-4 xl:px-6 py-2 ml-4 xl:ml-8 rounded-lg font-bold hover:bg-[#0D2B0D] transition-colors shadow-md text-sm xl:text-base whitespace-nowrap">
          Connexion
        </button>
      </nav>

      {/* 4. Menu Burger (Visible sur mobile et tablette sous 1024px) */}
      <div className="lg:hidden flex items-center ml-auto">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-800 focus:outline-none">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Menu Mobile Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-t shadow-lg py-6 flex flex-col items-center gap-6 lg:hidden">
          <ul className="flex flex-col items-center gap-6 font-semibold text-slate-700 w-full">
            <li className="text-lg py-2 border-b w-4/5 text-center cursor-pointer" onClick={() => { onNavClick('accueil'); setIsMenuOpen(false); }}>Accueil</li>
            <li className="text-lg py-2 border-b w-4/5 text-center cursor-pointer" onClick={() => { onNavClick('a-propos'); setIsMenuOpen(false); }}>A Propos</li>
            <li className="text-lg py-2 border-b w-4/5 text-center cursor-pointer" onClick={() => { onNavClick('nos-techniciens'); setIsMenuOpen(false); }}>Nos Techniciens</li>
            <li className="text-lg py-2 border-b w-4/5 text-center cursor-pointer" onClick={() => { onNavClick('administrateur'); setIsMenuOpen(false); }}>Administrateur</li>
          </ul>
          <button onClick={() => { onSignUpClick(); setIsMenuOpen(false); }} className="bg-[#608C27] text-white w-4/5 py-3 rounded-lg font-bold">Connexion</button>
        </div>
      )}
    </header>
  );
};

export default Header;