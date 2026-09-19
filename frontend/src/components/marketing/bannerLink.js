const hasUnsafePathCharacter = (value) => [...value].some((character) => character === '\\' || character.charCodeAt(0) < 32);

export const safeBannerLink = (value) => {
  const link = String(value || '').trim();
  if (link.startsWith('/') && !link.startsWith('//') && !hasUnsafePathCharacter(link)) return { external: false, href: link };
  try { const url = new URL(link); if (['https:', 'http:'].includes(url.protocol) && url.hostname && !url.username && !url.password) return { external: true, href: url.href }; } catch { /* Invalid links are not rendered. */ }
  return null;
};
