import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  BookOpen, Sparkles, Clock, Copy, Check, MapPin, 
  ArrowRight, ArrowLeft, Volume2, 
  Quote, ChevronDown, ChevronUp,
  CheckCircle2, Flame, Calendar, Send, Eye,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getExpeditionProfile } from '../../utils/expeditionPlannerData';

/**
 * Generates a CONCISE day summary for interactive story cards
 */
const generateDaySummary = (dayItem, dayIndex, destination, profile) => {
  const dayNum = dayItem?.day || dayIndex + 1;
  const title = dayItem?.title?.replace(/^Day\s*\d+:\s*/i, '') || `Journey of Day ${dayNum}`;
  const location = dayItem?.locationName || dayItem?.location || destination;

  const getActivity = (period) => {
    if (Array.isArray(dayItem?.[period]) && dayItem[period][0]) {
      return dayItem[period][0].activity || dayItem[period][0].name || dayItem[period][0];
    }
    if (typeof dayItem?.[period] === 'string') return dayItem[period];
    return null;
  };

  const morningAct = getActivity('morning') || 'early morning expedition';
  const afternoonAct = getActivity('afternoon') || 'midday exploration';
  const eveningAct = getActivity('evening') || 'twilight gathering';

  const stay = dayItem?.staySuggestion || dayItem?.stay || `${destination} Retreat`;
  const tip = dayItem?.routeTip || dayItem?.tips?.[0] || 'Take in the quiet rhythm of the evening.';

  const summary = `Start with ${morningAct} as ${location} awakens. The afternoon brings ${afternoonAct}. Wind down with ${eveningAct} before retiring to ${stay}.`;

  const moodLine = destination.toLowerCase().includes('ladakh') || destination.toLowerCase().includes('spiti')
    ? '🏔️ Crisp mountain air, prayer flags'
    : destination.toLowerCase().includes('chennai') || destination.toLowerCase().includes('goa') || destination.toLowerCase().includes('kerala')
    ? '🌊 Ocean breeze, coastal flavors'
    : destination.toLowerCase().includes('varanasi')
    ? '🛕 Temple bells, evening aarti'
    : `✨ ${location}'s unique charm`;

  const quote = dayNum === 1
    ? `"Every grand journey begins with stepping into the unknown wonder of ${destination}."`
    : dayNum === 2
    ? `"In ${location}, time becomes an expansive horizon."`
    : `"Under the vast skies of ${location}, every breath becomes a memory."`;

  return {
    dayNum,
    title,
    location,
    stay,
    tip,
    summary,
    moodLine,
    quote,
    morningAct,
    afternoonAct,
    eveningAct,
    image: dayItem?.image || dayItem?.coverMedia?.url || (profile?.heroImages?.[(dayNum - 1) % (profile?.heroImages?.length || 1)]),
    imageCaption: dayItem?.locationName || dayItem?.title || `${location} Panorama`
  };
};

const WorkspaceStoryTab = ({
  itinerary,
  onSwitchTab,
  onReserve,
  onDownloadPdf
}) => {
  const [activeChapter, setActiveChapter] = useState(0);
  const [copied, setCopied] = useState(false);
  const [visitedChapters, setVisitedChapters] = useState(new Set([0]));
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const carouselRef = useRef(null);

  const destination = itinerary?.destination || 'Expedition Destination';
  const duration = itinerary?.duration || itinerary?.daysCount || itinerary?.days?.length || 5;
  const travelers = itinerary?.travelers || 2;
  const mood = itinerary?.travelStyle || itinerary?.mood || 'Adventure';
  const profile = getExpeditionProfile(destination, duration);
  const rawDays = itinerary?.days || itinerary?.itineraryDays || [];
  const days = (rawDays.length === duration && rawDays.length > 0)
    ? rawDays
    : (profile.stops || []).map((stop, idx) => ({
        day: idx + 1,
        title: stop.name || `Day ${idx + 1}`,
        locationName: stop.famousPlace || destination,
        image: stop.photo || profile.heroImage,
        morning: stop.activities?.[0] ? [{ activity: stop.activities[0] }] : undefined,
        afternoon: stop.activities?.[1] ? [{ activity: stop.activities[1] }] : undefined,
        evening: stop.activities?.[2] ? [{ activity: stop.activities[2] }] : undefined,
        stay: `${destination} Boutique Stay & Suites`,
        routeTip: stop.roadCondition || stop.details
      }));

  const storyChapters = useMemo(
    () => days.map((day, idx) => generateDaySummary(day, idx, destination, profile)),
    [days, destination, profile]
  );

  const fullStoryText = useMemo(() => `
📖 THE ${destination.toUpperCase()} ODYSSEY: A ${duration}-DAY EXPEDITION
Curated by WanderLuxe AI • ${mood} Pace • ${travelers} Travelers

${storyChapters.map((ch) => `
--- Chapter ${ch.dayNum}: ${ch.title} ---
📍 ${ch.location} | 🏨 ${ch.stay}
${ch.summary}
${ch.quote}
`).join('\n')}
`.trim(), [destination, duration, mood, travelers, storyChapters]);

  const handleCopyStory = useCallback(() => {
    navigator.clipboard.writeText(fullStoryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [fullStoryText]);

  const handleChapterNav = useCallback((idx) => {
    setActiveChapter(idx);
    setVisitedChapters(prev => new Set([...prev, idx]));
  }, []);

  const handleNextChapter = useCallback(() => {
    if (activeChapter < storyChapters.length - 1) {
      handleChapterNav(activeChapter + 1);
    }
  }, [activeChapter, storyChapters.length, handleChapterNav]);

  const handlePrevChapter = useCallback(() => {
    if (activeChapter > 0) {
      handleChapterNav(activeChapter - 1);
    }
  }, [activeChapter, handleChapterNav]);

  const handleBookingConfirm = useCallback(() => {
    setBookingConfirmed(true);
    if (onReserve) {
      onReserve();
    }
  }, [onReserve]);

  const progressPercent = storyChapters.length > 0
    ? Math.round((visitedChapters.size / storyChapters.length) * 100)
    : 0;

  const activeChapterData = storyChapters[activeChapter] || storyChapters[0];

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto">
      {/* =================================================================== */}
      {/* 1. STORY HERO — Immersive Visual Header */}
      {/* =================================================================== */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white shadow-xl min-h-[200px]">
        {/* Background with green gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <BookOpen size={16} />
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                Journey Chronicles
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Clock size={11} className="text-emerald-400" /> ~{Math.max(2, duration)} min read
              </span>
              <button
                type="button"
                onClick={handleCopyStory}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              The {destination} Chronicle
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-serif italic line-clamp-2">
              {itinerary?.tagline || profile?.quote || `A ${duration}-day expedition through the heart of ${destination}.`}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-bold">Reading Progress</span>
              <span className="text-emerald-400 font-black">{progressPercent}% · {visitedChapters.size}/{storyChapters.length} chapters</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. HORIZONTAL CHAPTER TIMELINE STRIP */}
      {/* =================================================================== */}
      <div className="relative">
        <div
          ref={carouselRef}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {storyChapters.map((chapter, idx) => {
            const isActive = activeChapter === idx;
            const isVisited = visitedChapters.has(idx);
            return (
              <button
                key={chapter.dayNum}
                type="button"
                onClick={() => handleChapterNav(idx)}
                className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-left transition-all cursor-pointer min-w-[180px] ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                    : isVisited
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isVisited
                    ? 'bg-emerald-200 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {isVisited && !isActive ? <CheckCircle2 size={14} /> : chapter.dayNum}
                </span>
                <div className="min-w-0">
                  <span className={`text-[10px] font-black block truncate ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                    Day {chapter.dayNum}
                  </span>
                  <span className={`text-xs font-bold block truncate ${isActive ? 'text-white' : ''}`}>
                    {chapter.title.length > 18 ? chapter.title.slice(0, 18) + '…' : chapter.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. ACTIVE CHAPTER — IMMERSIVE VISUAL CARD */}
      {/* =================================================================== */}
      {activeChapterData && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChapter}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden"
          >
            {/* Chapter Image Hero */}
            {activeChapterData.image && (
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img
                  src={activeChapterData.image}
                  alt={activeChapterData.imageCaption}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      Chapter {activeChapterData.dayNum}
                    </span>
                    <span className="text-[9px] font-bold text-white/70 flex items-center gap-1">
                      <MapPin size={9} /> {activeChapterData.location}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                    {activeChapterData.title}
                  </h2>
                </div>
              </div>
            )}

            {/* Chapter Content */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Mood Line */}
              <div className="text-xs text-slate-500 font-medium">
                {activeChapterData.moodLine}
              </div>

              {/* Pull Quote */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 relative">
                <Quote size={16} className="text-amber-300 absolute -top-1.5 -left-0.5 rotate-180" />
                <p className="text-xs font-serif italic text-amber-950 leading-relaxed pl-2">
                  {activeChapterData.quote}
                </p>
              </div>

              {/* Summary */}
              <p className="text-sm text-slate-700 leading-relaxed">
                {activeChapterData.summary}
              </p>

              {/* Timeline Activities */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
                  <span className="text-[9px] font-black uppercase text-amber-600 block">Morning</span>
                  <span className="text-[11px] font-bold text-slate-700 line-clamp-2 mt-0.5">{activeChapterData.morningAct}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-50/50 border border-sky-100 text-center">
                  <span className="text-[9px] font-black uppercase text-sky-600 block">Afternoon</span>
                  <span className="text-[11px] font-bold text-slate-700 line-clamp-2 mt-0.5">{activeChapterData.afternoonAct}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-center">
                  <span className="text-[9px] font-black uppercase text-indigo-600 block">Evening</span>
                  <span className="text-[11px] font-bold text-slate-700 line-clamp-2 mt-0.5">{activeChapterData.eveningAct}</span>
                </div>
              </div>

              {/* Stay & Tip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">
                    <span className="font-bold text-slate-800">Stay:</span> {activeChapterData.stay}
                  </span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <Sparkles size={10} /> {activeChapterData.tip}
                  </span>
                </div>
              </div>

              {/* Chapter Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevChapter}
                  disabled={activeChapter === 0}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={13} /> Previous
                </button>

                <span className="text-[10px] font-bold text-slate-400">
                  {activeChapter + 1} / {storyChapters.length}
                </span>

                {activeChapter < storyChapters.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextChapter}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    Next Chapter <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleBookingConfirm}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/30 uppercase tracking-wide"
                  >
                    <Flame size={14} className="animate-pulse" /> Confirm Booking <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* =================================================================== */}
      {/* 4. CONFIRM BOOKING FOOTER — ALWAYS ACCESSIBLE */}
      {/* =================================================================== */}
      <div className="rounded-3xl p-6 sm:p-8 border shadow-xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border-emerald-700/50 text-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Expedition Booking Ready
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {duration} Days · {travelers} Travelers · {mood} Pace
          </span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Ready to live the {destination} story?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Confirm your booking now to reserve your vehicle, handpicked boutique stays, and verified route permits.
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onSwitchTab?.('itinerary')}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>View Daily Schedule</span>
            <ArrowRight size={13} />
          </button>

          <button
            type="button"
            onClick={() => onSwitchTab?.('map')}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Inspect Route Map</span>
            <Eye size={13} />
          </button>

          <button
            type="button"
            onClick={handleBookingConfirm}
            className="px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ml-auto bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/40 hover:shadow-emerald-400/50 hover:scale-105"
          >
            <Flame size={16} className="animate-pulse" />
            <span>Confirm & Book This Trip</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceStoryTab;
