import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Calendar, MapPin, Users, Ticket, ArrowRight, 
  Printer, ShieldCheck, QrCode, Sparkles, Copy, Check, Clock, Phone, Mail
} from 'lucide-react';
import { getBookingByIdApi } from '../services/api';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await getBookingByIdApi(bookingId);
        setBooking(data);
      } catch (err) {
        setError(err.message || 'Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handleCopyId = () => {
    if (booking?.bookingId) {
      navigator.clipboard.writeText(booking.bookingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-brand-light">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-emerald border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-brand-navy font-bold text-sm">Loading Verified Booking Ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-brand-light px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 font-black text-2xl">
            ✕
          </div>
          <h1 className="text-2xl font-black text-brand-navy mb-2">Booking Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">{error || 'Could not locate this booking record.'}</p>
          <Link
            to="/profile"
            className="w-full py-3.5 bg-brand-navy text-white font-bold rounded-2xl inline-block hover:bg-brand-emerald transition-all"
          >
            Go to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const { tripSnapshot, pricing, payment, customer, travelers, numberOfTravelers, occupancy, qrCode } = booking;

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-brand-light via-white to-brand-light px-4">
      <div className="max-w-4xl w-full mx-auto">
        {/* Top Success Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-brand-emerald to-teal-600 rounded-3xl p-8 md:p-10 text-white shadow-2xl shadow-emerald-500/20 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold text-white mb-4">
                <ShieldCheck size={16} /> 100% Cryptographically Verified Payment
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold mb-2 tracking-tight">
                Booking Confirmed! 🎉
              </h1>
              <p className="text-white/90 text-sm md:text-base font-medium max-w-lg">
                Your expedition is confirmed. An official itinerary has been generated and added to your profile.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 md:p-6 rounded-2xl shrink-0 text-center">
              <span className="text-xs text-white/80 font-bold uppercase tracking-wider block mb-1">
                Official Booking ID
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl md:text-2xl font-mono font-black text-white">
                  {booking.bookingId}
                </span>
                <button
                  onClick={handleCopyId}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                  title="Copy Booking ID"
                >
                  {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                </button>
              </div>
              <span className="text-[11px] text-emerald-200 font-semibold block mt-1">
                Razorpay Test Mode Paid
              </span>
            </div>
          </div>
        </div>

        {/* The Printable Boarding Ticket Card */}
        <div id="booking-ticket-card" className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          {/* Ticket Header */}
          <div className="p-6 md:p-8 bg-brand-navy text-white flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-emerald/20 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald">
                <Ticket size={24} />
              </div>
              <div>
                <span className="text-xs text-brand-emerald font-extrabold uppercase tracking-wider block">
                  Official Travel Pass
                </span>
                <h2 className="text-xl md:text-2xl font-black">{tripSnapshot?.title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-2 transition-all"
              >
                <Printer size={15} /> Print / PDF Ticket
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Left 2 Columns: Trip & Traveler Information */}
            <div className="md:col-span-2 p-6 md:p-8 space-y-6">
              {/* Trip Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-brand-light p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Destination
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-brand-navy">
                    <MapPin size={16} className="text-brand-emerald shrink-0" />
                    <span className="truncate">{tripSnapshot?.destination || tripSnapshot?.location}</span>
                  </div>
                </div>

                <div className="bg-brand-light p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Duration
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-brand-navy">
                    <Clock size={16} className="text-brand-emerald shrink-0" />
                    <span>{tripSnapshot?.duration}</span>
                  </div>
                </div>

                <div className="bg-brand-light p-4 rounded-2xl col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Departure Batch
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-brand-navy">
                    <Calendar size={16} className="text-brand-emerald shrink-0" />
                    <span className="truncate">{tripSnapshot?.batchDate}</span>
                  </div>
                </div>
              </div>

              {/* Lead Customer Info */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-navy mb-3 flex items-center gap-2">
                  <Users size={16} className="text-brand-emerald" /> Lead Traveler & Contact
                </h3>
                <div className="bg-brand-light p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block font-semibold">Name</span>
                    <span className="font-extrabold text-brand-navy">{customer?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Email</span>
                    <span className="font-extrabold text-brand-navy truncate block">{customer?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Phone</span>
                    <span className="font-extrabold text-brand-navy">{customer?.phone}</span>
                  </div>
                </div>
              </div>

              {/* Co-Travelers list if any */}
              {travelers && travelers.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-brand-navy mb-3">
                    Co-Travelers ({travelers.length})
                  </h3>
                  <div className="space-y-2">
                    {travelers.map((t, idx) => (
                      <div key={idx} className="p-3 bg-brand-light rounded-xl flex items-center justify-between text-xs font-bold text-brand-navy">
                        <span>{idx + 1}. {t.name || `Traveler ${idx + 2}`}</span>
                        <span className="text-gray-500">{t.gender}, {t.age} Yrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meeting & Pickup Hub */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
                <MapPin className="text-brand-emerald shrink-0 mt-0.5" size={18} />
                <div>
                  <span className="text-xs font-extrabold text-brand-navy block">Arrival & Pickup Point</span>
                  <span className="text-xs text-gray-600 font-medium">{tripSnapshot?.pickupPoint}</span>
                </div>
              </div>
            </div>

            {/* Right Column: QR Code & Payment Breakdown */}
            <div className="p-6 md:p-8 flex flex-col justify-between space-y-6 bg-slate-50/50">
              {/* QR Code Section */}
              <div className="text-center">
                <span className="text-xs font-black uppercase tracking-wider text-brand-navy block mb-3">
                  Boarding Verification QR
                </span>
                
                {qrCode?.dataUrl ? (
                  <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm inline-block mx-auto mb-2">
                    <img
                      src={qrCode.dataUrl}
                      alt="Booking Verification QR Code"
                      className="w-48 h-48 object-contain rounded-xl mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded-2xl border border-dashed border-gray-300 flex items-center justify-center mx-auto mb-2 text-gray-400">
                    <QrCode size={40} />
                  </div>
                )}
                
                <p className="text-[11px] text-gray-500 font-medium">
                  Scan to verify authentic booking credentials at pickup hub.
                </p>
              </div>

              {/* Payment Summary */}
              <div className="pt-4 border-t border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Base Price ({numberOfTravelers} traveler{numberOfTravelers > 1 ? 's' : ''})</span>
                  <span>₹{pricing?.subtotal?.toLocaleString()}</span>
                </div>
                {pricing?.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount ({pricing?.couponCode})</span>
                    <span>-₹{pricing?.discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-brand-navy pt-2 border-t border-gray-200">
                  <span>Total Paid</span>
                  <span className="text-brand-emerald">₹{pricing?.finalAmount?.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-gray-400 font-mono text-center pt-2">
                  Payment ID: {payment?.razorpayPaymentId || 'rzp_test_pay'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/profile"
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-navy text-white text-xs font-bold rounded-2xl hover:bg-brand-emerald transition-all shadow-lg flex items-center justify-center gap-2"
          >
            View in My Bookings <ArrowRight size={16} />
          </Link>

          <Link
            to="/trips"
            className="w-full sm:w-auto px-6 py-3.5 bg-white text-brand-navy text-xs font-bold rounded-2xl hover:bg-gray-100 transition-all border border-gray-200 flex items-center justify-center gap-2"
          >
            Explore More Destinations
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
