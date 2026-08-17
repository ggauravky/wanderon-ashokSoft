import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, MapPin, Compass, Heart, HelpCircle, 
  Sun, CloudRain, Wind, ShieldCheck, ArrowUpDown, RotateCcw,
  Sparkles, Calendar, Clock, Star, Shuffle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TripCard from '../components/TripCard';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AIPlannerModal from '../components/AIPlannerModal';
import { getFAQSchema } from '../utils/seoSchemas';
import { UPCOMING_TRIPS } from '../constants/mockData';
import { useWeatherAndSeason } from '../hooks/useWeatherAndSeason';

const Destinations = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const initialSearch = routerLocation.state?.searchQuery || '';
  const initialMonth = routerLocation.state?.monthQuery || '';

  const { season, trendingTrips, getWeatherFor } = useWeatherAndSeason();

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWeatherType, setSelectedWeatherType] = useState('All');
  const [maxPrice, setMaxPrice] = useState(60000);
  const [selectedDuration, setSelectedDuration] = useState('All');
  const [sortBy, setSortBy] = useState('trending');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerDestination, setPlannerDestination] = useState('Meghalaya');

  const categories = ['All', 'Domestic', 'International', 'Backpacking', 'Weekend Trips', 'Adventure'];
  const weatherOptions = [
    { label: 'All Weathers', value: 'All' },
    { label: 'Sunny & Crisp', value: 'Sun', icon: Sun },
    { label: 'Lush & Rain', value: 'CloudRain', icon: CloudRain },
    { label: 'Cool Breeze', value: 'Wind', icon: Wind }
  ];

  const destinationFaqs = [
    {
      q: 'What is the best time to visit Meghalaya and Spiti Valley?',
      a: 'Meghalaya is best visited between October and May for crystal-clear natural pools and living root bridges, while Spiti Valley is ideal from June to September for summer Himalayan circuit road trips.'
    },
    {
      q: 'Are WanderLuxe group trips suitable for solo travelers?',
      a: 'Yes! Over 60% of our community members travel solo. Our certified trip captains ensure a safe, inclusive, and friendly environment for all passengers.'
    },
    {
      q: 'What inclusions are provided in WanderLuxe tour packages?',
      a: 'All tour packages include boutique accommodation, private transfers, daily breakfast, entry permits, experienced trip captains, and emergency first-aid support.'
    }
  ];

  const faqSchema = getFAQSchema(destinationFaqs);

  // Filter and Sort Trips
  const filteredTrips = useMemo(() => {
    return UPCOMING_TRIPS.filter((trip) => {
      // Search matching
      const matchesSearch = 
        trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.location.toLowerCase().includes(searchTerm.toLowerCase());

      // Category matching
      const matchesCategory = 
        selectedCategory === 'All' || 
        trip.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === 'Domestic' && !trip.location.includes('Indonesia') && !trip.location.includes('Thailand')) ||
        (selectedCategory === 'International' && (trip.location.includes('Indonesia') || trip.location.includes('Bali')));

      // Price matching
      const matchesPrice = trip.price <= maxPrice;

      // Weather filter matching
      const tripWeather = getWeatherFor(trip.location);
      const matchesWeather = 
        selectedWeatherType === 'All' || 
        tripWeather.iconType === selectedWeatherType;

      return matchesSearch && matchesCategory && matchesPrice && matchesWeather;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.reviews - a.reviews; // Trending default
    });
  }, [searchTerm, selectedCategory, maxPrice, selectedWeatherType, sortBy, getWeatherFor]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedWeatherType('All');
    setMaxPrice(60000);
    setSelectedDuration('All');
    setSortBy('trending');
  };

  const handleFlexibleShuffle = () => {
    if (filteredTrips.length > 0) {
      const pick = filteredTrips[Math.floor(Math.random() * filteredTrips.length)];
      navigate(`/trip/${pick.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-20">
      <SEOHead
        title="Explore All Tour Packages & Group Expeditions 2026 | WanderLuxe"
        description="Browse all verified backpacking expeditions, weekend getaways, and luxury departures across Spiti, Meghalaya, Kashmir, Bali, and Goa."
        canonical="/destinations"
        jsonLd={faqSchema}
      />

      {/* AI Planner Modal */}
      <AIPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        initialDestination={plannerDestination}
      />

      <div className="container mx-auto px-4 md:px-8">
        <Breadcrumbs items={[{ name: 'Destinations', path: '/destinations' }]} />

        {/* Page Hero Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
              <Compass size={14} className="text-emerald-500" />
              Verified 2026 Batch Departures
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              Curated Travel Packages & Circuits
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium max-w-xl mt-1">
              Filter by destination climate, travel style, duration, and group budget. All departures led by certified captains.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleFlexibleShuffle}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Shuffle size={14} className="text-emerald-500" /> I'm Flexible
            </button>

            <button
              onClick={() => {
                setPlannerDestination(searchTerm || 'Meghalaya');
                setIsPlannerOpen(true);
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
            >
              <Sparkles size={14} className="text-emerald-400" /> Plan with AI
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200/80 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by state, circuit or activity (e.g. Spiti, Living Root Bridge)..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="trending">Most Trending</option>
                  <option value="rating">Highest Rated (4.8+)</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {/* Reset Filters */}
              <button
                onClick={handleResetFilters}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors shrink-0"
                title="Reset all filters"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-black uppercase text-slate-400 mr-1">Style:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Climate & Weather Quick Filter */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-black uppercase text-slate-400 mr-1">Climate:</span>
            {weatherOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedWeatherType(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedWeatherType === opt.value
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {opt.icon && <opt.icon size={13} />}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-extrabold text-slate-500">
            Showing <strong className="text-slate-900">{filteredTrips.length}</strong> verified group tour packages
          </span>
        </div>

        {/* Trip Grid */}
        {filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} showWeather={true} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
              <Compass size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900">No matching departures found</h3>
            <p className="text-xs text-slate-500 font-medium">
              We couldn't find any packages matching your exact search criteria. Try adjusting your climate or price filters, or let our AI build a custom route.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => {
                  setPlannerDestination(searchTerm || 'Meghalaya');
                  setIsPlannerOpen(true);
                }}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5"
              >
                <Sparkles size={14} /> Plan with AI
              </button>
            </div>
          </div>
        )}

        {/* Destination FAQs Section for SEO & User Help */}
        <div className="mt-20 pt-12 border-t border-slate-200/80">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">Got Questions?</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {destinationFaqs.map((faq, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <h3 className="text-sm font-black text-slate-900 mb-1.5 flex items-center gap-2">
                  <HelpCircle size={16} className="text-emerald-500 shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Destinations;
