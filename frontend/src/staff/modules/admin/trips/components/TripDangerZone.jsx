import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const TripDangerZone = ({ trip, onDeactivate, onDelete, busy }) => {
  const [confirming, setConfirming] = useState(false);
  return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><div className="flex gap-3"><AlertTriangle size={19} className="mt-0.5 shrink-0 text-rose-700" /><div className="flex-1"><h3 className="text-sm font-semibold text-rose-950">Danger zone</h3><p className="mt-1 text-xs leading-5 text-rose-800">Deactivate to remove this trip from public discovery. Delete only removes an unused trip; linked commercial history is always preserved and forces deactivation.</p><div className="mt-3 flex flex-wrap gap-2">{trip?.status === 'published' && <button type="button" disabled={busy} onClick={onDeactivate} className="min-h-10 rounded-lg border border-rose-300 bg-white px-3 text-sm font-semibold text-rose-800">Deactivate</button>}{!confirming ? <button type="button" disabled={busy} onClick={() => setConfirming(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-700 px-3 text-sm font-semibold text-white"><Trash2 size={15} />Delete unused trip</button> : <><button type="button" disabled={busy} onClick={onDelete} className="min-h-10 rounded-lg bg-rose-800 px-3 text-sm font-semibold text-white">Confirm delete</button><button type="button" onClick={() => setConfirming(false)} className="min-h-10 rounded-lg border border-rose-300 bg-white px-3 text-sm font-semibold text-rose-800">Cancel</button></>}</div></div></div></div>;
};

export default TripDangerZone;
