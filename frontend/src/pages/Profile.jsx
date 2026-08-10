import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Calendar, Mail, Phone, MapPin, Ticket, ShieldCheck, 
  LogOut, QrCode, Printer, X, Sparkles, CheckCircle2, ChevronRight,
  Heart, Coins, Lock, Save, AlertCircle, ExternalLink, ShieldAlert, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { UPCOMING_TRIPS } from '../constants/mockData';

const Profile = () => {
  const { user, logout, updateProfile, cancelBooking } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('bookings');
  const [bookingFilter, setBookingFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Profile edit state
  const [name, setName] = useState(user?.name || 'Gaurav Kumar Yadav');
  const [email, setEmail] = useState(user?.email || 'kumar.gaurav.yadav2007@gmail.com');
  const [phone, setPhone] = useState(user?.phone || '8542036499');
  const [address, setAddress] = useState(user?.address || 'Lucknow, UP, India');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 9876543210');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Security password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center pt-24 px-4 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
          <div className="w-16 h-16 bg-brand-emerald/10 text-brand-emerald rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-brand-navy mb-2">Access Your Profile</h2>
          <p className="text-gray-500 text-sm mb-6">Please log in to view your booked itineraries and ticket vouchers.</p>
          <Link
            to="/login"
            className="w-full py-3.5 bg-brand-emerald text-white rounded-2xl font-bold block hover:bg-brand-teal transition-all shadow-lg shadow-brand-emerald/20"
          >
            Log In Now
          </Link>
        </div>
      </div>
    );
  }

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    await updateProfile({ name, phone, address, avatar });
    setIsUpdating(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (!currentPass || !newPass) return;
    if (newPass !== confirmPass) {
      alert('New passwords do not match');
      return;
    }
    setPassSuccess(true);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassSuccess(false), 3000);
  };

  const handleCancelClick = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking? A 100% refund voucher will be issued.')) {
      cancelBooking(bookingId);
    }
  };

  // Filter bookings
  const filteredBookings = (user.bookedTrips || []).filter((b) => {
    if (bookingFilter === 'All') return true;
    if (bookingFilter === 'Confirmed') return b.status !== 'Cancelled';
    if (bookingFilter === 'Cancelled') return b.status === 'Cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      {/* E-Ticket Viewer Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedTicket(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-brand-navy p-1"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-emerald bg-brand-emerald/10 px-3 py-1 rounded-full border border-brand-emerald/20">
                  Vetted Booking Pass
                </span>
                <h2 className="text-2xl font-extrabold text-brand-navy mt-2">Official E-Ticket Voucher</h2>
              </div>

              {/* Pass details */}
              <div className="bg-brand-navy text-white rounded-2xl p-6 mb-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] text-brand-emerald font-bold tracking-widest uppercase block">Destination</span>
                    <p className="font-extrabold text-lg leading-snug">{selectedTicket.tripTitle}</p>
                  </div>
                  <span className="bg-white/20 text-white font-mono text-xs px-2.5 py-1 rounded-lg">
                    {selectedTicket.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                  <div>
                    <span className="text-white/50 block text-[10px]">Travel Batch</span>
                    <span className="font-semibold">{selectedTicket.batchDate}</span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[10px]">Occupancy</span>
                    <span className="font-semibold">{selectedTicket.occupancy}</span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[10px]">Passenger</span>
                    <span className="font-semibold">{selectedTicket.leadTraveler?.name || user.name}</span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[10px]">Amount Paid</span>
                    <span className="font-bold text-brand-emerald">₹{selectedTicket.paidAmount?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px]">
                  <span className="text-white/80">Pickup: {selectedTicket.pickupPoint}</span>
                  <QrCode size={32} className="text-white opacity-90" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.print()}
                  className="w-full py-3.5 bg-brand-navy text-white rounded-2xl font-bold hover:bg-brand-emerald transition-all flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  <Printer size={18} /> Print Voucher / Save PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-8">
        {/* User Banner Header */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-full border-4 border-brand-emerald object-cover shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-brand-navy">{user.name}</h1>
                <span className="bg-brand-emerald/10 text-brand-emerald text-xs font-extrabold px-3 py-0.5 rounded-full border border-brand-emerald/20">
                  Explorer • {user.role === 'admin' ? 'Admin Access' : 'Verified Member'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                <span className="flex items-center gap-1"><Phone size={14} /> {user.phone}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {user.address}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="px-5 py-2.5 bg-brand-navy text-white font-extrabold text-xs rounded-2xl hover:bg-brand-emerald transition-all flex items-center gap-2 shadow-md"
              >
                <ShieldCheck size={16} /> Go to Admin Control Panel
              </Link>
            )}

            <button
              onClick={logout}
              className="px-5 py-2.5 rounded-2xl border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition-all flex items-center gap-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-2">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full p-4 rounded-2xl font-bold text-sm text-left flex items-center justify-between transition-all ${
                activeTab === 'bookings'
                  ? 'bg-brand-navy text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="flex items-center gap-3">
                <Ticket size={18} className="text-brand-emerald" /> My Expeditions
              </span>
              <span className="bg-brand-emerald text-white text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                {user.bookedTrips?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('edit-profile')}
              className={`w-full p-4 rounded-2xl font-bold text-sm text-left flex items-center justify-between transition-all ${
                activeTab === 'edit-profile'
                  ? 'bg-brand-navy text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="flex items-center gap-3">
                <User size={18} className="text-brand-emerald" /> Edit Account Info
              </span>
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full p-4 rounded-2xl font-bold text-sm text-left flex items-center justify-between transition-all ${
                activeTab === 'wishlist'
                  ? 'bg-brand-navy text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="flex items-center gap-3">
                <Heart size={18} className="text-brand-emerald" /> Saved Wishlist
              </span>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full font-bold">2</span>
            </button>

            <button
              onClick={() => setActiveTab('rewards')}
              className={`w-full p-4 rounded-2xl font-bold text-sm text-left flex items-center justify-between transition-all ${
                activeTab === 'rewards'
                  ? 'bg-brand-navy text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="flex items-center gap-3">
                <Coins size={18} className="text-brand-emerald" /> WanderCoins & Rewards
              </span>
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                {user.wanderCoins || 1250} Pts
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full p-4 rounded-2xl font-bold text-sm text-left flex items-center justify-between transition-all ${
                activeTab === 'security'
                  ? 'bg-brand-navy text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="flex items-center gap-3">
                <Lock size={18} className="text-brand-emerald" /> Security & Password
              </span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Main Dashboard Panel */}
          <div className="lg:col-span-3">
            {/* Tab 1: Bookings */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-brand-navy">Active & Past Expeditions</h2>
                  <div className="flex gap-2">
                    {['All', 'Confirmed', 'Cancelled'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setBookingFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          bookingFilter === f
                            ? 'bg-brand-navy text-white'
                            : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredBookings.length > 0 ? (
                  <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <img
                            src={booking.image || 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg'}
                            alt={booking.tripTitle}
                            className="w-20 h-20 rounded-2xl object-cover shrink-0"
                          />
                          <div>
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                              booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {booking.status || 'Confirmed'}
                            </span>
                            <h3 className="font-bold text-brand-navy text-lg leading-snug mt-1">
                              {booking.tripTitle}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-2 mt-1">
                              <Calendar size={14} className="text-brand-emerald" /> {booking.batchDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                          <div className="text-left md:text-right">
                            <span className="text-[11px] text-gray-400 font-bold uppercase block">Paid Amount</span>
                            <span className="text-base font-extrabold text-brand-emerald">₹{booking.paidAmount?.toLocaleString()}</span>
                          </div>

                          <button
                            onClick={() => setSelectedTicket(booking)}
                            className="px-4 py-2.5 bg-brand-navy text-white rounded-xl text-xs font-bold hover:bg-brand-emerald transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Ticket size={14} /> E-Ticket
                          </button>

                          {booking.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleCancelClick(booking.id)}
                              className="px-3 py-2.5 text-xs text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
                    <p className="text-gray-500 font-medium mb-4">No trips found for filter: {bookingFilter}</p>
                    <Link
                      to="/destinations"
                      className="px-6 py-3 bg-brand-emerald text-white rounded-2xl font-bold text-sm inline-block shadow-lg shadow-brand-emerald/20"
                    >
                      Browse Upcoming Trips
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Edit Profile */}
            {activeTab === 'edit-profile' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/80">
                <h2 className="text-xl font-extrabold text-brand-navy mb-6">Update Account Profile</h2>

                {saveSuccess && (
                  <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={18} /> Profile details saved successfully!
                  </div>
                )}

                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Email Address (Read-only)</label>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm font-medium text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Phone Number (WhatsApp)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">City / Home Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Avatar Image URL</label>
                      <input
                        type="text"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-8 py-3.5 bg-brand-emerald text-white rounded-2xl font-extrabold text-sm hover:bg-brand-teal transition-all shadow-md flex items-center gap-2"
                  >
                    <Save size={18} /> Save Profile Updates
                  </button>
                </form>
              </div>
            )}

            {/* Tab 3: Wishlist */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6">
                <h2 className="text-xl font-extrabold text-brand-navy">Saved Favorite Expeditions</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {UPCOMING_TRIPS.slice(0, 2).map((trip) => (
                    <div key={trip.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200/80 p-5 flex flex-col justify-between">
                      <div className="flex gap-4 mb-4">
                        <img src={trip.image} alt={trip.title} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded">
                            {trip.duration}
                          </span>
                          <h3 className="font-bold text-brand-navy text-sm mt-1">{trip.title}</h3>
                          <p className="text-xs text-gray-400 mt-1">{trip.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-sm font-extrabold text-brand-navy">₹{trip.price.toLocaleString()}</span>
                        <Link
                          to={`/trip/${trip.id}`}
                          className="px-4 py-2 bg-brand-navy text-white text-xs font-bold rounded-xl hover:bg-brand-emerald transition-colors"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: WanderCoins Rewards */}
            {activeTab === 'rewards' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-8 text-white shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                      Loyalty Rewards Program
                    </span>
                    <h2 className="text-3xl font-extrabold mt-3">{user.wanderCoins || 1250} WanderCoins</h2>
                    <p className="text-xs text-white/80 mt-1 font-medium">1 WanderCoin = ₹1. Redeemable on any future booking!</p>
                  </div>
                  <Coins size={64} className="text-white/40" />
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/80 space-y-4">
                  <h3 className="font-bold text-brand-navy text-base">Your Referral Code</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      readOnly
                      value="WANDER-GAURAV-2026"
                      className="px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl font-mono text-sm font-bold text-brand-emerald w-64"
                    />
                    <button
                      onClick={() => alert('Referral link copied to clipboard!')}
                      className="px-5 py-3 bg-brand-navy text-white text-xs font-bold rounded-2xl hover:bg-brand-emerald transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">Earn 500 WanderCoins whenever a friend completes their first trip with your code.</p>
                </div>
              </div>
            )}

            {/* Tab 5: Security */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/80 max-w-xl">
                <h2 className="text-xl font-extrabold text-brand-navy mb-6">Security & Password</h2>

                {passSuccess && (
                  <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={18} /> Password changed successfully!
                  </div>
                )}

                <form onSubmit={handlePasswordSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-brand-navy text-white font-extrabold rounded-2xl text-sm hover:bg-brand-emerald transition-all shadow-md mt-2"
                  >
                    Update Security Password
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
