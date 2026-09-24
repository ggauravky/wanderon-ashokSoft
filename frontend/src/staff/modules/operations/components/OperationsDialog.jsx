import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function OperationsDialog({ title, description, children, onClose, footer, wide = false }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="operations-dialog-title">
    <div className={`max-h-[92vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"><div><h2 id="operations-dialog-title" className="text-lg font-semibold text-slate-950">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close dialog" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><X size={17}/></button></header>
      <div className="max-h-[calc(92vh-9rem)] overflow-y-auto p-5">{children}</div>
      {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</footer>}
    </div>
  </div>;
}
