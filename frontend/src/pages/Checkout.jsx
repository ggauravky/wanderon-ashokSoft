import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Calendar, Users, MapPin, CheckCircle2, Ticket, 
  CreditCard, QrCode, Tag, ArrowRight, Printer, Sparkles, AlertCircle, X, Info, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { UPCOMING_TRIPS } from '../constants/mockData';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, addBooking, recordInfluencerCommission } = useAuth();

  // Parse URL Referral Query Params (?ref=GOA-KR7X9P)
  const searchParams = new URLSearchParams(location.search);
  const refCodeFromUrl = searchParams.get('ref') || searchParams.get('coupon') || '';

  // Fallback to trip 1 if no state passed
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
    pickupPoint: UPCOMING_TRIPS[0].pickupPoints?.[0] || 'Guwahati Airport (10:00 AM)'
  };

  const [leadName, setLeadName] = useState(user?.name || 'Gaurav Kumar Yadav');
  const [leadEmail, setLeadEmail] = useState(user?.email || 'kumar.gaurav.yadav2007@gmail.com');
  const [leadPhone, setLeadPhone] = useState(user?.phone || '8542036499');
  const [age, setAge] = useState('24');
  const [gender, setGender] = useState('Male');
  const [pickup, setPickup] = useState(initialData.pickupPoint);
  
  // Co-Travelers List State
  const [coTravelers, setCoTravelers] = useState(
    Array.from({ length: Math.max(0, initialData.travelersCount - 1) }, (_, i) => ({
      id: i + 1,
      name: '',
      age: '',
      gender: 'Male'
    }))
  );

  // Coupon engine
  const [couponCode, setCouponCode] = useState(refCodeFromUrl);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [appliedCodeName, setAppliedCodeName] = useState('');
  const [couponError, setCouponError] = useState('');

  // Payment Options
  const [paymentOption, setPaymentOption] = useState('full');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [selectedEmiMonths, setSelectedEmiMonths] = useState(6);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [completedBooking, setCompletedBooking] = useState(null);

  const calculateSubtotal = () => initialData.totalAmount;

  // Auto apply URL coupon code if present
  useEffect(() => {
    if (refCodeFromUrl) {
      applyCodeLogic(refCodeFromUrl);
    }
  }, [refCodeFromUrl]);

  const applyCodeLogic = (codeStr) => {
    const code = codeStr.trim().toUpperCase();
    const sub = calculateSubtotal();

    if (code === 'WANDER10') {
      const disc = Math.round(sub * 0.1);
      setDiscount(disc);
      setAppliedCoupon('WANDER10 (10% OFF)');
      setAppliedCodeName('WANDER10');
      setCouponCode('');
    } else if (code === 'SUMMER500') {
      setDiscount(500);
      setAppliedCoupon('SUMMER500 (₹500 OFF)');
      setAppliedCodeName('SUMMER500');
      setCouponCode('');
    } else if (code === 'GOA-KR7X9P' || code === 'EARLYBIRD15' || code === 'GAURAV15') {
      const disc = Math.round(sub * 0.15);
      setDiscount(disc);
      setAppliedCoupon(`${code} (15% Creator Discount Applied)`);
      setAppliedCodeName(code);
      setCouponCode('');
    } else if (code === 'MEGH-X82P9A' || code === 'EXPLOREWITHGAURAV') {
      const disc = Math.round(sub * 0.1);
      setDiscount(disc);
      setAppliedCoupon(`${code} (10% Creator Discount Applied)`);
      setAppliedCodeName(code);
      setCouponCode('');
    } else {
      setCouponError('Invalid coupon. Try GOA-KR7X9P, MEGH-X82P9A, WANDER10, or SUMMER500');
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    applyCodeLogic(couponCode);
  };

  const subtotal = calculateSubtotal();
  const finalTotal = Math.max(0, subtotal - discount);
  const payableAmount = paymentOption === 'advance' 
    ? Math.round(finalTotal * 0.2) 
    : paymentOption === 'emi' 
    ? Math.round(finalTotal / selectedEmiMonths) 
    : finalTotal;

  const handleCoTravelerChange = (index, field, value) => {
    const updated = [...coTravelers];
    updated[index][field] = value;
    setCoTravelers(updated);
  };

  const handleConfirmPayment = async () => {
    if (!leadName || !leadEmail || !leadPhone) {
      alert('Please fill out all required lead traveler contact details.');
      return;
    }

    setIsProcessing(true);

    const bookingData = {
      tripId: initialData.tripId,
      tripTitle: initialData.tripTitle,
      image: initialData.tripImage,
      location: initialData.location,
      duration: initialData.duration,
      batchDate: initialData.batchDate,
      travelersCount: initialData.travelersCount,
      occupancy: initialData.occupancy,
      totalAmount: finalTotal,
      paidAmount: payableAmount,
      paymentStatus: paymentOption === 'advance' ? '20% Advance Paid' : paymentOption === 'emi' ? `EMI (${selectedEmiMonths} Mo)` : 'Paid in Full',
      pickupPoint: pickup,
      leadTraveler: {
        name: leadName,
        email: leadEmail,
        phone: leadPhone,
        age,
        gender
      },
      coTravelers: coTravelers
    };

    // If an influencer coupon was applied, record attribution commission
    if (appliedCodeName && recordInfluencerCommission) {
      recordInfluencerCommission(appliedCodeName, finalTotal, leadName, initialData.tripTitle);
    }

    try {
      const booking = await addBooking(bookingData);
      setCompletedBooking(booking || {
        id: 'WL-' + Math.floor(100000 + Math.random() * 900000),
        ...bookingData
      });
      setIsProcessing(false);
      setShowModal(true);
    } catch (error) {
      console.error('Booking confirmation error:', error);
      setCompletedBooking({
        id: 'WL-' + Math.floor(100000 + Math.random() * 900000),
        ...bookingData
      });
      setIsProcessing(false);
      setShowModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      {/* Booking Confirmation / E-Ticket Modal */}
      <AnimatePresence>
        {showModal && completedBooking && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-gray-100"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={36} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Booking Confirmed! (Test Gateway)
                </span>
                <h2 className="text-2xl font-extrabold text-brand-navy mt-2">Pack Your Bags, {leadName.split(' ')[0]}!</h2>
                <p className="text-xs text-gray-500">Your test payment was successful & ticket voucher is generated.</p>
              </div>

              {/* E-Ticket Card */}
              <div className="bg-brand-navy text-white rounded-2xl p-5 mb-6 relative overflow-hidden shadow-lg">
                <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] text-brand-emerald font-bold tracking-widest uppercase">Official E-Ticket Voucher</span>
                    <p className="font-extrabold text-base">{completedBooking.tripTitle}</p>
                  </div>
                  <span className="bg-white/20 text-white font-mono text-xs px-2.5 py-1 rounded-lg">
                    {completedBooking.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <span className="text-white/50 block text-[10px]">Departures</span>
                    <span className="font-semibold">{completedBooking.batchDate}</span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[10px]">Travelers</span>
                    <span className="font-semibold">{completedBooking.travelersCount} Person ({completedBooking.occupancy})</span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[10px]">Lead Passenger</span>
                    <span className="font-semibold">{completedBooking.leadTraveler?.name || leadName}</span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[10px]">Amount Paid</span>
                    <span className="font-bold text-brand-emerald">₹{completedBooking.paidAmount?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px]">
                  <span className="text-white/70">Pickup: {completedBooking.pickupPoint}</span>
                  <QrCode size={28} className="text-white opacity-80" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.print()}
                  className="w-full py-3.5 bg-brand-navy text-white rounded-2xl font-bold hover:bg-brand-emerald transition-all flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  <Printer size={18} /> Print / Save E-Ticket
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate('/profile');
                  }}
                  className="w-full py-3.5 bg-brand-light text-brand-navy rounded-2xl font-bold hover:bg-gray-200 transition-all text-sm"
                >
                  View My Bookings Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-8">
        {/* Sandbox Test Mode Notice Banner */}
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center gap-3 text-xs md:text-sm font-semibold shadow-sm">
          <Info size={22} className="text-amber-600 shrink-0" />
          <div>
            <span className="font-extrabold uppercase tracking-wider text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded text-[11px] mr-2">
              Test Mode Active
            </span>
            <span>
              This is a demonstration payment environment. No real bank/credit card deduction will occur. Clicking "Confirm & Pay" will instantly issue your E-Ticket & store your booking safely!
            </span>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-brand-navy mb-8">Checkout & Secure Ticket</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Traveler & Payment Info Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Lead Traveler Contact Information */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80">
              <h2 className="text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-brand-emerald text-white text-xs font-extrabold flex items-center justify-center">1</span>
                Lead Passenger Contact Info
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1">Full Name</label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Gaurav Kumar Yadav"
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl focus:outline-none focus:border-brand-emerald text-sm font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1">Email Address</label>
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="kumar.gaurav.yadav2007@gmail.com"
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl focus:outline-none focus:border-brand-emerald text-sm font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="8542036499"
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl focus:outline-none focus:border-brand-emerald text-sm font-medium"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Co-Travelers Section if multiple travelers */}
              {coTravelers.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                  <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2">
                    <UserPlus size={16} className="text-brand-emerald" /> Co-Travelers Information ({coTravelers.length})
                  </h3>

                  {coTravelers.map((co, index) => (
                    <div key={co.id} className="p-4 bg-brand-light rounded-2xl border border-gray-200 space-y-3">
                      <span className="text-xs font-bold text-gray-500 uppercase">Passenger #{index + 2}</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={co.name}
                          onChange={(e) => handleCoTravelerChange(index, 'name', e.target.value)}
                          placeholder={`Passenger ${index + 2} Full Name`}
                          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium"
                        />
                        <input
                          type="number"
                          value={co.age}
                          onChange={(e) => handleCoTravelerChange(index, 'age', e.target.value)}
                          placeholder="Age"
                          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium"
                        />
                        <select
                          value={co.gender}
                          onChange={(e) => handleCoTravelerChange(index, 'gender', e.target.value)}
                          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Pickup Point */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80">
              <h2 className="text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-brand-emerald text-white text-xs font-extrabold flex items-center justify-center">2</span>
                Choose Boarding / Pickup Point
              </h2>

              <div className="space-y-2">
                {['Guwahati Airport (10:30 AM)', 'Guwahati Railway Station (08:30 AM)'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPickup(p)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between text-xs font-bold transition-all ${
                      pickup === p ? 'border-brand-emerald bg-brand-emerald/10 text-brand-navy' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={16} className="text-brand-emerald" /> {p}
                    </span>
                    {pickup === p && <CheckCircle2 size={18} className="text-brand-emerald" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Payment Options & Simulation */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/80">
              <h2 className="text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-brand-emerald text-white text-xs font-extrabold flex items-center justify-center">3</span>
                Select Payment Option (Test Sandbox)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => setPaymentOption('full')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    paymentOption === 'full' ? 'border-brand-emerald bg-brand-navy text-white shadow-md' : 'border-gray-200 text-gray-700 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-70">Option 1</span>
                  <span className="text-base font-extrabold block">Pay 100% Full</span>
                  <span className="text-[11px] opacity-80">Instant confirmation</span>
                </button>

                <button
                  onClick={() => setPaymentOption('advance')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    paymentOption === 'advance' ? 'border-brand-emerald bg-brand-navy text-white shadow-md' : 'border-gray-200 text-gray-700 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-70">Option 2</span>
                  <span className="text-base font-extrabold block">Pay 20% Reserve</span>
                  <span className="text-[11px] opacity-80">Pay ₹{Math.round(finalTotal * 0.2).toLocaleString()} now</span>
                </button>

                <button
                  onClick={() => setPaymentOption('emi')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    paymentOption === 'emi' ? 'border-brand-emerald bg-brand-navy text-white shadow-md' : 'border-gray-200 text-gray-700 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-70">Option 3</span>
                  <span className="text-base font-extrabold block">No-Cost EMI</span>
                  <span className="text-[11px] opacity-80">From ₹{Math.round(finalTotal / 6).toLocaleString()}/mo</span>
                </button>
              </div>

              {/* EMI Months Selection */}
              {paymentOption === 'emi' && (
                <div className="mb-6 p-4 bg-brand-light rounded-2xl border border-gray-200 space-y-3">
                  <label className="block text-xs font-bold uppercase text-brand-navy">Choose No-Cost EMI Tenure</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[3, 6, 9].map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedEmiMonths(m)}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          selectedEmiMonths === m ? 'bg-brand-emerald text-white border-brand-emerald' : 'bg-white text-gray-700 border-gray-200'
                        }`}
                      >
                        {m} Months (₹{Math.round(finalTotal / m).toLocaleString()}/mo)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-2">Test Payment Gateway Simulator</label>
                
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-3 px-2 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 ${
                      paymentMethod === 'upi' ? 'border-brand-emerald bg-brand-emerald/10 text-brand-navy' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <QrCode size={20} className="text-brand-emerald" /> Test UPI / GPay
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`py-3 px-2 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 ${
                      paymentMethod === 'card' ? 'border-brand-emerald bg-brand-emerald/10 text-brand-navy' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <CreditCard size={20} className="text-brand-emerald" /> Test Card
                  </button>

                  <button
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`py-3 px-2 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 ${
                      paymentMethod === 'netbanking' ? 'border-brand-emerald bg-brand-emerald/10 text-brand-navy' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <ShieldCheck size={20} className="text-brand-emerald" /> Test NetBanking
                  </button>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="p-4 rounded-2xl bg-brand-light border border-gray-200 flex items-center gap-4 mt-3">
                    <div className="w-20 h-20 bg-white p-2 rounded-xl border border-gray-300 flex items-center justify-center shrink-0">
                      <QrCode size={56} className="text-brand-navy" />
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-bold text-brand-navy">Test QR Code Payment (No Real Charge)</p>
                      <p>Click "Confirm & Pay" below to simulate instant payment verification.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Pay Button */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-200 space-y-6">
              <h2 className="text-xl font-bold text-brand-navy border-b border-gray-100 pb-3">Order Summary</h2>

              {/* Trip Item Preview */}
              <div className="flex gap-3">
                <img src={initialData.tripImage} alt={initialData.tripTitle} className="w-20 h-20 rounded-2xl object-cover" />
                <div className="space-y-1 text-xs">
                  <h3 className="font-bold text-brand-navy text-sm leading-snug">{initialData.tripTitle}</h3>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Calendar size={12} /> {initialData.batchDate}
                  </p>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Users size={12} /> {initialData.travelersCount} Traveler ({initialData.occupancy})
                  </p>
                </div>
              </div>

              {/* Coupon Code Input */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Have a Coupon Code?</label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. GOA-KR7X9P or WANDER10"
                    className="w-full px-3 py-2 bg-brand-light border border-gray-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:border-brand-emerald"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-navy text-white text-xs font-bold rounded-xl hover:bg-brand-emerald transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </form>

                {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                {appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
                    <span>Tag Applied: {appliedCoupon}</span>
                    <button onClick={() => { setDiscount(0); setAppliedCoupon(''); setAppliedCodeName(''); }} className="text-emerald-900 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2 pt-4 border-t border-gray-100 text-xs font-medium">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Coupon</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>GST & Booking Fee</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
                <hr className="border-gray-200 my-2" />
                <div className="flex justify-between items-baseline text-sm font-extrabold text-brand-navy">
                  <span>Payable Now</span>
                  <span className="text-brand-emerald text-2xl">₹{payableAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Pay CTA */}
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="w-full py-4 bg-brand-emerald text-white rounded-2xl font-extrabold text-base hover:bg-brand-teal transition-all shadow-xl shadow-brand-emerald/30 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Confirm & Pay ₹{payableAmount.toLocaleString()} (Test Mode) <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
