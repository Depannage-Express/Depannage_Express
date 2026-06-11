import { Phone, Mail } from 'lucide-react';
import { FaFacebook } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-10 px-5 md:px-8 lg:px-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center md:text-left">

        {/* Copyright */}
        <div className="flex items-center justify-center md:justify-start">
          <p className="text-sm text-gray-400">
            © Tous droits réservés 2026
          </p>
        </div>

        {/* Liens utiles */}
        <div>
          <h4 className="text-lg font-bold mb-3">Liens utiles</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <a href="#accueil" className="hover:text-[#608C27] transition-colors flex items-center justify-center md:justify-start gap-1">
                <span>&rsaquo;</span> Accueil
              </a>
            </li>
            <li>
              <a href="#propos" className="hover:text-[#608C27] transition-colors flex items-center justify-center md:justify-start gap-1">
                <span>&rsaquo;</span> À propos
              </a>
            </li>
            <li>
              <a href="#techniciens" className="hover:text-[#608C27] transition-colors flex items-center justify-center md:justify-start gap-1">
                <span>&rsaquo;</span> Nos Techniciens
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-lg font-bold mb-3">Contact</h4>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start justify-center md:justify-start gap-3">
              <Phone size={16} className="text-[#608C27] shrink-0 mt-0.5" />
              <span className="break-all sm:break-normal">
                +2290161133224 / +2290199802214
              </span>
            </li>
            <li className="flex items-center justify-center md:justify-start gap-3">
              <Mail size={16} className="text-[#608C27] shrink-0" />
              <a href="mailto:contact.depannageexpress@gmail.com" className="hover:text-[#608C27] transition-colors break-all">
                contact.depannageexpress@gmail.com
              </a>
            </li>
            <li className="flex items-center justify-center md:justify-start gap-3">
              <FaFacebook size={16} className="text-[#608C27] shrink-0" />
              <a href="#" className="hover:text-[#608C27] transition-colors">
                Dépannage Express
              </a>
            </li>
          </ul>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
