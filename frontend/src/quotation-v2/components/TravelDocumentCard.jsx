import React, { useEffect, useState } from 'react';
import { CarFront, FileText, Plane, TrainFront, BusFront, Hotel } from 'lucide-react';
import PdfImage from './PdfImage.jsx';
import { formatQuotationV2Date } from '../quotationV2.js';
import { attachmentAspectClass, resolveAttachmentMediaType } from '../attachmentMedia.js';

const iconFor = (document) => {
  if (document.relation?.kind === 'hotel') return Hotel;
  const type = `${document.documentType} ${document.relation?.name || ''}`.toLowerCase();
  if (type.includes('flight')) return Plane;
  if (type.includes('train')) return TrainFront;
  if (type.includes('bus')) return BusFront;
  if (type.includes('cab') || type.includes('transport')) return CarFront;
  return FileText;
};

export default function TravelDocumentCard({ document: item, displayMode = 'preview', compact = false }) {
  const [preview, setPreview] = useState('');
  const [previewStatus, setPreviewStatus] = useState('loading');
  const [qr, setQr] = useState('');
  const [qrStatus, setQrStatus] = useState('loading');
  const [aspectClass, setAspectClass] = useState('is-landscape');
  const mediaType = resolveAttachmentMediaType(item);
  const isImage = mediaType === 'image';
  const isPdf = mediaType === 'pdf';
  const showPreview = displayMode === 'preview';

  useEffect(() => {
    let cancelled = false;
    let fallbackReason = '';
    setPreview('');
    setQr('');
    setPreviewStatus(showPreview ? 'loading' : 'ready');
    setQrStatus('loading');
    setAspectClass('is-landscape');

    const relayUrl = item.id && item.quotationId
      ? `/api/quotations/${item.quotationId}/v2/documents/${item.id}/preview`
      : null;

    if (!showPreview) {
      setPreview('');
    } else if (isImage) {
      setPreview(item.secureUrl);
      setPreviewStatus('ready');
    } else if (isPdf) {
      import('../utils/pdfDocumentPreview.js')
        .then(({ renderPdfFirstPage }) => renderPdfFirstPage(item.secureUrl, { relayUrl }))
        .then((url) => {
          if (!cancelled) {
            setPreview(url);
            setPreviewStatus('ready');
          }
        })
        .catch((err) => {
          fallbackReason = err.message || 'PDF render failed';
          if (!cancelled) setPreviewStatus('failed');
          if (import.meta.env.DEV) {
            console.debug('[QuotationPDF:DocumentDiagnostic]', {
              id: item.id,
              category: item.category,
              visibility: item.visibility,
              pdfDisplayMode: displayMode,
              host: (() => { try { return new URL(item.secureUrl).hostname; } catch { return 'invalid'; } })(),
              mediaType,
              previewReady: false,
              previewFallbackReason: fallbackReason
            });
          }
        });
    } else if (showPreview) {
      setPreviewStatus('failed');
    }

    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(item.secureUrl, { width: 96, margin: 1 }))
      .then((url) => { if (!cancelled) { setQr(url); setQrStatus('ready'); } })
      .catch(() => { if (!cancelled) setQrStatus('failed'); });

    return () => { cancelled = true; };
  }, [displayMode, isImage, isPdf, item.category, item.id, item.quotationId, item.secureUrl, item.visibility, mediaType, showPreview]);

  const icon = iconFor(item);
  const related = item.relation;
  const status = previewStatus === 'loading' || qrStatus === 'loading' ? 'loading' : previewStatus;

  return (
    <article
      className={`pdf-document-card ${compact ? 'is-compact' : ''} ${showPreview ? aspectClass : 'is-link-only'}`}
      data-pdf-document={status}
      data-pdf-display={displayMode}
    >
      <div className="pdf-document-heading">
        {React.createElement(icon, { size: 20, 'aria-hidden': true })}
        <div>
          <p className="pdf-kicker">{item.documentType}</p>
          <h3>{item.title}</h3>
          <p>{related?.name || 'General travel document'}{related?.city ? ` · ${related.city}` : ''}{related?.route ? ` · ${related.route}` : ''}</p>
        </div>
      </div>
      <div className="pdf-document-facts">
        {item.passengerName && <div><span>Passenger</span><strong>{item.passengerName}</strong></div>}
        {item.bookingReference && <div><span>Booking reference</span><strong>{item.bookingReference}</strong></div>}
        {related?.checkIn && <div><span>Check-in</span><strong>{formatQuotationV2Date(related.checkIn)}</strong></div>}
        {related?.checkOut && <div><span>Check-out</span><strong>{formatQuotationV2Date(related.checkOut)}</strong></div>}
        {related?.schedule?.departureDate && <div><span>Departure</span><strong>{formatQuotationV2Date(related.schedule.departureDate)} {related.schedule.departureTime}</strong></div>}
      </div>
      {showPreview && (
        <div className="pdf-document-preview">
          {preview ? (
            <PdfImage
              src={preview}
              alt={`Preview of ${item.title}`}
              fit="contain"
              fallbackLabel="Document preview unavailable"
              onReady={({ width, height }) => setAspectClass(attachmentAspectClass(width, height))}
            />
          ) : (
            <div className="pdf-document-placeholder">
              <FileText size={30} aria-hidden="true" />
              <strong>{isPdf ? 'PDF document' : 'Travel document'}</strong>
              <span>{status === 'loading' ? 'Preparing preview' : 'Original document available below'}</span>
            </div>
          )}
        </div>
      )}
      <div className="pdf-document-link-row">
        <span>{item.mimeType || 'Document'}</span>
        <a href={item.secureUrl} target="_blank" rel="noopener noreferrer">View original document</a>
        {qr && <PdfImage src={qr} alt="QR code for original document" className="pdf-document-qr" fit="contain" fallbackLabel="" />}
      </div>
    </article>
  );
}
