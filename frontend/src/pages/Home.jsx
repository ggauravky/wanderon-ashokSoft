import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Users, ShieldCheck, HeartHandshake, Compass, CreditCard, Star, Award, CheckCircle } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import TripCard from '../components/TripCard';
import SEOHead from '../components/SEOHead';
import { getOrganizationSchema, getTravelAgencySchema } from '../utils/seoSchemas';
import { UPCOMING_TRIPS, DESTINATIONS, TESTIMONIALS } from '../constants/mockData';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [monthQuery, setMonthQuery] = useState('');
  const [typeQuery, setTypeQuery] = useState('group');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate('/destinations', { state: { searchQuery, monthQuery, typeQuery } });
  };

  const instagramPhotos = [
    { id: 1, image: 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg', location: 'Meghalaya', handle: '@wanderer_gaurav' },    { id: 2, image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600', location: 'Spiti Valley', handle: '@rohit_travels' },
    { id: 3, image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80&w=600', location: 'Bali, Indonesia', handle: '@ananya_diaries' },
    { id: 4, image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600', location: 'Ladakh', handle: '@wanderluxe_official' }
  ];

  const organizationSchemas = [getOrganizationSchema(), getTravelAgencySchema()];

  return (
    <div className="w-full">
      <SEOHead
        title="WanderLuxe | Luxury Group Travel, Backpacking Expeditions & Custom Trips"
        description="Book premium group trips and backpacking expeditions across Meghalaya, Spiti Valley, Kashmir, Bali, and Ladakh with verified trip captains and 0% No-Cost EMI."
        canonical="/"
        jsonLd={organizationSchemas}
      />

      {/* Hero Section */}
      <section className="relative h-screen min-h-[650px] flex items-center justify-center pt-20">
        <div className="absolute inset-0 z-0 bg-brand-navy">
          <img 
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop" 
            alt="WanderLuxe luxury group travel landscape background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/70 via-brand-navy/30 to-brand-light"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center mt-[-60px]">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-emerald/20 border border-brand-emerald/40 text-xs font-extrabold text-brand-emerald mb-6 backdrop-blur-md"
          >
            <Award size={16} /> Rated #1 Luxury Group Travel Community in India
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 drop-shadow-lg tracking-tight"
          >
            Global Community of Adventurers
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto font-medium"
          >
            Explore the world with like-minded travelers. Handcrafted expeditions, verified trip captains, and unforgettable memories.
          </motion.p>

          <motion.form 
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-dark p-2 md:p-3 rounded-2xl md:rounded-full max-w-4xl mx-auto flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xl border border-white/20"
          >
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-0 md:border-r border-white/20">
              <MapPin className="text-brand-emerald shrink-0" size={24} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Where to? (e.g. Meghalaya, Spiti)" 
                className="w-full bg-transparent text-white placeholder-gray-300 focus:outline-none text-base md:text-lg font-semibold" 
              />
            </div>
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-0 md:border-r border-white/20">
              <Calendar className="text-brand-emerald shrink-0" size={24} />
              <input 
                type="text" 
                value={monthQuery}
                onChange={(e) => setMonthQuery(e.target.value)}
                placeholder="Month (e.g. August, Sep)" 
                className="w-full bg-transparent text-white placeholder-gray-300 focus:outline-none text-base md:text-lg font-semibold" 
              />
            </div>
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-0">
              <Users className="text-brand-emerald shrink-0" size={24} />
              <select 
                value={typeQuery}
                onChange={(e) => setTypeQuery(e.target.value)}
                className="w-full bg-transparent text-white focus:outline-none text-base md:text-lg font-semibold appearance-none cursor-pointer"
              >
                <option value="group" className="text-brand-navy font-bold">Group Departure</option>
                <option value="private" className="text-brand-navy font-bold">Custom Private Trip</option>
                <option value="weekend" className="text-brand-navy font-bold">Weekend Getaway</option>
              </select>
            </div>
            <button 
              type="submit"
              className="w-full md:w-auto bg-brand-emerald hover:bg-brand-teal transition-all text-white px-8 py-4 rounded-xl md:rounded-full font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-brand-emerald/30 shrink-0"
            >
              <Search size={20} />
              Search Trips
            </button>
          </motion.form>
        </div>
      </section>

      {/* Trust Badges Strip */}
      <section className="bg-brand-navy text-white py-6 border-y border-white/10 relative z-20">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-xs md:text-sm font-bold">
          <div className="flex items-center justify-center gap-2">
            <Star className="text-amber-400 fill-amber-400" size={18} />
            <span>4.9★ Google Rating (12k+ Reviews)</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Users className="text-brand-emerald" size={18} />
            <span>50,000+ Happy Group Travelers</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="text-brand-emerald" size={18} />
            <span>100% Certified Trip Captains</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="text-brand-emerald" size={18} />
            <span>0% No-Cost EMI Available</span>
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-brand-navy via-brand-teal to-brand-emerald rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10 max-w-xl">
            <span className="bg-white/20 text-white px-3.5 py-1 rounded-full text-xs font-extrabold mb-4 inline-block">
              🔥 Independence Month Offer
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2">Summer Independence Expedition Sale</h2>
            <p className="text-white/90 text-sm md:text-base font-medium">
              Save up to ₹5,000 on all Meghalaya, Spiti & Ladakh group departures. Use code <span className="font-mono font-extrabold bg-white/20 px-2 py-0.5 rounded">SUMMER500</span> on checkout.
            </p>
          </div>
          <Link to="/destinations" className="mt-6 md:mt-0 relative z-10 bg-white text-brand-navy px-8 py-4 rounded-full font-extrabold hover:bg-brand-light transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Claim Offer Now
          </Link>
        </div>
      </section>

      {/* Upcoming Trips */}
      <section className="py-16 bg-brand-light">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-brand-navy mb-2">Upcoming Community Departures</h2>
              <p className="text-gray-500 font-medium">Join our handpicked group trips with verified trip captains</p>
            </div>
            <Link to="/destinations" className="hidden md:block text-brand-emerald font-extrabold hover:text-brand-teal">
              View All Expeditions &rarr;
            </Link>
          </div>
          
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            navigation
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
            className="pb-12"
          >
            {UPCOMING_TRIPS.map(trip => (
              <SwiperSlide key={trip.id} className="pb-4">
                <TripCard trip={trip} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-brand-navy mb-10 text-center">Trending Travel Destinations</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {DESTINATIONS.map(dest => (
              <motion.div 
                key={dest.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/destinations')}
                className="relative rounded-2xl overflow-hidden aspect-[4/5] group cursor-pointer shadow-md"
              >
                <img src={dest.image} alt={`${dest.name} travel tour package destination`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-transparent to-transparent flex flex-col justify-end p-4">
                  <h3 className="text-white font-extrabold text-lg leading-tight">{dest.name}</h3>
                  <p className="text-white/80 text-xs font-semibold">{dest.count} Active Packages</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-emerald">The WanderLuxe Standard</span>
            <h2 className="text-3xl font-extrabold text-brand-navy mt-1 mb-4">Why Choose WanderLuxe Travels?</h2>
            <p className="text-gray-500 font-medium">We're committed to providing the most seamless, premium, and memorable travel experiences.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-8 bg-brand-light rounded-3xl text-center hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-16 h-16 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-brand-navy mb-3">Handpicked Stays</h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">Every boutique resort and mountain stay is personally vetted for luxury & safety.</p>
            </div>
            
            <div className="p-8 bg-brand-light rounded-3xl text-center hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-16 h-16 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-6">
                <Compass size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-brand-navy mb-3">Expert Captains</h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">Travel alongside certified trip captains trained in first-aid, navigation, & photography.</p>
            </div>
            
            <div className="p-8 bg-brand-light rounded-3xl text-center hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-16 h-16 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-6">
                <HeartHandshake size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-brand-navy mb-3">Verified Traveler Community</h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">Solo & group travelers screened for respectful, adventurous group dynamics.</p>
            </div>
            
            <div className="p-8 bg-brand-light rounded-3xl text-center hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-16 h-16 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-6">
                <CreditCard size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-brand-navy mb-3">Flexible Payment & EMI</h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">Reserve with 20% advance or pay in 0% interest monthly EMIs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Instagram Feed */}
      <section className="py-16 bg-brand-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-emerald flex items-center justify-center gap-1">
              <FaInstagram size={16} /> @WanderLuxe.Official
            </span>
            <h2 className="text-3xl font-extrabold text-brand-navy mt-1">Real Moments from Recent Expeditions</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {instagramPhotos.map((photo) => (
              <div key={photo.id} className="relative rounded-2xl overflow-hidden aspect-square group shadow-md cursor-pointer">
                <img src={photo.image} alt={`Community photo from ${photo.location}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 text-white">
                  <span className="text-xs font-extrabold">{photo.handle}</span>
                  <span className="text-xs font-semibold flex items-center gap-1">
                    <MapPin size={12} className="text-brand-emerald" /> {photo.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-brand-navy overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12">
            <div className="text-white max-w-xl">
              <h2 className="text-3xl font-extrabold mb-4">Loved by Travelers Worldwide</h2>
              <p className="text-white/70 text-sm font-medium">Hear from our community of over 50,000+ happy travelers across 100+ departures.</p>
            </div>
          </div>

          <Swiper
            modules={[Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {TESTIMONIALS.map((testimonial) => (
              <SwiperSlide key={testimonial.id}>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-3xl h-full flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 text-yellow-400 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed mb-8">"{testimonial.content}"</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover border-2 border-brand-emerald" />
                    <div>
                      <h3 className="text-white font-bold text-sm">{testimonial.name}</h3>
                      <p className="text-white/50 text-xs">{testimonial.role}</p>
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
