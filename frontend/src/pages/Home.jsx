import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, MapPin, Calendar, Users, ShieldCheck, HeartHandshake, 
  Compass, CreditCard, Star, Award, Sparkles, CloudSun, ArrowRight,
  Sun, CheckCircle2, TrendingUp, Clock, Flame, Mountain, Palmtree,
  Trees, Waves, History, Shuffle
} from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import TripCard from '../components/TripCard';
import SEOHead from '../components/SEOHead';
import WeatherBadge from '../components/WeatherBadge';
import AIPlannerModal from '../components/AIPlannerModal';
import { getOrganizationSchema, getTravelAgencySchema } from '../utils/seoSchemas';
import { UPCOMING_TRIPS, DESTINATIONS, TESTIMONIALS } from '../constants/mockData';
import { useWeatherAndSeason } from '../hooks/useWeatherAndSeason';
import { getRecentlyViewedTrips } from '../utils/userHistory';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [monthQuery, setMonthQuery] = useState('');
  const [typeQuery, setTypeQuery] = useState('group');
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerDestination, setPlannerDestination] = useState('Meghalaya');
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const { season, trendingTrips, seasonalPicks, getWeatherFor } = useWeatherAndSeason();

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewedTrips());
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    navigate('/destinations', { state: { searchQuery, monthQuery, typeQuery } });
  };

  const handleFlexibleSurprise = () => {
    const randomTrip = trendingTrips[Math.floor(Math.random() * trendingTrips.length)] || trendingTrips[0];
    navigate(`/trip/${randomTrip.id}`);
  };

  const openAIPlannerFor = (dest = 'Meghalaya') => {
    setPlannerDestination(dest);
    setIsPlannerOpen(true);
  };

  const moods = [
    { label: 'Mountain Passes', icon: Mountain, query: 'Mountains', count: '12 Trips' },
    { label: 'Tropical Coastal', icon: Palmtree, query: 'Beach', count: '8 Trips' },
    { label: 'Misty Rainforests', icon: Trees, query: 'Waterfalls', count: '6 Trips' },
    { label: 'High Altitude Treks', icon: Waves, query: 'High Altitude', count: '10 Trips' },
    { label: 'Backpacking Circuits', icon: Compass, query: 'Backpacking', count: '14 Trips' }
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

      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-20 overflow-hidden">
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
          {/* Dynamic Weather & Seasonal Live Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs font-black text-emerald-300 mb-6 shadow-xl"
          >
            <CloudSun size={15} className="text-emerald-400" />
            <span>{season.heroTag}</span>
            <span className="text-white/30">•</span>
            <span className="text-white/90 font-medium">{season.greeting}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 drop-shadow-md tracking-tight max-w-4xl mx-auto leading-tight"
          >
            Curated Expeditions for Extraordinary Travelers
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Handcrafted itineraries, verified boutique stays, certified trip captains, and an inspiring community of solo & group adventurers.
          </motion.p>

          {/* Interactive Multi-Field Search Bar */}
          <motion.form 
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/95 backdrop-blur-2xl p-2.5 sm:p-3 rounded-3xl sm:rounded-full max-w-4xl mx-auto flex flex-col md:flex-row gap-2 items-center justify-between shadow-2xl border border-white/40 text-slate-800"
          >
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-1 md:border-r border-gray-200">
              <MapPin className="text-emerald-600 shrink-0" size={20} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Where to? (e.g. Meghalaya, Spiti)" 
                className="w-full bg-transparent text-slate-900 placeholder-gray-400 focus:outline-none text-sm sm:text-base font-bold" 
              />
            </div>

            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-1 md:border-r border-gray-200">
              <Calendar className="text-emerald-600 shrink-0" size={20} />
              <input 
                type="text" 
                value={monthQuery}
                onChange={(e) => setMonthQuery(e.target.value)}
                placeholder="Departure Month" 
                className="w-full bg-transparent text-slate-900 placeholder-gray-400 focus:outline-none text-sm sm:text-base font-bold" 
              />
            </div>

            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-1">
              <Users className="text-emerald-600 shrink-0" size={20} />
              <select 
                value={typeQuery}
                onChange={(e) => setTypeQuery(e.target.value)}
                className="w-full bg-transparent text-slate-900 focus:outline-none text-sm sm:text-base font-bold appearance-none cursor-pointer"
              >
                <option value="group">Group Departure</option>
                <option value="private">Custom Private Trip</option>
                <option value="weekend">Weekend Getaway</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button 
                type="submit"
                className="flex-1 md:flex-initial bg-emerald-500 hover:bg-emerald-600 transition-all text-white px-6 py-3.5 rounded-2xl md:rounded-full font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 shrink-0"
              >
                <Search size={16} />
                <span>Search Trips</span>
              </button>

              <button
                type="button"
                onClick={() => openAIPlannerFor('Meghalaya')}
                className="bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-2xl md:rounded-full text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1"
                title="Plan custom route with AI"
              >
                <Sparkles size={16} className="text-emerald-400" />
                <span className="hidden sm:inline">AI Planner</span>
              </button>
            </div>
          </motion.form>

          {/* Quick Discovery Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6 text-xs text-white/80">
            <span className="font-semibold text-white/50">Quick Explore:</span>
            <button
              onClick={handleFlexibleSurprise}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all"
            >
              <Shuffle size={13} className="text-emerald-400" /> I'm Flexible (Surprise Me)
            </button>
            <button
              onClick={() => openAIPlannerFor('Spiti Valley')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all"
            >
              <Sparkles size={13} className="text-emerald-400" /> Plan 5-Day Spiti with AI
            </button>
          </div>
        </div>
      </section>

      {/* Trust Badges Strip */}
      <section className="bg-brand-navy text-white py-6 border-y border-white/10 relative z-20 shadow-md">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-xs md:text-sm font-bold">
          <div className="flex items-center justify-center gap-2">
            <Star className="text-amber-400 fill-amber-400 shrink-0" size={18} />
            <span>4.9★ Community Rating (12k+ Reviews)</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Users className="text-brand-emerald shrink-0" size={18} />
            <span>50,000+ Verified Travelers</span>
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

      {/* Travel by Mood / Category Discovery */}
      <section className="py-12 container mx-auto px-4 md:px-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-6">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block">
              Curated Styles
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
              Explore Journeys by Mood & Travel Vibe
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
              onClick={() => navigate('/destinations', { state: { searchQuery: m.query } })}
              className="p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
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
      </section>

      {/* Interactive AI Trip Planner Hero Banner */}
      <section className="container mx-auto px-4 md:px-8 mb-12">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 rounded-3xl p-8 md:p-12 text-white shadow-2xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3 border border-emerald-500/30">
              <Sparkles size={14} /> WanderLuxe AI Travel Planner
            </div>
            <h2 className="text-2xl md:text-4xl font-black mb-3 leading-tight">
              Can't Find Your Exact Itinerary? Let AI Build One in Seconds.
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed mb-6">
              Get an instant day-by-day plan with hidden mountain waterfalls, estimated food and stay budgets, packing checklists, and verified captain departures.
            </p>
            <button
              onClick={() => openAIPlannerFor('Meghalaya')}
              className="px-7 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              <Sparkles size={16} /> Launch AI Trip Planner
            </button>
          </div>

          {/* Quick Destination Climate Forecast Showcase */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto relative z-10">
            {[
              { loc: 'Meghalaya', name: 'Meghalaya' },
              { loc: 'Spiti', name: 'Spiti Valley' },
              { loc: 'Bali', name: 'Bali' },
              { loc: 'Kerala', name: 'Kerala' }
            ].map((d) => {
              const w = getWeatherFor(d.loc);
              return (
                <div 
                  key={d.name} 
                  onClick={() => openAIPlannerFor(d.name)}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center hover:bg-white/10 transition-colors cursor-pointer"
                  title="Click to plan with AI"
                >
                  <span className="text-xs font-extrabold text-white block truncate">{d.name}</span>
                  <span className="text-sm font-black text-emerald-400 block mt-0.5">{w.temp}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{w.condition}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending This Season Carousel */}
      <section className="py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 mb-1">
                <TrendingUp size={16} /> Live Verified Departures
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900">
                Trending Expeditions This Season
              </h2>
            </div>
            <Link 
              to="/destinations" 
              className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0"
            >
              View All 2026 Departures <ArrowRight size={14} />
            </Link>
          </div>
          
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
            className="pb-10"
          >
            {trendingTrips.map(trip => (
              <SwiperSlide key={trip.id} className="pb-2 h-auto">
                <TripCard trip={trip} showWeather={true} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Recently Viewed Trips Row (if available) */}
      {recentlyViewed.length > 0 && (
        <section className="py-8 container mx-auto px-4 md:px-8">
          <div className="flex items-center gap-2 mb-6">
            <History size={20} className="text-emerald-600" />
            <h2 className="text-xl md:text-2xl font-black text-slate-900">Recently Viewed Expeditions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentlyViewed.slice(0, 4).map((trip) => (
              <TripCard key={trip.id} trip={trip} showWeather={true} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Destination Categories */}
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
              Explore destinations sorted by weather suitability and active group departures.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {DESTINATIONS.map(dest => {
              const destWeather = getWeatherFor(dest.name);
              return (
                <motion.div 
                  key={dest.id}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate('/destinations', { state: { searchQuery: dest.name } })}
                  className="relative rounded-3xl overflow-hidden aspect-[3/4] group cursor-pointer shadow-sm border border-slate-100"
                >
                  <img 
                    src={dest.image} 
                    alt={`${dest.name} travel tour package destination`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/20 to-transparent flex flex-col justify-between p-4">
                    <div className="self-end">
                      <WeatherBadge weather={destWeather} size="sm" showCondition={false} />
                    </div>
                    <div>
                      <h3 className="text-white font-extrabold text-base leading-tight">{dest.name}</h3>
                      <p className="text-emerald-300 text-[11px] font-bold mt-0.5">{dest.count} Active Packages</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Apple / Notion Minimalist Value Cards */}
      <section className="py-20 bg-brand-light">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">The WanderLuxe Standard</span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 mt-1 mb-3">Why Travel With WanderLuxe?</h2>
            <p className="text-slate-500 text-xs md:text-sm font-medium">We design authentic adventures with unmatched attention to safety, comfort, and camaraderie.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 bg-white rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow border border-slate-200/80">
              <div className="w-14 h-14 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Handpicked Boutique Stays</h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">Every resort, riverside camp, and mountain homestay is personally vetted for hygiene, aesthetics & safety.</p>
            </div>
            
            <div className="p-8 bg-white rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow border border-slate-200/80">
              <div className="w-14 h-14 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5">
                <Compass size={28} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Certified Trip Captains</h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">Travel with certified leaders trained in first-aid, mountain navigation, logistics & candid photography.</p>
            </div>
            
            <div className="p-8 bg-white rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow border border-slate-200/80">
              <div className="w-14 h-14 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5">
                <HeartHandshake size={28} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Verified Solo & Group Travelers</h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">Join a vibrant community of verified young professionals. Over 60% of our travelers join solo.</p>
            </div>
            
            <div className="p-8 bg-white rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow border border-slate-200/80">
              <div className="w-14 h-14 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5">
                <CreditCard size={28} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Razorpay & Easy No-Cost EMI</h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">Reserve your departure with flexible advance or monthly EMI options with instant QR boarding verification.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Moments & Testimonials */}
      <section className="py-20 bg-brand-navy text-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Traveler Stories & Reviews
            </span>
            <h2 className="text-2xl md:text-4xl font-black mt-1 mb-2">
              Loved by Adventurers Worldwide
            </h2>
            <p className="text-white/70 text-xs md:text-sm font-medium">
              Over 50,000+ young explorers have joined our departures across India & Southeast Asia.
            </p>
          </div>

          <Swiper
            modules={[Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {TESTIMONIALS.map((testimonial) => (
              <SwiperSlide key={testimonial.id}>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl h-full flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 text-amber-400 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-white/90 text-xs md:text-sm leading-relaxed mb-6 font-medium">
                      "{testimonial.content}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400" 
                    />
                    <div>
                      <h4 className="text-white font-extrabold text-xs">{testimonial.name}</h4>
                      <p className="text-emerald-400 text-[11px] font-semibold">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
    </div>
  );
};

export default Home;
