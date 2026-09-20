import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowRight, Search, Compass, MapPin, 
  ChevronRight, ChevronLeft, Star, BookOpen, Mountain, Heart,
  Send, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_SUGGESTIONS = [
  { icon: '🪄', label: 'Surprise me', prompt: 'Surprise me with a 6-day offbeat adventure with scenic stays, local food and hidden viewpoints.' },
  { icon: '⛰️', label: 'Mountain road trip', prompt: '7-day mountain road trip across high passes, cozy homestays, and stunning ridge viewpoints.' },
  { icon: '☁️', label: 'Peaceful getaway', prompt: '5-day peaceful wellness getaway with tranquil boutique stays, nature walks, and sunset views.' },
  { icon: '📜', label: 'Cultural trip', prompt: '6-day deep cultural heritage trip exploring ancient monasteries, local art, and traditional feasts.' },
  { icon: '⛱️', label: 'Beach vacation', prompt: '5-day tropical beach vacation with ocean villas, cafe hopping, and coastal sunsets.' }
];

const DESTINATIONS_LIST = [
  {
    id: 'spiti',
    name: 'Spiti Valley',
    category: 'Mountains',
    topBadgeLeft: 'Featured High Pass',
    topBadgeRight: '4,590m Peak',
    tag: 'MOUNTAINS • BEST: JUN-OCT',
    desc: 'High roads, Monastery',
    image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80',
    prompt: '7-day road trip to Spiti Valley in July with high passes, monastery visits, and homestays.'
  },
  {
    id: 'bali',
    name: 'Bali',
    category: 'Coastal',
    topBadgeLeft: 'Tropical • 28°C',
    topBadgeRight: null,
    tag: 'BEACHES',
    desc: 'Culture, Calm, Adventure...',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
    prompt: '5-day tropical escape to Bali with Ubud villas, temple visits, and sunset beach cafes.'
  },
  {
    id: 'thailand',
    name: 'Thailand',
    category: 'Coastal',
    topBadgeLeft: 'Emerald Isles',
    topBadgeRight: null,
    tag: 'NATURE ESCAPES',
    desc: 'Islands, Jungles, More...',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&auto=format&fit=crop&q=80',
    prompt: '6-day island hopping in Thailand with turquoise waters, limestone cliffs, and night markets.'
  },
  {
    id: 'japan',
    name: 'Japan',
    category: 'Heritage',
    topBadgeLeft: 'Kyoto & Alps',
    topBadgeRight: null,
    tag: 'CULTURE',
    desc: 'Tradition meets tomorrow...',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
    prompt: '7-day cultural odyssey in Japan exploring Kyoto shrines, Tokyo street food, and mountain onsens.'
  },
  {
    id: 'maldives',
    name: 'Maldives',
    category: 'Coastal',
    topBadgeLeft: 'Atolls & Lagoon',
    topBadgeRight: null,
    tag: 'ISLAND GETAWAYS',
    desc: 'Clear waters, Clear minds...',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&auto=format&fit=crop&q=80',
    prompt: '5-day luxury island getaway in Maldives with overwater villas, private reefs, and serene lagoons.'
  }
];

const FEATURED_WIDE = {
  name: 'Australia',
  category: 'Coastal',
  badge: 'Great Ocean Road + 243km Coastal Route',
  tag: 'ROAD TRIPS • OCEANIA',
  desc: 'Epic coastal drives. Endless horizon views. Curated self-drive tracks.',
  image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1400&auto=format&fit=crop&q=80',
  prompt: '7-day Australian coastal self-drive road trip from Melbourne along Great Ocean Road.'
};

import { extractTripInfoFromPrompt } from '../../utils/aiPlannerEngine';

export { extractTripInfoFromPrompt };

const PlannerHeroDiscovery = ({ onSelectDestination, onStartWizard, onPromptSubmit, initialPrompt = '' }) => {
  const [promptInput, setPromptInput] = useState(initialPrompt || '');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');

  useEffect(() => {
    if (initialPrompt && !promptInput) {
      setPromptInput(initialPrompt);
    }
  }, [initialPrompt]);

  const filterOptions = ['All', 'Mountains', 'Coastal', 'Heritage'];

  const filteredDestinations = selectedFilter === 'All'
    ? DESTINATIONS_LIST
    : DESTINATIONS_LIST.filter(d => d.category === selectedFilter);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const query = promptInput.trim();
    const targetPrompt = query || '7 day road trip to Spiti with friends';
    setIsSynthesizing(true);
    const parsedData = extractTripInfoFromPrompt(targetPrompt);
    onSelectDestination?.(parsedData.destination);

    setTimeout(() => {
      setIsSynthesizing(false);
      if (onPromptSubmit) onPromptSubmit(parsedData);
      else if (onStartWizard) onStartWizard(parsedData);
    }, 400);
  };

  const handleChipClick = (suggestion) => {
    setPromptInput(suggestion.prompt);
    setIsSynthesizing(true);
    const parsedData = extractTripInfoFromPrompt(suggestion.prompt);
    onSelectDestination?.(parsedData.destination);

    setTimeout(() => {
      setIsSynthesizing(false);
      if (onPromptSubmit) onPromptSubmit(parsedData);
      else if (onStartWizard) onStartWizard(parsedData);
    }, 350);
  };

  const handleCardClick = (item) => {
    setIsSynthesizing(true);
    const parsedData = extractTripInfoFromPrompt(item.prompt);
    parsedData.destination = item.name;
    onSelectDestination?.(item.name);

    setTimeout(() => {
      setIsSynthesizing(false);
      if (onPromptSubmit) onPromptSubmit(parsedData);
      else if (onStartWizard) onStartWizard(parsedData);
    }, 350);
  };

  return (
    <div className="-mt-6 -mx-4 sm:-mx-6 lg:-mx-8 space-y-12 pb-12">
      {/* =================================================================== */}
      {/* 1. HERO BANNER WITH SCENIC MOUNTAIN LAKE BACKGROUND */}
      {/* =================================================================== */}
      <div className="relative min-h-[460px] sm:min-h-[520px] rounded-b-[2.5rem] overflow-hidden flex flex-col justify-center items-center px-4 sm:px-6 py-16 text-center text-white shadow-2xl">
        {/* Background Image with Cinematic Overlays */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&auto=format&fit=crop&q=85')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/60 to-slate-950/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-5">
          {/* Sparkle Sub-badge */}
          <div className="flex items-center justify-center gap-1.5 text-amber-200/90 font-serif italic text-sm sm:text-base tracking-wide">
            <span>✨</span>
            <span>AI Travel Planner</span>
            <span>✨</span>
          </div>

          {/* Big Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            Where do you want to go?
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-200 max-w-xl mx-auto font-medium">
            Describe your dream trip and let AI craft it for you
          </p>

          {/* Search Input Bar (Rounded Pill) */}
          <form onSubmit={handleSubmit} className="pt-2 max-w-2xl mx-auto">
            <div className="relative bg-white rounded-full shadow-2xl p-1.5 sm:p-2 flex items-center gap-2 border border-white/20 transition-all focus-within:ring-4 focus-within:ring-teal-400/30">
              <div className="pl-3 sm:pl-4 text-slate-400">
                <Search size={20} />
              </div>

              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder='Try "7 day road trip to Spiti with friends"'
                className="w-full bg-transparent text-slate-900 text-xs sm:text-sm font-semibold placeholder:text-slate-400 focus:outline-hidden px-1"
              />

              <button
                type="submit"
                disabled={isSynthesizing}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-50"
                title="Generate Itinerary"
              >
                {isSynthesizing ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <ArrowRight size={18} />
                )}
              </button>
            </div>
          </form>

          {/* Quick Filter / Suggestion Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {QUICK_SUGGESTIONS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleChipClick(item)}
                className="px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 text-xs font-bold transition-all shadow-xs backdrop-blur-xs flex items-center gap-1.5 cursor-pointer hover:scale-105"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. CURATED EXPEDITIONS / POPULAR DESTINATIONS */}
      {/* =================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              Curated Expeditions
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Popular Destinations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Handcrafted itineraries powered by real explorers and refined by travel intelligence.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {filterOptions.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedFilter('All')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>View All (38)</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Carousel */}
        <div className="relative group/carousel">
          {/* Left Arrow */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('dest-carousel');
              if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
            }}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('dest-carousel');
              if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
            }}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>

          <div
            id="dest-carousel"
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredDestinations.map((dest) => (
              <div
                key={dest.id}
                onClick={() => handleCardClick(dest)}
                className="group relative min-w-[260px] sm:min-w-[280px] h-80 sm:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between p-3.5 bg-slate-900 snap-start shrink-0"
              >
                {/* Background Card Image */}
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/40 to-slate-950/40" />

                {/* Top Badges */}
                <div className="relative z-10 flex items-start justify-between gap-1 w-full">
                  {dest.topBadgeLeft && (
                    <span className="text-[9px] font-black uppercase text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/15">
                      {dest.topBadgeLeft}
                    </span>
                  )}
                  {dest.topBadgeRight && (
                    <span className="text-[9px] font-mono font-bold text-white bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/15">
                      {dest.topBadgeRight}
                    </span>
                  )}
                </div>

                {/* Bottom Details & Arrow CTA */}
                <div className="relative z-10 flex items-end justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[8px] font-black uppercase tracking-wider text-teal-400 block truncate">
                      {dest.tag}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-sm truncate">
                      {dest.name}
                    </h3>
                    <p className="text-[10px] text-slate-300 font-medium truncate">
                      {dest.desc}
                    </p>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-white text-slate-900 flex items-center justify-center shrink-0 shadow-md group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {filteredDestinations.map((dest, idx) => (
              <button
                key={dest.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById('dest-carousel');
                  if (el) el.scrollTo({ left: idx * 300, behavior: 'smooth' });
                }}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === 0 ? 'bg-teal-600 w-4' : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* =================================================================== */}
        {/* WIDE FEATURED ROAD TRIP BANNER (AUSTRALIA) */}
        {/* =================================================================== */}
        <div
          onClick={() => handleCardClick(FEATURED_WIDE)}
          className="group relative h-64 sm:h-72 rounded-3xl overflow-hidden border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer p-6 sm:p-8 flex flex-col justify-between text-white bg-slate-900"
        >
          <img
            src={FEATURED_WIDE.image}
            alt={FEATURED_WIDE.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />

          {/* Top Badge */}
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/15">
              {FEATURED_WIDE.badge}
            </span>
          </div>

          {/* Bottom Content & CTA */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1 max-w-lg">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 block">
                {FEATURED_WIDE.tag}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {FEATURED_WIDE.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                {FEATURED_WIDE.desc}
              </p>
            </div>

            <button
              type="button"
              className="px-5 py-2.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-xs font-black transition-all flex items-center gap-1.5 shadow-md self-start sm:self-auto cursor-pointer group-hover:bg-teal-500 group-hover:text-white"
            >
              <span>Explore Road Trips</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. WHY PLAN WITH NOMADSPITI? */}
        {/* =================================================================== */}
        <div className="pt-6 space-y-6">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 text-center tracking-tight">
            Why plan with NomadSpiti?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 font-black">
                <Star size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">AI-Powered Itineraries</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Personalized trips in seconds
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 font-black">
                <BookOpen size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Real Travel Insights</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  From travellers, for travellers
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-black">
                <Mountain size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Hidden Gems</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Go beyond the usual
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 font-black">
                <Heart size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">A Fuller Travel Experience</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Not just places, real stories
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerHeroDiscovery;
