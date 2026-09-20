import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Check, MapPin, Compass, Navigation, Clock, ShieldCheck, Sparkles, Mountain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getExpeditionProfile } from '../../utils/expeditionPlannerData';

const ExpeditionDayRouteList = ({
  destination = 'Spiti Valley',
  duration = 7,
  activeDay = 6,
  onSelectDay
}) => {
  const profile = getExpeditionProfile(destination, duration);
  const [expandedDays, setExpandedDays] = useState({ [activeDay]: true });

  const toggleDayAccordion = (dayNum, e) => {
    e?.stopPropagation();
    setExpandedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum]
    }));
    onSelectDay?.(dayNum);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
      {/* List Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
            <Calendar size={16} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 leading-none">
              Day-by-Day Route
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mt-0.5">
              Click any day to expand itinerary summary
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          {profile.stops.length} Stops · {profile.totalDistanceKm} km
        </span>
      </div>

      {/* Stop Cards Accordion List */}
      <div className="space-y-3">
        {profile.stops.map((stop) => {
          const isSelected = activeDay === stop.day;
          const isExpanded = expandedDays[stop.day] ?? (isSelected || stop.day === 1);

          return (
            <div
              key={stop.day}
              className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                isSelected
                  ? 'border-emerald-600 shadow-md ring-2 ring-emerald-600/20 bg-slate-950 text-white'
                  : 'border-slate-200/90 hover:border-slate-300 bg-white text-slate-900'
              }`}
            >
              {/* Card Header (Click to toggle accordion & select) */}
              <div
                onClick={() => {
                  onSelectDay?.(stop.day);
                  setExpandedDays((prev) => ({ ...prev, [stop.day]: !prev[stop.day] }));
                }}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                {/* Left Number & Title Block */}
                <div className="flex items-center gap-3 min-w-0 grow">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    {stop.day}
                  </div>

                  <div className="min-w-0 grow">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider ${
                          isSelected ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {stop.stage}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          isSelected ? 'text-slate-400' : 'text-slate-400'
                        }`}
                      >
                        • {stop.distance}
                      </span>
                    </div>

                    <h4
                      className={`text-xs sm:text-sm font-black truncate mt-0.5 ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {stop.name}
                    </h4>

                    {/* Compact Altitude Badge */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isSelected
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {stop.altitudeBadge}
                      </span>
                      <span
                        className={`text-[10px] font-medium truncate ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        • {stop.famousPlace || stop.details}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Expand / Collapse Button */}
                <button
                  type="button"
                  onClick={(e) => toggleDayAccordion(stop.day, e)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                  aria-label="Toggle details"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Accordion Dropdown Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`px-4 pb-4 pt-1 border-t space-y-3 ${
                      isSelected
                        ? 'border-white/10 bg-slate-900/60'
                        : 'border-slate-100 bg-slate-50/70'
                    }`}
                  >
                    {/* Famous Landmark Callout Banner */}
                    <div className={`p-3 rounded-2xl border flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}>
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <MapPin size={16} />
                      </div>
                      <div className="grow min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            Famous Landmark of the Day
                          </span>
                          <span className="text-[9px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded text-emerald-300">
                            {stop.elevationLabel || stop.altitudeBadge}
                          </span>
                        </div>
                        <h5 className="text-xs sm:text-sm font-black leading-snug mt-0.5">
                          {stop.famousPlace || stop.name}
                        </h5>
                      </div>
                    </div>

                    {/* 2-Line Concise Summary */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-mono">
                        Day Summary:
                      </span>
                      <p className={`text-xs font-medium leading-relaxed ${
                        isSelected ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        {stop.summary2Lines || `Explore iconic viewpoints across ${stop.famousPlace || stop.name}. Experience authentic cuisine, scenic photography spots, and smooth terrain transit.`}
                      </p>
                    </div>

                    {/* Key Activities & Terrain Stats */}
                    {Array.isArray(stop.activities) && stop.activities.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Highlights & Plan:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {stop.activities.map((act, i) => (
                            <div
                              key={i}
                              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-white/5 text-slate-200 border border-white/5'
                                  : 'bg-white text-slate-700 border border-slate-200/70'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span className="truncate">{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom Terrain & Transit Info Bar */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock size={12} className="text-emerald-400" />
                        <span>Transit: {stop.transitTime || stop.distance}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectDay?.(stop.day)}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase tracking-wider text-[9px] font-black cursor-pointer"
                      >
                        <Navigation size={11} />
                        <span>View on Topo Map</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExpeditionDayRouteList;
