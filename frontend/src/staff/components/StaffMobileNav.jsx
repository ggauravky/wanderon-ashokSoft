import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import StaffSidebar from './StaffSidebar';

const StaffMobileNav = ({ isOpen, onClose, openerRef, ...sidebarProps }) => {
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const openerElement = openerRef?.current;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = [...(drawerRef.current?.querySelectorAll('a[href], button:not([disabled])') || [])];
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      openerElement?.focus();
    };
  }, [isOpen, onClose, openerRef]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
    >
      <button
        type="button"
        aria-label="Close staff navigation"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60"
      />
      <aside
        ref={drawerRef}
        id="staff-mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Staff navigation"
        className="absolute inset-y-0 left-0 w-[min(88vw,20rem)] border-r border-white/10 bg-slate-950 shadow-2xl"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-offset-slate-950"
          aria-label="Close staff navigation"
        >
          <X size={20} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <StaffSidebar {...sidebarProps} onNavigate={onClose} />
      </aside>
    </div>
  );
};

export default StaffMobileNav;
