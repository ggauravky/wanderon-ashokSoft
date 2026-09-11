import React from 'react';
import { Calendar, Users, DollarSign, CloudSun, MapPin, Compass, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import PlanHealthCard from './PlanHealthCard';

const WorkspaceOverviewTab = ({ itinerary, onSwitchTab }) => {
  const destination = itinerary?.destination || 'Meghalaya';
  const duration = itinerary?.duration || itinerary?.daysCount || 5;
  const travelers = itinerary?.travelers || 2;
  const days = itinerary?.days || itinerary?.itineraryDays || [];

  // Destination hero image from first day cover or destination asset
  const heroImage = days[0]?.coverMedia?.url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80';
  const budget = itinerary?.totalEstimatedCost || 45000;

  // Extract top highlights from days
  const highlights = days.slice(0, 4).map((d) => {
    const mainAct = d.morning?.[0]?.activity || d.title;
    return {
      dayNum: d.day,
      title: mainAct,
      location: d.locationName || d.morning?.[0]?.location || destination,
      stay: d.stay || `${destination} Verified Stay`
    };
  });

  return (
    <div className="space-y-6">
      {/* Visual Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden aspect-21/9 min-h-[220px] bg-slate-950 border border-slate-200/80 shadow-sm">
        <img
          src={heroImage}
          alt={destination}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider mb-2 w-max border border-white/20">
            <Sparkles size={12} className="text-emerald-400" />
            <span>Curated Expedition Route</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{itinerary?.title}</h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl font-medium line-clamp-2">
            {itinerary?.tagline || `A personalized ${duration}-day travel journey through ${destination}'s most stunning natural and cultural landmarks.`}
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Dates / Duration */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <Calendar size={14} className="text-emerald-600" />
            <span>Duration</span>
          </div>
          <span className="text-base font-black text-slate-900 block">{duration} Days</span>
          <span className="text-[10px] text-slate-500 font-medium">{Math.max(1, duration - 1)} Nights Pace</span>
        </div>

        {/* Travelers */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <Users size={14} className="text-emerald-600" />
            <span>Travelers</span>
          </div>
          <span className="text-base font-black text-slate-900 block">{travelers} Pax</span>
          <span className="text-[10px] text-slate-500 font-medium">{itinerary?.travelStyle || 'Adventure'} Vibe</span>
        </div>

        {/* Budget */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <DollarSign size={14} className="text-emerald-600" />
            <span>Est. Budget</span>
          </div>
          <span className="text-base font-black text-slate-900 block">₹{budget.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500 font-medium">Estimated Total (INR)</span>
        </div>

        {/* Season & Weather */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <CloudSun size={14} className="text-emerald-600" />
            <span>Best Season</span>
          </div>
          <span className="text-base font-black text-slate-900 block truncate">
            {itinerary?.bestTimeToVisit || 'Oct – May'}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold">Optimal Travel Window</span>
        </div>
      </div>

      {/* Plan Health Component */}
      <PlanHealthCard itinerary={itinerary} />

      {/* Route Highlights & Overview Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Trip Highlights & Route Overview
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Chronological summary across days</p>
          </div>
          <button
            type="button"
            onClick={() => onSwitchTab('itinerary')}
            className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Explore Day-by-Day <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {highlights.map((hl) => (
            <div
              key={hl.dayNum}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-start gap-3"
            >
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                D{hl.dayNum}
              </span>
              <div className="truncate">
                <span className="text-xs font-black text-slate-900 block truncate">{hl.title}</span>
                <span className="text-[11px] text-slate-500 block truncate mt-0.5">📍 {hl.location}</span>
                <span className="text-[10px] text-emerald-800 font-bold block truncate mt-0.5">🛏 {hl.stay}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceOverviewTab;
