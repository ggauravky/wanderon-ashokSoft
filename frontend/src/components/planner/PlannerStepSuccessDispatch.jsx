import React, { useState } from 'react';
import { CheckCircle2, MessageSquare, Send, Share2, Copy, Download, ArrowRight, ShieldCheck, Mountain } from 'lucide-react';
import { getExpeditionProfile } from '../../utils/expeditionPlannerData';

const PlannerStepSuccessDispatch = ({ formData, onReset, onViewOverview, destination = 'Spiti Valley' }) => {
  const [copied, setCopied] = useState(false);
  const duration = formData.duration || 7;
  const profile = getExpeditionProfile(destination, duration);
  const dispatchId = formData.referenceId || formData.dispatchId || 'Pending confirmation';
  const phoneNumber = formData.whatsappNumber || '98160 12345';
  const travelerName = formData.fullName || 'Explorer';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDirectWhatsapp = () => {
    const text = encodeURIComponent(`Hi WanderLuxe Concierge Team! I just planned a ${duration}-day ${destination} expedition (Booking Reference #${dispatchId}) for ${travelerName}. I'd like to review the stays and vehicle arrangements.`);
    window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Floating Badge & Hero Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-white text-emerald-800 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 size={36} className="stroke-[2.5]" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-black uppercase tracking-wider text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Expedition Booking Dispatched · Ref #{dispatchId}
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Your {destination} journey is confirmed! 🏔️
        </h1>

        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
          Hello <span className="font-bold text-slate-900">{travelerName}</span>, our certified {destination} concierge specialist has received your full expedition blueprint and will WhatsApp you within 2 hours.
        </p>

        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Admin notified & all details logged to your travel concierge account.</span>
        </div>
      </div>

      {/* 2-Column Split: Protocol Sequence & Confirmed Blueprint */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: What Happens Next Protocol */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              <span className="text-slate-400">Protocol Sequence /</span> What happens next
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ⚡ Avg. Reply: 38 mins
            </span>
          </div>

          <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
            {/* Step 1 */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                1
              </div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-black text-slate-900">Expert reviews your story</h4>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  Within 2 hrs
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Our valley logistics architect in Kaza inspects road clearance, high-altitude acclimatization tempo, weather forecasts, and inner-line checkpoint permits for your selected dates.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Pass clearance verified
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Acclimatization buffer safe
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                2
              </div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-black text-slate-900">Stay options arrive on WhatsApp</h4>
                <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Curated Gallery
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                You'll receive direct high-res photos, authentic mud-brick architecture notes, and personal host bios for homestays and retreats directly on your smartphone.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  🏠 Bukhari heated rooms
                </span>
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  🌌 Clear night sky balconies
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                3
              </div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-black text-slate-900">You pick, we book</h4>
                <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  100% Flexible
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Confirm your favorite valley hosts with a single reply. We take care of warm Himalayan welcomes, heated bedding, homecooked meals, and trail transfers.
              </p>
            </div>
          </div>

          {/* Selected Dispatch WhatsApp Action */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                Selected Dispatch Number
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-base font-black text-slate-900">+91 {phoneNumber}</span>
                <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                  VERIFIED
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDirectWhatsapp}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Direct WhatsApp Connect</span>
            </button>
          </div>
        </div>

        {/* Right Column: Confirmed Blueprint & Souvenir Card */}
        <div className="lg:col-span-5 space-y-5">
          {/* Confirmed Blueprint Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Confirmed Itinerary Blueprint
              </span>
              <span className="font-mono text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {dispatchId}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 leading-snug">
                {duration}-Day Balanced {destination} Journey
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                {formData.stayPreference || 'Homestays & Stargazing'} • Traditional Living • High Plateau Trails
              </p>
            </div>

            {/* Altitude Trajectory Preview */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
                <span>Elevation Trajectory</span>
                <span className="text-amber-700 font-bold">Max Peak: {profile.peakAltitudeM.toLocaleString()}m</span>
              </div>
              <div className="h-14 w-full flex items-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 240 50" preserveAspectRatio="none">
                  <path d="M 5 40 Q 60 15, 120 30 T 180 8 T 235 40" fill="none" stroke="#10b981" strokeWidth="2.5" />
                  <circle cx="5" cy="40" r="3" fill="#047857" />
                  <circle cx="180" cy="8" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="235" cy="40" r="3" fill="#047857" />
                </svg>
              </div>
            </div>

            {/* 4 Feature Tags Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-bold block">Stay Vibe</span>
                <span className="font-extrabold text-slate-800">{formData.stayPreference || 'Homestay'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-bold block">Dietary</span>
                <span className="font-extrabold text-slate-800">{formData.dietaryPreference || 'Warm Veg / Local'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-bold block">Party Type</span>
                <span className="font-extrabold text-slate-800">{formData.tripType || 'Couple'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-bold block">Season Window</span>
                <span className="font-extrabold text-slate-800">{profile.primeWindow}</span>
              </div>
            </div>
          </div>

          {/* Souvenir Keepsake Postcard Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Souvenir Keepsake
              </span>
              <Share2 size={13} className="text-slate-400" />
            </div>

            <h4 className="text-sm font-black text-slate-900">Share your {destination} Story</h4>

            {/* Postcard Graphic */}
            <div className="relative rounded-2xl overflow-hidden aspect-16/9 bg-slate-900 border border-slate-200">
              <img
                src={profile.heroImage}
                alt={destination}
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">
                  Chapter 01 · {destination} Threshold
                </span>
                <p className="text-xs font-bold leading-tight mt-1">
                  {profile.quote}
                </p>
                <div className="flex items-center justify-between text-[9px] text-slate-300 font-mono mt-2 pt-2 border-t border-white/20">
                  <span>Nomad{destination.replace(/\s+/g, '')} · 2025</span>
                  <span>Altitude: {profile.baseAltitude.split(' ')[0]}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Copy size={12} />
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={handleDirectWhatsapp}
                className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <MessageSquare size={12} />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={onViewOverview}
                className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Mountain size={12} />
                <span>View Route</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Row */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Curiosity still running high? Review high passes, local stories, or refine your circuit.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Explore Another Route
          </button>
          <button
            type="button"
            onClick={onViewOverview}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Itinerary Overview</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlannerStepSuccessDispatch;
