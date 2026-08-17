import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Calendar, Mail, Phone, MapPin, Ticket, ShieldCheck, 
  LogOut, QrCode, Printer, X, Sparkles, CheckCircle2, ChevronRight,
  Heart, Coins, Lock, Save, AlertCircle, ExternalLink, ShieldAlert, Award,
  Trash2, Compass, ArrowRight, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { UPCOMING_TRIPS } from '../constants/mockData';
import { getMyBookingsApi } from '../services/api';
import { 
  getSavedAIItineraries, deleteSavedAIItinerary, 
  getWishlistIds, toggleWishlistItem, getRecentlyViewedTrips 
} from '../utils/userHistory';
import TripCard from '../components/TripCard';

const Profile = () => {
  const { user, logout, updateProfile, cancelBooking } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('bookings');
  const [bookingFilter, setBookingFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [liveBookings, setLiveBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  // AI Itineraries & Wishlist State
  const [savedAIPlans, setSavedAIPlans] = useState([]);
  const [wishlistTrips, setWishlistTrips] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Profile edit state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Security password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

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

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center pt-24 px-4 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Your Profile</h2>
          <p className="text-slate-500 text-sm mb-6">Please log in to view your booked itineraries and ticket vouchers.</p>
          <Link
            to="/login"
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-md block"
          >
            Log In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-20">
      {/* Boarding Pass Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedTicket(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Official Travel Boarding Pass
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">WanderLuxe Expedition Voucher</h3>
              </div>

              <div className="bg-slate-900 text-white p-5 rounded-2xl mb-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-emerald-400 font-bold block">Expedition</span>
                    <p className="font-black text-base">{selectedTicket.tripTitle || selectedTicket.tripSnapshot?.title}</p>
                  </div>
                  <span className="bg-white/20 text-white font-mono text-xs px-2.5 py-1 rounded-lg">
                    {selectedTicket.bookingId || selectedTicket.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-white/50 block text-[10px]">Travel Batch</span>
                    <span className="font-semibold">{selectedTicket.batchDate || selectedTicket.tripSnapshot?.batchDates}</span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[10px]">Passenger</span>
                    <span className="font-semibold">{selectedTicket.leadTraveler?.name || user.name}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px]">
                  <span className="text-white/80">Status: <strong className="text-emerald-400 font-bold">Confirmed</strong></span>
                  <QrCode size={36} className="text-white" />
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Printer size={16} /> Print Pass / Save PDF
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-8">
        {/* User Banner Header */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-full border-4 border-emerald-500 object-cover shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900">{user.name}</h1>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-0.5 rounded-full border border-emerald-200">
                  {user.role === 'admin' ? 'Admin Access' : user.role === 'influencer' ? 'Creator Partner' : 'Verified Traveler'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex flex-wrap items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                {user.phone && <span className="flex items-center gap-1"><Phone size={14} /> {user.phone}</span>}
                {user.address && <span className="flex items-center gap-1"><MapPin size={14} /> {user.address}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-md"
              >
                <ShieldCheck size={16} /> Admin Panel
              </Link>
            )}

            <button
              onClick={logout}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-1.5"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-200">
          {[
            { id: 'bookings', label: 'My Bookings', icon: Ticket, count: liveBookings.length },
            { id: 'ai_plans', label: 'My AI Itineraries', icon: Sparkles, count: savedAIPlans.length },
            { id: 'wishlist', label: 'Saved Wishlist', icon: Heart, count: wishlistTrips.length },
            { id: 'history', label: 'Recently Viewed', icon: History, count: recentlyViewed.length },
            { id: 'edit_profile', label: 'Profile Settings', icon: User }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <tab.icon size={15} className={activeTab === tab.id ? 'text-emerald-400' : 'text-slate-400'} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Bookings & Passes */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {loadingBookings ? (
              <div className="py-16 text-center text-slate-400 font-bold text-xs">
                Fetching confirmed reservations from database...
              </div>
            ) : liveBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveBookings.map((b) => (
                  <div key={b._id || b.bookingId} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {b.bookingStatus || 'CONFIRMED'}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-2">{b.tripSnapshot?.title || 'Expedition'}</h3>
                        <span className="text-xs text-slate-400 font-mono">ID: {b.bookingId || b._id}</span>
                      </div>
                      <span className="text-lg font-black text-slate-900">₹{(b.pricing?.finalAmount || b.paidAmount || 18500).toLocaleString()}</span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p><strong>Batch:</strong> {b.tripSnapshot?.batchDates || 'Scheduled Batch'}</p>
                      <p><strong>Lead Traveler:</strong> {b.leadTraveler?.name || user.name}</p>
                    </div>

                    <button
                      onClick={() => setSelectedTicket(b)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <QrCode size={16} /> View Boarding Pass
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-3">
                <Ticket size={36} className="text-slate-300 mx-auto" />
                <h3 className="text-lg font-black text-slate-900">No Active Bookings</h3>
                <p className="text-xs text-slate-500 font-medium">You haven't reserved any group departures yet. Browse our curated itineraries to start your journey.</p>
                <Link to="/destinations" className="inline-block px-5 py-2.5 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600">
                  Explore Destinations
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved AI Itineraries */}
        {activeTab === 'ai_plans' && (
          <div className="space-y-6">
            {savedAIPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedAIPlans.map((plan) => (
                  <div key={plan.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {plan.daysCount} Days • {plan.mood}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-2">{plan.title}</h3>
                        <span className="text-xs text-slate-400">{plan.tagline}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAIPlan(plan.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                        title="Delete itinerary"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase block">Daily Route Highlights</span>
                      {plan.itineraryDays?.slice(0, 3).map((d) => (
                        <div key={d.day} className="flex items-baseline gap-2">
                          <strong className="text-slate-900 shrink-0">Day {d.day}:</strong>
                          <span className="truncate text-slate-600">{d.title}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-bold text-slate-700">Est: ₹{plan.totalEstimatedCost?.toLocaleString()}</span>
                      {plan.matchedCatalogTrip && (
                        <Link
                          to={`/trip/${plan.matchedCatalogTrip.id}`}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1"
                        >
                          Book Similar Tour <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-3">
                <Sparkles size={36} className="text-slate-300 mx-auto" />
                <h3 className="text-lg font-black text-slate-900">No Saved AI Itineraries</h3>
                <p className="text-xs text-slate-500 font-medium">Use our AI Travel Planner on the Home or Destinations page to design custom day-by-day travel routes and save them here.</p>
                <Link to="/" className="inline-block px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800">
                  Launch AI Planner
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved Wishlist */}
        {activeTab === 'wishlist' && (
          <div className="space-y-6">
            {wishlistTrips.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistTrips.map((trip) => (
                  <div key={trip.id} className="relative group">
                    <TripCard trip={trip} showWeather={true} />
                    <button
                      onClick={() => handleRemoveWishlist(trip.id)}
                      className="absolute top-3 right-3 z-20 p-2 bg-white/90 rounded-full text-rose-500 hover:bg-white transition-colors shadow-md"
                      title="Remove from saved"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-3">
                <Heart size={36} className="text-slate-300 mx-auto" />
                <h3 className="text-lg font-black text-slate-900">Your Wishlist is Empty</h3>
                <p className="text-xs text-slate-500 font-medium">Click the heart icon on any tour package or expedition to save it to your personal wishlist.</p>
                <Link to="/destinations" className="inline-block px-5 py-2.5 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600">
                  Browse Expeditions
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Recently Viewed */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {recentlyViewed.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentlyViewed.map((trip) => (
                  <TripCard key={trip.id} trip={trip} showWeather={false} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-3">
                <History size={36} className="text-slate-300 mx-auto" />
                <h3 className="text-lg font-black text-slate-900">No Browsing History</h3>
                <p className="text-xs text-slate-500 font-medium">Trips you explore will automatically appear here for fast reference.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Profile Settings */}
        {activeTab === 'edit_profile' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-black text-slate-900">Personal Traveler Information</h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsUpdating(true);
                await updateProfile({ name, phone, address, avatar });
                setIsUpdating(false);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Email (Account Locked)</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Mobile Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">City & State</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Save size={16} /> {isUpdating ? 'Saving...' : saveSuccess ? 'Profile Updated!' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
