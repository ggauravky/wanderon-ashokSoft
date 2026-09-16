import React from 'react';
import { BookOpen, CalendarClock, CircleUserRound, FileText, MessageSquareText, Plus, Route, Users } from 'lucide-react';
import { formatDate, formatDateTime, formatMoney, getCallbackState, getTripTitle } from './salesUtils.js';

const DetailRow = ({ label, value }) => (
  <div className="grid grid-cols-[minmax(7rem,0.8fr)_minmax(0,1.2fr)] gap-3 border-b border-slate-100 py-2.5 last:border-0">
    <dt className="text-xs font-medium text-slate-500">{label}</dt>
    <dd className="break-words text-sm text-slate-800">{value || '—'}</dd>
  </div>
);

const DetailSection = ({ title, icon: Icon, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
      <Icon size={16} className="text-slate-500" aria-hidden="true" /> {title}
    </h3>
    <dl className="mt-3">{children}</dl>
  </section>
);

const ExpertRequestDetails = ({ lead, onCreateQuotation, onOpenQuotation, onOpenBooking }) => {
  const callback = getCallbackState(lead);
  const outcomes = [...(Array.isArray(lead?.callOutcomes) ? lead.callOutcomes : [])]
    .sort((a, b) => new Date(b.loggedAt || 0) - new Date(a.loggedAt || 0));
  const topics = Array.isArray(lead?.topics) ? lead.topics.filter(Boolean) : [];
  const quotations = Array.isArray(lead?.quotations) ? lead.quotations : [];
  const booking = lead?.convertedBookingId;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <DetailSection title="Traveler" icon={CircleUserRound}>
          <DetailRow label="Name" value={lead?.name || 'Not provided'} />
          <DetailRow label="Phone" value={lead?.phone || 'Not provided'} />
          <DetailRow label="Email" value={lead?.email || 'Not provided'} />
          <DetailRow label="Travelers" value={lead?.travelersCount ? `${lead.travelersCount}` : 'Not provided'} />
        </DetailSection>

        <DetailSection title="Trip request" icon={Route}>
          <DetailRow label="Trip" value={getTripTitle(lead)} />
          <DetailRow label="Destination" value={lead?.destination || 'Not provided'} />
          <DetailRow label="Selected batch" value={lead?.selectedBatch || 'Not provided'} />
          <DetailRow label="Travel date" value={lead?.travelDate || lead?.travelMonth || 'Not provided'} />
          <DetailRow label="Price snapshot" value={formatMoney(lead?.tripPriceSnapshot)} />
        </DetailSection>
      </div>

      <DetailSection title="Callback preference" icon={CalendarClock}>
        <DetailRow label="Timing" value={<span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${callback.classes}`}>{callback.label}</span>} />
        <DetailRow label="Preferred date" value={formatDate(lead?.preferredCallDate, 'Flexible')} />
        <DetailRow label="Preferred window" value={lead?.preferredCallWindow || 'Anytime'} />
        <DetailRow label="Next follow-up" value={formatDateTime(lead?.nextFollowUpAt, 'Not scheduled')} />
      </DetailSection>

      <DetailSection title="Traveler message and topics" icon={MessageSquareText}>
        <DetailRow label="Message" value={lead?.message || 'Not provided'} />
        <DetailRow label="Topics" value={topics.length > 0 ? topics.join(', ') : 'Not provided'} />
        <DetailRow label="Budget" value={lead?.budgetPerPerson || 'Not provided'} />
      </DetailSection>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950"><FileText size={16} className="text-slate-500" aria-hidden="true" /> Quotations</h3>
            <p className="mt-1 text-xs text-slate-500">Commercial proposals linked to this Expert Request.</p>
          </div>
          {!['LOST', 'CONVERTED'].includes(lead?.status) && (
            <button type="button" onClick={onCreateQuotation} className="flex min-h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500"><Plus size={14} aria-hidden="true" /> Create quotation</button>
          )}
        </div>
        {quotations.length > 0 ? (
          <div className="mt-4 space-y-2">
            {quotations.map((quotation) => (
              <button key={quotation._id || quotation.quotationNumber} type="button" onClick={() => onOpenQuotation(quotation)} className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 px-3 py-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50">
                <div><p className="font-mono text-xs font-semibold text-slate-900">{quotation.quotationNumber || 'Quotation'}</p><p className="mt-1 text-xs text-slate-500">Created {formatDate(quotation.createdAt)}</p></div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{quotation.status || 'DRAFT'}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">No quotation created.</p>
        )}
      </section>

      {booking && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-950"><BookOpen size={16} aria-hidden="true" /> Booking handoff</h3><p className="mt-1 font-mono text-xs font-semibold text-emerald-800">{booking.bookingId || lead.convertedBookingCode}</p><p className="mt-2 text-xs text-emerald-800">Payment: {(booking.paymentStatus || 'Unknown').replaceAll('_', ' ')}</p></div><button type="button" onClick={() => onOpenBooking(booking)} className="min-h-9 rounded-lg border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">Open booking</button></div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Users size={16} className="text-slate-500" aria-hidden="true" /> Activity timeline</h3>
          <p className="text-xs text-slate-500">{lead?.contactCount || 0} contact{Number(lead?.contactCount || 0) === 1 ? '' : 's'}</p>
        </div>

        {outcomes.length > 0 ? (
          <ol className="mt-4 space-y-3 border-l border-slate-200 pl-4">
            {outcomes.map((activity, index) => (
              <li key={activity._id || `${activity.loggedAt}-${index}`} className="relative rounded-lg bg-slate-50 p-3">
                <span className="absolute -left-[1.32rem] top-4 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-white" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{(activity.outcome || 'Contact logged').replaceAll('_', ' ')}</p>
                  <time className="text-xs text-slate-400">{formatDateTime(activity.loggedAt)}</time>
                </div>
                <p className="mt-1 text-xs font-medium capitalize text-slate-500">{activity.channel || 'Channel not recorded'}</p>
                {activity.notes && <p className="mt-2 text-sm leading-6 text-slate-700">{activity.notes}</p>}
                <p className="mt-2 text-xs text-slate-500">
                  {activity.loggedByName ? `Logged by ${activity.loggedByName}` : 'Staff member not recorded'}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No contact activity has been logged.</div>
        )}

        {(lead?.firstContactAt || lead?.lastContactAt) && (
          <div className="mt-4 grid gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500 sm:grid-cols-2">
            <p>First contact: <span className="font-medium text-slate-700">{formatDateTime(lead.firstContactAt)}</span></p>
            <p>Last contact: <span className="font-medium text-slate-700">{formatDateTime(lead.lastContactAt)}</span></p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ExpertRequestDetails;
