import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Star, Calendar, Users, ShieldCheck, Check, X, 
  ChevronDown, ChevronUp, Share2, Heart, Info, ArrowRight, Compass,
  Sparkles, Camera, PhoneCall, HelpCircle, MessageSquare, CloudSun,
  Award, CheckCircle2, ShieldAlert
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import WeatherBadge from '../components/WeatherBadge';
import { getProductTripSchema, getFAQSchema } from '../utils/seoSchemas';
import { UPCOMING_TRIPS } from '../constants/mockData';
import { getDestinationWeather, getCurrentSeason } from '../utils/weatherSeasonEngine';

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find trip by ID or fallback to trip 1
  const trip = UPCOMING_TRIPS.find((t) => t.id === parseInt(id)) || UPCOMING_TRIPS[0];
  const weather = trip.weather || getDestinationWeather(trip.location);
  const season = getCurrentSeason();

  const [selectedBatch, setSelectedBatch] = useState(trip.availableBatches[0] || { dates: '15 Sep - 20 Sep, 2026', seatsLeft: 6, status: 'Available' });
  const [occupancy, setOccupancy] = useState('Double Sharing');
  const [travelers, setTravelers] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [openDay, setOpenDay] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  // Pricing calculations based on occupancy
  const getPerPersonPrice = () => {
    if (occupancy === 'Single Sharing') return trip.price + 3500;
    if (occupancy === 'Triple Sharing') return trip.price - 1500;
    return trip.price;
  };

  const perPersonPrice = getPerPersonPrice();
  const totalPrice = perPersonPrice * travelers;
  const monthlyEmi = Math.round(totalPrice / 6);

  const tripFaqs = [
    {
      q: `What is included in the ${trip.title} package price?`,
      a: 'Package includes boutique stay accommodations, private transfers, daily breakfast, certified trip captain guidance, entry passes, and emergency support.'
    },
    {
      q: 'Can I pay a partial advance to confirm my seat?',
      a: 'Yes, you can reserve your seat with a 20% advance payment during checkout or choose our 0% interest No-Cost EMI option.'
    },
    {
      q: 'What is the cancellation & refund policy for this tour?',
      a: 'Cancellations made 15 days prior to departure receive 100% full credit refund or free seat rollover to any future departure date.'
    }
  ];

  const productSchema = getProductTripSchema(trip);
  const faqSchema = getFAQSchema(tripFaqs);
  const combinedSchemas = [productSchema, faqSchema].filter(Boolean);

  const handleProceedToBook = () => {
    navigate('/checkout', {
      state: {
        tripId: trip.id,
        tripTitle: trip.title,
        tripImage: trip.image,
        location: trip.location,
        duration: trip.duration,
        batchDate: selectedBatch.dates,
        occupancy: occupancy,
        travelersCount: travelers,
        perPersonPrice: perPersonPrice,
        totalAmount: totalPrice,
        pickupPoint: trip.pickupPoints?.[0] || 'Airport / Railway Station'
      }
    });
  };

  const openWhatsAppEnquiry = () => {
    const message = encodeURIComponent(`Hi WanderLuxe Captain! I'm interested in booking ${trip.title} (${selectedBatch.dates}). Can you please share details?`);
    window.open(`https://wa.me/918542036499?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-brand-light pt-20 pb-28">
      <SEOHead
        title={trip.seo?.seoTitle || `${trip.title} | Itinerary, Dates & Price`}
        description={trip.seo?.metaDescription || `Book ${trip.title} (${trip.duration}). Prices from ₹${trip.price.toLocaleString()}. Includes boutique stays, transfers, certified captain, and 0% EMI.`}
        canonical={trip.seo?.canonicalUrl || `/trip/${trip.id}`}
        ogImage={trip.seo?.ogImage || trip.image}
        jsonLd={combinedSchemas}
      />

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <img 
              src={trip.gallery?.[lightboxIndex] || trip.image} 
              alt={trip.title} 
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button 
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 text-white p-2 rounded-full bg-white/20 hover:bg-white/30"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-8">
        <Breadcrumbs items={[
          { name: 'Destinations', path: '/destinations' },
          { name: trip.title, path: `/trip/${trip.id}` }
        ]} />

        {/* Title & Location Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-emerald-500/10 text-brand-emerald text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20">
                {trip.tags?.[0] || 'Curated Expedition'}
              </span>
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <MapPin size={13} className="text-brand-emerald" /> {trip.location}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-brand-navy leading-tight">
              {trip.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`p-3 rounded-2xl border transition-all ${
                isLiked 
                  ? 'bg-red-50 border-red-200 text-red-500' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              title="Save to wishlist"
            >
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            </button>

            <button 
              onClick={openWhatsAppEnquiry}
              className="px-5 py-3 rounded-2xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 text-xs font-black flex items-center gap-2 hover:bg-emerald-500/20 transition-all"
            >
              <MessageSquare size={16} /> WhatsApp Captain
            </button>
          </div>
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-3xl overflow-hidden mb-8 h-[380px] md:h-[480px]">
          <div 
            onClick={() => setLightboxIndex(0)}
            className="md:col-span-2 relative group cursor-pointer overflow-hidden bg-slate-200 h-full"
          >
            <img 
              src={trip.image} 
              alt={trip.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          </div>

          <div className="hidden md:grid grid-cols-1 gap-3 md:col-span-1 h-full">
            {(trip.gallery?.slice(1, 3) || [trip.image, trip.image]).map((img, i) => (
              <div 
                key={i} 
                onClick={() => setLightboxIndex(i + 1)}
                className="relative group cursor-pointer overflow-hidden rounded-2xl bg-slate-200 h-full"
              >
                <img 
                  src={img} 
                  alt={`${trip.title} view ${i + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
            ))}
          </div>

          <div className="hidden md:grid grid-cols-1 gap-3 md:col-span-1 h-full">
            {(trip.gallery?.slice(3, 5) || [trip.image]).map((img, i) => (
              <div 
                key={i} 
                onClick={() => setLightboxIndex(i + 3)}
                className="relative group cursor-pointer overflow-hidden rounded-2xl bg-slate-200 h-full"
              >
                <img 
                  src={img} 
                  alt={`${trip.title} view ${i + 3}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                {i === 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-black gap-1.5 backdrop-blur-[2px]">
                    <Camera size={16} /> View Gallery
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Weather & Destination Climate Widget */}
        <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-emerald-950 rounded-3xl p-6 md:p-8 text-white mb-10 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <CloudSun size={32} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">{weather.temp}</span>
                <span className="text-xs text-emerald-300 font-extrabold">{weather.condition}</span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">{weather.vibe}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8 text-center md:text-left w-full md:w-auto justify-between md:justify-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Best Season</span>
              <span className="text-xs font-black text-white">{weather.bestMonths}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Trek Grade</span>
              <span className="text-xs font-black text-white">{trip.grade || 'Moderate'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Altitude</span>
              <span className="text-xs font-black text-white">{trip.altitude || '4,900 ft'}</span>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left 2 Cols: Details Tabs, Itinerary, Inclusions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-gray-200/80 text-center">
                <Clock size={18} className="text-brand-emerald mx-auto mb-1" />
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Duration</span>
                <span className="text-xs font-black text-brand-navy">{trip.duration}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-200/80 text-center">
                <Calendar size={18} className="text-brand-emerald mx-auto mb-1" />
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Next Batch</span>
                <span className="text-xs font-black text-brand-navy">{trip.nextBatch}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-200/80 text-center">
                <Users size={18} className="text-brand-emerald mx-auto mb-1" />
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Age Group</span>
                <span className="text-xs font-black text-brand-navy">{trip.ageGroup || '18 - 35 Years'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-200/80 text-center">
                <Star size={18} className="text-amber-400 fill-amber-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Rating</span>
                <span className="text-xs font-black text-brand-navy">{trip.rating}★ ({trip.reviews})</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 gap-6 text-xs font-black uppercase tracking-wider overflow-x-auto pb-1 scrollbar-none">
              {['overview', 'itinerary', 'inclusions', 'batches'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab 
                      ? 'border-brand-emerald text-brand-emerald' 
                      : 'border-transparent text-gray-400 hover:text-brand-navy'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/80 space-y-4">
                  <h3 className="text-lg font-black text-brand-navy">Expedition Overview</h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                    {trip.overview}
                  </p>
                </div>

                {trip.highlights && (
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/80 space-y-4">
                    <h3 className="text-lg font-black text-brand-navy">Key Highlights</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {trip.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                          <CheckCircle2 size={16} className="text-brand-emerald shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-700 font-bold">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Itinerary */}
            {activeTab === 'itinerary' && (
              <div className="space-y-3">
                {trip.itinerary?.map((item) => (
                  <div key={item.day} className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
                    <button
                      onClick={() => setOpenDay(openDay === item.day ? null : item.day)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-brand-emerald text-white text-xs font-black flex items-center justify-center shrink-0">
                          D{item.day}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-brand-navy">
                          {item.title}
                        </span>
                      </div>
                      {openDay === item.day ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </button>

                    {openDay === item.day && (
                      <div className="p-4 pt-0 text-xs text-gray-600 font-medium leading-relaxed border-t border-gray-100 mt-2">
                        <p className="mb-2">{item.description}</p>
                        {item.meals && (
                          <span className="inline-block bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                            Meals Included: {item.meals}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Inclusions */}
            {activeTab === 'inclusions' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 space-y-4">
                  <div className="flex items-center gap-2 text-brand-emerald font-black text-sm uppercase">
                    <Check size={18} /> Inclusions
                  </div>
                  <ul className="space-y-2.5 text-xs text-gray-600 font-medium">
                    {trip.inclusions?.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={14} className="text-brand-emerald shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 space-y-4">
                  <div className="flex items-center gap-2 text-red-500 font-black text-sm uppercase">
                    <X size={18} /> Exclusions
                  </div>
                  <ul className="space-y-2.5 text-xs text-gray-600 font-medium">
                    {trip.exclusions?.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <X size={14} className="text-red-400 shrink-0 mt-0.5" />
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab: Batches */}
            {activeTab === 'batches' && (
              <div className="space-y-3">
                {trip.availableBatches?.map((batch) => (
                  <div
                    key={batch.id}
                    onClick={() => setSelectedBatch(batch)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedBatch.id === batch.id
                        ? 'border-brand-emerald bg-emerald-50/50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs sm:text-sm font-black text-brand-navy block">
                        {batch.dates}
                      </span>
                      <span className="text-[11px] font-bold text-gray-500">
                        {batch.seatsLeft} seats remaining
                      </span>
                    </div>

                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      batch.status === 'Filling Fast' || batch.status === 'Almost Full'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {batch.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Col: Desktop Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xl space-y-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Starting Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-brand-navy">₹{perPersonPrice.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 font-medium">/person</span>
                  </div>
                </div>
                {trip.originalPrice && (
                  <span className="text-xs font-bold text-gray-400 line-through">
                    ₹{(trip.originalPrice).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Occupancy Selector */}
              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                  Room Occupancy
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Double Sharing', 'Triple Sharing', 'Single Sharing'].map((occ) => (
                    <button
                      key={occ}
                      onClick={() => setOccupancy(occ)}
                      className={`p-2 rounded-xl text-[11px] font-bold transition-all ${
                        occupancy === occ
                          ? 'bg-brand-navy text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {occ.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travelers Count */}
              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                  Number of Travelers
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setTravelers(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                        travelers === num
                          ? 'bg-brand-emerald text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Calculation Strip */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-600">
                  <span>Selected Departure</span>
                  <span className="text-brand-navy">{selectedBatch.dates.split(',')[0]}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-600">
                  <span>Payable Total</span>
                  <span className="text-base font-black text-brand-navy">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-emerald-600 pt-1 border-t border-gray-200">
                  <span>EMI Available</span>
                  <span>From ₹{monthlyEmi.toLocaleString()}/mo</span>
                </div>
              </div>

              {/* Book Now Button */}
              <button
                onClick={handleProceedToBook}
                className="w-full py-4 bg-brand-emerald hover:bg-brand-teal transition-all text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-brand-emerald/25 flex items-center justify-center gap-2"
              >
                <span>Proceed to Reserve</span>
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 font-medium">
                <ShieldCheck size={14} className="text-brand-emerald" /> 100% Refund Guarantee (15 Days Prior)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Mobile Bottom Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4 z-40 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Price ({travelers} Traveler)</span>
          <span className="text-lg font-black text-brand-navy">₹{totalPrice.toLocaleString()}</span>
        </div>

        <button
          onClick={handleProceedToBook}
          className="px-6 py-3 bg-brand-emerald text-white text-xs font-black rounded-2xl shadow-md shadow-brand-emerald/25 flex items-center gap-1.5"
        >
          <span>Book Now</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default TripDetails;
