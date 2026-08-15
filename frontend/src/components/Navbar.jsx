import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Search, User, ChevronDown, LogOut, Compass, 
  Calendar, Sparkles, ShieldCheck, Ticket, CloudSun, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentSeason } from '../utils/weatherSeasonEngine';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const season = getCurrentSeason();

  const isAdmin = isAuthenticated && user?.role === 'admin';
  const isInfluencer = isAuthenticated && ((user?.role === 'influencer' && user?.influencerStatus === 'approved') || user?.role === 'admin');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Destinations', path: '/destinations' },
    { name: 'Trending Trips', path: '/destinations?filter=trending' },
    { name: 'Backpacking', path: '/community-trips' },
    { name: 'Weekend Trips', path: '/weekend-trips' },
    { name: 'Creator Program', path: '/influencer/program' },
    { name: 'Contact', path: '/contact' }
  ];

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/80 py-3 shadow-sm' 
          : 'bg-gradient-to-b from-brand-navy/90 via-brand-navy/40 to-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Seasonal Badge */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Compass size={22} />
              </div>
              <span className={`text-2xl font-black tracking-tight ${isScrolled ? 'text-brand-navy' : 'text-white'}`}>
                Wander<span className="text-brand-emerald">Luxe</span>
              </span>
            </Link>

            {/* Micro Seasonal Indicator */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white/90">
              <CloudSun size={13} className="text-brand-emerald" />
              <span>{season.name}</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-xs font-extrabold tracking-wide uppercase transition-colors hover:text-brand-emerald ${
                  link.name === 'Creator Program'
                    ? 'text-brand-emerald'
                    : isScrolled
                    ? 'text-brand-navy'
                    : 'text-white/90'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Action Area (Search, Auth, Portal) */}
          <div className="hidden lg:flex items-center gap-3">
            <Link 
              to="/destinations" 
              className={`p-2.5 rounded-2xl transition-colors flex items-center gap-2 text-xs font-bold ${
                isScrolled 
                  ? 'bg-gray-100 hover:bg-gray-200 text-brand-navy' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
              title="Search trips"
            >
              <Search size={16} />
              <span className="hidden xl:inline">Find Expeditions</span>
            </Link>

            {/* Auth Menu or Sign In */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2 p-1.5 pr-3 rounded-2xl border transition-all ${
                    isScrolled
                      ? 'border-gray-200 bg-gray-50 text-brand-navy hover:bg-gray-100'
                      : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.name}
                    className="w-7 h-7 rounded-xl object-cover border border-brand-emerald"
                  />
                  <span className="text-xs font-extrabold max-w-[100px] truncate">
                    {user.name ? user.name.split(' ')[0] : 'Traveler'}
                  </span>
                  <ChevronDown size={14} />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 z-50 text-brand-navy"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-xs font-bold text-brand-navy truncate">{user.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono truncate">{user.email}</p>
                      </div>

                      <div className="py-1 space-y-0.5 text-xs font-bold">
                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-brand-light transition-colors text-brand-navy"
                        >
                          <Ticket size={16} className="text-brand-emerald" /> My Bookings & Passes
                        </Link>

                        {isInfluencer && (
                          <Link
                            to="/influencer"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-700 transition-colors"
                          >
                            <Sparkles size={16} className="text-brand-emerald" /> Influencer Portal
                          </Link>
                        )}

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-brand-navy transition-colors"
                          >
                            <ShieldCheck size={16} className="text-brand-emerald" /> Master Administration
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                    isScrolled 
                      ? 'text-brand-navy hover:bg-gray-100' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-brand-emerald text-white text-xs font-extrabold rounded-2xl hover:bg-brand-teal transition-all shadow-md shadow-brand-emerald/20"
                >
                  Join Community
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/destinations"
              className={`p-2 rounded-xl ${isScrolled ? 'text-brand-navy' : 'text-white'}`}
            >
              <Search size={20} />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl ${isScrolled ? 'text-brand-navy' : 'text-white'}`}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-brand-navy text-white border-b border-white/10 overflow-hidden px-6 py-6"
          >
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-sm font-extrabold py-1 hover:text-brand-emerald transition-colors"
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-4 border-t border-white/10 space-y-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 text-xs font-bold text-emerald-400 py-1"
                    >
                      <Ticket size={16} /> My Bookings & Profile ({user.name})
                    </Link>
                    {isInfluencer && (
                      <Link to="/influencer" className="block text-xs font-bold text-white py-1">
                        Influencer Dashboard
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" className="block text-xs font-bold text-white py-1">
                        Admin Portal
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-xs font-bold text-red-400 py-1"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-3 pt-2">
                    <Link
                      to="/login"
                      className="flex-1 py-3 text-center rounded-2xl bg-white/10 text-white text-xs font-bold"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/signup"
                      className="flex-1 py-3 text-center rounded-2xl bg-brand-emerald text-white text-xs font-bold shadow-md"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
