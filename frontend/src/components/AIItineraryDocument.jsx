import React from 'react';
import { 
  Compass, MapPin, Calendar, Users, DollarSign, Clock, 
  Sparkles, CheckCircle2, ShieldCheck, Sun, Luggage, BedDouble, Utensils
} from 'lucide-react';

/**
 * Professional Offscreen / Printable A4 Travel Itinerary Document
 * Supports 3 Templates: 'classic' | 'visual' | 'compact'
 */
const AIItineraryDocument = React.forwardRef(({ itinerary, template = 'classic' }, ref) => {
  if (!itinerary) return null;

  const title = itinerary.title || `${itinerary.duration || itinerary.daysCount || 5}-Day Tour Itinerary`;
  const destination = itinerary.destination || 'Expedition Destination';
  const duration = itinerary.duration || itinerary.daysCount || (itinerary.days?.length || 5);
  const travelers = itinerary.travelers || 2;
  const mood = itinerary.travelStyle || itinerary.mood || 'Adventure';
  const budget = itinerary.budgetLevel || 'Moderate';
  const totalCost = itinerary.totalEstimatedCost ? `₹${Number(itinerary.totalEstimatedCost).toLocaleString()}` : 'Estimated';
  const days = itinerary.days || itinerary.itineraryDays || [];
  const packingList = itinerary.packingList || itinerary.packingSuggestions || [];
  const staySuggestions = itinerary.staySuggestions || [];
  const foodSuggestions = itinerary.foodSuggestions || [];
  const localTips = itinerary.localTips || [];
  const budgetBreakdown = itinerary.budgetBreakdown || null;
  const bestTime = itinerary.bestTimeToVisit || 'October to May';
  const formattedDate = new Date(itinerary.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div
      ref={ref}
      id="ai-itinerary-print-document"
      className={`w-[794px] min-h-[1123px] bg-white text-slate-900 mx-auto p-10 font-sans shadow-2xl relative ${
        template === 'compact' ? 'text-xs p-8' : template === 'visual' ? 'p-10' : 'p-10'
      }`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Document Header Bar */}
      <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center font-black">
            <Compass size={22} />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-950 block">
              Wander<span className="text-emerald-600">Luxe</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              Curated Travel Intelligence
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono font-bold bg-slate-100 px-3 py-1 rounded-md text-slate-700 block mb-0.5">
            DOC-REF: WLX-AI-{itinerary.id ? String(itinerary.id).slice(-6).toUpperCase() : 'PLAN'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Generated: {formattedDate}</span>
        </div>
      </div>

      {/* Visual Template Hero Strip (if visual mode selected) */}
      {template === 'visual' && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-950 to-emerald-950 text-white p-6 relative overflow-hidden">
          <span className="text-[10px] font-mono font-black uppercase text-emerald-400 tracking-wider">
            Custom Designed Journey
          </span>
          <h1 className="text-2xl font-black mt-1 mb-2 leading-tight">{title}</h1>
          <p className="text-xs text-slate-200 font-medium max-w-xl leading-relaxed">{itinerary.tagline}</p>
        </div>
      )}

      {/* Classic / Compact Title */}
      {template !== 'visual' && (
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full mb-2 border border-emerald-200">
            <Sparkles size={11} /> {mood} Expedition Schedule
          </div>
          <h1 className="text-2xl font-black text-slate-950 leading-tight">{title}</h1>
          {itinerary.tagline && (
            <p className="text-xs text-slate-500 font-medium mt-1">{itinerary.tagline}</p>
          )}
        </div>
      )}

      {/* Key Trip Parameters Grid */}
      <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Destination</span>
          <span className="text-xs font-black text-slate-900">{destination}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Duration</span>
          <span className="text-xs font-black text-slate-900">{duration} Days ({travelers} Travelers)</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Estimated Budget</span>
          <span className="text-xs font-black text-emerald-700">{totalCost} ({budget})</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Best Season</span>
          <span className="text-xs font-black text-slate-900">{bestTime}</span>
        </div>
      </div>

      {/* Day by Day Itinerary Schedule */}
      <div className="space-y-4 mb-6">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1">
          Detailed Daily Travel Schedule
        </h2>

        {days.map((dayItem, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-950 text-white text-xs font-black flex items-center justify-center shrink-0">
                  D{dayItem.day || idx + 1}
                </span>
                <span className="text-xs font-black text-slate-900">
                  {dayItem.title}
                </span>
              </div>
              {dayItem.dailyCost && (
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md">
                  Est: {dayItem.dailyCost}
                </span>
              )}
            </div>

            {/* Slots: Morning, Afternoon, Evening */}
            <div className="grid grid-cols-3 gap-3 pt-1 text-[11px]">
              {/* Morning */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-600 block">🌅 Morning</span>
                {Array.isArray(dayItem.morning) ? (
                  dayItem.morning.map((act, i) => (
                    <div key={i} className="text-slate-700 leading-snug">
                      <strong className="text-slate-900 block">{act.activity || act}</strong>
                      {act.description && <span className="text-slate-500 text-[10px]">{act.description}</span>}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-700">{dayItem.morning}</p>
                )}
              </div>

              {/* Afternoon */}
              <div className="space-y-1 border-l border-slate-100 pl-3">
                <span className="text-[10px] font-black uppercase text-emerald-600 block">☀️ Afternoon</span>
                {Array.isArray(dayItem.afternoon) ? (
                  dayItem.afternoon.map((act, i) => (
                    <div key={i} className="text-slate-700 leading-snug">
                      <strong className="text-slate-900 block">{act.activity || act}</strong>
                      {act.description && <span className="text-slate-500 text-[10px]">{act.description}</span>}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-700">{dayItem.afternoon}</p>
                )}
              </div>

              {/* Evening */}
              <div className="space-y-1 border-l border-slate-100 pl-3">
                <span className="text-[10px] font-black uppercase text-indigo-600 block">🌙 Evening</span>
                {Array.isArray(dayItem.evening) ? (
                  dayItem.evening.map((act, i) => (
                    <div key={i} className="text-slate-700 leading-snug">
                      <strong className="text-slate-900 block">{act.activity || act}</strong>
                      {act.description && <span className="text-slate-500 text-[10px]">{act.description}</span>}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-700">{dayItem.evening}</p>
                )}
              </div>
            </div>

            {/* Stay & Tips Row */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[10px] text-slate-500">
              {dayItem.stay && (
                <span><strong>Overnight Stay:</strong> {dayItem.stay}</span>
              )}
              {Array.isArray(dayItem.tips) && dayItem.tips.length > 0 && (
                <span className="text-slate-600 italic">💡 {dayItem.tips[0]}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Supplementary Practical Sections: Packing, Stays & Budget */}
      <div className="grid grid-cols-2 gap-4 mb-6 pt-2">
        {/* Packing List */}
        {packingList.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-black uppercase text-slate-700 block mb-2 flex items-center gap-1">
              <Luggage size={12} className="text-emerald-600" /> Route Packing Essentials
            </span>
            <ul className="space-y-1 text-[11px] text-slate-600">
              {packingList.slice(0, 5).map((p, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Budget Summary Breakdown */}
        {budgetBreakdown ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-black uppercase text-slate-700 block mb-2 flex items-center gap-1">
              <DollarSign size={12} className="text-emerald-600" /> Estimated Cost Breakdown
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Stays / Hotels</span>
                <strong className="text-slate-900">{budgetBreakdown.stay}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Food & Dining</span>
                <strong className="text-slate-900">{budgetBreakdown.food}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Local Transit</span>
                <strong className="text-slate-900">{budgetBreakdown.transport}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Activities & Permits</span>
                <strong className="text-slate-900">{budgetBreakdown.activities}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-black uppercase text-slate-700 block mb-2 flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" /> Important Traveler Advice
            </span>
            <ul className="space-y-1 text-[10px] text-slate-600">
              <li>• Pre-book high-altitude homestays during peak seasons.</li>
              <li>• Carry physical government ID cards (Aadhaar/Passport) for regional checkpoints.</li>
              <li>• Verify weather advisories 48 hours prior to departures.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Footer Legal & Authenticity Bar */}
      <div className="pt-4 border-t border-slate-200 text-center space-y-1 text-[9px] text-slate-400">
        <p>
          WanderLuxe Travel Technologies Private Limited • Experience Luxury Group Travel & Backpacking Expeditions
        </p>
        <p className="italic">
          Note: This custom itinerary is synthesized with WanderLuxe Travel Intelligence. Entrance fees, permits, and restaurant bills are estimates and subject to regional seasonal variations.
        </p>
      </div>
    </div>
  );
});

export default AIItineraryDocument;
