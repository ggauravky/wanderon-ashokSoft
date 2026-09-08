import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, MapPin, Image as ImageIcon } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

/**
 * ItineraryDayGallery Component
 *
 * Renders a curated, place-accurate, nature-first gallery block for itinerary days:
 * - Dynamic count: 3 images (1 cover + 2 supporting), 2 images, 1 image, or 0 images (graceful empty state).
 * - Responsive layout: 1 hero + 2-column supporting collage on desktop, stacked/swipeable on mobile.
 * - Interactive Lightbox modal with caption, location badge, counter, and keyboard navigation.
 * - Compact mode (compact={true}) for PDF / Print documents with page-break-inside-avoid.
 *
 * @param {Object} props
 * @param {Object} props.day - Itinerary day object with coverMedia, galleryMedia, gallery, etc.
 * @param {string} [props.destination] - Destination name for context/fallback labels
 * @param {boolean} [props.compact=false] - When true, renders print/PDF optimized view without modals
 * @param {string} [props.className=''] - Extra classes for wrapper
 */
export default function ItineraryDayGallery({
  day = {},
  destination = '',
  compact = false,
  className = ''
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Extract and normalize all unique available images for this day
  const rawList = [];

  // 1. Primary Cover
  if (day.coverMedia?.url) {
    rawList.push(day.coverMedia);
  } else if (day.image || day.imageUrl) {
    rawList.push({
      url: day.image || day.imageUrl,
      altText: day.title || 'Day cover',
      caption: day.locationName || day.location || day.title || ''
    });
  }

  // 2. Supporting Gallery Media
  if (Array.isArray(day.galleryMedia) && day.galleryMedia.length > 0) {
    day.galleryMedia.forEach(m => {
      if (typeof m === 'string' && m.trim()) {
        rawList.push({ url: m.trim(), altText: day.title || 'Verified scenery', caption: day.locationName || '' });
      } else if (m && m.url) {
        rawList.push(m);
      }
    });
  }

  if (Array.isArray(day.gallery) && day.gallery.length > 0) {
    day.gallery.forEach(m => {
      if (typeof m === 'string' && m.trim()) {
        rawList.push({ url: m.trim(), altText: day.title || 'Verified scenery', caption: day.locationName || '' });
      } else if (m && m.url) {
        rawList.push(m);
      }
    });
  }

  // Filter for strict uniqueness by URL
  const seenUrls = new Set();
  const images = [];
  for (const item of rawList) {
    const url = typeof item === 'string' ? item.trim() : item?.url?.trim();
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      images.push(typeof item === 'string' ? {
        url,
        altText: day.title || 'Travel photography',
        caption: day.locationName || day.title || ''
      } : {
        ...item,
        altText: item.altText || day.title || 'Verified scenery',
        caption: item.caption || day.locationName || ''
      });
    }
  }

  const count = images.length;
  const primaryImage = images[0] || null;
  const supportingImages = images.slice(1, 3);

  // Lightbox keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') setLightboxOpen(false);
    if (e.key === 'ArrowRight') setActiveImageIdx((prev) => (prev + 1) % images.length);
    if (e.key === 'ArrowLeft') setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length);
  }, [lightboxOpen, images.length]);

  useEffect(() => {
    if (lightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, handleKeyDown]);

  const openLightbox = (index = 0, e) => {
    if (compact) return;
    if (e) e.stopPropagation();
    setActiveImageIdx(index);
    setLightboxOpen(true);
  };

  // ---------------------------------------------------------------------------
  // CASE 0: Zero Images (Graceful Empty State)
  // ---------------------------------------------------------------------------
  if (count === 0) {
    if (compact) return null;
    return (
      <div className={`py-2 px-3 bg-slate-50/80 rounded-xl border border-dashed border-slate-200 text-slate-400 flex items-center justify-between text-[11px] ${className}`}>
        <span className="flex items-center gap-1.5 font-medium text-slate-500">
          <MapPin size={13} className="text-slate-400" />
          {day.locationName || destination || 'Scenic Travel Destination'}
        </span>
        <span className="text-[10px] text-slate-400 font-semibold">Verified Route Point</span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // COMPACT PRINT / PDF MODE: Lightweight, avoids page-break issues
  // ---------------------------------------------------------------------------
  if (compact) {
    return (
      <div className={`space-y-1.5 page-break-inside-avoid ${className}`}>
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80">
          <img
            src={primaryImage.url}
            alt={primaryImage.altText || day.title}
            className="w-24 h-16 rounded-lg object-cover shrink-0"
          />
          {supportingImages.length > 0 && (
            <img
              src={supportingImages[0].url}
              alt={supportingImages[0].altText || day.title}
              className="w-20 h-16 rounded-lg object-cover shrink-0 hidden sm:block"
            />
          )}
          <div className="text-[10px] space-y-0.5 overflow-hidden flex-1">
            <span className="font-bold text-slate-900 block truncate">
              📍 {primaryImage.caption || day.locationName || day.title}
            </span>
            <span className="text-slate-500 block text-[9px] truncate">
              {primaryImage.altText || `${destination || 'WanderLuxe'} Curated Nature Photography`}
            </span>
            {count > 1 && (
              <span className="text-emerald-700 font-bold text-[9px] block">
                {count} Verified Destination Photos Included
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // CASE 1: Exactly 1 Image (Classic single hero cover)
  // ---------------------------------------------------------------------------
  if (count === 1) {
    return (
      <div className={`mt-2 ${className}`}>
        <div
          onClick={(e) => openLightbox(0, e)}
          className="relative rounded-2xl overflow-hidden aspect-16/8 bg-slate-950 group cursor-pointer shadow-sm border border-slate-200/60"
        >
          <img
            src={primaryImage.url}
            alt={primaryImage.altText || day.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-3 text-white">
            <div className="truncate pr-2">
              <span className="text-xs font-black block truncate drop-shadow-sm">
                📍 {primaryImage.caption || day.locationName || day.title}
              </span>
              <span className="text-[10px] text-slate-300 block truncate">
                {primaryImage.altText}
              </span>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              title="Expand photo"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* Lightbox Modal */}
        {lightboxOpen && renderLightboxModal()}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // CASE 2: Exactly 2 Images (Side-by-side or primary + secondary)
  // ---------------------------------------------------------------------------
  if (count === 2) {
    return (
      <div className={`mt-2 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={(e) => openLightbox(idx, e)}
              className="relative rounded-xl overflow-hidden aspect-16/9 bg-slate-950 group cursor-pointer shadow-sm border border-slate-200/60"
            >
              <img
                src={img.url}
                alt={img.altText || day.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-2.5 text-white">
                <div className="truncate pr-2">
                  <span className="text-[11px] font-bold block truncate">
                    📍 {img.caption || day.locationName || day.title}
                  </span>
                </div>
                <button
                  type="button"
                  className="p-1 rounded-md bg-black/50 hover:bg-black/80 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <Maximize2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {lightboxOpen && renderLightboxModal()}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // CASE 3: 3 Images (Desktop: 66% Primary Left + 34% Stacked Supporting Right; Mobile: Top Hero + 2 Bottom Tiles)
  // Rich, curated, place-accurate 3-image collage
  // ---------------------------------------------------------------------------
  return (
    <div className={`mt-2 ${className}`}>
      {/* Responsive layout: Desktop (md:) is Large Hero Left (66%) + Stacked 2 Supporting Right (34%); Mobile is Large Hero Top + 2 Supporting Below */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* 1. Large Primary Cover (col-span-2 on md, exact 280px height to match stacked column) */}
        <div
          onClick={(e) => openLightbox(0, e)}
          className="md:col-span-2 relative rounded-2xl overflow-hidden aspect-16/9 md:aspect-auto md:h-[280px] bg-slate-950 group cursor-pointer shadow-sm border border-slate-200/60"
        >
          <img
            src={primaryImage.url}
            alt={primaryImage.altText || day.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-3 text-white">
            <div className="truncate pr-2">
              <span className="text-xs font-black block truncate drop-shadow-sm">
                📍 {primaryImage.caption || day.locationName || day.title}
              </span>
              <span className="text-[10px] text-slate-300 block truncate">
                {primaryImage.altText}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-extrabold bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md text-white border border-white/20">
                Primary
              </span>
              <button
                type="button"
                className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Expand photo"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Supporting Images Column (col-span-1 on md with 2 stacked 136px tiles: 136+136+8=280px; grid-cols-2 on mobile) */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:h-[280px]">
          {supportingImages.map((img, idx) => (
            <div
              key={idx + 1}
              onClick={(e) => openLightbox(idx + 1, e)}
              className="relative rounded-xl overflow-hidden aspect-16/9 md:aspect-auto md:h-[136px] bg-slate-950 group cursor-pointer shadow-2xs border border-slate-200/60"
            >
              <img
                src={img.url}
                alt={img.altText || day.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-2 text-white">
                <span className="text-[10px] font-bold truncate pr-1">
                  📍 {img.caption || day.locationName || `${destination || 'Scenic'} Viewpoint`}
                </span>
                <button
                  type="button"
                  className="p-1 rounded-md bg-black/50 hover:bg-black/80 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <Maximize2 size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && renderLightboxModal()}
    </div>
  );

  // ---------------------------------------------------------------------------
  // LIGHTBOX MODAL DIALOG
  // ---------------------------------------------------------------------------
  function renderLightboxModal() {
    const current = images[activeImageIdx] || primaryImage;

    return (
      <div
        onClick={() => setLightboxOpen(false)}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
      >
        {/* Top Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-between text-white pb-3 border-b border-white/10"
        >
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
              Day {day.day || 1} Gallery
            </span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Photo {activeImageIdx + 1} of {images.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close viewer (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Center Image with Prev/Next Navigation */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex-1 flex items-center justify-center my-4 overflow-hidden max-h-[78vh]"
        >
          {images.length > 1 && (
            <button
              type="button"
              onClick={() => setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length)}
              className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-transform active:scale-95 cursor-pointer border border-white/15"
              title="Previous image (Left Arrow)"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          <img
            src={current.url}
            alt={current.altText || day.title}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-all duration-300"
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={() => setActiveImageIdx((prev) => (prev + 1) % images.length)}
              className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-transform active:scale-95 cursor-pointer border border-white/15"
              title="Next image (Right Arrow)"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        {/* Bottom Bar: Caption and Thumbnails */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl mx-auto text-center space-y-2 text-white pt-2 border-t border-white/10"
        >
          <div>
            <h4 className="text-sm sm:text-base font-black text-white drop-shadow-sm">
              📍 {current.caption || day.locationName || day.title}
            </h4>
            {current.altText && (
              <p className="text-xs text-slate-300 font-medium">
                {current.altText}
              </p>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              {images.map((thumb, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative w-12 h-8 sm:w-16 sm:h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIdx === idx
                      ? 'border-emerald-400 scale-105 ring-2 ring-emerald-500/50'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={thumb.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
