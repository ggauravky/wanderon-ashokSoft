import React, { useRef } from 'react';
import { Sparkles, SlidersHorizontal, ChevronLeft, ChevronRight, MapPin, Eye } from 'lucide-react';
import { getExpeditionProfile } from '../../utils/expeditionPlannerData';

const ExpeditionHighlightsGrid = ({ destination = 'Spiti Valley', duration = 7, onCustomize }) => {
  const profile = getExpeditionProfile(destination, duration);
  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header with Carousel Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shadow-xs">
            <Sparkles size={15} />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Expedition Highlights
            </h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Scroll through {profile.highlights.length} key highlights & landmarks
            </span>
          </div>
        </div>

        {/* Action Buttons & Carousel Arrows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCustomize}
            className="hidden sm:inline-flex text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs items-center gap-1.5 transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={12} />
            <span>Customize (8 Available)</span>
          </button>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={scrollLeft}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2 pt-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {profile.highlights.map((item, idx) => (
          <div
            key={item.id || idx}
            className="snap-start shrink-0 w-[260px] sm:w-[280px] md:w-[300px] group relative rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            {/* Visual Photo Card */}
            <div className="relative h-44 w-full overflow-hidden bg-slate-900">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

              {/* Category Pill */}
              <div className="absolute top-3 left-3">
                <span className="text-[9px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 shadow-xs">
                  {item.category}
                </span>
              </div>

              {/* Altitude Tag Pill */}
              <div className="absolute bottom-3 right-3">
                <span className="text-[10px] font-mono font-bold bg-black/80 backdrop-blur-md text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
                  {item.altitude}
                </span>
              </div>

              {/* Day Badge */}
              <div className="absolute bottom-3 left-3">
                <span className="text-[10px] font-black uppercase bg-white text-slate-900 px-2 py-0.5 rounded-md shadow-xs">
                  {item.day}
                </span>
              </div>
            </div>

            {/* Bottom Details Block */}
            <div className="p-4 space-y-1 grow flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2">
                  {item.subtitle}
                </p>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin size={11} className="text-emerald-600" />
                  <span>{destination}</span>
                </span>
                <span className="text-emerald-700 font-extrabold flex items-center gap-0.5">
                  <Eye size={11} /> Vetted
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpeditionHighlightsGrid;
