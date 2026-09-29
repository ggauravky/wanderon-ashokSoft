import React, { useEffect, useMemo, useRef, useState } from 'react';
import { preparePdfAssets, validatePdfLayout } from '../pdfPreflight.js';
import { CONTENT_WIDTH_PX, MAX_REFLOW_PASSES, SAFE_CONTENT_HEIGHT_PX } from '../pdfLayoutConstants.js';
import { moveLastBlockToNextPage, packPdfBlocks } from '../measuredPagination.js';
import { splitOversizedPdfBlock } from '../pdfSectionManifest.js';
import QuotationPdfPage from './QuotationPdfPage.jsx';
import PdfBlockContent from './PdfBlockContent.jsx';

const PdfBlock = ({ block, model, templateKey, measure = false, debug = false }) => <section
  data-pdf-block={block.id}
  data-pdf-section={block.section}
  data-pdf-keep-together={String(block.keepTogether !== false)}
  data-pdf-can-split={String(block.canSplit === true)}
  data-pdf-measured-height={block.measuredHeight || undefined}
  data-pdf-measure-block={measure ? block.id : undefined}
  className={`pdf-layout-block pdf-layout-block--${block.kind} ${debug ? 'is-debug' : ''}`}
>
  {debug && <span className="pdf-debug-label">{block.id}{block.measuredHeight ? ` · ${block.measuredHeight}px` : ''}</span>}
  <PdfBlockContent block={block} model={model} templateKey={templateKey} />
</section>;

export default function MeasuredPdfDocument({ model, templateKey, blocks, debug = false }) {
  const measureRef = useRef(null);
  const finalRef = useRef(null);
  const cacheRef = useRef(new Map());
  const splitPassRef = useRef(0);
  const [layout, setLayout] = useState({ status: 'measuring', pages: [], pass: 0, error: '' });
  const [workingBlocks, setWorkingBlocks] = useState(blocks);
  const nonCoverBlocks = useMemo(() => workingBlocks.filter((item) => !item.cover), [workingBlocks]);

  useEffect(() => {
    cacheRef.current.clear();
    splitPassRef.current = 0;
    setWorkingBlocks(blocks);
    setLayout({ status: 'measuring', pages: [], pass: 0, error: '' });
  }, [blocks, model, templateKey]);

  useEffect(() => {
    if (layout.status !== 'measuring' || !measureRef.current) return undefined;
    let cancelled = false;
    (async () => {
      try {
        await preparePdfAssets(measureRef.current, { timeoutMs: 20000 });
        if (cancelled) return;
        const measured = new Map([...measureRef.current.querySelectorAll('[data-pdf-measure-block]')].map((node) => [node.dataset.pdfMeasureBlock, Math.ceil(node.getBoundingClientRect().height)]));
        const prepared = workingBlocks.map((item) => {
          if (item.cover) return { ...item, measuredHeight: SAFE_CONTENT_HEIGHT_PX };
          const cacheKey = `${templateKey}:${item.id}`;
          const height = measured.get(item.id) || cacheRef.current.get(cacheKey);
          if (!height) throw new Error(`Unable to measure PDF block ${item.id}.`);
          cacheRef.current.set(cacheKey, height);
          return {
            ...item,
            measuredHeight: height,
            split: () => splitOversizedPdfBlock(item, templateKey)
          };
        });
        const oversized = prepared.filter((item) => !item.cover && item.measuredHeight > SAFE_CONTENT_HEIGHT_PX);
        if (oversized.length) {
          if (splitPassRef.current >= MAX_REFLOW_PASSES) throw new Error('PDF layout exceeded the safe oversized-block split limit.');
          const replacements = new Map(oversized.map((item) => [item.id, splitOversizedPdfBlock(item, templateKey)]));
          const unsafe = oversized.find((item) => (replacements.get(item.id) || []).length < 2);
          if (unsafe) throw new Error(`PDF block ${unsafe.id} is ${unsafe.measuredHeight}px and has no safe logical split point.`);
          splitPassRef.current += 1;
          setWorkingBlocks((current) => current.flatMap((item) => (replacements.get(item.id) || [item]).map(({ measuredHeight: _height, ...part }) => part)));
          return;
        }
        const pages = packPdfBlocks({ blocks: prepared });
        setLayout({ status: 'validating', pages, pass: 0, error: '' });
      } catch (error) {
        if (!cancelled) setLayout({ status: 'error', pages: [], pass: 0, error: error.message });
      }
    })();
    return () => { cancelled = true; };
  }, [layout.status, templateKey, workingBlocks]);

  useEffect(() => {
    if (layout.status !== 'validating' || !finalRef.current) return undefined;
    let cancelled = false;
    (async () => {
      try {
        await preparePdfAssets(finalRef.current, { timeoutMs: 20000 });
        if (cancelled) return;
        const report = validatePdfLayout(finalRef.current);
        if (report.valid) {
          setLayout((current) => ({ ...current, status: 'ready' }));
          return;
        }
        if (layout.pass >= MAX_REFLOW_PASSES) throw new Error('PDF layout could not safely fit one section after automatic reflow.');
        const overflowIndex = report.pages.findIndex((page) => page.verticalOverflowPx > 2 || page.horizontalOverflowPx > 2 || page.footerCollisionPx > 2 || page.headerCollisionPx > 2);
        const repaired = moveLastBlockToNextPage(layout.pages, overflowIndex);
        if (!repaired) {
          const page = report.pages[overflowIndex];
          const blockId = layout.pages[overflowIndex]?.blocks[0]?.id || 'unknown';
          throw new Error(`PDF layout could not safely fit ${blockId} on ${page?.title || `page ${overflowIndex + 1}`}.`);
        }
        setLayout((current) => ({ ...current, pages: repaired, pass: current.pass + 1 }));
      } catch (error) {
        if (!cancelled) setLayout((current) => ({ ...current, status: 'error', error: error.message }));
      }
    })();
    return () => { cancelled = true; };
  }, [layout.pages, layout.pass, layout.status]);

  if (layout.status === 'measuring') return <><div className={`pdf-measurement-canvas quotation-pdf-page--${templateKey}`} style={{ width: CONTENT_WIDTH_PX }} ref={measureRef} data-pdf-layout-state="measuring">
    {nonCoverBlocks.map((item) => <PdfBlock key={item.id} block={item} model={model} templateKey={templateKey} measure debug={debug} />)}
  </div><div className="quotation-template-loading">Building measured {templateKey.replaceAll('_', ' ')} pages...</div></>;

  if (layout.status === 'error') return <div className="pdf-layout-error" data-pdf-layout-state="error" data-pdf-layout-error={layout.error}>{layout.error}</div>;

  const pageCount = layout.pages.length;
  return <div ref={finalRef} className="quotation-pdf-stack" data-pdf-layout-state={layout.status} data-pdf-layout-pass={layout.pass}>
    {layout.pages.map((page, pageIndex) => <QuotationPdfPage key={page.id} model={model} templateKey={templateKey} pageNumber={pageIndex + 1} pageCount={pageCount} title={page.title} cover={page.cover} className={page.className}>
      <div className={`pdf-packed-blocks ${page.cover ? 'is-cover' : ''}`}>{page.blocks.map((item) => <PdfBlock key={item.id} block={item} model={model} templateKey={templateKey} debug={debug} />)}</div>
    </QuotationPdfPage>)}
  </div>;
}
