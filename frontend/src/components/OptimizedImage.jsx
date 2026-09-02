import React, { useState } from 'react';

const DEFAULT_TRAVEL_FALLBACK = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200';

/**
 * Production-hardened OptimizedImage Component
 * - Prevents broken image icons
 * - Safe single-try fallback with loop protection
 * - Subtle shimmer placeholder while loading
 */
export default function OptimizedImage({
  src,
  alt = 'Travel experience',
  className = '',
  fallbackSrc = DEFAULT_TRAVEL_FALLBACK,
  loading = 'lazy',
  ...rest
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Derive initial image source
  const validInitialSrc = (src && typeof src === 'string' && src.trim() !== '') ? src.trim() : fallbackSrc;
  const currentSrc = hasError ? fallbackSrc : validInitialSrc;

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setIsLoaded(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background shimmer placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...rest}
      />
    </div>
  );
}
