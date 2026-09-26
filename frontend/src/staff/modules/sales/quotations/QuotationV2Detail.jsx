import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Copy, Download, Edit3, Eye, FileClock, History, Link2, Loader2, Plus, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext.jsx';
import QuotationTemplateRenderer from '../../../../quotation-v2/QuotationTemplateRenderer.jsx';
import TemplatePickerModal, { TemplateChoiceGrid } from '../../../../quotation-v2/components/TemplatePickerModal.jsx';
import QuotationPreviewModal from '../../../../quotation-v2/components/QuotationPreviewModal.jsx';
import { getQuotationTemplate } from '../../../../quotation-v2/templateRegistry.js';
import { formatQuotationCurrency, formatQuotationV2Date, quotationPdfFileName } from '../../../../quotation-v2/quotationV2.js';
import {
  adminApproveQuotationV2Api, createBookingFromQuotationV2Api, createQuotationRevisionV2Api, downloadQuotationPdfServerApi,
  createQuotationShareV2Api, duplicateQuotationV2Api, getQuotationEventsV2Api,
  getQuotationRevisionsV2Api, getQuotationSharesV2Api, revokeQuotationShareV2Api
} from '../../../../services/quotationService.js';
import QuotationStatusBadge from './components/QuotationStatusBadge.jsx';
import { getQuotationId } from './quotationHelpers.js';

const tabs = [['overview', 'Overview'], ['proposal', 'Proposal'], ['versions', 'Versions'], ['shares', 'Share links'], ['history', 'History']];
const card = 'rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const formatDateTime = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not available';
const Row = ({ label, value }) => <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0"><dt className="text-sm text-slate-500">{label}</dt><dd className="text-right text-sm font-medium text-slate-900">{value ?? 'Not available'}</dd></div>;
const waitForPages = async (ref) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (ref.current?.querySelectorAll('[data-pdf-page="true"]').length) return ref.current;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
};

export default function QuotationV2Detail({ quotation, reload }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const id = getQuotationId(quotation);
  const isAdmin = ['admin', 'super_admin'].includes(String(user?.role || '').toLowerCase());
  const [activeTab, setActiveTab] = useState('overview');
  const [revisions, setRevisions] = useState([]);
  const [shares, setShares] = useState([]);
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(quotation.presentationSettings?.template || 'journey');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(quotation.presentationSettings?.template || 'journey');
  const [autoDownload, setAutoDownload] = useState(false);
  const [createdShare, setCreatedShare] = useState(null);
  const [shareForm, setShareForm] = useState({ recipientEmail: quotation.customerSnapshot?.email || '', expiresAt: quotation.validUntil?.slice?.(0, 10) || '', templateKey: quotation.presentationSettings?.template || 'journey', allowPdfDownload: true, allowAttachments: true, requireEmailVerification: true, approvalEnabled: true });
  const previewRef = useRef(null);
  const proposalRef = useRef(null);

  const loadRelated = useCallback(async () => {
    try {
      const [revisionData, shareData, eventData] = await Promise.all([getQuotationRevisionsV2Api(id), getQuotationSharesV2Api(id), getQuotationEventsV2Api(id)]);
      setRevisions(revisionData.revisions || []); setShares(shareData.shares || []); setEvents(eventData.events || []);
    } catch (loadError) { setError(loadError.message); }
  }, [id]);
  useEffect(() => { loadRelated(); }, [loadRelated]);

  const action = async (work, success) => {
    setBusy(true); setError(''); setNotice('');
    try { const result = await work(); setNotice(success); await Promise.all([reload(), loadRelated()]); return result; }
    catch (actionError) { setError(actionError.message); return null; }
    finally { setBusy(false); }
  };

  const exportPdf = useCallback(async (documentModel, templateKey, element) => {
    if (!element) return;
    setBusy(true); setError(''); setProgress(`Preparing ${getQuotationTemplate(templateKey).name}...`);
    try {
      const revisionId = documentModel?.pdfRevisionId || (documentModel === quotation ? quotation.currentRevisionId : null);
      if (revisionId) {
        try {
          await downloadQuotationPdfServerApi(id, { templateKey, revisionId, filename: quotationPdfFileName(documentModel, templateKey) });
          setNotice(`${getQuotationTemplate(templateKey).name} PDF downloaded.`);
          return;
        } catch (serverError) {
          if (![404, 501, 502, 503, 504].includes(serverError.status) && serverError.code !== 'NETWORK_ERROR') throw serverError;
          setProgress('Preparing browser PDF...');
        }
      }
      const { exportPagedElementToPdf } = await import('../../../../utils/pdfGenerator.js');
      await exportPagedElementToPdf(element, {
        filename: quotationPdfFileName(documentModel, templateKey),
        scale: 2,
        onProgress: (state) => setProgress(state.message)
      });
      setNotice(`${getQuotationTemplate(templateKey).name} PDF downloaded.`);
    } catch (downloadError) {
      console.error('Quotation PDF generation failed:', downloadError);
      setError(downloadError.message || 'Unable to generate this quotation PDF. Please try again.');
    } finally { setBusy(false); setProgress(''); }
  }, [id, quotation]);

  useEffect(() => {
    if (!previewOpen || !autoDownload) return;
    let cancelled = false;
    (async () => {
      const element = await waitForPages(previewRef);
      if (!cancelled && element) await exportPdf(previewQuotation || quotation, previewTemplate, element);
      if (!cancelled) setAutoDownload(false);
    })();
    return () => { cancelled = true; };
  }, [autoDownload, exportPdf, previewOpen, previewQuotation, previewTemplate, quotation]);

  const openPicker = (mode) => {
    setPickerMode(mode);
    setSelectedTemplate(quotation.presentationSettings?.template || 'journey');
    setPreviewQuotation(quotation);
  };
  const openPreview = (documentModel, templateKey) => {
    setPreviewQuotation(documentModel);
    setPreviewTemplate(templateKey);
    setPickerMode(null);
    setPreviewOpen(true);
  };
  const downloadFromPicker = (templateKey) => {
    setPreviewTemplate(templateKey); setPreviewQuotation(previewQuotation || quotation); setPickerMode(null); setAutoDownload(true); setPreviewOpen(true);
  };

  const createRevision = async () => {
    const reason = window.prompt('Reason for the new revision:');
    if (!reason?.trim()) return;
    const data = await action(() => createQuotationRevisionV2Api(id, { reason }), 'New editable revision created.');
    if (data?.quotation) navigate(`/staff/sales/quotations/${id}/edit`);
  };
  const duplicate = async () => { const data = await action(() => duplicateQuotationV2Api(id), 'Quotation duplicated.'); if (data?.quotation?._id) navigate(`/staff/sales/quotations/${data.quotation._id}/edit`); };
  const adminApprove = async () => { const reason = window.prompt('Admin override reason (recorded permanently):'); if (reason?.trim()) await action(() => adminApproveQuotationV2Api(id, reason), 'Admin approval override recorded.'); };
  const createBooking = async () => {
    if (!window.confirm('Create a booking from the immutable approved revision?')) return;
    const data = await action(() => createBookingFromQuotationV2Api(id), 'Booking created from the approved revision.');
    const bookingId = data?.booking?.bookingId || data?.booking?._id;
    if (bookingId) navigate(`/staff/sales/bookings/${bookingId}`);
  };
  const createShare = async (event) => {
    event.preventDefault();
    const data = await action(() => createQuotationShareV2Api(id, shareForm), 'Secure share link created. Copy it now; the raw token is not stored.');
    if (data?.publicUrl) setCreatedShare(data);
  };
  const revoke = async (shareId) => { if (window.confirm('Revoke this share link? The customer will immediately lose access.')) await action(() => revokeQuotationShareV2Api(id, shareId, 'Revoked from quotation workspace'), 'Share link revoked.'); };

  const editable = ['DRAFT', 'CONTENT_READY', 'AWAITING_PRICING', 'CHANGES_REQUESTED'].includes(quotation.status) && !quotation.manualPricing?.finalizedAt;
  const canShare = quotation.status === 'READY_TO_SHARE' || quotation.status === 'SHARED';
  const canRevise = Boolean(quotation.currentRevisionId) && quotation.status !== 'CONVERTED';
  const bookingId = quotation.bookingId?.bookingId || quotation.bookingCode || quotation.bookingId?._id;

  return <div className="space-y-5">
    <header className={card}><Link to="/staff/sales/quotations" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950"><ArrowLeft size={15} />Quotations</Link><div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-emerald-700">{quotation.quotationNumber}</span><QuotationStatusBadge status={quotation.status} /><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">v{quotation.version}</span></div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{quotation.tripRequirements?.title || 'Quotation detail'}</h1><p className="mt-1 text-sm text-slate-500">{quotation.customerSnapshot?.name} · {quotation.tripRequirements?.destination || 'Destination not set'}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => openPicker('preview')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"><Eye size={15} />Preview</button><button type="button" onClick={() => openPicker('download')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"><Download size={15} />Download PDF</button>{editable && <Link to={`/staff/sales/quotations/${id}/edit`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"><Edit3 size={15} />Edit</Link>}{canRevise && <button type="button" disabled={busy} onClick={createRevision} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"><Plus size={15} />New revision</button>}<button type="button" disabled={busy} onClick={duplicate} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"><Copy size={15} />Duplicate</button>{canShare && <button type="button" onClick={() => { setShareOpen(true); setCreatedShare(null); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white"><Link2 size={15} />Share</button>}{isAdmin && quotation.status !== 'APPROVED' && quotation.currentRevisionId && <button type="button" disabled={busy} onClick={adminApprove} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-800"><ShieldCheck size={15} />Admin approve</button>}{quotation.approvedRevisionId && !bookingId && <button type="button" disabled={busy} onClick={createBooking} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"><BookOpen size={15} />Create booking</button>}{bookingId && <Link to={`/staff/sales/bookings/${bookingId}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"><BookOpen size={15} />Open booking</Link>}</div></div></header>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}{notice && <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={17} />{notice}</div>}
    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">{tabs.map(([key, label]) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold ${activeTab === key ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</button>)}</nav>

    {activeTab === 'overview' && <div className="grid gap-5 xl:grid-cols-3"><section className={`${card} xl:col-span-2`}><h2 className="font-semibold text-slate-950">Journey and traveler</h2><dl className="mt-3 grid gap-x-8 md:grid-cols-2"><Row label="Traveler" value={quotation.customerSnapshot?.name} /><Row label="Email" value={quotation.customerSnapshot?.email} /><Row label="Phone" value={quotation.customerSnapshot?.phone} /><Row label="Destination" value={quotation.tripRequirements?.destination} /><Row label="Dates" value={`${formatQuotationV2Date(quotation.tripRequirements?.startDate)} - ${formatQuotationV2Date(quotation.tripRequirements?.endDate)}`} /><Row label="Travelers" value={quotation.tripRequirements?.totalTravelers} /><Row label="Itinerary" value={`${quotation.itinerary?.length || 0} day(s)`} /><Row label="Hotels / transport" value={`${quotation.hotelOptions?.length || 0} / ${quotation.transportOptions?.length || 0}`} /></dl></section><section className={card}><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Final customer price</p><p className="mt-3 text-3xl font-semibold text-slate-950">{quotation.manualPricing?.finalCustomerPrice ? formatQuotationCurrency(quotation.manualPricing.finalCustomerPrice, quotation.manualPricing.currency) : 'Awaiting pricing'}</p><dl className="mt-4"><Row label="Deposit" value={formatQuotationCurrency(quotation.manualPricing?.depositAmount || 0)} /><Row label="Balance" value={formatQuotationCurrency(quotation.manualPricing?.balanceAmount || 0)} /><Row label="Finalized by" value={quotation.manualPricing?.finalizedByName || 'Not available'} /></dl></section></div>}
    {activeTab === 'proposal' && <section className="rounded-xl border border-slate-200 bg-slate-200 p-2 md:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3"><div><p className="text-sm font-semibold text-slate-900">Preferred template: {getQuotationTemplate(quotation.presentationSettings?.template).name}</p><p className="text-xs text-slate-500">Previewing does not change the saved preference.</p></div><button type="button" onClick={() => openPicker('preview')} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">Change Preview Style</button></div><QuotationTemplateRenderer ref={proposalRef} quotation={quotation} templateKey={quotation.presentationSettings?.template} isDraft={!quotation.manualPricing?.finalizedAt} /></section>}
    {activeTab === 'versions' && <section className={card}><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-950">Immutable revision history</h2><p className="mt-1 text-sm text-slate-500">Every preview and download below uses that revision's frozen snapshot.</p></div><FileClock size={20} className="text-slate-400" /></div><div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-3">Version</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Final price</th><th className="px-3 py-3">Finalized</th><th className="px-3 py-3">By</th><th className="px-3 py-3">Proposal</th></tr></thead><tbody>{revisions.map((item) => <tr key={item._id} className="border-b border-slate-100"><td className="px-3 py-4 font-semibold">v{item.version}</td><td className="px-3 py-4"><QuotationStatusBadge status={item.status} /></td><td className="px-3 py-4">{formatQuotationCurrency(item.finalCustomerPrice, item.currency)}</td><td className="px-3 py-4 text-slate-500">{formatDateTime(item.finalizedAt)}</td><td className="px-3 py-4 text-slate-500">{item.finalizedByName}</td><td className="px-3 py-4"><button type="button" onClick={() => openPreview({ ...item.snapshot, pdfRevisionId: item._id, version: item.version, status: item.status, templateKey: item.templateKey, superseded: item.status === 'SUPERSEDED' }, item.templateKey)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700"><Eye size={14} />Open</button></td></tr>)}</tbody></table>{!revisions.length && <p className="py-10 text-center text-sm text-slate-500">No finalized revisions.</p>}</div></section>}
    {activeTab === 'shares' && <section className={card}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-950">Secure share links</h2><p className="mt-1 text-sm text-slate-500">Each share preserves its own immutable presentation style.</p></div>{canShare && <button type="button" onClick={() => { setShareOpen(true); setCreatedShare(null); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white"><Plus size={15} />New share</button>}</div><div className="mt-5 space-y-3">{shares.map((share) => <article key={share._id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-900">v{share.version} · {getQuotationTemplate(share.templateKey).name}</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${share.isActive && !share.revokedAt ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{share.isActive && !share.revokedAt ? 'Active' : 'Revoked'}</span></div><p className="mt-1 text-sm text-slate-500">{share.recipientEmail} · expires {formatDateTime(share.expiresAt)}</p><p className="mt-2 text-xs text-slate-400">{share.viewCount} views · {share.pdfDownloadCount} PDF · {share.attachmentDownloadCount} document downloads</p></div>{share.isActive && !share.revokedAt && <button type="button" onClick={() => revoke(share._id)} className="inline-flex min-h-9 items-center gap-2 self-start rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700"><Trash2 size={14} />Revoke</button>}</article>)}{!shares.length && <p className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">No share links created.</p>}</div></section>}
    {activeTab === 'history' && <section className={card}><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-950">Activity history</h2><p className="mt-1 text-sm text-slate-500">Persisted staff and customer events.</p></div><button type="button" onClick={loadRelated} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700"><RefreshCw size={14} />Refresh</button></div><ol className="mt-5 space-y-3">{events.map((item) => <li key={item._id} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4"><History size={14} className="mt-1 shrink-0 text-emerald-600" /><div><p className="text-sm font-semibold text-slate-900">{item.type.replaceAll('_', ' ')}</p><p className="mt-1 text-xs text-slate-500">{item.actorName || item.actorType} · {formatDateTime(item.createdAt)}</p>{item.details?.reason && <p className="mt-2 text-sm text-slate-600">{item.details.reason}</p>}</div></li>)}</ol></section>}

    {shareOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"><form onSubmit={createShare} className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold text-slate-950">Create secure share link</h2><p className="mt-1 text-sm text-slate-500">The selected template belongs to this share only.</p></div><button type="button" aria-label="Close share form" onClick={() => setShareOpen(false)} className="p-2 text-slate-500"><X size={18} /></button></div>{createdShare ? <div className="mt-5"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Copy this link now</p><p className="mt-2 break-all text-sm text-emerald-950">{createdShare.publicUrl}</p></div><button type="button" onClick={() => navigator.clipboard.writeText(createdShare.publicUrl)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"><Copy size={15} />Copy link</button></div> : <div className="mt-5 space-y-4"><div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Recipient email<input type="email" required value={shareForm.recipientEmail} onChange={(event) => setShareForm({ ...shareForm, recipientEmail: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3" /></label><label className="block text-sm font-medium text-slate-700">Expires<input type="date" required value={shareForm.expiresAt} onChange={(event) => setShareForm({ ...shareForm, expiresAt: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3" /></label></div><TemplateChoiceGrid compact quotation={quotation} selectedKey={shareForm.templateKey} onSelect={(templateKey) => setShareForm({ ...shareForm, templateKey })} />{[['allowPdfDownload', 'Allow PDF download'], ['allowAttachments', 'Allow visible attachments'], ['requireEmailVerification', 'Require recipient verification for decisions'], ['approvalEnabled', 'Enable customer decision']].map(([field, label]) => <label key={field} className="flex items-center gap-3 text-sm text-slate-700"><input type="checkbox" checked={shareForm[field]} onChange={(event) => setShareForm({ ...shareForm, [field]: event.target.checked })} className="h-4 w-4 accent-emerald-600" />{label}</label>)}<button type="submit" disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 size={15} className="animate-spin" />}Create private link</button></div>}</form></div>}
    <TemplatePickerModal open={Boolean(pickerMode)} mode={pickerMode || 'download'} quotation={previewQuotation || quotation} selectedKey={selectedTemplate} onSelect={setSelectedTemplate} onClose={() => setPickerMode(null)} onPreview={(key) => openPreview(previewQuotation || quotation, key)} onDownload={downloadFromPicker} busy={busy} />
    <QuotationPreviewModal open={previewOpen} quotation={previewQuotation || quotation} initialTemplateKey={previewTemplate} documentRef={previewRef} busy={busy} onClose={() => { setPreviewOpen(false); setPreviewQuotation(null); setAutoDownload(false); }} onBack={() => { setPreviewOpen(false); setPickerMode('preview'); }} onDownload={exportPdf} />
    {progress && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70"><div className="rounded-2xl bg-white px-8 py-7 text-center shadow-2xl"><Loader2 size={25} className="mx-auto animate-spin text-emerald-600" /><p className="mt-3 text-sm font-semibold text-slate-900">{progress}</p></div></div>}
  </div>;
}
