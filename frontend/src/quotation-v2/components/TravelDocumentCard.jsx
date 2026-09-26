import React, { useEffect, useState } from 'react';
import { CarFront, FileText, Plane, TrainFront, BusFront, Hotel } from 'lucide-react';
import PdfImage from './PdfImage.jsx';
import { formatQuotationV2Date } from '../quotationV2.js';

const iconFor = (document) => {
  if (document.relation?.kind === 'hotel') return Hotel;
  const type = `${document.documentType} ${document.relation?.name || ''}`.toLowerCase();
  if (type.includes('flight')) return Plane;
  if (type.includes('train')) return TrainFront;
  if (type.includes('bus')) return BusFront;
  if (type.includes('cab') || type.includes('transport')) return CarFront;
  return FileText;
};

export default function TravelDocumentCard({ document: item }) {
  const [preview, setPreview] = useState('');
  const [previewStatus, setPreviewStatus] = useState('loading');
  const [qr, setQr] = useState('');
  const [qrStatus, setQrStatus] = useState('loading');
  const isImage = /^image\/(jpeg|png|webp)$/i.test(item.mimeType);
  const isPdf = item.mimeType === 'application/pdf' || /\.pdf(?:\?|$)/i.test(item.secureUrl);
  useEffect(() => {
    let cancelled = false;
    setPreview('');
    setQr('');
    setPreviewStatus('loading');
    setQrStatus('loading');
    if (isImage) { setPreview(item.secureUrl); setPreviewStatus('ready'); }
    else if (isPdf) {
      import('../utils/pdfDocumentPreview.js').then(({ renderPdfFirstPage }) => renderPdfFirstPage(item.secureUrl))
        .then((url) => { if (!cancelled) { setPreview(url); setPreviewStatus('ready'); } })
        .catch(() => { if (!cancelled) setPreviewStatus('failed'); });
    } else setPreviewStatus('failed');
    import('qrcode').then(({ default: QRCode }) => QRCode.toDataURL(item.secureUrl, { width: 96, margin: 1 }))
      .then((url) => { if (!cancelled) { setQr(url); setQrStatus('ready'); } })
      .catch(() => { if (!cancelled) setQrStatus('failed'); });
    return () => { cancelled = true; };
  }, [isImage, isPdf, item.secureUrl]);
  const Icon = iconFor(item);
  const related = item.relation;
  const status = previewStatus === 'loading' || qrStatus === 'loading' ? 'loading' : previewStatus;
  return <article className="pdf-document-card" data-pdf-document={status}>
    <div className="pdf-document-heading"><Icon size={20} aria-hidden="true" /><div><p className="pdf-kicker">{item.documentType}</p><h3>{item.title}</h3><p>{related?.name || 'General travel document'}{related?.city ? ` · ${related.city}` : ''}{related?.route ? ` · ${related.route}` : ''}</p></div></div>
    <div className="pdf-document-facts">
      {item.passengerName && <div><span>Passenger</span><strong>{item.passengerName}</strong></div>}
      {item.bookingReference && <div><span>Booking reference</span><strong>{item.bookingReference}</strong></div>}
      {related?.checkIn && <div><span>Check-in</span><strong>{formatQuotationV2Date(related.checkIn)}</strong></div>}
      {related?.checkOut && <div><span>Check-out</span><strong>{formatQuotationV2Date(related.checkOut)}</strong></div>}
      {related?.schedule?.departureDate && <div><span>Departure</span><strong>{formatQuotationV2Date(related.schedule.departureDate)} {related.schedule.departureTime}</strong></div>}
    </div>
    <div className="pdf-document-preview">
      {preview && isPdf ? <img src={preview} alt={`Preview of ${item.title}`} data-pdf-image="ready" onError={() => { setPreview(''); setPreviewStatus('failed'); }} />
        : preview ? <PdfImage src={preview} alt={`Preview of ${item.title}`} fit="contain" fallbackLabel="Document preview unavailable" />
        : <div className="pdf-document-placeholder"><FileText size={30} aria-hidden="true" /><strong>{isPdf ? 'PDF document' : 'Travel document'}</strong><span>{status === 'loading' ? 'Preparing preview' : 'Original document available below'}</span></div>}
    </div>
    <div className="pdf-document-link-row"><span>{item.mimeType || 'Document'}</span><a href={item.secureUrl} target="_blank" rel="noopener noreferrer">View original document</a>{qr && <PdfImage src={qr} alt="QR code for original document" className="pdf-document-qr" fit="contain" fallbackLabel="" />}</div>
  </article>;
}
