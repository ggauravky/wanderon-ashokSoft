import React, { useState, useEffect } from 'react';
import { 
  MapPin, Mountain, Plus, Minus, Layers, Fuel, Sparkles, 
  Navigation, TrendingUp, Sun, Moon, Play, Pause, RotateCcw, 
  ShieldCheck, AlertTriangle, Zap, CheckCircle2, Eye, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getExpeditionProfile } from '../../utils/expeditionPlannerData';

const ExpeditionRouteMapElevation = ({
  destination = 'Spiti Valley',
  duration = 7,
  activeDay = 1,
  onSelectDay
}) => {
  const [visualTab, setVisualTab] = useState('map'); // 'map' | 'elevation' | 'passes' | 'fuel' | 'flyover'
  const [mapTheme, setMapTheme] = useState('light'); // 'light' | 'dark'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredStop, setHoveredStop] = useState(null);

  // 3D Flyover Simulator State
  const [flyoverIndex, setFlyoverIndex] = useState(0);
  const [isPlayingFlyover, setIsPlayingFlyover] = useState(false);

  const profile = getExpeditionProfile(destination, duration);

  // Auto-advance flyover if playing
  useEffect(() => {
    let timer;
    if (isPlayingFlyover && visualTab === 'flyover') {
      timer = setInterval(() => {
        setFlyoverIndex((prev) => {
          if (prev >= profile.stops.length - 1) {
            setIsPlayingFlyover(false);
            return 0;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlayingFlyover, visualTab, profile.stops.length]);

  const tabs = [
    { id: 'map', label: 'Route Map', icon: Navigation },
    { id: 'elevation', label: 'Elevation', icon: TrendingUp },
    { id: 'passes', label: `${profile.stops.length} Passes & Checkpoints`, icon: Mountain },
    { id: 'fuel', label: 'Fuel, EV & Stays', icon: Fuel },
    { id: 'flyover', label: '3D Scenic Flyover', icon: Sparkles }
  ];

  const currentActiveStop = profile.stops.find(s => s.day === activeDay) || profile.stops[0];

  // Dynamic Elevation calculation for SVG Chart
  const altitudes = profile.stops.map(s => Number(s.altitudeNum) || 1000);
  const minAlt = Math.min(...altitudes, 0);
  const maxAlt = Math.max(...altitudes, Number(profile.peakAltitudeFt) || 5000);
  const altRange = Math.max(1, maxAlt - minAlt);

  const elevationPoints = profile.stops.map((s, idx) => {
    const total = profile.stops.length;
    const x = 20 + (idx / Math.max(1, total - 1)) * 360;
    const y = 110 - (((Number(s.altitudeNum) || 1000) - minAlt) / altRange) * 85;
    return { x, y, stop: s };
  });

  const polylinePointsStr = elevationPoints.map(p => `${p.x},${p.y}`).join(' ');
  const polygonPointsStr = `20,115 ${polylinePointsStr} 380,115`;

  // Highest altitude stop index for peak marker
  const peakIndex = altitudes.indexOf(Math.max(...altitudes));
  const peakPoint = elevationPoints[peakIndex] || elevationPoints[0];

  return (
    <div className="space-y-4">
      {/* 1. All 5 Top Visualizer Buttons */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = visualTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setVisualTab(tab.id);
                  if (tab.id === 'flyover') setIsPlayingFlyover(true);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Light / Dark Mode Map Toggle (Visible on Route Map) */}
        {visualTab === 'map' && (
          <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : 'light')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Toggle Map Style"
            >
              {mapTheme === 'light' ? (
                <>
                  <Moon size={12} className="text-indigo-600" />
                  <span>Dark Map</span>
                </>
              ) : (
                <>
                  <Sun size={12} className="text-amber-500" />
                  <span>Light Map</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DYNAMIC ROUTE MAP (LIGHT & DARK FUNCTIONAL CANVAS) */}
      {/* ========================================================================= */}
      {visualTab === 'map' && (
        <div className={`relative rounded-3xl overflow-hidden border shadow-md aspect-16/10 min-h-[360px] transition-colors duration-500 ${
          mapTheme === 'light'
            ? 'bg-slate-100 border-slate-200/90 text-slate-900'
            : 'bg-slate-950 border-slate-800 text-white'
        }`}>
          {/* Topographic Background Pattern & Overlay */}
          <div 
            className={`absolute inset-0 ${
              mapTheme === 'light'
                ? 'opacity-30 bg-[radial-gradient(#059669_1.2px,transparent_1.2px)] [background-size:20px_20px]'
                : 'opacity-20 bg-[radial-gradient(#10b981_1.2px,transparent_1.2px)] [background-size:20px_20px]'
            }`} 
          />
          <div className={`absolute inset-0 ${
            mapTheme === 'light'
              ? 'bg-gradient-to-tr from-slate-200/60 via-transparent to-emerald-100/30'
              : 'bg-gradient-to-tr from-slate-950 via-slate-900/90 to-emerald-950/40'
          }`} />

          {/* Top Left Topo Header Badge */}
          <div className="absolute top-4 left-4 z-10">
            <div className={`backdrop-blur-md px-3.5 py-2 rounded-2xl border shadow-xs ${
              mapTheme === 'light'
                ? 'bg-white/95 border-slate-200 text-slate-800'
                : 'bg-slate-900/90 border-slate-700 text-white'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-black uppercase text-emerald-600">
                  {mapTheme === 'light' ? 'Light Topo Mode' : 'Dark Topo Mode'}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-black block mt-0.5">
                {destination} Overland Circuit
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {profile.coordinates} · {profile.totalDistanceKm} km
              </span>
            </div>
          </div>

          {/* Map Polyline Route SVG with Clickable Dynamic Waypoints */}
          <svg
            className="absolute inset-0 w-full h-full p-8"
            viewBox="0 0 500 320"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.2s ease-out' }}
          >
            <defs>
              <linearGradient id="routePathGradLight" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>

            {/* Dotted Guide Route Track */}
            <path
              d="M 60 250 Q 120 180, 180 200 T 260 140 T 340 100 T 420 80 T 460 140"
              fill="none"
              stroke={mapTheme === 'light' ? '#10b981' : '#34d399'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="6 6"
              className="opacity-40 animate-pulse"
            />

            {/* Solid Expedition Polyline */}
            <path
              d="M 60 250 Q 120 180, 180 200 T 260 140 T 340 100 T 420 80 T 460 140"
              fill="none"
              stroke="url(#routePathGradLight)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />

            {/* Dynamic Waypoints along curve */}
            {profile.stops.map((stop, idx) => {
              const total = profile.stops.length;
              const ratio = idx / Math.max(1, total - 1);
              const cx = 60 + ratio * 400;
              const cy = 250 - Math.sin(ratio * Math.PI) * 160 + (idx % 2 === 0 ? 10 : -10);
              const isSelected = activeDay === stop.day;

              return (
                <g 
                  key={stop.day}
                  onClick={() => onSelectDay?.(stop.day)}
                  onMouseEnter={() => setHoveredStop(stop.day)}
                  onMouseLeave={() => setHoveredStop(null)}
                  className="cursor-pointer"
                >
                  {isSelected && (
                    <circle cx={cx} cy={cy} r="14" fill="#10b981" opacity="0.3" className="animate-ping" />
                  )}

                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={isSelected ? 8 : 6} 
                    fill={stop.isKeyStage ? '#f59e0b' : isSelected ? '#059669' : mapTheme === 'light' ? '#ffffff' : '#0f172a'} 
                    stroke={stop.isKeyStage ? '#b45309' : '#059669'} 
                    strokeWidth={isSelected ? 3 : 2} 
                  />

                  <text 
                    x={cx} 
                    y={cy + 3.5} 
                    textAnchor="middle" 
                    fill={stop.isKeyStage || isSelected ? '#ffffff' : mapTheme === 'light' ? '#0f172a' : '#ffffff'} 
                    fontSize="9" 
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    {stop.day}
                  </text>

                  <text 
                    x={cx} 
                    y={cy + (idx % 2 === 0 ? 20 : -14)} 
                    textAnchor="middle" 
                    fill={isSelected ? '#059669' : mapTheme === 'light' ? '#334155' : '#cbd5e1'} 
                    fontSize="10" 
                    fontWeight="800"
                    className="select-none"
                  >
                    {stop.famousPlace ? stop.famousPlace.split('&')[0].trim().slice(0, 16) : `D${stop.day} Stop`}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Active Camp / Stop Popup Card — compact so route stays visible */}
          <div className={`absolute top-4 right-4 z-20 w-40 rounded-xl p-2 shadow-lg border backdrop-blur-md transition-all ${
            mapTheme === 'light'
              ? 'bg-white/95 border-slate-200 text-slate-900'
              : 'bg-slate-900/95 border-slate-700 text-white'
          }`}>
            <div className="relative h-14 rounded-lg overflow-hidden mb-1.5 bg-slate-900">
              <img
                src={currentActiveStop.photo || profile.heroImage}
                alt={currentActiveStop.famousPlace || currentActiveStop.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded text-[7px] font-black uppercase text-white">
                Day {currentActiveStop.day}
              </div>
              <div className="absolute bottom-1 right-1 bg-emerald-600 text-white font-mono font-black px-1 py-0.5 rounded text-[7px]">
                {currentActiveStop.elevationLabel || currentActiveStop.altitudeBadge}
              </div>
            </div>
            <h4 className="text-[10px] font-black leading-tight truncate">
              {currentActiveStop.famousPlace || currentActiveStop.name}
            </h4>
            <p className="text-[9px] text-slate-500 font-medium line-clamp-1 mt-0.5">
              {currentActiveStop.details}
            </p>
          </div>

          {/* Map Zoom Controls */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
              className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-colors cursor-pointer border border-slate-200"
              title="Zoom In"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
              className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-colors cursor-pointer border border-slate-200"
              title="Zoom Out"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-colors cursor-pointer border border-slate-200"
              title="Reset Zoom"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Bottom Left Map Legend */}
          <div className={`absolute bottom-4 left-4 z-10 flex items-center gap-3 backdrop-blur-md px-3 py-1.5 rounded-xl border text-[10px] font-bold shadow-2xs ${
            mapTheme === 'light' ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-slate-900/90 border-slate-700 text-slate-300'
          }`}>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-emerald-500 rounded" /> Route
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Key Peak
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-700" /> Active Pin
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: DYNAMIC ELEVATION CROSS-SECTION CHART FOR THIS DESTINATION */}
      {/* ========================================================================= */}
      {visualTab === 'elevation' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  {destination} Elevation Profile & Altitude Curve
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Terrain cross-section across all {profile.stops.length} days
              </p>
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
              Peak: {profile.peakAltitudeFt.toLocaleString()} ft
            </span>
          </div>

          {/* SVG Dynamic Elevation Chart */}
          <div className="w-full h-48 relative pt-2">
            <div className="absolute inset-0 flex flex-col justify-between text-[9px] font-mono text-slate-400 pointer-events-none pr-4">
              <div className="flex items-center gap-2 border-b border-slate-100 w-full pb-0.5">
                <span>{maxAlt.toLocaleString()} ft</span>
              </div>
              <div className="flex items-center gap-2 border-b border-slate-100 w-full pb-0.5">
                <span>{Math.round(maxAlt * 0.66).toLocaleString()} ft</span>
              </div>
              <div className="flex items-center gap-2 border-b border-slate-100 w-full pb-0.5">
                <span>{Math.round(maxAlt * 0.33).toLocaleString()} ft</span>
              </div>
              <div className="flex items-center gap-2 border-b border-slate-100 w-full pb-0.5">
                <span>{minAlt.toLocaleString()} ft</span>
              </div>
            </div>

            <svg className="w-full h-full overflow-visible pl-16 pr-4" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="elevAreaGradDynamic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              <polygon
                points={polygonPointsStr}
                fill="url(#elevAreaGradDynamic)"
              />

              <polyline
                points={polylinePointsStr}
                fill="none"
                stroke="#047857"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {elevationPoints.map((pt) => (
                <circle 
                  key={pt.stop.day} 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={activeDay === pt.stop.day ? 6 : 4} 
                  fill={activeDay === pt.stop.day ? '#059669' : '#ffffff'} 
                  stroke="#047857" 
                  strokeWidth="2.5" 
                />
              ))}

              {/* Peak Summit Marker */}
              {peakPoint && (
                <circle cx={peakPoint.x} cy={peakPoint.y} r="6.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
              )}
            </svg>

            {/* Peak Landmark Callout Badge */}
            {peakPoint && (
              <div 
                className="absolute bg-slate-900 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-amber-400"
                style={{ top: '8px', right: '32px' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{profile.peakLandmark}</span>
              </div>
            )}
          </div>

          {/* Stops Elevation Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-2 border-t border-slate-100 text-center font-mono text-[9px]">
            {profile.stops.map((s) => (
              <div 
                key={s.day} 
                onClick={() => onSelectDay?.(s.day)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  activeDay === s.day 
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-black ring-1 ring-emerald-400' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-slate-400 block text-[8px]">Day {s.day}</span>
                <span className="font-bold truncate block">{s.famousPlace ? s.famousPlace.split('&')[0].trim() : s.name.slice(0, 10)}</span>
                <span className="text-emerald-700 font-black block mt-0.5">{s.elevationLabel || s.altitudeBadge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: PASSES & TERRAIN CHECKPOINTS */}
      {/* ========================================================================= */}
      {visualTab === 'passes' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                <Mountain size={16} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {destination} Passes, Checkpoints & Altitude Landmarks
                </h3>
                <p className="text-[11px] text-slate-500">
                  Route checkpoints, pass opening status, and entry guidelines for {destination}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {profile.passStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(profile.passesData || []).map((pass, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    {pass.day}
                  </span>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {pass.altitude}
                  </span>
                </div>

                <h4 className="text-xs font-black text-slate-900">
                  {pass.name}
                </h4>

                <div className="space-y-1 text-[11px] font-medium text-slate-600">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 size={12} />
                    <span>{pass.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <ShieldCheck size={12} />
                    <span>{pass.permit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: FUEL, EV & MEDICAL STAYS */}
      {/* ========================================================================= */}
      {visualTab === 'fuel' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                <Fuel size={16} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {destination} Fuel Stations, EV Fast Chargers & Stays
                </h3>
                <p className="text-[11px] text-slate-500">
                  Critical infrastructure and overnight halts mapped along your {destination} route
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
              Verified Route Network
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(profile.fuelData || []).map((fuel, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {fuel.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {fuel.distance}
                  </span>
                </div>

                <h4 className="text-xs font-black text-slate-900 leading-snug">
                  {fuel.name}
                </h4>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {fuel.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: 3D VALLEY FLYOVER SIMULATOR */}
      {/* ========================================================================= */}
      {visualTab === 'flyover' && (
        <div className="bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-xl space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  3D Scenic Flyover Simulator
                </h3>
                <p className="text-[11px] text-slate-400">
                  Step-by-step panoramic flight across the entire {destination} circuit
                </p>
              </div>
            </div>

            {/* Play/Pause Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlayingFlyover(!isPlayingFlyover)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {isPlayingFlyover ? <Pause size={13} /> : <Play size={13} />}
                <span>{isPlayingFlyover ? 'Pause Flyover' : 'Play Flight'}</span>
              </button>
            </div>
          </div>

          {/* Current Flyover Viewport Card */}
          {(() => {
            const currentWaypoint = (profile.flyoverWaypoints || [])[flyoverIndex] || {
              title: profile.stops[0]?.famousPlace || profile.stops[0]?.name,
              elevation: profile.stops[0]?.elevationLabel || '7,000 ft',
              highlight: profile.stops[0]?.details,
              image: profile.heroImage
            };

            return (
              <div className="space-y-3">
                <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                  <img
                    src={currentWaypoint.image}
                    alt={currentWaypoint.title}
                    className="w-full h-full object-cover transition-all duration-700 scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Waypoint Number Pill */}
                  <div className="absolute top-3 left-3 bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded-lg text-xs shadow-md">
                    Waypoint {flyoverIndex + 1} of {profile.stops.length}
                  </div>

                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-amber-300 font-mono font-bold px-2.5 py-1 rounded-lg text-xs border border-amber-500/30">
                    Alt: {currentWaypoint.elevation}
                  </div>

                  {/* Bottom Title in Image */}
                  <div className="absolute bottom-4 left-4 right-4 space-y-1">
                    <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                      {currentWaypoint.title}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {currentWaypoint.highlight}
                    </p>
                  </div>
                </div>

                {/* Progress Waypoint Selector Dots */}
                <div className="flex items-center justify-between gap-1 overflow-x-auto pt-1">
                  {profile.stops.map((s, idx) => (
                    <button
                      key={s.day}
                      type="button"
                      onClick={() => {
                        setFlyoverIndex(idx);
                        onSelectDay?.(s.day);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        flyoverIndex === idx
                          ? 'bg-emerald-600 text-white font-black ring-2 ring-emerald-400'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      D{s.day} {s.famousPlace ? s.famousPlace.split('&')[0].trim().slice(0, 10) : ''}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ExpeditionRouteMapElevation;
