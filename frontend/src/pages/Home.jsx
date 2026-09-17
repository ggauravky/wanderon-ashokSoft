import React, { lazy, Suspense, useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, MapPin, Calendar, Users, ShieldCheck, HeartHandshake, 
  Compass, CreditCard, Star, Sparkles, CloudSun, ArrowRight,
  TrendingUp, Clock, Mountain, Palmtree, Shuffle, ChevronRight,
  Plane, Heart, Backpack, CheckCircle2, PhoneCall, Image as ImageIcon
} from 'lucide-react';

import TripCard from '../components/TripCard.jsx';
import DestinationCard from '../components/DestinationCard.jsx';
import CallbackForm from '../components/CallbackForm.jsx';
import SEOHead from '../components/SEOHead.jsx';
import HomeTripSection from '../components/HomeTripSection.jsx';
import { HOME_SECTION_LIMITS, HOME_SECTIONS_META } from '../config/homeConfig.js';
import { getOrganizationSchema, getTravelAgencySchema } from '../utils/seoSchemas.js';
import { DESTINATIONS, TESTIMONIALS, getDestinationPackageCount } from '../constants/mockData.js';
import { useTravelContext } from '../hooks/useTravelContext.js';
import * as travelKnowledgeService from '../services/travelKnowledgeService.js';
import { getActiveMarketingBannersApi } from '../services/api.js';

const AIPlannerModal = lazy(() => import('../components/AIPlannerModal.jsx'));

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
  const { 
    timeContext = { greeting: 'Welcome Explorer', period: 'Day', heroTitle: 'Explore India & The World In Community.', heroSubtitle: 'Curated social group trips, high-altitude backpacking circuits & boutique mountain stays with certified captains.' }, 
    season = { name: 'Autumn Expeditions', heroTag: 'Ideal Mountain Weather' }, 
    recommendedTrips = [], 
    tripsPool = [],
    allTrips = [],
    getWeatherFor = () => null
  } = useTravelContext() || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState("SEP '26");
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerDestination, setPlannerDestination] = useState('Meghalaya');
  const [homeHeroBanner, setHomeHeroBanner] = useState(null);

  useEffect(() => {
    let active = true;
    getActiveMarketingBannersApi('home_hero')
      .then((data) => { if (active) setHomeHeroBanner(data.banners?.[0] || null); })
      .catch(() => { if (active) setHomeHeroBanner(null); });
    return () => { active = false; };
  }, []);

  // Dynamic active catalog (excludes inactive/draft trips, merges live with knowledge base)
  const activeCatalog = useMemo(() => {
    const pool = (tripsPool && tripsPool.length > 0) ? tripsPool : allTrips;
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
    return months.slice(0, 5);
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (budgetFilter && budgetFilter !== 'all') params.set('budget', budgetFilter);
    if (durationFilter && durationFilter !== 'all') params.set('dur', durationFilter);
    const queryString = params.toString();
    navigate(`/trips${queryString ? `?${queryString}` : ''}`);
  };

  const openAIPlannerFor = (dest = 'Meghalaya') => {
    setPlannerDestination(dest);
    setIsPlannerOpen(true);
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
      {isPlannerOpen && (
        <Suspense fallback={null}>
          <AIPlannerModal
            isOpen
            onClose={() => setIsPlannerOpen(false)}
            initialDestination={plannerDestination}
          />
        </Suspense>
      )}

      {/* ========================================================================= */}
      {/* 1. CINEMATIC TRAVEL HERO & DISCOVERY SEARCH */}
      {/* ========================================================================= */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-20 overflow-hidden bg-slate-950">
        {/* Cinematic Backdrop Image */}
        <div className="absolute inset-0 z-0">
          <picture className="block h-full w-full">
            {homeHeroBanner?.mobileImageUrl && <source media="(max-width: 640px)" srcSet={homeHeroBanner.mobileImageUrl} />}
            <img
              src={homeHeroBanner?.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2000&auto=format&fit=crop'}
              alt={homeHeroBanner?.title || 'WanderLuxe mountain group travel landscape'}
              className="w-full h-full object-cover opacity-45 scale-105 transition-transform duration-1000"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-[#f8fafc]" />
        </div>

        <div className="travel-container relative z-10 text-center mt-[-10px]">
          
          {/* Live Contextual Weather & Season Pill */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs font-black text-emerald-300 mb-6 shadow-xl"
          >
            <CloudSun size={15} className="text-emerald-400" />
            <span>{homeHeroBanner?.tag || season.heroTag || 'Autumn Clear Skies'}</span>
            <span className="text-white/30">•</span>
            <span className="text-white/90 font-medium">{timeContext.greeting || 'Welcome Explorer'}</span>
          </motion.div>

          {/* Main Hero Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-4 max-w-5xl mx-auto leading-[1.1]"
          >
            {homeHeroBanner?.title || <>Explore India & The World <span className="text-emerald-400">In Community.</span></>}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm sm:text-base md:text-lg text-slate-200 max-w-2xl mx-auto mb-8 font-medium"
          >
            {homeHeroBanner?.subtitle || 'Curated 18–35 social group departures, high-altitude mountain circuits & boutique stays with certified trip captains.'}
          </motion.p>

          {homeHeroBanner?.ctaText && homeHeroBanner?.ctaLink && (
            /^https?:\/\//i.test(homeHeroBanner.ctaLink)
              ? <a href={homeHeroBanner.ctaLink} className="mb-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg hover:bg-emerald-400">{homeHeroBanner.ctaText}<ArrowRight size={16}/></a>
              : <Link to={homeHeroBanner.ctaLink} className="mb-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg hover:bg-emerald-400">{homeHeroBanner.ctaText}<ArrowRight size={16}/></Link>
          )}

          {/* Contextual Discovery Search Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/95 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl shadow-2xl max-w-4xl mx-auto border border-white/60 text-left"
          >
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                
                {/* Destination Input */}
                <div className="md:col-span-2 relative">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">
                    Where do you want to go?
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="e.g. Spiti Valley, Bali, Meghalaya, Kasol..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Duration Filter */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">
                    Duration
                  </label>
                  <select
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Durations</option>
                    <option value="weekend">Weekend (2–3 Days)</option>
                    <option value="short">Short Break (4–5 Days)</option>
                    <option value="expedition">Expedition (6–8 Days)</option>
                  </select>
                </div>

                {/* Budget Filter */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">
                    Budget Level
                  </label>
                  <select
                    value={budgetFilter}
                    onChange={(e) => setBudgetFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Budgets</option>
                    <option value="under15k">Under ₹15,000</option>
                    <option value="15k_25k">₹15,000 – ₹25,000</option>
                    <option value="above35k">Premium ₹35,000+</option>
                  </select>
                </div>
              </div>

              {/* Bottom Action Row */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const pool = activeCatalog;
                      const pick = pool[Math.floor(Math.random() * pool.length)];
                      if (pick) navigate(`/trip/${pick.slug || pick.id}`);
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shuffle size={13} className="text-emerald-500" /> Surprise Me
                  </button>

                  <Link
                    to={`/plan?destination=${encodeURIComponent(searchQuery || 'Meghalaya')}`}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black rounded-xl transition-all border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={13} /> Custom Route with AI
                  </Link>
                </div>

                <button 
                  type="submit"
                  className="w-full sm:w-auto px-7 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Search size={15} /> Find 50+ Packages
                </button>
              </div>
            </form>
          </motion.div>

          {/* Trending Search Chips */}
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs text-slate-300">
            <span className="font-bold text-slate-400 flex items-center gap-1">
              <TrendingUp size={13} className="text-emerald-400" /> Trending:
            </span>
            {TRENDING_SEARCH_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => navigate(`/trips?q=${chip.query}`)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg backdrop-blur-md border border-white/15 transition-all cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TRUST & SOCIAL PROOF STRIP */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 text-white py-5 border-y border-slate-800 relative z-20 shadow-md">
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
      {/* 3. POPULAR DESTINATIONS / WHERE NEXT? */}
      {/* ========================================================================= */}
      <section className="travel-section">
        <div className="travel-container">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-8">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block mb-1">
                Explore Destinations
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
                Popular Mountain & Island Hubs
              </h2>
            </div>
            <Link 
              to="/trips" 
              className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0"
            >
              Browse All 50+ Circuits <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {DESTINATIONS.slice(0, 8).map(dest => {
              const activeCount = getDestinationPackageCount(dest.name, activeCatalog);
              const destWeather = getWeatherFor(dest.name);
              return (
                <DestinationCard 
                  key={dest.id} 
                  destination={dest} 
                  activeCount={activeCount}
                  weather={destWeather}
                  aspect="aspect-[3/4]"
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. EXPLORE TRAVEL STYLES */}
      {/* ========================================================================= */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="travel-container">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-6">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block mb-1">
                Curated Travel Formats
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Explore by Travel Style
              </h2>
            </div>
            <Link to="/trips" className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All Formats <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { label: 'Community Trips', count: '50 Trips', path: '/community-trips', icon: HeartHandshake },
              { label: 'Weekend Getaways', count: '19 Trips', path: '/weekend-trips', icon: Clock },
              { label: 'Backpacking Circuits', count: '15 Trips', path: '/backpacking-trips', icon: Backpack },
              { label: 'Adventure & Treks', count: '19 Trips', path: '/adventure-treks', icon: Mountain },
              { label: 'Romantic Escapes', count: '20 Trips', path: '/romantic-escapes', icon: Heart },
              { label: 'Culture & Heritage', count: '12 Trips', path: '/culture-heritage', icon: Compass }
            ].map((style) => {
              const IconComp = style.icon;
              return (
                <Link
                  key={style.label}
                  to={style.path}
                  className="p-4 rounded-3xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white text-emerald-600 flex items-center justify-center mb-3 shadow-xs group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <IconComp size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {style.label}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">{style.count}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 5. UPCOMING COMMUNITY TRIPS (WITH DEPARTURE MONTH TABS) */}
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
