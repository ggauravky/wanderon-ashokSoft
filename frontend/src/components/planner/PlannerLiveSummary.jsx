import React from 'react';
import { ShieldCheck, Mountain, Compass, Sparkles } from 'lucide-react';
import { getExpeditionProfile } from '../../utils/expeditionPlannerData';

const PlannerLiveSummary = ({ formData }) => {
  const destination = formData.destination || 'Spiti Valley';
  const duration = formData.duration || 7;
  const profile = getExpeditionProfile(destination, duration);

  const partyType = formData.tripType || 'Couple';
  const experiences = formData.interests || ['Monasteries', 'Star Gazing', 'Photography'];
  const transit = formData.transportPreference || 'With Driver';
  const rhythm = formData.paceRhythm ? formData.paceRhythm.split(' ')[0] : 'Chill';
  const stay = formData.stayPreference ? formData.stayPreference.replace(/[🏡🏨🛏️]/g, '').trim() : 'Homestay';
  const diet = formData.dietaryPreference || 'Vegetarian';
  const budget = formData.budgetTier || 'Comfort';

  // Format active summary text
  const expText = experiences.slice(0, 3).map((e) => e.charAt(0).toUpperCase() + e.slice(1).replace(/_/g, ' ')).join(', ');

  return (
    <aside className="sticky top-24 space-y-4">
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        {/* Header Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Tailored Itinerary
            </span>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Your Expedition Plan
            </h3>
          </div>
          <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
            {duration} Days Expedition
          </span>
        </div>

        {/* 1. Active Configuration Card */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-800 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Active Configuration</span>
          </div>
          <p className="text-xs font-black text-slate-800 leading-snug">
            {partyType} • {experiences.length} Experiences Curated
          </p>
          <p className="text-[11px] text-emerald-900/80 font-medium line-clamp-1">
            ({expText})
          </p>
          <div className="pt-1.5 flex flex-wrap gap-1 border-t border-emerald-200/60 text-[10px] font-bold text-emerald-800">
            <span className="bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">{transit}</span>
            <span className="bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">{stay}</span>
            <span className="bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">{budget} Tier</span>
          </div>
        </div>

        {/* 2. Topographic Altitude Profile Mini-Chart */}
        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
            <span className="flex items-center gap-1">
              <Mountain size={12} className="text-emerald-600" />
              <span>Altitude Profile</span>
            </span>
            <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Peak: {profile.peakAltitudeM.toLocaleString()}m
            </span>
          </div>

          {/* SVG Elevation Path */}
          <div className="w-full h-16 relative flex items-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 240 55" preserveAspectRatio="none">
              <defs>
                <linearGradient id="liveElevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 5 45 Q 60 20, 110 32 T 175 10 T 235 45 L 235 55 L 5 55 Z"
                fill="url(#liveElevGrad)"
              />
              <path
                d="M 5 45 Q 60 20, 110 32 T 175 10 T 235 45"
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="5" cy="45" r="3" fill="#047857" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="110" cy="32" r="3" fill="#047857" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="175" cy="10" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="235" cy="45" r="3" fill="#047857" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span>{profile.stops[0]?.elevationLabel || '2,276m'}</span>
            <span className="text-amber-800 font-bold">Summit Pass</span>
            <span>{profile.stops[profile.stops.length - 1]?.elevationLabel || '2,050m'}</span>
          </div>
        </div>

        {/* 3. Detailed Itinerary Progression Arc (D1 to DN) */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Detailed Itinerary Arc
          </span>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {profile.stops.map((stop) => (
              <div
                key={stop.day}
                className={`p-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
                  stop.isKeyStage
                    ? 'bg-amber-50/60 border-amber-200/80 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-5 h-5 rounded-md font-mono text-[10px] font-black flex items-center justify-center shrink-0 ${
                      stop.isKeyStage
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {String(stop.day).padStart(2, '0')}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-slate-800 block truncate text-[11px]">
                      {stop.name}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      {stop.details}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 block">
                    {stop.distance.split('·')[0]}
                  </span>
                  {stop.isKeyStage && (
                    <span className="text-[8px] font-black uppercase bg-emerald-700 text-white px-1 py-0.2 rounded">
                      HUB
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Trust Perks List */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-600 font-medium">
          <div className="flex items-start gap-2 text-emerald-800">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>All high-altitude inner-line permits included automatically</span>
          </div>
          <div className="flex items-start gap-2 text-slate-600">
            <Sparkles size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>Stays and transport calibrated for {partyType} party</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PlannerLiveSummary;
