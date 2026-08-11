import React, { useEffect } from 'react';

const SITE_NAME = 'WanderLuxe';
const DEFAULT_DOMAIN = 'https://wanderluxe.in';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200';

const SEOHead = ({
  title = 'WanderLuxe | Next-Gen Luxury Group Trips & Backpacking Expeditions',
  description = 'Curating premium travel experiences across India and international destinations. Living Root Bridges, Spiti Valley, Kashmir, Bali, and Ladakh with verified trip captains.',
  canonical,
  noindex = false,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  jsonLd = null
}) => {
  useEffect(() => {
    // 1. Update Title
    const finalTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = finalTitle;

    // 2. Helper to create or update meta/link elements
    const setMetaTag = (selector, attribute, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement(selector.startsWith('meta') ? 'meta' : 'link');
        document.head.appendChild(el);
      }
      if (selector.startsWith('meta')) {
        el.setAttribute(attribute, value);
      } else {
        el.setAttribute('href', value);
      }
    };

    // Meta Description
    setMetaTag('meta[name="description"]', 'content', description);

    // Meta Robots
    setMetaTag('meta[name="robots"]', 'content', noindex ? 'noindex, nofollow' : 'index, follow');

    // Canonical Link
    const currentPath = window.location.pathname;
    const canonicalUrl = canonical
      ? canonical.startsWith('http') ? canonical : `${DEFAULT_DOMAIN}${canonical}`
      : `${DEFAULT_DOMAIN}${currentPath}`;
    setMetaTag('link[rel="canonical"]', 'href', canonicalUrl);

    // Open Graph Tags
    setMetaTag('meta[property="og:title"]', 'content', finalTitle);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:type"]', 'content', ogType);
    setMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    setMetaTag('meta[property="og:image"]', 'content', ogImage);
    setMetaTag('meta[property="og:site_name"]', 'content', SITE_NAME);

    // Twitter Cards
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'content', finalTitle);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
    setMetaTag('meta[name="twitter:image"]', 'content', ogImage);

    // 3. Inject JSON-LD Script
    let scriptEl = document.querySelector('script[id="json-ld-seo"]');
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = 'json-ld-seo';
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [title, description, canonical, noindex, ogImage, ogType, jsonLd]);

  return null;
};

export default SEOHead;
