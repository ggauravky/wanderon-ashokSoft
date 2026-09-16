import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, BookOpen, Edit3, ExternalLink, Eye, History, Loader2, Send, Share2, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import QuotationPreviewModal from '../../../../components/QuotationPreviewModal.jsx';
import ShareQuotationModal from '../../../../components/ShareQuotationModal.jsx';
import { createBookingFromQuotationApi, createQuotationRevisionApi, getQuotationByIdApi, sendQuotationApi } from '../../../../services/quotationService.js';
import CreateBookingModal from '../bookings/components/CreateBookingModal.jsx';
import QuotationStatusBadge from './components/QuotationStatusBadge.jsx';
import { canCreateQuotationRevision, canEditQuotation, canSendQuotation, formatQuotationDate, formatQuotationMoney, getPublicQuotationPath, getQuotationId } from './quotationHelpers.js';

const Section = ({ title, children }) => <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><h2 className="text-sm font-semibold text-slate-950">{title}</h2><div className="mt-4">{children}</div></section>;
const Row = ({ label, value }) => <div className="grid grid-cols-[minmax(8rem,0.8fr)_minmax(0,1.2fr)] gap-3 border-b border-slate-100 py-2.5 last:border-0"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="break-words text-sm text-slate-800">{value || '—'}</dd></div>;

const QuotationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const loadQuotation = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getQuotationByIdApi(id);
      setQuotation(data?.quotation || null);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load quotation.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadQuotation(); }, [loadQuotation]);

  const handleSend = async () => {
    setBusy(true);
    setNotice('');
    try {
      const data = await sendQuotationApi(getQuotationId(quotation));
      setQuotation(data?.quotation || quotation);
      setNotice('Quotation sent and public share state persisted.');
    } catch (sendError) {
      setNotice(sendError.message || 'Unable to send quotation.');
    } finally {
      setBusy(false);
    }
  };

  const handleRevision = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      const data = await createQuotationRevisionApi(getQuotationId(quotation), { reason: revisionReason });
      setQuotation(data?.quotation || quotation);
      setShowRevision(false);
      setRevisionReason('');
      setNotice('A new editable quotation revision was created.');
    } catch (revisionError) {
      setNotice(revisionError.message || 'Unable to create quotation revision.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateBooking = async () => {
    setBusy(true);
    setBookingError('');
    try {
      const data = await createBookingFromQuotationApi(getQuotationId(quotation));
      const bookingRouteId = data?.booking?.bookingId || data?.booking?._id;
      if (!bookingRouteId) throw new Error('Booking was created but no booking identifier was returned.');
      navigate(`/staff/sales/bookings/${bookingRouteId}`, { state: { created: !data?.isExisting } });
    } catch (bookingCreateError) {
      setBookingError(bookingCreateError.message || 'Unable to create booking.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" aria-hidden="true" /> Loading quotation…</section>;
  if (error || !quotation) return <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center"><AlertCircle size={24} className="mx-auto text-rose-600" aria-hidden="true" /><h2 className="mt-3 font-semibold text-rose-900">Unable to load quotation</h2><p className="mt-1 text-sm text-rose-700">{error}</p><button type="button" onClick={loadQuotation} className="mt-4 min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white">Retry</button></section>;

  const publicPath = getPublicQuotationPath(quotation);
  const lead = quotation.leadId;
  const convertedBooking = quotation.bookingId;
  const bookingRouteId = convertedBooking?.bookingId || quotation.bookingCode || convertedBooking?._id || (typeof convertedBooking === 'string' ? convertedBooking : '');

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <Link to="/staff/sales/quotations" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft size={15} aria-hidden="true" /> Quotations</Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-sm font-semibold text-emerald-700">{quotation.quotationNumber}</p><QuotationStatusBadge status={quotation.status} /><span className="text-xs text-slate-400">v{quotation.version || 1}</span></div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{quotation.tripRequirements?.title || 'Quotation detail'}</h1><p className="mt-1 text-sm text-slate-500">{quotation.customerSnapshot?.name || 'Traveler not provided'} · {quotation.tripRequirements?.destination || 'Destination not provided'}</p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowPreview(true)} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><Eye size={15} aria-hidden="true" /> Preview</button>
            {canEditQuotation(quotation) && <Link to={`/staff/sales/quotations/${getQuotationId(quotation)}/edit`} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><Edit3 size={15} aria-hidden="true" /> Edit</Link>}
            {canCreateQuotationRevision(quotation) && <button type="button" onClick={() => setShowRevision(true)} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><History size={15} aria-hidden="true" /> Create revision</button>}
            {canSendQuotation(quotation) && <button type="button" onClick={handleSend} disabled={busy} className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"><Send size={15} aria-hidden="true" /> Send</button>}
            {quotation.status === 'APPROVED' && !bookingRouteId && <button type="button" onClick={() => { setBookingError(''); setShowCreateBooking(true); }} className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"><BookOpen size={15} aria-hidden="true" /> Create booking</button>}
            {bookingRouteId && <Link to={`/staff/sales/bookings/${bookingRouteId}`} className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"><BookOpen size={15} aria-hidden="true" /> Open booking</Link>}
            {quotation.publicShare?.token && <button type="button" onClick={() => setShowShare(true)} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><Share2 size={15} aria-hidden="true" /> Share</button>}
            {publicPath && <a href={publicPath} target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><ExternalLink size={15} aria-hidden="true" /> Public view</a>}
          </div>
        </div>
      </section>

      {notice && <div role="status" className="rounded-lg border border-slate-200 bg-slate-900 px-4 py-3 text-sm text-white">{notice}</div>}
      {bookingRouteId && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">Converted to booking</p><p className="mt-1 font-mono text-sm font-semibold text-emerald-950">{quotation.bookingCode || convertedBooking?.bookingId || bookingRouteId}</p></div><Link to={`/staff/sales/bookings/${bookingRouteId}`} className="flex min-h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800"><BookOpen size={15} /> Open booking</Link></div>}

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Traveler"><dl><Row label="Name" value={quotation.customerSnapshot?.name} /><Row label="Email" value={quotation.customerSnapshot?.email} /><Row label="Phone" value={quotation.customerSnapshot?.phone} /><Row label="City" value={quotation.customerSnapshot?.city} /><Row label="Notes" value={quotation.customerSnapshot?.notes} /></dl></Section>
        <Section title="Trip requirements"><dl><Row label="Destination" value={quotation.tripRequirements?.destination} /><Row label="Dates" value={`${formatQuotationDate(quotation.tripRequirements?.startDate)} – ${formatQuotationDate(quotation.tripRequirements?.endDate)}`} /><Row label="Duration" value={quotation.tripRequirements?.duration} /><Row label="Travelers" value={quotation.tripRequirements?.totalTravelers} /><Row label="Travel style" value={quotation.tripRequirements?.travelStyle} /><Row label="Requests" value={quotation.tripRequirements?.specialRequests} /></dl></Section>
        <Section title="Price breakdown"><dl><Row label="Subtotal" value={formatQuotationMoney(quotation.pricing?.subtotal)} /><Row label="Discount" value={formatQuotationMoney(quotation.pricing?.discountAmount)} /><Row label="GST" value={formatQuotationMoney(quotation.pricing?.gstAmount)} /><Row label="Final total" value={<strong>{formatQuotationMoney(quotation.pricing?.finalTotal)}</strong>} /><Row label="Deposit required" value={formatQuotationMoney(quotation.pricing?.depositRequired)} /><Row label="Balance" value={formatQuotationMoney(quotation.pricing?.balanceAmount)} /></dl></Section>
        <Section title="Record and connection"><dl><Row label="Lead" value={lead ? <Link className="font-medium text-emerald-700 hover:underline" to="/staff/sales/expert-requests">{lead.referenceId || lead.name || 'Linked Expert Request'}</Link> : 'Not linked'} /><Row label="Created by" value={quotation.createdBy?.name || quotation.assignedToSnapshot?.name} /><Row label="Updated by" value={quotation.updatedBy?.name} /><Row label="Assigned to" value={quotation.assignedTo?.name || quotation.assignedToSnapshot?.name} /><Row label="Created" value={formatQuotationDate(quotation.createdAt, true)} /><Row label="Updated" value={formatQuotationDate(quotation.updatedAt, true)} /><Row label="Valid until" value={formatQuotationDate(quotation.validUntil)} /><Row label="Public share" value={quotation.publicShare?.token ? (quotation.publicShare?.isPublic === false ? 'Disabled' : 'Enabled') : 'Not generated'} /><Row label="Public views" value={quotation.publicShare?.viewCount ?? 0} /></dl></Section>
      </div>

      <Section title={`Hotels (${quotation.hotelOptions?.length || 0})`}><div className="grid gap-3 md:grid-cols-2">{quotation.hotelOptions?.length ? quotation.hotelOptions.map((hotel, index) => <article key={hotel._id || hotel.optionId || index} className="rounded-lg border border-slate-200 p-4"><div className="flex justify-between gap-3"><h3 className="font-semibold text-slate-900">{hotel.hotelName || hotel.label || 'Hotel option'}</h3>{hotel.selected && <span className="text-xs font-semibold text-emerald-700">Selected</span>}</div><p className="mt-1 text-sm text-slate-500">{hotel.city || hotel.location || 'Location not provided'}</p><p className="mt-2 text-xs text-slate-500">{hotel.roomType || 'Room not provided'} · {hotel.rooms || 0} room(s) · {hotel.nights || 0} night(s)</p><p className="mt-2 font-semibold text-slate-900">{formatQuotationMoney(hotel.totalPrice)}</p></article>) : <p className="text-sm text-slate-500">No hotel options added.</p>}</div></Section>
      <Section title={`Transport (${quotation.transportOptions?.length || 0})`}><div className="grid gap-3 md:grid-cols-2">{quotation.transportOptions?.length ? quotation.transportOptions.map((item, index) => <article key={item._id || item.optionId || index} className="rounded-lg border border-slate-200 p-4"><div className="flex justify-between gap-3"><h3 className="font-semibold text-slate-900">{item.title || item.vehicle || item.type || 'Transport option'}</h3>{item.selected && <span className="text-xs font-semibold text-emerald-700">Selected</span>}</div><p className="mt-1 text-sm text-slate-500">{item.pickup || item.route?.from || 'Pickup not provided'} → {item.drop || item.route?.to || 'Drop not provided'}</p><p className="mt-2 font-semibold text-slate-900">{formatQuotationMoney(item.totalPrice)}</p></article>) : <p className="text-sm text-slate-500">No transport options added.</p>}</div></Section>
      <Section title={`Activities and add-ons (${(quotation.activities?.length || 0) + (quotation.addOns?.length || 0)})`}><div className="space-y-2">{[...(quotation.activities || []), ...(quotation.addOns || [])].length ? [...(quotation.activities || []), ...(quotation.addOns || [])].map((item, index) => <div key={item._id || item.activityId || item.addonId || index} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3"><div><p className="text-sm font-medium text-slate-900">{item.name || 'Unnamed item'}</p><p className="mt-1 text-xs text-slate-500">{item.description || item.location || 'No description'}</p></div><p className="shrink-0 text-sm font-semibold text-slate-900">{formatQuotationMoney(item.totalPrice)}</p></div>) : <p className="text-sm text-slate-500">No activities or add-ons added.</p>}</div></Section>
      <div className="grid gap-5 xl:grid-cols-2"><Section title="Terms and conditions"><ul className="space-y-2 text-sm text-slate-700">{quotation.termsAndConditions?.length ? quotation.termsAndConditions.map((term, index) => <li key={index} className="flex gap-2"><span>•</span><span>{term}</span></li>) : <li className="text-slate-500">No terms added.</li>}</ul></Section><Section title="Status history"><ol className="space-y-3">{quotation.statusHistory?.length ? [...quotation.statusHistory].reverse().map((item, index) => <li key={item._id || index} className="rounded-lg bg-slate-50 p-3"><div className="flex justify-between gap-3"><QuotationStatusBadge status={item.status} /><time className="text-xs text-slate-400">{formatQuotationDate(item.changedAt, true)}</time></div><p className="mt-2 text-xs text-slate-600">{item.reason || 'No reason recorded'}{item.changedByName ? ` · ${item.changedByName}` : ''}</p></li>) : <li className="text-sm text-slate-500">No status history available.</li>}</ol></Section></div>

      <QuotationPreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} quotation={quotation} onSendQuotation={handleSend} />
      <ShareQuotationModal isOpen={showShare} onClose={() => setShowShare(false)} quotation={quotation} />
      <CreateBookingModal quotation={quotation} open={showCreateBooking} busy={busy} error={bookingError} onClose={() => { if (!busy) setShowCreateBooking(false); }} onConfirm={handleCreateBooking} />

      {showRevision && <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><button type="button" onClick={() => setShowRevision(false)} className="absolute inset-0 bg-slate-950/60" aria-label="Close revision dialog" /><form onSubmit={handleRevision} className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-950">Create quotation revision</h2><p className="mt-1 text-sm text-slate-500">The current sent proposal remains in revision history.</p></div><button type="button" onClick={() => setShowRevision(false)} className="p-2 text-slate-500" aria-label="Close"><X size={18} /></button></div><label className="mt-4 block text-sm font-medium text-slate-700">Reason<textarea value={revisionReason} onChange={(event) => setRevisionReason(event.target.value)} rows={3} required className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setShowRevision(false)} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700">Cancel</button><button type="submit" disabled={busy} className="min-h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-60">Create revision</button></div></form></div>}
    </div>
  );
};

export default QuotationDetailPage;
