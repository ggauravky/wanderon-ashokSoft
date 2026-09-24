import { readFileSync } from 'node:fs';

const sample = JSON.parse(readFileSync(new URL('./quotation-ai-sample.json', import.meta.url), 'utf8'));

export const quotationAiSampleItinerary = Object.freeze(sample);

export const cloneQuotationAiSampleItinerary = () => JSON.parse(JSON.stringify(sample));
