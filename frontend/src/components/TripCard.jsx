import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight, Sparkles, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const TripCard = ({ trip }) => {
  if (!trip) return null;

  const discountPct = trip.originalPrice
    ? Math.round(((trip.originalPrice - trip.price) / trip.originalPrice) * 100)
    : null;

  return (
    <Link to={`/trip/${trip.id}`} className="block h-full group">
      <motion.div 
        whileHover={{ y: -6 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-2xl overflow-hidden border border-slate-200/70 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.1)] h-full flex flex-col transition-all duration-300"
      >
        {/* Cover Image Container */}
        <div className="relative h-56 overflow-hidden bg-slate-100">
          <img 
            src={trip.image} 
            alt={trip.title} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            <div className="flex flex-wrap gap-1.5 max-w-[70%]">
              {trip.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="bg-[#0b132b]/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm tracking-wide uppercase">
                  {tag}
                </span>
              ))}
            </div>

            {discountPct && discountPct > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
                {discountPct}% OFF
              </span>
            )}
          </div>
          
          {/* Next Batch Indicator Overlay */}
          {trip.nextBatch && (
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-white/40">
              <Calendar size={12} className="text-emerald-600" />
              <span>Next: {trip.nextBatch}</span>
            </div>
          )}
        </div>
        
        {/* Content Details */}
        <div className="p-5 flex-grow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold">
                <MapPin size={13} className="text-emerald-600 shrink-0" />
                <span className="truncate">{trip.location}</span>
              </div>

              <div className="flex items-center gap-1 text-amber-500 shrink-0">
                <Star size={13} fill="currentColor" />
                <span className="text-xs font-extrabold text-slate-900">{trip.rating || 4.8}</span>
                <span className="text-[11px] font-medium text-slate-400">({trip.reviews || 24})</span>
              </div>
            </div>
            
            <h3 className="text-base font-extrabold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
              {trip.title}
            </h3>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
              <Clock size={14} className="text-emerald-600" />
              <span>{trip.duration}</span>
            </div>
            
            <div className="text-right">
              {trip.originalPrice && (
                <div className="text-[11px] font-medium text-slate-400 line-through">
                  ₹{trip.originalPrice.toLocaleString()}
                </div>
              )}
              <div className="text-sm font-black text-slate-900 flex items-baseline gap-1">
                ₹{trip.price.toLocaleString()}
                <span className="text-[10px] font-medium text-slate-500">/person</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default TripCard;
