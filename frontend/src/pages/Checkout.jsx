import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Calendar, Users, MapPin, CheckCircle2, Ticket, 
  CreditCard, Tag, ArrowRight, Sparkles, AlertCircle, X, Info, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UPCOMING_TRIPS } from '../constants/mockData';
import { createBookingOrderApi, verifyBookingPaymentApi } from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Parse URL Referral Query Params (?ref=GOA-KR7X9P)
  const searchParams = new URLSearchParams(location.search);
  const refCodeFromUrl = searchParams.get('ref') || searchParams.get('coupon') || '';

  // Fallback trip data if accessed directly
  const initialData = location.state || {
    tripId: UPCOMING_TRIPS[0].id,
    tripTitle: UPCOMING_TRIPS[0].title,
    tripImage: UPCOMING_TRIPS[0].image,
    location: UPCOMING_TRIPS[0].location,
    duration: UPCOMING_TRIPS[0].duration,
    batchDate: UPCOMING_TRIPS[0].availableBatches[0].dates,
    occupancy: 'Double Sharing',
    travelersCount: 1,
    perPersonPrice: UPCOMING_TRIPS[0].price,
    totalAmount: UPCOMING_TRIPS[0].price,
    pickupPoint: UPCOMING_TRIPS[0].pickupPoints?.[0] || 'Main Airport Hub (10:00 AM)'
  };

  // Lead Traveler Details (Prefilled from authentic authenticated user)
  const [leadName, setLeadName] = useState(user?.name || '');
  const [leadEmail, setLeadEmail] = useState(user?.email || '');
  const [leadPhone, setLeadPhone] = useState(user?.phone || '');
  const [age, setAge] = useState('24');
  const [gender, setGender] = useState('Male');
  const [pickup, setPickup] = useState(initialData.pickupPoint);
  
  // Co-Travelers List State
  const [coTravelers, setCoTravelers] = useState(
    Array.from({ length: Math.max(0, (initialData.travelersCount || 1) - 1) }, (_, i) => ({
      name: '',
      age: '24',
      gender: 'Male',
      phone: ''
    }))
  );

  // Coupon Engine State
  const [couponCode, setCouponCode] = useState(refCodeFromUrl);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');

  // Processing & Payment State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Update lead info if user object loads asynchronously
  useEffect(() => {
    if (user) {
      if (!leadName) setLeadName(user.name || '');
      if (!leadEmail) setLeadEmail(user.email || '');
      if (!leadPhone) setLeadPhone(user.phone || '');
    }
  }, [user]);

  // Auto apply URL coupon code
  useEffect(() => {
    if (refCodeFromUrl) {
      applyCodeLogic(refCodeFromUrl);
    }
  }, [refCodeFromUrl]);

  const applyCodeLogic = (codeStr) => {
    const code = codeStr.trim().toUpperCase();
    const sub = initialData.totalAmount || initialData.perPersonPrice * (initialData.travelersCount || 1);

    if (code === 'WANDER10') {
      const disc = Math.round(sub * 0.1);
      setDiscount(disc);
      setAppliedCoupon('WANDER10 (10% OFF)');
      setCouponError('');
    } else if (code === 'SUMMER500') {
      setDiscount(500);
      setAppliedCoupon('SUMMER500 (₹500 OFF)');
      setCouponError('');
    } else if (code === 'GOA-KR7X9P' || code === 'EARLYBIRD15' || code === 'GAURAV15') {
      const disc = Math.round(sub * 0.15);
      setDiscount(disc);
      setAppliedCoupon(`${code} (15% Creator Discount)`);
      setCouponError('');
    } else if (code === 'MEGH-X82P9A' || code === 'EXPLOREWITHGAURAV') {
      const disc = Math.round(sub * 0.1);
      setDiscount(disc);
      setAppliedCoupon(`${code} (10% Creator Discount)`);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon. Try GOA-KR7X9P, MEGH-X82P9A, WANDER10, or SUMMER500');
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode) return;
    applyCodeLogic(couponCode);
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setAppliedCoupon('');
    setCouponCode('');
    setCouponError('');
  };

  const subtotal = initialData.totalAmount || initialData.perPersonPrice * (initialData.travelersCount || 1);
  const finalPayable = Math.max(1, subtotal - discount);

  const handleCoTravelerChange = (index, field, value) => {
    const updated = [...coTravelers];
    updated[index][field] = value;
    setCoTravelers(updated);
  };

  // Main Razorpay Test Payment Execution
  const handleProceedPayment = async () => {
    setPaymentError('');

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!leadName || !leadEmail || !leadPhone) {
      setPaymentError('Please fill out all required lead traveler contact details.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Ensure Razorpay SDK is loaded
      const isSdkLoaded = await loadRazorpayScript();
      if (!isSdkLoaded) {
        throw new Error('Could not initialize Razorpay SDK. Please check your internet connection and retry.');
      }

      // 2. Authoritative Server-Side Order & Pending Booking Creation
      const orderPayload = {
        tripId: initialData.tripId,
        travelersCount: initialData.travelersCount || 1,
        batchDate: initialData.batchDate,
        occupancy: initialData.occupancy || 'Double Sharing',
        pickupPoint: pickup,
        leadTraveler: {
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          age,
          gender
        },
        coTravelers,
        couponCode: appliedCoupon ? appliedCoupon.split(' ')[0] : ''
      };

      const orderData = await createBookingOrderApi(orderPayload);

      // 3. Configure Official Razorpay Checkout Options
      const options = {
        key: orderData.key || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TPjMsWKDyvGh27',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'WanderLuxe Expeditions',
        description: `${initialData.tripTitle} (${initialData.batchDate})`,
        image: 'https://images.pexels.com/photos/6239996/pexels-photo-6239996.jpeg',
        order_id: orderData.orderId,
        prefill: {
          name: leadName,
          email: leadEmail,
          contact: leadPhone
        },
        theme: {
          color: '#059669' // brand emerald
        },
        handler: async function (response) {
          try {
            setIsProcessing(true);

            // 4. Server-Side Cryptographic Signature Verification
            const verifyPayload = {
              bookingId: orderData.bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };

            const verificationResult = await verifyBookingPaymentApi(verifyPayload);

            if (verificationResult.success) {
              navigate(`/booking/confirmation/${orderData.bookingId}`, { replace: true });
            }
          } catch (verifyErr) {
            console.error('Verification Error:', verifyErr);
            setPaymentError(verifyErr.message || 'Payment signature verification failed.');
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            console.log('Razorpay modal closed by user');
          }
        }
      };

      const rzpWindow = new window.Razorpay(options);
      
      rzpWindow.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response.error);
        setPaymentError(response.error.description || 'Payment was declined or cancelled in test checkout.');
        setIsProcessing(false);
      });

      rzpWindow.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setPaymentError(err.message || 'Failed to initialize payment order. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-brand-light px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-emerald/10 text-brand-emerald text-xs font-bold mb-2">
            <ShieldCheck size={16} /> 256-Bit SSL Encrypted Checkout
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-brand-navy">Review & Secure Booking</h1>
          <p className="text-gray-500 text-sm mt-1">Complete your traveler information and proceed with Razorpay Test Mode</p>
        </div>

        {paymentError && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs md:text-sm font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{paymentError}</span>
            </div>
            <button onClick={() => setPaymentError('')} className="text-rose-400 hover:text-rose-600">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Traveler Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Lead Traveler Info */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80">
              <h2 className="text-lg font-extrabold text-brand-navy mb-4 flex items-center gap-2">
                <Users size={20} className="text-brand-emerald" />
                1. Primary / Lead Traveler Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-brand-navy mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-emerald"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-brand-navy mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-emerald"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-brand-navy mb-1.5">
                    Phone Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-emerald"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-brand-navy mb-1.5">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-emerald"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-brand-navy mb-1.5">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-emerald"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Co-Travelers Details */}
            {coTravelers.length > 0 && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80 space-y-4">
                <h2 className="text-lg font-extrabold text-brand-navy flex items-center gap-2">
                  <Users size={20} className="text-brand-emerald" />
                  2. Additional Co-Travelers ({coTravelers.length})
                </h2>

                {coTravelers.map((t, idx) => (
                  <div key={idx} className="p-4 bg-brand-light rounded-2xl space-y-3">
                    <span className="text-xs font-extrabold text-brand-navy block">Traveler {idx + 2} Details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => handleCoTravelerChange(idx, 'name', e.target.value)}
                          placeholder="Full Name"
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-brand-navy"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={t.age}
                          onChange={(e) => handleCoTravelerChange(idx, 'age', e.target.value)}
                          placeholder="Age"
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-brand-navy"
                        />
                      </div>
                      <div>
                        <select
                          value={t.gender}
                          onChange={(e) => handleCoTravelerChange(idx, 'gender', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-brand-navy"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Pickup Point */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80">
              <h2 className="text-lg font-extrabold text-brand-navy mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-brand-emerald" />
                3. Pickup & Meeting Hub Selection
              </h2>
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Airport / Railway Station Meeting Point"
                className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-emerald"
              />
            </div>
          </div>

          {/* Right Column: Trip Summary, Coupon & Razorpay CTA */}
          <div className="space-y-6">
            {/* Trip Snapshot Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 space-y-4">
              <div className="flex gap-4 items-center">
                <img
                  src={initialData.tripImage}
                  alt={initialData.tripTitle}
                  className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-sm"
                />
                <div>
                  <span className="text-[10px] font-bold text-brand-emerald uppercase tracking-wider block">
                    {initialData.location}
                  </span>
                  <h3 className="text-sm font-extrabold text-brand-navy leading-tight">
                    {initialData.tripTitle}
                  </h3>
                  <span className="text-xs text-gray-500 font-medium block mt-1">
                    {initialData.duration} • {initialData.occupancy}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-brand-light rounded-2xl flex items-center justify-between text-xs font-bold text-brand-navy">
                <div className="flex items-center gap-1.5">
                  <Calendar size={15} className="text-brand-emerald" />
                  <span>Batch Date:</span>
                </div>
                <span>{initialData.batchDate}</span>
              </div>
            </div>

            {/* Coupon Code Box */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 space-y-3">
              <span className="text-xs font-extrabold text-brand-navy uppercase tracking-wider block flex items-center gap-1.5">
                <Tag size={15} className="text-brand-emerald" /> Creator / Promo Coupon
              </span>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} />
                    <span>{appliedCoupon}</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-emerald-500 hover:text-emerald-700">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter Coupon Code"
                    className="flex-1 px-3 py-2.5 bg-brand-light border border-gray-200 rounded-xl text-xs font-bold uppercase text-brand-navy focus:outline-none focus:border-brand-emerald"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-brand-navy text-white text-xs font-bold rounded-xl hover:bg-brand-emerald transition-all"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponError && (
                <p className="text-[11px] text-red-500 font-medium">{couponError}</p>
              )}
            </div>

            {/* Pricing Breakdown & Razorpay Pay Button */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200/80 space-y-4">
              <h3 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider">
                Price Breakdown
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Price per person ({initialData.occupancy})</span>
                  <span>₹{initialData.perPersonPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Total Travelers</span>
                  <span>× {initialData.travelersCount || 1}</span>
                </div>
                <div className="flex justify-between text-gray-700 font-bold pt-2 border-t border-gray-100">
                  <span>Subtotal</span>
                  <span>₹{subtotal?.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Applied</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-brand-navy pt-2 border-t border-gray-200">
                  <span>Final Payable</span>
                  <span className="text-brand-emerald">₹{finalPayable.toLocaleString()}</span>
                </div>
              </div>

              {/* Razorpay Test Mode Badge */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0 text-amber-600" />
                <span>Razorpay Test Mode Active • No Real Cards Charged</span>
              </div>

              {/* Submit Payment CTA */}
              <button
                type="button"
                onClick={handleProceedPayment}
                disabled={isProcessing}
                className="w-full py-4 bg-brand-emerald text-white font-extrabold text-sm rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Pay ₹{finalPayable.toLocaleString()} via Razorpay</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center font-medium">
                Instant confirmation • Verified QR Boarding Pass generated immediately upon payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
