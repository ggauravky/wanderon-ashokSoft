import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, ShieldCheck, ArrowRight, ArrowLeft, Check, 
  MapPin, Clock, Info, CheckCircle2, AlertCircle, Sparkles, 
  BedDouble, Bed, User, HelpCircle, PhoneCall, ChevronRight, Lock
} from 'lucide-react';
import SEOHead from '../components/SEOHead.jsx';
import RequestCallbackModal from '../components/RequestCallbackModal.jsx';
import * as travelKnowledgeService from '../services/travelKnowledgeService.js';
import * as apiService from '../services/api.js';
import { UPCOMING_TRIPS } from '../constants/mockData.js';

const calculateBookingPricingApi = async (...args) => {
  const fn = apiService.calculateBookingPricingApi || apiService.default?.calculateBookingPricingApi;
  if (typeof fn === 'function') return fn(...args);
  throw new Error('calculateBookingPricingApi is not available');
};

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

const BookingDates = () => {
  const { tripSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Passed state from TripDetails (if available)
  const navState = location.state || {};

  // 1. Resolve Trip Object
  const [trip, setTrip] = useState(() => {
    if (navState.trip) return typeof normalizeTripObject === 'function' ? normalizeTripObject(navState.trip) : navState.trip;
    const staticList = typeof getAllStaticTrips === 'function' ? getAllStaticTrips() : UPCOMING_TRIPS.map(t => typeof normalizeTripObject === 'function' ? normalizeTripObject(t) : t);
    const found = (staticList || []).find(
      (t) => t.slug === tripSlug || String(t.id) === String(tripSlug) || String(t._id) === String(tripSlug)
    );
    return found || staticList[0];
  });

  // Fetch live trip if needed from API
  useEffect(() => {
    const fetchLiveTrip = async () => {
      if (!tripSlug) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/trips/${tripSlug}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setTrip(normalizeTripObject(json.data));
          }
        }
      } catch (e) {
        console.warn('Using static trip fallback for booking dates:', e.message);
      }
    };
    fetchLiveTrip();
  }, [tripSlug]);

  const batches = trip.batches || trip.availableBatches || [];

  // 2. Month Grouping
  const monthTabs = useMemo(() => {
    const unique = [];
    batches.forEach(b => {
      const m = b.monthLabel || 'UPCOMING';
      if (!unique.includes(m)) {
        unique.push(m);
      }
    });
    return unique.length > 0 ? unique : ["SEP '26", "OCT '26", "NOV '26"];
  }, [batches]);

  const [selectedMonth, setSelectedMonth] = useState(() => monthTabs[0] || "SEP '26");

  // Keep selected month valid if tabs change
  useEffect(() => {
    if (monthTabs.length > 0 && !monthTabs.includes(selectedMonth)) {
      setSelectedMonth(monthTabs[0]);
    }
  }, [monthTabs, selectedMonth]);

  // Filter batches for active month
  const activeMonthBatches = useMemo(() => {
    const filtered = batches.filter(b => (b.monthLabel || 'UPCOMING') === selectedMonth);
    return filtered.length > 0 ? filtered : batches;
  }, [batches, selectedMonth]);

  // 3. Selection States
  const [selectedBatch, setSelectedBatch] = useState(() => {
    if (navState.initialBatch) {
      const match = batches.find(b => b.dates === navState.initialBatch);
      if (match) return match;
    }
    return activeMonthBatches.find(b => b.status !== 'sold_out') || activeMonthBatches[0] || batches[0];
  });

  // When month changes, default to first available batch in that month
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    const monthFiltered = batches.filter(b => (b.monthLabel || 'UPCOMING') === month);
    const firstAvail = monthFiltered.find(b => b.status !== 'sold_out') || monthFiltered[0];
    if (firstAvail) {
      setSelectedBatch(firstAvail);
    }
  };

  const [occupancy, setOccupancy] = useState(navState.initialOccupancy || 'Double Sharing');
  const [travelers, setTravelers] = useState(navState.initialTravelers || 1);
  const [pickupPoint, setPickupPoint] = useState(() => {
    return trip.pickupPoints?.[0] || 'Airport Arrival Terminal (10:00 AM)';
  });
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);

  // 4. Authoritative Pricing Breakdown State
  const [serverPricing, setServerPricing] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Dynamic pricing calculation from selected batch / sharing
  const localPriceBreakdown = useMemo(() => {
    const batchPricing = selectedBatch?.pricing || trip.sharingPricing || {
      doubleSharing: trip.price,
      tripleSharing: Math.max(1000, trip.price - 1500),
      singleSharing: trip.price + 3500
    };

    let perPerson = Number(trip.price) || 18500;
    if (occupancy === 'Triple Sharing') {
      perPerson = Number(batchPricing.tripleSharing) || Math.max(1000, trip.price - 1500);
    } else if (occupancy === 'Double Sharing') {
      perPerson = Number(batchPricing.doubleSharing) || trip.price;
    } else if (occupancy === 'Single Sharing') {
      perPerson = Number(batchPricing.singleSharing) || (trip.price + 3500);
    }

    const subtotal = perPerson * travelers;
    const discount = trip.discount ? Math.round(subtotal * (trip.discount / 100)) : 0;
    const finalAmount = Math.max(1, subtotal - discount);

    return {
      perPerson,
      subtotal,
      discount,
      finalAmount,
      currency: 'INR'
    };
  }, [trip, selectedBatch, occupancy, travelers]);

  // Synchronize server-side calculation
  useEffect(() => {
    let isCurrent = true;
    const fetchServerPricing = async () => {
      setIsCalculating(true);
      try {
        const payload = {
          tripId: String(trip.slug || trip.id || trip._id),
          travelersCount: travelers,
          occupancy,
          batchId: selectedBatch?.batchId || selectedBatch?.id,
          batchDate: selectedBatch?.dates
        };
        const data = await calculateBookingPricingApi(payload);
        if (isCurrent && data) {
          setServerPricing(data);
        }
      } catch (e) {
        // Fallback gracefully to local calculation
      } finally {
        if (isCurrent) setIsCalculating(false);
      }
    };

    fetchServerPricing();
    return () => { isCurrent = false; };
  }, [trip, selectedBatch, occupancy, travelers]);

  const activePricing = serverPricing || localPriceBreakdown;
  const effectivePerPerson = activePricing.basePricePerPerson || localPriceBreakdown.perPerson;
  const effectiveFinalAmount = activePricing.finalAmount || localPriceBreakdown.finalAmount;

  // 5. Proceed to Traveler Details & Checkout
  const handleContinue = () => {
    if (!selectedBatch || selectedBatch.status === 'sold_out') {
      alert('Please select an available departure batch to continue.');
      return;
    }

    const bookingDraft = {
      tripId: trip.id || trip._id,
      tripSlug: trip.slug,
      tripTitle: trip.title,
      tripImage: trip.image,
      location: trip.location,
      destination: trip.destination,
      duration: trip.duration,
      batchId: selectedBatch.batchId || selectedBatch.id,
      batchDate: selectedBatch.dates,
      occupancy,
      travelersCount: travelers,
      perPersonPrice: effectivePerPerson,
      subtotal: activePricing.subtotal || (effectivePerPerson * travelers),
      discount: activePricing.discount || 0,
      totalAmount: effectiveFinalAmount,
      pickupPoint
    };

    // Save draft state to localStorage for persistence across reloads
    try {
      localStorage.setItem('wanderluxe_booking_draft', JSON.stringify(bookingDraft));
    } catch (e) {}

    // Navigate to Traveler Details (Checkout Step 2)
    navigate('/checkout', { state: bookingDraft });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 pt-24 pb-32 lg:pb-24 text-slate-800 font-sans">
      <SEOHead
        title={`Dates & Costing - ${trip.title} | WanderLuxe`}
        description={`Select your departure dates and room sharing options for ${trip.title}. Transparent per-person costing with guaranteed departure batches.`}
        canonical={`/book/${trip.slug}`}
      />

      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        
        {/* Step Indicator Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link 
              to={`/trip/${trip.slug || trip.id}`}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shrink-0"
              title="Back to Itinerary"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                Booking Step 1 of 3
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900">
                Dates & Costing
              </h1>
            </div>
          </div>

          {/* Stepper Pills */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700 font-black">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
              Dates & Costing
            </span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">2</span>
              Travelers
            </span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">3</span>
              Confirm
            </span>
          </div>
        </div>

        {/* Trip Snapshot Banner */}
        <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <img 
              src={trip.image} 
              alt={trip.title}
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shrink-0 border border-slate-200"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase">
                  {trip.duration}
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-600" /> {trip.location}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-900 leading-snug">
                {trip.title}
              </h2>
              <div className="text-xs text-slate-500 font-medium">
                Official verified expedition • Starting at <span className="font-black text-emerald-600">₹{Number(trip.price).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <button
              type="button"
              onClick={() => setIsCallbackOpen(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall size={14} className="text-emerald-600" /> Need Help Planning?
            </button>
            <Link
              to={`/trip/${trip.slug || trip.id}`}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Review Itinerary
            </Link>
          </div>
        </div>

        {/* Main Grid: Left Selection Engine, Right Sticky Costing Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Form & Selection (Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* ============================================================= */}
            {/* 1. SELECT DEPARTURE BATCH (GROUPED BY MONTH) */}
            {/* ============================================================= */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Calendar size={18} className="text-emerald-600" /> 1. Select Departure Dates
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    All dates are guaranteed group departures led by certified captains.
                  </p>
                </div>

                <span className="text-[11px] font-bold text-slate-400">
                  {batches.length} Available Batches
                </span>
              </div>

              {/* Month Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {monthTabs.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMonthChange(m)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer border ${
                      selectedMonth === m
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Batches Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeMonthBatches.map((batch) => {
                  const isSelected = selectedBatch?.batchId === batch.batchId || selectedBatch?.dates === batch.dates;
                  const isSoldOut = batch.status === 'sold_out';
                  const isFillingFast = batch.status === 'filling_fast';

                  return (
                    <div
                      key={batch.batchId || batch.id || batch.dates}
                      onClick={() => !isSoldOut && setSelectedBatch(batch)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                        isSoldOut 
                          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                          : isSelected
                            ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <Calendar size={13} className={isSelected ? 'text-emerald-600' : 'text-slate-400'} />
                            {batch.dates}
                          </span>

                          {/* Availability Badge */}
                          {isSoldOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-800">
                              Sold Out
                            </span>
                          ) : isFillingFast ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300/50 animate-pulse">
                              {batch.hasRealCapacity ? `Only ${batch.availableSeats} Seats Left` : 'Filling Fast'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                              {batch.hasRealCapacity ? `${batch.availableSeats} Seats Available` : 'Available'}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 font-bold">
                          Starting at <span className="text-slate-900 font-black">₹{Number(batch.pricing?.doubleSharing || trip.price).toLocaleString()}</span> / person
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-400 font-bold">
                          {trip.duration} • Group Tour
                        </span>
                        {isSelected && (
                          <span className="text-emerald-700 font-black flex items-center gap-1">
                            <CheckCircle2 size={13} /> Selected Batch
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================= */}
            {/* 2. SELECT ROOM SHARING & PRICING */}
            {/* ============================================================= */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BedDouble size={18} className="text-emerald-600" /> 2. Room Sharing & Pricing Option
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Authoritative per-person rates managed by destination logistics team.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Triple Sharing */}
                {(() => {
                  const tripleRate = Number(selectedBatch?.pricing?.tripleSharing || trip.sharingPricing?.tripleSharing || Math.max(1000, trip.price - 1500));
                  const isSelected = occupancy === 'Triple Sharing';
                  return (
                    <div
                      onClick={() => setOccupancy('Triple Sharing')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">Triple Sharing</span>
                          <span className="text-[10px] font-bold text-slate-400">3 Beds</span>
                        </div>
                        <div className="text-lg font-black text-slate-900">
                          ₹{tripleRate.toLocaleString()}
                          <span className="text-[10px] font-bold text-slate-400 font-mono"> / pax</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          Budget-friendly choice for group of 3 or solo explorers willing to share.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-emerald-700 font-bold">Save ₹1,500/pax</span>
                        {isSelected && <Check size={14} className="text-emerald-600" />}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Double Sharing (Recommended) */}
                {(() => {
                  const doubleRate = Number(selectedBatch?.pricing?.doubleSharing || trip.sharingPricing?.doubleSharing || trip.price);
                  const isSelected = occupancy === 'Double Sharing';
                  return (
                    <div
                      onClick={() => setOccupancy('Double Sharing')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                        isSelected
                          ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Most Popular
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">Double Sharing</span>
                          <span className="text-[10px] font-bold text-slate-400">Twin / Double</span>
                        </div>
                        <div className="text-lg font-black text-slate-900">
                          ₹{doubleRate.toLocaleString()}
                          <span className="text-[10px] font-bold text-slate-400 font-mono"> / pax</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          Standard twin or double occupancy in handpicked boutique hotels & camps.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-bold">Standard Base Rate</span>
                        {isSelected && <Check size={14} className="text-emerald-600" />}
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Single Sharing */}
                {(() => {
                  const singleRate = Number(selectedBatch?.pricing?.singleSharing || trip.sharingPricing?.singleSharing || (trip.price + 3500));
                  const isSelected = occupancy === 'Single Sharing';
                  return (
                    <div
                      onClick={() => setOccupancy('Single Sharing')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">Single Sharing</span>
                          <span className="text-[10px] font-bold text-slate-400">Private Room</span>
                        </div>
                        <div className="text-lg font-black text-slate-900">
                          ₹{singleRate.toLocaleString()}
                          <span className="text-[10px] font-bold text-slate-400 font-mono"> / pax</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          Private room to yourself with ensuite bathroom throughout the journey.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-bold">100% Privacy</span>
                        {isSelected && <Check size={14} className="text-emerald-600" />}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ============================================================= */}
            {/* 3. NUMBER OF TRAVELERS & PICKUP LOCATION */}
            {/* ============================================================= */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-emerald-600" /> 3. Group Size & Boarding Point
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Travelers Counter */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    Number of Travelers *
                  </label>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <div className="text-xs font-black text-slate-900">{travelers} Explorer{travelers > 1 ? 's' : ''}</div>
                      <div className="text-[10px] text-slate-400 font-medium">₹{effectivePerPerson.toLocaleString()} per person</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTravelers(Math.max(1, travelers - 1))}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-sm font-black hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-black text-slate-900 w-5 text-center">{travelers}</span>
                      <button
                        type="button"
                        onClick={() => setTravelers(Math.min(10, travelers + 1))}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-sm font-black hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pickup Location */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    Designated Pickup Location *
                  </label>
                  <select
                    value={pickupPoint}
                    onChange={(e) => setPickupPoint(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {(trip.pickupPoints || [
                      'Airport Arrival Hub (Terminal 1 Gate 3 - 10:00 AM)',
                      'Central Railway Station / Main Bus Terminal (11:30 AM)'
                    ]).map((pt, i) => (
                      <option key={i} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Costing Summary Card (Desktop) */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xl space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                  Authoritative Costing Summary
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Price Calculation
                </h3>
              </div>

              {/* Selection Summary Snapshot */}
              <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Departure Batch:</span>
                  <span className="font-black text-slate-900 text-right max-w-[150px] truncate">
                    {selectedBatch?.dates || 'Select Batch'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Room Sharing:</span>
                  <span className="font-black text-slate-900">{occupancy}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Travelers:</span>
                  <span className="font-black text-slate-900">{travelers} Pax</span>
                </div>
              </div>

              {/* Itemized Calculations */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Per Person Rate:</span>
                  <span className="font-bold text-slate-900">₹{effectivePerPerson.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Base Subtotal ({travelers} × ₹{effectivePerPerson.toLocaleString()}):</span>
                  <span className="font-bold text-slate-900">₹{(effectivePerPerson * travelers).toLocaleString()}</span>
                </div>

                {activePricing.discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-bold">
                    <span>Package Discount:</span>
                    <span>- ₹{activePricing.discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-600">
                  <span>Taxes & GST (5%):</span>
                  <span className="text-emerald-700 font-bold">Included</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Total Amount</span>
                    <span className="text-[10px] text-slate-400 font-bold">Zero hidden fees</span>
                  </div>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{effectiveFinalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Continue CTA Button */}
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedBatch || selectedBatch.status === 'sold_out'}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Traveler Details</span>
                <ArrowRight size={16} />
              </button>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold justify-center">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Free date rollover up to 15 days prior</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold justify-center">
                  <Lock size={12} />
                  <span>Secure 256-bit encrypted checkout</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Mobile Sticky Bottom Continue Bar (Visible < 1024px) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
              {travelers} Traveler{travelers > 1 ? 's' : ''} • {occupancy.replace(' Sharing', '')}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">
                ₹{effectiveFinalAmount.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-400">total</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedBatch || selectedBatch.status === 'sold_out'}
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:bg-slate-300 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight size={15} />
          </button>
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

export default BookingDates;
