import React, { useState } from 'react';

export default function PdfImage({ src, alt = '', className = '', fallbackLabel = 'WanderLuxe journey', fit = 'cover', priority = false, aspectRatio, onReady }) {
  const [loadState, setLoadState] = useState(() => ({ src, status: src ? 'loading' : 'failed' }));
  const state = loadState.src === src ? loadState.status : src ? 'loading' : 'failed';
  const style = { objectFit: fit, ...(aspectRatio ? { aspectRatio } : {}) };
  if (!src || state === 'failed') return <div className={`pdf-image-fallback ${className}`} style={style} data-pdf-image="failed" role={alt ? 'img' : undefined} aria-label={alt || undefined}><span>{fallbackLabel}</span></div>;
  return <img crossOrigin={src.startsWith('data:') ? undefined : 'anonymous'} loading="eager" fetchPriority={priority ? 'high' : 'auto'} decoding="async" onLoad={(event) => { setLoadState({ src, status: 'ready' }); onReady?.({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }); }} onError={() => setLoadState({ src, status: 'failed' })} src={src} alt={alt} className={className} style={style} data-pdf-image={state} />;
}
