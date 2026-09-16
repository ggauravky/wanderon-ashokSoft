import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SalesModalShell = ({ title, description, icon: Icon, onClose, children }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    panelRef.current?.querySelector('select, input, textarea, button')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" aria-label="Close dialog" />
      <section ref={panelRef} role="dialog" aria-modal="true" aria-label={title} className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-3">
            {Icon && <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Icon size={17} aria-hidden="true" /></span>}
            <div>
              <h2 className="text-base font-semibold text-slate-950">{title}</h2>
              {description && <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900" aria-label="Close dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
};

export default SalesModalShell;
