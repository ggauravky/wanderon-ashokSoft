import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Star, Calendar, Users, ShieldCheck, Check, X, 
  ChevronDown, ChevronUp, Share2, Heart, Info, ArrowRight, Compass,
  Sparkles, Camera, PhoneCall, HelpCircle, MessageSquare, CloudSun,
  Award, CheckCircle2, ShieldAlert, Luggage, BedDouble, Utensils, Bus
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import WeatherBadge from '../components/WeatherBadge';
import TripCard from '../components/TripCard';
import AIPlannerModal from '../components/AIPlannerModal';
import { getProductTripSchema, getFAQSchema } from '../utils/seoSchemas';
import { UPCOMING_TRIPS } from '../constants/mockData';
import { getDestinationWeather, getCurrentSeason } from '../utils/weatherSeasonEngine';
import { recordTripView, toggleWishlistItem, getWishlistIds } from '../utils/userHistory';

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find trip by ID or fallback to trip 1
  const trip = UPCOMING_TRIPS.find((t) => t.id === parseInt(id)) || UPCOMING_TRIPS[0];
  const weather = trip.weather || getDestinationWeather(trip.location);
  const season = getCurrentSeason();

  const [selectedBatch, setSelectedBatch] = useState(trip.availableBatches?.[0] || { dates: '15 Sep - 20 Sep, 2026', seatsLeft: 6, status: 'Available' });
  const [occupancy, setOccupancy] = useState('Double Sharing');
  const [travelers, setTravelers] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [openDay, setOpenDay] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);

  // Record Trip View in Local History and check Wishlist status
  useEffect(() => {
    recordTripView(trip);
    const wishlist = getWishlistIds();
    setIsLiked(wishlist.includes(trip.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [trip.id]);

  const handleToggleWishlist = () => {
    const updated = toggleWishlistItem(trip.id);
    setIsLiked(updated.includes(trip.id));
  };

  // Pricing calculations based on occupancy
  const getPerPersonPrice = () => {
    if (occupancy === 'Single Sharing') return trip.price + 3500;
    if (occupancy === 'Triple Sharing') return trip.price - 1500;
    return trip.price;
  };

  const perPersonPrice = getPerPersonPrice();
  const totalPrice = perPersonPrice * travelers;
  const monthlyEmi = Math.round(totalPrice / 6);

  // Similar Trips (excluding current trip)
  const similarTrips = UPCOMING_TRIPS.filter((t) => t.id !== trip.id).slice(0, 3);

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

  const handleProceedToBooking = () => {
    navigate('/checkout', {
      state: {
        tripId: trip.id,
        tripTitle: trip.title,
        tripImage: trip.image,
        location: trip.location,
        duration: trip.duration,
        batchDates: selectedBatch.dates,
        occupancy: occupancy,
        travelersCount: travelers,
        pricePerPerson: perPersonPrice,
        totalAmount: totalPrice
      }
    });
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <SEOHead
        title={`${trip.title} (${trip.duration}) - ${trip.location} | WanderLuxe Group Expeditions`}
        description={`Book official verified group tour package for ${trip.title}. Daily itinerary, boutique stays, certified captains, transparent pricing with 0% EMI.`}
        canonical={`/trip/${trip.id}`}
        ogImage={trip.image}
        jsonLd={[productSchema, faqSchema]}
      />

      {/* AI Planner Modal */}
      <AIPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        initialDestination={trip.location.split(',')[0]}
      />

      {/* Lightbox for Gallery Photos */}
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
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
            <img
              src={trip.gallery[lightboxIndex]}
              alt={`${trip.title} enlarged photo gallery view`}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-8">
        <Breadcrumbs
          items={[
            { name: 'Destinations', path: '/destinations' },
            { name: trip.location, path: '/destinations' },
            { name: trip.title, path: `/trip/${trip.id}` }
          ]}
        />

        {/* Trip Title & Quick Metadata Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1 rounded-full uppercase border border-emerald-200">
                {trip.category || 'Curated Expedition'}
              </span>
              <WeatherBadge weather={weather} size="sm" />
              {trip.trending && (
                <span className="bg-amber-500/10 text-amber-600 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-300">
                  <Award size={12} /> Best Seller
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
              {trip.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 mt-2">
              <span className="flex items-center gap-1"><MapPin size={14} className="text-emerald-500" /> {trip.location}</span>
              <span className="flex items-center gap-1"><Clock size={14} className="text-emerald-500" /> {trip.duration}</span>
              <span className="flex items-center gap-1 text-amber-500"><Star size={14} fill="currentColor" /> {trip.rating} ({trip.reviews} Verified Reviews)</span>
            </div>
          </div>

          {/* Social Share, Wishlist & AI Customizer Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlannerOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
              title="Customize with AI Planner"
            >
              <Sparkles size={14} className="text-emerald-400" /> Customize with AI
            </button>

            <button
              onClick={handleToggleWishlist}
              className={`p-2.5 rounded-2xl border transition-colors flex items-center gap-1.5 text-xs font-bold ${
                isLiked
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{isLiked ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: trip.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Trip link copied to clipboard!');
                }
              }}
              className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Hero Photo Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-10 h-[380px] md:h-[460px] rounded-3xl overflow-hidden shadow-md">
          <div
            onClick={() => setLightboxIndex(0)}
            className="md:col-span-2 h-full relative group cursor-pointer overflow-hidden"
          >
            <img
              src={trip.image}
              alt={`${trip.title} primary destination view`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-end p-6">
              <span className="bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1">
                <Camera size={13} /> View 4 Photos
              </span>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-2 col-span-2 gap-3 h-full">
            {trip.gallery.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="relative group cursor-pointer overflow-hidden rounded-2xl"
              >
                <img
                  src={img}
                  alt={`${trip.title} gallery photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Layout (Left: Detailed Info, Right: Sticky Booking Widget) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Itinerary, Stays, Highlights, FAQs */}
          <div className="lg:col-span-2 space-y-10">
            {/* Live Weather Forecast Card for this Trip */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CloudSun size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Destination Climate</span>
                  <h3 className="text-base font-black text-slate-900">{weather.temp} • {weather.condition}</h3>
                  <p className="text-xs text-slate-500 font-medium">{weather.advice}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPlannerOpen(true)}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black transition-all border border-emerald-200 shrink-0 flex items-center gap-1"
              >
                <Sparkles size={13} /> Custom AI Plan
              </button>
            </div>

            {/* Trip Highlights Grid */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80">
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <Award className="text-emerald-500" size={22} /> Tour Highlights & Experiences
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {trip.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-slate-700 leading-snug">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day-by-Day Expandable Itinerary */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Day-by-Day Expedition Itinerary</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Carefully structured by certified captains for smooth acclimatization and photography.</p>
                </div>
              </div>

              <div className="space-y-3">
                {trip.itinerary.map((dayItem) => (
                  <div key={dayItem.day} className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all bg-slate-50/50">
                    <button
                      onClick={() => setOpenDay(openDay === dayItem.day ? null : dayItem.day)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                          D{dayItem.day}
                        </span>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900">{dayItem.title}</h3>
                      </div>
                      {openDay === dayItem.day ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </button>

                    {openDay === dayItem.day && (
                      <div className="p-4 pt-0 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-200/60 mt-1">
                        <p className="pt-2">{dayItem.desc}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="flex items-center gap-1 font-bold text-slate-700"><BedDouble size={13} className="text-emerald-500" /> Boutique Resort</span>
                          <span className="flex items-center gap-1 font-bold text-slate-700"><Utensils size={13} className="text-emerald-500" /> Breakfast Included</span>
                          <span className="flex items-center gap-1 font-bold text-slate-700"><Bus size={13} className="text-emerald-500" /> Private Traveler</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" /> What's Included
                </h3>
                <ul className="space-y-2 text-xs font-semibold text-slate-600">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Accommodation in handpicked stays</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Daily organic breakfast & dinner</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> AC Tempo Traveler transfers</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Certified WanderLuxe Captain</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> All entry permits & toll taxes</li>
                </ul>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-500" /> What's Excluded
                </h3>
                <ul className="space-y-2 text-xs font-semibold text-slate-600">
                  <li className="flex items-center gap-2"><X size={14} className="text-rose-500" /> Flights / train tickets to pickup city</li>
                  <li className="flex items-center gap-2"><X size={14} className="text-rose-500" /> Personal expenses and lunch</li>
                  <li className="flex items-center gap-2"><X size={14} className="text-rose-500" /> Optional extreme watersports & cliff diving</li>
                  <li className="flex items-center gap-2"><X size={14} className="text-rose-500" /> Camera permit fees where applicable</li>
                </ul>
              </div>
            </div>

            {/* Trip FAQs */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <HelpCircle size={22} className="text-emerald-500" /> Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {tripFaqs.map((faq, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <h4 className="text-xs font-black text-slate-900 mb-1">{faq.q}</h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Expeditions Row */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-black text-slate-900">Similar Expeditions You Might Love</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {similarTrips.map((sTrip) => (
                  <TripCard key={sTrip.id} trip={sTrip} showWeather={false} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Desktop Sticky Booking Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Per Person Pricing</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900">₹{perPersonPrice.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 line-through">₹{(perPersonPrice + 3500).toLocaleString()}</span>
                  <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Save ₹3,500</span>
                </div>
                <span className="text-xs text-slate-500 font-medium block mt-1">or from ₹{monthlyEmi.toLocaleString()}/mo with 0% No-Cost EMI</span>
              </div>

              {/* Select Departure Batch */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Select Batch Date</label>
                <div className="space-y-2">
                  {trip.availableBatches?.map((batch, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedBatch(batch)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                        selectedBatch.dates === batch.dates
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-black'
                          : 'border-slate-200 hover:border-slate-300 font-semibold text-slate-700'
                      }`}
                    >
                      <span>{batch.dates}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{batch.seatsLeft} Seats Left</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Occupancy Selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Room Occupancy</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Single Sharing', 'Double Sharing', 'Triple Sharing'].map((occ) => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setOccupancy(occ)}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                        occupancy === occ
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {occ.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travelers Counter */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Number of Travelers</label>
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-bold text-slate-700">{travelers} Traveler(s)</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTravelers(Math.max(1, travelers - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="text-xs font-black text-slate-900 w-4 text-center">{travelers}</span>
                    <button
                      type="button"
                      onClick={() => setTravelers(Math.min(10, travelers + 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase">Total Payable</span>
                <span className="text-2xl font-black text-slate-900">₹{totalPrice.toLocaleString()}</span>
              </div>

              {/* Booking CTA Button */}
              <button
                onClick={handleProceedToBooking}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                Proceed to Book Seat <ArrowRight size={16} />
              </button>

              <div className="text-[11px] text-slate-400 space-y-1.5 text-center font-medium">
                <p className="flex items-center justify-center gap-1"><ShieldCheck size={14} className="text-emerald-500" /> Instant QR Pass Generation</p>
                <p>100% Refund Guarantee 15 Days Before Departure</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
