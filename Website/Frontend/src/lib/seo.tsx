import { useEffect } from 'react';

const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, '');
const DEFAULT_TITLE = 'URU — Your Village. Your City. Your URU.';
const DEFAULT_DESCRIPTION =
  'URU — authentic produce, spices, handloom and handicrafts sourced directly from Indian villages, delivered to your city.';

interface SeoProps {
  title?: string;
  description?: string | null;
  /** Path such as "/product/x". Defaults to the current path. */
  path?: string;
  image?: string | null;
  type?: 'website' | 'product';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/** Create-or-update a single head tag so pages never leave duplicates behind. */
function upsert(selector: string, create: () => HTMLElement, attr: string, value: string | null) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (value == null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const meta = (key: 'name' | 'property', name: string, content: string | null) =>
  upsert(
    `meta[${key}="${name}"]`,
    () => {
      const m = document.createElement('meta');
      m.setAttribute(key, name);
      return m;
    },
    'content',
    content,
  );

/** Per-page SEO: title, description, canonical, Open Graph, robots and JSON-LD structured data. */
export function Seo({ title, description, path, image, type = 'website', noindex, jsonLd }: SeoProps) {
  const fullTitle = title ? `${title} · URU` : DEFAULT_TITLE;
  const desc = (description || DEFAULT_DESCRIPTION).slice(0, 300);
  const url = SITE_URL + (path ?? window.location.pathname);
  const ld = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    document.title = fullTitle;
    meta('name', 'description', desc);
    meta('property', 'og:title', fullTitle);
    meta('property', 'og:description', desc);
    meta('property', 'og:url', url);
    meta('property', 'og:type', type);
    meta('property', 'og:image', image ?? null);
    meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    meta('name', 'robots', noindex ? 'noindex, nofollow' : null);
    upsert(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement('link');
        l.rel = 'canonical';
        return l;
      },
      'href',
      url,
    );
    let script: HTMLScriptElement | null = null;
    if (ld) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seo = 'page';
      script.textContent = ld;
      document.head.appendChild(script);
    }
    return () => {
      script?.remove();
    };
  }, [fullTitle, desc, url, type, image, noindex, ld]);

  return null;
}

export const absoluteUrl = (path: string) => SITE_URL + path;
