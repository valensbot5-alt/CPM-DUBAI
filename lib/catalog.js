// Catalog access shared by build.mjs and api/order.js.
'use strict';

const categories = require('../data/categories.json');
const products = require('../data/products.json');
const pricing = require('../public/assets/js/pricing.js');

const bySlug = new Map(products.map((p) => [p.slug, p]));
const catBySlug = new Map(categories.map((c) => [c.slug, c]));

function mode(product) {
  return product.sale ? 'sale' : 'rent';
}

// Rental periods for a variant: the variant's own list, else the product's.
function periods(product, variantId) {
  if (!product || !product.rent) return null;
  const variants = product.variants || [];
  const v = variants.find((x) => x.id === variantId) || (variantId ? null : variants[0]);
  if (!v) return null;
  return v.periods || product.rent.periods || null;
}

function productsIn(categorySlug) {
  return products.filter((p) => p.category === categorySlug);
}

// Server side price of one cart line. Returns { unit, total, days? } or null.
function linePrice(line) {
  const p = bySlug.get(line && line.slug);
  if (!p) return null;
  const qty = Number(line.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) return null;
  if (mode(p) === 'sale') {
    return { unit: p.sale.price, total: Math.round(p.sale.price * qty * 100) / 100 };
  }
  const per = periods(p, line.variant);
  const days = pricing.billableDays(line.from, line.to);
  if (!per || !days) return null;
  const q = pricing.quote(per, days);
  if (!q) return null;
  return { unit: q.total, total: Math.round(q.total * qty * 100) / 100, days };
}

module.exports = { categories, products, bySlug, catBySlug, mode, periods, productsIn, linePrice };
