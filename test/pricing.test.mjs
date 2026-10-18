import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { quote, billableDays, fromPrice, formatAed } = require('../public/assets/js/pricing.js');

// Real quotes from the market leader's public rental price API, start 20.10.2026,
// AED incl. VAT (collected 18.10.2026). Their engine rounds to x.01 / x.99 in places.
const CPM = [{ days: 1, price: 50 }, { days: 28, price: 1200 }, { days: 35, price: 1400 }, { days: 42, price: 1600 }, { days: 60, price: 2200 }];
const CPM_OBSERVED = {
  1: 50, 2: 100, 3: 150, 7: 350, 8: 400, 13: 650, 14: 700, 15: 750, 20: 1000, 25: 1200, 26: 1200, 27: 1200,
  29: 1250, 30: 1300.01, 31: 1350, 35: 1400, 40: 1600, 45: 1750, 59: 2200, 60: 2200, 61: 2250, 75: 2950,
  90: 3500, 120: 4400,
};
const SCOOTER = [{ days: 1, price: 40 }];
const SCOOTER_OBSERVED = { 2: 80, 8: 320, 13: 520, 25: 1000, 30: 1200, 31: 1240, 45: 1799.99, 61: 2440, 90: 3600, 120: 4800 };
const BED = [{ days: 14, price: 630 }, { days: 30, price: 945 }, { days: 60, price: 1470 }];
const BED_OBSERVED = { 1: 630, 3: 630, 7: 630, 14: 630, 30: 945, 60: 1470 };

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= 0.011, `${actual} vs ${expected}`);
}

test('CPM matches every observed market quote', () => {
  for (const [d, aed] of Object.entries(CPM_OBSERVED)) near(quote(CPM, Number(d)).total, aed);
});

test('per-day scooter matches observed quotes', () => {
  for (const [d, aed] of Object.entries(SCOOTER_OBSERVED)) near(quote(SCOOTER, Number(d)).total, aed);
});

test('package bed charges the full tier even for one day', () => {
  for (const [d, aed] of Object.entries(BED_OBSERVED)) near(quote(BED, Number(d)).total, aed);
});

test('breakdown adds up to the total', () => {
  const q = quote(CPM, 90);
  const sum = q.parts.reduce((s, p) => s + p.price * p.count, 0);
  near(sum, q.total);
});

test('rejects bad input', () => {
  assert.equal(quote(CPM, 0), null);
  assert.equal(quote(CPM, -3), null);
  assert.equal(quote(CPM, 2.5), null);
  assert.equal(quote(CPM, 367), null);
  assert.equal(quote(CPM, 'abc'), null);
  assert.equal(quote([], 7), null);
  assert.equal(quote([{ days: 0, price: 10 }], 7), null);
  assert.equal(quote(undefined, 7), null);
});

test('billable days are end minus start', () => {
  assert.equal(billableDays('2026-10-20', '2026-10-21'), 1);
  assert.equal(billableDays('2026-10-20', '2026-11-19'), 30);
  assert.equal(billableDays('2026-12-31', '2027-01-01'), 1);
  assert.equal(billableDays('2026-10-20', '2026-10-20'), null);
  assert.equal(billableDays('2026-10-21', '2026-10-20'), null);
  assert.equal(billableDays('20.10.2026', '2026-10-21'), null);
});

test('from price and AED format', () => {
  assert.deepEqual(fromPrice(BED), { days: 14, price: 630 });
  assert.equal(formatAed(1300), 'AED 1,300');
  assert.equal(formatAed(12.6), 'AED 12.60');
});
