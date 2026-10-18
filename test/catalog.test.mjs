import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const cat = require('../lib/catalog.js');
const { quote } = require('../public/assets/js/pricing.js');

test('slugs are unique and URL safe', () => {
  const all = [...cat.categories.map((c) => c.slug), ...cat.products.map((p) => p.slug)];
  assert.equal(new Set(all).size, all.length);
  for (const s of all) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test('every product points to a category of the same mode', () => {
  for (const p of cat.products) {
    const c = cat.catBySlug.get(p.category);
    assert.ok(c, `${p.slug} has unknown category ${p.category}`);
    assert.equal(c.mode, cat.mode(p), p.slug);
  }
});

test('every category has at least one product', () => {
  for (const c of cat.categories) assert.ok(cat.productsIn(c.slug).length > 0, c.slug);
});

test('every rental variant can be priced for 1 to 90 days', () => {
  for (const p of cat.products.filter((x) => cat.mode(x) === 'rent')) {
    assert.ok(p.variants && p.variants.length, p.slug);
    for (const v of p.variants) {
      const per = cat.periods(p, v.id);
      assert.ok(per && per.length, `${p.slug}/${v.id} has no periods`);
      for (let d = 1; d <= 90; d++) assert.ok(quote(per, d).total > 0, `${p.slug}/${v.id} ${d}d`);
    }
  }
});

test('sale products have a positive price and no rental block', () => {
  for (const p of cat.products.filter((x) => cat.mode(x) === 'sale')) {
    assert.ok(p.sale.price > 0, p.slug);
    assert.equal(p.rent, undefined, p.slug);
  }
});

test('every product has name, summary and a price source', () => {
  for (const p of cat.products) {
    assert.ok(p.name && p.summary, p.slug);
    assert.match(p.price_source, /^(current-site|market-\d{4}-\d{2}-\d{2}|owner)$/, p.slug);
  }
});

test('server line price', () => {
  assert.deepEqual(cat.linePrice({ slug: 'hospital-bed-electric', variant: 'home', qty: 1, from: '2026-10-20', to: '2026-11-19' }), { unit: 945, total: 945, days: 30 });
  assert.deepEqual(cat.linePrice({ slug: 'buy-shower-stool', qty: 2 }), { unit: 126, total: 252 });
  assert.equal(cat.linePrice({ slug: 'nope', qty: 1 }), null);
  assert.equal(cat.linePrice({ slug: 'buy-shower-stool', qty: 0 }), null);
  assert.equal(cat.linePrice({ slug: 'buy-shower-stool', qty: 11 }), null);
  assert.equal(cat.linePrice({ slug: 'hospital-bed-electric', variant: 'xxx', qty: 1, from: '2026-10-20', to: '2026-11-19' }), null);
  assert.equal(cat.linePrice({ slug: 'hospital-bed-electric', variant: 'home', qty: 1, from: '2026-10-20', to: '2026-10-20' }), null);
});
