import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ChevronLeft, ChevronRight } from 'lucide-react';
import TripCard from './TripCard.jsx';

/**
 * =============================================================================
 * HomeTripSection Component
 * Reusable, responsive trip discovery section for WanderLuxe Home page
 * 
 * Features:
 * - Side-by-side horizontal scrollable row with smooth snap scrolling
 * - Desktop left/right scroll navigation buttons
 * - Accessible View All anchor navigation
 * - Dynamic inventory count integration
 * - Built-in card deduplication & limit enforcement
 * =============================================================================
 */
const HomeTripSection = ({
  id,
  eyebrow,
  title,
  description,
  trips = [],
  totalAvailable = null,
  limit = 8,
  viewAllBaseLabel = 'Trips',
  viewAllPath = '/trips',
  headerChildren = null,
  bgClass = 'bg-transparent',
  showWeather = false
}) => {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Deduplicate trips by canonical ID
  const uniqueTrips = React.useMemo(() => {
    const seen = new Set();
    const result = [];
    (trips || []).forEach((t) => {
      if (!t) return;
      const key = String(t.id || t._id || t.slug);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(t);
      }
    });
    return result.slice(0, limit);
  }, [trips, limit]);

  // Construct dynamic CTA label with authentic inventory count if available
  const ctaLabel = React.useMemo(() => {
    const count = typeof totalAvailable === 'number' && totalAvailable > 0 
      ? totalAvailable 
      : (trips?.length > 0 ? trips.length : null);
    
    if (count && count > uniqueTrips.length) {
      return `View All ${count} ${viewAllBaseLabel}`;
    }
    return `View All ${viewAllBaseLabel}`;
  }, [totalAvailable, trips, uniqueTrips.length, viewAllBaseLabel]);

  return (
    <section id={id} className={`travel-section ${bgClass}`}>
      <div className="travel-container">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4 mb-6 sm:mb-8">
          <div className="max-w-2xl space-y-1">
            {eyebrow && (
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-600 block">
                {eyebrow}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Right Header: Month Pills + Scroll Arrows + View All CTA */}
          <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap lg:flex-nowrap shrink-0">
            {headerChildren}

            <div className="flex items-center gap-2 shrink-0">
              {/* Left / Right Scroll Navigation Arrows for Desktop */}
              {uniqueTrips.length > 3 && (
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleScroll('left')}
                    className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-xs cursor-pointer active:scale-95"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScroll('right')}
                    className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-xs cursor-pointer active:scale-95"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}

              <Link
                to={viewAllPath}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/80 px-4 py-2 rounded-2xl transition-all shadow-2xs group shrink-0"
                aria-label={ctaLabel}
              >
                <span>{ctaLabel}</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Trips Display: Side-by-Side Horizontal Scrollable Row */}
        {uniqueTrips.length > 0 ? (
          <div>
            <div 
              ref={scrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-5 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {uniqueTrips.map((trip) => (
                <div
                  key={trip.id || trip._id || trip.slug}
                  className="w-[82vw] max-w-[300px] sm:w-[285px] md:w-[295px] lg:w-[300px] shrink-0 snap-start flex flex-col"
                >
                  <TripCard trip={trip} showWeather={showWeather} />
                </div>
              ))}
            </div>

            {/* Mobile View All CTA button below cards */}
            <div className="sm:hidden mt-4 text-center">
              <Link
                to={viewAllPath}
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-wider shadow-xs hover:bg-slate-50 active:scale-[0.99] transition-all"
                aria-label={ctaLabel}
              >
                <span>{ctaLabel}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
            <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-black text-slate-700">No scheduled departures matching this filter</h3>
            <p className="text-xs text-slate-400 mt-1">Check other dates or explore our complete catalog.</p>
            <Link 
              to={viewAllPath} 
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:text-emerald-700"
            >
              <span>Browse All {viewAllBaseLabel}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeTripSection;
