import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Users, ShieldCheck, HeartHandshake, Compass, CreditCard, Star } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import TripCard from '../components/TripCard';
import { UPCOMING_TRIPS, DESTINATIONS, TESTIMONIALS } from '../constants/mockData';

const Home = () => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center pt-20">
        <div className="absolute inset-0 z-0 bg-brand-navy">
          <img 
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop" 
            alt="Travel background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/60 via-transparent to-brand-light"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center mt-[-80px]">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg"
          >
            Global Community of Travelers
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto font-medium"
          >
            Explore the world with like-minded adventurers. Handcrafted trips, unforgettable memories.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-dark p-2 md:p-3 rounded-2xl md:rounded-full max-w-4xl mx-auto flex flex-col md:flex-row gap-3 items-center justify-between"
          >
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-0 md:border-r border-white/20">
              <MapPin className="text-brand-emerald" size={24} />
              <input type="text" placeholder="Where to?" className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg" />
            </div>
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-0 md:border-r border-white/20">
              <Calendar className="text-brand-emerald" size={24} />
              <input type="text" placeholder="Month" className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg" />
            </div>
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 md:py-0">
              <Users className="text-brand-emerald" size={24} />
              <select className="w-full bg-transparent text-white focus:outline-none text-lg appearance-none">
                <option value="group" className="text-brand-navy">Group Trip</option>
                <option value="private" className="text-brand-navy">Private Trip</option>
              </select>
            </div>
            <button className="w-full md:w-auto bg-brand-emerald hover:bg-brand-teal transition-colors text-white px-8 py-4 rounded-xl md:rounded-full font-bold flex items-center justify-center gap-2">
              <Search size={20} />
              Search
            </button>
          </motion.div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="container mx-auto px-4 py-12 -mt-20 relative z-20">
        <div className="bg-gradient-to-r from-brand-navy to-brand-teal rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold mb-4 inline-block">Limited Time Offer</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Summer Independence Sale</h2>
            <p className="text-white/90 text-lg max-w-md">Up to 25% off on all Himalayan expeditions. Book before August 15th.</p>
          </div>
          <button className="mt-6 md:mt-0 relative z-10 bg-white text-brand-navy px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Claim Offer Now
          </button>
        </div>
      </section>

      {/* Upcoming Trips */}
      <section className="py-16 bg-brand-light">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-brand-navy mb-2">Upcoming Community Trips</h2>
              <p className="text-gray-500">Join our curated group departures</p>
            </div>
            <button className="hidden md:block text-brand-emerald font-semibold hover:text-brand-teal">View All Trips &rarr;</button>
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
          <h2 className="text-3xl font-bold text-brand-navy mb-10 text-center">Trending Destinations</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {DESTINATIONS.map(dest => (
              <motion.div 
                key={dest.id}
                whileHover={{ scale: 1.05 }}
                className="relative rounded-2xl overflow-hidden aspect-[4/5] group cursor-pointer"
              >
                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 to-transparent flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-lg leading-tight">{dest.name}</h3>
                  <p className="text-white/80 text-sm">{dest.count} Trips</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-brand-navy mb-4">Why Choose WanderLuxe?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">We're committed to providing the most seamless, premium, and memorable travel experiences.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-brand-light rounded-3xl text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-brand-navy mb-3">Verified Stays</h3>
              <p className="text-gray-500">Every property is personally vetted by our team for premium quality.</p>
            </div>
            
            <div className="p-6 bg-brand-light rounded-3xl text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-6">
                <Compass size={32} />
              </div>
              <h3 className="text-xl font-bold text-brand-navy mb-3">Expert Captains</h3>
              <p className="text-gray-500">Travel with certified trip leads who know destinations inside out.</p>
            </div>
            
            <div className="p-6 bg-brand-light rounded-3xl text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-6">
                <HeartHandshake size={32} />
              </div>
              <h3 className="text-xl font-bold text-brand-navy mb-3">Like-minded Community</h3>
              <p className="text-gray-500">Join a vibrant community of passionate, adventurous travelers.</p>
            </div>
            
            <div className="p-6 bg-brand-light rounded-3xl text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mb-6">
                <CreditCard size={32} />
              </div>
              <h3 className="text-xl font-bold text-brand-navy mb-3">Flexible Payments</h3>
              <p className="text-gray-500">Book your slot with a minimal advance and pay the rest later easily.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-brand-navy overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12">
            <div className="text-white max-w-xl">
              <h2 className="text-3xl font-bold mb-4">Loved by Travelers Worldwide</h2>
              <p className="text-white/70">Don't just take our word for it. Hear from our amazing community of over 50,000+ happy travelers.</p>
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
                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-3xl h-full flex flex-col">
                  <div className="flex gap-1 text-yellow-400 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                  </div>
                  <p className="text-white/90 leading-relaxed mb-8 flex-grow">"{testimonial.content}"</p>
                  <div className="flex items-center gap-4">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover border-2 border-brand-emerald" />
                    <div>
                      <h4 className="text-white font-bold">{testimonial.name}</h4>
                      <p className="text-white/50 text-sm">{testimonial.role}</p>
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

