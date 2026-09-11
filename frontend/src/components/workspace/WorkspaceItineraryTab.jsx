import React, { useState } from 'react';
import { 
  RefreshCw, MapPin, Clock, Compass, Bed, Car, Utensils, 
  Sparkles, ArrowDown, ChevronRight, MessageSquare, Plus, Edit3 
} from 'lucide-react';
import ItineraryDayGallery from '../ItineraryDayGallery';
import AICopilotPanel from './AICopilotPanel';
import ActivityEditDrawer from './ActivityEditDrawer';

const QUICK_REFINEMENT_CHIPS = [
  'Make this day relaxed',
  'Less driving',
  'More nature',
  'More local food',
  'Add hidden gem'
];

const WorkspaceItineraryTab = ({
  itinerary,
  onRegenerateDay,
  regeneratingDayIdx,
  onApplyCopilotChanges,
  onUndoCopilotChanges,
  canUndoCopilot
}) => {
  const days = itinerary?.days || itinerary?.itineraryDays || [];
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  // Activity Edit Drawer State
  const [activeActivityForEdit, setActiveActivityForEdit] = useState(null);
  const [activeSlotForEdit, setActiveSlotForEdit] = useState(null);

  // Mobile Bottom Sheet state for Copilot
  const [mobileCopilotOpen, setMobileCopilotOpen] = useState(false);

  const activeDay = days[selectedDayIdx] || days[0];

  const handleOpenActivityEdit = (activity, slotName) => {
    setActiveActivityForEdit(activity);
    setActiveSlotForEdit(slotName);
  };

  const handleReplaceActivity = (oldActivity, newAlternative) => {
    // In-memory swap
    if (!activeDay) return;
    const slotList = activeDay[activeSlotForEdit];
    if (Array.isArray(slotList)) {
      const idx = slotList.findIndex((a) => (a.activity || a.name) === (oldActivity.activity || oldActivity.name));
      if (idx !== -1) {
        slotList[idx] = {
          ...slotList[idx],
          activity: newAlternative.name,
          name: newAlternative.name,
          description: newAlternative.rationale
        };
      }
    }
  };

  const handleRemoveActivity = (oldActivity) => {
    if (!activeDay) return;
    const slotList = activeDay[activeSlotForEdit];
    if (Array.isArray(slotList)) {
      activeDay[activeSlotForEdit] = slotList.filter((a) => (a.activity || a.name) !== (oldActivity.activity || oldActivity.name));
    }
  };

  return (
    <div className="relative">
      {/* Activity Edit Drawer */}
      <ActivityEditDrawer
        isOpen={!!activeActivityForEdit}
        onClose={() => setActiveActivityForEdit(null)}
        activity={activeActivityForEdit}
        slotName={activeSlotForEdit}
        dayNumber={activeDay?.day || 1}
        onReplace={handleReplaceActivity}
        onRemove={handleRemoveActivity}
        destination={itinerary?.destination || 'Meghalaya'}
      />

      {/* 3-COLUMN DESKTOP WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================================================================= */}
        {/* COLUMN 1: LEFT DAY RAIL (3 Cols on lg) */}
        {/* ================================================================= */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-2 sticky top-24">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-2 mb-1">
            Trip Timeline ({days.length} Days)
          </span>

          {/* Mobile Horizontal Day Selector */}
          <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-none">
            {days.map((d, idx) => (
              <button
                key={d.day}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all ${
                  selectedDayIdx === idx
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Day {d.day}
              </button>
            ))}
          </div>

          {/* Desktop Vertical Day List */}
          <div className="hidden lg:flex flex-col gap-1.5">
            {days.map((d, idx) => {
              const isSelected = selectedDayIdx === idx;
              const mainTitle = d.title ? d.title.replace(/^Day\s*\d+:\s*/i, '') : `Exploration ${d.day}`;
              const stayLocation = d.stay ? d.stay.split(' ')[0] : itinerary?.destination;

              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`p-3 rounded-2xl text-left transition-all group cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200/60'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Day {d.day}
                      </span>
                      <span className={`text-[11px] font-medium truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {stayLocation}
                      </span>
                    </div>
                    <span className={`text-xs font-bold block truncate mt-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {mainTitle}
                    </span>
                  </div>
                  <ChevronRight size={14} className={`shrink-0 transition-transform ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* COLUMN 2: CENTER DAY DETAILS (5-6 Cols on lg) */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 space-y-6">
          {activeDay && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-2xs space-y-6">
              
              {/* Day Header & Actions */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                      Day {activeDay.day}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      📍 {activeDay.locationName || itinerary?.destination}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {activeDay.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    {activeDay.tips?.[0] || 'Balanced day featuring regional highlights with verified road transit.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRegenerateDay(activeDay.day)}
                  disabled={regeneratingDayIdx === activeDay.day}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  title="Recalculate route and refresh gallery for this day"
                >
                  <RefreshCw size={13} className={regeneratingDayIdx === activeDay.day ? 'animate-spin text-emerald-600' : ''} />
                  <span>Regen</span>
                </button>
              </div>

              {/* 3-IMAGE DATABASE-BACKED NATURE GALLERY */}
              <div className="rounded-2xl overflow-hidden">
                <ItineraryDayGallery
                  day={activeDay}
                  destination={itinerary?.destination}
                  isPrintMode={false}
                />
              </div>

              {/* Quick AI Refinement Chips for Selected Day */}
              <div className="pt-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">
                  Quick Day Refinements
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REFINEMENT_CHIPS.map((chip, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onApplyCopilotChanges({ dayIndex: selectedDayIdx, refinement: chip })}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-transparent hover:border-emerald-200 text-[11px] font-bold text-slate-600 transition-all cursor-pointer"
                    >
                      ✨ {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chronological Time Blocks (Morning / Afternoon / Evening) */}
              <div className="space-y-4 pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Daily Schedule
                </span>

                {/* Morning Slot */}
                {Array.isArray(activeDay.morning) && activeDay.morning.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                      Morning
                    </span>
                    {activeDay.morning.map((act, i) => (
                      <div
                        key={i}
                        onClick={() => handleOpenActivityEdit(act, 'morning')}
                        className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/40 border border-slate-200/60 hover:border-emerald-300 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 group-hover:text-emerald-800">
                            {act.activity || act.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={11} /> {act.time || 'Morning'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{act.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                          <span>📍 {act.location || activeDay.locationName || itinerary?.destination}</span>
                          <span>⏱ {act.travelTime || 'Transit ~30m'}</span>
                          <span className="text-emerald-700 font-bold group-hover:underline">Click to edit →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Travel Segment Indicator between Morning & Afternoon */}
                <div className="flex items-center justify-center gap-2 py-1 text-slate-400 text-[11px] font-bold">
                  <ArrowDown size={12} className="text-emerald-600" />
                  <span>~20–30 min scenic road transit</span>
                </div>

                {/* Afternoon Slot */}
                {Array.isArray(activeDay.afternoon) && activeDay.afternoon.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                      Afternoon
                    </span>
                    {activeDay.afternoon.map((act, i) => (
                      <div
                        key={i}
                        onClick={() => handleOpenActivityEdit(act, 'afternoon')}
                        className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/40 border border-slate-200/60 hover:border-emerald-300 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 group-hover:text-emerald-800">
                            {act.activity || act.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={11} /> {act.time || 'Afternoon'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{act.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                          <span>📍 {act.location || activeDay.locationName || itinerary?.destination}</span>
                          <span>⏱ {act.travelTime || 'Transit ~25m'}</span>
                          <span className="text-emerald-700 font-bold group-hover:underline">Click to edit →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Evening Slot */}
                {Array.isArray(activeDay.evening) && activeDay.evening.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block">
                      Evening & Sunset
                    </span>
                    {activeDay.evening.map((act, i) => (
                      <div
                        key={i}
                        onClick={() => handleOpenActivityEdit(act, 'evening')}
                        className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/40 border border-slate-200/60 hover:border-emerald-300 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 group-hover:text-emerald-800">
                            {act.activity || act.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={11} /> {act.time || 'Evening'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{act.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                          <span>📍 {act.location || activeDay.locationName || itinerary?.destination}</span>
                          <span className="text-emerald-700 font-bold group-hover:underline">Click to edit →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Day Stays & Dining Context Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                {/* Stay Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                  <Bed size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      Overnight Stay
                    </span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {activeDay.stay || `${itinerary?.destination} Boutique Hotel`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      {activeDay.dailyCost || '₹3,500 – ₹5,000 estimated'}
                    </span>
                  </div>
                </div>

                {/* Meals & Transit Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                  <Utensils size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      Dining Guidance
                    </span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      Regional cuisine near {activeDay.locationName || itinerary?.destination}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Breakfast included at stay
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* COLUMN 3: RIGHT AI COPILOT (3-4 Cols on lg) */}
        {/* ================================================================= */}
        <div className="hidden lg:block lg:col-span-3 sticky top-24">
          <AICopilotPanel
            itinerary={itinerary}
            onApplyChanges={onApplyCopilotChanges}
            onUndo={onUndoCopilotChanges}
            canUndo={canUndoCopilot}
          />
        </div>

      </div>

      {/* Floating Action Button for Mobile AI Copilot */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setMobileCopilotOpen(true)}
          className="px-4 py-3 bg-slate-900 text-white rounded-full shadow-2xl flex items-center gap-2 text-xs font-black border border-slate-700"
        >
          <Sparkles size={14} className="text-emerald-400" />
          <span>Ask AI Copilot</span>
        </button>
      </div>

      {/* Mobile Copilot Bottom Sheet */}
      {mobileCopilotOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end">
          <div className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col p-4">
            <div className="flex justify-end pb-2">
              <button
                type="button"
                onClick={() => setMobileCopilotOpen(false)}
                className="text-xs font-bold text-slate-500 px-3 py-1 bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
            <div className="flex-grow overflow-y-auto">
              <AICopilotPanel
                itinerary={itinerary}
                onApplyChanges={(payload) => {
                  onApplyCopilotChanges(payload);
                  setMobileCopilotOpen(false);
                }}
                onUndo={onUndoCopilotChanges}
                canUndo={canUndoCopilot}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceItineraryTab;
