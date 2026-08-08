import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-brand-navy text-white pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Col */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6">
              <span className="text-3xl font-bold tracking-tight">
                Wander<span className="text-brand-emerald">Luxe</span>
              </span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Curating premium travel experiences for the modern adventurer. Discover the world with unparalleled comfort and style.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-emerald transition-colors"><FaFacebook size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-emerald transition-colors"><FaTwitter size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-emerald transition-colors"><FaInstagram size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-emerald transition-colors"><FaYoutube size={18} /></a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Explore</h4>
            <ul className="space-y-4 text-gray-400">
              <li><Link to="/destinations" className="hover:text-white transition-colors">Destinations</Link></li>
              <li><Link to="/weekend-trips" className="hover:text-white transition-colors">Weekend Escapes</Link></li>
              <li><Link to="/international" className="hover:text-white transition-colors">International Tours</Link></li>
              <li><Link to="/corporate" className="hover:text-white transition-colors">Corporate Outings</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Travel Blog</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Company</h4>
            <ul className="space-y-4 text-gray-400">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/cancellation" className="hover:text-white transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact Us</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-brand-emerald shrink-0 mt-1" />
                <span>Lucknow, UP, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-brand-emerald shrink-0" />
                <span>+91 8542036499</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-brand-emerald shrink-0" />
                <span>kumar.gaurav.yadav2007@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} WanderLuxe Travels. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/sitemap" className="hover:text-white">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
