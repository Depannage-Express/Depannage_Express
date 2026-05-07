import { Phone, Mail } from 'lucide-react'; 
import {FaFacebook} from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-10 px-8 md:px-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
        
        {/* Section Copyright */}
        <div className="flex items-center justify-center md:justify-start">
          <p className="text-sm">
            © Tout droit réservé 2026
          </p>
        </div>

        {/* Section Liens utiles */}
        <div>
          <h4 className="text-xl font-bold mb-4">Liens utiles</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#accueil" className="hover:text-[#608C27] transition-colors flex items-center justify-center md:justify-start">
                <span className="mr-2">{'>'}</span> Accueil
              </a>
            </li>
            <li>
              <a href="#propos" className="hover:text-[#608C27] transition-colors flex items-center justify-center md:justify-start">
                <span className="mr-2">{'>'}</span> A Propos
              </a>
            </li>
            <li>
              <a href="#techniciens" className="hover:text-[#608C27] transition-colors flex items-center justify-center md:justify-start">
                <span className="mr-2">{'>'}</span> Nos Techniciens
              </a>
            </li>
          </ul>
        </div>

        {/* Section Contact */}
        <div>
          <h4 className="text-xl font-bold mb-4">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center justify-center md:justify-start gap-3">
              <Phone size={18} className="text-white" />
              <span>+2290161133224 / +2290199802214</span>
            </li>
            <li className="flex items-center justify-center md:justify-start gap-3">
              <Mail size={18} className="text-white" />
              <a href="mailto:depannageexpress@gmail.com" className="hover:text-[#608C27]">
                depannageexpress@gmail.com
              </a>
            </li>
            <li className="flex items-center justify-center md:justify-start gap-3">
              <FaFacebook size={18} className="text-white" />
              <a href="" className="hover:text-[#608C27]">
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