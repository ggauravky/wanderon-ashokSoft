import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, MapPin, Calendar, Users, ShieldCheck, HeartHandshake, 
  Compass, CreditCard, Star, Award, Sparkles, CloudSun, ArrowRight,
  Sun, CheckCircle2, TrendingUp, Clock, Flame
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
import { getOrganizationSchema, getTravelAgencySchema } from '../utils/seoSchemas';
import { UPCOMING_TRIPS, DESTINATIONS, TESTIMONIALS } from '../constants/mockData';
import { useWeatherAndSeason } from '../hooks/useWeatherAndSeason';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [monthQuery, setMonthQuery] = useState('');
  const [typeQuery, setTypeQuery] = useState('group');

  const { season, trendingTrips, seasonalPicks, getWeatherFor } = useWeatherAndSeason();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate('/destinations', { state: { searchQuery, monthQuery, typeQuery } });
  };

  const instagramPhotos = [
    { id: 1, image: 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg', location: 'Meghalaya', handle: '@wanderer_gaurav' },
    { id: 2, image: 'https://images.pexels.com/photos/6239996/pexels-photo-6239996.jpeg', location: 'Spiti Valley', handle: '@rohit_travels' },
    { id: 3, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=600', location: 'Bali, Indonesia', handle: '@ananya_diaries' },
    { id: 4, image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=600', location: 'Kerala', handle: '@wanderluxe_official' }
  ];

  const organizationSchemas = [getOrganizationSchema(), getTravelAgencySchema()];

  return (
    <div className="w-full bg-brand-light">
      <SEOHead
        title="WanderLuxe | Luxury Group Travel, Backpacking Expeditions & Custom Trips"
        description="Book premium group trips and backpacking expeditions across Meghalaya, Spiti Valley, Kashmir, Bali, and Ladakh with verified trip captains and 0% No-Cost EMI."
        canonical="/"
        jsonLd={organizationSchemas}
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
            className="text-base sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Handcrafted itineraries, verified boutique stays, certified trip captains, and an inspiring community of solo & group adventurers.
          </motion.p>

          {/* Interactive Search Bar */}
          <motion.form 
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/95 backdrop-blur-2xl p-2.5 sm:p-3 rounded-3xl sm:rounded-full max-w-4xl mx-auto flex flex-col md:flex-row gap-2 items-center justify-between shadow-2xl border border-white/40 text-brand-navy"
          >
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-1 md:border-r border-gray-200">
              <MapPin className="text-brand-emerald shrink-0" size={20} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Where to? (e.g. Meghalaya, Spiti)" 
                className="w-full bg-transparent text-brand-navy placeholder-gray-400 focus:outline-none text-sm sm:text-base font-bold" 
              />
            </div>

            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-1 md:border-r border-gray-200">
              <Calendar className="text-brand-emerald shrink-0" size={20} />
              <input 
                type="text" 
                value={monthQuery}
                onChange={(e) => setMonthQuery(e.target.value)}
                placeholder="Departure Month" 
                className="w-full bg-transparent text-brand-navy placeholder-gray-400 focus:outline-none text-sm sm:text-base font-bold" 
              />
            </div>

            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-1">
              <Users className="text-brand-emerald shrink-0" size={20} />
              <select 
                value={typeQuery}
                onChange={(e) => setTypeQuery(e.target.value)}
                className="w-full bg-transparent text-brand-navy focus:outline-none text-sm sm:text-base font-bold appearance-none cursor-pointer"
              >
                <option value="group">Group Departure</option>
                <option value="private">Custom Private Trip</option>
                <option value="weekend">Weekend Getaway</option>
              </select>
            </div>

            <button 
              type="submit"
              className="w-full md:w-auto bg-brand-emerald hover:bg-brand-teal transition-all text-white px-7 py-3.5 rounded-2xl md:rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-emerald/30 shrink-0"
            >
              <Search size={18} />
              <span>Search Trips</span>
            </button>
          </motion.form>
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

      {/* Seasonal Weather Intelligence Showcase */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-emerald-950 rounded-3xl p-8 md:p-10 text-white shadow-2xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3 border border-emerald-500/30">
              <Sparkles size={14} /> Season-Smart Travel Advisor
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-2">
              {season.tagline}
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
              {season.weatherAdvice} Verified trip captains are currently leading departures with optimal trail visibility and crystal water flow.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto relative z-10">
            {[
              { loc: 'Meghalaya', name: 'Meghalaya' },
              { loc: 'Spiti', name: 'Spiti Valley' },
              { loc: 'Bali', name: 'Bali' },
              { loc: 'Kerala', name: 'Kerala' }
            ].map((d) => {
              const w = getWeatherFor(d.loc);
              return (
                <div key={d.name} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
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
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-emerald mb-1">
                <TrendingUp size={16} /> Curated By Live Traveler Demand
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-brand-navy">
                Trending Expeditions This Season
              </h2>
            </div>
            <Link 
              to="/destinations" 
              className="text-xs font-extrabold text-brand-emerald hover:text-brand-teal flex items-center gap-1 shrink-0"
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

      {/* Featured Destination Categories */}
      <section className="py-16 bg-white border-y border-gray-200/80">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-emerald">
              Handpicked Geographies
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-brand-navy mt-1 mb-2">
              Featured Travel Hubs
            </h2>
            <p className="text-gray-500 text-xs md:text-sm font-medium">
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
                  className="relative rounded-3xl overflow-hidden aspect-[3/4] group cursor-pointer shadow-sm border border-gray-100"
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
            <span className="text-xs font-black uppercase tracking-wider text-brand-emerald">The WanderLuxe Standard</span>
            <h2 className="text-2xl md:text-4xl font-black text-brand-navy mt-1 mb-3">Why Travel With WanderLuxe?</h2>
            <p className="text-gray-500 text-xs md:text-sm font-medium">We design authentic adventures with unmatched attention to safety, comfort, and camaraderie.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 bg-white rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow border border-gray-200/80">
              <div className="w-14 h-14 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-5">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-base font-extrabold text-brand-navy mb-2">Handpicked Boutique Stays</h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">Every resort, riverside camp, and mountain homestay is personally vetted for hygiene, aesthetics & safety.</p>
            </div>
            
            <div className="p-8 bg-white rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow border border-gray-200/80">
              <div className="w-14 h-14 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-5">
                <Compass size={28} />
              </div>
              <h3 className="text-base font-extrabold text-brand-navy mb-2">Certified Trip Captains</h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">Travel with certified leaders trained in first-aid, mountain navigation, logistics & candid photography.</p>
            </div>
            
            <div className="p-8 bg-white rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow border border-gray-200/80">
              <div className="w-14 h-14 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-5">
                <HeartHandshake size={28} />
              </div>
              <h3 className="text-base font-extrabold text-brand-navy mb-2">Verified Solo & Group Travelers</h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">Join a vibrant community of verified young professionals. Over 60% of our travelers join solo.</p>
            </div>
            
            <div className="p-8 bg-white rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow border border-gray-200/80">
              <div className="w-14 h-14 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-5">
                <CreditCard size={28} />
              </div>
              <h3 className="text-base font-extrabold text-brand-navy mb-2">Razorpay & Easy No-Cost EMI</h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">Reserve your departure with flexible advance or monthly EMI options with instant QR boarding verification.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Moments & Testimonials */}
      <section className="py-20 bg-brand-navy text-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-brand-emerald">
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
                      className="w-10 h-10 rounded-full object-cover border-2 border-brand-emerald" 
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
