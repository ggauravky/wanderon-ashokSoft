import React from 'react';
import { MapPin, UserRound } from 'lucide-react';
import QuotationActions from './QuotationActions.jsx';
import QuotationStatusBadge from './QuotationStatusBadge.jsx';
import { formatQuotationDate, formatQuotationMoney, getQuotationId, getQuotationTraveler } from '../quotationHelpers.js';

const QuotationMobileCard = ({ quotation, busyId, onPreview, onSend, onShare }) => {
  const traveler = getQuotationTraveler(quotation);
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-emerald-700">{quotation.quotationNumber || 'Draft'}</p><h3 className="mt-1 text-base font-semibold text-slate-950">{quotation.tripRequirements?.title || 'Trip not provided'}</h3></div><QuotationStatusBadge status={quotation.status} /></div>
      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p className="flex items-center gap-2"><UserRound size={15} className="text-slate-400" aria-hidden="true" /> {traveler.name || 'Traveler not provided'}</p><p className="flex items-center gap-2"><MapPin size={15} className="text-slate-400" aria-hidden="true" /> {quotation.tripRequirements?.destination || 'Destination not provided'}</p></div>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3"><div><p className="text-xs text-slate-400">Final amount</p><p className="text-lg font-semibold text-slate-950">{formatQuotationMoney(quotation.pricing?.finalTotal)}</p><p className="mt-1 text-xs text-slate-400">Updated {formatQuotationDate(quotation.updatedAt)}</p></div></div>
      {quotation.bookingCode && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 font-mono text-xs font-semibold text-emerald-800">Booking {quotation.bookingCode}</p>}
      <div className="mt-4"><QuotationActions quotation={quotation} busy={busyId === getQuotationId(quotation)} onPreview={onPreview} onSend={onSend} onShare={onShare} /></div>
    </article>
  );
};

export default QuotationMobileCard;
