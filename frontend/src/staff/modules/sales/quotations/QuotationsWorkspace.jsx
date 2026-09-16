import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, FileText, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuotationPreviewModal from '../../../../components/QuotationPreviewModal.jsx';
import ShareQuotationModal from '../../../../components/ShareQuotationModal.jsx';
import { getQuotationByIdApi, getQuotationsApi, sendQuotationApi } from '../../../../services/quotationService.js';
import QuotationFilters from './components/QuotationFilters.jsx';
import QuotationMobileCard from './components/QuotationMobileCard.jsx';
import QuotationTable from './components/QuotationTable.jsx';
import { getQuotationId } from './quotationHelpers.js';

const QuotationsWorkspace = () => {
  const [quotations, setQuotations] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [previewQuotation, setPreviewQuotation] = useState(null);
  const [shareQuotation, setShareQuotation] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadQuotations = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await getQuotationsApi({
        search: debouncedSearch || undefined,
        status: status === 'all' ? undefined : status,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: 'updated',
        limit: 100
      });
      setQuotations(Array.isArray(data?.quotations) ? data.quotations : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load quotations.');
      setQuotations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFrom, dateTo, debouncedSearch, status]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const handlePreview = async (quotation) => {
    const id = getQuotationId(quotation);
    setBusyId(id);
    setNotice('');
    try {
      const data = await getQuotationByIdApi(id);
      setPreviewQuotation(data?.quotation || null);
    } catch (previewError) {
      setNotice(previewError.message || 'Unable to load quotation preview.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSend = async (quotation) => {
    const id = getQuotationId(quotation);
    setBusyId(id);
    setNotice('');
    try {
      const data = await sendQuotationApi(id);
      if (data?.quotation) {
        setQuotations((current) => current.map((item) => getQuotationId(item) === id ? data.quotation : item));
        setNotice(`${data.quotation.quotationNumber} sent successfully.`);
      }
    } catch (sendError) {
      setNotice(sendError.message || 'Unable to send quotation.');
    } finally {
      setBusyId(null);
    }
  };

  const filtersActive = Boolean(search || status !== 'all' || dateFrom || dateTo);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Sales · Commercial proposals</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Quotations</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create, send, share, and track the quotations available to your current staff account.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => loadQuotations(true)} disabled={refreshing} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" /> Refresh</button>
          <Link to="/staff/sales/quotations/new" className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"><Plus size={16} aria-hidden="true" /> New quotation</Link>
        </div>
      </section>

      <QuotationFilters search={search} status={status} dateFrom={dateFrom} dateTo={dateTo} onSearchChange={setSearch} onStatusChange={setStatus} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />

      {error ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center"><AlertCircle size={24} className="mx-auto text-rose-600" aria-hidden="true" /><h3 className="mt-3 font-semibold text-rose-900">Unable to load quotations</h3><p className="mt-1 text-sm text-rose-700">{error}</p><button type="button" onClick={() => loadQuotations()} className="mt-4 min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-600">Retry</button></section>
      ) : loading ? (
        <section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" aria-hidden="true" /> Loading quotations…</section>
      ) : quotations.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><FileText size={28} className="mx-auto text-slate-300" aria-hidden="true" /><h3 className="mt-3 font-semibold text-slate-900">{filtersActive ? 'No quotations match these filters.' : 'No quotations found.'}</h3><p className="mt-1 text-sm text-slate-500">{filtersActive ? 'Change or clear a filter to broaden the list.' : 'Create the first quotation when a traveler is ready for a proposal.'}</p></section>
      ) : (
        <><QuotationTable quotations={quotations} busyId={busyId} onPreview={handlePreview} onSend={handleSend} onShare={setShareQuotation} /><div className="grid gap-3 xl:hidden">{quotations.map((quotation) => <QuotationMobileCard key={getQuotationId(quotation)} quotation={quotation} busyId={busyId} onPreview={handlePreview} onSend={handleSend} onShare={setShareQuotation} />)}</div></>
      )}

      {notice && <div role="status" className="fixed bottom-4 right-4 z-[80] max-w-sm rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"><div className="flex gap-4"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div></div>}
      <QuotationPreviewModal isOpen={Boolean(previewQuotation)} onClose={() => setPreviewQuotation(null)} quotation={previewQuotation} onSendQuotation={handleSend} />
      <ShareQuotationModal isOpen={Boolean(shareQuotation)} onClose={() => setShareQuotation(null)} quotation={shareQuotation} />
    </div>
  );
};

export default QuotationsWorkspace;
