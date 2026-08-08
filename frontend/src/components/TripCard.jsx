import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const TripCard = ({ trip }) => {
  return (
    <Link to={`/trip/${trip.id}`} className="block h-full">
      <motion.div 
        whileHover={{ y: -8 }}
        className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-100/80 group cursor-pointer h-full flex flex-col transition-all duration-300"
      >
        <div className="relative h-60 overflow-hidden">
          <img 
            src={trip.image} 
            alt={trip.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Tags */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 max-w-[80%]">
            {trip.tags?.map(tag => (
              <span key={tag} className="bg-brand-navy/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                {tag}
              </span>
            ))}
          </div>
          
          {/* Price Tag */}
          <div className="absolute bottom-4 right-4 bg-brand-emerald text-white font-extrabold px-3.5 py-1.5 rounded-xl shadow-lg text-sm flex items-baseline gap-1">
            ₹{trip.price.toLocaleString()} <span className="text-xs font-normal text-white/80">/person</span>
          </div>
        </div>
        
        <div className="p-5 flex-grow flex flex-col">
          <div className="flex items-center gap-1 text-amber-500 mb-2">
            <Star size={14} fill="currentColor" />
            <span className="text-xs font-extrabold text-gray-800">{trip.rating} <span className="text-gray-400 font-normal">({trip.reviews})</span></span>
          </div>
          
          <h3 className="text-lg font-bold text-brand-navy mb-2 group-hover:text-brand-emerald transition-colors line-clamp-2 leading-snug">
            {trip.title}
          </h3>
          
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-4 font-medium">
            <MapPin size={14} className="text-brand-emerald shrink-0" />
            <span className="truncate">{trip.location}</span>
          </div>
          
          <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-brand-navy text-xs font-bold">
              <Clock size={15} className="text-brand-emerald" />
              <span>{trip.duration}</span>
            </div>
            <div className="text-xs text-brand-emerald font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Book <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default TripCard;
