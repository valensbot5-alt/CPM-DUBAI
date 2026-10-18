// CPM Rent Dubai: order request from the cart arrives as a Telegram message.
// Nothing is stored. Prices are recalculated here from the catalog; the browser total is never trusted.
// Vercel env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_THREAD_ID (optional topic).
'use strict';

const catalog = require('../lib/catalog.js');

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
const PAYMENT = ['Card on delivery', 'Cash on delivery'];
const ALLOWED_HOST = /^(www\.)?cpmrentdubai\.com$|^cpm-dubai[a-z0-9-]*\.vercel\.app$|^(localhost|127\.0\.0\.1)(:\d+)?$/;
const MAX_LINES = 20;

// At most 5 requests per IP in 10 minutes, per function instance (rough spam guard).
const HITS = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

function text(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function validate(b) {
  const name = text(b.name, 80);
  const phone = text(b.phone, 30);
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2) return { error: 'Please enter your name.' };
  if (digits.length < 8 || digits.length > 15) return { error: 'Please check the mobile number.' };
  if (!EMIRATES.includes(b.emirate)) return { error: 'Please choose the emirate.' };
  const area = text(b.area, 80);
  if (!area) return { error: 'Please enter the area for delivery.' };
  if (!Array.isArray(b.lines) || b.lines.length < 1 || b.lines.length > MAX_LINES) return { error: 'Your cart is empty.' };
  const lines = [];
  for (const raw of b.lines) {
    const l = raw && typeof raw === 'object' ? raw : {};
    const line = { slug: text(l.slug, 80), variant: text(l.variant, 40), qty: Number(l.qty), from: text(l.from, 10), to: text(l.to, 10) };
    const price = catalog.linePrice(line);
    if (!price) return { error: 'One item in the cart is no longer available. Please remove it and try again.' };
    const p = catalog.bySlug.get(line.slug);
    lines.push({ ...line, product: p, price });
  }
  const total = Math.round(lines.reduce((s, l) => s + l.price.total, 0) * 100) / 100;
  return {
    order: {
      name, phone, emirate: b.emirate, area,
      address: text(b.address, 160),
      payment: PAYMENT.includes(b.payment) ? b.payment : PAYMENT[0],
      note: text(b.note, 400),
      page: text(b.page, 120),
      lines, total,
    },
  };
}

function aed(n) {
  return 'AED ' + (Math.round(n * 100) % 100 === 0 ? String(Math.round(n)) : n.toFixed(2)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function message(o) {
  const rows = ['New order request, cpmrentdubai.com', `Name: ${o.name}`, `Phone: ${o.phone}`, `Emirate: ${o.emirate}`, `Area: ${o.area}`];
  if (o.address) rows.push(`Address: ${o.address}`);
  rows.push(`Payment: ${o.payment}`, '');
  for (const l of o.lines) {
    const p = l.product;
    const v = p.variants && p.variants.length > 1 ? `, ${(p.variants.find((x) => x.id === l.variant) || {}).label}` : '';
    rows.push(catalog.mode(p) === 'sale'
      ? `BUY ${p.name} x${l.qty}: ${aed(l.price.total)}`
      : `RENT ${p.name}${v}, ${l.from} to ${l.to} (${l.price.days} d)${l.qty > 1 ? ` x${l.qty}` : ''}: ${aed(l.price.total)}`);
  }
  rows.push(`Total before delivery: ${aed(o.total)}`);
  if (o.note) rows.push('', `Note: ${o.note}`);
  if (o.page) rows.push(`Page: ${o.page}`);
  return rows.join('\n');
}

function tooMany(ip, now) {
  const recent = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > MAX_HITS;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }
  let host = '';
  try { host = new URL(req.headers.origin || '').host; } catch (e) { host = ''; }
  if (!ALLOWED_HOST.test(host)) return res.status(403).json({ ok: false });

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  // Hidden field: people never see it, bots fill it. Pretend success.
  if (text(body.web, 10)) return res.status(200).json({ ok: true, total: 0 });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (tooMany(ip, Date.now())) return res.status(429).json({ ok: false, error: 'Too many attempts, please message us on WhatsApp.' });

  const { error, order } = validate(body);
  if (error) return res.status(400).json({ ok: false, error });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(500).json({ ok: false });
  const thread = String(process.env.TELEGRAM_THREAD_ID || '').trim();
  const topic = /^\d+$/.test(thread) ? { message_thread_id: Number(thread) } : {};

  try {
    // TELEGRAM_API only for local end to end tests against a mock server.
    const base = process.env.TELEGRAM_API || 'https://api.telegram.org';
    const r = await fetch(`${base}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, ...topic, text: message(order), disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return res.status(502).json({ ok: false });
  } catch (e) {
    return res.status(502).json({ ok: false });
  }
  return res.status(200).json({ ok: true, total: order.total });
};

module.exports.validate = validate;
module.exports.message = message;
