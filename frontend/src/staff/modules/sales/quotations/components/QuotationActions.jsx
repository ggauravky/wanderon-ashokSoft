import React from 'react';
import { BookOpen, Edit3, Eye, ExternalLink, Send, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { canEditQuotation, canSendQuotation, getPublicQuotationPath, getQuotationId } from '../quotationHelpers.js';

const actionClass = 'flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50';

const QuotationActions = ({ quotation, busy = false, compact = false, onPreview, onSend, onShare }) => {
  const id = getQuotationId(quotation);
  const publicPath = getPublicQuotationPath(quotation);
  const bookingRouteId = quotation?.bookingId?.bookingId || quotation?.bookingCode || quotation?.bookingId?._id;

  return (
    <div className="flex flex-wrap gap-2">
      <Link to={`/staff/sales/quotations/${id}`} className={actionClass}><Eye size={14} aria-hidden="true" /> {!compact && 'View'}</Link>
      {canEditQuotation(quotation) && <Link to={`/staff/sales/quotations/${id}/edit`} className={actionClass}><Edit3 size={14} aria-hidden="true" /> {!compact && 'Edit'}</Link>}
      {onPreview && <button type="button" onClick={() => onPreview(quotation)} className={actionClass}><Eye size={14} aria-hidden="true" /> {!compact && 'Preview'}</button>}
      {canSendQuotation(quotation) && onSend && <button type="button" onClick={() => onSend(quotation)} disabled={busy} className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"><Send size={14} aria-hidden="true" /> {!compact && 'Send'}</button>}
      {quotation?.publicShare?.token && onShare && <button type="button" onClick={() => onShare(quotation)} className={actionClass}><Share2 size={14} aria-hidden="true" /> {!compact && 'Share'}</button>}
      {publicPath && <a href={publicPath} target="_blank" rel="noreferrer" className={actionClass} title="Open public quotation"><ExternalLink size={14} aria-hidden="true" /></a>}
      {bookingRouteId && <Link to={`/staff/sales/bookings/${bookingRouteId}`} className={actionClass} title="Open booking"><BookOpen size={14} aria-hidden="true" /> {!compact && 'Booking'}</Link>}
    </div>
  );
};

export default QuotationActions;
