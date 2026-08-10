import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Send, ShieldCheck, Lock, Sparkles, CheckCircle } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-brand-navy text-white pt-20 pb-10 relative overflow-hidden">
      {/* Newsletter Section Strip */}
      <div className="container mx-auto px-4 md:px-8 mb-16">
        <div className="bg-gradient-to-r from-brand-emerald/20 via-white/5 to-brand-navy border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 backdrop-blur-xl">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/20 text-brand-emerald text-xs font-extrabold mb-3">
              <Sparkles size={14} /> Claim 500 WanderCoins
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              Unlock Secret Travel Deals & Expedition Drops
            </h3>
            <p className="text-gray-300 text-xs md:text-sm mt-2">
              Subscribe to get exclusive early-bird batch releases, private group trip discounts, and 500 bonus WanderCoins directly into your wallet.
            </p>
          </div>

          <div className="w-full lg:w-auto">
            {subscribed ? (
              <div className="bg-brand-emerald text-white px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-extrabold shadow-lg animate-fade-in">
                <CheckCircle size={20} />
                <span>Subscribed! 500 WanderCoins credited to your account.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-brand-emerald text-xs font-semibold flex-1"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-4 bg-brand-emerald hover:bg-brand-teal text-white rounded-2xl text-xs font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"
                >
                  Join Club <Send size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Col */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6">
              <span className="text-3xl font-bold tracking-tight">
                Wander<span className="text-brand-emerald">Luxe</span>
              </span>
            </Link>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              Curating premium travel experiences for the modern adventurer. Discover the world with unparalleled comfort, verified group captains, and 24/7 concierge support.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-emerald transition-colors"><FaFacebook size={16} /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-emerald transition-colors"><FaTwitter size={16} /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-emerald transition-colors"><FaInstagram size={16} /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-emerald transition-colors"><FaYoutube size={16} /></a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-white mb-6">Popular Circuits</h4>
            <ul className="space-y-3 text-xs text-gray-400 font-medium">
              <li><Link to="/destinations" className="hover:text-brand-emerald transition-colors">Meghalaya Living Bridges</Link></li>
              <li><Link to="/weekend-trips" className="hover:text-brand-emerald transition-colors">Spiti Valley Circuit</Link></li>
              <li><Link to="/community-trips" className="hover:text-brand-emerald transition-colors">Kedarkantha Winter Trek</Link></li>
              <li><Link to="/international" className="hover:text-brand-emerald transition-colors">Bali Island Getaway</Link></li>
              <li><Link to="/destinations" className="hover:text-brand-emerald transition-colors">Ladakh Bike Expedition</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-white mb-6">Company & Policies</h4>
            <ul className="space-y-3 text-xs text-gray-400 font-medium">
              <li><Link to="/about" className="hover:text-brand-emerald transition-colors">About WanderLuxe</Link></li>
              <li><Link to="/contact" className="hover:text-brand-emerald transition-colors">Custom Trip Planner</Link></li>
              <li><Link to="/privacy" className="hover:text-brand-emerald transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-brand-emerald transition-colors">Terms of Service</Link></li>
              <li><Link to="/cancellation" className="hover:text-brand-emerald transition-colors">Refund & Cancellation</Link></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-white mb-6">Contact Concierge</h4>
            <ul className="space-y-3 text-xs text-gray-400 font-medium">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-brand-emerald shrink-0 mt-0.5" />
                <span>Lucknow, UP, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-brand-emerald shrink-0" />
                <span>+91 8542036499</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-brand-emerald shrink-0" />
                <span className="truncate">kumar.gaurav.yadav2007@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Security & Payment Partners Footer Strip */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-brand-emerald font-bold">
              <Lock size={14} /> 256-Bit SSL Encrypted
            </span>
            <span className="flex items-center gap-1.5 text-white/80 font-bold">
              <ShieldCheck size={14} /> Verified Captain Guarantee
            </span>
          </div>

          <p>&copy; {new Date().getFullYear()} WanderLuxe Travels. All rights reserved.</p>

          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-extrabold">UPI Instant</span>
            <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-extrabold">VISA</span>
            <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-extrabold">Mastercard</span>
            <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-extrabold">No-Cost EMI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
