import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Calendar, Users, ShieldCheck, HeartHandshake, 
  Compass, CreditCard, Star, Award, Sparkles, CloudSun, ArrowRight,
  Sun, CheckCircle2, TrendingUp, Clock, Flame, Mountain, Palmtree,
  Trees, Waves, History, Shuffle, X, Tag, DollarSign, ChevronRight
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import TripCard from '../components/TripCard';
import SEOHead from '../components/SEOHead';
import WeatherBadge from '../components/WeatherBadge';
import AIPlannerModal from '../components/AIPlannerModal';
import { getOrganizationSchema, getTravelAgencySchema } from '../utils/seoSchemas';
import { UPCOMING_TRIPS, DESTINATIONS, TESTIMONIALS, getDestinationPackageCount } from '../constants/mockData';
import { useTravelContext } from '../hooks/useTravelContext';

const Home = () => {
  const navigate = useNavigate();
  const { 
    timeContext, dayContext, season, occasion, 
    userPreferences, updatePreferences, recommendedTrips, 
    weekendGetaways, recentlyViewed, savedAIPlans, getWeatherFor 
  } = useTravelContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [typeQuery, setTypeQuery] = useState('group');
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerDestination, setPlannerDestination] = useState('Meghalaya');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate('/destinations', { 
      state: { 
        searchQuery,
        budgetFilter,
        durationFilter
      } 
    });
  };

  const openAIPlannerFor = (dest = 'Meghalaya') => {
    setPlannerDestination(dest);
    setIsPlannerOpen(true);
  };

  const handleMoodSelect = (moodQuery) => {
    updatePreferences({ mood: moodQuery });
    navigate('/destinations', { state: { searchQuery: moodQuery } });
  };

  const moods = [
    { 
      label: 'Mountain Passes', 
      icon: Mountain, 
      query: 'Mountains', 
      count: `${UPCOMING_TRIPS.filter(t => (t.tags || []).some(tag => tag.toLowerCase().includes('mountain') || tag.toLowerCase().includes('himalaya'))).length} Trips` 
    },
    { 
      label: 'Tropical Coastal', 
      icon: Palmtree, 
      query: 'Beach', 
      count: `${UPCOMING_TRIPS.filter(t => (t.tags || []).some(tag => tag.toLowerCase().includes('beach') || tag.toLowerCase().includes('tropical') || tag.toLowerCase().includes('coastal'))).length} Trips` 
    },
    { 
      label: 'Misty Rainforests', 
      icon: Trees, 
      query: 'Waterfalls', 
      count: `${UPCOMING_TRIPS.filter(t => (t.tags || []).some(tag => tag.toLowerCase().includes('waterfall') || tag.toLowerCase().includes('rainforest') || tag.toLowerCase().includes('nature'))).length} Trips` 
    },
    { 
      label: 'High Altitude Treks', 
      icon: Waves, 
      query: 'High Altitude', 
      count: `${UPCOMING_TRIPS.filter(t => (t.tags || []).some(tag => tag.toLowerCase().includes('altitude') || tag.toLowerCase().includes('trek') || tag.toLowerCase().includes('adventure'))).length} Trips` 
    },
    { 
      label: 'Backpacking Circuits', 
      icon: Compass, 
      query: 'Backpacking', 
      count: `${UPCOMING_TRIPS.filter(t => (t.tags || []).some(tag => tag.toLowerCase().includes('backpacking') || t.category === 'Backpacking')).length} Trips` 
    }
  ];

  const organizationSchemas = [getOrganizationSchema(), getTravelAgencySchema()];

  return (
    <div className="w-full bg-brand-light">
      <SEOHead
        title="WanderLuxe | Luxury Group Travel, Backpacking Expeditions & AI Travel Planner"
        description="Book premium group trips and backpacking expeditions across Meghalaya, Spiti Valley, Kashmir, Bali, and Ladakh. Plan custom itineraries with our AI Travel Intelligence."
        canonical="/"
        jsonLd={organizationSchemas}
      />

      {/* AI Planner Modal */}
      <AIPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        initialDestination={plannerDestination}
      />

      {/* Context-Aware Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-20 overflow-hidden">
        {/* Background Image & Ambient Gradients */}
        <div className="absolute inset-0 z-0 bg-brand-navy">
          <img 
            src="https://images.pexels.com/photos/6239996/pexels-photo-6239996.jpeg" 
            alt="WanderLuxe luxury group travel landscape background" 
            className="w-full h-full object-cover opacity-50 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/80 via-brand-navy/40 to-brand-light"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center mt-[-20px]">
          {/* Live Contextual Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs font-black text-emerald-300 mb-6 shadow-xl"
          >
            <CloudSun size={15} className="text-emerald-400" />
            <span>{season.heroTag}</span>
            <span className="text-white/30">•</span>
            <span className="text-white/90 font-medium">{timeContext.greeting}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-4 max-w-4xl mx-auto leading-tight"
          >
            {timeContext.heroTitle}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm sm:text-base md:text-lg text-slate-200 max-w-2xl mx-auto mb-8 font-medium"
          >
            {timeContext.heroSubtitle}
          </motion.p>

          {/* Smart Contextual Search Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/95 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-2xl max-w-4xl mx-auto border border-white/40 text-left"
          >
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Search Input */}
                <div className="md:col-span-2 relative">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">
                    Destination / State
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Where do you want to go? (e.g. Spiti, Bali)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
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
                    <option value="under10k">Under ₹10,000</option>
                    <option value="under20k">Under ₹20,000</option>
                    <option value="luxury">Premium ₹30,000+</option>
                  </select>
                </div>

                {/* Duration Filter */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">
                    Trip Duration
                  </label>
                  <select
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Durations</option>
                    <option value="weekend">Weekend (2-3 Days)</option>
                    <option value="medium">4 to 5 Days</option>
                    <option value="week">1 Week+ (6-8 Days)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const pick = UPCOMING_TRIPS[Math.floor(Math.random() * UPCOMING_TRIPS.length)];
                      navigate(`/trip/${pick.id}`);
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Shuffle size={13} className="text-emerald-500" /> I'm Flexible (Surprise Me)
                  </button>

                  <button
                    type="button"
                    onClick={() => openAIPlannerFor(searchQuery || 'Meghalaya')}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black rounded-xl transition-all border border-emerald-200 flex items-center gap-1.5"
                  >
                    <Sparkles size={13} /> Custom Plan with AI
                  </button>
                </div>

                <button 
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Search size={15} /> Find 50+ Packages
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges Strip */}
      <section className="bg-brand-navy text-white py-6 border-y border-white/10 relative z-20 shadow-md">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-xs md:text-sm font-bold">
          <div className="flex items-center justify-center gap-2">
            <Star className="text-amber-400 fill-amber-400 shrink-0" size={18} />
            <span>4.9★ Verified Rating (12k+ Reviews)</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Users className="text-brand-emerald shrink-0" size={18} />
            <span>50,000+ Community Travelers</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="text-brand-emerald shrink-0" size={18} />
            <span>100% Certified Trip Captains</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="text-brand-emerald shrink-0" size={18} />
            <span>0% No-Cost EMI & Instant QR Pass</span>
          </div>
        </div>
      </section>

      {/* "Continue Your Journey / Resume Planning" Row (if user has views or AI plans) */}
      {(recentlyViewed.length > 0 || savedAIPlans.length > 0) && (
        <section className="py-10 bg-slate-50 border-b border-slate-200/80">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History size={20} className="text-emerald-600" />
                <h2 className="text-xl md:text-2xl font-black text-slate-900">
                  Continue Your Journey
                </h2>
              </div>
              <Link to="/profile" className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                View All History <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* If there is a saved AI plan, highlight it as first card */}
              {savedAIPlans.length > 0 && (
                <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-3xl p-5 text-white flex flex-col justify-between shadow-md border border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                      Unbooked AI Route
                    </span>
                    <h3 className="text-base font-black mt-2 leading-snug">{savedAIPlans[0].title}</h3>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1">{savedAIPlans[0].tagline}</p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{savedAIPlans[0].daysCount} Days</span>
                    <button
                      onClick={() => openAIPlannerFor(savedAIPlans[0].destination)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1"
                    >
                      Resume <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {recentlyViewed.slice(0, savedAIPlans.length > 0 ? 3 : 4).map((trip) => (
                <TripCard key={trip.id} trip={trip} showWeather={true} customBadge="Recently Viewed" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* "Recommended For You" Contextual Discovery Section */}
      <section className="py-16 container mx-auto px-4 md:px-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
              <Sparkles size={13} />
              Personalized for {timeContext.period} & {season.name.split(' ')[0]}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
              Recommended Expeditions For You
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              Ranked dynamically by climate suitability, upcoming departures, and community ratings.
            </p>
          </div>

          <Link to="/destinations" className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Browse All 50 Expeditions <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedTrips.slice(0, 8).map((trip) => (
            <TripCard key={trip.id} trip={trip} showWeather={true} />
          ))}
        </div>
      </section>

      {/* Travel by Mood / Category Discovery */}
      <section className="py-12 bg-slate-50 border-y border-slate-200/80">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-6">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block">
                Tailored Travel Vibe
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                Explore Journeys by Mood & Style
              </h2>
            </div>
            <Link to="/destinations" className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Browse All Categories <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {moods.map((m) => (
              <div
                key={m.label}
                onClick={() => handleMoodSelect(m.query)}
                className={`p-4 rounded-3xl bg-white border transition-all cursor-pointer group flex flex-col justify-between ${
                  userPreferences.mood === m.query
                    ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200/80 hover:border-emerald-500 hover:shadow-md'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <m.icon size={20} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {m.label}
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400 mt-0.5 block">{m.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive AI Trip Planner Hero Banner */}
      <section className="container mx-auto px-4 md:px-8 py-16">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 rounded-3xl p-8 md:p-12 text-white shadow-2xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3 border border-emerald-500/30">
              <Sparkles size={14} /> WanderLuxe AI Travel Planner
            </div>
            <h2 className="text-2xl md:text-4xl font-black mb-3 leading-tight">
              Can't Find Your Exact Route? Let AI Build One in Seconds.
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed mb-6">
              Get an instant day-by-day plan with hidden mountain waterfalls, estimated stay and food budgets, packing checklists, and verified captain departures.
            </p>
            <button
              onClick={() => openAIPlannerFor('Meghalaya')}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
            >
              <Sparkles size={16} /> Plan Custom Itinerary with AI
            </button>
          </div>

          <div className="relative z-10 w-full lg:w-96 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">Sample AI Generation</span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/10">
                <span className="font-bold">Spiti Valley Circuit</span>
                <span className="text-emerald-300 font-bold">6 Days</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/10">
                <span className="font-bold">Meghalaya Root Bridges</span>
                <span className="text-emerald-300 font-bold">5 Days</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/10">
                <span className="font-bold">Bali & Nusa Penida</span>
                <span className="text-emerald-300 font-bold">5 Days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destination Hubs (9 Geographies with Dynamic Counts) */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
              Handpicked Geographies
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 mt-1 mb-2">
              Featured Travel Hubs
            </h2>
            <p className="text-slate-500 text-xs md:text-sm font-medium">
              Explore destinations with real-time climate data and verified active departures.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
            {DESTINATIONS.map(dest => {
              const destWeather = getWeatherFor(dest.name);
              const activeCount = getDestinationPackageCount(dest.name, UPCOMING_TRIPS);
              return (
                <motion.div 
                  key={dest.id}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate('/destinations', { state: { searchQuery: dest.name } })}
                  className="relative rounded-3xl overflow-hidden aspect-[4/3] group cursor-pointer shadow-sm border border-slate-100"
                >
                  <img 
                    src={dest.image} 
                    alt={`${dest.name} travel tour package destination`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/25 to-transparent flex flex-col justify-between p-4">
                    <div className="self-end">
                      <WeatherBadge weather={destWeather} size="sm" showCondition={false} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">{dest.region || dest.category}</span>
                      <h3 className="text-white font-extrabold text-base leading-tight">{dest.name}</h3>
                      <p className="text-emerald-300 text-[11px] font-bold mt-0.5">
                        {activeCount} Active {activeCount === 1 ? 'Package' : 'Packages'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community Testimonials */}
      <section className="py-20 bg-brand-light">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">Real Community Stories</span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 mt-1 mb-2">Loved by 50,000+ Solo & Group Explorers</h2>
            <p className="text-slate-500 text-xs md:text-sm font-medium">Read verified experiences from real community members across India.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((test) => (
              <div key={test.id} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed italic">
                  "{test.content}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <img src={test.avatar} alt={test.name} className="w-10 h-10 rounded-full object-cover border border-emerald-500" />
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
    </div>
  );
};

export default Home;
