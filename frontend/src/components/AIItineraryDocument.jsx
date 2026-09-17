import React from 'react';
import { 
  Compass, MapPin, Calendar, Users, DollarSign, Clock, 
  Sparkles, CheckCircle2, ShieldCheck, Sun, Luggage, BedDouble, 
  Utensils, Moon, Sunrise, ArrowRight, Star, Tag, Check, Award, Camera
} from 'lucide-react';
import { formatBestTimeToVisit, formatCurrency } from '../utils/itineraryFormatters';

/**
 * Normalizes and extracts unique images for an itinerary day
 */
const extractDayImages = (dayItem, destination = '') => {
  if (!dayItem) return [];
  const list = [];

  // 1. Primary cover
  if (dayItem.coverMedia?.url) {
    list.push(dayItem.coverMedia);
  } else if (dayItem.image || dayItem.imageUrl) {
    list.push({
      url: dayItem.image || dayItem.imageUrl,
      altText: dayItem.title || 'Day cover',
      caption: dayItem.locationName || dayItem.location || destination || ''
    });
  }

  // 2. Supporting gallery media
  if (Array.isArray(dayItem.galleryMedia)) {
    dayItem.galleryMedia.forEach(m => {
      if (typeof m === 'string' && m.trim()) {
        list.push({ url: m.trim(), altText: dayItem.title || 'Verified scenery', caption: dayItem.locationName || '' });
      } else if (m && m.url) {
        list.push(m);
      }
    });
  }

  if (Array.isArray(dayItem.gallery)) {
    dayItem.gallery.forEach(m => {
      if (typeof m === 'string' && m.trim()) {
        list.push({ url: m.trim(), altText: dayItem.title || 'Verified scenery', caption: dayItem.locationName || '' });
      } else if (m && m.url) {
        list.push(m);
      }
    });
  }

  // Deduplicate strictly by URL
  const seen = new Set();
  const result = [];
  for (const item of list) {
    const url = item?.url?.trim();
    if (url && !seen.has(url)) {
      seen.add(url);
      result.push({
        url,
        altText: item.altText || dayItem.title || 'Curated travel photography',
        caption: item.caption || dayItem.locationName || dayItem.title || destination || ''
      });
    }
  }
  return result;
};

/**
 * Professional Offscreen / Printable A4 Travel Itinerary Document
 * Canonical coordinate system: 794px width, minimum 1123px height (ISO 216 standard at 96 DPI).
 *
 * Supports 3 Distinct High-Quality Template Styles:
 * 1. 'classic' - Editorial Travel Agency Dossier (balanced whitespace, executive typography)
 * 2. 'visual'  - Modern Luxury Magazine Brochure (rich photography collage, dark hero card)
 * 3. 'compact' - High-Density Route Sheet (2-column grid, compact thumbnail, maximum schedule density)
 */
const AIItineraryDocument = React.forwardRef(({ itinerary, template = 'classic' }, ref) => {
  if (!itinerary) return null;

  const title = itinerary.title || `${itinerary.duration || itinerary.daysCount || 5}-Day Tour Itinerary`;
  const destination = itinerary.destination || 'Expedition Destination';
  const duration = itinerary.duration || itinerary.daysCount || (itinerary.days?.length || 5);
  const travelers = itinerary.travelers || 2;
  const mood = itinerary.travelStyle || itinerary.mood || 'Adventure';
  const budget = itinerary.budgetLevel || 'Moderate';
  const totalCost = itinerary.totalEstimatedCost ? formatCurrency(itinerary.totalEstimatedCost) : 'Estimated';
  const days = itinerary.days || itinerary.itineraryDays || [];
  const packingList = itinerary.packingList || itinerary.packingSuggestions || [];
  const staySuggestions = itinerary.staySuggestions || [];
  const foodSuggestions = itinerary.foodSuggestions || [];
  const localTips = itinerary.localTips || [];
  const budgetBreakdown = itinerary.budgetBreakdown || null;
  const formattedBestTime = formatBestTimeToVisit(itinerary.bestTimeToVisit || 'October to May');
  
  const formattedDate = new Date(itinerary.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  const docRefId = `WLX-AI-${itinerary.id ? String(itinerary.id).slice(-6).toUpperCase() : (itinerary._id ? String(itinerary._id).slice(-6).toUpperCase() : 'PLAN')}`;

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
        <div 
          className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-7 mb-6 relative overflow-hidden shadow-md border border-slate-800"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
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
          <h1 className="text-2xl font-black text-white leading-tight mb-2 break-words">{title}</h1>
          {itinerary.tagline && (
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl break-words">{itinerary.tagline}</p>
          )}

          {/* Quick Metrics Bar with Guaranteed Fit */}
          <div className="grid grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-white/10 text-center">
            <div className="bg-white/5 rounded-xl p-2 min-w-0">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block truncate">Location</span>
              <strong className="text-xs text-white block truncate">{destination}</strong>
            </div>
            <div className="bg-white/5 rounded-xl p-2 min-w-0">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block truncate">Travelers</span>
              <strong className="text-xs text-white block truncate">{travelers} Person(s)</strong>
            </div>
            <div className="bg-white/5 rounded-xl p-2 min-w-0">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block truncate">Est. Budget</span>
              <strong className="text-xs text-emerald-400 block truncate">{totalCost}</strong>
            </div>
            <div className="bg-white/5 rounded-xl p-2 min-w-0">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block truncate">Best Window</span>
              <strong className="text-xs text-white block truncate">{formattedBestTime}</strong>
            </div>
          </div>
        </div>

        {/* Days Itinerary Grid */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-500" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Calendar size={15} className="text-emerald-600" /> Daily Journey Timeline
            </h2>
            <span className="text-[10px] font-bold text-slate-500">{duration} Curated Days</span>
          </div>

          {days.map((dayItem, idx) => {
            const dayImages = extractDayImages(dayItem, destination);
            return (
              <div 
                key={idx} 
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 shadow-2xs space-y-3"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black shrink-0">
                      DAY {dayItem.day || idx + 1}
                    </span>
                    <h3 className="text-xs font-black text-slate-900 truncate">{dayItem.title}</h3>
                  </div>
                  {dayItem.dailyCost && (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full shrink-0">
                      {dayItem.dailyCost}
                    </span>
                  )}
                </div>

                {/* Print-Optimized Multi-Image Collage */}
                {dayImages.length > 0 && (
                  <div className="space-y-1">
                    {dayImages.length >= 3 ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 relative h-[130px] rounded-xl overflow-hidden bg-slate-200">
                          <img
                            src={dayImages[0].url}
                            alt={dayImages[0].altText}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                          {dayImages[0].caption && (
                            <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-md truncate max-w-[85%]">
                              📍 {dayImages[0].caption}
                            </span>
                          )}
                        </div>
                        <div className="col-span-1 flex flex-col gap-2">
                          <div className="relative h-[61px] rounded-lg overflow-hidden bg-slate-200">
                            <img
                              src={dayImages[1].url}
                              alt={dayImages[1].altText}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="relative h-[61px] rounded-lg overflow-hidden bg-slate-200">
                            <img
                              src={dayImages[2].url}
                              alt={dayImages[2].altText}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    ) : dayImages.length === 2 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {dayImages.map((img, i) => (
                          <div key={i} className="relative h-[110px] rounded-xl overflow-hidden bg-slate-200">
                            <img
                              src={img.url}
                              alt={img.altText}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                            {img.caption && (
                              <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-md truncate max-w-[85%]">
                                📍 {img.caption}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative h-[120px] rounded-xl overflow-hidden bg-slate-200">
                        <img
                          src={dayImages[0].url}
                          alt={dayImages[0].altText}
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover"
                        />
                        {dayImages[0].caption && (
                          <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-md truncate max-w-[85%]">
                            📍 {dayImages[0].caption}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-[11px]">
                  <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/60 space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                      <Sunrise size={11} /> Morning
                    </span>
                    {Array.isArray(dayItem.morning) ? (
                      dayItem.morning.map((m, i) => (
                        <div key={i} className="text-slate-800">
                          <strong className="block text-slate-950 text-[11px] leading-snug">{m.activity || m}</strong>
                          {m.description && <span className="text-slate-600 text-[10px] block leading-snug mt-0.5">{m.description}</span>}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-800 leading-snug">{dayItem.morning}</p>
                    )}
                  </div>

                  <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/60 space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                      <Sun size={11} /> Afternoon
                    </span>
                    {Array.isArray(dayItem.afternoon) ? (
                      dayItem.afternoon.map((m, i) => (
                        <div key={i} className="text-slate-800">
                          <strong className="block text-slate-950 text-[11px] leading-snug">{m.activity || m}</strong>
                          {m.description && <span className="text-slate-600 text-[10px] block leading-snug mt-0.5">{m.description}</span>}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-800 leading-snug">{dayItem.afternoon}</p>
                    )}
                  </div>

                  <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-200/60 space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-1">
                      <Moon size={11} /> Evening
                    </span>
                    {Array.isArray(dayItem.evening) ? (
                      dayItem.evening.map((m, i) => (
                        <div key={i} className="text-slate-800">
                          <strong className="block text-slate-950 text-[11px] leading-snug">{m.activity || m}</strong>
                          {m.description && <span className="text-slate-600 text-[10px] block leading-snug mt-0.5">{m.description}</span>}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-800 leading-snug">{dayItem.evening}</p>
                    )}
                  </div>
                </div>

                {/* Stay & Route Advice */}
                <div className="flex items-center justify-between text-[10px] pt-1 text-slate-600 border-t border-slate-200/80">
                  <span className="flex items-center gap-1 font-medium truncate">
                    <BedDouble size={12} className="text-slate-400 shrink-0" />
                    <strong>Stay:</strong> {dayItem.staySuggestion || `${destination} Premium Eco Resort / Hotel`}
                  </span>
                  {dayItem.routeTip && (
                    <span className="text-emerald-700 font-semibold truncate ml-2">
                      💡 {dayItem.routeTip}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Essentials & Cost Breakdown */}
        <div className="space-y-4 mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          {packingList.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Luggage size={13} className="text-slate-700" /> Route Packing Essentials
              </span>
              <div className="flex flex-wrap gap-2">
                {packingList.map((item, i) => (
                  <span key={i} className="text-[10px] font-semibold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {budgetBreakdown ? (
            <div className="p-4 rounded-2xl bg-emerald-950 text-white space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                <DollarSign size={13} /> Estimated Cost Breakdown
              </span>
              <div className="grid grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white/5 min-w-0">
                  <span className="text-[9px] text-slate-400 block truncate">Stays / Lodging</span>
                  <strong className="text-white text-xs block truncate">{budgetBreakdown.stay}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5 min-w-0">
                  <span className="text-[9px] text-slate-400 block truncate">Food & Dining</span>
                  <strong className="text-white text-xs block truncate">{budgetBreakdown.food}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5 min-w-0">
                  <span className="text-[9px] text-slate-400 block truncate">Internal Transit</span>
                  <strong className="text-white text-xs block truncate">{budgetBreakdown.transport}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5 min-w-0">
                  <span className="text-[9px] text-slate-400 block truncate">Activities & Passes</span>
                  <strong className="text-white text-xs block truncate">{budgetBreakdown.activities}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-100 space-y-1 text-slate-700 text-xs">
              <span className="font-black text-slate-900 block text-[11px] uppercase">WanderLuxe Travel Tip</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Always carry a physical government ID and download offline maps before starting remote nature routes.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          <span>WanderLuxe Travel Technologies • www.wanderluxe.in</span>
          <span>Verified AI Travel Dossier • {docRefId}</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TEMPLATE 2: COMPACT (High-Density 2-Column Route Sheet)
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
        <div 
          className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-3"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-black text-xs shrink-0">WLX</span>
            <h1 className="text-lg font-black text-slate-900 truncate">{title}</h1>
          </div>
          <div className="text-right text-[10px] text-slate-500 font-mono shrink-0 ml-4">
            <strong>{docRefId}</strong> • {formattedDate}
          </div>
        </div>

        {/* Compact Parameters Strip */}
        <div 
          className="grid grid-cols-4 gap-2 bg-slate-100 px-3.5 py-2 rounded-xl mb-4 text-[11px] font-bold"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          <div className="min-w-0 truncate">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Destination</span>
            <span className="text-slate-900 truncate block">{destination}</span>
          </div>
          <div className="min-w-0 truncate">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Duration</span>
            <span className="text-slate-900 truncate block">{duration} Days ({travelers} Pax)</span>
          </div>
          <div className="min-w-0 truncate">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Budget</span>
            <span className="text-emerald-700 truncate block">{totalCost} ({budget})</span>
          </div>
          <div className="min-w-0 truncate">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Best Window</span>
            <span className="text-slate-900 truncate block">{formattedBestTime}</span>
          </div>
        </div>

        {/* Compact 2-Column Days Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {days.map((dayItem, idx) => {
            const dayImages = extractDayImages(dayItem, destination);
            const thumb = dayImages[0];
            return (
              <div 
                key={idx} 
                className="p-3 rounded-xl border border-slate-300 bg-slate-50/60 space-y-1.5 min-w-0"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="font-black text-slate-900 text-xs truncate mr-2">
                    Day {dayItem.day || idx + 1}: {dayItem.title}
                  </span>
                  {dayItem.dailyCost && (
                    <span className="text-[10px] text-emerald-700 font-bold shrink-0">{dayItem.dailyCost}</span>
                  )}
                </div>

                {/* Compact Thumbnail Banner */}
                {thumb && (
                  <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200/80">
                    <img
                      src={thumb.url}
                      alt={thumb.altText}
                      crossOrigin="anonymous"
                      className="w-16 h-11 rounded-md object-cover shrink-0"
                    />
                    <div className="text-[9px] space-y-0.5 overflow-hidden flex-1">
                      <span className="font-bold text-slate-900 block truncate">
                        📍 {thumb.caption || dayItem.title}
                      </span>
                      <span className="text-slate-500 block text-[8px] truncate">
                        {thumb.altText}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-[10px] text-slate-700 leading-tight">
                  <div className="truncate">
                    <strong className="text-amber-800">AM:</strong> {Array.isArray(dayItem.morning) ? dayItem.morning.map(m => m.activity || m).join(', ') : dayItem.morning}
                  </div>
                  <div className="truncate">
                    <strong className="text-emerald-800">PM:</strong> {Array.isArray(dayItem.afternoon) ? dayItem.afternoon.map(m => m.activity || m).join(', ') : dayItem.afternoon}
                  </div>
                  <div className="truncate">
                    <strong className="text-indigo-800">EVE:</strong> {Array.isArray(dayItem.evening) ? dayItem.evening.map(m => m.activity || m).join(', ') : dayItem.evening}
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-200/60 text-[9px] text-slate-500 truncate">
                  <strong>Stay:</strong> {dayItem.staySuggestion || `${destination} Hotel`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Compact Footer Strip */}
        <div 
          className="pt-3 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          <span>WanderLuxe Travel Technologies • Route Plan #{docRefId}</span>
          <span>Verified AI Expedition Schedule</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TEMPLATE 3: CLASSIC (Editorial Travel Agency Proposal Dossier - DEFAULT)
  // =========================================================================
  return (
    <div
      ref={ref}
      id="ai-itinerary-print-document"
      className="w-[794px] bg-white text-slate-900 mx-auto p-10 font-sans relative"
      style={{ boxSizing: 'border-box', minHeight: '1123px' }}
    >
      {/* Brand Header */}
      <div 
        className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-6"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
            <Compass size={22} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-slate-900">
              Wander<span className="text-emerald-600">Luxe</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Official Travel Dossier & Plan
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
            {docRefId}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">
            Issued: {formattedDate}
          </span>
        </div>
      </div>

      {/* Main Title & Description */}
      <div className="mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full mb-2 border border-emerald-200">
          <Sparkles size={11} className="text-emerald-600" /> {mood} Expedition • Certified AI Route
        </div>
        <h1 className="text-2xl font-black text-slate-950 leading-tight break-words">{title}</h1>
        {itinerary.tagline && (
          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed break-words">{itinerary.tagline}</p>
        )}
      </div>

      {/* Structured Parameters Box — Balanced 4-Column Grid with Guaranteed Fit */}
      <div 
        className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        <div className="min-w-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Destination</span>
          <strong className="text-xs font-black text-slate-900 block truncate">{destination}</strong>
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Duration & Travelers</span>
          <strong className="text-xs font-black text-slate-900 block truncate">{duration} Days ({travelers} Travelers)</strong>
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Budget Plan</span>
          <strong className="text-xs font-black text-emerald-700 block truncate">{totalCost} ({budget})</strong>
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Recommended Season</span>
          <strong className="text-xs font-black text-slate-900 block truncate">{formattedBestTime}</strong>
        </div>
      </div>

      {/* Daily Schedule */}
      <div className="space-y-4 mb-6">
        <h2 
          className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 flex items-center justify-between"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          <span>Complete Day-by-Day Travel Schedule</span>
          <span className="text-slate-400 font-normal">Morning • Afternoon • Evening</span>
        </h2>

        {days.map((dayItem, idx) => {
          const dayImages = extractDayImages(dayItem, destination);
          return (
            <div 
              key={idx} 
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
              style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-slate-950 text-white text-xs font-black flex items-center justify-center shrink-0">
                    D{dayItem.day || idx + 1}
                  </span>
                  <strong className="text-xs font-black text-slate-900 truncate">
                    {dayItem.title}
                  </strong>
                </div>
                {dayItem.dailyCost && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-100 shrink-0">
                    Daily Est: {dayItem.dailyCost}
                  </span>
                )}
              </div>

              {/* Classic Day Gallery (Clean Print Collage) */}
              {dayImages.length > 0 && (
                <div className="space-y-1">
                  {dayImages.length >= 3 ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 relative h-[120px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
                        <img
                          src={dayImages[0].url}
                          alt={dayImages[0].altText}
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover"
                        />
                        {dayImages[0].caption && (
                          <span className="absolute bottom-1.5 left-1.5 bg-black/65 backdrop-blur-xs text-white text-[9px] font-medium px-2 py-0.5 rounded-md truncate max-w-[85%]">
                            📍 {dayImages[0].caption}
                          </span>
                        )}
                      </div>
                      <div className="col-span-1 flex flex-col gap-2">
                        <div className="relative h-[56px] rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80">
                          <img
                            src={dayImages[1].url}
                            alt={dayImages[1].altText}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="relative h-[56px] rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80">
                          <img
                            src={dayImages[2].url}
                            alt={dayImages[2].altText}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  ) : dayImages.length === 2 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {dayImages.map((img, i) => (
                        <div key={i} className="relative h-[100px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
                          <img
                            src={img.url}
                            alt={img.altText}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                          {img.caption && (
                            <span className="absolute bottom-1.5 left-1.5 bg-black/65 backdrop-blur-xs text-white text-[9px] font-medium px-2 py-0.5 rounded-md truncate max-w-[85%]">
                              📍 {img.caption}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="relative h-[110px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
                      <img
                        src={dayImages[0].url}
                        alt={dayImages[0].altText}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                      {dayImages[0].caption && (
                        <span className="absolute bottom-1.5 left-1.5 bg-black/65 backdrop-blur-xs text-white text-[9px] font-medium px-2 py-0.5 rounded-md truncate max-w-[85%]">
                          📍 {dayImages[0].caption}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-1 text-[11px]">
                {/* Morning */}
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-amber-700 block">🌅 Morning</span>
                  {Array.isArray(dayItem.morning) ? (
                    dayItem.morning.map((act, i) => (
                      <div key={i} className="text-slate-700 leading-snug">
                        <strong className="text-slate-900 block text-[11px] leading-snug">{act.activity || act}</strong>
                        {act.description && <span className="text-slate-500 text-[10px] block leading-snug mt-0.5">{act.description}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-700 leading-snug">{dayItem.morning}</p>
                  )}
                </div>

                {/* Afternoon */}
                <div className="space-y-1 border-l border-slate-100 pl-3 min-w-0">
                  <span className="text-[10px] font-black uppercase text-emerald-700 block">☀️ Afternoon</span>
                  {Array.isArray(dayItem.afternoon) ? (
                    dayItem.afternoon.map((act, i) => (
                      <div key={i} className="text-slate-700 leading-snug">
                        <strong className="text-slate-900 block text-[11px] leading-snug">{act.activity || act}</strong>
                        {act.description && <span className="text-slate-500 text-[10px] block leading-snug mt-0.5">{act.description}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-700 leading-snug">{dayItem.afternoon}</p>
                  )}
                </div>

                {/* Evening */}
                <div className="space-y-1 border-l border-slate-100 pl-3 min-w-0">
                  <span className="text-[10px] font-black uppercase text-indigo-700 block">🌙 Evening</span>
                  {Array.isArray(dayItem.evening) ? (
                    dayItem.evening.map((act, i) => (
                      <div key={i} className="text-slate-700 leading-snug">
                        <strong className="text-slate-900 block text-[11px] leading-snug">{act.activity || act}</strong>
                        {act.description && <span className="text-slate-500 text-[10px] block leading-snug mt-0.5">{act.description}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-700 leading-snug">{dayItem.evening}</p>
                  )}
                </div>
              </div>

              {/* Stay & Route Tip */}
              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 text-slate-600">
                <span className="flex items-center gap-1 font-medium truncate">
                  <BedDouble size={12} className="text-slate-400 shrink-0" />
                  <strong>Overnight Stay:</strong> {dayItem.staySuggestion || `${destination} Boutique Hotel or Homestay`}
                </span>
                {dayItem.routeTip && (
                  <span className="text-emerald-700 font-semibold truncate ml-2">
                    💡 {dayItem.routeTip}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Logistics, Packing & Tips */}
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        {packingList.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Luggage size={12} /> Route Packing Essentials
            </span>
            <div className="flex flex-wrap gap-1.5">
              {packingList.map((item, i) => (
                <span key={i} className="text-[10px] font-bold bg-white text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {budgetBreakdown ? (
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
            <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
              <DollarSign size={12} /> Estimated Cost Breakdown
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-1.5 rounded-lg bg-white/5 min-w-0">
                <span className="text-slate-400 block truncate">Stays / Hotels</span>
                <strong className="text-white text-xs block truncate">{budgetBreakdown.stay}</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-white/5 min-w-0">
                <span className="text-slate-400 block truncate">Food & Dining</span>
                <strong className="text-white text-xs block truncate">{budgetBreakdown.food}</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-white/5 min-w-0">
                <span className="text-slate-400 block truncate">Local Transit</span>
                <strong className="text-white text-xs block truncate">{budgetBreakdown.transport}</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-white/5 min-w-0">
                <span className="text-slate-400 block truncate">Activities & Permits</span>
                <strong className="text-white text-xs block truncate">{budgetBreakdown.activities}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Important Route Advice
            </span>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Carry adequate physical cash as mountain ATMs frequently experience connectivity dropouts.
            </p>
          </div>
        )}
      </div>

      {/* Branded Footer */}
      <div 
        className="pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        <span>WanderLuxe Travel Technologies • Experience Verified Luxury Group Expeditions & Roadtrips</span>
        <span>Plan Ref: {docRefId}</span>
      </div>
      <p 
        className="text-[8px] text-slate-400 text-center mt-2"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        Note: This custom itinerary is synthesized with WanderLuxe Travel Intelligence. Entrance fees, permits, and restaurant bills are estimates and subject to regional seasonal variations.
      </p>
    </div>
  );
});

export default AIItineraryDocument;
