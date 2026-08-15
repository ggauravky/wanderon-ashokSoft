import React from 'react';
import { Sun, CloudSun, CloudRain, Wind, Thermometer, Sparkles } from 'lucide-react';

const WeatherBadge = ({ weather, size = 'sm', showCondition = true, className = '' }) => {
  if (!weather) return null;

  const renderIcon = () => {
    const iconProps = { size: size === 'sm' ? 13 : 16, className: 'shrink-0' };
    switch (weather.iconType) {
      case 'CloudRain':
        return <CloudRain {...iconProps} className="text-sky-400 shrink-0" />;
      case 'CloudSun':
        return <CloudSun {...iconProps} className="text-amber-400 shrink-0" />;
      case 'Wind':
        return <Wind {...iconProps} className="text-teal-400 shrink-0" />;
      case 'Sun':
      default:
        return <Sun {...iconProps} className="text-amber-400 shrink-0" />;
    }
  };

  if (size === 'lg') {
    return (
      <div className={`p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            {renderIcon()}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-white">{weather.temp}</span>
              <span className="text-xs text-white/80 font-bold">{weather.condition}</span>
            </div>
            <span className="text-[11px] text-emerald-300 font-semibold block">{weather.statusTag}</span>
          </div>
        </div>
        <div className="text-right border-l border-white/10 pl-4">
          <span className="text-[10px] text-white/60 uppercase font-bold block">Best Months</span>
          <span className="text-xs font-extrabold text-white">{weather.bestMonths}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-sm ${className}`}
      title={`${weather.temp} - ${weather.condition}`}
    >
      {renderIcon()}
      <span className="font-extrabold text-white">{weather.temp}</span>
      {showCondition && (
        <>
          <span className="text-white/40">•</span>
          <span className="text-white/80 font-medium truncate max-w-[90px]">{weather.condition}</span>
        </>
      )}
    </div>
  );
};

export default WeatherBadge;
