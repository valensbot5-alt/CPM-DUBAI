// Static site build: data/*.json + src/*.mjs -> dist/
import fs from 'node:fs';
import path from 'node:path';
import { SITE, catalog, catUrl, productUrl } from './src/site.mjs';
import * as pages from './src/pages.mjs';
import * as content from './src/content.mjs';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DIST = path.join(ROOT, 'dist');
const written = [];

function write(urlPath, html) {
  const file = urlPath === '/' ? 'index.html' : `${urlPath.replace(/^\//, '')}.html`;
  const full = path.join(DIST, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
  written.push(urlPath);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });
for (const f of ['favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'og-image.jpg']) {
  if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
}

write('/', pages.home());
write('/rent', pages.modeIndex('rent'));
write('/buy', pages.modeIndex('sale'));
for (const c of catalog.categories) write(catUrl(c), pages.category(c));
for (const p of catalog.products) write(productUrl(p), pages.product(p));
write('/cart', pages.cart());
write('/delivery', content.delivery());
write('/rental-terms', content.rentalTerms());
write('/returns', content.returns());
write('/faq', content.faq());
write('/contact', content.contact());
write('/privacy', content.privacy());
for (const [u, html] of content.emirates()) write(u, html);
for (const [u, html] of content.blog()) write(u, html);

// Slim catalog for the cart page (prices are recalculated on the server anyway).
const slim = {};
for (const p of catalog.products) {
  slim[p.slug] = catalog.mode(p) === 'sale'
    ? { name: p.name, url: productUrl(p), mode: 'sale', price: p.sale.price }
    : { name: p.name, url: productUrl(p), mode: 'rent', variants: p.variants.map((v) => ({ id: v.id, label: v.label, periods: catalog.periods(p, v.id) })) };
}
fs.writeFileSync(path.join(DIST, 'assets/catalog.json'), JSON.stringify(slim));

const indexable = written.filter((u) => u !== '/cart');
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((u) => `<url><loc>${SITE.origin}${u === '/' ? '/' : u}</loc></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /api/\n\nSitemap: ${SITE.origin}/sitemap.xml\n`);

console.log(`built ${written.length} pages into dist/`);
