import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { PromotionCta, PromotionImage } from './HomePromotionBanner.jsx';

export default function HomePromotionPopup({ banner }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const key = banner?._id ? `wlx_dismissed_banner_${banner._id}` : '';
  useEffect(() => {
    if (!key) return undefined;
    try { if (sessionStorage.getItem(key)) return undefined; } catch { /* Popup remains dismissible without storage. */ }
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [key]);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (event) => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); try { sessionStorage.setItem(key, '1'); } catch { /* Ignore unavailable storage. */ } } };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [open, key]);
  const close = () => { setOpen(false); try { sessionStorage.setItem(key, '1'); } catch { /* Ignore unavailable storage. */ } };
  if (!banner || !open) return null;
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section role="dialog" aria-modal="true" aria-labelledby="home-promotion-title" className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><button ref={closeRef} type="button" onClick={close} aria-label="Close promotion" className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-900"><X size={19}/></button><div className="relative aspect-[16/9] bg-slate-100"><PromotionImage key={banner._id} banner={banner} className="absolute inset-0 h-full w-full object-cover" /></div><div className="p-6"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{banner.tag || 'WanderLuxe promotion'}</p><h2 id="home-promotion-title" className="mt-2 text-2xl font-black text-slate-950">{banner.title}</h2>{banner.subtitle && <p className="mt-2 text-sm text-slate-600">{banner.subtitle}</p>}<div className="mt-5"><PromotionCta banner={banner} onClick={close} className="bg-emerald-700 text-white hover:bg-emerald-800" /></div></div></section></div>, document.body);
}
