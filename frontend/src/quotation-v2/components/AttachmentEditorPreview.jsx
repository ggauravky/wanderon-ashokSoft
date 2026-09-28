import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { resolveAttachmentMediaType } from '../attachmentMedia.js';

export default function AttachmentEditorPreview({ attachment }) {
  const [preview, setPreview] = useState('');
  const [failed, setFailed] = useState(false);
  const type = resolveAttachmentMediaType(attachment);
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setPreview(type === 'image' ? attachment.secureUrl : '');
    if (type === 'pdf') import('../utils/pdfDocumentPreview.js').then(({ renderPdfFirstPage }) => renderPdfFirstPage(attachment.secureUrl, { timeoutMs: 8000, maxWidth: 420 }))
      .then((url) => { if (!cancelled) setPreview(url); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [attachment.secureUrl, type]);
  if (preview && !failed) return <img src={preview} alt={`Preview of ${attachment.title || attachment.fileName || 'document'}`} onError={() => setFailed(true)} className="h-28 w-24 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-contain" />;
  return <div className="flex h-28 w-24 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-[10px] text-slate-500"><FileText size={22} /><span className="mt-2 px-2">{failed ? 'Preview unavailable' : type === 'pdf' ? 'Preparing PDF' : 'Document'}</span></div>;
}
