import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Search, ChevronDown, LogOut, Compass, 
  Sparkles, ShieldCheck, Ticket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = isAuthenticated && user?.role === 'admin';
  const isInfluencer = isAuthenticated && ((user?.role === 'influencer' && user?.influencerStatus === 'approved') || user?.role === 'admin');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
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
    { name: 'Trending', path: '/destinations?filter=trending' },
    { name: 'Backpacking', path: '/community-trips' },
    { name: 'Weekends', path: '/weekend-trips' },
    { name: 'Creators', path: '/influencer/program' },
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
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-2 shadow-sm' 
          : 'bg-gradient-to-b from-[#0b132b]/90 via-[#0b132b]/40 to-transparent py-3.5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Compass size={18} />
            </div>
            <span className={`text-lg font-black tracking-tight ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
              Wander<span className="text-emerald-500">Luxe</span>
            </span>
          </Link>

          {/* Desktop Nav Links - Clean & Compact */}
          <div className="hidden lg:flex items-center gap-3.5 xl:gap-5 shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-[11px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${
                  link.name === 'Creators'
                    ? isScrolled ? 'text-emerald-600 hover:text-emerald-700 font-extrabold' : 'text-emerald-400 hover:text-emerald-300 font-extrabold'
                    : isScrolled
                    ? 'text-slate-600 hover:text-slate-950'
                    : 'text-white/85 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Action Area (Search, Auth, Portal) */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <Link 
              to="/destinations" 
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-[11px] font-bold border ${
                isScrolled 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80' 
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="Search trips"
            >
              <Search size={13} className={isScrolled ? 'text-slate-500' : 'text-white/80'} />
              <span className="hidden xl:inline">Search</span>
            </Link>

            {/* Auth Menu or Sign In */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-1.5 p-1 pr-2 rounded-lg border transition-all ${
                    isScrolled
                      ? 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                      : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.name}
                    className="w-5 h-5 rounded-md object-cover border border-emerald-500"
                  />
                  <span className="text-[11px] font-bold max-w-[80px] truncate">
                    {user.name ? user.name.split(' ')[0] : 'Traveler'}
                  </span>
                  <ChevronDown size={12} className={isScrolled ? 'text-slate-500' : 'text-white/70'} />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50 text-slate-800"
                    >
                      <div className="p-2.5 border-b border-slate-100">
                        <p className="text-[11px] font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
                      </div>

                      <div className="py-1 space-y-0.5 text-[11px] font-bold">
                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900"
                        >
                          <Ticket size={14} className="text-emerald-500" /> My Bookings
                        </Link>

                        {isInfluencer && (
                          <Link
                            to="/influencer"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
                          >
                            <Sparkles size={14} className="text-emerald-500" /> Creator Portal
                          </Link>
                        )}

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors"
                          >
                            <ShieldCheck size={14} className="text-emerald-500" /> Admin Portal
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    isScrolled 
                      ? 'text-slate-700 hover:text-emerald-600' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black rounded-lg transition-all shadow-sm shadow-emerald-500/20"
                >
                  Join Community
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <Link
              to="/destinations"
              className={`p-1.5 rounded-lg ${isScrolled ? 'text-slate-800' : 'text-white'}`}
            >
              <Search size={18} />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-1.5 rounded-lg ${isScrolled ? 'text-slate-800' : 'text-white'}`}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
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
            className="lg:hidden bg-[#0b132b] text-white border-b border-slate-800 overflow-hidden px-5 py-5"
          >
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-xs font-bold uppercase tracking-wider py-1 hover:text-emerald-400 transition-colors"
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-3 border-t border-slate-800 space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 text-xs font-bold text-emerald-400 py-1"
                    >
                      <Ticket size={14} /> My Bookings ({user.name})
                    </Link>
                    {isInfluencer && (
                      <Link to="/influencer" className="block text-xs font-bold text-white py-1">
                        Creator Portal
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
                      <LogOut size={14} /> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link
                      to="/login"
                      className="flex-1 py-2 text-center rounded-lg bg-slate-800 text-white text-xs font-bold"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/signup"
                      className="flex-1 py-2 text-center rounded-lg bg-emerald-500 text-white text-xs font-black shadow-md"
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
