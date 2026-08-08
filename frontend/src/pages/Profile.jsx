import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Calendar, Mail, Phone, MapPin, Ticket, ShieldCheck, 
  LogOut, QrCode, Printer, X, Sparkles, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, logout, cancelBooking } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedTicket, setSelectedTicket] = useState(null);

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
                  Confirmed Vetted Booking
                </span>
                <h2 className="text-2xl font-extrabold text-brand-navy mt-2">Official E-Ticket</h2>
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

              <button
                onClick={() => window.print()}
                className="w-full py-3.5 bg-brand-navy text-white rounded-2xl font-bold hover:bg-brand-emerald transition-all flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <Printer size={18} /> Print Voucher / Download PDF
              </button>
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
                <span className="bg-brand-emerald/10 text-brand-emerald text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Explorer
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                <span className="flex items-center gap-1"><Phone size={14} /> {user.phone}</span>
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-2xl border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition-all flex items-center gap-2"
          >
            <LogOut size={16} /> Sign Out
          </button>
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
                <Ticket size={18} className="text-brand-emerald" /> My Bookings
              </span>
              <span className="bg-brand-emerald text-white text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                {user.bookedTrips?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full p-4 rounded-2xl font-bold text-sm text-left flex items-center justify-between transition-all ${
                activeTab === 'profile'
                  ? 'bg-brand-navy text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="flex items-center gap-3">
                <User size={18} className="text-brand-emerald" /> Account Details
              </span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Main Dashboard Content */}
          <div className="lg:col-span-3">
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-extrabold text-brand-navy">Active & Past Expeditions</h2>

                {user.bookedTrips?.length > 0 ? (
                  <div className="space-y-4">
                    {user.bookedTrips.map((booking) => (
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
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
                    <p className="text-gray-500 font-medium mb-4">No trips booked yet.</p>
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

            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/80 space-y-6">
                <h2 className="text-xl font-extrabold text-brand-navy">Personal Info</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                    <p className="font-bold text-brand-navy bg-brand-light p-3 rounded-2xl border border-gray-200">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
                    <p className="font-bold text-brand-navy bg-brand-light p-3 rounded-2xl border border-gray-200">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                    <p className="font-bold text-brand-navy bg-brand-light p-3 rounded-2xl border border-gray-200">{user.phone}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Member Since</label>
                    <p className="font-bold text-brand-navy bg-brand-light p-3 rounded-2xl border border-gray-200">{user.joinedDate || 'August 2026'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
