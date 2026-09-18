import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getLeadByIdApi } from '../../../../services/api.js';
import { getQuotationByIdApi } from '../../../../services/quotationService.js';
import { getQuotationId } from './quotationHelpers.js';
import QuotationV2Editor from './QuotationV2Editor.jsx';

const LegacyQuotationBuilderWizard = lazy(() => import('../../../../components/QuotationBuilderWizard.jsx'));

const QuotationBuilderPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loadingLead, setLoadingLead] = useState(Boolean(!id && leadId));
  const [leadError, setLeadError] = useState('');
  const [existingQuotation, setExistingQuotation] = useState(null);
  const [loadingQuotation, setLoadingQuotation] = useState(Boolean(id));

  useEffect(() => {
    if (id || !leadId) return;
    let cancelled = false;
    setLoadingLead(true);
    setLeadError('');
    getLeadByIdApi(leadId)
      .then((data) => { if (!cancelled) setLead(data); })
      .catch((error) => { if (!cancelled) setLeadError(error.message || 'Unable to load the linked Expert Request.'); })
      .finally(() => { if (!cancelled) setLoadingLead(false); });
    return () => { cancelled = true; };
  }, [id, leadId]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoadingQuotation(true);
    setLeadError('');
    getQuotationByIdApi(id)
      .then((data) => { if (!cancelled) setExistingQuotation(data?.quotation || null); })
      .catch((error) => { if (!cancelled) setLeadError(error.message || 'Unable to load quotation.'); })
      .finally(() => { if (!cancelled) setLoadingQuotation(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleClose = () => {
    navigate(id ? `/staff/sales/quotations/${id}` : '/staff/sales/quotations');
  };

  const handleSaved = (quotation) => {
    const savedId = getQuotationId(quotation);
    if (!id && savedId) {
      navigate(`/staff/sales/quotations/${savedId}/edit`, { replace: true });
    }
  };

  if (loadingLead || loadingQuotation) {
    return <section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" aria-hidden="true" /> Loading Expert Request…</section>;
  }

  if (leadError) {
    return <section className="rounded-xl border border-rose-200 bg-rose-50 p-6"><AlertCircle size={22} className="text-rose-600" aria-hidden="true" /><h2 className="mt-3 font-semibold text-rose-900">Unable to start quotation</h2><p className="mt-1 text-sm text-rose-700">{leadError}</p><Link to="/staff/sales/expert-requests" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white"><ArrowLeft size={15} aria-hidden="true" /> Return to Expert Requests</Link></section>;
  }

  if (id && existingQuotation?.schemaVersion !== 2) return (
    <Suspense fallback={<section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" />Loading legacy editor…</section>}>
    <LegacyQuotationBuilderWizard
      quotationId={id || null}
      initialLead={lead}
      embedded
      allowConversions={false}
      onClose={handleClose}
      onQuotationSaved={handleSaved}
    />
    </Suspense>
  );

  return (
    <QuotationV2Editor
      quotationId={id || null}
      initialQuotation={existingQuotation}
      initialLead={lead}
      onClose={handleClose}
      onQuotationSaved={handleSaved}
    />
  );
};

export default QuotationBuilderPage;
