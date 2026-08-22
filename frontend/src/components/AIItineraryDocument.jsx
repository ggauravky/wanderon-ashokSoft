import React from 'react';
import { 
  Compass, MapPin, Calendar, Users, DollarSign, Clock, 
  Sparkles, CheckCircle2, ShieldCheck, Sun, Luggage, BedDouble, 
  Utensils, Moon, Sunrise, ArrowRight, Star, Tag, Check, Award
} from 'lucide-react';

/**
 * Professional Offscreen / Printable A4 Travel Itinerary Document
 * Supports 3 Distinct High-Quality Template Styles:
 * 1. 'classic' - Editorial Travel Agency Dossier
 * 2. 'visual'  - Modern Luxury Magazine Brochure
 * 3. 'compact' - Executive High-Density 2-Column Route Sheet
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
  const docRefId = `WLX-AI-${itinerary.id ? String(itinerary.id).slice(-6).toUpperCase() : 'PLAN'}`;

  // =========================================================================
  // TEMPLATE 1: VISUAL (Luxury Magazine / Brochure Style)
  // =========================================================================
  if (template === 'visual') {
    return (
      <div
        ref={ref}
        id="ai-itinerary-print-document"
        className="w-[794px] bg-white text-slate-900 mx-auto p-8 font-sans relative"
        style={{ boxSizing: 'border-box', minHeight: '1123px' }}
      >
        {/* Top Gradient Hero Cover */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-7 mb-6 relative overflow-hidden shadow-lg border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                <Compass size={20} />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Wander<span className="text-emerald-400">Luxe</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                {docRefId}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">{formattedDate}</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-2 border border-emerald-400/30">
            <Sparkles size={11} /> {mood} Expedition • {duration} Days
          </div>
          <h1 className="text-2xl font-black text-white leading-tight mb-2">{title}</h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">{itinerary.tagline}</p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 pt-4 mt-4 border-t border-white/10 text-center">
            <div className="bg-white/5 rounded-xl p-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Location</span>
              <strong className="text-xs text-white">{destination}</strong>
            </div>
            <div className="bg-white/5 rounded-xl p-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Travelers</span>
              <strong className="text-xs text-white">{travelers} Person(s)</strong>
            </div>
            <div className="bg-white/5 rounded-xl p-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Est. Budget</span>
              <strong className="text-xs text-emerald-400">{totalCost}</strong>
            </div>
            <div className="bg-white/5 rounded-xl p-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Best Window</span>
              <strong className="text-xs text-white">{bestTime}</strong>
            </div>
          </div>
        </div>

        {/* Days Itinerary Grid */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-500">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Calendar size={15} className="text-emerald-600" /> Daily Journey Timeline
            </h2>
            <span className="text-[10px] font-bold text-slate-500">{duration} Handpicked Days</span>
          </div>

          {days.map((dayItem, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black">
                    DAY {dayItem.day || idx + 1}
                  </span>
                  <h3 className="text-xs font-black text-slate-900">{dayItem.title}</h3>
                </div>
                {dayItem.dailyCost && (
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    {dayItem.dailyCost}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                    <Sunrise size={11} /> Morning
                  </span>
                  {Array.isArray(dayItem.morning) ? (
                    dayItem.morning.map((m, i) => (
                      <div key={i} className="text-slate-800">
                        <strong className="block text-slate-950 text-[11px]">{m.activity || m}</strong>
                        {m.description && <span className="text-slate-600 text-[10px] block leading-snug">{m.description}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-800">{dayItem.morning}</p>
                  )}
                </div>

                <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                    <Sun size={11} /> Afternoon
                  </span>
                  {Array.isArray(dayItem.afternoon) ? (
                    dayItem.afternoon.map((m, i) => (
                      <div key={i} className="text-slate-800">
                        <strong className="block text-slate-950 text-[11px]">{m.activity || m}</strong>
                        {m.description && <span className="text-slate-600 text-[10px] block leading-snug">{m.description}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-800">{dayItem.afternoon}</p>
                  )}
                </div>

                <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-200/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-1">
                    <Moon size={11} /> Evening
                  </span>
                  {Array.isArray(dayItem.evening) ? (
                    dayItem.evening.map((m, i) => (
                      <div key={i} className="text-slate-800">
                        <strong className="block text-slate-950 text-[11px]">{m.activity || m}</strong>
                        {m.description && <span className="text-slate-600 text-[10px] block leading-snug">{m.description}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-800">{dayItem.evening}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
                <span><strong>Stay:</strong> {dayItem.stay || 'Verified Boutique Stay'}</span>
                {Array.isArray(dayItem.tips) && dayItem.tips[0] && (
                  <span className="italic text-slate-500">💡 {dayItem.tips[0]}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Visual Supplements: Packing & Budget */}
        <div className="grid grid-cols-2 gap-4 pt-2 mb-6">
          {packingList.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                <Luggage size={13} /> Essential Gear & Packing List
              </span>
              <ul className="grid grid-cols-1 gap-1 text-[11px] text-slate-200">
                {packingList.slice(0, 6).map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {budgetBreakdown ? (
            <div className="p-4 rounded-2xl bg-emerald-950 text-white space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                <DollarSign size={13} /> Estimated Cost Breakdown
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[9px] text-slate-400 block">Stays / Lodging</span>
                  <strong className="text-white text-xs">{budgetBreakdown.stay}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[9px] text-slate-400 block">Food & Dining</span>
                  <strong className="text-white text-xs">{budgetBreakdown.food}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[9px] text-slate-400 block">Internal Transit</span>
                  <strong className="text-white text-xs">{budgetBreakdown.transport}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[9px] text-slate-400 block">Activities & Passes</span>
                  <strong className="text-white text-xs">{budgetBreakdown.activities}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-100 space-y-1 text-slate-700 text-xs">
              <span className="font-black text-slate-900 block text-[11px] uppercase">WanderLuxe Travel Tip</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Always carry a physical government ID and download offline maps before starting remote mountain routes.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
          <span>WanderLuxe Travel Technologies • www.wanderluxe.in</span>
          <span>Verified AI Travel Dossier</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TEMPLATE 2: COMPACT (Executive High-Density 2-Column Route Sheet)
  // =========================================================================
  if (template === 'compact') {
    return (
      <div
        ref={ref}
        id="ai-itinerary-print-document"
        className="w-[794px] bg-white text-slate-900 mx-auto p-6 font-sans text-xs relative"
        style={{ boxSizing: 'border-box', minHeight: '1123px' }}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-black text-xs">WLX</span>
            <h1 className="text-lg font-black text-slate-900">{title}</h1>
          </div>
          <div className="text-right text-[10px] text-slate-500 font-mono">
            <strong>{docRefId}</strong> • {formattedDate}
          </div>
        </div>

        {/* Compact Parameters Strip */}
        <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-xl mb-4 text-[11px] font-bold">
          <span><strong>Destination:</strong> {destination}</span>
          <span><strong>Duration:</strong> {duration} Days ({travelers} Travelers)</span>
          <span><strong>Budget:</strong> {totalCost} ({budget})</span>
          <span><strong>Season:</strong> {bestTime}</span>
        </div>

        {/* Compact 2-Column Days Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {days.map((dayItem, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-slate-300 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="font-black text-slate-900 text-xs">Day {dayItem.day || idx + 1}: {dayItem.title}</span>
                {dayItem.dailyCost && <span className="text-[10px] text-emerald-700 font-bold">{dayItem.dailyCost}</span>}
              </div>

              <div className="space-y-1 text-[10px] text-slate-700">
                <div>
                  <strong className="text-amber-800">AM:</strong> {Array.isArray(dayItem.morning) ? dayItem.morning.map(m => m.activity || m).join(', ') : dayItem.morning}
                </div>
                <div>
                  <strong className="text-emerald-800">PM:</strong> {Array.isArray(dayItem.afternoon) ? dayItem.afternoon.map(m => m.activity || m).join(', ') : dayItem.afternoon}
                </div>
                <div>
                  <strong className="text-indigo-800">EVE:</strong> {Array.isArray(dayItem.evening) ? dayItem.evening.map(m => m.activity || m).join(', ') : dayItem.evening}
                </div>
              </div>

              <div className="pt-1 border-t border-slate-200 text-[9px] text-slate-500 flex justify-between">
                <span><strong>Stay:</strong> {dayItem.stay || 'Hotel'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Essentials Summary */}
        <div className="grid grid-cols-2 gap-3 bg-slate-100 p-3 rounded-xl mb-4 text-[10px]">
          <div>
            <strong className="text-slate-900 block mb-1">🧳 Packing Essentials:</strong>
            <p className="text-slate-600">{packingList.slice(0, 6).join(' • ')}</p>
          </div>
          <div>
            <strong className="text-slate-900 block mb-1">💰 Estimated Budget Breakdown:</strong>
            <p className="text-slate-600">
              Stay: {budgetBreakdown?.stay || '40%'} | Food: {budgetBreakdown?.food || '25%'} | Transit: {budgetBreakdown?.transport || '20%'}
            </p>
          </div>
        </div>

        <div className="text-center text-[9px] text-slate-400 border-t border-slate-200 pt-2">
          WanderLuxe Travel Technologies • Document Reference: {docRefId}
        </div>
      </div>
    );
  }

  // =========================================================================
  // TEMPLATE 3: CLASSIC (Editorial Travel Agency Dossier) - DEFAULT
  // =========================================================================
  return (
    <div
      ref={ref}
      id="ai-itinerary-print-document"
      className="w-[794px] bg-white text-slate-900 mx-auto p-10 font-sans shadow-2xl relative"
      style={{ boxSizing: 'border-box', minHeight: '1123px' }}
    >
      {/* Editorial Header Bar */}
      <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center font-black">
            <Compass size={24} />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-slate-950 block">
              Wander<span className="text-emerald-600">Luxe</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              Official Travel Dossier & Plan
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono font-bold bg-slate-100 px-3 py-1 rounded-md text-slate-800 block mb-0.5 border border-slate-200">
            {docRefId}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Issued: {formattedDate}</span>
        </div>
      </div>

      {/* Main Title & Description */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full mb-2 border border-emerald-200">
          <Sparkles size={11} className="text-emerald-600" /> {mood} Expedition • Certified AI Route
        </div>
        <h1 className="text-2xl font-black text-slate-950 leading-tight">{title}</h1>
        {itinerary.tagline && (
          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{itinerary.tagline}</p>
        )}
      </div>

      {/* Structured Parameters Box */}
      <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Destination</span>
          <span className="text-xs font-black text-slate-900">{destination}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Duration & Travelers</span>
          <span className="text-xs font-black text-slate-900">{duration} Days ({travelers} Travelers)</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Budget Plan</span>
          <span className="text-xs font-black text-emerald-700">{totalCost} ({budget})</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Recommended Season</span>
          <span className="text-xs font-black text-slate-900">{bestTime}</span>
        </div>
      </div>

      {/* Daily Schedule */}
      <div className="space-y-4 mb-6">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 flex items-center justify-between">
          <span>Complete Day-by-Day Travel Schedule</span>
          <span className="text-slate-400 font-normal">Morning • Afternoon • Evening</span>
        </h2>

        {days.map((dayItem, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-slate-950 text-white text-xs font-black flex items-center justify-center shrink-0">
                  D{dayItem.day || idx + 1}
                </span>
                <span className="text-xs font-black text-slate-900">
                  {dayItem.title}
                </span>
              </div>
              {dayItem.dailyCost && (
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-100">
                  Daily Est: {dayItem.dailyCost}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1 text-[11px]">
              {/* Morning */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-700 block">🌅 Morning</span>
                {Array.isArray(dayItem.morning) ? (
                  dayItem.morning.map((act, i) => (
                    <div key={i} className="text-slate-700 leading-snug">
                      <strong className="text-slate-900 block text-[11px]">{act.activity || act}</strong>
                      {act.description && <span className="text-slate-500 text-[10px] block">{act.description}</span>}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-700">{dayItem.morning}</p>
                )}
              </div>

              {/* Afternoon */}
              <div className="space-y-1 border-l border-slate-100 pl-3">
                <span className="text-[10px] font-black uppercase text-emerald-700 block">☀️ Afternoon</span>
                {Array.isArray(dayItem.afternoon) ? (
                  dayItem.afternoon.map((act, i) => (
                    <div key={i} className="text-slate-700 leading-snug">
                      <strong className="text-slate-900 block text-[11px]">{act.activity || act}</strong>
                      {act.description && <span className="text-slate-500 text-[10px] block">{act.description}</span>}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-700">{dayItem.afternoon}</p>
                )}
              </div>

              {/* Evening */}
              <div className="space-y-1 border-l border-slate-100 pl-3">
                <span className="text-[10px] font-black uppercase text-indigo-700 block">🌙 Evening</span>
                {Array.isArray(dayItem.evening) ? (
                  dayItem.evening.map((act, i) => (
                    <div key={i} className="text-slate-700 leading-snug">
                      <strong className="text-slate-900 block text-[11px]">{act.activity || act}</strong>
                      {act.description && <span className="text-slate-500 text-[10px] block">{act.description}</span>}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-700">{dayItem.evening}</p>
                )}
              </div>
            </div>

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

      {/* Practical Supplements */}
      <div className="grid grid-cols-2 gap-4 mb-6 pt-2">
        {packingList.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-800 block mb-2 flex items-center gap-1.5">
              <Luggage size={13} className="text-emerald-600" /> Route Packing Essentials
            </span>
            <ul className="space-y-1 text-[11px] text-slate-700">
              {packingList.slice(0, 5).map((p, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {budgetBreakdown ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-800 block mb-2 flex items-center gap-1.5">
              <DollarSign size={13} className="text-emerald-600" /> Estimated Cost Breakdown
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
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-800 block mb-2 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-600" /> Traveler Advisory
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Verify local mountain passes and weather forecasts before initiating long drives. Keep local cash handy for state checkpoints.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200 text-center space-y-1 text-[9px] text-slate-400">
        <p>
          WanderLuxe Travel Technologies • Experience Verified Luxury Group Expeditions & Roadtrips
        </p>
        <p className="italic">
          Note: This custom itinerary is synthesized with WanderLuxe Travel Intelligence. Entrance fees, permits, and restaurant bills are estimates and subject to regional seasonal variations.
        </p>
      </div>
    </div>
  );
});

export default AIItineraryDocument;
