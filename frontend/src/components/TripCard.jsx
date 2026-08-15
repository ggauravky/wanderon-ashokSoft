import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import WeatherBadge from './WeatherBadge';
import { getDestinationWeather } from '../utils/weatherSeasonEngine';

const TripCard = ({ trip, showWeather = true }) => {
  if (!trip) return null;

  const weather = trip.weather || getDestinationWeather(trip.location);
  const discountPct = trip.originalPrice
    ? Math.round(((trip.originalPrice - trip.price) / trip.originalPrice) * 100)
    : null;

  return (
    <Link to={`/trip/${trip.id}`} className="block h-full group">
      <motion.div 
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.12)] h-full flex flex-col transition-all duration-300 relative"
      >
        {/* Cover Image Container */}
        <div className="relative h-60 overflow-hidden bg-slate-100">
          <img 
            src={trip.image} 
            alt={trip.title} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          
          {/* Subtle gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
            <div className="flex flex-wrap gap-1.5 max-w-[70%]">
              {trip.tags?.slice(0, 2).map((tag) => (
                <span 
                  key={tag} 
                  className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm tracking-wide uppercase border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>

            {discountPct && discountPct > 0 && (
              <span className="bg-brand-emerald text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
                {discountPct}% OFF
              </span>
            )}
          </div>

          {/* Bottom Overlay: Weather Badge & Next Batch */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
            {trip.nextBatch && (
              <div className="bg-white/90 backdrop-blur-md text-brand-navy text-[11px] font-extrabold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm border border-white/40">
                <Calendar size={12} className="text-brand-emerald" />
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
              <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold">
                <MapPin size={13} className="text-brand-emerald shrink-0" />
                <span className="truncate">{trip.location}</span>
              </div>

              <div className="flex items-center gap-1 text-amber-500 shrink-0">
                <Star size={13} fill="currentColor" />
                <span className="text-xs font-extrabold text-brand-navy">{trip.rating || 4.8}</span>
                <span className="text-[11px] font-medium text-gray-400">({trip.reviews || 24})</span>
              </div>
            </div>
            
            <h3 className="text-base font-extrabold text-brand-navy group-hover:text-brand-emerald transition-colors line-clamp-2 leading-snug">
              {trip.title}
            </h3>
          </div>
          
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-bold">
              <Clock size={14} className="text-brand-emerald" />
              <span>{trip.duration}</span>
            </div>
            
            <div className="text-right">
              {trip.originalPrice && (
                <div className="text-[11px] font-medium text-gray-400 line-through">
                  ₹{trip.originalPrice.toLocaleString()}
                </div>
              )}
              <div className="text-sm font-black text-brand-navy flex items-baseline gap-1">
                ₹{trip.price.toLocaleString()}
                <span className="text-[10px] font-medium text-gray-400">/person</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default TripCard;
