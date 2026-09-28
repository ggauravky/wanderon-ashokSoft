import React, { useMemo } from 'react';
import MeasuredPdfDocument from '../components/MeasuredPdfDocument.jsx';
import { buildPdfSectionManifest } from '../pdfSectionManifest.js';

export default function ExpeditionDossierTemplate({ model, debug = false }) {
  const blocks = useMemo(() => buildPdfSectionManifest(model, 'minimal'), [model]);
  return <MeasuredPdfDocument model={model} templateKey="minimal" blocks={blocks} debug={debug} />;
}
