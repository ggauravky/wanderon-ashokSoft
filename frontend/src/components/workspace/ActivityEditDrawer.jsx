import React, { useState } from 'react';
import { X, RefreshCw, Trash2, ArrowUpDown, MapPin, Check, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CURATED_ALTERNATIVES = {
  default: [
    { name: 'Wei Sawdong 3-Tier Falls', rationale: 'Less crowded emerald pools with scenic viewpoint trail.' },
    { name: 'Arwah Limestone Cave', rationale: 'Fossil formations and wider chambers, gentler walk than Mawsmai.' },
    { name: 'Dainthlen Cascades', rationale: 'Dramatic plateau gorge with minimal stairs and peaceful rock pools.' }
  ]
};

const ActivityEditDrawer = ({
  isOpen,
  onClose,
  activity,
  slotName,
  dayNumber,
  onReplace,
  onRemove,
  onMoveSlot,
  destination = 'Meghalaya'
}) => {
  const [showReplaceOptions, setShowReplaceOptions] = useState(false);

  if (!isOpen || !activity) return null;

  const alternatives = CURATED_ALTERNATIVES[destination.toLowerCase()] || CURATED_ALTERNATIVES.default;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Day {dayNumber} • {slotName?.toUpperCase() || 'ACTIVITY'}
            </span>
            <h3 className="text-base font-black text-slate-900 truncate max-w-[320px]">
              {activity.activity || activity.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Activity Details */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
            <p className="font-medium">{activity.description || 'Scenic sightseeing and cultural exploration.'}</p>
            <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-slate-400">
              <span>📍 {activity.location || destination}</span>
              <span>⏱ {activity.travelTime || 'Approx 1 hr'}</span>
              <span>🏷 {activity.estimatedCost || 'Estimated'}</span>
            </div>
          </div>

          {/* Core Actions */}
          {!showReplaceOptions ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowReplaceOptions(true)}
                className="p-3 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 rounded-2xl border border-emerald-200/70 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw size={14} className="text-emerald-600" />
                <span>Replace Activity</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onRemove(activity);
                  onClose();
                }}
                className="p-3 bg-rose-50 hover:bg-rose-100/70 text-rose-700 rounded-2xl border border-rose-200/70 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 size={14} className="text-rose-600" />
                <span>Remove from Day</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  Suggested Alternatives
                </span>
                <button
                  type="button"
                  onClick={() => setShowReplaceOptions(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-700 font-bold"
                >
                  Back
                </button>
              </div>

              <div className="space-y-2">
                {alternatives.map((alt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onReplace(activity, alt);
                      onClose();
                    }}
                    className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 group-hover:text-emerald-800">
                        {alt.name}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Swap
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{alt.rationale}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ActivityEditDrawer;
