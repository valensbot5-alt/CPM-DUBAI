// End to end: product page -> add to cart -> cart -> order request -> (mock) Telegram.
// Starts its own dev server with a mock Telegram API, drives headless Chrome over CDP.
// node scripts/e2e.mjs [width]
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const width = Number(process.argv[2] || 390);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const check = (ok, what) => { checks.push([ok, what]); console.log(`${ok ? 'PASS' : 'FAIL'} ${what}`); };

// mock Telegram
const telegram = [];
const mock = http.createServer(async (req, res) => {
  let raw = ''; for await (const c of req) raw += c;
  telegram.push(JSON.parse(raw));
  res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"ok":true}');
}).listen(4399);

const PORT = 4398;
const server = spawn(process.execPath, ['scripts/dev-server.mjs'], {
  cwd: ROOT, stdio: 'ignore',
  env: { ...process.env, PORT: String(PORT), TELEGRAM_BOT_TOKEN: 'e2e', TELEGRAM_CHAT_ID: '-1', TELEGRAM_API: 'http://127.0.0.1:4399' },
});
const B = `http://localhost:${PORT}`;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cpmd-e2e-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--disable-gpu', '--remote-debugging-port=9399', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch('http://127.0.0.1:9399/json')).json()).find((t) => t.type === 'page'); } catch { /* starting */ }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const waiting = new Map(); const events = [];
ws.addEventListener('message', (m) => { const x = JSON.parse(m.data); if (x.id && waiting.has(x.id)) { waiting.get(x.id)(x); waiting.delete(x.id); } else events.push(x); });
const send = (method, params = {}) => new Promise((r) => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.result.value;
async function go(url) {
  events.length = 0;
  await send('Page.navigate', { url });
  for (let i = 0; i < 60 && !events.some((e) => e.method === 'Page.loadEventFired'); i++) await sleep(100);
  await sleep(300);
}
async function waitFor(expr, ms = 4000) { for (let t = 0; t < ms; t += 100) { if (await js(expr)) return true; await sleep(100); } return false; }

try {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 900 });

  // 1. rental product: bed, 30 days -> 945
  await go(`${B}/rent/hospital-beds/hospital-bed-electric`);
  await js(`(() => { const f = document.querySelector('#from'), t = document.querySelector('#to');
    f.value = '2026-11-01'; f.dispatchEvent(new Event('change'));
    t.value = '2026-12-01'; t.dispatchEvent(new Event('change')); })()`);
  check((await js(`document.querySelector('[data-total]').textContent`)) === 'AED 945', 'bed 30 days shows AED 945');
  check(/2026/.test(decodeURIComponent(await js(`document.querySelector('[data-wa]').href`))), 'WhatsApp link carries the dates');
  await js(`document.querySelector('[data-add]').click()`);
  check(await js(`!document.querySelector('[data-added]').hidden`), 'added confirmation shown');

  // 2. sale product x2
  await go(`${B}/buy/bathroom-safety/shower-stool`);
  await js(`(() => { const q = document.querySelector('#qty'); q.value = '2'; q.dispatchEvent(new Event('input')); document.querySelector('[data-add]').click(); })()`);
  check((await js(`document.querySelector('[data-cart-count]').textContent`)) === '3', 'cart badge counts 3 items');

  // 3. invalid date range is caught
  await go(`${B}/rent/cpm/cpm-machine-knee-hip`);
  await js(`(() => { const f = document.querySelector('#from'), t = document.querySelector('#to'); t.value = f.value; t.dispatchEvent(new Event('change')); })()`);
  check(/end date/.test(await js(`document.querySelector('[data-detail]').textContent`)), 'same start and end date is rejected in the UI');

  // 4. cart
  await go(`${B}/cart`);
  check(await waitFor(`document.querySelectorAll('.cart-line').length === 2`), 'cart lists 2 lines after reload');
  check((await js(`document.querySelector('[data-cart-sum]').textContent`)) === 'AED 1,197', 'cart total AED 1,197');
  const overflow = await js('document.documentElement.scrollWidth');
  check(overflow <= width, `cart has no horizontal scroll at ${width}px (${overflow})`);

  // 5. validation then submit
  await js(`document.querySelector('[data-order-form] button[type=submit]').click()`);
  check(await waitFor(`!document.querySelector('[data-order-err]').hidden`), 'empty form shows an error');
  await js(`(() => { const f = document.querySelector('[data-order-form]');
    f.name.value = 'E2E Test'; f.phone.value = '+971 50 000 0000'; f.area.value = 'Dubai Marina'; f.address.value = 'Tower 1, flat 101';
    f.querySelector('button[type=submit]').click(); })()`);
  check(await waitFor(`!!document.querySelector('.order-form .ok')`), 'thank you message after submit');
  check(telegram.length === 1, 'exactly one Telegram message');
  const text = telegram[0] ? telegram[0].text : '';
  check(/RENT Electric hospital bed, Home care frame, 2026-11-01 to 2026-12-01 \(30 d\): AED 945/.test(text), 'Telegram has the bed line');
  check(/BUY Shower stool x2: AED 252/.test(text), 'Telegram has the stool line');
  check(/Total before delivery: AED 1,197/.test(text), 'Telegram total AED 1,197');
  check((await js(`document.querySelector('[data-cart-count]').hidden`)) === true, 'cart emptied after order');
} finally {
  ws.close(); chrome.kill(); server.kill(); mock.close();
  await sleep(300);
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
const failed = checks.filter(([ok]) => !ok).length;
console.log(`${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
