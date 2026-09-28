import { PDF_BLOCK_GAP_PX, SAFE_CONTENT_HEIGHT_PX } from './pdfLayoutConstants.js';

const layoutError = (message, block) => Object.assign(new Error(message), {
  code: 'PDF_BLOCK_TOO_LARGE',
  blockId: block?.id,
  blockHeight: block?.measuredHeight
});

export function packPdfBlocks({ blocks = [], pageContentHeight = SAFE_CONTENT_HEIGHT_PX, gap = PDF_BLOCK_GAP_PX } = {}) {
  const pages = [];
  const queue = [...blocks];
  let current = null;
  const newPage = () => ({ id: `page-${pages.length + 1}`, title: '', className: '', cover: false, blocks: [], usedHeight: 0 });
  const commit = () => {
    if (current?.cover || current?.blocks.length) pages.push(current);
    current = null;
  };

  while (queue.length) {
    const block = queue.shift();
    if (!block) continue;
    if (block.cover) {
      commit();
      pages.push({ id: `page-${pages.length + 1}`, title: block.title, className: block.className || '', cover: true, blocks: [block], usedHeight: pageContentHeight });
      continue;
    }
    const height = Math.max(0, Number(block.measuredHeight) || 0);
    if (height > pageContentHeight) {
      const split = typeof block.split === 'function' ? block.split(pageContentHeight) : [];
      if (!Array.isArray(split) || split.length < 2 || split.some((part) => part.id === block.id)) {
        throw layoutError(`PDF block ${block.id || 'unknown'} is ${Math.ceil(height)}px and cannot fit the ${pageContentHeight}px safe content area.`, block);
      }
      queue.unshift(...split);
      continue;
    }
    if (block.startOnNewPage && current?.blocks.length) commit();
    if (!current) current = newPage();
    const required = height + (current.blocks.length ? gap : 0);
    if (current.blocks.length && current.usedHeight + required > pageContentHeight) {
      commit();
      current = newPage();
    }
    current.blocks.push(block);
    current.usedHeight += height + (current.blocks.length > 1 ? gap : 0);
    current.title ||= block.pageTitle || block.sectionTitle || block.title || 'Travel proposal';
    current.className ||= block.pageClassName || '';
  }
  commit();
  return pages.filter((page) => page.cover || page.blocks.length > 0);
}

export function moveLastBlockToNextPage(pages, pageIndex) {
  const next = pages.map((page) => ({ ...page, blocks: [...page.blocks] }));
  const page = next[pageIndex];
  if (!page || page.cover || page.blocks.length < 2) return null;
  const moving = page.blocks.pop();
  let target = next[pageIndex + 1];
  if (!target || target.cover) {
    target = { id: `page-reflow-${moving.id}`, title: moving.pageTitle || moving.sectionTitle || moving.title, className: moving.pageClassName || '', cover: false, blocks: [], usedHeight: 0 };
    next.splice(pageIndex + 1, 0, target);
  }
  target.blocks.unshift(moving);
  page.title = page.blocks[0]?.pageTitle || page.blocks[0]?.sectionTitle || page.title;
  target.title = target.blocks[0]?.pageTitle || target.blocks[0]?.sectionTitle || target.title;
  return next.filter((item) => item.cover || item.blocks.length);
}
