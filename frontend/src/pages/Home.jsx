import React, { useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Calendar, Users, ShieldCheck, HeartHandshake, 
  Compass, CreditCard, Star, Sparkles, CloudSun, ArrowRight,
  TrendingUp, Clock, Mountain, Palmtree, Shuffle, ChevronRight, ChevronLeft,
  Plane, Heart, Backpack, CheckCircle2, PhoneCall, Image as ImageIcon,
  Wand2
} from 'lucide-react';

import TripCard from '../components/TripCard.jsx';
import DestinationCard from '../components/DestinationCard.jsx';
import CallbackForm from '../components/CallbackForm.jsx';
import SEOHead from '../components/SEOHead.jsx';
import AIPlannerModal from '../components/AIPlannerModal.jsx';
import HomeTripSection from '../components/HomeTripSection.jsx';
import { HOME_SECTION_LIMITS, HOME_SECTIONS_META } from '../config/homeConfig.js';
import { getOrganizationSchema, getTravelAgencySchema } from '../utils/seoSchemas.js';
import { UPCOMING_TRIPS, DESTINATIONS, TESTIMONIALS, getDestinationPackageCount } from '../constants/mockData.js';
import { useTravelContext } from '../hooks/useTravelContext.js';
import { getCurrentSeason } from '../utils/weatherSeasonEngine.js';
import * as travelKnowledgeService from '../services/travelKnowledgeService.js';
import useMarketingBanners from '../hooks/useMarketingBanners.js';
import { HomePromotionHighlight, HomePromotionStrip, PromotionCta, PromotionImage } from '../components/marketing/HomePromotionBanner.jsx';
import HomePromotionPopup from '../components/marketing/HomePromotionPopup.jsx';

const getTravelStyles = () => (travelKnowledgeService.getTravelStyles || travelKnowledgeService.default?.getTravelStyles)?.() || [];
const getLucideIcon = (name, fallback) => (travelKnowledgeService.getLucideIcon || travelKnowledgeService.default?.getLucideIcon)?.(name, fallback) || fallback;

// Curated Journey Gallery Moments
const GALLERY_MOMENTS = [
  {
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    title: 'Key Monastery Sunrise',
    location: 'Spiti Valley, Himachal'
  },
  {
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop',
    title: 'Crystal Clear Umngot River',
    location: 'Dawki, Meghalaya'
  },
  {
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop',
    title: 'Kelingking T-Rex Cliff',
    location: 'Nusa Penida, Bali'
  },
  {
    image: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=800&auto=format&fit=crop',
    title: 'Pangong Tso Alpine Blue',
    location: 'Ladakh'
  },
  {
    image: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?q=80&w=800&auto=format&fit=crop',
    title: 'Dal Lake Shikara Morning',
    location: 'Srinagar, Kashmir'
  },
  {
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop',
    title: 'Varkala Cliff Sunset',
    location: 'Kerala'
  }
];

const TRENDING_SEARCH_CHIPS = [
  { label: 'Spiti Valley', query: 'spiti' },
  { label: 'Bali & Penida', query: 'bali' },
  { label: 'Meghalaya', query: 'meghalaya' },
  { label: 'Kashmir', query: 'kashmir' },
  { label: 'Ladakh', query: 'ladakh' },
  { label: 'Kasol & Jibhi', query: 'kasol' },
  { label: 'Kerala Backwaters', query: 'kerala' }
];

const Home = () => {
  const navigate = useNavigate();
  const { bannersByPlacement } = useMarketingBanners();
  const heroBanner = bannersByPlacement.home_hero[0];
  const { 
    timeContext = { greeting: 'Welcome Explorer', period: 'Day', heroTitle: 'Explore India & The World In Community.', heroSubtitle: 'Curated social group trips, high-altitude backpacking circuits & boutique mountain stays with certified captains.' }, 
    season = getCurrentSeason(), 
    recommendedTrips = UPCOMING_TRIPS || [], 
    tripsPool = UPCOMING_TRIPS || [],
    allTrips = UPCOMING_TRIPS || [],
    getWeatherFor = () => null
  } = useTravelContext() || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState("SEP '26");
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerDestination, setPlannerDestination] = useState('Meghalaya');
  const destinationsScrollRef = useRef(null);

  const handleDestinationsScroll = (direction) => {
    if (destinationsScrollRef.current) {
      const scrollAmount = destinationsScrollRef.current.clientWidth * 0.75;
      destinationsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Dynamic active catalog (excludes inactive/draft trips, merges live with knowledge base)
  const activeCatalog = useMemo(() => {
    const pool = (tripsPool && tripsPool.length > 0) ? tripsPool : (allTrips && allTrips.length > 0 ? allTrips : UPCOMING_TRIPS);
    return (pool || []).filter(t => t && t.isActive !== false && t.status !== 'inactive');
  }, [tripsPool, allTrips]);

  // Dynamic Departure Months derived from real batches in active catalog
  const availableMonths = useMemo(() => {
    const monthSet = new Set();
    activeCatalog.forEach(t => {
      if (Array.isArray(t.availableBatches)) {
        t.availableBatches.forEach(b => {
          if (b.monthLabel) monthSet.add(b.monthLabel);
          else if (b.dates) {
            const m = b.dates.match(/([A-Za-z]{3})\s*(?:20)?(\d{2})?/);
            if (m) monthSet.add(`${m[1].toUpperCase()} '${m[2] || '26'}`);
          }
        });
      }
    });
    const months = Array.from(monthSet);
    return months.length > 0 ? months.slice(0, 5) : ["SEP '26", "OCT '26", "NOV '26", "DEC '26"];
  }, [activeCatalog]);

  // Trips Filtered for Upcoming Community Trips Section by Month (Enforcing Limit <= 6)
  const upcomingCommunityTrips = useMemo(() => {
    const cleanMonth = (selectedMonth || '').split(' ')[0].replace(/[^A-Za-z]/g, '').toLowerCase();
    const filtered = activeCatalog.filter(t => {
      const bText = Array.isArray(t.availableBatches) ? t.availableBatches.map(b => b.dates || '').join(' ').toLowerCase() : '';
      const nextB = (t.nextBatch || '').toLowerCase();
      return bText.includes(cleanMonth) || nextB.includes(cleanMonth);
    });
    const pool = filtered.length > 0 ? filtered : activeCatalog;
    // Deterministic ranking: featured first, then rating
    const sorted = [...pool].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (Number(b.rating) || 4.8) - (Number(a.rating) || 4.8);
    });
    return sorted.slice(0, HOME_SECTION_LIMITS.community);
  }, [activeCatalog, selectedMonth]);

  // Featured India Trips (Domestic Inventory, Enforcing Limit <= 8)
  const allIndiaTrips = useMemo(() => {
    const intlKeywords = ['bali', 'indonesia', 'vietnam', 'thailand', 'dubai', 'bhutan', 'sri lanka', 'international'];
    return activeCatalog.filter(t => {
      const dest = (t.destination || t.location || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      return !intlKeywords.some(kw => dest.includes(kw) || cat.includes(kw));
    });
  }, [activeCatalog]);

  const indiaTrips = useMemo(() => {
    const sorted = [...allIndiaTrips].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (Number(b.rating) || 4.8) - (Number(a.rating) || 4.8);
    });
    return sorted.slice(0, HOME_SECTION_LIMITS.india);
  }, [allIndiaTrips]);

  // Featured International Trips (Enforcing Limit <= 6)
  const allInternationalTrips = useMemo(() => {
    const intlKeywords = ['bali', 'indonesia', 'vietnam', 'thailand', 'dubai', 'bhutan', 'sri lanka', 'international'];
    return activeCatalog.filter(t => {
      const dest = (t.destination || t.location || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const tags = Array.isArray(t.tags) ? t.tags.map(tag => (tag || '').toLowerCase()) : [];
      return intlKeywords.some(kw => dest.includes(kw) || cat.includes(kw) || tags.includes(kw));
    });
  }, [activeCatalog]);

  const internationalTrips = useMemo(() => {
    const sorted = [...allInternationalTrips].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (Number(b.rating) || 4.8) - (Number(a.rating) || 4.8);
    });
    return sorted.slice(0, HOME_SECTION_LIMITS.international);
  }, [allInternationalTrips]);

  // Weekend Trips (2-4 Days, Enforcing Limit <= 4)
  const allWeekendTrips = useMemo(() => {
    return activeCatalog.filter(t => {
      const dur = (t.duration || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const tags = Array.isArray(t.tags) ? t.tags.map(tag => (tag || '').toLowerCase()) : [];
      return cat.includes('weekend') || tags.includes('weekend trips') || dur.includes('2n') || dur.includes('3d') || dur.includes('3n/4d');
    });
  }, [activeCatalog]);

  const weekendTrips = useMemo(() => {
    const sorted = [...allWeekendTrips].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (Number(b.rating) || 4.8) - (Number(a.rating) || 4.8);
    });
    return sorted.slice(0, HOME_SECTION_LIMITS.weekend);
  }, [allWeekendTrips]);

  const handlePlanWithAI = (promptText = searchQuery) => {
    const query = (promptText || '').trim();
    if (query) {
      navigate(`/plan?prompt=${encodeURIComponent(query)}`);
    } else {
      navigate('/plan');
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanQuery = (searchQuery || '').trim();
    if (!cleanQuery) {
      navigate('/trips');
      return;
    }

    const promptKeywords = [
      'day', 'days', 'night', 'nights', 'road trip', 'solo', 'couple', 'friends', 
      'weekend', 'surprise', 'with', 'stay', 'vibe', 'budget', 'luxury', 'plan', 
      'trip to', 'tour to', 'circuit', 'itinerary', 'for 2', 'for 4', 'family'
    ];
    const looksLikePrompt = promptKeywords.some(kw => cleanQuery.toLowerCase().includes(kw));

    if (looksLikePrompt) {
      handlePlanWithAI(cleanQuery);
      return;
    }

    const params = new URLSearchParams();
    params.set('q', cleanQuery);
    if (budgetFilter && budgetFilter !== 'all') params.set('budget', budgetFilter);
    if (durationFilter && durationFilter !== 'all') params.set('dur', durationFilter);
    const queryString = params.toString();
    navigate(`/trips?${queryString}`);
  };

  const openAIPlannerFor = (dest = 'Meghalaya') => {
    handlePlanWithAI(dest);
  };

  const organizationSchemas = [getOrganizationSchema(), getTravelAgencySchema()];

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 font-sans">
      <SEOHead
        title="WanderLuxe | Luxury Group Travel, Backpacking Expeditions & Community Trips"
        description="Book premium community group trips and backpacking expeditions across Spiti Valley, Meghalaya, Kashmir, Bali, Ladakh and Himachal. Certified captains, boutique stays & transparent pricing."
        canonical="/"
        jsonLd={organizationSchemas}
      />

      {/* AI Planner Modal */}
      <AIPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        initialDestination={plannerDestination}
      />
      <HomePromotionPopup banner={bannersByPlacement.popup[0]} />
      <HomePromotionStrip banner={bannersByPlacement.top_bar[0]} topBar />

      {/* ========================================================================= */}
      {/* 1. CINEMATIC TRAVEL HERO & DISCOVERY SEARCH */}
      {/* ========================================================================= */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-20 overflow-hidden bg-slate-950">
        {/* Cinematic Backdrop Image */}
        <div className="absolute inset-0 z-0">
          <PromotionImage key={heroBanner?._id || 'default-hero'} banner={heroBanner} fallback="/hero-bg.jpg" eager className="w-full h-full object-cover opacity-70 scale-105 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/40 to-slate-950" />
        </div>

        <div className="travel-container relative z-10 text-center mt-[-10px]">
          
          {/* Live Contextual Season Pill */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-xl border border-white/15 text-xs font-semibold text-slate-200 mb-6 shadow-xl"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-emerald-400 font-bold">
              {heroBanner?.tag || (season?.heroTag && /\d{4}/.test(season.heroTag)
                ? season.heroTag.replace(/\d{4}/, new Date().getFullYear())
                : `${season?.name ? season.name.split('/')[0].trim() : 'Autumn'} Adventure Season ${new Date().getFullYear()}`)}
            </span>
            {!heroBanner && <><span className="text-white/30">•</span><span className="text-slate-300 font-medium">Curated Community Departures</span></>}
          </motion.div>

          {/* Main Hero Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight mb-4 max-w-5xl mx-auto leading-[1.08]"
          >
            {heroBanner ? heroBanner.title : <>Explore India & The World <br /><span className="text-emerald-400">In Community.</span></>}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-10 font-medium leading-relaxed"
          >
            {heroBanner ? heroBanner.subtitle : 'Curated 18–35 social group departures, high-altitude mountain circuits & boutique stays with certified trip captains.'}
          </motion.p>
          {heroBanner && <div className="mb-8"><PromotionCta banner={heroBanner} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300" /></div>}

          {/* Sleek Unified Search Capsule & Dual-Mode AI Planner Prompt Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative max-w-3xl mx-auto z-30 text-left"
          >
            <div className="bg-slate-950/80 backdrop-blur-2xl p-2 pl-5 sm:pl-6 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/20 hover:border-emerald-500/50 transition-all duration-300">
              <form onSubmit={handleSearchSubmit} className="flex items-center justify-between gap-3">
                
                {/* Search Icon & Input */}
                <div className="flex items-center gap-3 flex-grow min-w-0">
                  <Sparkles className="text-emerald-400 shrink-0 animate-pulse" size={19} />
                  <input 
                    type="text" 
                    placeholder="Where to, or ask AI planner (e.g. 7-day Spiti road trip with friends)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                    className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-xs sm:text-sm font-medium outline-none border-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none py-2"
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Right Actions: Equalized Hero Search Action Pill Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="group inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black text-white bg-slate-900/90 hover:bg-slate-800 border border-white/20 transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap shadow-sm"
                  >
                    <Search size={14} className="shrink-0 text-slate-300 group-hover:text-white transition-colors" />
                    <span className="hidden sm:inline">Classic Search</span>
                    <span className="sm:hidden">Search</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handlePlanWithAI(searchQuery || '7-day Spiti road trip with friends')}
                    className="group inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-400 transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                  >
                    <Sparkles size={14} className="shrink-0 text-slate-950 group-hover:rotate-12 transition-transform" />
                    <span>Plan with AI</span>
                  </button>
                </div>

              </form>
            </div>

            {/* Smart Dual-Mode Dropdown Suggestions */}
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 right-0 top-full mt-2.5 bg-slate-950/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/20 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Primary AI Planner Action Row */}
                    <div 
                      onMouseDown={() => handlePlanWithAI(searchQuery || '7-day Spiti road trip with friends')}
                      className="p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900/60 border border-emerald-500/30 hover:border-emerald-400/70 hover:bg-emerald-950/80 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                          <Sparkles size={20} className="animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                              {searchQuery.trim() ? `Plan "${searchQuery.trim()}" with AI` : 'Launch AI Travel Planner'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              AI Architect
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-0.5">
                            {searchQuery.trim() 
                              ? 'Automatically synthesize days, routes, curated stays & custom pace'
                              : 'Describe your dream trip in natural language and get an interactive day-by-day plan'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>

                    {/* Classic Search Action Row */}
                    {searchQuery.trim() && (
                      <div 
                        onMouseDown={() => {
                          navigate(`/trips?q=${encodeURIComponent(searchQuery.trim())}`);
                        }}
                        className="p-3 rounded-xl sm:rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-white/10">
                            <Search size={16} />
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-white">
                              Search catalog departures for "{searchQuery.trim()}"
                            </span>
                            <p className="text-[11px] text-slate-400">View upcoming fixed departures & fixed group trips</p>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>
                    )}

                    {/* Quick AI Prompts Section */}
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Wand2 size={12} className="text-emerald-400" />
                          <span>Try these AI Travel Prompts</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Click to generate instant plan</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {[
                          { icon: '⛰️', text: '7-day Spiti road trip with friends', dest: 'Spiti Valley' },
                          { icon: '🌴', text: '5-day Bali tropical escape for couple', dest: 'Bali' },
                          { icon: '🌲', text: '6-day Meghalaya waterfalls & living roots', dest: 'Meghalaya' },
                          { icon: '🪄', text: 'Surprise me with a 6-day offbeat adventure', dest: 'Spiti Valley' }
                        ].map((promptItem) => (
                          <div
                            key={promptItem.text}
                            onMouseDown={() => {
                              setSearchQuery(promptItem.text);
                              handlePlanWithAI(promptItem.text);
                            }}
                            className="p-2 px-3 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center gap-2 group text-left"
                          >
                            <span className="text-sm shrink-0">{promptItem.icon}</span>
                            <span className="text-xs text-slate-300 group-hover:text-emerald-300 transition-colors font-medium truncate">
                              {promptItem.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Trending Search Chips with Bullet Dots */}
          <div className="mt-6 flex items-center justify-center gap-2.5 flex-wrap text-xs text-slate-400 font-medium">
            <span className="text-slate-400 font-medium">Trending:</span>
            {[
              { label: 'Spiti Valley', query: 'spiti' },
              { label: 'Bali & Penida', query: 'bali' },
              { label: 'Kashmir', query: 'kashmir' },
              { label: 'Ladakh', query: 'ladakh' },
              { label: 'Meghalaya', query: 'meghalaya' }
            ].map((chip, idx, arr) => (
              <React.Fragment key={chip.label}>
                <button
                  type="button"
                  onClick={() => navigate(`/trips?q=${chip.query}`)}
                  className="text-slate-200 hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  {chip.label}
                </button>
                {idx < arr.length - 1 && <span className="text-slate-600 font-bold">•</span>}
              </React.Fragment>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TRUST & SOCIAL PROOF STRIP */}
      {/* ========================================================================= */}
      <section className="bg-slate-950 text-white py-5 border-y border-white/10 relative z-20 shadow-md">
        <div className="travel-container grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center text-xs md:text-sm font-bold">
          <div className="flex items-center justify-center gap-2">
            <Star className="text-amber-400 fill-amber-400 shrink-0" size={17} />
            <span>4.9★ Community Rating (12k+ Reviews)</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Users className="text-emerald-400 shrink-0" size={17} />
            <span>50,000+ Explorers Hosted</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="text-emerald-400 shrink-0" size={17} />
            <span>100% Certified Trip Captains</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="text-emerald-400 shrink-0" size={17} />
            <span>0% EMI & 10% Booking Deposit</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. UPCOMING COMMUNITY TRIPS (WITH DEPARTURE MONTH TABS) */}
      {/* ========================================================================= */}
      <HomeTripSection
        id={HOME_SECTIONS_META.community.id}
        eyebrow={HOME_SECTIONS_META.community.eyebrow}
        title={HOME_SECTIONS_META.community.title}
        description={HOME_SECTIONS_META.community.description}
        trips={upcomingCommunityTrips}
        totalAvailable={activeCatalog.length}
        limit={HOME_SECTIONS_META.community.limit}
        viewAllBaseLabel={HOME_SECTIONS_META.community.viewAllBaseLabel}
        viewAllPath={HOME_SECTIONS_META.community.viewAllPath}
        bgClass={HOME_SECTIONS_META.community.bgClass}
        showWeather={true}
        headerChildren={
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {availableMonths.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(m)}
                className={`px-3.5 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedMonth === m
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        }
      />
      <HomePromotionStrip banner={bannersByPlacement.offer_strip[0]} />

      {/* ========================================================================= */}
      {/* 4. POPULAR DESTINATIONS / WHERE NEXT? */}
      {/* ========================================================================= */}
      <section className="travel-section">
        <div className="travel-container">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-6 sm:mb-8">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block mb-1">
                Explore Destinations
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Trending Destinations
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDestinationsScroll('left')}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-xs cursor-pointer active:scale-95"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() => handleDestinationsScroll('right')}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-xs cursor-pointer active:scale-95"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>

              <Link 
                to="/trips" 
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/80 px-4 py-2 rounded-2xl transition-all shadow-2xs group shrink-0"
              >
                <span>Browse All 50+ Circuits</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div 
            ref={destinationsScrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-5 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {DESTINATIONS.map(dest => {
              const activeCount = getDestinationPackageCount(dest.name, activeCatalog);
              const destWeather = getWeatherFor(dest.name);
              return (
                <div 
                  key={dest.id}
                  className="w-[70vw] max-w-[260px] sm:w-[240px] md:w-[260px] lg:w-[270px] shrink-0 snap-start flex flex-col"
                >
                  <DestinationCard 
                    destination={dest} 
                    activeCount={activeCount}
                    weather={destWeather}
                    aspect="aspect-[3/4]"
                  />
                </div>
              );
            })}
          </div>

          {/* Mobile View All button below cards */}
          <div className="sm:hidden mt-4 text-center">
            <Link
              to="/trips"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-wider shadow-xs hover:bg-slate-50 active:scale-[0.99] transition-all"
            >
              <span>Browse All 50+ Circuits</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <HomePromotionHighlight banner={bannersByPlacement.destination_highlight[0]} />

      {/* ========================================================================= */}
      {/* 6. EXPLORE INDIA CIRCUITS */}
      {/* ========================================================================= */}
      <HomeTripSection
        id={HOME_SECTIONS_META.india.id}
        eyebrow={HOME_SECTIONS_META.india.eyebrow}
        title={HOME_SECTIONS_META.india.title}
        description={HOME_SECTIONS_META.india.description}
        trips={indiaTrips}
        totalAvailable={allIndiaTrips.length}
        limit={HOME_SECTIONS_META.india.limit}
        viewAllBaseLabel={HOME_SECTIONS_META.india.viewAllBaseLabel}
        viewAllPath={HOME_SECTIONS_META.india.viewAllPath}
        bgClass={HOME_SECTIONS_META.india.bgClass}
      />

      {/* ========================================================================= */}
      {/* 7. INTERNATIONAL ESCAPES */}
      {/* ========================================================================= */}
      {allInternationalTrips.length > 0 && (
        <HomeTripSection
          id={HOME_SECTIONS_META.international.id}
          eyebrow={HOME_SECTIONS_META.international.eyebrow}
          title={HOME_SECTIONS_META.international.title}
          description={HOME_SECTIONS_META.international.description}
          trips={internationalTrips}
          totalAvailable={allInternationalTrips.length}
          limit={HOME_SECTIONS_META.international.limit}
          viewAllBaseLabel={HOME_SECTIONS_META.international.viewAllBaseLabel}
          viewAllPath={HOME_SECTIONS_META.international.viewAllPath}
          bgClass={HOME_SECTIONS_META.international.bgClass}
        />
      )}

      {/* ========================================================================= */}
      {/* 8. WEEKEND GETAWAYS (2–4 DAYS) */}
      {/* ========================================================================= */}
      {allWeekendTrips.length > 0 && (
        <HomeTripSection
          id={HOME_SECTIONS_META.weekend.id}
          eyebrow={HOME_SECTIONS_META.weekend.eyebrow}
          title={HOME_SECTIONS_META.weekend.title}
          description={HOME_SECTIONS_META.weekend.description}
          trips={weekendTrips}
          totalAvailable={allWeekendTrips.length}
          limit={HOME_SECTIONS_META.weekend.limit}
          viewAllBaseLabel={HOME_SECTIONS_META.weekend.viewAllBaseLabel}
          viewAllPath={HOME_SECTIONS_META.weekend.viewAllPath}
          bgClass={HOME_SECTIONS_META.weekend.bgClass}
        />
      )}

      {/* ========================================================================= */}
      {/* 9. WHY CHOOSE WANDERLUXE */}
      {/* ========================================================================= */}
      <section className="travel-section bg-white">
        <div className="travel-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block mb-1">
              The WanderLuxe Promise
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
              Why 50,000+ Explorers Choose Us
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-base font-black text-slate-900">100% Certified Captains</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Every group is led by experienced, high-altitude first-responder captains who know the hidden cafes and scenic viewpoints.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                <CreditCard size={24} />
              </div>
              <h3 className="text-base font-black text-slate-900">Transparent Pricing</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                No hidden permits, toll fees, or unexpected driver allowances. What you see is what you pay, with easy 10% advance deposits.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Compass size={24} />
              </div>
              <h3 className="text-base font-black text-slate-900">Curated Boutique Stays</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Handpicked riverside camps, boutique apple orchard cottages, and scenic valley hotels vetted for hygiene and warmth.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                <PhoneCall size={24} />
              </div>
              <h3 className="text-base font-black text-slate-900">24/7 On-Trip Assistance</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                A dedicated concierge and operations control room actively monitors mountain weather, vehicle fleets, and passenger comfort.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. REAL COMMUNITY STORIES / VERIFIED REVIEWS */}
      {/* ========================================================================= */}
      <section className="travel-section bg-slate-100/70 border-y border-slate-200/80">
        <div className="travel-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block mb-1">
              Traveler Stories
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
              Loved by Solo Explorers, Duos & Groups
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((test) => (
              <div key={test.id} className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(test.rating || 5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed italic">
                  "{test.content}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <img 
                    src={test.avatar} 
                    alt={test.name} 
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500" 
                  />
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{test.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400">{test.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. MOMENTS IN FRAMES / JOURNEY GALLERY */}
      {/* ========================================================================= */}
      <section className="travel-section bg-white">
        <div className="travel-container">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-8">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block mb-1">
                Visual Memories
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
                Moments in Frames
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <ImageIcon size={14} className="text-emerald-500" /> Captured by Travelers & Captains
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {GALLERY_MOMENTS.map((moment, idx) => (
              <div key={idx} className="relative rounded-2xl overflow-hidden aspect-square group shadow-sm bg-slate-900">
                <img 
                  src={moment.image} 
                  alt={moment.title} 
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <div className="text-[11px] font-black text-white leading-tight">{moment.title}</div>
                  <div className="text-[9px] text-emerald-400 font-bold">{moment.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. NEED HELP CHOOSING? / REQUEST A CALLBACK */}
      {/* ========================================================================= */}
      <section className="travel-section bg-[#f8fafc]">
        <div className="travel-container">
          <CallbackForm />
        </div>
      </section>

    </div>
  );
};

export default Home;
