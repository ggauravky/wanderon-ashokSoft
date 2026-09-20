import React, { useState } from 'react';
import { Calendar, ShieldCheck, Download, Share2, ArrowRight } from 'lucide-react';

const ExpeditionStickyBottomBar = ({
  departureDate = 'Sat, 14 June',
  onDateChange,
  onShare,
  onReserve,
  onDownloadGpx
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl py-3 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Departure Date & Medical Perks */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-2 border border-slate-200 transition-colors cursor-pointer"
            >
              <Calendar size={14} className="text-emerald-600" />
              <span>Departs: <strong className="text-slate-900">{departureDate}</strong></span>
            </button>

            {showDatePicker && (
              <div className="absolute bottom-12 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-40 text-xs space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Select Departure Date
                </span>
                <input
                  type="date"
                  onChange={(e) => {
                    if (e.target.value) {
                      const d = new Date(e.target.value);
                      onDateChange?.(d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
                      setShowDatePicker(false);
                    }
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
            )}
          </div>

          {/* Certified Perks */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Oxygen Cylinders & Medic
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Certified Local Chauffeur
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* GPX Export */}
          <button
            type="button"
            onClick={onDownloadGpx}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download GPS Track GPX File"
          >
            <Download size={13} />
            <span className="hidden sm:inline">GPX</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={onShare}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">Share Itinerary</span>
          </button>

          {/* Personalise Button */}
          <button
            type="button"
            onClick={onReserve || onPersonalize}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all cursor-pointer grow sm:grow-0 justify-center"
          >
            <span>Personalise your trip</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpeditionStickyBottomBar;
