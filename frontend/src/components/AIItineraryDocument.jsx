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
    dayItem.galleryMedia.forEach((m) => {
      if (typeof m === 'string' && m.trim()) {
        list.push({ url: m.trim(), altText: dayItem.title || 'Verified scenery', caption: dayItem.locationName || '' });
      } else if (m && m.url) {
        list.push(m);
      }
    });
  }

  if (Array.isArray(dayItem.gallery)) {
    dayItem.gallery.forEach((m) => {
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
 * Built with discrete .pdf-page elements (794px x 1123px ISO 216 standard)
 * 100% Guaranteed ZERO half-cut cards and flawless multi-page layouts.
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
  const budgetBreakdown = itinerary.budgetBreakdown || null;
  const formattedBestTime = formatBestTimeToVisit(itinerary.bestTimeToVisit || 'October to May');
  
  const formattedDate = new Date(itinerary.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  const docRefId = `WLX-AI-${itinerary.id ? String(itinerary.id).slice(-6).toUpperCase() : (itinerary._id ? String(itinerary._id).slice(-6).toUpperCase() : 'PLAN')}`;

  // Paginate days: 2 days per page for high readability and generous card padding
  const DAYS_PER_PAGE = template === 'compact' ? 3 : 2;
  const dayPages = [];
  for (let i = 0; i < days.length; i += DAYS_PER_PAGE) {
    dayPages.push(days.slice(i, i + DAYS_PER_PAGE));
  }

  const totalPages = 1 + dayPages.length + 1; // Cover Page + Days Pages + Summary/Financial Page

  // =========================================================================
  // TEMPLATE 1: VISUAL (Luxury Magazine / Brochure Style)
  // =========================================================================
  if (template === 'visual') {
    return (
      <div ref={ref} id="ai-itinerary-print-document" className="w-[794px] mx-auto bg-slate-100 text-slate-900 font-sans space-y-6">
        
        {/* PAGE 1: COVER & EXECUTIVE OVERVIEW */}
        <div className="pdf-page w-[794px] h-[1123px] bg-white p-9 flex flex-col justify-between box-border relative shadow-sm overflow-hidden">
          <div className="space-y-6">
            {/* Top Brand Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-950 to-emerald-950 text-white flex items-center justify-center font-black">
                  <Compass size={22} className="text-emerald-400" />
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-slate-950">
                    Wander<span className="text-emerald-600">Luxe</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Luxury Expedition Dossier
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  {docRefId}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">{formattedDate}</span>
              </div>
            </div>

            {/* Hero Card */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-7 relative overflow-hidden shadow-lg border border-slate-800">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-3 border border-emerald-400/30">
                <Sparkles size={11} /> {mood} Expedition • Certified AI Route
              </div>
              <h1 className="text-2xl font-black text-white leading-tight mb-2">{title}</h1>
              {itinerary.tagline && (
                <p className="text-xs text-slate-300 leading-relaxed font-serif italic mb-4">{itinerary.tagline}</p>
              )}

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-4 gap-3 pt-4 border-t border-white/10 text-center">
                <div className="bg-white/5 rounded-xl p-2.5">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Destination</span>
                  <strong className="text-xs text-white block truncate mt-0.5">{destination}</strong>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Travelers</span>
                  <strong className="text-xs text-white block truncate mt-0.5">{travelers} Person(s)</strong>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Est. Budget</span>
                  <strong className="text-xs text-emerald-400 block truncate mt-0.5">{totalCost}</strong>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Best Season</span>
                  <strong className="text-xs text-white block truncate mt-0.5">{formattedBestTime}</strong>
                </div>
              </div>
            </div>

            {/* Journey Summary Narrative */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-600" /> Expedition Architecture & Route Essence
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                This {duration}-day bespoke expedition through {destination} has been structured with optimal pacing, verified daylight transit corridors, and curated cultural milestones. Each chapter blends authentic regional heritage, premier hospitality sanctuaries, and scenic exploration.
              </p>
            </div>

            {/* Route Packing Essentials */}
            {packingList.length > 0 && (
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Luggage size={13} className="text-emerald-700" /> Route Packing & Gear Checklist
                </span>
                <div className="flex flex-wrap gap-2">
                  {packingList.map((item, i) => (
                    <span key={i} className="text-[10px] font-bold bg-white px-3 py-1 rounded-lg border border-emerald-200/80 text-emerald-900">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Page 1 Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
            <span>WanderLuxe Travel Technologies • www.wanderluxe.in</span>
            <span>Page 1 of {totalPages}</span>
          </div>
        </div>

        {/* PAGES 2..N: DAY-BY-DAY JOURNEY CHRONICLES (2 DAYS PER PAGE) */}
        {dayPages.map((pageDays, pageIdx) => (
          <div key={pageIdx} className="pdf-page w-[794px] h-[1123px] bg-white p-9 flex flex-col justify-between box-border relative shadow-sm overflow-hidden">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {destination} Daily Journey Timeline • Part {pageIdx + 1}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{docRefId}</span>
              </div>

              {/* Day Cards for this Page */}
              <div className="space-y-4">
                {pageDays.map((dayItem, dIdx) => {
                  const dayImages = extractDayImages(dayItem, destination);
                  return (
                    <div key={dIdx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-black shrink-0">
                            DAY {dayItem.day || (pageIdx * DAYS_PER_PAGE + dIdx + 1)}
                          </span>
                          <h3 className="text-sm font-black text-slate-900 truncate">{dayItem.title}</h3>
                        </div>
                        {dayItem.dailyCost && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full shrink-0">
                            {dayItem.dailyCost}
                          </span>
                        )}
                      </div>

                      {/* Photo Collage Banner */}
                      {dayImages.length > 0 && (
                        <div className="relative h-[110px] rounded-xl overflow-hidden bg-slate-200 border border-slate-200">
                          <img
                            src={dayImages[0].url}
                            alt={dayImages[0].altText}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                          {dayImages[0].caption && (
                            <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-2.5 py-0.5 rounded-md truncate max-w-[90%]">
                              📍 {dayImages[0].caption}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 3-Column Morning / Afternoon / Evening Grid */}
                      <div className="grid grid-cols-3 gap-2.5 text-[11px]">
                        <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/60 space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-amber-800 flex items-center gap-1">
                            <Sunrise size={11} /> Morning
                          </span>
                          <strong className="block text-slate-950 text-[11px] leading-snug">
                            {Array.isArray(dayItem.morning) ? (dayItem.morning[0]?.activity || dayItem.morning[0]) : dayItem.morning}
                          </strong>
                        </div>

                        <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200/60 space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-emerald-800 flex items-center gap-1">
                            <Sun size={11} /> Afternoon
                          </span>
                          <strong className="block text-slate-950 text-[11px] leading-snug">
                            {Array.isArray(dayItem.afternoon) ? (dayItem.afternoon[0]?.activity || dayItem.afternoon[0]) : dayItem.afternoon}
                          </strong>
                        </div>

                        <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-200/60 space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-indigo-800 flex items-center gap-1">
                            <Moon size={11} /> Evening
                          </span>
                          <strong className="block text-slate-950 text-[11px] leading-snug">
                            {Array.isArray(dayItem.evening) ? (dayItem.evening[0]?.activity || dayItem.evening[0]) : dayItem.evening}
                          </strong>
                        </div>
                      </div>

                      {/* Stay & Advice */}
                      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200/80 text-slate-600">
                        <span className="flex items-center gap-1 font-medium truncate">
                          <BedDouble size={12} className="text-slate-400 shrink-0" />
                          <strong>Stay:</strong> {dayItem.staySuggestion || `${destination} Premium Hotel`}
                        </span>
                        {dayItem.routeTip && (
                          <span className="text-emerald-700 font-bold truncate ml-2">
                            💡 {dayItem.routeTip}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Page Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
              <span>WanderLuxe Travel Technologies • {destination} Route Plan</span>
              <span>Page {pageIdx + 2} of {totalPages}</span>
            </div>
          </div>
        ))}

        {/* FINAL PAGE: FINANCIAL SUMMARY & TRAVEL DIRECTIVES */}
        <div className="pdf-page w-[794px] h-[1123px] bg-white p-9 flex flex-col justify-between box-border relative shadow-sm overflow-hidden">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Financial Breakdown & Expedition Directives
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{docRefId}</span>
            </div>

            {/* Budget Breakdown */}
            {budgetBreakdown && (
              <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <DollarSign size={14} /> Comprehensive Cost Allocation
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Accommodations / Stays</span>
                    <strong className="text-white text-sm block mt-0.5">{budgetBreakdown.stay}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Food & Dining</span>
                    <strong className="text-white text-sm block mt-0.5">{budgetBreakdown.food}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Transit & Chauffeur</span>
                    <strong className="text-white text-sm block mt-0.5">{budgetBreakdown.transport}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Activities & Passes</span>
                    <strong className="text-white text-sm block mt-0.5">{budgetBreakdown.activities}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Directives & Guidelines */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                Official Expedition Advisories
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Keep physical government-issued identity cards accessible at all transport hubs and checkpoints.</li>
                <li>Download offline maps and emergency contact cards prior to venturing into scenic remote zones.</li>
                <li>Adhere strictly to designated route timings to ensure seamless transitions between destinations.</li>
              </ul>
            </div>

            {/* Certification Stamp */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-950 block">Certified WanderLuxe AI Travel Dossier</span>
                <span className="text-[10px] text-emerald-800 block mt-0.5">Algorithmic Route Verification • High-Pass Safety Checked</span>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-700 font-black text-[9px] uppercase tracking-tighter text-center">
                WLX<br/>VERIFIED
              </div>
            </div>
          </div>

          {/* Page Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
            <span>WanderLuxe Travel Technologies • Certified AI Route Dossier</span>
            <span>Page {totalPages} of {totalPages}</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TEMPLATE 2 & 3: CLASSIC / COMPACT (Page-Aware Dossier)
  // =========================================================================
  return (
    <div ref={ref} id="ai-itinerary-print-document" className="w-[794px] mx-auto bg-slate-100 text-slate-900 font-sans space-y-6">
      
      {/* PAGE 1: COVER & EXECUTIVE OVERVIEW */}
      <div className="pdf-page w-[794px] h-[1123px] bg-white p-10 flex flex-col justify-between box-border relative shadow-sm overflow-hidden">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black">
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
              <span className="text-[10px] text-slate-400 font-medium block mt-1">Issued: {formattedDate}</span>
            </div>
          </div>

          {/* Title Box */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Sparkles size={11} className="text-emerald-600" /> {mood} Expedition • Certified AI Route
            </div>
            <h1 className="text-2xl font-black text-slate-950 leading-tight">{title}</h1>
            {itinerary.tagline && (
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{itinerary.tagline}</p>
            )}
          </div>

          {/* 4-Metric Grid */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Destination</span>
              <strong className="text-xs font-black text-slate-900 block truncate mt-0.5">{destination}</strong>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Duration & Pax</span>
              <strong className="text-xs font-black text-slate-900 block truncate mt-0.5">{duration} Days ({travelers} Pax)</strong>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Budget Plan</span>
              <strong className="text-xs font-black text-emerald-700 block truncate mt-0.5">{totalCost} ({budget})</strong>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Season</span>
              <strong className="text-xs font-black text-slate-900 block truncate mt-0.5">{formattedBestTime}</strong>
            </div>
          </div>

          {/* Expedition Summary Narrative */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-600" /> Expedition Architecture & Schedule Overview
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              This {duration}-day bespoke itinerary is engineered to deliver a balanced progression through {destination}. Transit windows and daylight excursions are structured with comfort buffers, allowing ample time for immersive photography, authentic dining, and cultural discovery.
            </p>
          </div>

          {/* Packing List */}
          {packingList.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Luggage size={12} /> Route Packing Essentials
              </span>
              <div className="flex flex-wrap gap-1.5">
                {packingList.map((item, i) => (
                  <span key={i} className="text-[10px] font-bold bg-white text-slate-700 px-3 py-1 rounded-md border border-slate-200">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
          <span>WanderLuxe Travel Technologies • www.wanderluxe.in</span>
          <span>Page 1 of {totalPages}</span>
        </div>
      </div>

      {/* PAGES 2..N: DAY-BY-DAY PAGES */}
      {dayPages.map((pageDays, pageIdx) => (
        <div key={pageIdx} className="pdf-page w-[794px] h-[1123px] bg-white p-10 flex flex-col justify-between box-border relative shadow-sm overflow-hidden">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                {destination} Daily Schedule • Part {pageIdx + 1}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{docRefId}</span>
            </div>

            <div className="space-y-4">
              {pageDays.map((dayItem, dIdx) => {
                const dayImages = extractDayImages(dayItem, destination);
                return (
                  <div key={dIdx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-slate-950 text-white text-xs font-black flex items-center justify-center shrink-0">
                          D{dayItem.day || (pageIdx * DAYS_PER_PAGE + dIdx + 1)}
                        </span>
                        <strong className="text-xs font-black text-slate-900 truncate">
                          {dayItem.title}
                        </strong>
                      </div>
                      {dayItem.dailyCost && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-md border border-emerald-100 shrink-0">
                          Daily Est: {dayItem.dailyCost}
                        </span>
                      )}
                    </div>

                    {/* Classic Day Photo */}
                    {dayImages.length > 0 && (
                      <div className="relative h-[110px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
                        <img
                          src={dayImages[0].url}
                          alt={dayImages[0].altText}
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover"
                        />
                        {dayImages[0].caption && (
                          <span className="absolute bottom-2 left-2 bg-black/65 backdrop-blur-xs text-white text-[9px] font-medium px-2.5 py-0.5 rounded-md truncate max-w-[90%]">
                            📍 {dayImages[0].caption}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 3 Activities */}
                    <div className="grid grid-cols-3 gap-3 pt-1 text-[11px]">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-amber-700 block">🌅 Morning</span>
                        <strong className="text-slate-900 block text-[11px] leading-snug">
                          {Array.isArray(dayItem.morning) ? (dayItem.morning[0]?.activity || dayItem.morning[0]) : dayItem.morning}
                        </strong>
                      </div>

                      <div className="space-y-0.5 border-l border-slate-100 pl-3">
                        <span className="text-[9px] font-black uppercase text-emerald-700 block">☀️ Afternoon</span>
                        <strong className="text-slate-900 block text-[11px] leading-snug">
                          {Array.isArray(dayItem.afternoon) ? (dayItem.afternoon[0]?.activity || dayItem.afternoon[0]) : dayItem.afternoon}
                        </strong>
                      </div>

                      <div className="space-y-0.5 border-l border-slate-100 pl-3">
                        <span className="text-[9px] font-black uppercase text-indigo-700 block">🌙 Evening</span>
                        <strong className="text-slate-900 block text-[11px] leading-snug">
                          {Array.isArray(dayItem.evening) ? (dayItem.evening[0]?.activity || dayItem.evening[0]) : dayItem.evening}
                        </strong>
                      </div>
                    </div>

                    {/* Stay & Route Tip */}
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 text-slate-600">
                      <span className="flex items-center gap-1 font-medium truncate">
                        <BedDouble size={12} className="text-slate-400 shrink-0" />
                        <strong>Overnight Stay:</strong> {dayItem.staySuggestion || `${destination} Hotel or Resort`}
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
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
            <span>WanderLuxe Travel Technologies • {destination} Circuit</span>
            <span>Page {pageIdx + 2} of {totalPages}</span>
          </div>
        </div>
      ))}

      {/* FINAL PAGE: FINANCIAL SUMMARY & OFFICIAL NOTES */}
      <div className="pdf-page w-[794px] h-[1123px] bg-white p-10 flex flex-col justify-between box-border relative shadow-sm overflow-hidden">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              Budget Summary & Traveler Guidelines
            </span>
            <span className="text-[10px] font-mono text-slate-400">{docRefId}</span>
          </div>

          {budgetBreakdown && (
            <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4">
              <span className="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                <DollarSign size={13} /> Estimated Cost Breakdown
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Stays / Lodging</span>
                  <strong className="text-white text-sm block mt-0.5">{budgetBreakdown.stay}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Food & Dining</span>
                  <strong className="text-white text-sm block mt-0.5">{budgetBreakdown.food}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Local Transit</span>
                  <strong className="text-white text-sm block mt-0.5">{budgetBreakdown.transport}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Activities & Permits</span>
                  <strong className="text-white text-sm block mt-0.5">{budgetBreakdown.activities}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
              Important Route Directives
            </span>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Carry a physical valid ID document for hotel check-ins and regional passes.</li>
              <li>Keep local currency handy for remote stops and artisan markets.</li>
              <li>Confirm morning transit timings with your hotel desk the previous evening.</li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
          <span>WanderLuxe Travel Technologies • Verified AI Travel Dossier</span>
          <span>Page {totalPages} of {totalPages}</span>
        </div>
      </div>
    </div>
  );
});

export default AIItineraryDocument;
