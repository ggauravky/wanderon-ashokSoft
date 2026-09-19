import React, { useState, useCallback } from 'react';
import { Calendar, Sparkles, ArrowRight, Edit3 } from 'lucide-react';
import ExpeditionOverviewHero from './ExpeditionOverviewHero';
import ExpeditionHighlightsGrid from './ExpeditionHighlightsGrid';
import ExpeditionDayRouteList from './ExpeditionDayRouteList';
import ExpeditionRouteMapElevation from './ExpeditionRouteMapElevation';
import ExpeditionStickyBottomBar from './ExpeditionStickyBottomBar';
import PersonalizeTripModal from './PersonalizeTripModal';

const DAY_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 12, 14];

const WorkspaceOverviewTab = ({
  itinerary,
  formData = {},
  updateFormData,
  missingFields = [],
  onSwitchTab,
  onCustomize,
  onReserve,
  onUpdateItinerary,
  onRegenerate
}) => {
  const [activeDay, setActiveDay] = useState(1);
  const [departureDate, setDepartureDate] = useState(formData.flexibleMonth || 'Sat, 14 June');
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState('');
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);

  const destination = itinerary?.destination || formData.destination || 'Spiti Valley';
  const duration = Number(formData.duration || itinerary?.duration || itinerary?.daysCount || 7);

  const handleDurationChange = useCallback((newDuration) => {
    const val = Math.max(1, Math.min(Number(newDuration) || 7, 30));
    updateFormData?.({ duration: val, durationExplicit: true });
    if (onUpdateItinerary && itinerary) {
      onUpdateItinerary({
        ...itinerary,
        duration: val,
        daysCount: val
      });
    }
    // Trigger full re-generation with new duration
    if (onRegenerate) {
      onRegenerate(val);
    }
  }, [updateFormData, onUpdateItinerary, itinerary, onRegenerate]);

  const handleCustomSubmit = (e) => {
    e?.preventDefault();
    const val = parseInt(customDaysInput, 10);
    if (!isNaN(val) && val >= 1 && val <= 30) {
      handleDurationChange(val);
      setCustomDaysInput('');
      setIsCustomInputOpen(false);
    }
  };

  const isCustomDurationActive = !DAY_OPTIONS.includes(duration);

  const handleDownloadGpx = () => {
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Nomad ${destination} WanderLuxe Expedition Architect">
  <metadata><name>${destination} ${duration}-Day Overland Circuit</name></metadata>
  <trk><name>${destination} High Pass Route</name><trkseg></trkseg></trk>
</gpx>`;
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nomad-${destination.replace(/\s+/g, '')}-${duration}Day-Track.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${duration}-Day ${destination} Expedition`,
        text: `Check out my customized ${destination} road trip route on WanderLuxe!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Itinerary link copied to clipboard!');
    }
  };

  const handleSavePersonalization = (prefs) => {
    updateFormData?.(prefs);
    if (onUpdateItinerary && itinerary) {
      onUpdateItinerary({
        ...itinerary,
        ...prefs,
        travelStyle: prefs.interests?.[0] || itinerary.travelStyle,
        budgetLevel: prefs.budgetLevel || itinerary.budgetLevel
      });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Personalize Modal */}
      <PersonalizeTripModal
        isOpen={isPersonalizeOpen}
        onClose={() => setIsPersonalizeOpen(false)}
        formData={formData}
        onSavePreferences={handleSavePersonalization}
        destination={destination}
      />

      {/* 1. Cinematic Hero Banner & 4 Stat Metric Cards */}
      <ExpeditionOverviewHero
        itinerary={itinerary}
        destination={destination}
        duration={duration}
      />

      {/* TRIP DURATION (DAYS) SELECTOR — ALWAYS VISIBLE, NEVER HIDDEN */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <Calendar size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 leading-none">
                  Trip Duration: {duration} Days
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300/60">
                  Live Updating
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Choose a preset duration or type custom days below to re-render the full route, schedule, and maps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              Active: <strong className="text-emerald-700 font-black">{duration} Days Trip</strong>
            </span>
          </div>
        </div>

        {/* Day Buttons & Custom Days Input Box */}
        <div className="flex flex-wrap items-center gap-2">
          {DAY_OPTIONS.map((d) => {
            const isSelected = duration === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => handleDurationChange(d)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 scale-105'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                {d} Days
              </button>
            );
          })}

          {/* If a custom non-preset duration is active, show its active badge */}
          {isCustomDurationActive && (
            <div className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 text-white border border-emerald-600 shadow-md shadow-emerald-600/25 scale-105 flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>{duration} Days (Custom)</span>
            </div>
          )}

          {/* Custom Day Input Form */}
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5 ml-auto sm:ml-2">
            <div className="relative flex items-center">
              <input
                type="number"
                min="1"
                max="30"
                value={customDaysInput}
                onChange={(e) => setCustomDaysInput(e.target.value)}
                placeholder="Custom (1-30)"
                className="w-28 sm:w-32 px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              <span className="absolute right-2 text-[10px] font-bold text-slate-400 pointer-events-none">
                Days
              </span>
            </div>
            <button
              type="submit"
              disabled={!customDaysInput || parseInt(customDaysInput, 10) < 1 || parseInt(customDaysInput, 10) > 30}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1"
            >
              <span>Set</span>
              <ArrowRight size={12} />
            </button>
          </form>
        </div>
      </div>

      {/* 2. Expedition Highlights Horizontal Scrollable Carousel */}
      <ExpeditionHighlightsGrid
        destination={destination}
        duration={duration}
        onCustomize={() => onCustomize ? onCustomize() : onSwitchTab?.('Vibe')}
      />

      {/* 3. Two-Column Interactive Route Workspace (Day-by-Day Accordion + Light Topo Map Visualizer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols): Day-by-Day Route Accordion */}
        <div className="lg:col-span-5">
          <ExpeditionDayRouteList
            destination={destination}
            duration={duration}
            activeDay={activeDay}
            onSelectDay={setActiveDay}
          />
        </div>

        {/* Right Column (7 Cols): Multi-Tab Functional Topo Map Visualizer & Elevation Cross-Section */}
        <div className="lg:col-span-7">
          <ExpeditionRouteMapElevation
            destination={destination}
            duration={duration}
            activeDay={activeDay}
            onSelectDay={setActiveDay}
          />
        </div>
      </div>

      {/* 4. Sticky Bottom Action Bar with 'Personalise your trip' Action */}
      <ExpeditionStickyBottomBar
        departureDate={departureDate}
        onDateChange={setDepartureDate}
        onShare={handleShare}
        onReserve={() => onCustomize ? onCustomize() : onSwitchTab?.('Vibe')}
        onPersonalize={() => onCustomize ? onCustomize() : onSwitchTab?.('Vibe')}
        onDownloadGpx={handleDownloadGpx}
      />
    </div>
  );
};

export default WorkspaceOverviewTab;
