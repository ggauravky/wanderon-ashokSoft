import React from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { getAiAssistVisualState } from './aiAssistUi.js';

export const AiAssistStatus = ({ assist }) => {
  if (!assist?.busy && !assist?.ready && !assist?.message) return null;
  return <span role="status" aria-live="polite" className={`mt-1.5 flex min-h-5 items-center gap-2 text-xs ${assist.message?.type === 'error' ? 'text-rose-700' : assist.ready ? 'text-emerald-700' : 'text-slate-500'}`}>
    {assist.busy && <><Sparkles size={12} className="animate-pulse" /><span>{assist.loadingLabel || 'AI is preparing a suggestion…'}</span><span aria-hidden="true" className="inline-flex gap-0.5"><i className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" /><i className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" /><i className="h-1 w-1 animate-bounce rounded-full bg-current" /></span></>}
    {assist.ready && !assist.busy && <><Check size={12} />Suggestion ready</>}
    {assist.message && !assist.busy && !assist.ready && <span>{assist.message.text}</span>}
  </span>;
};

export default function AiAssistButton({ assist, label }) {
  const visual = getAiAssistVisualState({
    key: assist?.key,
    busyKey: assist?.busy ? assist.key : null,
    readyKey: assist?.ready ? assist.key : null,
    mode: assist?.mode,
    blocked: assist?.blocked
  });
  const title = assist?.disabledReason || (visual.state === 'idle' ? `Generate ${label}` : visual.label);
  return <button
    type="button"
    title={title}
    aria-label={visual.state === 'busy' ? `${label}: ${visual.label}` : `Generate ${label}`}
    aria-busy={visual.state === 'busy' ? 'true' : undefined}
    disabled={assist?.disabled || visual.disabled}
    onClick={(event) => { event.preventDefault(); assist?.run?.('generate'); }}
    className="inline-flex h-8 w-8 items-center justify-center rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
  >
    {visual.state === 'busy' ? <Loader2 size={15} className="animate-spin" /> : visual.state === 'ready' ? <Check size={15} /> : <Sparkles size={15} />}
  </button>;
}
