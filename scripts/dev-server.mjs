// Local preview: serves dist/ with clean URLs (like Vercel) and runs api/*.js.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z0-9-]/g, '');
    const file = path.join(ROOT, 'api', `${name}.js`);
    if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
    let raw = ''; for await (const c of req) raw += c;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    const shim = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      setHeader(k, v) { res.setHeader(k, v); },
      json(o) { res.writeHead(this.statusCode, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); },
    };
    delete require.cache[file];
    return require(file)(req, shim);
  }
  let p = decodeURIComponent(url.pathname);
  const candidates = p.endsWith('/') ? [path.join(p, 'index.html')] : [p, `${p}.html`, path.join(p, 'index.html')];
  for (const c of candidates) {
    const f = path.join(DIST, c);
    if (f.startsWith(DIST) && fs.existsSync(f) && fs.statSync(f).isFile()) {
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
      return;
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/html' }).end(fs.existsSync(path.join(DIST, '404.html')) ? fs.readFileSync(path.join(DIST, '404.html')) : 'Not found');
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
