import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../api/order.js');

const GOOD = {
  name: 'Sara Test', phone: '+971 50 123 4567', emirate: 'Dubai', area: 'Dubai Marina', payment: 'Cash on delivery',
  lines: [
    { slug: 'hospital-bed-electric', variant: 'home', qty: 1, from: '2026-10-20', to: '2026-11-19' },
    { slug: 'buy-shower-stool', qty: 2 },
  ],
};

let ipSeq = 0;
function call(body, { method = 'POST', origin = 'https://cpmrentdubai.com', ip } = {}) {
  const req = { method, body, headers: { origin, 'x-forwarded-for': ip || `10.0.0.${++ipSeq}` } };
  return new Promise((resolve) => {
    const res = {
      code: 200, headers: {},
      status(c) { this.code = c; return this; },
      setHeader(k, v) { this.headers[k] = v; },
      json(o) { resolve({ code: this.code, body: o }); },
    };
    handler(req, res);
  });
}

let sent; const realFetch = globalThis.fetch;
beforeEach(() => {
  sent = [];
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = '-100123';
  globalThis.fetch = async (url, opts) => { sent.push({ url, body: JSON.parse(opts.body) }); return { ok: true }; };
});
afterEach(() => { globalThis.fetch = realFetch; });

test('valid order is priced on the server and sent to Telegram', async () => {
  const r = await call({ ...GOOD, lines: GOOD.lines.map((l) => ({ ...l, price: 1 })) });
  assert.equal(r.code, 200);
  assert.equal(r.body.total, 945 + 252);
  assert.equal(sent.length, 1);
  const msg = sent[0].body.text;
  assert.match(msg, /RENT Electric hospital bed, Home care frame, 2026-10-20 to 2026-11-19 \(30 d\): AED 945/);
  assert.match(msg, /BUY Shower stool x2: AED 252/);
  assert.match(msg, /Total before delivery: AED 1,197/);
});

test('only POST', async () => {
  const r = await call(GOOD, { method: 'GET' });
  assert.equal(r.code, 405);
});

test('preview and production origins are accepted', async () => {
  for (const o of ['https://www.cpmrentdubai.com', 'https://cpm-dubai-ep1s2fx1n-valensbot5-alts-projects.vercel.app', 'https://cpm-dubai-git-feat-shop-rebrand-valensbot5-alts-projects.vercel.app']) {
    assert.equal((await call(GOOD, { origin: o })).code, 200, o);
  }
});

test('foreign origin is refused', async () => {
  assert.equal((await call(GOOD, { origin: 'https://cpm-dubai.vercel.app.evil.example' })).code, 403);
  assert.equal((await call(GOOD, { origin: 'https://evil.example' })).code, 403);
  assert.equal((await call(GOOD, { origin: '' })).code, 403);
});

test('honeypot pretends success and sends nothing', async () => {
  const r = await call({ ...GOOD, web: 'http://spam' });
  assert.equal(r.code, 200);
  assert.equal(sent.length, 0);
});

test('rate limit per IP', async () => {
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await call(GOOD, { ip: '10.9.9.9' })).code);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
});

test('field validation', async () => {
  const cases = [
    [{ name: 'A' }, /name/],
    [{ phone: '123' }, /mobile/],
    [{ phone: '1234567890123456' }, /mobile/],
    [{ emirate: 'Doha' }, /emirate/],
    [{ area: '  ' }, /area/],
    [{ lines: [] }, /empty/],
    [{ lines: 'x' }, /empty/],
    [{ lines: Array(21).fill(GOOD.lines[1]) }, /empty/],
    [{ lines: [{ slug: 'nope', qty: 1 }] }, /no longer available/],
    [{ lines: [{ slug: 'buy-shower-stool', qty: 0 }] }, /no longer available/],
    [{ lines: [{ slug: 'hospital-bed-electric', variant: 'home', qty: 1, from: '2026-10-20', to: '2026-10-19' }] }, /no longer available/],
  ];
  for (const [patch, re] of cases) {
    const r = await call({ ...GOOD, ...patch });
    assert.equal(r.code, 400, JSON.stringify(patch).slice(0, 80));
    assert.match(r.body.error, re);
  }
  assert.equal(sent.length, 0);
});

test('control characters and length are cleaned', () => {
  const { order } = handler.validate({ ...GOOD, name: 'Sara\u0000\nTest', note: 'x'.repeat(900) });
  assert.equal(order.name, 'Sara Test');
  assert.equal(order.note.length, 400);
});

test('missing Telegram env gives 500, Telegram failure gives 502', async () => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  assert.equal((await call(GOOD)).code, 500);
  process.env.TELEGRAM_BOT_TOKEN = 't';
  globalThis.fetch = async () => ({ ok: false });
  assert.equal((await call(GOOD)).code, 502);
  globalThis.fetch = async () => { throw new Error('timeout'); };
  assert.equal((await call(GOOD)).code, 502);
});
