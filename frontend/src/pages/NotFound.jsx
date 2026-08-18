import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Search, ArrowRight, Sparkles, MapPin, Home } from 'lucide-react';
import { UPCOMING_TRIPS } from '../constants/mockData';
import TripCard from '../components/TripCard';
import SEOHead from '../components/SEOHead';

const NotFound = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/destinations', { state: { searchQuery } });
    }
  };

  const trendingTrips = UPCOMING_TRIPS.slice(0, 3);

  return (
    <div className="min-h-screen bg-brand-light pt-28 pb-24">
      <SEOHead
        title="404 - Route Off The Map | WanderLuxe"
        description="The trail you are looking for has moved. Discover trending group tours and backpacking expeditions across India and Bali."
        canonical="/404"
      />

      <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 border border-emerald-200 shadow-sm animate-pulse">
          <Compass size={40} />
        </div>

        <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Error 404 • Trail Not Found
        </span>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 mb-3">
          Looks Like This Route Went Off The Map
        </h1>

        <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-md mx-auto mb-8">
          The page or departure you are looking for does not exist or has been relocated. Search for a destination below or explore our trending expeditions.
        </p>

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search destinations (e.g. Spiti, Bali, Meghalaya)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-28 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex justify-center gap-3 mb-16">
          <Link
            to="/"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm"
          >
            <Home size={15} /> Return Home
          </Link>
          <Link
            to="/destinations"
            className="px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black border border-emerald-200 flex items-center gap-2"
          >
            <Compass size={15} /> Browse 50+ Expeditions
          </Link>
        </div>

        {/* Trending Departures Fallback */}
        <div className="text-left pt-12 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block">
                Trending Right Now
              </span>
              <h2 className="text-xl font-black text-slate-900">Popular Departures</h2>
            </div>
            <Link to="/destinations" className="text-xs font-black text-emerald-600 hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {trendingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} showWeather={true} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
