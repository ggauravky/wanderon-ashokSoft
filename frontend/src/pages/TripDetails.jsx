import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Star, Calendar, Users, ShieldCheck, Check, X, 
  ChevronDown, ChevronUp, Share2, Heart, Info, ArrowRight, Compass,
  Sparkles, Camera, PhoneCall, HelpCircle, MessageSquare, CloudSun,
  Award, CheckCircle2, ShieldAlert, Luggage, BedDouble, Utensils, Bus,
  Sun, CheckSquare, Square, Backpack, ThumbsUp
} from 'lucide-react';
import SEOHead from '../components/SEOHead.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import WeatherBadge from '../components/WeatherBadge.jsx';
import TripCard from '../components/TripCard.jsx';
import AIPlannerModal from '../components/AIPlannerModal.jsx';
import RequestCallbackModal from '../components/RequestCallbackModal.jsx';
import ItineraryDayGallery from '../components/ItineraryDayGallery.jsx';
import { getProductTripSchema, getFAQSchema } from '../utils/seoSchemas.js';
import { UPCOMING_TRIPS } from '../constants/mockData.js';
import * as travelKnowledgeService from '../services/travelKnowledgeService.js';
import { getDestinationWeather, getCurrentSeason } from '../utils/weatherSeasonEngine.js';
import { recordTripView, toggleWishlistItem, getWishlistIds } from '../utils/userHistory.js';
import { generatePackingChecklist, getTripPersonaBadges, getWhyVisitNow } from '../utils/travelContextEngine.js';

const getAllStaticTrips = () => {
  if (typeof travelKnowledgeService.getAllStaticTrips === 'function') {
    return travelKnowledgeService.getAllStaticTrips();
  }
  if (typeof travelKnowledgeService.default?.getAllStaticTrips === 'function') {
    return travelKnowledgeService.default.getAllStaticTrips();
  }
  return UPCOMING_TRIPS || [];
};

const normalizeTripObject = (t) => {
  if (typeof travelKnowledgeService.normalizeTripObject === 'function') {
    return travelKnowledgeService.normalizeTripObject(t);
  }
  if (typeof travelKnowledgeService.default?.normalizeTripObject === 'function') {
    return travelKnowledgeService.default.normalizeTripObject(t);
  }
  return t;
};

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find trip from static catalog or initialize
  const [trip, setTrip] = useState(() => {
    const staticList = typeof getAllStaticTrips === 'function' ? getAllStaticTrips() : (UPCOMING_TRIPS || []).map(t => typeof normalizeTripObject === 'function' ? normalizeTripObject(t) : t);
    const found = (staticList || []).find(
      (t) => String(t.id) === String(id) || String(t._id) === String(id) || t.slug === id || t.id === parseInt(id)
    );
    const resolved = found || (staticList && staticList[0]) || (typeof normalizeTripObject === 'function' ? normalizeTripObject(UPCOMING_TRIPS[0]) : UPCOMING_TRIPS[0]);
    return typeof normalizeTripObject === 'function' ? normalizeTripObject(resolved) : resolved;
  });

  // Fetch live trip from backend if it was created in Admin
  useEffect(() => {
    const fetchLiveTrip = async () => {
      if (!id) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/trips/${id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const normalized = typeof normalizeTripObject === 'function' ? normalizeTripObject(json.data) : json.data;
            setTrip(normalized);
          }
        }
      } catch (err) {
        // Fallback to static catalog already in state
      }
    };
    fetchLiveTrip();
  }, [id]);

  const weather = trip?.weather || (trip?.location ? getDestinationWeather(trip.location) : (trip?.destination ? getDestinationWeather(trip.destination) : getDestinationWeather('meghalaya')));
  const season = getCurrentSeason ? getCurrentSeason() : { name: 'Autumn', weatherAdvice: 'Pleasant season' };

  const [selectedBatch, setSelectedBatch] = useState(
    trip?.availableBatches?.[0] || { dates: trip?.nextBatch || '15 Sep - 20 Sep, 2026', seatsLeft: 6, status: 'Available' }
  );

  useEffect(() => {
    if (trip?.availableBatches && trip.availableBatches.length > 0) {
      setSelectedBatch(trip.availableBatches[0]);
    }
  }, [trip]);

  const [occupancy, setOccupancy] = useState('Double Sharing');
  const [travelers, setTravelers] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [openDay, setOpenDay] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);

  // Contextual Helpers
  const whyVisitNow = getWhyVisitNow(trip, season, weather);
  const personaBadges = getTripPersonaBadges(trip);

  // Interactive Packing Checklist state (persisted per trip)
  const defaultChecklist = generatePackingChecklist(trip, weather, season);
  const tripKey = trip.id || trip._id || trip.slug;
  const [packingList, setPackingList] = useState(() => {
    try {
      const saved = localStorage.getItem(`wanderluxe_packing_${tripKey}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Ignored
    }
    return defaultChecklist;
  });

  // Record Trip View in Local History and check Wishlist status
  useEffect(() => {
    recordTripView(trip);
    const wishlist = getWishlistIds();
    setIsLiked(wishlist.some(wId => String(wId) === String(tripKey)));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const saved = localStorage.getItem(`wanderluxe_packing_${tripKey}`);
      if (saved) setPackingList(JSON.parse(saved));
      else setPackingList(generatePackingChecklist(trip, weather, season));
    } catch (e) {
      setPackingList(generatePackingChecklist(trip, weather, season));
    }
  }, [tripKey]);

  const handleTogglePackingItem = (itemId) => {
    const updated = packingList.map((item) =>
      item.id === itemId ? { ...item, defaultChecked: !item.defaultChecked } : item
    );
    setPackingList(updated);
    try {
      localStorage.setItem(`wanderluxe_packing_${trip.id}`, JSON.stringify(updated));
    } catch (e) {
      // Ignored
    }
  };

  const packedCount = packingList.filter((item) => item.defaultChecked).length;
  const totalPackingCount = packingList.length;

  const handleToggleWishlist = () => {
    const updated = toggleWishlistItem(trip.id);
    setIsLiked(updated.includes(trip.id));
  };

  // Pricing calculations based on occupancy — reads sharingPricing from trip if available
  const getPerPersonPrice = () => {
    const sp = trip.sharingPricing || selectedBatch?.pricing || {};
    if (occupancy === 'Single Sharing') {
      return Number(sp.singleSharing) || (Number(trip.price) + 3500);
    }
    if (occupancy === 'Triple Sharing') {
      return Number(sp.tripleSharing) || Math.max(1000, Number(trip.price) - 1500);
    }
    // Double Sharing (default)
    return Number(sp.doubleSharing) || Number(trip.price);
  };

  const perPersonPrice = getPerPersonPrice();
  const totalPrice = perPersonPrice * travelers;
  const monthlyEmi = Math.round(totalPrice / 6);

  // Similar Trips (excluding current trip)
  const similarTrips = UPCOMING_TRIPS.filter((t) => t.id !== trip.id && (t.category === trip.category || t.destination === trip.destination)).slice(0, 3);
  const fallbackSimilarTrips = similarTrips.length > 0 ? similarTrips : UPCOMING_TRIPS.filter((t) => t.id !== trip.id).slice(0, 3);

  const tripFaqs = [
    {
      q: `What is included in the ${trip.title} package price?`,
      a: 'Package includes boutique stay accommodations, private transfers, daily breakfast, certified trip captain guidance, entry passes, and emergency support.'
    },
    {
      q: 'Can I pay a partial advance to confirm my seat?',
      a: 'Yes, you can reserve your seat with just a 10% advance deposit during checkout. The 90% balance is due within 6 days of booking.'
    },
    {
      q: 'What is the cancellation & refund policy for this tour?',
      a: 'Cancellations made 15 days prior to departure receive 100% full credit refund or free seat rollover to any future departure date.'
    }
  ];

  const productSchema = getProductTripSchema(trip);
  const faqSchema = getFAQSchema(tripFaqs);

  const handleProceedToBooking = () => {
    navigate(`/book/${trip.slug || trip.id}`, {
      state: {
        tripId: trip.id,
        tripSlug: trip.slug,
        tripTitle: trip.title,
        tripImage: trip.image,
        location: trip.location,
        destination: trip.destination,
        duration: trip.duration,
        initialBatch: selectedBatch?.dates,
        initialOccupancy: occupancy,
        initialTravelers: travelers,
        trip
      }
    });
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-32 lg:pb-24">
      <SEOHead
        title={`${trip?.title || 'Expedition'} (${trip?.duration || '5D/4N'}) - ${trip?.location || trip?.destination || 'India'} | WanderLuxe Group Expeditions`}
        description={`Book official verified group tour package for ${trip?.title || 'Curated Expedition'}. Daily itinerary, boutique stays, certified captains, transparent pricing with 0% EMI.`}
        canonical={`/trip/${trip?.slug || trip?.id || id}`}
        ogImage={trip?.image || ''}
        jsonLd={[productSchema, faqSchema]}
      />

      {/* AI Planner Modal */}
      <AIPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        initialDestination={trip?.location ? trip.location.split(',')[0] : (trip?.destination || 'Meghalaya')}
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
              className="absolute top-6 right-6 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
            >
              <X size={24} />
            </button>
            <img
              src={trip?.gallery && trip.gallery[lightboxIndex] ? trip.gallery[lightboxIndex] : (trip?.image || '')}
              alt="Expanded high-resolution view"
              className="max-w-4xl max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="travel-container">
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Destinations', path: '/destinations' },
            { label: trip?.location ? trip.location.split(',')[0] : (trip?.destination || 'Destination'), path: '/destinations' },
            { label: trip?.title || 'Trip Details', path: null }
          ]}
        />

        {/* Hero Header Area */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-8 mt-4">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-slate-900 text-white text-xs font-black uppercase px-3 py-1 rounded-full">
                {trip.category || 'Group Tour'}
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck size={14} /> Certified Captain Led
              </span>
              <WeatherBadge weather={weather} size="sm" showCondition={true} />
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              {trip.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-600 font-semibold">
              <span className="flex items-center gap-1 text-emerald-600">
                <MapPin size={16} /> {trip.location}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock size={16} /> {trip.duration}
              </span>
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <Star size={16} fill="currentColor" /> {trip.rating || 4.9} ({trip.reviews || 24} reviews)
              </span>
            </div>
          </div>

          {/* Action Buttons: Wishlist & AI Customizer */}
          <div className="flex items-center gap-3 self-start lg:self-end">
            <button
              onClick={() => setIsPlannerOpen(true)}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl text-xs font-black transition-all border border-emerald-200 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Sparkles size={15} /> Customize with AI
            </button>

            <button
              onClick={handleToggleWishlist}
              className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer ${
                isLiked
                  ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart size={16} className={isLiked ? 'fill-rose-600' : ''} />
              <span>{isLiked ? 'Saved' : 'Wishlist'}</span>
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8 h-[380px] md:h-[480px]">
          <div
            onClick={() => setLightboxIndex(0)}
            className="md:col-span-2 md:row-span-2 rounded-3xl overflow-hidden cursor-pointer relative group bg-slate-200"
          >
            <img
              src={trip.image}
              alt={`${trip.title} primary hero landscape view`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            <span className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-xs font-black px-3 py-1.5 rounded-xl">
              View High-Res Photo (1/{trip.gallery ? trip.gallery.length : 1})
            </span>
          </div>

          {(trip.gallery ? trip.gallery.slice(1, 5) : [trip.image, trip.image, trip.image, trip.image]).map((img, idx) => (
            <div
              key={idx}
              onClick={() => setLightboxIndex(idx + 1)}
              className="rounded-3xl overflow-hidden cursor-pointer relative group bg-slate-200"
            >
              <img
                src={img}
                alt={`${trip.title} gallery thumbnail photo ${idx + 2}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            </div>
          ))}
        </div>

        {/* Sticky Section Navigation Header */}
        <div className="sticky top-16 z-30 mb-8 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'itinerary', label: 'Day-by-Day Itinerary' },
            { id: 'packing', label: 'Packing Assistant' },
            { id: 'inclusions', label: 'Inclusions & Exclusions' },
            { id: 'faqs', label: 'Trip FAQs' }
          ].map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              {sec.label}
            </a>
          ))}
        </div>

        {/* "Why Visit Now?" Contextual Banner */}
        <div id="overview" className="mb-10 bg-gradient-to-r from-slate-900 to-emerald-950 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-400/30 inline-flex items-center gap-1">
              <Sparkles size={12} /> Seasonal & Climate Intelligence
            </span>
            <h3 className="text-xl font-black">{whyVisitNow.title}</h3>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
              {whyVisitNow.reason}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20 text-center shrink-0 w-full md:w-auto">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Current Climate</span>
            <div className="text-2xl font-black text-emerald-300 mt-0.5">{weather.temp}</div>
            <span className="text-[11px] font-medium text-slate-200">{weather.condition}</span>
          </div>
        </div>

        {/* Main Content Layout: Left Details vs Right Booking Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Itinerary, Persona, Packing List, Inclusions */}
          <div className="lg:col-span-2 space-y-10">
            {/* "Who is this trip for?" Personas */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block mb-2">
                Traveler Profile
              </span>
              <h3 className="text-lg font-black text-slate-900 mb-4">Who is this expedition perfect for?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {personaBadges.map((p) => (
                  <div key={p.label} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 text-emerald-600 mb-1">
                      <ThumbsUp size={14} /> {p.label}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Trip Highlights Grid */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900">Expedition Overview</h3>
              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                {trip.overview || 'Experience an unforgettable group departure with like-minded travelers, scenic mountain homestays, verified guides, and certified safety equipment.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting Point</span>
                  <span className="text-xs font-black text-slate-900">{trip.startingPoint || 'Delhi / Guwahati'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Ending Point</span>
                  <span className="text-xs font-black text-slate-900">{trip.endingPoint || 'Delhi / Guwahati'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Difficulty</span>
                  <span className="text-xs font-black text-slate-900">{trip.grade || 'Moderate'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Age Group</span>
                  <span className="text-xs font-black text-slate-900">{trip.ageGroup || '18-40 Years'}</span>
                </div>
              </div>
            </div>

            {/* Day-by-Day Itinerary Accordion */}
            <div id="itinerary" className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Day-by-Day Itinerary</h3>
                  <p className="text-xs text-slate-500 font-medium">Curated daily route, meal plans, and scenic halts</p>
                </div>
                <button
                  onClick={() => setIsPlannerOpen(true)}
                  className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={14} /> Customize Days with AI
                </button>
              </div>

              <div className="space-y-3">
                {(trip.itinerary || [
                  { day: 1, title: 'Arrival & Scenic Mountain Drive', desc: 'Pickup from designated point, scenic mountain drive, check into boutique hotel, welcome dinner.' },
                  { day: 2, title: 'Guided Sightseeing & Secret Waterfalls', desc: 'Morning trail to hidden waterfalls, local cafe hopping, and sunset photography viewpoint.' },
                  { day: 3, title: 'High Mountain Pass & Night Camping', desc: 'Drive over high-altitude passes, visit ancient monastery, stargazing around cozy bonfire.' }
                ]).map((dayItem) => {
                  const isOpen = openDay === dayItem.day;
                  const dayImageUrl = dayItem.coverMedia?.url || dayItem.image || dayItem.imageUrl;
                  const locationLabel = dayItem.locationName || dayItem.location || dayItem.coverMedia?.caption;

                  return (
                    <div
                      key={dayItem.day}
                      className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setOpenDay(isOpen ? null : dayItem.day)}
                        className="w-full p-4 flex items-center justify-between text-left bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                            D{dayItem.day}
                          </span>
                          <div>
                            <span className="text-xs md:text-sm font-black text-slate-900 block">{dayItem.title}</span>
                            {locationLabel && (
                              <span className="text-[10px] text-emerald-700 font-bold">📍 {locationLabel}</span>
                            )}
                          </div>
                        </div>
                        {isOpen ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white text-xs md:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 space-y-3">
                          {/* Curated 3-Image Nature Gallery Block */}
                          <ItineraryDayGallery
                            day={dayItem}
                            destination={trip.location || trip.destination}
                            className="my-1"
                          />
                          <p>{dayItem.desc || dayItem.description}</p>
                          {dayItem.stay && (
                            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                              🏨 Stay: <strong className="text-slate-800">{dayItem.stay}</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Dynamic Packing Checklist */}
            <div id="packing" className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Backpack size={20} className="text-emerald-600" />
                    <h3 className="text-xl font-black text-slate-900">Interactive Packing Assistant</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Personalized checklist for {trip.location} based on current climate ({weather.temp})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {packedCount} of {totalPackingCount} Packed
                  </span>
                </div>
              </div>

              {/* Packing Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.round((packedCount / totalPackingCount) * 100)}%` }}
                />
              </div>

              {/* Checklist Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {packingList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleTogglePackingItem(item.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      item.defaultChecked
                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                        : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.defaultChecked ? (
                        <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                      ) : (
                        <Square size={16} className="text-slate-400 shrink-0" />
                      )}
                      <span className={`text-xs font-bold ${item.defaultChecked ? 'line-through text-slate-400' : ''}`}>
                        {item.name}
                      </span>
                    </div>

                    {item.mandatory && (
                      <span className="text-[9px] font-black uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                        Must
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div id="inclusions" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
                <h4 className="text-base font-black text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 size={18} /> Inclusions
                </h4>
                <ul className="space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2">✓ Boutique hotel stays & Swiss tents</li>
                  <li className="flex items-center gap-2">✓ Breakfast & Dinner on all days</li>
                  <li className="flex items-center gap-2">✓ AC / 4x4 Private Transfers</li>
                  <li className="flex items-center gap-2">✓ Certified Trip Captain & Local Guide</li>
                  <li className="flex items-center gap-2">✓ All Inner Line Permits & Tolls</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
                <h4 className="text-base font-black text-rose-700 flex items-center gap-2">
                  <X size={18} /> Exclusions
                </h4>
                <ul className="space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2">✗ Flights / Train to starting point</li>
                  <li className="flex items-center gap-2">✗ Personal shopping & extra activities</li>
                  <li className="flex items-center gap-2">✗ Lunches during transit halts</li>
                  <li className="flex items-center gap-2">✗ Personal travel insurance</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                  Authoritative Price
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{perPersonPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ person</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 mt-1 block">
                  or 6 monthly installments of <span className="text-emerald-600 font-extrabold">₹{monthlyEmi.toLocaleString()}</span> (0% EMI)
                </span>
              </div>

              {/* Batch Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Select Upcoming Departure Batch
                </label>
                <div className="space-y-2">
                  {(trip.availableBatches || [
                    { dates: '15 Sep - 20 Sep, 2026', seatsLeft: 4, status: 'Filling Fast' },
                    { dates: '25 Sep - 30 Sep, 2026', seatsLeft: 8, status: 'Available' },
                    { dates: '05 Oct - 10 Oct, 2026', seatsLeft: 12, status: 'Available' }
                  ]).map((batch, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedBatch(batch)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                        selectedBatch.dates === batch.dates
                          ? 'border-emerald-500 bg-emerald-50/50 font-black text-slate-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 font-bold text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-emerald-600" />
                        <span>{batch.dates}</span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white">
                        {batch.seatsLeft} seats
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Occupancy Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Room Occupancy Sharing
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Double Sharing', 'Triple Sharing', 'Single Sharing'].map((occ) => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setOccupancy(occ)}
                      className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all border ${
                        occupancy === occ
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {occ.replace(' Sharing', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travelers Counter */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Number of Travelers
                </label>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Total Travelers</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTravelers(Math.max(1, travelers - 1))}
                      className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-xs font-black hover:bg-slate-100 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-xs font-black text-slate-900 w-4 text-center">{travelers}</span>
                    <button
                      type="button"
                      onClick={() => setTravelers(Math.min(10, travelers + 1))}
                      className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-xs font-black hover:bg-slate-100 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Calculation & Dual Action CTA */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>Starting From:</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">₹{perPersonPrice.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1">/ person</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {/* Primary CTA: Book Now */}
                  <button
                    type="button"
                    onClick={handleProceedToBooking}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck size={16} /> Book Now
                  </button>

                  {/* Secondary CTA: Talk to a Travel Expert */}
                  <button
                    type="button"
                    onClick={() => setIsCallbackOpen(true)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
                  >
                    <PhoneCall size={14} className="text-emerald-400" /> Talk to a Travel Expert
                  </button>
                </div>

                <p className="text-[10px] text-center text-slate-500 font-semibold">
                  Flexible payment available where eligible.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Expeditions Section */}
        <div className="mt-20 pt-10 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block">
                Related Itineraries
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                You May Also Like
              </h2>
            </div>
            <Link to="/destinations" className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Browse All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {fallbackSimilarTrips.map((sTrip) => (
              <TripCard key={sTrip.id} trip={sTrip} showWeather={true} />
            ))}
          </div>
        </div>

        {/* Mobile Sticky Bottom Conversion Bar (Visible on mobile/tablet < 1024px) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 block">
              Starting Price
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900">
                ₹{perPersonPrice.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-400">/ person</span>
            </div>
            <span className="text-[9px] font-medium text-slate-400 block -mt-0.5">Flexible payment eligible</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Secondary CTA: Talk to Expert */}
            <button
              type="button"
              onClick={() => setIsCallbackOpen(true)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 border border-slate-700 shadow-xs cursor-pointer"
              title="Talk to Travel Expert"
            >
              <PhoneCall size={13} className="text-emerald-400" />
              <span>Expert</span>
            </button>

            {/* Primary CTA: Book Now */}
            <button
              type="button"
              onClick={handleProceedToBooking}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={14} />
              <span>Book Now</span>
            </button>
          </div>
        </div>

        {/* Callback Request / Schedule Call Modal */}
        <RequestCallbackModal
          isOpen={isCallbackOpen}
          onClose={() => setIsCallbackOpen(false)}
          trip={trip}
          selectedBatch={selectedBatch}
        />
      </div>
    </div>
  );
};

export default TripDetails;
