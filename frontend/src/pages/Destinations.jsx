import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal, MapPin, Compass, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import TripCard from '../components/TripCard';
import { UPCOMING_TRIPS } from '../constants/mockData';

const Destinations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(100000);
  const [selectedDuration, setSelectedDuration] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wanderluxe_wishlist')) || [];
    } catch (e) {
      return [];
    }
  });

  const categories = ['All', 'Domestic', 'International', 'Backpacking', 'Weekend Trips', 'Beach'];

  const toggleWishlist = (tripId) => {
    let updated;
    if (wishlist.includes(tripId)) {
      updated = wishlist.filter(id => id !== tripId);
    } else {
      updated = [...wishlist, tripId];
    }
    setWishlist(updated);
    localStorage.setItem('wanderluxe_wishlist', JSON.stringify(updated));
  };

  // Filter trips
  let filteredTrips = UPCOMING_TRIPS.filter((trip) => {
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

    let matchesDifficulty = true;
    if (selectedDifficulty !== 'All') {
      matchesDifficulty = trip.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase();
    }

    return matchesSearch && matchesCategory && matchesPrice && matchesDuration && matchesDifficulty;
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
          <div className="absolute right-0 top-0 w-96 h-96 bg-brand-emerald opacity-20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl">
            <span className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold text-brand-emerald inline-block mb-4 border border-white/10">
              Curated Expeditions Catalog
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              Explore All Destinations & Group Departures
            </h1>
            <p className="text-white/80 text-sm md:text-base font-medium">
              Filter by budget, duration, or difficulty level to find your next extraordinary journey.
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
                placeholder="Search destination or trip title..."
                className="w-full pl-11 pr-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-emerald"
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100 items-center">
            {/* Price Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-brand-navy mb-2">
                <span>Max Budget Filter</span>
                <span className="text-brand-emerald font-extrabold">₹{maxPrice.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="100000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-emerald cursor-pointer"
              />
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1.5">Duration</label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="w-full px-3 py-2.5 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy"
              >
                <option value="All">All Durations</option>
                <option value="short">Weekend (1-3 Days)</option>
                <option value="medium">Standard (4-6 Days)</option>
                <option value="long">Expedition (7+ Days)</option>
              </select>
            </div>

            {/* Difficulty Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1.5">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2.5 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy"
              >
                <option value="All">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Challenging">Challenging</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1.5">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy"
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated (4.8★+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trips Grid */}
        {filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTrips.map((trip) => {
              const isWishlisted = wishlist.includes(trip.id);
              return (
                <div key={trip.id} className="relative group">
                  <button
                    onClick={() => toggleWishlist(trip.id)}
                    className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart size={18} className={isWishlisted ? 'fill-red-500 text-red-500' : ''} />
                  </button>
                  <TripCard trip={trip} />
                </div>
              );
            })}
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
                setMaxPrice(100000);
                setSelectedDuration('All');
                setSelectedDifficulty('All');
              }}
              className="px-6 py-3 bg-brand-emerald text-white rounded-2xl font-bold text-sm"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Destinations;
