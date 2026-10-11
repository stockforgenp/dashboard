import React, { useEffect } from 'react';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

interface SEOProps {
  title: string;
  description: string;
  keywords?: string | string[];
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  image?: string;
  imageAlt?: string;
  breadcrumbs?: BreadcrumbItem[];
  schemaJson?: object | object[];
  locale?: string;
  robots?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonicalPath = '',
  ogType = 'website',
  image,
  imageAlt = 'StockForge POS – Offline Retail POS & Inventory Engine',
  breadcrumbs,
  schemaJson,
  locale = 'ne_NP',
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
}) => {
  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // Canonical base domain resolution (prioritizing canonical custom domain over ephemeral preview hosts)
    const origin =
      typeof window !== 'undefined' &&
      window.location.hostname &&
      !window.location.hostname.includes('run.app') &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1')
        ? window.location.origin
        : 'https://stockforge.app';

    const path = canonicalPath || (window.location.pathname === '' ? '/' : window.location.pathname);
    const fullUrl = `${origin}${path.startsWith('/') ? path : `/${path}`}`;
    const imageUrl = image ? (image.startsWith('http') ? image : `${origin}${image}`) : `${origin}/og-image.svg`;

    // 2. Helper to set or create meta tag
    const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrValue);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Standard Meta Tags
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="robots"]', 'name', 'robots', robots);

    if (keywords) {
      const keywordsStr = Array.isArray(keywords) ? keywords.join(', ') : keywords;
      setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywordsStr);
    }

    // OpenGraph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', fullUrl);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'StockForge POS');
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', locale);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', imageUrl);
    setMetaTag('meta[property="og:image:alt"]', 'property', 'og:image:alt', imageAlt);
    setMetaTag('meta[property="og:image:width"]', 'property', 'og:image:width', '1200');
    setMetaTag('meta[property="og:image:height"]', 'property', 'og:image:height', '630');

    // Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);
    setMetaTag('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', imageAlt);

    // Canonical link tag
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;

    // Alternate language tags (English & Nepali)
    const setAlternate = (hreflang: string, href: string) => {
      let altTag = document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`) as HTMLLinkElement | null;
      if (!altTag) {
        altTag = document.createElement('link');
        altTag.rel = 'alternate';
        altTag.hreflang = hreflang;
        document.head.appendChild(altTag);
      }
      altTag.href = href;
    };
    setAlternate('en', fullUrl);
    setAlternate('ne', fullUrl);
    setAlternate('x-default', fullUrl);

    // 3. Structured Data JSON-LD
    // Build combined schemas array if breadcrumbs exist
    const schemasToInject: object[] = [];

    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbListSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.path.startsWith('http') ? crumb.path : `${origin}${crumb.path}`,
        })),
      };
      schemasToInject.push(breadcrumbListSchema);
    }

    if (schemaJson) {
      if (Array.isArray(schemaJson)) {
        schemasToInject.push(...schemaJson);
      } else {
        schemasToInject.push(schemaJson);
      }
    }

    let scriptTag = document.getElementById('seo-schema-jsonld') as HTMLScriptElement | null;
    if (schemasToInject.length > 0) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'seo-schema-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      // If multiple schemas, wrap in valid @graph and strip duplicate inner @context
      let payload: object;
      if (schemasToInject.length === 1) {
        payload = schemasToInject[0];
      } else {
        const graphItems = schemasToInject.map((item) => {
          if (typeof item === 'object' && item !== null && '@context' in item) {
            const { '@context': _ctx, ...rest } = item as Record<string, unknown>;
            return rest;
          }
          return item;
        });
        payload = { '@context': 'https://schema.org', '@graph': graphItems };
      }
      scriptTag.textContent = JSON.stringify(payload, null, 2);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [
    title,
    description,
    keywords,
    canonicalPath,
    ogType,
    image,
    imageAlt,
    breadcrumbs,
    schemaJson,
    locale,
    robots,
  ]);

  return null;
};
