import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, Calendar, Sparkles } from 'lucide-react';
import WeatherBadge from './WeatherBadge.jsx';
import { getDestinationWeather } from '../utils/weatherSeasonEngine.js';

const TripCard = ({ trip, showWeather = true, customBadge = null }) => {
  if (!trip || typeof trip !== 'object') return null;

  const weather = trip.weather || getDestinationWeather(trip.location || '');
  const price = Number(trip.price) || 0;
  const originalPrice = Number(trip.originalPrice) || 0;
  const discountPct = (originalPrice > price && originalPrice > 0)
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  // Determine top priority explainable badge
  const primaryBadge = customBadge || trip.explainableBadge || (Array.isArray(trip.tags) && trip.tags[0]) || 'Curated';

  return (
    <Link to={`/trip/${trip.id}`} className="block h-full group">
      <div 
        className="bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1 h-full flex flex-col transition-all duration-300 relative"
      >
        {/* Cover Image Container */}
        <div className="relative h-60 overflow-hidden bg-slate-100">
          <img 
            src={trip.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'} 
            alt={trip.title || 'WanderLuxe Trip'} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          
          {/* Subtle gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* Top Priority Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
            <span className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm tracking-wide uppercase border border-white/20 flex items-center gap-1">
              <Sparkles size={11} className="text-emerald-400" />
              {primaryBadge}
            </span>

            {discountPct && discountPct > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
                {discountPct}% OFF
              </span>
            )}
          </div>

          {/* Bottom Overlay: Weather Badge & Next Batch */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
            {trip.nextBatch && (
              <div className="bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-extrabold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm border border-white/40">
                <Calendar size={12} className="text-emerald-600" />
                <span>Next: {trip.nextBatch}</span>
              </div>
            )}

            {showWeather && weather && (
              <WeatherBadge weather={weather} size="sm" showCondition={false} />
            )}
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                <MapPin size={13} className="text-emerald-500 shrink-0" />
                <span className="truncate">{trip.location || 'India'}</span>
              </div>

              <div className="flex items-center gap-1 text-amber-500 shrink-0">
                <Star size={13} fill="currentColor" />
                <span className="text-xs font-extrabold text-slate-900">{trip.rating || 4.8}</span>
                <span className="text-[11px] font-medium text-slate-400">({trip.reviews || 24})</span>
              </div>
            </div>
            
            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
              {trip.title || 'Curated Expedition'}
            </h3>
          </div>
          
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
              <Clock size={14} className="text-emerald-500" />
              <span>{trip.duration || '3N/4D'}</span>
            </div>
            
            <div className="text-right">
              {originalPrice > 0 && (
                <div className="text-[11px] font-medium text-slate-400 line-through">
                  ₹{originalPrice.toLocaleString()}
                </div>
              )}
              <div className="text-sm font-black text-slate-900 flex items-baseline gap-1">
                ₹{price > 0 ? price.toLocaleString() : '12,000'}
                <span className="text-[10px] font-medium text-slate-400">/person</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TripCard;
