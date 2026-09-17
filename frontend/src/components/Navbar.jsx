import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Search, ChevronDown, LogOut, Compass, 
  Sparkles, ShieldCheck, Ticket, Heart, User, MapPin,
  Palmtree, Mountain, Clock, Backpack, HeartHandshake,
  Calendar, ArrowRight, Plane, Globe, PhoneCall, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getWishlistIds } from '../utils/userHistory.js';

const AIPlannerModal = lazy(() => import('./AIPlannerModal.jsx'));

const INDIA_DESTINATIONS = [
  { name: 'Himachal Pradesh', count: '12 Packages', path: '/trips/himachal-pradesh', vibe: 'Spiti Circuit, Kasol, Manali & Jibhi Cafe Trails' },
  { name: 'Uttarakhand', count: '8 Packages', path: '/trips/uttarakhand', vibe: 'Rishikesh Rafting, Chopta & Kedarkantha Snow Treks' },
  { name: 'Meghalaya', count: '6 Packages', path: '/trips/meghalaya', vibe: 'Living Root Bridges, Dawki Clear Water & Waterfalls' },
  { name: 'Kashmir', count: '5 Packages', path: '/trips/kashmir', vibe: 'Dal Lake Houseboats, Gulmarg Gondola & Pahalgam Valleys' },
  { name: 'Ladakh', count: '4 Packages', path: '/trips/ladakh', vibe: 'Khardung La, Pangong Tso & Nubra Sand Dunes' },
  { name: 'Goa', count: '4 Packages', path: '/trips/goa', vibe: 'Coastlines, Sunsets, Water Sports & Latin Quarter' },
  { name: 'Kerala', count: '4 Packages', path: '/trips/kerala', vibe: 'Munnar Tea Hills, Alleppey Houseboats & Varkala Cliffs' },
  { name: 'Rajasthan', count: '3 Packages', path: '/trips/rajasthan', vibe: 'Sam Sand Dunes Glamping, Forts & Royal Palaces' }
];

const INTERNATIONAL_DESTINATIONS = [
  { name: 'Bali & Nusa Penida', count: '4 Packages', path: '/trips/bali', desc: 'Ubud rice terraces, Mount Batur sunrise hike, Nusa Penida T-Rex cliff', flag: '🇮🇩' },
  { name: 'Vietnam', count: '3 Packages', path: '/trips/international?q=vietnam', desc: 'Halong Bay cruise, Hanoi street food & Hoi An lantern boat', flag: '🇻🇳' },
  { name: 'Thailand', count: '3 Packages', path: '/trips/international?q=thailand', desc: 'Phuket beach clubs, Krabi island hopping & Bangkok nightlife', flag: '🇹🇭' },
  { name: 'Dubai', count: '2 Packages', path: '/trips/international?q=dubai', desc: 'Desert safari, Burj Khalifa skyline & luxury marina yacht', flag: '🇦🇪' },
  { name: 'Bhutan', count: '2 Packages', path: '/trips/international?q=bhutan', desc: 'Tiger\'s Nest monastery, Paro valley & Himalayan culture', flag: '🇧🇹' },
  { name: 'Sri Lanka', count: '2 Packages', path: '/trips/international?q=sri-lanka', desc: 'Ella train ride, Sigiriya rock fortress & Mirissa surf', flag: '🇱🇰' }
];

const TRAVEL_STYLES = [
  { name: 'Community Trips', count: '50 Trips', path: '/community-trips', desc: 'Curated 18–35 social group travel with certified captains', icon: HeartHandshake },
  { name: 'Weekend Getaways', count: '19 Trips', path: '/weekend-trips', desc: '2–4 day breaks from Delhi & Chandigarh', icon: Clock },
  { name: 'Backpacking Circuits', count: '15 Trips', path: '/backpacking-trips', desc: 'Offbeat valleys, rustic homestays & local food', icon: Backpack },
  { name: 'Adventure & Treks', count: '19 Trips', path: '/adventure-treks', desc: 'High-altitude trails, alpine passes & camping', icon: Mountain },
  { name: 'Romantic Escapes', count: '20 Trips', path: '/romantic-escapes', desc: 'Couple villas, sunsets, houseboats & private stays', icon: Heart },
  { name: 'Culture & Heritage', count: '12 Trips', path: '/culture-heritage', desc: 'Royal forts, ancient temples & UNESCO monasteries', icon: Compass }
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // 'india' | 'international' | 'styles' | 'community'
  const [mobileExpandedSection, setMobileExpandedSection] = useState(null);
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
      {isPlannerOpen && (
        <Suspense fallback={null}>
          <AIPlannerModal
            isOpen
            onClose={() => setIsPlannerOpen(false)}
            initialDestination="Meghalaya"
          />
        </Suspense>
      )}

      <nav
        className={`fixed top-0 left-0 right-0 w-full z-40 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-2.5 shadow-sm text-slate-900' 
            : 'bg-gradient-to-b from-[#0b132b]/95 via-[#0b132b]/60 to-transparent py-4 text-white'
        }`}
      >
        <div className="travel-container">
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
                    activeMenu === 'india' || location.pathname.startsWith('/trips/india')
                      ? 'text-emerald-500 bg-emerald-500/10'
                      : isScrolled ? 'text-slate-700 hover:text-emerald-600' : 'text-white/90 hover:text-white'
                  }`}
                >
                  <span>India Trips</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${activeMenu === 'india' ? 'rotate-180 text-emerald-500' : ''}`} />
                </Link>

                <AnimatePresence>
                  {activeMenu === 'india' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-[560px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-5 z-50 text-slate-800"
                    >
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <MapPin size={13} className="text-emerald-600" /> 8 Regional Mountain & Coastal Hubs
                        </span>
                        <Link 
                          to="/trips/india" 
                          className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          View All 46 India Trips <ArrowRight size={11} />
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {INDIA_DESTINATIONS.map((dest) => (
                          <Link
                            key={dest.name}
                            to={dest.path}
                            className="p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/70 transition-all flex items-start justify-between group"
                          >
                            <div className="space-y-0.5">
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
                    activeMenu === 'international' || location.pathname.startsWith('/trips/international')
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
                      className="absolute left-0 mt-2 w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-5 z-50 text-slate-800"
                    >
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Plane size={13} className="text-emerald-600" /> Island & Global Escapes
                        </span>
                        <Link 
                          to="/trips/international" 
                          className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          All International <ArrowRight size={11} />
                        </Link>
                      </div>

                      <div className="space-y-2">
                        {INTERNATIONAL_DESTINATIONS.map((intl) => (
                          <Link
                            key={intl.name}
                            to={intl.path}
                            className="p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/70 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{intl.flag}</span>
                              <div>
                                <div className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                                  {intl.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[240px]">
                                  {intl.desc}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md shrink-0">
                              {intl.count}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Community Trips */}
              <Link
                to="/community-trips"
                className={`px-3 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-colors whitespace-nowrap ${
                  location.pathname === '/community-trips'
                    ? 'text-emerald-500 bg-emerald-500/10 font-black'
                    : isScrolled ? 'text-slate-700 hover:text-emerald-600' : 'text-white/90 hover:text-white'
                }`}
              >
                Community Trips
              </Link>

              {/* 4. Weekend Getaways */}
              <Link
                to="/weekend-trips"
                className={`px-3 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-colors whitespace-nowrap ${
                  location.pathname === '/weekend-trips'
                    ? 'text-emerald-500 bg-emerald-500/10 font-black'
                    : isScrolled ? 'text-slate-700 hover:text-emerald-600' : 'text-white/90 hover:text-white'
                }`}
              >
                Weekend Getaways
              </Link>

              {/* 5. Travel Styles Dropdown */}
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
                  <span>More</span>
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

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <Link to="/about" className="font-bold text-slate-500 hover:text-emerald-600">
                          About Captains
                        </Link>
                        <Link to="/influencer/program" className="font-bold text-emerald-600 hover:text-emerald-700">
                          Creator Partner Program
                        </Link>
                        <Link to="/contact" className="font-bold text-slate-500 hover:text-emerald-600">
                          Custom Trip Enquiry
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Right Action Icons & Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Search Modal / Page Trigger */}
              <Link
                to="/trips"
                className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                  isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white/90 hover:bg-white/10'
                }`}
                title="Search Trips & Destinations"
              >
                <Search size={16} />
                <span className="hidden xl:inline">Search</span>
              </Link>

              {/* Wishlist Link with Counter */}
              <Link
                to="/profile"
                className={`p-2 rounded-xl transition-all relative ${
                  isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white/90 hover:bg-white/10'
                }`}
                title="Your Saved Trips"
              >
                <Heart size={16} className={wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : ''} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Custom Plan with AI Button */}
              <Link
                to="/plan"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                <Sparkles size={13} />
                <span>AI Planner</span>
              </Link>

              {/* User / Authentication Dropdown */}
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100/20 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-2 z-50 text-slate-800"
                      >
                        <div className="px-3 py-2.5 border-b border-slate-100">
                          <div className="font-black text-slate-900 text-xs truncate">{user?.name}</div>
                          <div className="text-[10px] text-slate-400 truncate font-mono">{user?.email}</div>
                          {user?.role && (
                            <span className="mt-1 inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                              {user.role}
                            </span>
                          )}
                        </div>

                        <div className="py-1 space-y-0.5">
                          <Link
                            to="/profile"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Ticket size={14} className="text-emerald-600" /> My Bookings & Passes
                          </Link>

                          {isAdmin && (
                            <Link
                              to="/staff/admin"
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors"
                            >
                              <ShieldCheck size={14} className="text-indigo-600" /> Admin CRM & CMS
                            </Link>
                          )}

                          {isInfluencer && (
                            <Link
                              to="/influencer"
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                              <Sparkles size={14} className="text-amber-600" /> Creator Storefront
                            </Link>
                          )}
                        </div>

                        <div className="pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <LogOut size={14} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <User size={14} />
                  <span>Login</span>
                </Link>
              )}

              {/* Mobile Menu Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className={`lg:hidden p-2 rounded-xl transition-colors ${
                  isScrolled ? 'text-slate-800 hover:bg-slate-100' : 'text-white hover:bg-white/10'
                }`}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE NAVIGATION DRAWER */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-slate-950/98 backdrop-blur-2xl border-b border-slate-800 overflow-y-auto max-h-[85vh] text-white"
            >
              <div className="px-5 py-6 space-y-5">
                
                {/* Mobile Search Bar */}
                <Link
                  to="/trips"
                  className="flex items-center gap-2.5 px-4 py-3 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold text-slate-400"
                >
                  <Search size={16} className="text-emerald-400" />
                  <span>Search Spiti, Bali, Meghalaya, Weekend trips...</span>
                </Link>

                {/* Primary Category Links Accordion */}
                <div className="space-y-2">
                  
                  {/* India Trips Accordion */}
                  <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/50">
                    <button
                      type="button"
                      onClick={() => setMobileExpandedSection(mobileExpandedSection === 'india' ? null : 'india')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-black uppercase tracking-wider text-slate-200 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin size={15} className="text-emerald-400" /> India Group Circuits
                      </span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${mobileExpandedSection === 'india' ? 'rotate-180 text-emerald-400' : ''}`} />
                    </button>

                    {mobileExpandedSection === 'india' && (
                      <div className="p-3 pt-0 grid grid-cols-2 gap-2 border-t border-slate-800/50">
                        {INDIA_DESTINATIONS.map((d) => (
                          <Link
                            key={d.name}
                            to={d.path}
                            className="p-2.5 rounded-xl bg-slate-950/60 text-xs font-bold text-slate-300 hover:text-emerald-400 flex items-center justify-between"
                          >
                            <span>{d.name}</span>
                            <span className="text-[9px] font-black text-emerald-400">{d.count.split(' ')[0]}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* International Trips Accordion */}
                  <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/50">
                    <button
                      type="button"
                      onClick={() => setMobileExpandedSection(mobileExpandedSection === 'intl' ? null : 'intl')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-black uppercase tracking-wider text-slate-200 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Plane size={15} className="text-emerald-400" /> International Escapes
                      </span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${mobileExpandedSection === 'intl' ? 'rotate-180 text-emerald-400' : ''}`} />
                    </button>

                    {mobileExpandedSection === 'intl' && (
                      <div className="p-3 pt-0 space-y-1.5 border-t border-slate-800/50">
                        {INTERNATIONAL_DESTINATIONS.map((d) => (
                          <Link
                            key={d.name}
                            to={d.path}
                            className="p-2 rounded-xl bg-slate-950/60 text-xs font-bold text-slate-300 hover:text-emerald-400 flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <span>{d.flag}</span>
                              <span>{d.name}</span>
                            </span>
                            <span className="text-[10px] font-black text-emerald-400">{d.count}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Direct Route Tiles */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to="/community-trips"
                      className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs font-black text-white hover:text-emerald-400 flex items-center gap-2"
                    >
                      <HeartHandshake size={14} className="text-emerald-400" /> Community Trips
                    </Link>
                    <Link
                      to="/weekend-trips"
                      className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs font-black text-white hover:text-emerald-400 flex items-center gap-2"
                    >
                      <Clock size={14} className="text-emerald-400" /> Weekend Trips
                    </Link>
                    <Link
                      to="/backpacking-trips"
                      className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs font-black text-white hover:text-emerald-400 flex items-center gap-2"
                    >
                      <Backpack size={14} className="text-emerald-400" /> Backpacking
                    </Link>
                    <Link
                      to="/adventure-treks"
                      className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs font-black text-white hover:text-emerald-400 flex items-center gap-2"
                    >
                      <Mountain size={14} className="text-emerald-400" /> Adventure Treks
                    </Link>
                  </div>

                </div>

                {/* AI Planner and Contact Buttons */}
                <div className="pt-2 space-y-2 border-t border-slate-800">
                  <Link
                    to="/plan"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 bg-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-wider border border-emerald-500/40 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={15} /> Build Custom Route with AI
                  </Link>

                  <Link
                    to="/contact"
                    className="w-full py-3 bg-slate-900 text-slate-300 rounded-2xl text-xs font-black uppercase tracking-wider border border-slate-800 flex items-center justify-center gap-2"
                  >
                    <PhoneCall size={15} /> Talk to Travel Specialist
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
