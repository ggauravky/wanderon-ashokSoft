import React, { useState } from 'react';
import { Sparkles, ArrowRight, Compass, MapPin, Calendar, Heart, ShieldCheck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const POPULAR_DESTINATIONS = [
  { name: 'Meghalaya', state: 'Northeast India', vibe: 'Nature & Waterfalls', tag: 'Rainforest' },
  { name: 'Spiti Valley', state: 'Himachal Pradesh', vibe: 'High Altitude & Monasteries', tag: 'Adventure' },
  { name: 'Kashmir', state: 'Jammu & Kashmir', vibe: 'Alpine Valleys & Lakes', tag: 'Romantic' },
  { name: 'Bali', state: 'Indonesia', vibe: 'Tropical Beaches & Temples', tag: 'Culture' },
  { name: 'Kerala', state: 'South India', vibe: 'Backwaters & Spice Hills', tag: 'Relaxed' },
  { name: 'Ladakh', state: 'North India', vibe: 'High Passes & Stargazing', tag: 'Expedition' }
];

const CURATED_SUGGESTIONS = [
  {
    destination: 'Meghalaya',
    type: 'India',
    vibes: ['Nature', 'Adventure', 'Romantic'],
    budgetTier: 'Comfortable',
    bestSeason: 'Oct – May',
    heroTag: 'Lush Living Root Bridges & Emerald Cascades',
    summary: 'Misty pine ridges, deepest river gorges, and crystal waters.'
  },
  {
    destination: 'Kashmir',
    type: 'India',
    vibes: ['Romantic', 'Relaxed', 'Nature'],
    budgetTier: 'Comfortable',
    bestSeason: 'Apr – Oct',
    heroTag: 'Shikara Sunsets & Pine-Clad Meadows',
    summary: 'Gulmarg gondolas, Pahalgam valleys, and peaceful Dal Lake mornings.'
  },
  {
    destination: 'Bali',
    type: 'International',
    vibes: ['Beach', 'Culture', 'Romantic'],
    budgetTier: 'Premium',
    bestSeason: 'May – Sep',
    heroTag: 'Clifftop Temples & Emerald Rice Terraces',
    summary: 'Island sunsets in Uluwatu, artisan Ubud coffee, and ocean calm.'
  },
  {
    destination: 'Spiti Valley',
    type: 'India',
    vibes: ['Adventure', 'Nature'],
    budgetTier: 'Budget',
    bestSeason: 'Jun – Oct',
    heroTag: 'Ancient Monasteries & Stargazing Peaks',
    summary: 'Chandratal turquoise reflections, Kaza passes, and raw Himalayan terrain.'
  },
  {
    destination: 'Kerala',
    type: 'India',
    vibes: ['Relaxed', 'Nature', 'Culture'],
    budgetTier: 'Comfortable',
    bestSeason: 'Oct – Mar',
    heroTag: 'Munnar Tea Estates & Backwater Houseboats',
    summary: 'Slow canoe trails, aromatic spice trails, and Arabian sea breezes.'
  }
];

const PlannerHeroDiscovery = ({ onSelectDestination, onStartWizard }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [plannerMode, setPlannerMode] = useState('direct'); // 'direct' | 'help_me_choose'

  // "Help Me Choose" Filters
  const [regionFilter, setRegionFilter] = useState('Either'); // 'India' | 'International' | 'Either'
  const [vibeFilter, setVibeFilter] = useState('Nature');
  const [budgetFilter, setBudgetFilter] = useState('Comfortable');

  const handleDirectSubmit = (e) => {
    e?.preventDefault();
    const dest = searchQuery.trim() || 'Meghalaya';
    onSelectDestination(dest);
    onStartWizard();
  };

  const handlePickPopular = (destName) => {
    setSearchQuery(destName);
    onSelectDestination(destName);
    onStartWizard();
  };

  // Filter 3-5 high-signal destination suggestions
  const filteredSuggestions = CURATED_SUGGESTIONS.filter((item) => {
    const matchesRegion = regionFilter === 'Either' || item.type === regionFilter;
    const matchesVibe = item.vibes.includes(vibeFilter);
    return matchesRegion && matchesVibe;
  }).slice(0, 4);

  const fallbackSuggestions = CURATED_SUGGESTIONS.slice(0, 3);
  const displaySuggestions = filteredSuggestions.length > 0 ? filteredSuggestions : fallbackSuggestions;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Brand Badge */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-black uppercase tracking-wider mb-4">
          <Sparkles size={14} className="text-emerald-600" />
          <span>Intelligent Travel Architect 2.0</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Plan your next journey.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mt-2.5 font-medium">
          Minimum input, realistic routing, verified destination media, and conversational refinement.
        </p>
      </div>

      {/* Two-Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="p-1 bg-slate-100 rounded-2xl border border-slate-200/80 inline-flex shadow-inner">
          <button
            type="button"
            onClick={() => setPlannerMode('direct')}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              plannerMode === 'direct'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            I know where I want to go
          </button>
          <button
            type="button"
            onClick={() => setPlannerMode('help_me_choose')}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              plannerMode === 'help_me_choose'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass size={13} className="text-emerald-500" />
            Help me choose
          </button>
        </div>
      </div>

      {/* MODE 1: Direct Destination Input */}
      {plannerMode === 'direct' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="space-y-6"
        >
          <form onSubmit={handleDirectSubmit} className="relative">
            <div className="relative bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 shadow-xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-3 w-full px-3 py-2 flex-grow">
                <MapPin className="text-emerald-600 shrink-0" size={22} />
                <div className="w-full">
                  <label htmlFor="direct-destination-input" className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Where do you want to go?
                  </label>
                  <input
                    id="direct-destination-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Meghalaya, Spiti, Bali, Kashmir..."
                    className="w-full bg-transparent text-base sm:text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl sm:rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Plan my trip</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* Popular Destinations Quick Pills */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Popular Expeditions
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Click to begin planning</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest.name}
                  type="button"
                  onClick={() => handlePickPopular(dest.name)}
                  className="p-3 bg-white hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {dest.name}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-800 text-slate-600">
                      {dest.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{dest.vibe}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* MODE 2: "Help Me Choose" (High-Signal Preferences) */}
      {plannerMode === 'help_me_choose' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-xl space-y-6"
        >
          <div>
            <h3 className="text-base font-black text-slate-900">
              Tell us your travel vibe — we’ll recommend 3–5 ideal journeys
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select key preferences without filling out a 40-question survey.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* 1. Trip Region */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
                Trip Region
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                {['India', 'International', 'Either'].map((reg) => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setRegionFilter(reg)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      regionFilter === reg ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Primary Vibe */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
                Trip Vibe
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Nature', 'Adventure', 'Culture', 'Beach', 'Romantic', 'Relaxed'].map((vibe) => (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => setVibeFilter(vibe)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      vibeFilter === vibe
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Budget Comfort */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
                Comfort Level
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                {['Budget', 'Comfortable', 'Premium'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudgetFilter(b)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      budgetFilter === b ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Destination Recommendations */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-3">
              Recommended for your vibe:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displaySuggestions.map((sug) => (
                <div
                  key={sug.destination}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {sug.destination}
                      </h4>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {sug.bestSeason}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 mt-1">{sug.heroTag}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{sug.summary}</p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">{sug.type} • {sug.budgetTier}</span>
                    <button
                      type="button"
                      onClick={() => handlePickPopular(sug.destination)}
                      className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      Plan {sug.destination} <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PlannerHeroDiscovery;
