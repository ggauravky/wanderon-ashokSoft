import React, { useEffect, useState } from 'react';

export default function PdfImage({ src, alt = '', className = '', fallbackLabel = 'WanderLuxe journey', fit = 'cover', priority = false, aspectRatio }) {
  const [state, setState] = useState(src ? 'loading' : 'failed');
  useEffect(() => { setState(src ? 'loading' : 'failed'); }, [src]);
  const style = { objectFit: fit, ...(aspectRatio ? { aspectRatio } : {}) };
  if (!src || state === 'failed') return <div className={`pdf-image-fallback ${className}`} style={style} data-pdf-image="failed" role={alt ? 'img' : undefined} aria-label={alt || undefined}><span>{fallbackLabel}</span></div>;
  return <img crossOrigin={src.startsWith('data:') ? undefined : 'anonymous'} loading="eager" fetchPriority={priority ? 'high' : 'auto'} decoding="async" onLoad={() => setState('ready')} onError={() => setState('failed')} src={src} alt={alt} className={className} style={style} data-pdf-image={state} />;
}
