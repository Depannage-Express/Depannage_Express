import { useEffect, useState } from 'react'
import '../index.css'
import logo from '../assets/logo.png';
import { Search, Menu, X } from 'lucide-react'

const Header = ({
  onSignUpClick,
  onLogoutClick,
  onNavClick,
  currentView = 'accueil',
  currentUser = null,
  onSearch,
  searchQuery = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);

  // Sync local input when external query is cleared (e.g. navigate away)
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const triggerSearch = (value) => {
    if (onSearch) onSearch(value.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      triggerSearch(inputValue);
      setIsSearchOpen(false);
    }
    if (e.key === 'Escape') {
      setInputValue('');
      triggerSearch('');
      setIsSearchOpen(false);
    }
  };

  const getLinkClass = (pageName) => {
    return currentView === pageName
      ? 'text-[#608C27] font-extrabold border-b-2 border-[#608C27] pb-1'
      : 'text-slate-700 hover:text-[#608C27] transition-colors';
  };

  return (
    <header className="w-full bg-white shadow-sm relative z-50">

      <div className="max-w-screen-2xl mx-auto py-2 px-4 md:px-8 grid grid-cols-3 md:flex md:items-center md:justify-between">

      {/* 1. Logo */}
      <div className="flex items-center gap-2 md:gap-3 my-1 justify-self-start md:justify-start shrink-0">
        <img src={logo} alt="Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
        <p className="font-bold text-xs md:text-sm lg:text-base leading-tight text-slate-800">
          Dépannage <br /> Express
        </p>
      </div>

      {/* 2. Recherche */}
      <div className="flex items-center justify-center relative w-full md:max-w-xs md:mx-4 justify-self-center">
        {/* Desktop */}
        <div className="hidden md:flex relative w-full items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher un mécanicien..."
            className="text-[#0D2B0D] border border-[#0D2B0D] pl-4 pr-10 py-1.5 rounded-lg w-full transition-all duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27]"
          />
          <button
            onClick={() => triggerSearch(inputValue)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0D2B0D] hover:text-[#608C27] transition-colors"
            aria-label="Lancer la recherche"
          >
            <Search size={16} />
          </button>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center justify-center w-full">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-[#0D2B0D] hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center relative"
          >
            <Search size={22} />
            {searchQuery && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#608C27] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* 3. Navigation Desktop */}
      <nav className="hidden lg:flex items-center gap-6 font-semibold">
        <ul className="flex gap-4 lg:gap-6 items-center text-sm lg:text-base">
          <li className="cursor-pointer">
            <button onClick={() => onNavClick('accueil')} className={getLinkClass('accueil')}>Accueil</button>
          </li>
          <li className="cursor-pointer">
            <button onClick={() => onNavClick('a-propos')} className={getLinkClass('a-propos')}>À propos</button>
          </li>
          <li className="cursor-pointer">
            <button onClick={() => onNavClick('nos-techniciens')} className={getLinkClass('nos-techniciens')}>Nos Techniciens</button>
          </li>
          <li className="cursor-pointer">
            <button onClick={() => onNavClick('historique')} className={getLinkClass('historique')}>Mon historique</button>
          </li>
        </ul>
        {currentUser ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700 truncate max-w-[120px]">
              {currentUser.full_name || currentUser.email}
            </span>
            <button
              onClick={onLogoutClick}
              className="bg-red-600 text-white px-4 lg:px-5 py-2 rounded-lg font-bold hover:bg-red-800 transition-colors shadow-md text-sm whitespace-nowrap">
              Déconnexion
            </button>
          </div>
        ) : (
          <button
            onClick={onSignUpClick}
            className="bg-[#608C27] text-white px-4 lg:px-5 py-2 rounded-lg font-bold hover:bg-[#0D2B0D] transition-colors shadow-md text-sm whitespace-nowrap">
            Connexion
          </button>
        )}
      </nav>

      {/* 4. Menu Burger Mobile */}
      <div className="lg:hidden flex items-center justify-self-end md:justify-end">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-800 p-2 hover:bg-slate-100 rounded-full transition-colors focus:outline-none">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      </div>

      {/* Barre de recherche mobile — sous le header */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-t-2 border-[#608C27] px-4 py-3 shadow-xl z-50 md:hidden">
          <div className="flex items-center gap-2 border border-[#0D2B0D] rounded-xl px-3 py-2 bg-gray-50">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un mécanicien, une ville..."
              className="flex-1 bg-transparent outline-none text-sm text-[#0D2B0D] placeholder:text-gray-400"
            />
            <button
              onClick={() => { triggerSearch(inputValue); setIsSearchOpen(false); }}
              className="text-[#608C27] hover:text-[#0D2B0D] transition-colors"
              aria-label="Lancer la recherche"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => { setInputValue(''); triggerSearch(''); setIsSearchOpen(false); }}
              className="text-gray-400 hover:text-[#0D2B0D] transition-colors"
              aria-label="Fermer la recherche"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Menu Dropdown Mobile */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setIsMenuOpen(false)}></div>
          <div className="absolute top-full left-0 w-full bg-white border-t shadow-lg py-6 flex flex-col items-center gap-6 lg:hidden z-50">
            <ul className="flex flex-col items-center gap-6 font-semibold text-slate-700 w-full">
              <li className={`text-lg py-2 border-b w-4/5 text-center cursor-pointer ${currentView === 'accueil' ? 'text-[#608C27] font-bold' : ''}`} onClick={() => { onNavClick('accueil'); setIsMenuOpen(false); }}>Accueil</li>
              <li className={`text-lg py-2 border-b w-4/5 text-center cursor-pointer ${currentView === 'a-propos' ? 'text-[#608C27] font-bold' : ''}`} onClick={() => { onNavClick('a-propos'); setIsMenuOpen(false); }}>À propos</li>
              <li className={`text-lg py-2 border-b w-4/5 text-center cursor-pointer ${currentView === 'nos-techniciens' ? 'text-[#608C27] font-bold' : ''}`} onClick={() => { onNavClick('nos-techniciens'); setIsMenuOpen(false); }}>Nos Techniciens</li>
              <li className={`text-lg py-2 border-b w-4/5 text-center cursor-pointer ${currentView === 'historique' ? 'text-[#608C27] font-bold' : ''}`} onClick={() => { onNavClick('historique'); setIsMenuOpen(false); }}>Mon historique</li>
            </ul>
            {currentUser ? (
              <button onClick={() => { onLogoutClick(); setIsMenuOpen(false); }} className="bg-red-600 text-white w-4/5 py-3 rounded-lg font-bold">
                Déconnexion
              </button>
            ) : (
              <button onClick={() => { onSignUpClick(); setIsMenuOpen(false); }} className="bg-[#608C27] text-white w-4/5 py-3 rounded-lg font-bold">Connexion</button>
            )}
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
