import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import TripCard from './TripCard.jsx';

/**
 * =============================================================================
 * HomeTripSection Component
 * Reusable, responsive trip discovery section for WanderLuxe Home page
 * 
 * Features:
 * - Desktop: Compact 4-column grid (up to 2 rows for 6-8 cards, 1 row for 4 cards)
 * - Mobile: Touch-friendly horizontal snap-scroll row (~1.2 cards peek)
 * - Accessible, crawlable View All anchor navigation
 * - Dynamic count integration
 * - Built-in card deduplication & deterministic limit enforcement
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
  showWeather = true
}) => {
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
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6 sm:mb-8">
          <div className="max-w-2xl">
            {eyebrow && (
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-600 block mb-1">
                {eyebrow}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Right Header: Extra Controls (e.g. Month Chips) + Desktop View All Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shrink-0">
            {headerChildren}

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

        {/* Trips Display: Responsive Grid (Desktop) + Touch-friendly Horizontal Snap Scroll (Mobile) */}
        {uniqueTrips.length > 0 ? (
          <div>
            <div 
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 sm:overflow-visible scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {uniqueTrips.map((trip) => (
                <div
                  key={trip.id || trip._id || trip.slug}
                  className="w-[82vw] max-w-[310px] sm:w-auto shrink-0 snap-start flex flex-col"
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
