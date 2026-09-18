import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, MapPin, Sparkles, Filter, 
  RotateCcw, Compass, Award, Calendar, ChevronRight, Tag,
  ArrowUpDown, X, Check, Flame, Clock, IndianRupee, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TripCard from '../components/TripCard.jsx';
import SEOHead from '../components/SEOHead.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import FilterSidebar, { 
  DESTINATION_OPTIONS, MONTH_OPTIONS, DURATION_OPTIONS, 
  BUDGET_OPTIONS, TRIP_TYPE_OPTIONS, MOOD_OPTIONS, STARTING_CITY_OPTIONS 
} from '../components/FilterSidebar.jsx';
import { UPCOMING_TRIPS } from '../constants/mockData.js';
import { useTravelContext } from '../hooks/useTravelContext.js';
import { getPresetByPath } from '../config/discoveryTaxonomy.js';

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Context Recommendation' },
  { id: 'nearest_batch', label: 'Nearest Departure Date' },
  { id: 'price_asc', label: 'Price: Low → High' },
  { id: 'price_desc', label: 'Price: High → Low' },
  { id: 'dur_asc', label: 'Duration: Short → Long' },
  { id: 'dur_desc', label: 'Duration: Long → Short' },
  { id: 'trending', label: 'Trending & Popularity' }
];

const Destinations = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const travelCtx = useTravelContext() || {};
  const recommendedTrips = travelCtx.recommendedTrips || UPCOMING_TRIPS || [];
  const season = travelCtx.season || {};

  // Resolve current route's authoritative taxonomy preset
  const activePreset = useMemo(() => {
    return getPresetByPath(location.pathname);
  }, [location.pathname]);

  // Mobile Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Read filter values from URL Search Params with fallback to active preset defaults
  const searchQuery = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'recommended';

  const filters = useMemo(() => {
    return {
      destination: searchParams.get('dest') || activePreset?.defaultFilters?.destination || 'all',
      month: searchParams.get('month') || 'all',
      duration: searchParams.get('dur') || activePreset?.defaultFilters?.duration || 'all',
      budget: searchParams.get('budget') || activePreset?.defaultFilters?.budget || 'all',
      tripType: searchParams.get('type') || activePreset?.defaultFilters?.category || 'all',
      mood: searchParams.get('mood') || activePreset?.defaultFilters?.climate || 'all',
      city: searchParams.get('city') || 'all'
    };
  }, [searchParams, activePreset]);

  // Update URL Search Params helper
  const updateUrlParam = useCallback((key, value) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (!value || value === 'all' || value === 'All' || value === '') {
        updated.delete(key);
      } else {
        updated.set(key, value);
      }
      return updated;
    }, { replace: true });
  }, [setSearchParams]);

  const handleFilterChange = (filterKey, value) => {
    const keyMap = {
      destination: 'dest',
      month: 'month',
      duration: 'dur',
      budget: 'budget',
      tripType: 'type',
      mood: 'mood',
      city: 'city'
    };
    updateUrlParam(keyMap[filterKey] || filterKey, value);
  };

  const handleSearchChange = (val) => {
    updateUrlParam('q', val);
  };

  const handleSortChange = (val) => {
    updateUrlParam('sort', val);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // -------------------------------------------------------------
  // Filter Match Predicate Function
  // -------------------------------------------------------------
  const matchTripAgainstFilters = useCallback((trip, currentFilters, query) => {
    if (!trip) return false;

    // 1. Preset Base Taxonomy Filter
    if (typeof activePreset?.filterPredicate === 'function') {
      if (!activePreset.filterPredicate(trip)) return false;
    }

    const title = (trip.title || '').toLowerCase();
    const loc = (trip.location || '').toLowerCase();
    const dest = (trip.destination || '').toLowerCase();
    const overview = (trip.overview || '').toLowerCase();
    const tags = Array.isArray(trip.tags) ? trip.tags.map(t => (t || '').toLowerCase()) : [];
    const dur = (trip.duration || '').toLowerCase();
    const cat = (trip.category || '').toLowerCase();
    const grade = (trip.grade || '').toLowerCase();
    const sp = (trip.startingPoint || '').toLowerCase();
    const price = Number(trip.price) || 0;

    // 2. Search Query
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      const matchQ = title.includes(q) || loc.includes(q) || dest.includes(q) || overview.includes(q) || tags.some(t => t.includes(q));
      if (!matchQ) return false;
    }

    // 3. Destination Filter
    if (currentFilters.destination && currentFilters.destination !== 'all' && currentFilters.destination !== 'All') {
      const d = currentFilters.destination.toLowerCase();
      if (d === 'india' || d === 'domestic') {
        // Exclude known international destinations
        const intlKeywords = ['bali', 'indonesia', 'sri lanka', 'thailand', 'vietnam', 'nepal', 'bhutan', 'maldives', 'international'];
        if (intlKeywords.some(kw => dest.includes(kw) || cat.includes(kw))) return false;
      } else if (d === 'international') {
        // Include only trips with international destinations or category
        const intlKeywords = ['bali', 'indonesia', 'sri lanka', 'thailand', 'vietnam', 'nepal', 'bhutan', 'maldives', 'international'];
        if (!intlKeywords.some(kw => dest.includes(kw) || cat.includes(kw))) return false;
      } else {
        if (!dest.includes(d) && !loc.includes(d)) return false;
      }
    }

    // 4. Month Filter
    if (currentFilters.month && currentFilters.month !== 'all') {
      const m = currentFilters.month.toLowerCase();
      const nextB = (trip.nextBatch || '').toLowerCase();
      const batches = Array.isArray(trip.availableBatches) 
        ? trip.availableBatches.map(b => (b.dates || '').toLowerCase()).join(' ')
        : '';
      const bestM = Array.isArray(trip.bestMonths) 
        ? trip.bestMonths.map(bm => (bm || '').toLowerCase()).join(' ')
        : '';

      const matchMonth = nextB.includes(m) || batches.includes(m) || bestM.includes(m);
      if (!matchMonth) return false;
    }

    // 5. Duration Filter
    if (currentFilters.duration && currentFilters.duration !== 'all') {
      if (currentFilters.duration === 'weekend') {
        if (!dur.includes('2n') && !dur.includes('3d') && !dur.includes('3n/4d') && !cat.includes('weekend')) return false;
      } else if (currentFilters.duration === 'short') {
        if (!dur.includes('4n') && !dur.includes('5d') && !dur.includes('3n/4d') && !dur.includes('5n/6d')) return false;
      } else if (currentFilters.duration === 'expedition') {
        const numDays = parseInt(dur, 10) || 0;
        if (numDays < 6 && !dur.includes('6n') && !dur.includes('7d') && !dur.includes('8d') && !dur.includes('7n') && !dur.includes('8n') && !dur.includes('9d') && !dur.includes('10d') && !dur.includes('6d') && !dur.includes('5n/6d') && !dur.includes('6n/7d')) return false;
      }
    }

    // 6. Budget Filter
    if (currentFilters.budget && currentFilters.budget !== 'all') {
      if (currentFilters.budget === 'under15k' && price > 15000) return false;
      if (currentFilters.budget === '15k_25k' && (price < 15000 || price > 25000)) return false;
      if (currentFilters.budget === '25k_35k' && (price < 25000 || price > 35000)) return false;
      if (currentFilters.budget === 'above35k' && price < 35000) return false;
    }

    // 7. Trip Style / Category Filter
    if (currentFilters.tripType && currentFilters.tripType !== 'all') {
      const type = currentFilters.tripType.toLowerCase();
      if (type === 'community') {
        // All 50 trips are community/group
      } else if (type === 'backpacking') {
        if (!cat.includes('backpacking') && !tags.includes('backpacking') && !tags.includes('high altitude') && !tags.includes('offbeat')) return false;
      } else if (type === 'weekend') {
        if (!cat.includes('weekend') && !tags.includes('weekend trips') && !dur.includes('2n') && !dur.includes('3d')) return false;
      } else if (type === 'adventure') {
        if (!cat.includes('adventure') && !tags.includes('adventure') && !tags.includes('treks') && !['challenging', 'difficult'].includes(grade)) return false;
      } else if (type === 'romantic') {
        if (!['goa', 'kerala', 'bali', 'kashmir'].some(r => dest.includes(r)) && !tags.includes('beach') && !tags.includes('lakes')) return false;
      } else if (type === 'culture') {
        if (!cat.includes('culture') && !dest.includes('rajasthan') && !tags.includes('culture') && !tags.includes('heritage')) return false;
      }
    }

    // 8. Mood / Climate Filter
    if (currentFilters.mood && currentFilters.mood !== 'all') {
      const md = currentFilters.mood.toLowerCase();
      if (md === 'cold') {
        if (!['spiti', 'ladakh', 'kashmir', 'auli', 'himachal', 'uttarakhand'].some(r => loc.includes(r) || dest.includes(r))) return false;
      } else if (md === 'tropical') {
        if (!['goa', 'bali', 'kerala'].some(r => loc.includes(r) || dest.includes(r))) return false;
      } else if (md === 'rainforest') {
        if (!['meghalaya', 'wayanad'].some(r => loc.includes(r) || dest.includes(r))) return false;
      } else if (md === 'heritage') {
        if (!dest.includes('rajasthan') && !tags.includes('heritage') && !tags.includes('culture')) return false;
      }
    }

    // 9. Starting City Filter
    if (currentFilters.city && currentFilters.city !== 'all') {
      const c = currentFilters.city.toLowerCase();
      if (c === 'delhi') {
        if (!sp.includes('delhi') && !sp.includes('chandigarh')) return false;
      } else if (c === 'rishikesh') {
        if (!sp.includes('rishikesh') && !sp.includes('haridwar') && !sp.includes('dehradun')) return false;
      } else if (c === 'shimla') {
        if (!sp.includes('shimla') && !sp.includes('manali') && !sp.includes('kasol')) return false;
      } else if (c === 'goa') {
        if (!sp.includes('goa') && !sp.includes('thivim') && !sp.includes('mopa')) return false;
      } else if (c === 'cochin') {
        if (!sp.includes('cochin') && !sp.includes('kochi') && !sp.includes('calicut') && !sp.includes('trivandrum')) return false;
      } else if (c === 'jaipur') {
        if (!sp.includes('jaipur') && !sp.includes('udaipur') && !sp.includes('jaisalmer')) return false;
      } else if (c === 'bali') {
        if (!sp.includes('bali') && !sp.includes('denpasar')) return false;
      } else {
        if (!sp.includes(c)) return false;
      }
    }

    return true;
  }, [activePreset]);

  // Main Filtered Trips Computation with Sorting
  const filteredTrips = useMemo(() => {
    try {
      const catalog = recommendedTrips && recommendedTrips.length > 0 ? recommendedTrips : UPCOMING_TRIPS;

      let result = catalog.filter((trip) => matchTripAgainstFilters(trip, filters, searchQuery));

      // Sorting
      if (sortBy === 'price_asc') {
        result.sort((a, b) => (Number(a?.price) || 0) - (Number(b?.price) || 0));
      } else if (sortBy === 'price_desc') {
        result.sort((a, b) => (Number(b?.price) || 0) - (Number(a?.price) || 0));
      } else if (sortBy === 'dur_asc') {
        result.sort((a, b) => (parseInt(a?.duration) || 3) - (parseInt(b?.duration) || 3));
      } else if (sortBy === 'dur_desc') {
        result.sort((a, b) => (parseInt(b?.duration) || 3) - (parseInt(a?.duration) || 3));
      } else if (sortBy === 'trending') {
        result.sort((a, b) => ((Number(b?.reviews) || 0) * (Number(b?.rating) || 4.5)) - ((Number(a?.reviews) || 0) * (Number(a?.rating) || 4.5)));
      } else if (sortBy === 'nearest_batch') {
        result.sort((a, b) => (a.nextBatch || '').localeCompare(b.nextBatch || ''));
      } else {
        // Recommended
        result.sort((a, b) => (Number(b?.recommendationScore) || 50) - (Number(a?.recommendationScore) || 50));
      }

      return result;
    } catch (err) {
      console.warn('Filter computation error:', err);
      return UPCOMING_TRIPS;
    }
  }, [recommendedTrips, matchTripAgainstFilters, filters, searchQuery, sortBy]);

  // Real Counts Matrix for Sidebar Badges
  const countsByOption = useMemo(() => {
    const catalog = recommendedTrips && recommendedTrips.length > 0 ? recommendedTrips : UPCOMING_TRIPS;
    const matrix = {};

    DESTINATION_OPTIONS.forEach(opt => {
      matrix[`destination_${opt.id}`] = catalog.filter(t => 
        matchTripAgainstFilters(t, { ...filters, destination: opt.id }, searchQuery)
      ).length;
    });

    MONTH_OPTIONS.forEach(opt => {
      matrix[`month_${opt.id}`] = catalog.filter(t => 
        matchTripAgainstFilters(t, { ...filters, month: opt.id }, searchQuery)
      ).length;
    });

    DURATION_OPTIONS.forEach(opt => {
      matrix[`duration_${opt.id}`] = catalog.filter(t => 
        matchTripAgainstFilters(t, { ...filters, duration: opt.id }, searchQuery)
      ).length;
    });

    BUDGET_OPTIONS.forEach(opt => {
      matrix[`budget_${opt.id}`] = catalog.filter(t => 
        matchTripAgainstFilters(t, { ...filters, budget: opt.id }, searchQuery)
      ).length;
    });

    TRIP_TYPE_OPTIONS.forEach(opt => {
      matrix[`tripType_${opt.id}`] = catalog.filter(t => 
        matchTripAgainstFilters(t, { ...filters, tripType: opt.id }, searchQuery)
      ).length;
    });

    MOOD_OPTIONS.forEach(opt => {
      matrix[`mood_${opt.id}`] = catalog.filter(t => 
        matchTripAgainstFilters(t, { ...filters, mood: opt.id }, searchQuery)
      ).length;
    });

    STARTING_CITY_OPTIONS.forEach(opt => {
      matrix[`city_${opt.id}`] = catalog.filter(t => 
        matchTripAgainstFilters(t, { ...filters, city: opt.id }, searchQuery)
      ).length;
    });

    return matrix;
  }, [recommendedTrips, matchTripAgainstFilters, filters, searchQuery]);

  // Active Filter Tags Summary List
  const activeTags = useMemo(() => {
    const list = [];
    if (searchQuery) list.push({ key: 'q', label: `Keyword: "${searchQuery}"` });
    if (filters.destination !== 'all') {
      const found = DESTINATION_OPTIONS.find(o => o.id === filters.destination);
      if (found) list.push({ key: 'dest', label: found.label });
    }
    if (filters.month !== 'all') {
      const found = MONTH_OPTIONS.find(o => o.id === filters.month);
      if (found) list.push({ key: 'month', label: found.label });
    }
    if (filters.duration !== 'all') {
      const found = DURATION_OPTIONS.find(o => o.id === filters.duration);
      if (found) list.push({ key: 'dur', label: found.label });
    }
    if (filters.budget !== 'all') {
      const found = BUDGET_OPTIONS.find(o => o.id === filters.budget);
      if (found) list.push({ key: 'budget', label: found.label });
    }
    if (filters.tripType !== 'all') {
      const found = TRIP_TYPE_OPTIONS.find(o => o.id === filters.tripType);
      if (found) list.push({ key: 'type', label: found.label });
    }
    if (filters.mood !== 'all') {
      const found = MOOD_OPTIONS.find(o => o.id === filters.mood);
      if (found) list.push({ key: 'mood', label: found.label });
    }
    if (filters.city !== 'all') {
      const found = STARTING_CITY_OPTIONS.find(o => o.id === filters.city);
      if (found) list.push({ key: 'city', label: `Starts: ${found.label}` });
    }
    return list;
  }, [searchQuery, filters]);

  // Dynamic Breadcrumb Items
  const breadcrumbItems = useMemo(() => {
    if (activePreset.id === 'all-trips') {
      return [{ label: 'All Expeditions', path: null }];
    }
    return [
      { label: 'All Expeditions', path: '/trips' },
      { label: activePreset.name, path: null }
    ];
  }, [activePreset]);

  // Schema.org Structured Data
  const jsonLdData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": activePreset.heading,
      "description": activePreset.metaDescription,
      "url": `https://wanderluxe.in${activePreset.canonicalPath}`,
      "numberOfItems": filteredTrips.length,
      "itemListElement": filteredTrips.slice(0, 10).map((trip, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "TouristTrip",
          "name": trip.title,
          "description": trip.overview,
          "touristType": trip.category,
          "offers": {
            "@type": "Offer",
            "price": trip.price,
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock"
          }
        }
      }))
    };
  }, [activePreset, filteredTrips]);

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      {/* Dynamic Route Preset SEO Head (Canonical link remains stable on the preset) */}
      <SEOHead
        title={activePreset.seoTitle}
        description={activePreset.metaDescription}
        canonical={activePreset.canonicalPath}
        schemaJson={jsonLdData}
      />

      <div className="container mx-auto px-4 md:px-8">
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Dynamic Preset Page Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8 mt-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
              <Sparkles size={13} /> {activePreset.badge || 'Curated Travel Discovery'}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              {activePreset.heading}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl">
              {activePreset.subheading}
            </p>
          </div>

          {/* Preset Quick Stats / Active count */}
          <div className="flex items-center gap-2 self-start md:self-end">
            <span className="text-xs font-extrabold text-slate-600 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-xs">
              <strong className="text-emerald-600 text-sm font-black">{filteredTrips.length}</strong> Trips Available
            </span>
          </div>
        </div>

        {/* Quick Filter Pill Tags for Current Preset */}
        {activePreset.quickPills && activePreset.quickPills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-xs">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 pl-1">
              <Tag size={11} className="text-emerald-600" /> Popular:
            </span>
            {activePreset.quickPills.map((pill) => {
              const isActive = searchQuery.toLowerCase() === pill.toLowerCase();
              return (
                <button
                  key={pill}
                  onClick={() => handleSearchChange(isActive ? '' : pill)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {pill}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Grid Layout: Sidebar (Desktop) + Main Listing Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Desktop Left Sidebar (Sticky) */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <FilterSidebar
              filters={filters}
              onChangeFilter={handleFilterChange}
              onResetFilters={handleResetFilters}
              totalMatchingTrips={filteredTrips.length}
              countsByOption={countsByOption}
            />
          </div>

          {/* Right Main Content Stream */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Top Toolbar: Search Input + Sorting Dropdown */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-grow w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder={`Search in ${activePreset.name} (e.g. Spiti, Waterfalls, Trekking, Bali)...`}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearchChange('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Mobile Filter Drawer Trigger Button */}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <SlidersHorizontal size={14} className="text-emerald-400" />
                  <span>Filters {activeTags.length > 0 && `(${activeTags.length})`}</span>
                </button>

                {/* Sort Dropdown */}
                <div className="relative w-full sm:w-auto shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer pr-8"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filter Dismissible Pills */}
              {activeTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">
                    Active Filters:
                  </span>
                  {activeTags.map((tag) => (
                    <button
                      key={tag.key}
                      onClick={() => updateUrlParam(tag.key, '')}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg text-[11px] font-black flex items-center gap-1.5 hover:bg-emerald-100 transition-all cursor-pointer"
                      title="Remove filter"
                    >
                      <span>{tag.label}</span>
                      <X size={12} className="text-emerald-600" />
                    </button>
                  ))}

                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] font-black text-rose-600 hover:text-rose-700 underline ml-2 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Results Grid / Empty State */}
            {filteredTrips && filteredTrips.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTrips.map((trip, idx) => (
                  <TripCard key={trip.id || trip.slug || trip._id || `trip-${idx}`} trip={trip} showWeather={false} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Compass size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900">No trips match these filters</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  We couldn't find any trips matching your exact filter combination. No fake placeholder trips are shown. Try clearing some filters to explore available departures.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Clear All Filters & View All Trips
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Mobile Sticky Bottom Floating Filter Button */}
      <div className="fixed bottom-6 right-6 z-30 lg:hidden">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => setMobileFilterOpen(true)}
          className="px-5 py-3 bg-slate-950 text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-2xl shadow-slate-950/40 border border-slate-800 cursor-pointer"
        >
          <SlidersHorizontal size={15} className="text-emerald-400" />
          <span>Filters</span>
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
            {filteredTrips.length}
          </span>
        </motion.button>
      </div>

      {/* Mobile Filter Drawer Modal */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[85vh] flex flex-col z-10 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-emerald-600" /> Refine Expeditions
                </span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-grow overflow-hidden">
                <FilterSidebar
                  filters={filters}
                  onChangeFilter={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  totalMatchingTrips={filteredTrips.length}
                  countsByOption={countsByOption}
                  isMobile={true}
                  onCloseMobile={() => setMobileFilterOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Destinations;
