// Mobile/desktop screenshots and horizontal overflow check through Chrome DevTools Protocol.
// node scripts/shot.mjs <outDir> <width> <url> [url...]   (prints "scrollWidth/width url" per page)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, widthArg, ...urls] = process.argv.slice(2);
const width = Number(widthArg);
const mobile = width < 900;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9300 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(outDir, '.chrome-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch { /* not up yet */ }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const waiting = new Map(); const events = [];
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); } else events.push(msg);
});
const send = (method, params = {}) => new Promise((r) => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 2 : 1, mobile });
let bad = 0;
for (const url of urls) {
  events.length = 0;
  await send('Page.navigate', { url });
  for (let i = 0; i < 50 && !events.some((e) => e.method === 'Page.loadEventFired'); i++) await sleep(100);
  await sleep(400);
  const r = await send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth', returnByValue: true });
  const sw = r.result.result.value;
  const h = (await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true })).result.result.value;
  await send('Emulation.setDeviceMetricsOverride', { width, height: Math.min(h, 6000), deviceScaleFactor: mobile ? 2 : 1, mobile });
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  await send('Emulation.setDeviceMetricsOverride', { width, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 2 : 1, mobile });
  const name = `${width}-${new URL(url).pathname.replace(/\W+/g, '_') || 'home'}.png`;
  fs.writeFileSync(path.join(outDir, name), Buffer.from(shot.result.data, 'base64'));
  if (sw > width) bad++;
  console.log(`${sw}/${width} ${sw > width ? 'OVERFLOW' : 'ok'} ${url} -> ${name}`);
}
ws.close();
await new Promise((r) => { chrome.once('exit', r); chrome.kill(); });
fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
process.exit(bad ? 1 : 0);
