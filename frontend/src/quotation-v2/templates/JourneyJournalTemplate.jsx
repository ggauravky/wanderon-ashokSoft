import React, { useMemo } from 'react';
import MeasuredPdfDocument from '../components/MeasuredPdfDocument.jsx';
import { buildPdfSectionManifest } from '../pdfSectionManifest.js';

export default function JourneyJournalTemplate({ model, debug = false }) {
  const blocks = useMemo(() => buildPdfSectionManifest(model, 'journey'), [model]);
  return <MeasuredPdfDocument model={model} templateKey="journey" blocks={blocks} debug={debug} />;
}
