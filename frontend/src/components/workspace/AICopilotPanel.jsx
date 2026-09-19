import React, { useState } from 'react';
import { Sparkles, Send, Check, Undo2, ArrowRight, MessageSquare, Clock, ArrowDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COPILOT_SUGGESTIONS = [
  'Make Day 2 less tiring',
  'Add more waterfall views',
  'Keep overall trip below ₹40,000',
  'Add an authentic Khasi dining stop',
  'Avoid 6 AM early starts'
];

const AICopilotPanel = ({ itinerary, onApplyChanges, onUndo, canUndo = false }) => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [proposedDiff, setProposedDiff] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handleSend = (userText) => {
    const text = (userText || query).trim();
    if (!text) return;

    setIsProcessing(true);
    setProposedDiff(null);

    // Simulate smart conversational reasoning
    setTimeout(() => {
      setIsProcessing(false);
      const lower = text.toLowerCase();

      if (lower.includes('relax') || lower.includes('tiring') || lower.includes('less drive')) {
        setProposedDiff({
          targetDay: 2,
          summary: 'Adjusted Day 2 for relaxed pacing and reduced road travel.',
          changes: [
            { type: 'remove', text: 'Removed secondary cave trail in Cherrapunji' },
            { type: 'add', text: 'Added afternoon tea at high plateau scenic viewpoint' },
            { type: 'timing', text: 'Shifted departure from 8:30 AM to 9:45 AM' }
          ],
          estimatedEffect: '~40 minutes less road transit; gentler morning pace',
          actionPayload: {
            dayIndex: 1,
            patch: {
              pace: 'Relaxed',
              title: 'Day 2: Serene Waterfalls & Plateau Relaxation'
            }
          }
        });
      } else if (lower.includes('waterfall') || lower.includes('nature')) {
        setProposedDiff({
          targetDay: 1,
          summary: 'Enriched route with additional natural cascade viewpoint.',
          changes: [
            { type: 'add', text: 'Added Wei Sawdong 3-tier cascade guided stop' }
          ],
          estimatedEffect: 'Extra photography stop with minimal detour',
          actionPayload: {
            dayIndex: 0,
            patch: {
              title: 'Day 1: Wei Sawdong Falls & Shillong Exploration'
            }
          }
        });
      } else if (lower.includes('40') || lower.includes('cost') || lower.includes('budget')) {
        setProposedDiff({
          targetDay: 'Trip Budget',
          summary: 'Recalibrated transport and stay tiers to align under target.',
          changes: [
            { type: 'adjust', text: 'Selected verified boutique homestays over luxury resorts' },
            { type: 'adjust', text: 'Grouped local vehicle transfers' }
          ],
          estimatedEffect: 'Reduced estimated trip budget by ₹6,000 without losing core stops',
          actionPayload: {
            patch: {
              totalEstimatedCost: 39500
            }
          }
        });
      } else {
        setProposedDiff({
          targetDay: 3,
          summary: `Refined itinerary based on: "${text}"`,
          changes: [
            { type: 'adjust', text: `Prioritized activities matching "${text}"` }
          ],
          estimatedEffect: 'Schedule updated to reflect custom constraint',
          actionPayload: {
            dayIndex: 2,
            patch: {}
          }
        });
      }
    }, 600);

    setQuery('');
  };

  const handleApply = () => {
    if (!proposedDiff) return;
    onApplyChanges(proposedDiff.actionPayload);
    setToastMessage('Changes applied successfully!');
    setProposedDiff(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              AI Travel Copilot
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Ask WanderLuxe to refine</span>
          </div>
        </div>

        {canUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <Undo2 size={12} /> Undo
          </button>
        )}
      </div>

      {/* Main Conversation / Proposal Body */}
      <div className="p-4 flex-grow space-y-3 overflow-y-auto max-h-[460px]">
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between"
          >
            <span>✓ {toastMessage}</span>
            {canUndo && (
              <button type="button" onClick={onUndo} className="underline text-[11px]">
                Undo
              </button>
            )}
          </motion.div>
        )}

        {/* Informational intro if no proposal is pending */}
        {!proposedDiff && !isProcessing && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 space-y-2">
            <p className="font-medium leading-relaxed">
              Tell me what you'd like to adjust. I propose specific modifications with an estimated impact before applying them to your itinerary.
            </p>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider pt-1">
              Try asking:
            </span>
            <div className="flex flex-col gap-1.5">
              {COPILOT_SUGGESTIONS.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="text-left p-2 rounded-xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 text-[11px] font-bold text-slate-700 hover:text-emerald-800 transition-all cursor-pointer"
                >
                  💬 {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <div className="w-5 h-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
            <span className="text-xs font-bold text-slate-600 block">Analyzing route dependencies...</span>
          </div>
        )}

        {/* Proposed Changes Diff Card */}
        <AnimatePresence>
          {proposedDiff && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-300 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">
                  Proposed Changes
                </span>
                <span className="text-[10px] font-extrabold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
                  Day {proposedDiff.targetDay}
                </span>
              </div>

              <p className="text-xs font-bold text-slate-800">{proposedDiff.summary}</p>

              {/* Change diff list */}
              <div className="space-y-1.5 pt-1 border-t border-emerald-200/60">
                {proposedDiff.changes.map((ch, i) => (
                  <div key={i} className="text-xs flex items-start gap-2">
                    <span className={`font-black text-xs ${
                      ch.type === 'remove' ? 'text-rose-600' : ch.type === 'add' ? 'text-emerald-700' : 'text-blue-600'
                    }`}>
                      {ch.type === 'remove' ? '−' : ch.type === 'add' ? '+' : '•'}
                    </span>
                    <span className="text-slate-700 leading-snug">{ch.text}</span>
                  </div>
                ))}
              </div>

              {/* Estimated Effect */}
              <div className="p-2 rounded-xl bg-white/90 border border-emerald-200/80 text-[11px] font-medium text-emerald-900 flex items-center gap-1.5">
                <Clock size={12} className="text-emerald-700 shrink-0" />
                <span><strong>Impact:</strong> {proposedDiff.estimatedEffect}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-grow py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Check size={13} /> Apply Changes
                </button>
                <button
                  type="button"
                  onClick={() => setProposedDiff(null)}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition-colors"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Prompt Box */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Copilot (e.g. Less driving on Day 3)..."
            className="flex-grow px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!query.trim() || isProcessing}
            className="p-2 rounded-xl bg-slate-900 disabled:opacity-40 hover:bg-emerald-600 text-white transition-colors"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AICopilotPanel;
