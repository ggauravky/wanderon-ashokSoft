import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, Calendar, Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import WeatherBadge from './WeatherBadge.jsx';
import { getDestinationWeather } from '../utils/weatherSeasonEngine.js';
import { getWishlistIds, toggleWishlistItem } from '../utils/userHistory.js';

const TripCard = ({ trip, showWeather = true, customBadge = null }) => {
  if (!trip || typeof trip !== 'object') return null;

  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    try {
      const ids = getWishlistIds();
      setIsWishlisted(ids.includes(trip.id));
    } catch (e) {
      // Ignored
    }
  }, [trip.id]);

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = toggleWishlistItem(trip.id);
    setIsWishlisted(updated.includes(trip.id));
  };

  const weather = trip.weather || getDestinationWeather(trip.location || '');
  const price = Number(trip.price) || 0;
  const originalPrice = Number(trip.originalPrice) || 0;
  const discountPct = (originalPrice > price && originalPrice > 0)
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  // Determine top priority single explainable badge
  const primaryBadge = customBadge || trip.explainableBadge || (Array.isArray(trip.tags) && trip.tags[0]) || 'Curated';

  return (
    <div className="relative h-full group">
      <Link 
        to={`/trip/${trip.id}`} 
        className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_35px_-8px_rgba(15,23,42,0.12)] hover:-translate-y-1 h-full flex flex-col transition-all duration-300 relative block"
      >
        {/* Cover Image Container */}
        <div className="relative h-56 sm:h-60 overflow-hidden bg-slate-100">
          <img 
            src={trip.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'} 
            alt={trip.title || 'WanderLuxe Trip'} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          
          {/* Ambient Contrast Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/30 pointer-events-none" />

          {/* Top Row: Smart Badge & Wishlist Button */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
            <span className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm tracking-wide uppercase border border-white/15 flex items-center gap-1.5 pointer-events-none">
              <Sparkles size={11} className="text-emerald-400 shrink-0" />
              <span className="truncate max-w-[140px]">{primaryBadge}</span>
            </span>

            {/* Interactive Wishlist Heart Button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={handleWishlistToggle}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-md border ${
                isWishlisted 
                  ? 'bg-rose-500 text-white border-rose-400' 
                  : 'bg-white/80 hover:bg-white text-slate-700 border-white/60'
              }`}
            >
              <Heart size={14} className={isWishlisted ? 'fill-current text-white' : 'text-slate-700'} />
            </motion.button>
          </div>

          {/* Bottom Row: Next Batch & Weather Badge */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
            {trip.nextBatch ? (
              <div className="bg-white/95 backdrop-blur-md text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm border border-white/60">
                <Calendar size={11} className="text-emerald-600 shrink-0" />
                <span className="truncate">{trip.nextBatch}</span>
              </div>
            ) : <div />}

            {showWeather && weather && (
              <WeatherBadge weather={weather} size="sm" showCondition={false} />
            )}
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-5 flex-grow flex flex-col justify-between space-y-3.5">
          <div>
            {/* Meta Row: Location & Rating */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1 text-slate-500 text-[11px] font-bold">
                <MapPin size={12} className="text-emerald-500 shrink-0" />
                <span className="truncate max-w-[140px]">{trip.location || 'India'}</span>
              </div>

              <div className="flex items-center gap-1 text-amber-500 shrink-0 text-[11px] font-black">
                <Star size={12} fill="currentColor" />
                <span className="text-slate-900">{trip.rating || 4.8}</span>
                <span className="text-slate-400 font-semibold">({trip.reviews || 24})</span>
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
              {trip.title || 'Curated Expedition'}
            </h3>
          </div>
          
          {/* Pricing & Duration Bottom Row */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
              <Clock size={13} className="text-emerald-500 shrink-0" />
              <span>{trip.duration || '3N/4D'}</span>
            </div>
            
            <div className="text-right">
              {originalPrice > price && (
                <div className="text-[10px] font-bold text-slate-400 line-through">
                  ₹{originalPrice.toLocaleString()}
                </div>
              )}
              <div className="text-sm font-black text-slate-900 flex items-baseline justify-end gap-1">
                <span>₹{price > 0 ? price.toLocaleString() : '12,000'}</span>
                <span className="text-[10px] font-bold text-slate-400">/ person</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default TripCard;
