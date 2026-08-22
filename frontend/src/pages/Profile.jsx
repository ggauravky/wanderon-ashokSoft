import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Calendar, Mail, Phone, MapPin, Ticket, ShieldCheck, 
  LogOut, QrCode, Printer, X, Sparkles, CheckCircle2, ChevronRight,
  Heart, Coins, Lock, Save, AlertCircle, ExternalLink, ShieldAlert, Award,
  Trash2, Compass, ArrowRight, History, SlidersHorizontal, Backpack,
  CloudSun, Clock, ThumbsUp, CheckSquare, Square, Download, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAuth } from '../contexts/AuthContext';
import { UPCOMING_TRIPS } from '../constants/mockData';
import { getMyBookingsApi, getMySavedItinerariesApi, deleteSavedItineraryApi } from '../services/api';
import { 
  getSavedAIItineraries, deleteSavedAIItinerary, 
  getWishlistIds, toggleWishlistItem, getRecentlyViewedTrips 
} from '../utils/userHistory';
import { getPreTripDashboard, generatePackingChecklist } from '../utils/travelContextEngine';
import { getDestinationWeather, getCurrentSeason } from '../utils/weatherSeasonEngine';
import TripCard from '../components/TripCard';
import WeatherBadge from '../components/WeatherBadge';
import BoardingPassModal from '../components/BoardingPassModal';
import AIItineraryDocument from '../components/AIItineraryDocument';
import ShareItineraryModal from '../components/ShareItineraryModal';
import AIPlannerModal from '../components/AIPlannerModal';

const Profile = () => {
  const { user, logout, updateProfile, cancelBooking } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('bookings');
  const [bookingFilter, setBookingFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [liveBookings, setLiveBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  // AI Itineraries, Wishlist & Sharing State
  const [savedAIPlans, setSavedAIPlans] = useState([]);
  const [activeSharePlan, setActiveSharePlan] = useState(null);
  const [activePdfPlan, setActivePdfPlan] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerDestination, setPlannerDestination] = useState('Meghalaya');
  const profileDocRef = useRef(null);
  const [wishlistTrips, setWishlistTrips] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [userPreferences, setUserPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wanderluxe_user_preferences') || '{}');
    } catch (e) {
      return {};
    }
  });

  // Profile edit state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync profile state when user session loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // Load Local Saved Plans, Wishlists & History
  useEffect(() => {
    setSavedAIPlans(getSavedAIItineraries());
    const wishlistIds = getWishlistIds();
    setWishlistTrips(UPCOMING_TRIPS.filter((t) => wishlistIds.includes(t.id)));
    setRecentlyViewed(getRecentlyViewedTrips());
  }, [activeTab]);

  // Fetch real database bookings from MongoDB
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        setLoadingBookings(true);
        const serverBookings = await getMyBookingsApi();
        if (Array.isArray(serverBookings)) {
          setLiveBookings(serverBookings);
        }
      } catch (err) {
        console.warn('Could not load live bookings from server:', err.message);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [user]);

  const handleDeleteAIPlan = (planId) => {
    const updated = deleteSavedAIItinerary(planId);
    setSavedAIPlans(updated);
  };

  const handleRemoveWishlist = (tripId) => {
    const updatedIds = toggleWishlistItem(tripId);
    setWishlistTrips(UPCOMING_TRIPS.filter((t) => updatedIds.includes(t.id)));
  };

  const handleUpdatePreferences = (key, val) => {
    const updated = { ...userPreferences, [key]: val };
    setUserPreferences(updated);
    try {
      localStorage.setItem('wanderluxe_user_preferences', JSON.stringify(updated));
    } catch (e) {
      // Ignored
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center pt-24 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <User size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Access Your Travel Profile</h2>
        <p className="text-slate-500 text-xs md:text-sm max-w-sm mb-6 font-medium">
          Login to manage your bookings, download boarding passes, view saved AI itineraries, and customize your recommendations.
        </p>
        <Link
          to="/login"
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md"
        >
          Login with Email
        </Link>
      </div>
    );
  }

  // Pre-Trip Dashboard for Confirmed Booking
  const confirmedBooking = (liveBookings.length > 0 ? liveBookings : user.bookings || []).find(
    (b) => b.bookingStatus === 'CONFIRMED' || b.paymentStatus === 'PAID'
  );
  const preTripData = confirmedBooking ? getPreTripDashboard(confirmedBooking) : null;

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      {/* Dedicated Boarding Pass Travel Document Modal */}
      <BoardingPassModal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        bookingId={selectedTicket?.bookingId || selectedTicket?.id}
        initialBookingData={selectedTicket}
      />

      {/* AI Planner Modal for viewing/re-planning saved trips */}
      <AIPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        initialDestination={plannerDestination}
      />

      {/* Share Itinerary Modal */}
      <ShareItineraryModal
        isOpen={!!activeSharePlan}
        onClose={() => setActiveSharePlan(null)}
        itinerary={activeSharePlan}
      />

      {/* Hidden Offscreen PDF Document for Profile-level export */}
      {activePdfPlan && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <AIItineraryDocument ref={profileDocRef} itinerary={activePdfPlan} template="classic" />
        </div>
      )}

      <div className="container mx-auto px-4 md:px-8">
        {/* Pre-Trip Countdown Dashboard (if confirmed booking exists) */}
        {preTripData && (
          <div className="mb-10 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full">
                    Pre-Trip Command Center
                  </span>
                  <span className="text-emerald-400 text-xs font-black">
                    {preTripData.daysRemaining} Days to Departure
                  </span>
                </div>
                <h2 className="text-xl md:text-3xl font-black">{preTripData.tripTitle}</h2>
                <p className="text-xs text-slate-300 font-medium">
                  Departure Date: <span className="text-white font-bold">{preTripData.departureDateFormatted}</span> • Boarding Point: <span className="text-white font-bold">{preTripData.pickupPoint}</span>
                </p>
                <div className="flex items-center gap-4 text-xs pt-2">
                  <span className="text-slate-300">Captain: <strong className="text-white">{preTripData.captainName}</strong></span>
                  <span className="text-slate-300">Contact: <strong className="text-emerald-300">{preTripData.captainPhone}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setSelectedTicket(confirmedBooking)}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <QrCode size={16} /> Boarding QR Pass
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 font-black text-xl flex items-center justify-center border-2 border-emerald-500 shrink-0">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{user.name || 'WanderLuxe Explorer'}</h1>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {user.role || 'Member'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-slate-200/80 pb-3">
          {[
            { id: 'bookings', label: 'My Bookings', count: liveBookings.length || user.bookings?.length || 0 },
            { id: 'preferences', label: 'Travel Preferences', count: null },
            { id: 'ai-plans', label: 'Saved AI Plans', count: savedAIPlans.length },
            { id: 'wishlist', label: 'My Wishlist', count: wishlistTrips.length },
            { id: 'history', label: 'Recently Viewed', count: recentlyViewed.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: MY BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {(liveBookings.length > 0 ? liveBookings : user.bookings || []).length > 0 ? (
              (liveBookings.length > 0 ? liveBookings : user.bookings || []).map((booking, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-emerald-500/30 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        PNR: {booking.bookingId || booking.id || `WLX-2026-${idx}`}
                      </span>
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                        <CheckCircle2 size={12} /> {booking.bookingStatus || 'CONFIRMED'}
                      </span>
                    </div>

                    <h3 className="text-base md:text-lg font-black text-slate-900 leading-tight">
                      {booking.tripTitle || booking.tripSnapshot?.title || 'Himalayan Tour Package'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 font-medium">
                      <span>Batch: <strong className="text-slate-800">{booking.batchDates || booking.batchDate || booking.tripSnapshot?.batchDate || '15 Sep - 20 Sep 2026'}</strong></span>
                      <span>•</span>
                      <span>Travelers: <strong className="text-slate-800">{booking.travelersCount || booking.numberOfTravelers || booking.travelers?.length || 1}</strong></span>
                      {booking.pricing?.finalAmount && (
                        <>
                          <span>•</span>
                          <span>Total Paid: <strong className="text-emerald-700 font-bold">₹{booking.pricing.finalAmount.toLocaleString()}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
                    <Link
                      to={`/booking/confirmation/${booking.bookingId || booking.id}`}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center"
                    >
                      Trip Voucher
                    </Link>

                    <button
                      onClick={() => setSelectedTicket(booking)}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-950 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <QrCode size={15} className="text-emerald-400" />
                      Boarding Pass
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-md mx-auto space-y-4">
                <Ticket size={32} className="mx-auto text-slate-300" />
                <h3 className="text-base font-black text-slate-900">No active bookings yet</h3>
                <p className="text-xs text-slate-500 font-medium">Browse our curated expeditions and book your next adventure.</p>
                <Link to="/destinations" className="inline-block px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black">
                  Explore 50+ Packages
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRAVEL PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm max-w-2xl space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">Personalize Your Travel Recommendations</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                We use these preferences to tailor the Home hero and ranking algorithm.
              </p>
            </div>

            {/* Preferred Mood */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 block">Favorite Travel Style / Mood</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Mountains', 'Beach', 'Waterfalls', 'Adventure', 'Backpacking', 'Culture'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleUpdatePreferences('mood', m)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all border text-left flex items-center justify-between ${
                      userPreferences.mood === m
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{m}</span>
                    {userPreferences.mood === m && <CheckCircle2 size={14} className="text-emerald-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Tier */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 block">Target Budget Tier</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Budget', value: 10000, desc: 'Under ₹10,000' },
                  { label: 'Balanced', value: 20000, desc: 'Under ₹20,000' },
                  { label: 'Luxury', value: 50000, desc: '₹30,000+' }
                ].map((tier) => (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => handleUpdatePreferences('maxBudget', tier.value)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      userPreferences.maxBudget === tier.value
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-black block">{tier.label}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{tier.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600">Preferences auto-saved</span>
              <button
                onClick={() => {
                  setUserPreferences({});
                  localStorage.removeItem('wanderluxe_user_preferences');
                }}
                className="text-xs font-black text-rose-600 hover:underline"
              >
                Reset Preferences
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SAVED AI ITINERARIES */}
        {activeTab === 'ai-plans' && (
          <div className="space-y-4">
            {savedAIPlans.length > 0 ? (
              savedAIPlans.map((plan) => (
                <div key={plan.id || plan._id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-500/30 transition-all">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {plan.duration || plan.daysCount || 5} Days • {plan.travelStyle || plan.mood || 'Adventure'}
                      </span>
                      {plan.totalEstimatedCost && (
                        <span className="text-[11px] font-bold text-slate-500">
                          Est: <strong className="text-slate-800">₹{Number(plan.totalEstimatedCost).toLocaleString()}</strong>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1">{plan.title}</h3>
                    {plan.tagline && (
                      <p className="text-xs text-slate-500 font-medium line-clamp-1">{plan.tagline}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => {
                        setPlannerDestination(plan.destination);
                        setIsPlannerOpen(true);
                      }}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-emerald-200"
                    >
                      <Sparkles size={13} /> View Plan
                    </button>

                    <button
                      onClick={() => setActiveSharePlan(plan)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      title="Share Itinerary"
                    >
                      <Share2 size={13} /> Share
                    </button>

                    <button
                      onClick={async () => {
                        setActivePdfPlan(plan);
                        setTimeout(async () => {
                          if (!profileDocRef.current) return;
                          try {
                            setDownloadingPdf(true);
                            const canvas = await html2canvas(profileDocRef.current, { scale: 2, useCORS: true, logging: false });
                            const imgData = canvas.toDataURL('image/png');
                            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                            const pdfWidth = pdf.internal.pageSize.getWidth();
                            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                            const cleanName = (plan.destination || 'Trip').replace(/[^a-zA-Z0-9]/g, '-');
                            pdf.save(`WanderLuxe-${cleanName}-Itinerary.pdf`);
                          } catch (e) {
                            console.error('PDF export error:', e);
                          } finally {
                            setDownloadingPdf(false);
                            setActivePdfPlan(null);
                          }
                        }, 250);
                      }}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                      title="Download PDF"
                    >
                      <Download size={13} /> PDF
                    </button>

                    <button
                      onClick={async () => {
                        const targetId = plan.id || plan._id;
                        handleDeleteAIPlan(targetId);
                        try {
                          await deleteSavedItineraryApi(targetId);
                        } catch (e) {
                          // Ignored
                        }
                      }}
                      className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-md mx-auto space-y-4 shadow-sm">
                <Sparkles size={32} className="mx-auto text-emerald-500" />
                <h3 className="text-base font-black text-slate-900">No saved AI itineraries</h3>
                <p className="text-xs text-slate-500 font-medium">Generate custom multi-day travel plans with our AI Travel Intelligence tool.</p>
                <button 
                  onClick={() => {
                    setPlannerDestination('Meghalaya');
                    setIsPlannerOpen(true);
                  }}
                  className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black"
                >
                  Plan with AI Assistant
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY WISHLIST */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlistTrips.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistTrips.map((trip) => (
                  <div key={trip.id} className="relative group">
                    <TripCard trip={trip} showWeather={true} />
                    <button
                      onClick={() => handleRemoveWishlist(trip.id)}
                      className="absolute top-3 right-3 z-20 p-2 bg-rose-500 text-white rounded-full shadow-md hover:bg-rose-600 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-md mx-auto space-y-4">
                <Heart size={32} className="mx-auto text-slate-300" />
                <h3 className="text-base font-black text-slate-900">Your wishlist is empty</h3>
                <p className="text-xs text-slate-500 font-medium">Click the heart icon on any expedition to save it for later.</p>
                <Link to="/destinations" className="inline-block px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black">
                  Browse Expeditions
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: RECENTLY VIEWED */}
        {activeTab === 'history' && (
          <div>
            {recentlyViewed.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentlyViewed.map((trip) => (
                  <TripCard key={trip.id} trip={trip} showWeather={true} customBadge="Recently Viewed" />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-md mx-auto space-y-4">
                <History size={32} className="mx-auto text-slate-300" />
                <h3 className="text-base font-black text-slate-900">No recent views</h3>
                <p className="text-xs text-slate-500 font-medium">Trips you explore will appear here for easy continuation.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
