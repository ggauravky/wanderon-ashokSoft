import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Search, ChevronDown, LogOut, Compass, 
  Sparkles, ShieldCheck, Ticket, Heart, User, MapPin,
  Palmtree, Mountain, Clock, Backpack, HeartHandshake,
  Calendar, ArrowRight, Plane
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getWishlistIds } from '../utils/userHistory';
import AIPlannerModal from './AIPlannerModal';

const INDIA_DESTINATIONS = [
  { name: 'Himachal Pradesh', count: 12, path: '/trips/himachal-pradesh', vibe: 'Snow Passes & Valley Cafe Hubs' },
  { name: 'Uttarakhand', count: 8, path: '/trips/uttarakhand', vibe: 'Rishikesh Rafting & Alpine Treks' },
  { name: 'Meghalaya', count: 6, path: '/trips/meghalaya', vibe: 'Living Root Bridges & Dawki River' },
  { name: 'Kashmir', count: 5, path: '/trips/kashmir', vibe: 'Dal Lake Houseboats & Pine Valleys' },
  { name: 'Ladakh', count: 4, path: '/trips/ladakh', vibe: 'Khardung La & Pangong Lake' },
  { name: 'Goa', count: 4, path: '/trips/goa', vibe: 'Coastlines, Sunsets & Latin Heritage' },
  { name: 'Kerala', count: 4, path: '/trips/kerala', vibe: 'Munnar Tea & Backwater Cruises' },
  { name: 'Rajasthan', count: 3, path: '/trips/rajasthan', vibe: 'Desert Glamping & Forts' }
];

const TRAVEL_STYLES = [
  { name: 'Weekend Getaways', count: 19, path: '/weekend-trips', desc: '2–4 day breaks from Delhi & Chandigarh', icon: Clock },
  { name: 'Backpacking Circuits', count: 15, path: '/backpacking-trips', desc: 'Offbeat valleys & rustic homestays', icon: Backpack },
  { name: 'Adventure & Treks', count: 19, path: '/adventure-treks', desc: 'High-altitude trails & passes', icon: Mountain },
  { name: 'Romantic Escapes', count: 20, path: '/romantic-escapes', desc: 'Couple villas, sunsets & houseboats', icon: Heart },
  { name: 'Culture & Heritage', count: 12, path: '/culture-heritage', desc: 'Royal forts & UNESCO monasteries', icon: Compass },
  { name: 'Community Trips', count: 50, path: '/community-trips', desc: 'Curated 18–35 social group travel', icon: HeartHandshake }
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // 'india' | 'international' | 'styles'
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  
  const menuTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = isAuthenticated && user?.role === 'admin';
  const isInfluencer = isAuthenticated && ((user?.role === 'influencer' && user?.influencerStatus === 'approved') || user?.role === 'admin');

  // Update wishlist count on route change
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

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveMenu(null);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleMouseEnter = (menuName) => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    setActiveMenu(menuName);
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 180);
  };

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
            : 'bg-gradient-to-b from-[#0b132b]/95 via-[#0b132b]/60 to-transparent py-4'
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

            {/* Desktop Navigation Links with Mega Menus */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              
              {/* 1. India Trips Mega Menu */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('india')}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to="/trips/india"
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-colors ${
                    activeMenu === 'india' || location.pathname === '/trips/india'
                      ? 'text-emerald-500 bg-emerald-500/10'
                      : isScrolled ? 'text-slate-700 hover:text-emerald-600' : 'text-white/90 hover:text-white'
                  }`}
                >
                  <span>India</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${activeMenu === 'india' ? 'rotate-180 text-emerald-500' : ''}`} />
                </Link>

                <AnimatePresence>
                  {activeMenu === 'india' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-5 z-50 text-slate-800"
                    >
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <MapPin size={13} className="text-emerald-600" /> 8 Regional Hubs in India
                        </span>
                        <Link 
                          to="/trips/india" 
                          className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          View All 46 Trips <ArrowRight size={11} />
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {INDIA_DESTINATIONS.map((dest) => (
                          <Link
                            key={dest.name}
                            to={dest.path}
                            className="p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/70 transition-all flex items-start justify-between group"
                          >
                            <div>
                              <div className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                                {dest.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium truncate max-w-[170px]">
                                {dest.vibe}
                              </div>
                            </div>
                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md shrink-0">
                              {dest.count}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. International Escapes */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('international')}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to="/trips/international"
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-colors ${
                    activeMenu === 'international' || location.pathname === '/trips/international'
                      ? 'text-emerald-500 bg-emerald-500/10'
                      : isScrolled ? 'text-slate-700 hover:text-emerald-600' : 'text-white/90 hover:text-white'
                  }`}
                >
                  <span>International</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${activeMenu === 'international' ? 'rotate-180 text-emerald-500' : ''}`} />
                </Link>

                <AnimatePresence>
                  {activeMenu === 'international' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-5 z-50 text-slate-800"
                    >
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Plane size={13} className="text-emerald-600" /> Island Escapes
                        </span>
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md">
                          4 Packages
                        </span>
                      </div>

                      <Link
                        to="/trips/bali"
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-200 transition-all block group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-slate-900 group-hover:text-emerald-600">
                            Bali: Island of the Gods
                          </span>
                          <span className="text-[10px] font-black text-emerald-600">4 Trips</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-snug">
                          Ubud rice terraces, Mount Batur sunrise hike, Nusa Penida T-Rex cliff, and sacred sea temples.
                        </p>
                      </Link>

                      <div className="pt-3 mt-3 border-t border-slate-100 text-center">
                        <Link
                          to="/trips/international"
                          className="text-xs font-black text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                        >
                          Explore International Departures <ArrowRight size={12} />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Travel Styles Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('styles')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-colors cursor-pointer ${
                    activeMenu === 'styles'
                      ? 'text-emerald-500 bg-emerald-500/10'
                      : isScrolled ? 'text-slate-700 hover:text-emerald-600' : 'text-white/90 hover:text-white'
                  }`}
                >
                  <span>Travel Styles</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${activeMenu === 'styles' ? 'rotate-180 text-emerald-500' : ''}`} />
                </button>

                <AnimatePresence>
                  {activeMenu === 'styles' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-5 z-50 text-slate-800"
                    >
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Compass size={13} className="text-emerald-600" /> Curated Travel Formats
                        </span>
                        <Link 
                          to="/trips" 
                          className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          All 50 Trips <ArrowRight size={11} />
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {TRAVEL_STYLES.map((style) => {
                          const IconComp = style.icon;
                          return (
                            <Link
                              key={style.name}
                              to={style.path}
                              className="p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/70 transition-all flex items-start gap-2.5 group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <IconComp size={15} />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                                    {style.name}
                                  </span>
                                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                                    {style.count}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                                  {style.desc}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. Upcoming Trips Direct Link */}
              <Link
                to="/trips"
                className={`px-3 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-colors whitespace-nowrap ${
                  location.pathname === '/trips' || location.pathname === '/destinations'
                    ? 'text-emerald-500 font-black'
                    : isScrolled ? 'text-slate-700 hover:text-emerald-600' : 'text-white/90 hover:text-white'
                }`}
              >
                Upcoming Trips
              </Link>

              {/* 5. Creators Link */}
              <Link
                to="/influencer/program"
                className={`px-3 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-colors whitespace-nowrap ${
                  isScrolled ? 'text-emerald-600 hover:text-emerald-700' : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                Creators
              </Link>

              {/* 6. Contact */}
              <Link
                to="/contact"
                className={`px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${
                  isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'
                }`}
              >
                Contact
              </Link>

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
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border shadow-sm cursor-pointer ${
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
                    className={`flex items-center gap-1.5 p-1 pr-2.5 rounded-xl border transition-all cursor-pointer ${
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
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                className={`lg:hidden p-2 rounded-xl border transition-all cursor-pointer ${
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

        {/* Mobile Navigation Drawer with Accordion Sections */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 mt-2 shadow-xl overflow-y-auto max-h-[80vh]"
            >
              <div className="space-y-3">
                {/* AI Planner Mobile Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsPlannerOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-2xl text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center justify-between uppercase tracking-wider"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-600" /> Plan Trip with AI
                  </span>
                  <ArrowRight size={14} />
                </button>

                {/* India Expeditions Accordion */}
                <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <MapPin size={13} className="text-emerald-600" /> India Hubs
                    </span>
                    <Link 
                      to="/trips/india" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[11px] font-black text-emerald-600"
                    >
                      All 46 →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {INDIA_DESTINATIONS.map(d => (
                      <Link
                        key={d.name}
                        to={d.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-1.5 px-2 rounded-xl text-[11px] font-bold text-slate-700 bg-white hover:text-emerald-600 border border-slate-100 flex items-center justify-between"
                      >
                        <span className="truncate">{d.name}</span>
                        <span className="text-[9px] text-slate-400">{d.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Travel Styles Accordion */}
                <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Compass size={13} className="text-emerald-600" /> Travel Formats
                    </span>
                    <Link 
                      to="/trips" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[11px] font-black text-emerald-600"
                    >
                      All 50 →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TRAVEL_STYLES.map(s => (
                      <Link
                        key={s.name}
                        to={s.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-1.5 px-2 rounded-xl text-[11px] font-bold text-slate-700 bg-white hover:text-emerald-600 border border-slate-100 flex items-center justify-between"
                      >
                        <span className="truncate">{s.name}</span>
                        <span className="text-[9px] text-slate-400">{s.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Direct Links */}
                <div className="space-y-1 pt-1">
                  <Link
                    to="/trips/international"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs font-black text-slate-800 hover:bg-slate-50 uppercase tracking-wider"
                  >
                    🌴 International (Bali)
                  </Link>

                  <Link
                    to="/influencer/program"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs font-black text-emerald-600 hover:bg-emerald-50 uppercase tracking-wider"
                  >
                    ★ Creator Partner Program
                  </Link>

                  <Link
                    to="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 uppercase tracking-wider"
                  >
                    Contact & Support
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;
