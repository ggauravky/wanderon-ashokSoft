import React from 'react';
import { FileText, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBookingSourceLabel, getLead, getQuotationNumber, getSourceQuotation } from '../bookingAdminHelpers.js';

const BookingSourceSection = ({ booking }) => {
  const quotation = getSourceQuotation(booking);
  const lead = getLead(booking);
  const quotationId = quotation?._id || quotation?.id;
  const leadId = lead?._id || lead?.id;
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-950">Quotation / Lead source</h2><p className="mt-2 text-sm text-slate-600">Source: <span className="font-semibold text-slate-900">{getBookingSourceLabel(booking)}</span></p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-slate-200 p-4"><FileText size={17} className="text-slate-400" /><p className="mt-2 text-xs text-slate-500">Quotation</p><p className="mt-1 font-mono text-sm font-semibold text-slate-900">{getQuotationNumber(booking)}</p>{quotationId && <Link to={`/staff/sales/quotations/${quotationId}`} className="mt-3 inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-emerald-700">Open quotation</Link>}</div><div className="rounded-lg border border-slate-200 p-4"><UserRound size={17} className="text-slate-400" /><p className="mt-2 text-xs text-slate-500">Expert Request</p><p className="mt-1 text-sm font-semibold text-slate-900">{lead?.referenceId || lead?.name || 'Not linked'}</p>{leadId && <Link to={`/staff/sales/expert-requests?leadId=${leadId}`} className="mt-3 inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-emerald-700">Open Expert Request</Link>}</div></div></section>;
};

export default BookingSourceSection;

