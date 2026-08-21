import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Search, ChevronDown, LogOut, Compass, 
  Sparkles, ShieldCheck, Ticket, Heart, User, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getWishlistIds } from '../utils/userHistory';
import AIPlannerModal from './AIPlannerModal';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const dropdownRef = useRef(null);
  
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = isAuthenticated && user?.role === 'admin';
  const isInfluencer = isAuthenticated && ((user?.role === 'influencer' && user?.influencerStatus === 'approved') || user?.role === 'admin');

  // Update wishlist count on route change / local storage events
  useEffect(() => {
    const updateCount = () => {
      try {
        const ids = getWishlistIds();
        setWishlistCount(ids.length);
      } catch (e) {
        setWishlistCount(0);
      }
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    return () => window.removeEventListener('storage', updateCount);
  }, [location.pathname]);

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
    setUserDropdownOpen(false);
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
    <>
      <AIPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        initialDestination="Meghalaya"
      />

      <nav
        className={`fixed w-full z-40 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-2.5 shadow-sm' 
            : 'bg-gradient-to-b from-[#0b132b]/90 via-[#0b132b]/50 to-transparent py-4'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between gap-3">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30 group-hover:scale-105 transition-transform shrink-0">
                <Compass size={18} />
              </div>
              <span className={`text-lg font-black tracking-tight ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
                Wander<span className="text-emerald-500">Luxe</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-6 shrink-0">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || (link.path.includes('?') && location.search === link.path.split('?')[1]);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`text-xs font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${
                      link.name === 'Creators'
                        ? isScrolled 
                          ? 'text-emerald-600 hover:text-emerald-700 font-black' 
                          : 'text-emerald-400 hover:text-emerald-300 font-black'
                        : isScrolled
                        ? isActive ? 'text-emerald-600 font-black' : 'text-slate-600 hover:text-slate-950'
                        : isActive ? 'text-emerald-400 font-black' : 'text-white/85 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Action Area: Search, AI Planner, Wishlist & Profile */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search Trigger */}
              <Link 
                to="/destinations" 
                className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold border ${
                  isScrolled 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title="Search destinations"
              >
                <Search size={14} className={isScrolled ? 'text-slate-600' : 'text-white/80'} />
                <span className="hidden xl:inline">Search</span>
              </Link>

              {/* AI Planner Trigger Button */}
              <button
                type="button"
                onClick={() => setIsPlannerOpen(true)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border shadow-sm ${
                  isScrolled
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/30'
                }`}
              >
                <Sparkles size={13} className="text-emerald-400" />
                <span>AI Planner</span>
              </button>

              {/* Wishlist Link with Badge */}
              <Link
                to="/profile"
                state={{ tab: 'wishlist' }}
                className={`relative p-2 rounded-xl border transition-all ${
                  isScrolled
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title="View Wishlist"
              >
                <Heart size={15} className={wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : isScrolled ? 'text-slate-600' : 'text-white'} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Authenticated User Menu or Login CTA */}
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className={`flex items-center gap-1.5 p-1 pr-2.5 rounded-xl border transition-all ${
                      isScrolled
                        ? 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                        : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.name}
                      className="w-6 h-6 rounded-lg object-cover border border-emerald-500"
                    />
                    <span className="text-xs font-bold max-w-[85px] truncate hidden sm:inline">
                      {user.name ? user.name.split(' ')[0] : 'Traveler'}
                    </span>
                    <ChevronDown size={13} className={isScrolled ? 'text-slate-500' : 'text-white/70'} />
                  </button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-slate-800"
                      >
                        <div className="p-2.5 border-b border-slate-100 mb-1">
                          <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
                        </div>

                        <div className="space-y-0.5 text-xs font-bold">
                          <Link
                            to="/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900"
                          >
                            <Ticket size={15} className="text-emerald-500" /> My Bookings & Passes
                          </Link>

                          {isInfluencer && (
                            <Link
                              to="/influencer"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-700 transition-colors font-black"
                            >
                              <Sparkles size={15} className="text-emerald-500" /> Creator Portal
                            </Link>
                          )}

                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors font-black"
                            >
                              <ShieldCheck size={15} className="text-emerald-500" /> Admin Command Hub
                            </Link>
                          )}
                        </div>

                        <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} /> Sign Out
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isScrolled 
                        ? 'text-slate-700 hover:text-emerald-600' 
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    Log In
                  </Link>

                  <Link
                    to="/signup"
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm shadow-emerald-500/20"
                  >
                    Join
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl border transition-all ${
                  isScrolled
                    ? 'bg-slate-100 text-slate-900 border-slate-200'
                    : 'bg-white/10 text-white border-white/20'
                }`}
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 mt-2 shadow-xl overflow-hidden"
            >
              <div className="space-y-1.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 uppercase tracking-wider"
                  >
                    {link.name}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsPlannerOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-emerald-700 bg-emerald-50 flex items-center gap-2 uppercase tracking-wider"
                >
                  <Sparkles size={14} className="text-emerald-500" /> Plan with AI Assistant
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;
