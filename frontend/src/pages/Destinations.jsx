import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, MapPin, Sparkles, Filter, 
  RotateCcw, Compass, Award, Calendar
} from 'lucide-react';
import TripCard from '../components/TripCard.jsx';
import SEOHead from '../components/SEOHead.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import { UPCOMING_TRIPS } from '../constants/mockData.js';
import { useTravelContext } from '../hooks/useTravelContext.js';
import { getDestinationWeather } from '../utils/weatherSeasonEngine.js';

const Destinations = () => {
  const location = useLocation();
  const travelCtx = useTravelContext() || {};
  const recommendedTrips = travelCtx.recommendedTrips || UPCOMING_TRIPS || [];
  const season = travelCtx.season || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [climateFilter, setClimateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  useEffect(() => {
    try {
      const pathname = (location.pathname || '').toLowerCase();
      if (pathname.includes('community-trips')) {
        setSelectedCategory('Backpacking');
      } else if (pathname.includes('weekend-trips')) {
        setDurationFilter('weekend');
      } else if (pathname.includes('domestic')) {
        setSelectedCategory('Domestic');
      } else if (pathname.includes('international')) {
        setSelectedCategory('International');
      }

      const params = new URLSearchParams(location.search || '');
      const filterParam = params.get('filter');
      const searchParam = params.get('search');
      const catParam = params.get('category');
      
      if (filterParam === 'trending') {
        setSortBy('trending');
      } else if (filterParam === 'weekend') {
        setDurationFilter('weekend');
      } else if (filterParam) {
        setSortBy(filterParam);
      }

      if (searchParam) {
        setSearchQuery(searchParam);
      } else if (location.state?.searchQuery) {
        setSearchQuery(location.state.searchQuery);
      }

      if (catParam) {
        setSelectedCategory(catParam);
      } else if (location.state?.category) {
        setSelectedCategory(location.state.category);
      }

      if (location.state?.budgetFilter) {
        setBudgetFilter(location.state.budgetFilter);
      }

      if (location.state?.durationFilter) {
        setDurationFilter(location.state.durationFilter);
      }
    } catch (e) {
      console.warn('URL param parse fallback:', e?.message);
    }
  }, [location.pathname, location.search, location.state]);

  const categories = ['All', 'Domestic', 'International', 'Adventure', 'Backpacking', 'Weekend Trips', 'Nature', 'Culture'];

  const filteredTrips = useMemo(() => {
    try {
      let result = [...(recommendedTrips && recommendedTrips.length > 0 ? recommendedTrips : UPCOMING_TRIPS)];

      // 1. Search Query
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter((trip) => {
          if (!trip) return false;
          const title = (trip.title || '').toLowerCase();
          const loc = (trip.location || '').toLowerCase();
          const dest = (trip.destination || '').toLowerCase();
          const tags = Array.isArray(trip.tags) ? trip.tags.map((t) => (t || '').toLowerCase()) : [];
          return title.includes(q) || loc.includes(q) || dest.includes(q) || tags.some((t) => t.includes(q));
        });
      }

      // 2. Category Filter
      if (selectedCategory && selectedCategory !== 'All') {
        const catLower = selectedCategory.toLowerCase();
        result = result.filter((trip) => {
          if (!trip) return false;
          const cat = (trip.category || '').toLowerCase();
          const tags = Array.isArray(trip.tags) ? trip.tags.map((t) => (t || '').toLowerCase()) : [];
          return cat.includes(catLower) || tags.some((t) => t.includes(catLower));
        });
      }

      // 3. Budget Filter
      if (budgetFilter === 'under10k') {
        result = result.filter((trip) => Number(trip?.price || 0) <= 10000);
      } else if (budgetFilter === 'under20k') {
        result = result.filter((trip) => Number(trip?.price || 0) <= 20000);
      } else if (budgetFilter === 'luxury') {
        result = result.filter((trip) => Number(trip?.price || 0) >= 30000);
      }

      // 4. Duration Filter
      if (durationFilter === 'weekend') {
        result = result.filter((trip) => {
          const d = (trip?.duration || '').toLowerCase();
          return d.includes('2n') || d.includes('3d') || d.includes('3n/4d');
        });
      } else if (durationFilter === 'medium') {
        result = result.filter((trip) => {
          const d = (trip?.duration || '').toLowerCase();
          return d.includes('4n') || d.includes('5d') || d.includes('5n/6d');
        });
      } else if (durationFilter === 'week') {
        result = result.filter((trip) => {
          const d = (trip?.duration || '').toLowerCase();
          return d.includes('6n') || d.includes('7d') || d.includes('8d');
        });
      }

      // 5. Climate Filter
      if (climateFilter === 'cold') {
        result = result.filter((trip) => {
          const loc = (trip?.location || '').toLowerCase();
          return loc.includes('spiti') || loc.includes('ladakh') || loc.includes('kashmir') || loc.includes('auli');
        });
      } else if (climateFilter === 'tropical') {
        result = result.filter((trip) => {
          const loc = (trip?.location || '').toLowerCase();
          return loc.includes('goa') || loc.includes('bali') || loc.includes('kerala');
        });
      } else if (climateFilter === 'rainforest') {
        result = result.filter((trip) => {
          const loc = (trip?.location || '').toLowerCase();
          return loc.includes('meghalaya') || loc.includes('wayanad');
        });
      }

      // 6. Sorting
      if (sortBy === 'recommended') {
        result.sort((a, b) => (Number(b?.recommendationScore) || 50) - (Number(a?.recommendationScore) || 50));
      } else if (sortBy === 'priceAsc') {
        result.sort((a, b) => (Number(a?.price) || 0) - (Number(b?.price) || 0));
      } else if (sortBy === 'priceDesc') {
        result.sort((a, b) => (Number(b?.price) || 0) - (Number(a?.price) || 0));
      } else if (sortBy === 'rating') {
        result.sort((a, b) => (Number(b?.rating) || 4.5) - (Number(a?.rating) || 4.5));
      } else if (sortBy === 'trending') {
        result.sort((a, b) => (Number(b?.reviews) || 0) - (Number(a?.reviews) || 0));
      }

      return result;
    } catch (err) {
      console.warn('Filter computation error:', err);
      return UPCOMING_TRIPS;
    }
  }, [recommendedTrips, searchQuery, selectedCategory, budgetFilter, durationFilter, climateFilter, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setBudgetFilter('all');
    setDurationFilter('all');
    setClimateFilter('all');
    setSortBy('recommended');
  };

  const seasonLabel = season?.name ? season.name.split(' ')[0] : 'Seasonal';

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <SEOHead
        title="50+ Verified Travel Packages & Expeditions | WanderLuxe Catalog"
        description="Browse all 50 verified group tours, backpacking expeditions, and luxury getaways across Spiti, Meghalaya, Kashmir, Bali, and Ladakh with live weather insights."
        canonical="/destinations"
      />

      <div className="container mx-auto px-4 md:px-8">
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'All Destinations & Catalog', path: null }]} />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8 mt-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
              <Sparkles size={13} /> {seasonLabel} Travel Discovery
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Explore All Expeditions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Showing <span className="text-emerald-600 font-black">{filteredTrips.length}</span> active, bookable packages across 9 regional hubs.
            </p>
          </div>

          {/* Reset Filters CTA if active */}
          {(searchQuery || selectedCategory !== 'All' || budgetFilter !== 'all' || durationFilter !== 'all' || climateFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 self-start md:self-end"
            >
              <RotateCcw size={13} /> Reset All Filters
            </button>
          )}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 mb-8">
          {/* Top Row: Search Input & Sort Dropdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by destination, state, keyword (e.g. Spiti, Waterfalls, Camping)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="recommended">Sort: Context Recommendation</option>
                <option value="trending">Sort: Popularity / Trending</option>
                <option value="priceAsc">Sort: Price: Low to High</option>
                <option value="priceDesc">Sort: Price: High to Low</option>
                <option value="rating">Sort: Highest Rated (4.9★)</option>
              </select>
            </div>
          </div>

          {/* Middle Row: Quick Filter Dropdowns (Budget, Duration, Climate) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Budget</label>
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="all">All Budgets</option>
                <option value="under10k">Under ₹10,000</option>
                <option value="under20k">Under ₹20,000</option>
                <option value="luxury">Premium ₹30,000+</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Duration</label>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="all">All Durations</option>
                <option value="weekend">Weekend (2-3 Days)</option>
                <option value="medium">4 to 5 Days</option>
                <option value="week">1 Week+ (6-8 Days)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Climate</label>
              <select
                value={climateFilter}
                onChange={(e) => setClimateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="all">All Climates</option>
                <option value="cold">High Mountain Cold</option>
                <option value="tropical">Sunny & Coastal Beach</option>
                <option value="rainforest">Misty Rainforests</option>
              </select>
            </div>
          </div>

          {/* Category Chips Horizontal Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Trips Grid */}
        {filteredTrips && filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id || trip.slug || Math.random()} trip={trip} showWeather={true} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <Compass size={36} className="mx-auto text-emerald-500 animate-spin-slow" />
            <h3 className="text-lg font-black text-slate-900">No matching departures found</h3>
            <p className="text-xs text-slate-500 font-medium">
              We couldn't find any trips matching your exact filter combination. Try resetting your search or exploring our seasonal recommendations.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider"
            >
              Reset Filters & View All 50 Trips
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Destinations;
