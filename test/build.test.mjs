import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const catalog = require('../lib/catalog.js');

function htmlFiles(dir = DIST) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : e.name.endsWith('.html') ? [p] : [];
  });
}
const urlOf = (f) => '/' + path.relative(DIST, f).replace(/\.html$/, '').replace(/^index$/, '');
let pages;

before(() => {
  execFileSync(process.execPath, ['build.mjs'], { cwd: ROOT, stdio: 'pipe' });
  pages = new Map(htmlFiles().map((f) => [urlOf(f), fs.readFileSync(f, 'utf8')]));
});

test('AC1 every category and product has a page', () => {
  for (const c of catalog.categories) {
    const u = c.mode === 'rent' ? `/rent/${c.slug}` : `/buy/${c.slug.replace(/^buy-/, '')}`;
    assert.ok(pages.has(u), u);
    for (const p of catalog.productsIn(c.slug)) assert.ok(pages.has(`${u}/${p.slug.replace(/^buy-/, '')}`), p.slug);
  }
});

test('AC2 no sister brand identifiers in the output', () => {
  const banned = /kinetek|095 200 5701|385952005701|horva[cć]anska|phc_sEKJ|KneeCare/i;
  const files = fs.readdirSync(DIST, { recursive: true }).filter((f) => /\.(html|js|css|txt|xml|json)$/.test(f));
  for (const f of files) {
    const s = fs.readFileSync(path.join(DIST, f), 'utf8');
    const m = s.match(banned);
    assert.equal(m, null, `${f}: ${m && m[0]}`);
  }
});

test('AC6 all old blog URLs exist (clean URL; .html is redirected by Vercel cleanUrls)', () => {
  const old = fs.readdirSync(path.join(ROOT, 'blog')).filter((f) => f.endsWith('.html'));
  assert.equal(old.length, 18);
  for (const f of old) assert.ok(pages.has(`/blog/${f.replace(/\.html$/, '')}`), f);
});

test('AC8 title, description, canonical, JSON-LD on every page; sitemap lists every indexable page', () => {
  const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  for (const [u, html] of pages) {
    if (u === '/404') continue;
    assert.match(html, /<title>[^<]{10,}<\/title>/, `${u} title`);
    assert.match(html, /<meta name="description" content="[^"]{30,}"/, `${u} description`);
    assert.match(html, /<link rel="canonical" href="https:\/\/cpmrentdubai\.com/, `${u} canonical`);
    if (u === '/cart') continue;
    assert.match(html, /application\/ld\+json/, `${u} json-ld`);
    assert.ok(sitemap.includes(`<loc>https://cpmrentdubai.com${u}</loc>`), `${u} in sitemap`);
    for (const ld of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(ld[1]);
  }
});

test('internal links point to existing pages', () => {
  const missing = new Set();
  for (const [u, html] of pages) {
    for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
      const t = m[1].replace(/\/$/, '') || '/';
      if (/\.(png|jpg|css|js|xml|txt|json|woff2)$/.test(t)) continue;
      if (!pages.has(t)) missing.add(`${u} -> ${t}`);
    }
  }
  assert.deepEqual([...missing], []);
});

test('NG6 no em or en dashes in page text', () => {
  for (const [u, html] of pages) {
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
    const m = text.match(/.{0,30}[–—].{0,30}/);
    assert.equal(m, null, `${u}: ${m && m[0]}`);
  }
});
