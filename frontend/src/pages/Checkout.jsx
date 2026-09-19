import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Calendar, Users, MapPin, CheckCircle2, Ticket, 
  CreditCard, Tag, ArrowRight, ArrowLeft, Sparkles, AlertCircle, 
  X, Info, Lock, BedDouble, UserCheck, ChevronRight, Check, Edit3, 
  User, Phone, Mail, HelpCircle, QrCode, Smartphone, Clock, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/api.js';
import { loadRazorpayScript } from '../utils/razorpay.js';
import SEOHead from '../components/SEOHead.jsx';

const { createBookingOrderApi, verifyBookingPaymentApi, calculateBookingPricingApi } = apiService;

// Helper to parse departure date and check partial deposit eligibility
const checkPartialEligibility = (batchDateStr, balanceDueDays = 6) => {
  if (!batchDateStr) {
    const fallbackDate = new Date(Date.now() + balanceDueDays * 24 * 60 * 60 * 1000);
    return {
      eligible: true,
      balanceDueDate: fallbackDate,
      daysUntilDeparture: 30,
      reason: '10% deposit now. 90% balance due within 6 days.'
    };
  }

  const match = batchDateStr.match(/(\d{1,2})\s+([A-Za-z]{3})(?:\s*-\s*\d{1,2}\s+[A-Za-z]{3})?,?\s*(\d{4})/);
  let departureDate = null;
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2].toLowerCase().substring(0, 3);
    const year = parseInt(match[3], 10);
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    if (months[monthStr] !== undefined) {
      departureDate = new Date(Date.UTC(year, months[monthStr], day));
    }
  }

  if (!departureDate) {
    const directDate = new Date(batchDateStr);
    if (!isNaN(directDate.getTime())) departureDate = directDate;
  }

  const now = new Date();
  if (!departureDate) {
    const fallbackDate = new Date(now.getTime() + balanceDueDays * 24 * 60 * 60 * 1000);
    return {
      eligible: true,
      balanceDueDate: fallbackDate,
      daysUntilDeparture: 30,
      reason: '10% deposit now. 90% balance due within 6 days.'
    };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDeparture = Math.floor((departureDate.getTime() - now.getTime()) / msPerDay);

  if (daysUntilDeparture <= balanceDueDays) {
    return {
      eligible: false,
      daysUntilDeparture,
      balanceDueDate: null,
      reason: `Partial payment is not available for this departure (only ${Math.max(0, daysUntilDeparture)} day(s) until trip). Full payment is required.`
    };
  }

  const normalDueDate = new Date(now.getTime() + balanceDueDays * msPerDay);
  const maxDueDate = new Date(departureDate.getTime() - 2 * msPerDay);
  const balanceDueDate = normalDueDate < maxDueDate ? normalDueDate : maxDueDate;

  return {
    eligible: true,
    daysUntilDeparture,
    balanceDueDate,
    reason: `10% deposit now. 90% balance due by ${balanceDueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`
  };
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Active Flow Step: 'traveler_details' -> 'review_booking'
  const [activeStep, setActiveStep] = useState('traveler_details');

  // Payment Plan Selection: 'FULL' vs 'PARTIAL'
  const [paymentPlanType, setPaymentPlanType] = useState('FULL');

  // Parse a persisted referral/coupon code from URL query parameters.
  const searchParams = new URLSearchParams(location.search);
  const refCodeFromUrl = searchParams.get('ref') || searchParams.get('coupon') || '';

  // 1. Resolve Initial Booking State from Navigation State or Persisted Draft
  const initialData = useMemo(() => {
    if (location.state && (location.state.tripId || location.state.tripTitle)) {
      return location.state;
    }
    try {
      const saved = localStorage.getItem('wanderluxe_booking_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tripTitle) return parsed;
      }
    } catch (e) {}

    return {};
  }, [location.state]);

  const travelersCount = Math.max(1, parseInt(initialData.travelersCount, 10) || 1);

  // 2. CONTACT DETAILS (Lead Traveler)
  const [leadName, setLeadName] = useState(user?.name || '');
  const [leadEmail, setLeadEmail] = useState(user?.email || '');
  const [leadPhone, setLeadPhone] = useState(user?.phone || '');
  const [leadAge, setLeadAge] = useState('24');
  const [leadGender, setLeadGender] = useState('Male');
  const [pickup, setPickup] = useState(initialData.pickupPoint || '');
  
  // 3. TRAVELER DETAILS (Co-Travelers: Traveler 2..N)
  const [coTravelers, setCoTravelers] = useState(() => {
    const count = Math.max(0, travelersCount - 1);
    return Array.from({ length: count }, (_, i) => ({
      name: '',
      age: '24',
      gender: 'Male'
    }));
  });

  // Keep co-travelers count synchronized if travelersCount changes
  useEffect(() => {
    const requiredCoTravelers = Math.max(0, travelersCount - 1);
    setCoTravelers((prev) => {
      if (prev.length === requiredCoTravelers) return prev;
      const updated = [...prev];
      if (updated.length < requiredCoTravelers) {
        while (updated.length < requiredCoTravelers) {
          updated.push({ name: '', age: '24', gender: 'Male' });
        }
      } else {
        return updated.slice(0, requiredCoTravelers);
      }
      return updated;
    });
  }, [travelersCount]);

  // Update lead info if user object loads asynchronously
  useEffect(() => {
    if (user) {
      if (!leadName) setLeadName(user.name || '');
      if (!leadEmail) setLeadEmail(user.email || '');
      if (!leadPhone) setLeadPhone(user.phone || '');
    }
  }, [user]);

  // 4. Coupon Engine State (server-validated)
  const [couponCode, setCouponCode] = useState(refCodeFromUrl);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // 5. Processing & Error States
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  // Auto apply URL coupon code
  useEffect(() => {
    if (refCodeFromUrl) {
      applyCodeLogic(refCodeFromUrl);
    }
  }, [refCodeFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const perPerson = Number(initialData.perPersonPrice) || 0;
  const subtotal = Number(initialData.subtotal) || (perPerson * travelersCount);
  const finalPayable = Math.max(0, subtotal - discount);

  // Partial Payment Eligibility Calculation
  const partialEligibility = useMemo(() => {
    return checkPartialEligibility(initialData.batchDate, 6);
  }, [initialData.batchDate]);

  const depositAmount = Math.round(finalPayable * 0.10);
  const balanceOutstanding = Math.max(0, finalPayable - depositAmount);

  // Auto reset payment plan if partial becomes ineligible
  useEffect(() => {
    if (!partialEligibility.eligible && paymentPlanType === 'PARTIAL') {
      setPaymentPlanType('FULL');
    }
  }, [partialEligibility, paymentPlanType]);

  // Server-validated coupon application
  const applyCodeLogic = async (codeStr) => {
    if (!codeStr || !codeStr.trim()) return;
    const code = codeStr.trim().toUpperCase();
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const pricingData = await calculateBookingPricingApi({
        tripId: String(initialData.tripSlug || initialData.tripId),
        travelersCount,
        occupancy: initialData.occupancy || 'Double Sharing',
        batchDate: initialData.batchDate,
        couponCode: code
      });

      if (pricingData && pricingData.discount > 0) {
        setDiscount(pricingData.discount);
        const couponLabel = pricingData.validatedCoupon
          ? `${code} (${pricingData.validatedCoupon.discountType === 'percentage' ? pricingData.validatedCoupon.discountValue + '%' : '\u20b9' + pricingData.validatedCoupon.discountValue} OFF)`
          : `${code} (Discount Applied)`;
        setAppliedCoupon(couponLabel);
        setCouponError('');
      } else {
        setDiscount(0);
        setAppliedCoupon('');
        setCouponError('Invalid or expired coupon code. Please try a different code.');
      }
    } catch (err) {
      setDiscount(0);
      setAppliedCoupon('');
      setCouponError(err.message || 'Could not validate coupon. Please try again.');
    } finally {
      setIsApplyingCoupon(false);
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

  const handleCoTravelerChange = (index, field, value) => {
    const updated = [...coTravelers];
    updated[index][field] = value;
    setCoTravelers(updated);
  };

  // Helper: Copy lead traveler surname to co-traveler
  const handleCopySurname = (index) => {
    if (!leadName) return;
    const parts = leadName.trim().split(' ');
    if (parts.length > 1) {
      const surname = parts[parts.length - 1];
      const currentName = coTravelers[index]?.name || '';
      if (!currentName.includes(surname)) {
        handleCoTravelerChange(index, 'name', `${currentName} ${surname}`.trim());
      }
    }
  };

  // 6. Step Transition Validation (Traveler Details -> Review Booking)
  const handleProceedToReview = (e) => {
    if (e) e.preventDefault();
    setPaymentError('');
    const errors = [];

    if (!leadName.trim()) errors.push('Lead Traveler Full Name is required.');
    if (!leadEmail.trim() || !leadEmail.includes('@')) errors.push('Valid Lead Traveler Email is required.');
    if (!leadPhone.trim() || leadPhone.trim().length < 8) errors.push('Valid Contact / WhatsApp Phone Number is required.');

    coTravelers.forEach((ct, idx) => {
      if (!ct.name || !ct.name.trim()) {
        errors.push(`Traveler ${idx + 2} Full Name is required.`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    setActiveStep('review_booking');
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // 7. Payment Execution (Razorpay Full vs 10% Deposit)
  const handleProceedPayment = async () => {
    if (isProcessing) return;
    setPaymentError('');

    if (!isAuthenticated) {
      const draftState = {
        ...initialData,
        leadName,
        leadEmail,
        leadPhone,
        leadAge,
        leadGender,
        pickupPoint: pickup,
        coTravelers,
        paymentPlan: paymentPlanType
      };
      try {
        localStorage.setItem('wanderluxe_booking_draft', JSON.stringify(draftState));
      } catch (e) {}

      navigate('/login', { state: { from: location } });
      return;
    }

    try {
      setIsProcessing(true);

      const isSdkLoaded = await loadRazorpayScript();
      if (!isSdkLoaded) {
        throw new Error('Could not initialize Razorpay SDK. Please check your internet connection and retry.');
      }

      // Authoritative Server-Side Order Creation with Selected Payment Plan
      const orderPayload = {
        tripId: String(initialData.tripId || initialData.tripSlug),
        travelersCount,
        batchId: initialData.batchId,
        batchDate: initialData.batchDate,
        occupancy: initialData.occupancy || 'Double Sharing',
        pickupPoint: pickup,
        paymentPlan: {
          type: paymentPlanType,
          depositPercent: 10,
          balanceDueDays: 6
        },
        leadTraveler: {
          name: leadName.trim(),
          email: leadEmail.trim(),
          phone: leadPhone.trim(),
          age: leadAge,
          gender: leadGender
        },
        coTravelers: coTravelers.map(ct => ({
          name: ct.name.trim(),
          age: ct.age || '24',
          gender: ct.gender || 'Male'
        })),
        couponCode: appliedCoupon ? appliedCoupon.split(' ')[0] : ''
      };

      const orderData = await createBookingOrderApi(orderPayload);
      const razorpayKey = orderData.key || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Payment gateway is not configured. Please contact support.');
      }

      const chargedAmountInr = orderData.amountToPay || (paymentPlanType === 'PARTIAL' ? depositAmount : finalPayable);

      // Configure Official Razorpay Checkout Options
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'WanderLuxe Expeditions',
        description: `${initialData.tripTitle} (${paymentPlanType === 'PARTIAL' ? '10% Deposit' : 'Full Payment'})`,
        image: 'https://images.pexels.com/photos/6239996/pexels-photo-6239996.jpeg',
        order_id: orderData.orderId,
        prefill: {
          name: leadName,
          email: leadEmail,
          contact: leadPhone
        },
        theme: {
          color: '#059669'
        },
        handler: async function (response) {
          try {
            setIsProcessing(true);

            const verifyPayload = {
              bookingId: orderData.bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };

            const verificationResult = await verifyBookingPaymentApi(verifyPayload);

            if (verificationResult.code === 'PAYMENT_PENDING_CAPTURE' || verificationResult.pending) {
              setPaymentError('Payment is authorized by your bank and awaiting settlement. We are verifying it automatically. Check your profile shortly or contact support.');
              setIsProcessing(false);
              return;
            }

            if (verificationResult.success) {
              const event = verificationResult.paymentEvent || verificationResult.booking?.payments?.find((entry) => entry.paymentId === response.razorpay_payment_id);
              if (!event || event.paymentId !== response.razorpay_payment_id) throw new Error('Payment was verified, but its receipt is not yet available. Refresh your booking shortly.');
              try {
                localStorage.removeItem('wanderluxe_booking_draft');
              } catch (e) {}
              navigate(`/booking/confirmation/${orderData.bookingId}`, { replace: true, state: { paymentSuccess: { bookingId: orderData.bookingId, paymentId: event.paymentId, orderId: event.orderId, paymentType: event.type, verified: true } } });
            }
          } catch (verifyErr) {
            console.error('Verification Error:', verifyErr);
            setPaymentError(`Payment verification is still incomplete. Do not retry payment immediately. Contact support with payment reference ${response.razorpay_payment_id || 'from Razorpay'}. ${verifyErr.message || ''}`);
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (resp) {
        setPaymentError(`Payment failed: ${resp.error.description} (Code: ${resp.error.code})`);
        setIsProcessing(false);
      });

      razorpayInstance.open();
    } catch (err) {
      console.error('Payment Initialization Error:', err);
      setPaymentError(err.message || 'Could not initiate checkout.');
      setIsProcessing(false);
    }
  };

  const formattedDueDateStr = partialEligibility.balanceDueDate
    ? new Date(partialEligibility.balanceDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '6 days from booking';

  const amountToChargeToday = paymentPlanType === 'PARTIAL' ? depositAmount : finalPayable;

  if (!initialData.tripId || !initialData.tripTitle || !initialData.batchDate || !perPerson) {
    return <div className="min-h-screen bg-slate-100 px-4 pt-32 text-center"><h1 className="text-2xl font-black text-slate-900">Booking details unavailable</h1><p className="mt-2 text-sm text-slate-600">Choose a live trip and a real departure before checkout.</p><Link to="/destinations" className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Browse available trips</Link></div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-28 bg-slate-100/70 text-slate-800 font-sans">
      <SEOHead
        title={
          activeStep === 'review_booking'
            ? `Review Booking - ${initialData.tripTitle} | WanderLuxe`
            : `Traveler Details - ${initialData.tripTitle} | WanderLuxe`
        }
        description={`Secure checkout for ${initialData.tripTitle}. Choose full payment or pay 10% deposit now.`}
        canonical="/checkout"
      />

      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        
        {/* Step Indicator Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => {
                if (activeStep === 'review_booking') {
                  setActiveStep('traveler_details');
                } else {
                  navigate(`/book/${initialData.tripSlug || initialData.tripId}`, { state: initialData });
                }
              }}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shrink-0 cursor-pointer"
              title="Go back"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                Booking Step {activeStep === 'traveler_details' ? '2 of 3' : '3 of 3'}
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900">
                {activeStep === 'traveler_details' ? 'Traveler & Contact Details' : 'Review Booking & Payment Choice'}
              </h1>
            </div>
          </div>

          {/* Stepper Pills */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
            <Link 
              to={`/book/${initialData.tripSlug || initialData.tripId}`} 
              state={initialData}
              className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-bold"
            >
              <CheckCircle2 size={14} className="text-emerald-600" />
              Dates & Costing
            </Link>
            <ChevronRight size={14} className="text-slate-300" />
            <button
              type="button"
              onClick={() => setActiveStep('traveler_details')}
              className={`flex items-center gap-1.5 font-bold cursor-pointer ${
                activeStep === 'traveler_details' ? 'text-emerald-700 font-black' : 'text-slate-600'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === 'traveler_details' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 font-black'
              }`}>2</span>
              Travelers
            </button>
            <ChevronRight size={14} className="text-slate-300" />
            <span className={`flex items-center gap-1.5 ${
              activeStep === 'review_booking' ? 'text-emerald-700 font-black' : 'text-slate-400 font-bold'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === 'review_booking' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>3</span>
              Review & Pay
            </span>
          </div>
        </div>

        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold space-y-1">
            <div className="flex items-center gap-2 font-black">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>Please fill in the required fields:</span>
            </div>
            <ul className="list-disc list-inside pl-6 space-y-0.5 text-rose-700 font-medium">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {paymentError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{paymentError}</span>
            </div>
            <button onClick={() => setPaymentError('')} className="text-rose-400 hover:text-rose-600">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Guest Banner */}
        {!isAuthenticated && activeStep === 'traveler_details' && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <User size={16} />
              </div>
              <div>
                <span className="font-black text-slate-900 block">Booking as Guest</span>
                <span className="text-slate-500 font-medium">Log in to automatically prefill details and earn WanderCoins reward points.</span>
              </div>
            </div>
            <Link
              to="/login"
              state={{ from: location }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-colors shrink-0 text-center"
            >
              Sign In to Account
            </Link>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 1: TRAVELER & CONTACT DETAILS ENTRY */}
        {/* ============================================================= */}
        {activeStep === 'traveler_details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left 2 Columns: Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* SECTION: CONTACT DETAILS */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <UserCheck size={18} className="text-emerald-600" />
                      CONTACT DETAILS
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Primary lead traveler for booking confirmation & communications.
                    </p>
                  </div>
                  {isAuthenticated && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                      <ShieldCheck size={12} /> Account Prefilled
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="e.g. Gaurav Kumar"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  {/* Email Address (Read-only if logged in) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        Email Address *
                      </label>
                      {isAuthenticated && (
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Lock size={10} /> Verified Email
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => !isAuthenticated && setLeadEmail(e.target.value)}
                      readOnly={isAuthenticated}
                      placeholder="name@example.com"
                      className={`w-full px-4 py-3 border rounded-2xl text-xs font-bold text-slate-900 outline-none transition-all ${
                        isAuthenticated
                          ? 'bg-slate-100/80 border-slate-200 cursor-not-allowed text-slate-600'
                          : 'bg-slate-50 border-slate-200 focus:border-emerald-500 focus:bg-white'
                      }`}
                      required
                    />
                  </div>

                  {/* Phone / WhatsApp */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                      Phone Number (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  {/* Age & Gender */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                        Age
                      </label>
                      <input
                        type="number"
                        min="12"
                        max="85"
                        value={leadAge}
                        onChange={(e) => setLeadAge(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                        Gender
                      </label>
                      <select
                        value={leadGender}
                        onChange={(e) => setLeadGender(e.target.value)}
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white cursor-pointer transition-all"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Boarding Point */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                      Designated Boarding Point *
                    </label>
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: TRAVELER DETAILS (Quantity Based) */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Users size={18} className="text-emerald-600" />
                      TRAVELER DETAILS ({travelersCount} Pax)
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Operational roster for permits, room allotment, and safety manifest.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {coTravelers.length > 0 ? `${coTravelers.length} Co-Traveler(s)` : 'Solo Traveler'}
                  </span>
                </div>

                {/* Traveler 1 (Lead Traveler Preview Card) */}
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <div>
                      <span className="font-black text-slate-900 block">{leadName || 'Lead Traveler'}</span>
                      <span className="text-[11px] text-slate-500 font-medium">Lead Explorer • {leadGender}, {leadAge} yrs</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded-full">
                    Primary Contact
                  </span>
                </div>

                {/* Additional Co-Travelers 2..N */}
                {coTravelers.map((ct, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-black">
                          {idx + 2}
                        </span>
                        Traveler {idx + 2}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopySurname(idx)}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-black cursor-pointer"
                      >
                        + Copy Lead Surname
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={ct.name}
                          onChange={(e) => handleCoTravelerChange(idx, 'name', e.target.value)}
                          placeholder={`e.g. Traveler ${idx + 2} Full Name`}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          min="12"
                          max="85"
                          value={ct.age}
                          onChange={(e) => handleCoTravelerChange(idx, 'age', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                          Gender
                        </label>
                        <select
                          value={ct.gender}
                          onChange={(e) => handleCoTravelerChange(idx, 'gender', e.target.value)}
                          className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Continue to Review CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProceedToReview}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Review & Payment Choice</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: TRIP SUMMARY & PRICE SUMMARY */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* SECTION: TRIP SUMMARY */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                    TRIP SUMMARY
                  </span>
                  <Link
                    to={`/book/${initialData.tripSlug || initialData.tripId}`}
                    state={initialData}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 underline font-black"
                  >
                    Edit Dates
                  </Link>
                </div>

                <div className="flex gap-3">
                  <img
                    src={initialData.tripImage}
                    alt={initialData.tripTitle}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200"
                  />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <MapPin size={10} className="text-emerald-600" /> {initialData.location}
                    </span>
                    <h3 className="text-xs font-black text-slate-900 leading-snug">
                      {initialData.tripTitle}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-bold block">
                      {initialData.duration} • {initialData.occupancy}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Batch Dates:</span>
                    <span className="font-black text-slate-900">{initialData.batchDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Group Size:</span>
                    <span className="font-black text-slate-900">{travelersCount} Pax</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Sharing Type:</span>
                    <span className="font-black text-emerald-700">{initialData.occupancy}</span>
                  </div>
                </div>
              </div>

              {/* SECTION: PRICE SUMMARY */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  PRICE SUMMARY
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Per-Person Price ({initialData.occupancy})</span>
                    <span>₹{perPerson.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Travelers</span>
                    <span>× {travelersCount}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-bold pt-2 border-t border-slate-100">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount ({appliedCoupon})</span>
                      <span>- ₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Taxes & GST (5%)</span>
                    <span className="text-emerald-700 font-bold">Included</span>
                  </div>

                  <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total Expedition Cost</span>
                    <span className="text-emerald-600">₹{finalPayable.toLocaleString()}</span>
                  </div>
                </div>

                {/* Promo Code Box */}
                <div className="pt-2 border-t border-slate-100">
                  {appliedCoupon ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-emerald-600" /> {appliedCoupon}
                      </span>
                      <button onClick={handleRemoveCoupon} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Coupon Code"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 outline-none focus:border-emerald-500"
                        disabled={isApplyingCoupon}
                      />
                      <button
                        type="submit"
                        disabled={isApplyingCoupon || !couponCode}
                        className="px-3 py-2 bg-slate-900 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all cursor-pointer"
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </form>

                  )}
                  {couponError && <p className="text-[10px] text-rose-500 mt-1">{couponError}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleProceedToReview}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Review Booking</span>
                  <ArrowRight size={15} />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 2: REVIEW BOOKING & PAYMENT OPTION SELECTOR */}
        {/* ============================================================= */}
        {activeStep === 'review_booking' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Review Panel Header */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                    FINAL CONFIRMATION
                  </span>
                  <h2 className="text-xl font-black text-slate-900">
                    Review Booking Manifest
                  </h2>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-full text-xs font-black uppercase">
                  Verified Draft
                </span>
              </div>

              {/* Trip & Batch Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trip & Location */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Selected Expedition</span>
                  <div className="flex items-center gap-3">
                    <img
                      src={initialData.tripImage}
                      alt={initialData.tripTitle}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="text-xs font-black text-slate-900">{initialData.tripTitle}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{initialData.location} • {initialData.duration}</p>
                    </div>
                  </div>
                </div>

                {/* Batch & Dates */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Departure Dates</span>
                      <span className="text-sm font-black text-slate-900 block mt-0.5">{initialData.batchDate}</span>
                      <span className="text-[11px] text-emerald-700 font-bold block">{initialData.occupancy}</span>
                    </div>
                    <Link
                      to={`/book/${initialData.tripSlug || initialData.tripId}`}
                      state={initialData}
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-black rounded-xl transition-colors"
                    >
                      Edit Dates
                    </Link>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-200">
                    Pickup: <span className="font-bold text-slate-900">{pickup}</span>
                  </div>
                </div>
              </div>

              {/* Passenger Manifest Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700">
                    Traveler Manifest ({travelersCount} Pax)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveStep('traveler_details')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={13} /> Edit Travelers
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200/80">
                  {/* Lead Traveler */}
                  <div className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                        1
                      </span>
                      <div>
                        <span className="font-black text-slate-900">{leadName}</span>
                        <span className="text-slate-500 text-[11px] ml-1.5">({leadEmail} • {leadPhone})</span>
                      </div>
                    </div>
                    <span className="text-slate-600 font-bold">{leadAge} yrs • {leadGender}</span>
                  </div>

                  {/* Co-Travelers */}
                  {coTravelers.map((ct, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-black">
                          {idx + 2}
                        </span>
                        <span className="font-black text-slate-900">{ct.name}</span>
                      </div>
                      <span className="text-slate-600 font-bold">{ct.age} yrs • {ct.gender}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Matrix */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Price per person ({initialData.occupancy}):</span>
                  <span className="font-bold text-slate-900">₹{perPerson.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Number of Travelers:</span>
                  <span className="font-bold text-slate-900">× {travelersCount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount Applied ({appliedCoupon}):</span>
                    <span>- ₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Taxes (5% GST):</span>
                  <span className="text-emerald-800 font-bold">Included</span>
                </div>

                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Expedition Cost:</span>
                  <span className="text-slate-900">₹{finalPayable.toLocaleString()}</span>
                </div>
              </div>

              {/* ============================================================= */}
              {/* PAYMENT OPTION SELECTOR (FULL vs 10% DEPOSIT) */}
              {/* ============================================================= */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Select Payment Choice
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Server-Authoritative Pricing
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* OPTION A: PAY IN FULL */}
                  <div
                    onClick={() => setPaymentPlanType('FULL')}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                      paymentPlanType === 'FULL'
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                          Option A
                        </span>
                        <h4 className="text-sm font-black text-slate-900">PAY IN FULL</h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Complete payment now & unlock instant Boarding Pass with QR.
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentPlanType === 'FULL' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                      }`}>
                        {paymentPlanType === 'FULL' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 font-medium">Pay Today:</span>
                        <span className="text-lg font-black text-emerald-700">₹{finalPayable.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                        ✓ ₹0 balance due later
                      </span>
                    </div>
                  </div>

                  {/* OPTION B: PAY 10% DEPOSIT NOW */}
                  <div
                    onClick={() => {
                      if (partialEligibility.eligible) {
                        setPaymentPlanType('PARTIAL');
                      }
                    }}
                    className={`p-5 rounded-3xl border-2 transition-all relative flex flex-col justify-between space-y-3 ${
                      !partialEligibility.eligible
                        ? 'border-slate-200 bg-slate-50/70 opacity-70 cursor-not-allowed'
                        : paymentPlanType === 'PARTIAL'
                        ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-500/20 cursor-pointer'
                        : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                            Option B
                          </span>
                          <span className="bg-amber-100 text-amber-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                            10% Deposit
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900">PAY 10% NOW, 90% LATER</h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Reserve seat today with Provisional Confirmation.
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentPlanType === 'PARTIAL' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                      }`}>
                        {paymentPlanType === 'PARTIAL' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80">
                      {partialEligibility.eligible ? (
                        <>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-slate-500 font-medium">Pay Today (10%):</span>
                            <span className="text-lg font-black text-amber-700">₹{depositAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium mt-1">
                            <span>Remaining 90%:</span>
                            <span className="font-bold text-slate-900">₹{balanceOutstanding.toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] text-amber-800 font-bold mt-0.5">
                            Due by: <span className="underline">{formattedDueDateStr}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertTriangle size={14} className="shrink-0" />
                          <span>{partialEligibility.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Important Notice */}
                {paymentPlanType === 'PARTIAL' ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-medium space-y-1">
                    <span className="font-black block">Provisional Booking Notice:</span>
                    <p>
                      Upon paying the 10% deposit (₹{depositAmount.toLocaleString()}), you will receive an official <strong>Provisional Booking Confirmation Letter</strong>. Your final Boarding Pass with captain details unlocks immediately after the remaining balance of ₹{balanceOutstanding.toLocaleString()} is paid.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-medium">
                    <span className="font-black block">Full Payment Confirmation:</span>
                    <p>
                      You are paying the complete trip amount of ₹{finalPayable.toLocaleString()}. Your <strong>Official Boarding Pass & Scannable QR Code</strong> will be unlocked immediately upon successful payment.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 text-xs font-bold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>Razorpay Test Sandbox Enabled • Secure 256-Bit SSL Encrypted</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('traveler_details')}
                  className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-colors cursor-pointer"
                >
                  ← Edit Travelers
                </button>

                <button
                  type="button"
                  onClick={handleProceedPayment}
                  disabled={isProcessing}
                  className={`w-full sm:flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                    paymentPlanType === 'PARTIAL'
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                      : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Opening Secure Checkout...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>
                        {paymentPlanType === 'PARTIAL'
                          ? `Pay 10% Deposit (₹${depositAmount.toLocaleString()})`
                          : `Pay Full Amount (₹${finalPayable.toLocaleString()})`}
                      </span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Checkout;
