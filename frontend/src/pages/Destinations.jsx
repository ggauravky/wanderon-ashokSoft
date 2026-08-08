import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal, MapPin, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import TripCard from '../components/TripCard';
import { UPCOMING_TRIPS } from '../constants/mockData';

const Destinations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(60000);
  const [sortBy, setSortBy] = useState('popular');

  const categories = ['All', 'Domestic', 'International', 'Backpacking', 'Beach'];

  // Filter trips
  let filteredTrips = UPCOMING_TRIPS.filter((trip) => {
    const matchesSearch = 
      trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All' || 
      trip.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase());
    
    const matchesPrice = trip.price <= maxPrice;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Sort trips
  if (sortBy === 'price-low') {
    filteredTrips.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredTrips.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filteredTrips.sort((a, b) => b.rating - a.rating);
  }

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <div className="container mx-auto px-4 md:px-8">
        {/* Page Banner */}
        <div className="bg-brand-navy rounded-3xl p-8 md:p-12 text-white mb-10 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-brand-emerald opacity-20 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-2xl">
            <span className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-brand-emerald inline-block mb-4 border border-white/10">
              Curated Expeditions
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              Explore All Destinations & Upcoming Trips
            </h1>
            <p className="text-white/80 text-sm md:text-base font-medium">
              Discover group departures, high-altitude treks, tropical island getaways, and weekend escapes.
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 mb-10 space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by destination or trip title..."
                className="w-full pl-11 pr-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold capitalize transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-brand-emerald text-white shadow-md shadow-brand-emerald/20'
                      : 'bg-brand-light text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-100 items-center">
            {/* Price Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-brand-navy mb-2">
                <span>Max Budget Filter</span>
                <span className="text-brand-emerald font-extrabold">₹{maxPrice.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="60000"
                step="2500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-emerald cursor-pointer"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-navy whitespace-nowrap">Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy focus:outline-none"
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <div className="text-right text-xs text-gray-500 font-bold hidden lg:block">
              Showing <span className="text-brand-navy font-extrabold">{filteredTrips.length}</span> verified trips
            </div>
          </div>
        </div>

        {/* Trips Grid */}
        {filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200 max-w-lg mx-auto">
            <Compass size={48} className="text-gray-300 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-brand-navy mb-2">No Matching Trips Found</h3>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your search terms or increasing the budget slider filter.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setMaxPrice(60000);
              }}
              className="px-6 py-3 bg-brand-emerald text-white rounded-2xl font-bold text-sm"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Destinations;
