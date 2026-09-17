import React, { useEffect } from 'react';
import { X, Download, ExternalLink, FileText, AlertCircle } from 'lucide-react';

export default function DocumentPreviewModal({ isOpen, onClose, document: doc }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !doc) return null;

  const isPdf = doc.mimeType === 'application/pdf' || (doc.fileName || '').toLowerCase().endsWith('.pdf') || (doc.secureUrl || '').toLowerCase().includes('.pdf');
  const isImage = !isPdf && (doc.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(doc.fileName || '') || /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(doc.secureUrl || ''));

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h2 id="preview-modal-title" className="text-sm font-bold text-white truncate">
                {doc.title || doc.fileName || 'Travel Document Preview'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="truncate">{doc.fileName}</span>
                {doc.size > 0 && <span>• {formatFileSize(doc.size)}</span>}
                {doc.visibility === 'INTERNAL_ONLY' && (
                  <span className="px-2 py-0.2 text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                    Internal Only
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {doc.secureUrl && (
              <>
                <a
                  href={doc.secureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Open in new window"
                >
                  <ExternalLink size={14} />
                  <span className="hidden sm:inline">Open External</span>
                </a>
                <a
                  href={doc.secureUrl}
                  download={doc.fileName || 'travel_document.pdf'}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Download File"
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/60 min-h-[400px]">
          {isPdf ? (
            <div className="w-full h-[70vh] rounded-2xl overflow-hidden border border-slate-800 bg-white">
              <iframe
                src={`${doc.secureUrl}#toolbar=1`}
                title={doc.title || 'PDF Preview'}
                className="w-full h-full border-none"
              />
            </div>
          ) : isImage ? (
            <div className="max-h-[75vh] flex items-center justify-center">
              <img
                src={doc.secureUrl}
                alt={doc.title || doc.fileName || 'Document Preview'}
                className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-lg border border-slate-800"
              />
            </div>
          ) : (
            <div className="text-center p-8 max-w-md space-y-4">
              <AlertCircle size={40} className="mx-auto text-amber-400 opacity-80" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Direct preview not supported for this file format</p>
                <p className="text-xs text-slate-400">
                  Please use the download button above or open in external browser viewer.
                </p>
              </div>
              <a
                href={doc.secureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <ExternalLink size={14} /> Open in Browser
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
