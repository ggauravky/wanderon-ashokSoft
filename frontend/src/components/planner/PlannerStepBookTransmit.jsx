import React, { useState } from 'react';
import { Send, ShieldCheck, User, Mail, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { getExpeditionProfile } from '../../utils/expeditionPlannerData';
import { createLeadApi, saveAIItineraryApi, updateAIItineraryApi } from '../../services/api.js';

const futureTravelMonths = (count = 12) => {
  const formatter = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
    return formatter.format(date);
  });
};

const PlannerStepBookTransmit = ({
  formData,
  updateFormData,
  onTransmitSuccess,
  destination = 'Spiti Valley',
  itinerary,
  plannerContext = {},
  onItinerarySaved
}) => {
  const [fullName, setFullName] = useState(formData.fullName || '');
  const [email, setEmail] = useState(formData.email || '');
  const [whatsappNumber, setWhatsappNumber] = useState(formData.whatsappNumber || '');
  const [travelMonth, setTravelMonth] = useState(formData.flexibleMonth || futureTravelMonths(1)[0]);
  const [expertNote, setExpertNote] = useState(formData.customPreferences || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const duration = formData.duration || 7;
  const profile = getExpeditionProfile(destination, duration);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!whatsappNumber || whatsappNumber.replace(/\D/g, '').length < 10) {
      setSubmitError('Please enter a valid 10-digit WhatsApp phone number so our specialist can transmit your itinerary.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSubmitError('Please enter your real email address. It is required for quotation follow-up and approval links.');
      return;
    }
    if (!itinerary) {
      setSubmitError('Please generate the itinerary before sending it to a specialist.');
      return;
    }
    const persistedId = itinerary._id || itinerary.id;
    if (!/^[a-f\d]{24}$/i.test(String(persistedId || '')) || itinerary?.persistence?.persisted === false) {
      setSubmitError('Your plan has not been safely saved yet. Retry saving the plan before requesting a quotation.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const totalTravelers = (formData.travelers?.adults || 2) +
                           (formData.travelers?.children || 0) +
                           (formData.travelers?.infants || 0) +
                           (formData.travelers?.seniors || 0);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName) {
      setSubmitError('Please enter your full name.');
      setIsSubmitting(false);
      return;
    }

    let savedItinerary = itinerary;
    try {
      const savePayload = {
        ...itinerary,
        plannerContext,
        days: itinerary.days || itinerary.itineraryDays || [],
        guestEditToken: itinerary?.guestAuthorization?.editToken || ''
      };
      if (itinerary._id) {
        savedItinerary = await updateAIItineraryApi(itinerary._id, savePayload);
      } else {
        savedItinerary = await saveAIItineraryApi(savePayload);
      }
      onItinerarySaved?.({ ...itinerary, ...savedItinerary, _id: savedItinerary._id || savedItinerary.id, guestAuthorization: savedItinerary.guestAuthorization || itinerary.guestAuthorization });
    } catch (err) {
      setSubmitError(err.message || 'Could not save the AI itinerary before creating the lead.');
      setIsSubmitting(false);
      return;
    }

    const sourceItineraryId = savedItinerary?._id || savedItinerary?.id;

    const leadPayload = {
      name: cleanName,
      email: cleanEmail,
      phone: whatsappNumber.trim(),
      destination: destination || 'Expedition',
      origin: formData.origin || 'Delhi NCR',
      duration: `${duration} Days`,
      travelMonth,
      travelDate: formData.startDate || '',
      travelParty: formData.tripType || 'Couple',
      travelersCount: totalTravelers,
      stayPreference: formData.stayPreference || 'Homestay',
      roomStyle: formData.roomStyle || 'Double Bed',
      dietaryPreference: formData.dietaryPreference || 'Vegetarian',
      transitPreference: formData.transitMode || 'with_driver',
      pacePreference: formData.pace || 'Balanced',
      acclimatizationPreference: formData.acclimatization || 'gentle',
      interests: formData.interests || [],
      budgetTier: formData.budgetTier || 'Comfort',
      budgetPerPerson: formData.budgetAmount ? `₹${Number(formData.budgetAmount).toLocaleString()}` : '',
      message: expertNote,
      source: 'ai_planner',
      leadType: 'trip_enquiry',
      sourceItineraryId,
      sourceItineraryHandoffToken: savedItinerary?.guestAuthorization?.handoffToken || itinerary?.guestAuthorization?.handoffToken || '',
      priority: 'HIGH',
      topics: ['Customized AI Itinerary', 'Direct WhatsApp Dispatch', `${duration} Days ${destination}`]
    };

    try {
      const res = await createLeadApi(leadPayload);
      const generatedRefId = res?.lead?.referenceId || res?.referenceId || '';
      const finalizedData = {
        fullName: cleanName,
        email: cleanEmail,
        whatsappNumber,
        flexibleMonth: travelMonth,
        customPreferences: expertNote,
        referenceId: generatedRefId,
        sourceItineraryId,
        transmittedAt: new Date().toISOString()
      };
      updateFormData(finalizedData);
      setIsSubmitting(false);
      onTransmitSuccess?.(finalizedData);
    } catch (err) {
      setSubmitError(err.message || 'Could not create the Expert Request. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black uppercase tracking-wider text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Custom Route Architecture
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Your {destination} story is ready 🏔️
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Our expert will arrange your stays using your room, rating & budget picks — options come to you personally on WhatsApp.
        </p>
      </div>

      {/* 2-Column Split: Snapshot & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Your Trip Snapshot */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Your Trip Snapshot</span>
            </h3>
            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
              Loop #419
            </span>
          </div>

          {/* Route Arc Visual Canvas */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 relative overflow-hidden">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-2">
              <span className="text-emerald-700 flex items-center gap-1 font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {destination} Overland Loop
              </span>
              <span className="text-slate-400 font-mono">Highest: {profile.peakAltitudeFt.toLocaleString()} ft</span>
            </div>

            {/* Dynamic Curve SVG */}
            <div className="w-full h-24 relative flex items-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80" preserveAspectRatio="none">
                <path
                  d="M 10 65 Q 70 20, 130 50 T 210 15 T 290 65"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="10" cy="65" r="4.5" fill="#047857" stroke="#ffffff" strokeWidth="2" />
                <circle cx="210" cy="15" r="5.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                <circle cx="290" cy="65" r="4.5" fill="#047857" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 pt-1">
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">Start</span>
              <span className="bg-emerald-700 text-white font-black px-2 py-0.5 rounded shadow-2xs">Peak Pass</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">Exit Loop</span>
            </div>
          </div>

          {/* Tailored Inputs Chips */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Your Tailored Inputs
            </span>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                🗺️ {duration} Days Classic Loop
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                ⚡ {formData.pace || 'Balanced Pace'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                🏡 {formData.stayPreference || 'Homestay Comfort'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                🍲 {formData.dietaryPreference || 'Vegetarian Meals'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                ✨ Curated Highlights
              </span>
            </div>
          </div>

          {/* Elevation Gradient Profile */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase text-emerald-800">
              <span>Elevation Gradient Profile</span>
              <span className="text-emerald-700">● Safe Acclimatization</span>
            </div>
            <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full w-4/5 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Column: Transmission Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
              <Send size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Where should we transmit your itinerary?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                No spams, no calls. Receive your day-by-day plan with vetted vehicle options and customized altitude rest intervals directly.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="transmit-name" className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="transmit-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tenzin Sharma"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/70 rounded-2xl border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="transmit-email" className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <span className="text-[10px] text-slate-400">Required</span>
              </div>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="transmit-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tenzin@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/70 rounded-2xl border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label htmlFor="transmit-phone" className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                WhatsApp Number *
              </label>
              <div className="flex rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/70 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10">
                <div className="px-3.5 py-3 bg-emerald-50 border-r border-slate-200 flex items-center gap-1.5 text-xs font-black text-emerald-800">
                  <span>📱</span>
                  <span>+91</span>
                </div>
                <input
                  id="transmit-phone"
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="98160 12345"
                  className="w-full px-4 py-3 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-1">
                We only message your exact route, accommodation options & permit details.
              </span>
            </div>

            {/* Travel Month */}
            <div>
              <label htmlFor="transmit-month" className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Travel Month *
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  id="transmit-month"
                  value={travelMonth}
                  onChange={(e) => setTravelMonth(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/70 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                >
                  {futureTravelMonths(12).map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expert Note */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="transmit-note" className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Add a note for your expert
                </label>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <textarea
                id="transmit-note"
                rows={2}
                value={expertNote}
                onChange={(e) => setExpertNote(e.target.value)}
                placeholder="e.g. Birthday on Day 4, want a cake stop? or traveling with senior parents"
                className="w-full p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'TRANSMITTING INQUIRY...' : 'SEND MY PLAN'}</span>
              <ArrowRight size={16} />
            </button>
            {submitError && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{submitError}</p>}
          </form>

          {/* Guarantees Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 font-bold pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck size={13} /> No payment now
            </span>
            <span>•</span>
            <span>⚡ Expert replies in 2 hours</span>
            <span>•</span>
            <span>🔄 Free to change plans</span>
          </div>
        </div>
      </div>

      {/* Bottom Trust Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-3 shadow-2xs">
          <span className="text-xl">🚙</span>
          <div>
            <h4 className="text-xs font-black text-slate-900">Verified Local Drivers</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Terrain veteran navigators</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-3 shadow-2xs">
          <span className="text-xl">🏡</span>
          <div>
            <h4 className="text-xs font-black text-slate-900">Handpicked Stays</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Inspected heated rooms & organic hosts</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-3 shadow-2xs">
          <span className="text-xl">📑</span>
          <div>
            <h4 className="text-xs font-black text-slate-900">All Inner-line Permits Handled</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Seamless clearance through checkpoints</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerStepBookTransmit;
