import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { safeBannerLink } from './bannerLink.js';

export function PromotionCta({ banner, className = '', onClick }) {
  const link = banner?.ctaText && safeBannerLink(banner.ctaLink);
  if (!link) return null;
  const content = <>{banner.ctaText}<ArrowRight size={15} aria-hidden="true" /></>;
  const classes = `inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${className}`;
  return link.external
    ? <a href={link.href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={classes}>{content}</a>
    : <Link to={link.href} onClick={onClick} className={classes}>{content}</Link>;
}

export function PromotionImage({ banner, fallback = '', eager = false, className = '' }) {
  const [failed, setFailed] = useState(false);
  const image = failed ? fallback : banner?.imageUrl || fallback;
  if (!image) return null;
  return <picture>
    {!failed && banner?.mobileImageUrl && <source media="(max-width: 640px)" srcSet={banner.mobileImageUrl} />}
    <img src={image} alt={banner?.title || 'WanderLuxe promotion'} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} onError={() => setFailed(true)} className={className} />
  </picture>;
}

export function HomePromotionStrip({ banner, topBar = false }) {
  if (!banner) return null;
  if (topBar) return <aside aria-label="Featured promotion" className="relative z-20 bg-emerald-950 px-4 py-2 text-white"><div className="travel-container flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center sm:justify-between"><p className="text-sm font-semibold"><span className="text-emerald-300">{banner.tag && `${banner.tag} · `}</span>{banner.title}</p><PromotionCta banner={banner} className="!min-h-8 border border-white/30 text-white hover:bg-white/10" /></div></aside>;
  return <aside aria-label="Featured offer" className="bg-emerald-950 px-4 py-8 text-white"><div className="travel-container flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-emerald-300">{banner.tag || 'Featured offer'}</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{banner.title}</h2>{banner.subtitle && <p className="mt-1 text-sm text-emerald-50/80">{banner.subtitle}</p>}</div><PromotionCta banner={banner} className="shrink-0 bg-white text-emerald-950 hover:bg-emerald-50" /></div></aside>;
}

export function HomePromotionHighlight({ banner }) {
  if (!banner) return null;
  return <section aria-label="Featured destination" className="travel-section bg-white"><div className="travel-container"><div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-xl md:grid-cols-2"><div className="relative min-h-[220px] bg-slate-800 sm:min-h-[300px]"><PromotionImage key={banner._id} banner={banner} className="absolute inset-0 h-full w-full object-cover" /></div><div className="flex min-w-0 flex-col justify-center p-6 sm:p-10"><p className="text-xs font-bold uppercase tracking-wider text-emerald-300">{banner.tag || 'Featured destination'}</p><h2 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">{banner.title}</h2>{banner.subtitle && <p className="mt-3 text-sm leading-relaxed text-slate-300">{banner.subtitle}</p>}<div className="mt-5"><PromotionCta banner={banner} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300" /></div></div></div></div></section>;
}
