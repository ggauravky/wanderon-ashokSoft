import React, { useEffect, useRef } from 'react';
import '../quotationPdf.css';

export default function QuotationPdfPage({ children, model, templateKey, pageNumber, pageCount, title = '', cover = false, className = '' }) {
  const pageRef = useRef(null);
  useEffect(() => {
    if (!import.meta.env.DEV || !pageRef.current) return;
    const page = pageRef.current;
    const content = page.querySelector('.pdf-page-content');
    if (page.scrollHeight > page.clientHeight + 3 || content?.scrollHeight > content?.clientHeight + 3) {
      console.warn(`Quotation PDF page overflow: ${templateKey} / ${title || pageNumber}`, { scrollHeight: content?.scrollHeight || page.scrollHeight, clientHeight: content?.clientHeight || page.clientHeight });
    }
  }, [pageNumber, templateKey, title]);

  const statusLabel = model.meta.isSuperseded
    ? 'Superseded Version'
    : model.meta.isApproved
      ? 'Approved'
      : model.meta.isDraft
        ? 'Draft Proposal'
        : 'Quotation Proposal';

  return <section ref={pageRef} data-pdf-page="true" data-template={templateKey} data-page-number={pageNumber} className={`quotation-pdf-page quotation-pdf-page--${templateKey} ${cover ? 'quotation-pdf-page--cover' : ''} ${className}`}>
    {!cover && <header className="pdf-running-header"><span>WANDERLUXE</span><span>{title}</span><span>{model.meta.quotationNumber} · v{model.meta.version}</span></header>}
    {model.meta.isDraft && <div className="pdf-watermark" aria-hidden="true">DRAFT</div>}
    <div className="pdf-page-content">{children}</div>
    {!cover && <footer className="pdf-running-footer"><span>{statusLabel}</span><span>Valid until {model.meta.validUntil ? new Date(model.meta.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'to be confirmed'}</span><span>Page {String(pageNumber).padStart(2, '0')} of {String(pageCount).padStart(2, '0')}</span></footer>}
  </section>;
}
