import React from 'react';
import QuotationActions from './QuotationActions.jsx';
import QuotationStatusBadge from './QuotationStatusBadge.jsx';
import { formatQuotationDate, formatQuotationMoney, getQuotationId, getQuotationTraveler } from '../quotationHelpers.js';

const QuotationTable = ({ quotations, busyId, onPreview, onSend, onShare }) => (
  <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white xl:block">
    <table className="w-full min-w-[1120px] border-collapse text-left">
      <thead className="border-b border-slate-200 bg-slate-50/80"><tr>{['Quotation', 'Traveler', 'Trip', 'Amount', 'Status', 'Created', 'Updated', 'Actions'].map((label) => <th key={label} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">
        {quotations.map((quotation) => {
          const traveler = getQuotationTraveler(quotation);
          return (
            <tr key={getQuotationId(quotation)} className="align-top transition-colors hover:bg-slate-50/70">
              <td className="px-4 py-4"><p className="font-mono text-xs font-semibold text-slate-900">{quotation.quotationNumber || 'Draft'}</p><p className="mt-1 text-xs text-slate-400">v{quotation.version || 1}</p></td>
              <td className="px-4 py-4"><p className="max-w-44 truncate text-sm font-semibold text-slate-900">{traveler.name || 'Not provided'}</p><p className="mt-1 max-w-44 truncate text-xs text-slate-500">{traveler.email || '—'}</p><p className="text-xs text-slate-400">{traveler.phone || '—'}</p></td>
              <td className="px-4 py-4"><p className="max-w-48 text-sm font-medium text-slate-800">{quotation.tripRequirements?.title || 'Not provided'}</p><p className="mt-1 text-xs text-slate-500">{quotation.tripRequirements?.destination || '—'}</p><p className="mt-1 text-xs text-slate-400">{formatQuotationDate(quotation.tripRequirements?.startDate)} – {formatQuotationDate(quotation.tripRequirements?.endDate)}</p></td>
              <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatQuotationMoney(quotation.pricing?.finalTotal)}</td>
              <td className="px-4 py-4"><QuotationStatusBadge status={quotation.status} />{quotation.bookingCode && <p className="mt-1 font-mono text-[11px] text-emerald-700">{quotation.bookingCode}</p>}</td>
              <td className="px-4 py-4 text-xs text-slate-500">{formatQuotationDate(quotation.createdAt, true)}</td>
              <td className="px-4 py-4 text-xs text-slate-500">{formatQuotationDate(quotation.updatedAt, true)}</td>
              <td className="px-4 py-4"><QuotationActions quotation={quotation} busy={busyId === getQuotationId(quotation)} compact onPreview={onPreview} onSend={onSend} onShare={onShare} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default QuotationTable;
