// Site configuration and small HTML helpers.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const catalog = require('../lib/catalog.js');
export const pricing = require('../public/assets/js/pricing.js');

export const SITE = {
  name: 'CPM Rent Dubai',
  tagline: 'Medical equipment rental and sale',
  origin: 'https://cpmrentdubai.com',
  // O2 (spec §12): UAE number not decided yet; this is the number live on the current site.
  phone: '+385923238233',
  phoneDisplay: '+385 92 323 8233',
  whatsapp: '385923238233',
  email: 'info@cpmrentdubai.com',
  emirates: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
};

const ICON_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), 'icons');
const iconCache = new Map();
export function icon(name, cls = '') {
  if (!iconCache.has(name)) {
    const raw = fs.readFileSync(path.join(ICON_DIR, `${name}.svg`), 'utf8');
    const inner = raw.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s+/g, ' ').trim();
    iconCache.set(name, inner);
  }
  return `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconCache.get(name)}</svg>`;
}

export function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const aed = (n) => pricing.formatAed(n);

export function waLink(text) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}

// URLs
export function catUrl(c) {
  return c.mode === 'rent' ? `/rent/${c.slug}` : `/buy/${c.slug.replace(/^buy-/, '')}`;
}
export function productUrl(p) {
  const c = catalog.catBySlug.get(p.category);
  return `${catUrl(c)}/${p.slug.replace(/^buy-/, '')}`;
}

// "From" price line for a product or a category.
export function rentFrom(p) {
  let best = null;
  for (const v of p.variants || []) {
    const f = pricing.fromPrice(catalog.periods(p, v.id));
    if (f && (!best || f.price / f.days < best.price / best.days)) best = f;
  }
  return best;
}
export function periodLabel(days) {
  if (days === 1) return 'per day';
  if (days === 7) return 'up to 1 week';
  if (days === 14) return 'up to 2 weeks';
  if (days === 30) return 'up to 1 month';
  if (days === 60) return 'up to 2 months';
  return `up to ${days} days`;
}
export function priceLine(p) {
  if (catalog.mode(p) === 'sale') return { main: aed(p.sale.price), sub: 'to buy' };
  const f = rentFrom(p);
  return { main: aed(f.price), sub: periodLabel(f.days) };
}
export function categoryFrom(c) {
  const items = catalog.productsIn(c.slug);
  if (c.mode === 'sale') {
    const min = Math.min(...items.map((p) => p.sale.price));
    return `from <b>${aed(min)}</b>`;
  }
  const lines = items.map(rentFrom).filter(Boolean).sort((a, b) => a.price - b.price);
  return lines.length ? `from <b>${aed(lines[0].price)}</b> ${periodLabel(lines[0].days)}` : '';
}
