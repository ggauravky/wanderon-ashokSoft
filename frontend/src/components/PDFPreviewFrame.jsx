import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Download, Printer, RefreshCw } from 'lucide-react';

/**
 * Canonical A4 Print Dimensions at 96 DPI
 * 210mm x 297mm standard ISO 216
 */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

/**
 * PDFPreviewFrame
 *
 * Responsibilities:
 * 1. Measures available preview container width with ResizeObserver.
 * 2. Calculates responsive fit-to-width scale without changing the canonical A4 document width (794px).
 * 3. Reserves exact scaled layout space (documentWidth * scale, documentHeight * scale) to prevent clipping or phantom scrollbars.
 * 4. Centers the document horizontally with professional presentation borders and shadows.
 * 5. Provides unified header toolbar: Template Switcher + Zoom Controls (Fit, 100%, +, -) + Print & Download buttons.
 * 6. Guarantees ZERO horizontal scrolling in Fit mode across mobile, tablet, and desktop viewports.
 */
export default function PDFPreviewFrame({
  children,
  template = 'classic',
  onTemplateChange = null,
  onDownloadPdf = null,
  onPrint = null,
  downloadingPdf = false,
  className = '',
  maxScale = 1.0,
  minScale = 0.35,
  defaultZoomMode = 'fit' // 'fit' | 'actual' | 'custom'
}) {
  const containerRef = useRef(null);
  const contentWrapperRef = useRef(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [docHeight, setDocHeight] = useState(A4_HEIGHT_PX);
  const [zoomMode, setZoomMode] = useState(defaultZoomMode);
  const [customScale, setCustomScale] = useState(0.85);

  // Measure container dimensions with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width);
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Measure actual rendered content height
  useEffect(() => {
    if (!contentWrapperRef.current) return;

    const updateDocHeight = () => {
      if (contentWrapperRef.current) {
        const firstChild = contentWrapperRef.current.firstElementChild;
        if (firstChild) {
          const height = firstChild.scrollHeight || firstChild.offsetHeight || A4_HEIGHT_PX;
          setDocHeight(Math.max(A4_HEIGHT_PX, height));
        }
      }
    };

    updateDocHeight();

    const observer = new ResizeObserver(() => {
      updateDocHeight();
    });

    if (contentWrapperRef.current.firstElementChild) {
      observer.observe(contentWrapperRef.current.firstElementChild);
    }

    return () => observer.disconnect();
  }, [children, template]);

  // Compute active scale based on zoom mode
  // Reserve 48px padding for frame aesthetics
  const fitScale = containerWidth > 0
    ? Math.min(maxScale, Math.max(minScale, (containerWidth - 48) / A4_WIDTH_PX))
    : 0.85;

  let activeScale = fitScale;
  if (zoomMode === 'actual') {
    activeScale = 1.0;
  } else if (zoomMode === 'custom') {
    activeScale = customScale;
  }

  // Zoom control actions
  const handleZoomIn = () => {
    setZoomMode('custom');
    setCustomScale((prev) => Math.min(1.5, Number((activeScale + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setCustomScale((prev) => Math.max(minScale, Number((activeScale - 0.1).toFixed(2))));
  };

  const handleFit = () => {
    setZoomMode('fit');
  };

  const handleActual = () => {
    setZoomMode('actual');
  };

  const scaledWidth = Math.round(A4_WIDTH_PX * activeScale);
  const scaledHeight = Math.round(docHeight * activeScale);
  const percentageDisplay = `${Math.round(activeScale * 100)}%`;

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* Unified Sticky PDF Toolbar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-100/95 backdrop-blur-md rounded-2xl border border-slate-200/80 mb-3 shadow-xs">
        {/* Left: Template Selector */}
        {onTemplateChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mr-1 hidden sm:inline">
              Style:
            </span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
              {['classic', 'visual', 'compact'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTemplateChange(t)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    template === t
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200/80 shadow-2xs text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={activeScale <= minScale}
              className="p-1 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-30 transition-all cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>

            <span className="font-mono font-bold text-slate-800 px-1 text-[11px] min-w-[36px] text-center">
              {percentageDisplay}
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={activeScale >= 1.5}
              className="p-1 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-30 transition-all cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200/80 shadow-2xs text-xs">
            <button
              type="button"
              onClick={handleFit}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                zoomMode === 'fit'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
              title="Fit to Width"
            >
              Fit
            </button>

            <button
              type="button"
              onClick={handleActual}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                zoomMode === 'actual'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
              title="100% Actual Size"
            >
              100%
            </button>
          </div>
        </div>

        {/* Right: Export Actions */}
        <div className="flex items-center gap-2">
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
              title="Print Directly"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print</span>
            </button>
          )}

          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={downloadingPdf}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {downloadingPdf ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Outer Preview Canvas Viewport with Single Clean Vertical Scroll */}
      <div
        ref={containerRef}
        className="w-full bg-slate-200/90 p-4 sm:p-6 rounded-3xl border border-slate-300/80 overflow-y-auto overflow-x-hidden min-h-[450px] max-h-[70vh] flex justify-center items-start shadow-inner"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Scaled Space Reservation Wrapper */}
        <div
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            position: 'relative',
            margin: '0 auto',
            flexShrink: 0,
            transition: 'width 0.15s ease-out, height 0.15s ease-out'
          }}
        >
          {/* Canonical 794px Document Frame with Transform Scale */}
          <div
            ref={contentWrapperRef}
            style={{
              width: `${A4_WIDTH_PX}px`,
              transform: `scale(${activeScale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
