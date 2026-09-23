import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function DocumentDialog({ title, onClose, children, footer }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const focusable = Array.from(closeRef.current?.closest('[role="dialog"]')?.querySelectorAll('button:not([disabled]), a[href]') || []);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus?.(); };
  }, [onClose]);
  return <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-center justify-center p-0 sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title" className="bg-white w-full h-full sm:h-auto sm:max-h-[94vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between gap-4">
        <h2 id="booking-dialog-title" className="text-lg font-bold text-slate-900">{title}</h2>
        <button ref={closeRef} onClick={onClose} aria-label="Close document" className="p-2 rounded-lg hover:bg-slate-100"><X size={20}/></button>
      </header>
      <div className="overflow-y-auto flex-1 bg-slate-100 p-3 sm:p-6">{children}</div>
      {footer && <footer className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4 flex flex-wrap gap-2 justify-end">{footer}</footer>}
    </section>
  </div>;
}
