import React, { useMemo } from 'react';
import MeasuredPdfDocument from '../components/MeasuredPdfDocument.jsx';
import { buildPdfSectionManifest } from '../pdfSectionManifest.js';

export default function SignatureLuxeTemplate({ model, debug = false }) {
  const blocks = useMemo(() => buildPdfSectionManifest(model, 'signature_luxe'), [model]);
  return <MeasuredPdfDocument model={model} templateKey="signature_luxe" blocks={blocks} debug={debug} />;
}
