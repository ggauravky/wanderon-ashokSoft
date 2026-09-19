import React from 'react';
import { Compass, Mountain, Gauge, Clock } from 'lucide-react';
import { getExpeditionProfile } from '../../utils/expeditionPlannerData';

const ExpeditionOverviewHero = ({ itinerary, destination = 'Spiti Valley', duration = 7 }) => {
  const profile = getExpeditionProfile(destination, duration);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl text-white">
      {/* Background Destination Scenic Panorama - Enhanced High Visibility */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={profile.heroImage}
          alt={destination}
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-700 opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-900/50 to-emerald-800/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/40 via-transparent to-emerald-950/30" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 p-6 sm:p-10 space-y-6">
        {/* Top Badges & Quote */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Certified Overland Circuit
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider text-amber-300">
              Prime Window: {profile.primeWindow}
            </span>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-serif italic text-slate-300">
              {profile.quote}
            </p>
            <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase block mt-0.5">
              {profile.logId}
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="max-w-3xl space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 block font-mono">
            {profile.circuitTitle}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Your {destination} Road Trip — <span className="text-emerald-400">{duration} Days</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl">
            {itinerary?.tagline || itinerary?.summary || profile.quote?.replace(/"/g, '') || `A curated ${duration}-day exploration through the best of ${destination} — iconic landmarks, local flavors, and unforgettable experiences.`}
          </p>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Stat 1: Total Loop */}
          <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Compass size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-white block leading-none">
                {profile.totalDistanceKm} km
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mt-1">
                Total Expedition Loop
              </span>
            </div>
          </div>

          {/* Stat 2: Summit Peak */}
          <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600/30 text-amber-400 flex items-center justify-center shrink-0">
              <Mountain size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-white block leading-none">
                {profile.peakAltitudeFt.toLocaleString()} ft
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mt-1">
                {profile.peakLandmark.split('(')[0].trim()}
              </span>
            </div>
          </div>

          {/* Stat 3: Terrain Type */}
          <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
              <Gauge size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-white block leading-none">
                {profile.terrainType}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mt-1">
                {profile.terrainDesc}
              </span>
            </div>
          </div>

          {/* Stat 4: Daily Pace */}
          <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-600/30 text-purple-400 flex items-center justify-center shrink-0">
              <Clock size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-white block leading-none">
                {profile.paceSpeed}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mt-1">
                {profile.paceDesc}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpeditionOverviewHero;
