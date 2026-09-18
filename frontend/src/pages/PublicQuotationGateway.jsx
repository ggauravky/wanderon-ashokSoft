import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Loader2, Mail, MessageSquareText, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useParams } from 'react-router-dom';
import QuotationTemplateRenderer from '../quotation-v2/QuotationTemplateRenderer.jsx';
import { quotationPdfFileName } from '../quotation-v2/quotationV2.js';
import { getQuotationTemplate } from '../quotation-v2/templateRegistry.js';
import {
  decidePublicQuotationV2Api,
  getPublicQuotationV2Api,
  requestQuotationVerificationV2Api,
  trackPublicQuotationEventV2Api,
  verifyQuotationRecipientV2Api
} from '../services/quotationService.js';

const LegacyPublicQuotationView = lazy(() => import('./PublicQuotationView.jsx'));

const StatusPage = ({ title, message, retry }) => <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4"><section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><AlertCircle size={28} className="mx-auto text-amber-600" /><h1 className="mt-4 text-xl font-semibold text-slate-950">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>{retry && <button type="button" onClick={retry} className="mt-5 min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Try again</button>}</section></main>;

export default function PublicQuotationGateway() {
  const { token } = useParams();
  const documentRef = useRef(null);
  const [quotation, setQuotation] = useState(null);
  const [legacy, setLegacy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [pdfProgress, setPdfProgress] = useState('');
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(''); setLegacy(false);
    try {
      const data = await getPublicQuotationV2Api(token);
      setQuotation(data.quotation);
      setEmail('');
    } catch (loadError) {
      if (loadError.status === 404) setLegacy(true);
      else setError(loadError.message || 'Unable to open quotation.');
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submitDecision = async (chosen, verifiedToken = verificationToken) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const data = await decidePublicQuotationV2Api(token, { decision: chosen, notes, termsAccepted, verificationToken: verifiedToken || undefined });
      setQuotation(data.quotation);
      setDecision(''); setVerificationOpen(false);
      setNotice(chosen === 'APPROVED' ? 'Your approval has been securely recorded.' : 'Your response has been shared with the WanderLuxe team.');
    } catch (decisionError) {
      if (decisionError.status === 401) { setDecision(chosen); setVerificationOpen(true); }
      else setError(decisionError.message || 'Unable to record your response.');
    } finally { setBusy(false); }
  };

  const sendCode = async () => {
    setBusy(true); setError('');
    try { await requestQuotationVerificationV2Api(token, email); setCodeSent(true); setNotice('If this email matches the recipient, a verification code has been sent.'); }
    catch (sendError) { setError(sendError.message); }
    finally { setBusy(false); }
  };

  const verifyCode = async () => {
    setBusy(true); setError('');
    try {
      const data = await verifyQuotationRecipientV2Api(token, { email, code });
      setVerificationToken(data.verificationToken);
      await submitDecision(decision, data.verificationToken);
    } catch (verifyError) { setError(verifyError.message); setBusy(false); }
  };

  const downloadPdf = async () => {
    if (!documentRef.current || !quotation?.share?.allowPdfDownload) return;
    setBusy(true); setError('');
    try {
      const { exportPagedElementToPdf } = await import('../utils/pdfGenerator.js');
      setPdfProgress(`Preparing ${getQuotationTemplate(quotation.templateKey).name}...`);
      await exportPagedElementToPdf(documentRef.current, {
        filename: quotationPdfFileName(quotation, quotation.templateKey),
        scale: 2,
        onProgress: (state) => setPdfProgress(state.message)
      });
      await trackPublicQuotationEventV2Api(token, { type: 'PDF_DOWNLOADED' });
    } catch (downloadError) { console.error('Public quotation PDF generation failed:', downloadError); setError('Unable to generate this quotation PDF. Please try again.'); }
    finally { setBusy(false); setPdfProgress(''); }
  };

  if (loading) return <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 text-sm text-slate-500"><Loader2 size={19} className="mr-2 animate-spin" />Opening your private journey proposal…</main>;
  if (legacy) return <Suspense fallback={<main className="flex min-h-[70vh] items-center justify-center"><Loader2 className="animate-spin" /></main>}><LegacyPublicQuotationView /></Suspense>;
  if (error && !quotation) return <StatusPage title="Quotation unavailable" message={error} retry={error.includes('temporarily') ? load : null} />;
  if (!quotation) return <StatusPage title="Quotation unavailable" message="This private proposal could not be found." />;

  const completed = Boolean(quotation.approval || ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(quotation.status));
  const actionDisabled = quotation.share?.isExpired || quotation.share?.isRevoked || quotation.superseded || completed;

  return <main className="min-h-screen bg-slate-100 py-4 md:py-8">
    <div className="mx-auto mb-4 flex max-w-[1120px] flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Private quotation · v{quotation.version}</p><p className="mt-1 text-sm text-slate-600">{quotation.quotationNumber}</p></div>
      {quotation.share?.allowPdfDownload && <button type="button" onClick={downloadPdf} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"><Download size={16} />Download PDF</button>}
    </div>
    {quotation.superseded && <div className="mx-auto mb-4 max-w-[1120px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">A newer revision has been shared. This version is preserved for your records but can no longer be approved.</div>}
    {quotation.share?.isExpired && <div className="mx-auto mb-4 max-w-[1120px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">This proposal link has expired. You may review it, but decisions are disabled. Contact your advisor for a renewed link.</div>}
    {notice && <div className="mx-auto mb-4 flex max-w-[1120px] gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17} />{notice}</div>}
    {error && <div className="mx-auto mb-4 flex max-w-[1120px] gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><AlertCircle size={17} />{error}</div>}

    <div className="px-2"><QuotationTemplateRenderer ref={documentRef} quotation={quotation} templateKey={quotation.templateKey} showDownloadHint onAttachmentDownload={(item) => trackPublicQuotationEventV2Api(token, { type: 'ATTACHMENT_DOWNLOADED', attachmentId: item.id }).catch(() => {})} /></div>

    <section className="mx-auto mt-6 max-w-[1120px] px-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-emerald-600" size={22} /><div><h2 className="text-lg font-semibold text-slate-950">Your response</h2><p className="mt-1 text-sm leading-6 text-slate-600">Approval is bound to this exact immutable revision. Sign in as the recipient or verify the recipient email before submitting.</p></div></div>
        {completed ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>{quotation.status.replaceAll('_', ' ')}</strong>{quotation.approval?.approvedAt && ` · ${new Date(quotation.approval.approvedAt).toLocaleString('en-IN')}`}</div> : <><label className="mt-5 block text-sm font-medium text-slate-700">Notes for your advisor<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Optional for approval; recommended when requesting changes." className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label><label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" /><span>I have reviewed and accept the quotation terms for this revision.</span></label><div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={busy || actionDisabled || !termsAccepted} onClick={() => submitDecision('APPROVED')} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-40"><ThumbsUp size={16} />Approve quotation</button><button type="button" disabled={busy || actionDisabled || !notes.trim()} onClick={() => submitDecision('CHANGES_REQUESTED')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"><MessageSquareText size={16} />Request changes</button><button type="button" disabled={busy || actionDisabled} onClick={() => submitDecision('REJECTED')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-700 disabled:opacity-40"><ThumbsDown size={16} />Decline</button></div></>}
      </div>
    </section>

    {verificationOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"><section role="dialog" aria-modal="true" aria-labelledby="verify-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><Mail size={22} className="text-emerald-600" /><h2 id="verify-title" className="mt-3 text-lg font-semibold text-slate-950">Verify recipient email</h2><p className="mt-1 text-sm leading-6 text-slate-600">We’ll send a short-lived code to the email recorded on this quotation{quotation.share?.recipientEmailHint ? ` (${quotation.share.recipientEmailHint})` : ''}.</p><label className="mt-5 block text-sm font-medium text-slate-700">Recipient email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-emerald-500" /></label>{codeSent && <label className="mt-4 block text-sm font-medium text-slate-700">6-digit code<input inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3 tracking-[0.4em] outline-none focus:border-emerald-500" /></label>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setVerificationOpen(false)} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700">Cancel</button>{codeSent ? <button type="button" disabled={busy || code.length !== 6} onClick={verifyCode} className="min-h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-40">Verify and submit</button> : <button type="button" disabled={busy || !email} onClick={sendCode} className="min-h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-40">Send code</button>}</div></section></div>}
    {pdfProgress && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70"><div className="rounded-2xl bg-white px-8 py-7 text-center shadow-2xl"><Loader2 size={25} className="mx-auto animate-spin text-emerald-600" /><p className="mt-3 text-sm font-semibold text-slate-900">{pdfProgress}</p></div></div>}
  </main>;
}
