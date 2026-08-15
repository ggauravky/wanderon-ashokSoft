import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, Mail, Phone, MapPin, ShieldCheck, ArrowRight, 
  Sparkles, CheckCircle2, Award, HeartHandshake, CreditCard, Lock
} from 'lucide-react';
import { FaInstagram, FaYoutube, FaTwitter, FaFacebook } from 'react-icons/fa';

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-[#080d1e] text-white pt-20 pb-12 border-t border-slate-800">
      <div className="container mx-auto px-4 md:px-8">
        {/* Top Newsletter & Trust Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 rounded-3xl p-8 md:p-12 border border-slate-800 shadow-2xl mb-16 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3 border border-emerald-500/20">
              <Sparkles size={14} /> VIP Expedition Club
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
              Get Early Access to Limited Season Departures
            </h2>
            <p className="text-slate-400 text-xs md:text-sm font-medium mt-2">
              Subscribe to receive instant ₹1,000 member travel credits, weather-curated departure drops, and creator stories.
            </p>
          </div>

          <div className="w-full lg:w-auto">
            {subscribed ? (
              <div className="px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center gap-2">
                <CheckCircle2 size={18} /> You're on the VIP departure list! Voucher credited.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 w-full max-w-md">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="px-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-emerald-500 text-white text-xs font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 shrink-0 flex items-center justify-center gap-1.5"
                >
                  Join VIP Club <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Compass size={22} />
              </div>
              <span className="text-2xl font-black text-white">
                Wander<span className="text-emerald-400">Luxe</span>
              </span>
            </Link>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm font-medium">
              India's premier experiential group travel and backpacking expedition community. Vetted mountain stays, certified trip captains, and zero-stress curated adventures.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                <FaInstagram size={16} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                <FaYoutube size={16} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                <FaTwitter size={16} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                <FaFacebook size={16} />
              </a>
            </div>
          </div>

          {/* Col 2: Featured Expeditions */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4">
              Top Expeditions
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/trip/1" className="hover:text-white transition-colors">Meghalaya Living Roots</Link></li>
              <li><Link to="/trip/2" className="hover:text-white transition-colors">Spiti Valley Circuit</Link></li>
              <li><Link to="/trip/3" className="hover:text-white transition-colors">Bali Tropical Escape</Link></li>
              <li><Link to="/trip/4" className="hover:text-white transition-colors">Kerala Tea & Backwaters</Link></li>
              <li><Link to="/destinations" className="hover:text-white transition-colors">All 2026 Departures</Link></li>
            </ul>
          </div>

          {/* Col 3: Community & Creators */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4">
              Travel Community
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/influencer/program" className="hover:text-white transition-colors text-emerald-400 font-bold">Creator Partner Program</Link></li>
              <li><Link to="/influencer/login" className="hover:text-white transition-colors">Influencer Login</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Our Travel Captains</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Expedition Stories</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Custom Private Trip</Link></li>
            </ul>
          </div>

          {/* Col 4: Safety & Support */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4">
              Trust & Support
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/contact" className="hover:text-white transition-colors">24/7 Captain Support</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/cancellation" className="hover:text-white transition-colors">Easy Cancellation Policy</Link></li>
              <li><Link to="/admin/login" className="hover:text-white transition-colors text-slate-600 hover:text-slate-400 font-mono text-[10px]">Admin Access</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Trust & Copyright Row */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-400" /> 100% Certified Stays</span>
            <span className="flex items-center gap-1"><CreditCard size={14} className="text-emerald-400" /> Razorpay Secured</span>
            <span className="flex items-center gap-1"><Lock size={14} className="text-emerald-400" /> 256-Bit SSL</span>
          </div>

          <p className="text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} WanderLuxe Travels Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
