export const createEmptyPage = () => ({
  title: '', slug: '', heroSubtitle: '', category: 'General', content: '', sections: [], status: 'draft', author: '',
  seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', robots: 'index, follow', ogTitle: '', ogDescription: '', ogImage: '', ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '', twitterImage: '', structuredDataType: 'WebPage', structuredDataJson: '' }
});

export const normalizePageSlug = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const formatPageDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

