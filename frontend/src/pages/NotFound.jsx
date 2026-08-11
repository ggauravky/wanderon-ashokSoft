import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Compass, MapPin, ArrowRight, Home } from 'lucide-react';
import SEOHead from '../components/SEOHead';

const NotFound = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/destinations?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/destinations');
    }
  };

  return (
    <div className="min-h-screen bg-brand-light pt-28 pb-20 flex flex-col items-center justify-center px-4 text-center">
      <SEOHead
        title="404 - Page Not Found | WanderLuxe Travels"
        description="The travel page or destination itinerary you requested could not be found. Explore our popular circuits or search for your next adventure."
        noindex={true}
      />

      <div className="max-w-2xl w-full bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100 space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-brand-emerald rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <Compass size={44} className="animate-spin-slow" />
        </div>

        <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-brand-emerald bg-brand-emerald/10 px-3.5 py-1 rounded-full inline-block">
          404 - Off The Map
        </span>

        <h1 className="text-3xl md:text-5xl font-extrabold text-brand-navy">
          Looks Like You've Wandered Off Trail
        </h1>
        <p className="text-gray-500 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
          The page or trip itinerary you are looking for doesn't exist or has moved to a new destination.
        </p>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Meghalaya, Spiti, Bali..."
              className="w-full pl-11 pr-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-emerald text-brand-navy"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-brand-emerald text-white text-xs font-extrabold rounded-2xl hover:bg-brand-teal transition-all shadow-md shrink-0"
          >
            Search
          </button>
        </form>

        {/* Popular Destination Shortcuts */}
        <div className="pt-4 border-t border-gray-100">
          <span className="text-[11px] font-extrabold uppercase text-gray-400 block mb-3">Popular Travel Hubs</span>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <Link to="/destinations" className="px-3.5 py-2 bg-brand-light hover:bg-brand-navy hover:text-white rounded-xl border border-gray-200 font-bold transition-all text-gray-700">
              All Destinations
            </Link>
            <Link to="/weekend-trips" className="px-3.5 py-2 bg-brand-light hover:bg-brand-navy hover:text-white rounded-xl border border-gray-200 font-bold transition-all text-gray-700">
              Weekend Getaways
            </Link>
            <Link to="/community-trips" className="px-3.5 py-2 bg-brand-light hover:bg-brand-navy hover:text-white rounded-xl border border-gray-200 font-bold transition-all text-gray-700">
              Backpacking Trips
            </Link>
            <Link to="/custom-trip" className="px-3.5 py-2 bg-brand-light hover:bg-brand-navy hover:text-white rounded-xl border border-gray-200 font-bold transition-all text-gray-700">
              Custom Itinerary
            </Link>
          </div>
        </div>

        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-navy text-white text-xs font-extrabold rounded-2xl hover:bg-brand-emerald transition-all shadow-lg"
          >
            <Home size={16} /> Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
