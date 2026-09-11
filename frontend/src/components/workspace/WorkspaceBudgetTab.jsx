import React from 'react';
import { DollarSign, ShieldAlert, Sparkles, TrendingDown, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';

const WorkspaceBudgetTab = ({ itinerary, userTargetBudget, onTriggerCopilot }) => {
  const totalCost = itinerary?.totalEstimatedCost || 45000;
  const rawBreakdown = itinerary?.budgetBreakdown || {};

  // Compute clean breakdown
  const stayCost = rawBreakdown.stay ? parseInt(rawBreakdown.stay.replace(/[^\d]/g, '')) || Math.round(totalCost * 0.42) : Math.round(totalCost * 0.42);
  const transportCost = rawBreakdown.transport ? parseInt(rawBreakdown.transport.replace(/[^\d]/g, '')) || Math.round(totalCost * 0.22) : Math.round(totalCost * 0.22);
  const activityCost = rawBreakdown.activities ? parseInt(rawBreakdown.activities.replace(/[^\d]/g, '')) || Math.round(totalCost * 0.16) : Math.round(totalCost * 0.16);
  const foodCost = rawBreakdown.food ? parseInt(rawBreakdown.food.replace(/[^\d]/g, '')) || Math.round(totalCost * 0.12) : Math.round(totalCost * 0.12);
  const bufferCost = Math.max(1500, totalCost - (stayCost + transportCost + activityCost + foodCost));

  const budgetItems = [
    { label: 'Verified Stays & Resorts', amount: stayCost, pct: Math.round((stayCost / totalCost) * 100), desc: 'Comfortable boutique hotels and homestays' },
    { label: 'Private & Regional Transport', amount: transportCost, pct: Math.round((transportCost / totalCost) * 100), desc: 'Dedicated vehicle with driver for hill circuits' },
    { label: 'Activities & Guided Permits', amount: activityCost, pct: Math.round((activityCost / totalCost) * 100), desc: 'Entry tickets, local guides, and river fees' },
    { label: 'Culinary & Regional Dining', amount: foodCost, pct: Math.round((foodCost / totalCost) * 100), desc: 'Breakfasts and regional cafe allocations' },
    { label: 'Trip Contingency / Buffer', amount: bufferCost, pct: Math.round((bufferCost / totalCost) * 100), desc: 'Recommended safety cushion for weather shifts' }
  ];

  const target = userTargetBudget ? Number(userTargetBudget) : null;
  const isOverBudget = target && totalCost > target + 2000;
  const budgetGap = isOverBudget ? totalCost - target : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Over-Budget Warning Card if user set a lower target */}
      {isOverBudget && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                Target Budget Notice
              </span>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                This plan is currently about <strong>₹{budgetGap.toLocaleString()}</strong> above your ₹{target.toLocaleString()} target.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onTriggerCopilot('Keep the trip below target budget')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Reduce Cost with AI
            </button>
          </div>
        </div>
      )}

      {/* Main Budget Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">
              Honest Cost Transparency
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Estimated Trip Budget: ₹{totalCost.toLocaleString()}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Realistic estimated expenditure for {itinerary?.travelers || 2} travelers ({itinerary?.duration || 5} days).
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-[11px] font-bold text-slate-600 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>ESTIMATED — Not Guaranteed Price</span>
          </div>
        </div>

        {/* Categorized Cost Progress Bars */}
        <div className="space-y-4">
          {budgetItems.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{item.label}</span>
                  <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 block">₹{item.amount.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 block">{item.pct}% of total</span>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Quick AI Budget Adjustment Actions */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-2.5">
            Optimize Budget with AI Copilot
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Reduce overall cost (~15%)', prompt: 'Reduce trip budget by switching to boutique homestays' },
              { label: 'Upgrade to premium stays', prompt: 'Upgrade stays to luxury eco-resorts' },
              { label: `Keep under ₹${Math.round(totalCost * 0.85 / 1000) * 1000}`, prompt: `Keep the trip strictly below ₹${Math.round(totalCost * 0.85 / 1000) * 1000}` }
            ].map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onTriggerCopilot(btn.prompt)}
                className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={12} className="text-emerald-600" />
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceBudgetTab;
