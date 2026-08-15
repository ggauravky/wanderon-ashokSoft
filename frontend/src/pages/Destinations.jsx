import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, MapPin, Compass, Heart, HelpCircle, 
  Sun, CloudRain, Wind, ShieldCheck, ArrowUpDown, RotateCcw,
  Sparkles, Calendar, Clock, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TripCard from '../components/TripCard';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { getFAQSchema } from '../utils/seoSchemas';
import { UPCOMING_TRIPS } from '../constants/mockData';
import { useWeatherAndSeason } from '../hooks/useWeatherAndSeason';

const Destinations = () => {
  const routerLocation = useLocation();
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

  const faqJsonLd = getFAQSchema(destinationFaqs);

  // Filter trips
  const filteredTrips = useMemo(() => {
    let list = trendingTrips.filter((trip) => {
      const matchesSearch = 
        trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'All' || 
        trip.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase());
      
      const matchesPrice = trip.price <= maxPrice;

      let matchesDuration = true;
      if (selectedDuration === 'short') matchesDuration = trip.duration.includes('2D') || trip.duration.includes('3D');
      if (selectedDuration === 'medium') matchesDuration = trip.duration.includes('4D') || trip.duration.includes('5D') || trip.duration.includes('6D');
      if (selectedDuration === 'long') matchesDuration = trip.duration.includes('7D') || trip.duration.includes('8D') || trip.duration.includes('9D');

      let matchesWeather = true;
      if (selectedWeatherType !== 'All') {
        const w = trip.weather || getWeatherFor(trip.location);
        matchesWeather = w.iconType === selectedWeatherType;
      }

      return matchesSearch && matchesCategory && matchesPrice && matchesDuration && matchesWeather;
    });

    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      list.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
    }

    return list;
  }, [trendingTrips, searchTerm, selectedCategory, selectedWeatherType, maxPrice, selectedDuration, sortBy, getWeatherFor]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedWeatherType('All');
    setMaxPrice(60000);
    setSelectedDuration('All');
    setSortBy('trending');
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <SEOHead
        title="Top Travel Destinations & Group Tour Packages 2026 | WanderLuxe"
        description="Explore top tour packages for Meghalaya, Spiti Valley, Kashmir, Bali, and Ladakh. Compare prices, itineraries, best times to visit, and traveler reviews."
        canonical="/destinations"
        jsonLd={faqJsonLd}
      />

      <div className="container mx-auto px-4 md:px-8">
        <Breadcrumbs items={[{ name: 'Destinations', path: '/destinations' }]} />

        {/* Page Banner with Seasonal Highlights */}
        <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-emerald-950 rounded-3xl p-8 md:p-12 text-white mb-8 relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-black text-emerald-300 mb-4 border border-white/10">
              <Sparkles size={14} className="text-emerald-400" />
              <span>{season.heroTag}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight">
              Curated Expeditions & Group Departures
            </h1>
            <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
              Explore handpicked journeys filtered by weather conditions, departure duration, and verified ratings.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 mb-8 space-y-6">
          {/* Top Search & Sort Row */}
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by state or trip name..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-emerald focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-brand-navy w-full md:w-auto">
                <ArrowUpDown size={15} className="text-brand-emerald shrink-0" />
                <span className="text-gray-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-extrabold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="trending">Trending This Season</option>
                  <option value="rating">Highest Rated (4.8+)</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {(searchTerm || selectedCategory !== 'All' || selectedWeatherType !== 'All' || selectedDuration !== 'All' || maxPrice < 60000) && (
                <button
                  onClick={handleResetFilters}
                  className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Reset all filters"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-brand-emerald text-white shadow-md shadow-brand-emerald/20'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Secondary Filters: Weather, Duration, Price */}
          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            {/* Weather Type */}
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                Weather Climate
              </label>
              <div className="flex flex-wrap gap-2">
                {weatherOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedWeatherType(opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedWeatherType === opt.value
                        ? 'bg-brand-navy text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {opt.icon && <opt.icon size={13} className="text-brand-emerald" />}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                Trip Duration
              </label>
              <div className="flex gap-2">
                {[
                  { label: 'All', value: 'All' },
                  { label: '2-3 Days', value: 'short' },
                  { label: '4-6 Days', value: 'medium' },
                  { label: '7+ Days', value: 'long' }
                ].map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedDuration === d.value
                        ? 'bg-brand-navy text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Budget Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Max Budget
                </label>
                <span className="text-xs font-black text-brand-navy">
                  ₹{maxPrice.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="60000"
                step="2000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-emerald cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Results Count Strip */}
        <div className="flex items-center justify-between mb-6 px-1">
          <p className="text-xs font-bold text-gray-500">
            Showing <span className="text-brand-navy font-black">{filteredTrips.length}</span> verified expeditions
          </p>
        </div>

        {/* Trips Grid or Empty State */}
        {filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} showWeather={true} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 max-w-lg mx-auto my-12 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-brand-emerald flex items-center justify-center mx-auto mb-4">
              <Compass size={32} />
            </div>
            <h3 className="text-lg font-black text-brand-navy mb-2">No expeditions match your filters</h3>
            <p className="text-xs text-gray-500 font-medium mb-6">
              Try adjusting your max price, selected duration, or search term to discover available group departures.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-3 bg-brand-emerald text-white text-xs font-black rounded-2xl hover:bg-brand-teal transition-all shadow-md shadow-brand-emerald/20"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200/80 max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-black uppercase tracking-wider text-brand-emerald">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl font-black text-brand-navy mt-1">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-4">
            {destinationFaqs.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <h3 className="text-xs sm:text-sm font-extrabold text-brand-navy mb-2">
                  {faq.q}
                </h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
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
