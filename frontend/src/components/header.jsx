import { useEffect, useState } from 'react'
import '../index.css'
import logo from '../assets/logo.png';
import { Search, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { key: 'accueil',        label: 'Accueil' },
  { key: 'a-propos',       label: 'À propos' },
  { key: 'nos-techniciens',label: 'Nos Techniciens' },
  { key: 'historique',     label: 'Mon historique' },
];

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

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  /* Bloquer le scroll body quand le drawer est ouvert */
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const triggerSearch = (value) => {
    if (onSearch) onSearch(value.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { triggerSearch(inputValue); setIsSearchOpen(false); }
    if (e.key === 'Escape') { setInputValue(''); triggerSearch(''); setIsSearchOpen(false); }
  };

  const getLinkClass = (pageName) =>
    currentView === pageName
      ? 'text-[#608C27] font-extrabold border-b-2 border-[#608C27] pb-1'
      : 'text-slate-700 hover:text-[#608C27] transition-colors';

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="fixed w-full top-0 left-0 bg-white shadow-sm z-[999]">

      {/* Barre principale */}
      <div className="max-w-screen-2xl mx-auto py-2 px-4 md:px-8 grid grid-cols-3 md:flex md:items-center md:justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2 md:gap-3 my-1 justify-self-start md:justify-start shrink-0">
          <img src={logo} alt="Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
          <p className="font-bold text-xs md:text-sm lg:text-base leading-tight text-slate-800">
            Dépannage <br /> Express
          </p>
        </div>

        {/* Recherche */}
        <div className="flex items-center justify-center relative w-full md:max-w-xs md:mx-4 justify-self-center">
          {/* Desktop */}
          <div className="hidden md:flex relative w-full items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un mécanicien..."
              className="text-[#0D2B0D] border border-[#0D2B0D] pl-4 pr-10 py-1.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#608C27]"
            />
            <button
              onClick={() => triggerSearch(inputValue)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0D2B0D] hover:text-[#608C27] transition-colors"
              aria-label="Lancer la recherche"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Mobile : icône loupe */}
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

        {/* Navigation desktop (lg+) */}
        <nav className="hidden lg:flex items-center gap-6 font-semibold">
          <ul className="flex gap-4 lg:gap-6 items-center text-sm lg:text-base">
            {NAV_LINKS.map(({ key, label }) => (
              <li key={key} className="cursor-pointer">
                <button onClick={() => onNavClick(key)} className={getLinkClass(key)}>
                  {label}
                </button>
              </li>
            ))}
          </ul>
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700 truncate max-w-[120px]">
                {currentUser.full_name || currentUser.email}
              </span>
              <button
                onClick={onLogoutClick}
                className="bg-red-600 text-white px-4 lg:px-5 py-2 rounded-lg font-bold hover:bg-red-800 transition-colors shadow-md text-sm whitespace-nowrap"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <button
              onClick={onSignUpClick}
              className="bg-[#608C27] text-white px-4 lg:px-5 py-2 rounded-lg font-bold hover:bg-[#0D2B0D] transition-colors shadow-md text-sm whitespace-nowrap"
            >
              Connexion
            </button>
          )}
        </nav>

        {/* Burger (mobile + tablette) */}
        <div className="lg:hidden flex items-center justify-self-end md:justify-end">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-slate-800 p-2 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
            aria-label="Ouvrir le menu"
          >
            <Menu size={28} />
          </button>
        </div>

      </div>

      {/* Barre de recherche mobile — slide sous le header */}
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

      {/* Drawer latéral (mobile + tablette) */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeMenu}
          />

          {/* Panneau drawer */}
          <div className="fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white z-50 flex flex-col shadow-2xl lg:hidden">

            {/* En-tête drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                <span className="font-bold text-sm text-slate-800">Dépannage Express</span>
              </div>
              <button
                onClick={closeMenu}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Fermer le menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Liens */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map(({ key, label }) => (
                  <li key={key}>
                    <button
                      onClick={() => { onNavClick(key); closeMenu(); }}
                      className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-base transition-colors ${
                        currentView === key
                          ? 'bg-[#608C27]/10 text-[#608C27] font-extrabold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Bouton auth */}
            <div className="px-5 pb-8 pt-4 border-t border-slate-100 shrink-0">
              {currentUser ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-slate-500 font-medium truncate">
                    {currentUser.full_name || currentUser.email}
                  </p>
                  <button
                    onClick={() => { onLogoutClick(); closeMenu(); }}
                    className="bg-red-600 text-white w-full py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { onSignUpClick(); closeMenu(); }}
                  className="bg-[#608C27] text-white w-full py-3 rounded-xl font-bold hover:bg-[#0D2B0D] transition-colors"
                >
                  Connexion
                </button>
              )}
            </div>

          </div>
        </>
      )}

    </header>
  );
};

export default Header;
