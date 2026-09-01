import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import WeatherBadge from './WeatherBadge.jsx';

const DestinationCard = ({ 
  destination, 
  weather = null, 
  activeCount = null,
  aspect = 'aspect-[3/4]',
  className = '' 
}) => {
  if (!destination) return null;

  const destName = destination.name || destination.title || 'Expedition';
  const destSlug = destination.slug || destination.id || destName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const destImage = destination.image || destination.coverImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop';
  const regionTag = destination.region || destination.category || 'Curated Circuit';

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative rounded-3xl overflow-hidden ${aspect} group cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.2)] border border-slate-200/60 bg-slate-900 ${className}`}
    >
      <Link to={`/trips/${destSlug}`} className="block w-full h-full relative">
        {/* Background Image */}
        <img 
          src={destImage} 
          alt={`${destName} travel tour packages`} 
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out" 
        />

        {/* Ambient Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent flex flex-col justify-between p-5 pointer-events-none" />

        {/* Top Header Row (Weather or Region) */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
          <span className="text-[10px] uppercase font-black tracking-wider bg-slate-900/80 backdrop-blur-md text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
            {regionTag}
          </span>
          {weather && (
            <div className="shrink-0">
              <WeatherBadge weather={weather} size="sm" showCondition={false} />
            </div>
          )}
        </div>

        {/* Bottom Content Row */}
        <div className="absolute bottom-5 left-5 right-5 z-10">
          <h3 className="text-white font-black text-lg sm:text-xl leading-tight group-hover:text-emerald-300 transition-colors flex items-center justify-between gap-2">
            <span>{destName}</span>
            <span className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 shrink-0">
              <ArrowRight size={13} />
            </span>
          </h3>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300 font-medium">
            <MapPin size={12} className="text-emerald-400 shrink-0" />
            <span className="text-emerald-300 font-bold">
              {activeCount !== null ? `${activeCount} ${activeCount === 1 ? 'Package' : 'Packages'}` : 'Explore Circuit'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default DestinationCard;
