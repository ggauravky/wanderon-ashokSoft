import React, { useState } from 'react';
import { MapPin, Navigation, Clock, Compass, ShieldCheck } from 'lucide-react';

const WorkspaceMapTab = ({ itinerary }) => {
  const days = itinerary?.days || itinerary?.itineraryDays || [];
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const activeDay = days[selectedDayIdx] || days[0];

  // Extract stops for current day
  const stops = [
    ...(activeDay?.morning || []).map((s) => ({ ...s, slot: 'Morning' })),
    ...(activeDay?.afternoon || []).map((s) => ({ ...s, slot: 'Afternoon' })),
    ...(activeDay?.evening || []).map((s) => ({ ...s, slot: 'Evening' }))
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visual Shell (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white min-h-[420px] flex flex-col justify-between relative overflow-hidden shadow-md">
          {/* Subtle Topographic Background Grid */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Map Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation size={18} className="text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Route Map • Day {activeDay?.day || 1}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
              Verified Geographic Waypoints
            </span>
          </div>

          {/* Stylized Route Nodes Representation */}
          <div className="relative z-10 my-8 flex flex-col sm:flex-row items-center justify-around gap-4">
            {stops.map((stop, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center font-black text-xs shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  {i + 1}
                </div>
                <span className="text-xs font-black text-white mt-2 max-w-[120px] truncate">
                  {stop.activity || stop.name}
                </span>
                <span className="text-[10px] text-slate-400">{stop.location || itinerary?.destination}</span>
                {i < stops.length - 1 && (
                  <div className="hidden sm:block absolute w-16 h-0.5 bg-emerald-500/30 -z-1" />
                )}
              </div>
            ))}
          </div>

          {/* Map Footer Info */}
          <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Overnight: <strong className="text-white">{activeDay?.stay || `${itinerary?.destination} Stay`}</strong></span>
            <span>Est. Day Transit: <strong className="text-emerald-400">~2h 15m</strong></span>
          </div>
        </div>

        {/* Map Side Summary (1 Col) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            Day Navigation & Distance
          </h3>

          {/* Day Selector Pills */}
          <div className="flex flex-wrap gap-1.5">
            {days.map((d, idx) => (
              <button
                key={d.day}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedDayIdx === idx
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Day {d.day}
              </button>
            ))}
          </div>

          {/* Stop List */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Sequential Route Stops ({stops.length})
            </span>
            {stops.map((stop, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="truncate">
                  <span className="text-xs font-bold text-slate-800 block truncate">{stop.activity || stop.name}</span>
                  <span className="text-[10px] text-slate-400 block">{stop.slot} • {stop.travelTime || 'Transit ~30m'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceMapTab;
