import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User, ChevronDown, LogOut, Compass, Calendar, Sparkles, ShieldCheck, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isAdmin = 
    isAuthenticated && 
    (user?.role === 'admin' || user?.email?.toLowerCase() === 'gaurav99@gmail.com');

  const isInfluencer = 
    isAuthenticated && 
    (user?.role === 'influencer' || user?.role === 'admin' || user?.email?.toLowerCase() === 'influencer@wanderluxe.in');

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

  const navLinks = [
    { name: 'Destinations', path: '/destinations' },
    { name: 'Weekend Trips', path: '/weekend-trips' },
    { name: 'Backpacking', path: '/community-trips' },
    { name: 'Custom Trip', path: '/custom-trip' },
    { name: 'Influencer Portal', path: '/influencer/login' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'glass py-3' : 'bg-gradient-to-b from-brand-navy/80 via-brand-navy/40 to-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-brand-emerald flex items-center justify-center text-white shadow-lg shadow-brand-emerald/30 group-hover:scale-105 transition-transform">
              <Compass size={22} className="animate-spin-slow" />
            </div>
            <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-brand-navy' : 'text-white'}`}>
              Wander<span className="text-brand-emerald">Luxe</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-brand-emerald ${
                  link.name === 'Influencer Portal' ? 'text-brand-emerald font-bold' : isScrolled ? 'text-brand-navy' : 'text-white/90'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link 
              to="/destinations" 
              className={`p-2.5 rounded-full transition-colors ${isScrolled ? 'hover:bg-gray-100 text-brand-navy' : 'hover:bg-white/10 text-white'}`}
              title="Search trips"
            >
              <Search size={18} />
            </Link>

            {/* Auth Dropdown or Login button */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-brand-emerald/30 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all text-white"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-brand-emerald object-cover"
                  />
                  <span className={`text-sm font-semibold max-w-[100px] truncate ${isScrolled ? 'text-brand-navy' : 'text-white'}`}>
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className={isScrolled ? 'text-brand-navy' : 'text-white'} />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 text-brand-navy"
                    >
                      <div className="px-3 py-2 border-b border-gray-100 mb-1">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm font-bold text-brand-navy truncate">{user.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-light text-brand-navy transition-colors"
                      >
                        <User size={16} className="text-brand-emerald" />
                        My Profile
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-light text-brand-navy transition-colors"
                      >
                        <Calendar size={16} className="text-brand-emerald" />
                        My Bookings
                        {user.bookedTrips?.length > 0 && (
                          <span className="ml-auto bg-brand-emerald text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {user.bookedTrips.length}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/influencer/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-brand-emerald text-white hover:bg-brand-teal transition-colors my-1"
                      >
                        <Sparkles size={16} />
                        Influencer Portal
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-brand-navy text-white hover:bg-brand-emerald transition-colors my-1"
                        >
                          <ShieldCheck size={16} className="text-brand-emerald" />
                          Admin Panel
                        </Link>
                      )}

                      <hr className="my-1 border-gray-100" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 text-red-600 transition-colors text-left"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                    isScrolled ? 'text-brand-navy hover:bg-gray-100' : 'text-white hover:bg-white/10'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-brand-emerald text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-teal transition-colors shadow-lg shadow-brand-emerald/20 flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 rounded-xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X size={24} className={isScrolled ? 'text-brand-navy' : 'text-white'} />
            ) : (
              <Menu size={24} className={isScrolled ? 'text-brand-navy' : 'text-white'} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white shadow-2xl border-t border-gray-100 lg:hidden"
          >
            <div className="flex flex-col px-6 py-6 space-y-4">
              {isAuthenticated && (
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-brand-emerald" />
                  <div>
                    <p className="font-bold text-brand-navy">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              )}

              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-base font-semibold text-brand-navy hover:text-brand-emerald"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              <hr className="border-gray-100" />

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-brand-navy font-semibold py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} className="text-brand-emerald" /> My Bookings & Profile
                  </Link>

                  <Link
                    to="/influencer/login"
                    className="flex items-center gap-2 text-brand-emerald font-extrabold py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Sparkles size={18} /> Influencer Portal
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 text-brand-navy font-extrabold py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShieldCheck size={18} /> Admin Control Panel
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-red-600 font-semibold py-2 text-left"
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/login"
                    className="bg-brand-light text-brand-navy text-center py-3 rounded-xl font-bold border border-gray-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-brand-emerald text-white text-center py-3 rounded-xl font-bold shadow-lg shadow-brand-emerald/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
