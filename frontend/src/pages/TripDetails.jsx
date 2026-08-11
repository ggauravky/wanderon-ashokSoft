import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Star, Calendar, Users, ShieldCheck, Check, X, 
  ChevronDown, ChevronUp, Share2, Heart, Info, ArrowRight, Compass,
  Sparkles, Camera, PhoneCall, HelpCircle, MessageSquare
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { getProductTripSchema, getFAQSchema } from '../utils/seoSchemas';
import { UPCOMING_TRIPS } from '../constants/mockData';

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find trip by ID or fallback to trip 1
  const trip = UPCOMING_TRIPS.find((t) => t.id === parseInt(id)) || UPCOMING_TRIPS[0];

  const [selectedBatch, setSelectedBatch] = useState(trip.availableBatches[0]);
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
    <div className="min-h-screen bg-brand-light pt-20 pb-24">
      <SEOHead
        title={`${trip.title} | Itinerary, Dates & Price`}
        description={`Book ${trip.title} (${trip.duration}). Prices from ₹${trip.price.toLocaleString()}. Includes boutique stays, transfers, certified captain, and 0% EMI.`}
        canonical={`/trip/${trip.id}`}
        ogImage={trip.image}
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
            <button 
              className="absolute top-6 right-6 text-white p-3 rounded-full bg-white/10 hover:bg-white/20"
              onClick={() => setLightboxIndex(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={trip.gallery?.[lightboxIndex] || trip.image} 
              alt={`${trip.title} full view photo ${lightboxIndex + 1}`} 
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-8">
        {/* Breadcrumbs Navigation */}
        <div className="my-4">
          <Breadcrumbs
            items={[
              { name: 'Destinations', path: '/destinations' },
              { name: trip.shortTitle || trip.title, path: `/trip/${trip.id}` }
            ]}
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {trip.tags?.map((tag) => (
                <span key={tag} className="bg-brand-emerald/10 text-brand-emerald text-xs font-bold px-3 py-1 rounded-full border border-brand-emerald/20">
                  {tag}
                </span>
              ))}
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star size={14} fill="currentColor" /> {trip.rating} ({trip.reviews} reviews)
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-brand-navy leading-tight mb-2">
              {trip.title}
            </h1>
            <p className="flex items-center gap-2 text-gray-600 text-sm font-medium">
              <MapPin size={18} className="text-brand-emerald" /> {trip.location}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`p-3 rounded-full border transition-all ${
                isLiked ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={openWhatsAppEnquiry}
              className="p-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center gap-2 text-xs font-bold px-4"
            >
              <MessageSquare size={18} /> Chat Captain
            </button>
          </div>
        </div>

        {/* Media Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-3xl overflow-hidden mb-10 shadow-xl border border-gray-200/60">
          <div 
            className="md:col-span-2 h-[320px] md:h-[420px] relative group cursor-pointer overflow-hidden"
            onClick={() => setLightboxIndex(0)}
          >
            <img 
              src={trip.gallery?.[0] || trip.image} 
              alt={`${trip.title} hero photograph`} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Camera size={14} /> View All Photos
            </div>
          </div>
          <div className="hidden md:grid col-span-2 grid-cols-2 gap-3">
            {(trip.gallery?.slice(1, 4) || [trip.image, trip.image, trip.image]).map((img, idx) => (
              <div 
                key={idx} 
                className="h-[203px] relative group cursor-pointer overflow-hidden rounded-xl"
                onClick={() => setLightboxIndex(idx + 1)}
              >
                <img 
                  src={img} 
                  alt={`${trip.title} gallery view ${idx + 2}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Attributes Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 mb-10 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="border-r border-gray-100 last:border-none">
            <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Duration</span>
            <span className="text-base font-bold text-brand-navy flex items-center justify-center gap-1">
              <Clock size={16} className="text-brand-emerald" /> {trip.duration}
            </span>
          </div>
          <div className="border-r border-gray-100 last:border-none">
            <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Grade</span>
            <span className="text-base font-bold text-brand-navy">{trip.grade || 'Moderate'}</span>
          </div>
          <div className="border-r border-gray-100 last:border-none">
            <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Altitude</span>
            <span className="text-base font-bold text-brand-navy">{trip.altitude || 'As Specified'}</span>
          </div>
          <div className="border-r border-gray-100 last:border-none">
            <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Age Group</span>
            <span className="text-base font-bold text-brand-navy">{trip.ageGroup || '18 - 35 Yrs'}</span>
          </div>
          <div className="col-span-2 md:col-span-1">
            <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Starting Point</span>
            <span className="text-base font-bold text-brand-navy truncate block">{trip.startingPoint || 'Guwahati'}</span>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Details & Accordions */}
          <div className="lg:col-span-2 space-y-10">
            {/* Sticky Navigation Tabs */}
            <div className="sticky top-20 z-30 bg-white/90 backdrop-blur-md rounded-2xl p-2 border border-gray-200/80 shadow-md flex items-center justify-between gap-1 overflow-x-auto">
              {['overview', 'itinerary', 'inclusions', 'batches', 'faqs'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold capitalize transition-all whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-brand-emerald text-white shadow-md shadow-brand-emerald/30' 
                      : 'text-gray-600 hover:text-brand-navy hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Section */}
            <section id="overview" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80">
              <h2 className="text-2xl font-bold text-brand-navy mb-4">Trip Overview</h2>
              <p className="text-gray-600 leading-relaxed mb-6 font-medium text-sm md:text-base">
                {trip.overview}
              </p>

              <h3 className="text-lg font-bold text-brand-navy mb-3">Key Highlights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trip.highlights?.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-2xl bg-brand-light text-brand-navy text-sm font-semibold">
                    <Sparkles size={18} className="text-brand-emerald shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Day-by-Day Itinerary Section */}
            <section id="itinerary" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-brand-navy">Detailed Itinerary</h2>
                  <p className="text-xs text-gray-500">Day by day breakdown of your expedition</p>
                </div>
                <button 
                  onClick={() => setOpenDay(openDay === null ? 1 : null)}
                  className="text-xs font-bold text-brand-emerald hover:underline"
                >
                  {openDay === null ? 'Expand Day 1' : 'Collapse All'}
                </button>
              </div>

              <div className="space-y-4">
                {trip.itinerary?.map((day) => {
                  const isOpen = openDay === day.day;
                  return (
                    <div 
                      key={day.day} 
                      className={`border rounded-2xl transition-all overflow-hidden ${
                        isOpen ? 'border-brand-emerald bg-brand-emerald/5 shadow-md' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => setOpenDay(isOpen ? null : day.day)}
                        className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-brand-navy"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-brand-navy text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                            Day {day.day}
                          </span>
                          <span className="text-base">{day.title}</span>
                        </div>
                        {isOpen ? <ChevronUp size={20} className="text-brand-emerald" /> : <ChevronDown size={20} className="text-gray-400" />}
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-5 pb-5 pt-1 text-sm text-gray-600 border-t border-brand-emerald/20"
                          >
                            <p className="leading-relaxed mb-4">{day.description}</p>
                            {day.meals && (
                              <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-navy bg-white px-3 py-1.5 rounded-full border border-gray-200">
                                🍽️ Included Meals: <span className="text-brand-emerald">{day.meals}</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Inclusions vs Exclusions */}
            <section id="inclusions" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80">
              <h2 className="text-2xl font-bold text-brand-navy mb-6">Inclusions & Exclusions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inclusions */}
                <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
                  <h3 className="text-base font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <Check size={20} className="text-emerald-600" /> What's Included
                  </h3>
                  <ul className="space-y-3 text-xs md:text-sm text-emerald-950 font-medium">
                    {trip.inclusions?.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exclusions */}
                <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100">
                  <h3 className="text-base font-bold text-rose-900 mb-4 flex items-center gap-2">
                    <X size={20} className="text-rose-600" /> What's Excluded
                  </h3>
                  <ul className="space-y-3 text-xs md:text-sm text-rose-950 font-medium">
                    {trip.exclusions?.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-2" />
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Package FAQs Section */}
            <section id="faqs" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80 space-y-4">
              <h2 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
                <HelpCircle size={22} className="text-brand-emerald" /> Package FAQs & Policies
              </h2>
              <div className="space-y-3 text-xs md:text-sm">
                {tripFaqs.map((faq, i) => (
                  <div key={i} className="p-4 bg-brand-light rounded-2xl border border-gray-200">
                    <h3 className="font-extrabold text-brand-navy mb-1">{faq.q}</h3>
                    <p className="text-gray-600 font-medium">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-200 space-y-6">
              <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Starting From</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-brand-navy">₹{perPersonPrice.toLocaleString()}</span>
                    {trip.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">₹{trip.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  Save ₹{(trip.originalPrice - perPersonPrice).toLocaleString()}
                </span>
              </div>

              {/* No-Cost EMI Badge */}
              <div className="bg-brand-emerald/10 border border-brand-emerald/30 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-brand-navy">
                <span>Or Easy EMI from</span>
                <span className="text-brand-emerald font-extrabold">₹{monthlyEmi.toLocaleString()}/mo (6 mos)</span>
              </div>

              {/* Step 1: Select Batch */}
              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>1. Select Departure Batch</span>
                  <span className="text-brand-emerald font-semibold">{selectedBatch.status}</span>
                </label>
                <div className="space-y-2">
                  {trip.availableBatches.map((batch) => (
                    <button
                      key={batch.id}
                      onClick={() => setSelectedBatch(batch)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all text-xs font-bold ${
                        selectedBatch.id === batch.id
                          ? 'border-brand-emerald bg-brand-emerald/10 text-brand-navy shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-brand-emerald" />
                        <span>{batch.dates}</span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-semibold bg-white px-2 py-0.5 rounded-full border border-gray-200">
                        {batch.seatsLeft} seats left
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Occupancy Type */}
              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">
                  2. Choose Occupancy Option
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'Double Sharing', label: 'Double', tag: 'Standard' },
                    { type: 'Triple Sharing', label: 'Triple', tag: '-₹1.5k' },
                    { type: 'Single Sharing', label: 'Single', tag: '+₹3.5k' }
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => setOccupancy(item.type)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center justify-center ${
                        occupancy === item.type
                          ? 'border-brand-emerald bg-brand-navy text-white shadow-md'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className={`text-[10px] mt-0.5 ${occupancy === item.type ? 'text-brand-emerald' : 'text-gray-400'}`}>
                        {item.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Traveler Counter */}
              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">
                  3. Number of Travelers
                </label>
                <div className="flex items-center justify-between bg-brand-light p-3 rounded-2xl border border-gray-200">
                  <span className="text-sm font-bold text-brand-navy">Adults (12+ yrs)</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTravelers(Math.max(1, travelers - 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-300 font-bold text-brand-navy flex items-center justify-center hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-brand-navy text-base w-4 text-center">{travelers}</span>
                    <button
                      onClick={() => setTravelers(Math.min(selectedBatch.seatsLeft, travelers + 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-300 font-bold text-brand-navy flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="bg-brand-navy/5 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Base fare ({travelers} x ₹{perPersonPrice.toLocaleString()})</span>
                  <span className="font-bold text-brand-navy">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes & GST (5%)</span>
                  <span className="font-bold text-emerald-600">Included</span>
                </div>
                <hr className="border-gray-200 my-1" />
                <div className="flex justify-between text-sm font-extrabold text-brand-navy">
                  <span>Total Amount</span>
                  <span className="text-brand-emerald text-lg">₹{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleProceedToBook}
                  className="w-full py-4 bg-brand-emerald text-white rounded-2xl font-extrabold text-base hover:bg-brand-teal transition-all shadow-xl shadow-brand-emerald/20 flex items-center justify-center gap-2 group"
                >
                  Proceed to Book <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={openWhatsAppEnquiry}
                  className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl font-extrabold text-xs hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} /> Chat Captain on WhatsApp
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 font-semibold pt-2">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-brand-emerald" /> 100% Refundable
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle size={14} className="text-brand-emerald" /> Instant E-Vouchers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
