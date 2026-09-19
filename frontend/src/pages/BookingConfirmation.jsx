import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle2, Calendar, MapPin, Users, Ticket, ArrowRight, 
  Printer, ShieldCheck, QrCode, Sparkles, Copy, Check, Clock, 
  Phone, Mail, Download, Lock, AlertCircle, CreditCard, FileText, X
} from 'lucide-react';
import QRCode from 'qrcode';
import * as apiService from '../services/api.js';
import { useAuth } from '../contexts/AuthContext';

const { getBookingByIdApi, payRemainingBalanceApi, verifyRemainingBalanceApi } = apiService;
import BoardingPassModal from '../components/BoardingPassModal.jsx';
import ProvisionalBookingModal from '../components/ProvisionalBookingModal.jsx';
import { loadRazorpayScript } from '../utils/razorpay.js';
import SEOHead from '../components/SEOHead.jsx';
import PaymentSuccessModal from '../components/booking/PaymentSuccessModal.jsx';
import PaymentReceiptModal from '../components/booking/PaymentReceiptModal.jsx';
import BookingConfirmationModal from '../components/booking/BookingConfirmationModal.jsx';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/booking/confirmation/${bookingId}` } }, replace: true });
    }
  }, [isAuthenticated, navigate, bookingId]);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showProvisionalModal, setShowProvisionalModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [receiptPaymentId, setReceiptPaymentId] = useState('');
  const [successPayment, setSuccessPayment] = useState(null);
  const [bookingQr, setBookingQr] = useState('');

  // Balance Payment state
  const [isPayingBalance, setIsPayingBalance] = useState(false);
  const [balancePaymentError, setBalancePaymentError] = useState('');

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

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  useEffect(() => {
    const event = location.state?.paymentSuccess;
    if (!booking || !event?.verified || event.bookingId !== booking.bookingId) return;
    const match = (booking.payments || []).find((item) => item.paymentId === event.paymentId && item.orderId === event.orderId && item.type === event.paymentType && item.verifiedAt);
    if (!match) return;
    const key = `wlx_payment_success_seen_${match.paymentId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    setSuccessPayment(match);
    navigate(location.pathname, { replace: true, state: null });
  }, [booking, location.state, location.pathname, navigate]);

  useEffect(() => {
    let active = true;
    if (booking?.qrCode?.verificationUrl) QRCode.toDataURL(booking.qrCode.verificationUrl, { width: 320, margin: 2 }).then((data) => { if (active) setBookingQr(data); });
    return () => { active = false; };
  }, [booking?.qrCode?.verificationUrl]);

  const handleCopyId = () => {
    if (booking?.bookingId) {
      navigator.clipboard.writeText(booking.bookingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Pay Remaining Balance Workflow
  const handlePayRemainingBalance = async () => {
    if (!booking || isPayingBalance) return;
    try {
      setIsPayingBalance(true);
      setBalancePaymentError('');

      const isSdkLoaded = await loadRazorpayScript();
      if (!isSdkLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const orderData = await payRemainingBalanceApi(booking.bookingId);
      const razorpayKey = orderData.key || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Payment gateway is not configured. Please contact support.');
      }

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'WanderLuxe Expeditions',
        description: `Balance Payment for ${orderData.tripTitle || booking.tripSnapshot?.title || 'Trip'}`,
        order_id: orderData.orderId,
        prefill: {
          name: booking.customer?.name,
          email: booking.customer?.email,
          contact: booking.customer?.phone
        },
        theme: {
          color: '#059669'
        },
        handler: async function (response) {
          try {
            setIsPayingBalance(true);
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };

            const result = await verifyRemainingBalanceApi(booking.bookingId, verifyPayload);
            if (result.code === 'PAYMENT_PENDING_CAPTURE' || result.pending) {
              setBalancePaymentError('Balance payment is authorized and awaiting bank capture. We are verifying it automatically.');
              return;
            }
            if (result.success) {
              await fetchBooking();
              const event = result.paymentEvent || result.booking?.payments?.find((item) => item.paymentId === response.razorpay_payment_id);
              if (event?.paymentId) setSuccessPayment(event);
            }
          } catch (vErr) {
            setBalancePaymentError(`Payment verification is incomplete. Do not retry payment immediately. Contact support with ${response.razorpay_payment_id || 'your Razorpay reference'}. ${vErr.message || ''}`);
          } finally {
            setIsPayingBalance(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPayingBalance(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setBalancePaymentError(`Payment failed: ${resp.error.description}`);
        setIsPayingBalance(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Pay Balance Error:', err);
      setBalancePaymentError(err.message || 'Could not initiate balance payment.');
      setIsPayingBalance(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-slate-100/70">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-800 font-bold text-sm">Loading Verified Booking Manifest...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-slate-100/70 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-slate-200">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 font-black text-2xl">
            ✕
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Booking Not Found</h1>
          <p className="text-slate-500 text-sm mb-6">{error || 'Could not locate this booking record.'}</p>
          <Link
            to="/profile"
            className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl inline-block hover:bg-emerald-600 transition-all"
          >
            Go to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const { tripSnapshot, pricing, payment, paymentStatus, bookingStatus, customer, travelers, numberOfTravelers, qrCode } = booking;
  
  const isProvisional = bookingStatus === 'PROVISIONALLY_CONFIRMED' && paymentStatus === 'PARTIALLY_PAID';
  const isFullyConfirmed = bookingStatus === 'CONFIRMED' && paymentStatus === 'PAID';
  const numeric = (item) => item === null || item === undefined || item === '' || !Number.isFinite(Number(item)) ? null : Number(item);
  const money = (item) => item === null ? '—' : `₹${item.toLocaleString('en-IN')}`;
  const finalAmount = numeric(pricing?.finalAmount);
  const amountPaid = numeric(pricing?.amountPaid);
  const amountOutstanding = numeric(pricing?.amountOutstanding);

  const formattedDueDate = pricing?.balanceDueDate
    ? new Date(pricing.balanceDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'To be confirmed';

  return (
    <div className="min-h-screen pt-24 pb-16 bg-slate-100/70 px-4">
      <SEOHead
        title={`Booking ${isProvisional ? 'Provisional' : 'Confirmed'} - ${booking.bookingId} | WanderLuxe`}
        description={`Booking status and documents for ${tripSnapshot?.title}.`}
        canonical={`/booking/confirmation/${booking.bookingId}`}
      />

      <div className="max-w-4xl w-full mx-auto space-y-6">
        
        {/* Top Hero Banner */}
        <div className={`rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden ${
          isProvisional
            ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 shadow-amber-500/20'
            : isFullyConfirmed ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-900 shadow-emerald-500/20' : 'bg-slate-800'
        }`}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold text-white mb-4">
                <ShieldCheck size={16} /> 
                {isProvisional ? 'Deposit verified · Seat reserved' : isFullyConfirmed ? 'Payment verified · Booking confirmed' : `${bookingStatus} · ${paymentStatus}`}
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold mb-2 tracking-tight">
                {isProvisional ? 'Provisional Booking Confirmed' : isFullyConfirmed ? 'Booking Fully Confirmed' : 'Booking Status'}
              </h1>
              <p className="text-white/90 text-sm md:text-base font-medium max-w-lg">
                {isProvisional 
                  ? `Your seat is reserved. Pay the remaining balance (${money(amountOutstanding)}) by ${formattedDueDate} to unlock your official Boarding Pass.`
                  : isFullyConfirmed ? 'Your expedition is confirmed. Your official Boarding Pass is available.' : 'Review the current booking and payment status below.'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 md:p-6 rounded-2xl shrink-0 text-center">
              <span className="text-xs text-white/80 font-bold uppercase tracking-wider block mb-1">
                Booking Reference
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl md:text-2xl font-mono font-black text-white">
                  {booking.bookingId}
                </span>
                <button
                  onClick={handleCopyId}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
                  title="Copy Booking ID"
                >
                  {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                </button>
              </div>
              <span className={`text-[11px] font-bold block mt-1 ${isProvisional ? 'text-amber-200' : 'text-emerald-200'}`}>
                {isProvisional ? 'Partially paid' : isFullyConfirmed ? 'Paid in full' : paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Payment Error Alert */}
        {balancePaymentError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{balancePaymentError}</span>
            </div>
            <button onClick={() => setBalancePaymentError('')} className="text-rose-400 hover:text-rose-600">
              <X size={16} />
            </button>
          </div>
        )}

        {/* The Printable Boarding Ticket Card */}
        <div id="booking-ticket-card" className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Ticket Header */}
          <div className="p-6 md:p-8 bg-slate-950 text-white flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isProvisional ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                <Ticket size={24} />
              </div>
              <div>
                <span className={`text-xs font-extrabold uppercase tracking-wider block ${isProvisional ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isProvisional ? 'Provisional Reservation' : isFullyConfirmed ? 'Official Boarding Pass' : 'Booking Record'}
                </span>
                <h2 className="text-xl md:text-2xl font-black">{tripSnapshot?.title}</h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {isProvisional ? (
                <button
                  onClick={() => setShowProvisionalModal(true)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <FileText size={15} /> Provisional Confirmation
                </button>
              ) : isFullyConfirmed ? (
                <button
                  onClick={() => setShowPassModal(true)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <QrCode size={15} /> Official Boarding Pass
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Left 2 Columns: Trip & Traveler Information */}
            <div className="md:col-span-2 p-6 md:p-8 space-y-6">
              {/* Trip Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Destination
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                    <MapPin size={16} className="text-emerald-600 shrink-0" />
                    <span className="truncate">{tripSnapshot?.destination || tripSnapshot?.location}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Duration
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                    <Clock size={16} className="text-emerald-600 shrink-0" />
                    <span>{tripSnapshot?.duration}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl col-span-2 sm:col-span-1 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Departure Batch
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                    <Calendar size={16} className="text-emerald-600 shrink-0" />
                    <span className="truncate">{tripSnapshot?.batchDate}</span>
                  </div>
                </div>
              </div>

              {/* Lead Customer Info */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                  <Users size={16} className="text-emerald-600" /> Lead Traveler & Contact
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-semibold">Name</span>
                    <span className="font-extrabold text-slate-900">{customer?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Email</span>
                    <span className="font-extrabold text-slate-900 truncate block">{customer?.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Phone</span>
                    <span className="font-extrabold text-slate-900">{customer?.phone}</span>
                  </div>
                </div>
              </div>

              {/* Co-Travelers list if any */}
              {travelers && travelers.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">
                    Co-Travelers ({travelers.length})
                  </h3>
                  <div className="space-y-2">
                    {travelers.map((t, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900 border border-slate-200">
                        <span>{idx + 1}. {t.name || `Traveler ${idx + 2}`}</span>
                        <span className="text-slate-500">{t.gender}, {t.age} Yrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meeting & Pickup Hub */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
                <MapPin className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">Arrival & Pickup Point</span>
                  <span className="text-xs text-slate-600 font-medium">{tripSnapshot?.pickupPoint}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Pass Status & Payment Matrix */}
            <div className="p-6 md:p-8 flex flex-col justify-between space-y-6 bg-slate-50/50">
              
              {/* Document/QR Visual Area */}
              {isProvisional ? (
                <div className="text-center p-6 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                  <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
                    <Lock size={26} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider">
                      Boarding QR Locked
                    </h4>
                    <p className="text-[11px] text-amber-800 font-medium mt-1">
                      Unlock the official Boarding Pass by completing the balance payment.
                    </p>
                  </div>

                  <button
                    onClick={handlePayRemainingBalance}
                    disabled={isPayingBalance}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPayingBalance ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={14} />
                        <span>Pay Remaining {money(amountOutstanding)}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : isFullyConfirmed ? (
                <div className="text-center">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 block mb-3">
                    Boarding Verification QR
                  </span>
                  
                  {bookingQr ? (
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs inline-block mx-auto mb-2">
                      <img
                        src={bookingQr}
                        alt="Booking Verification QR Code"
                        className="w-44 h-44 object-contain rounded-xl mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-slate-100 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center mx-auto mb-2 text-slate-400">
                      <QrCode size={40} />
                    </div>
                  )}
                  
                  <p className="text-[11px] text-slate-500 font-medium">
                    Verified captain scanning pass for boarding terminal.
                  </p>
                </div>
              ) : <div className="text-sm text-slate-500">No Boarding Pass is available for this booking status.</div>}

              {/* Payment Summary Breakdown */}
              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Total Expedition Cost</span>
                  <span>{money(finalAmount)}</span>
                </div>

                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Amount Paid</span>
                  <span>{money(amountPaid)}</span>
                </div>

                {isProvisional && (
                  <>
                    <div className="flex justify-between text-amber-700 font-black pt-1 border-t border-slate-200">
                      <span>Remaining Balance</span>
                      <span>{money(amountOutstanding)}</span>
                    </div>
                    <div className="text-[10px] text-amber-800 font-bold text-right">
                      Due by: {formattedDueDate}
                    </div>
                  </>
                )}

                <div className="text-[10px] text-slate-400 font-mono text-center pt-2">
                  Status: <strong className="text-slate-800">{booking.bookingStatus}</strong>
                </div>
              </div>

            </div>
          </div>
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
          <h2 className="font-bold text-slate-900 text-lg">Your documents & payments</h2>
          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={() => setShowConfirmationModal(true)} className="px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold">{isProvisional ? 'Provisional Booking Confirmation' : 'Booking Confirmation'}</button>
            {isFullyConfirmed && <button onClick={() => setShowPassModal(true)} className="px-4 py-3 rounded-xl border border-emerald-300 text-emerald-800 text-sm font-semibold">Official Boarding Pass</button>}
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {(booking.payments || []).filter((event) => event.paymentId && event.verifiedAt).map((event) => <div key={event.paymentId} className="flex items-center justify-between gap-4 py-3 text-sm"><div><span className="font-bold">{event.type}</span><span className="text-slate-500 ml-2">{money(numeric(event.amount))} · {new Date(event.verifiedAt).toLocaleDateString('en-IN')}</span></div><button onClick={() => setReceiptPaymentId(event.paymentId)} className="text-emerald-700 font-semibold">Receipt</button></div>)}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/profile"
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            View in My Bookings <ArrowRight size={16} />
          </Link>

          <Link
            to="/destinations"
            className="w-full sm:w-auto px-6 py-3.5 bg-white text-slate-800 text-xs font-bold rounded-2xl hover:bg-slate-50 transition-all border border-slate-200 flex items-center justify-center gap-2"
          >
            Explore More Expeditions
          </Link>
        </div>

      </div>

      {/* Official Boarding Pass Travel Document Modal */}
      <BoardingPassModal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
        bookingId={booking?.bookingId}
        initialBookingData={booking}
      />

      {/* Provisional Booking Confirmation Letter Modal */}
      <ProvisionalBookingModal
        isOpen={showProvisionalModal}
        onClose={() => setShowProvisionalModal(false)}
        bookingId={booking?.bookingId}
        initialBookingData={booking}
        onPayBalance={() => handlePayRemainingBalance()}
      />
      {showConfirmationModal && <BookingConfirmationModal booking={booking} onClose={() => setShowConfirmationModal(false)} />}
      {receiptPaymentId && <PaymentReceiptModal bookingId={booking.bookingId} paymentId={receiptPaymentId} onClose={() => setReceiptPaymentId('')} />}
      {successPayment && <PaymentSuccessModal booking={booking} payment={successPayment} onClose={() => setSuccessPayment(null)} onReceipt={() => { setReceiptPaymentId(successPayment.paymentId); setSuccessPayment(null); }} onConfirmation={() => { setShowConfirmationModal(true); setSuccessPayment(null); }} onBoarding={() => { setShowPassModal(true); setSuccessPayment(null); }} onBookings={() => navigate('/profile')} />}
    </div>
  );
};

export default BookingConfirmation;
