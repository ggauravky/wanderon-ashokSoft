import React, { useState } from 'react';

export default function PdfImage({ src, alt = '', className = '', fallbackLabel = 'WanderLuxe journey' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={`pdf-image-fallback ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}><span>{fallbackLabel}</span></div>;
  return <img src={src} alt={alt} className={className} crossOrigin="anonymous" onError={() => setFailed(true)} />;
}
