import React from 'react';
import { MapPin, Calendar, Compass, Users, Sparkles, ShieldCheck, Heart } from 'lucide-react';

const PlannerLiveSummary = ({ formData }) => {
  const travelers = formData.travelers || { adults: 2, children: 0, infants: 0, seniors: 0 };
  const totalPax = (travelers.adults || 0) + (travelers.children || 0) + (travelers.infants || 0) + (travelers.seniors || 0);

  const duration = formData.duration || 5;
  const destination = formData.destination || 'Meghalaya';
  const origin = formData.origin || 'Not specified';
  const pace = formData.pace || 'Balanced';
  const interests = (formData.interests || ['Nature', 'Photography']).slice(0, 3).join(' • ');

  let dateDisplay = 'Dates flexible';
  if (!formData.datesFlexible && formData.startDate && formData.endDate) {
    try {
      const s = new Date(formData.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const e = new Date(formData.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      dateDisplay = `${s} – ${e}`;
    } catch {
      dateDisplay = `${formData.startDate} to ${formData.endDate}`;
    }
  } else if (formData.flexibleMonth) {
    dateDisplay = `${formData.flexibleMonth}`;
  }

  const budgetDisplay = formData.budgetAmount
    ? `₹${Number(formData.budgetAmount).toLocaleString()}/person`
    : `${formData.budgetTier || 'Comfortable'}`;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4 sticky top-24">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          Your Trip Summary
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
          <Sparkles size={11} /> Live Draft
        </span>
      </div>

      {/* Destination Hero Block */}
      <div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
          <MapPin size={18} className="text-emerald-600 shrink-0" />
          <span>{destination}</span>
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          {dateDisplay} • {duration} Days ({Math.max(1, duration - 1)} Nights)
        </p>
      </div>

      {/* Structured Details */}
      <div className="space-y-2.5 pt-1 text-xs">
        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Starting From</span>
          <span className="font-extrabold text-slate-800">{origin}</span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Travelers</span>
          <span className="font-extrabold text-slate-800">
            {totalPax} Pax ({travelers.adults || 2} Adults{travelers.children ? `, ${travelers.children} Kids` : ''}{travelers.seniors ? `, ${travelers.seniors} Seniors` : ''})
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Trip Pace</span>
          <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
            {pace}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Interests</span>
          <span className="font-bold text-slate-700 truncate max-w-[140px] text-right" title={interests}>
            {interests}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Est. Budget</span>
          <span className="font-extrabold text-slate-900">{budgetDisplay}</span>
        </div>

        {formData.mustInclude && formData.mustInclude.length > 0 && (
          <div className="py-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Must Include</span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
              {formData.mustInclude.join(', ')}
            </span>
          </div>
        )}

        {formData.avoid && formData.avoid.length > 0 && (
          <div className="py-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Avoid</span>
            <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
              {formData.avoid.join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
        <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
        <span>Verified database routing & real photos</span>
      </div>
    </div>
  );
};

export default PlannerLiveSummary;
