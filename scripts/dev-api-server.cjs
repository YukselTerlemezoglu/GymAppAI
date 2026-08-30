// Yerel gelistirme API sunucusu: /api/groq isteklerini gercek
// api/groq.js handler'ina yonlendirir. Sadece `npm run dev` sirasinda
// kullanilir; Vercel'de bu dosya rol oynamaz.
//
// Kullanim: node scripts/dev-api-server.cjs  (5174 portunu dinler)
// Vite dev proxy (vite.config.js) /api/groq -> http://localhost:5174/groq

const http = require('http');
const fs = require('fs');
const path = require('path');

// .env.local'daki GROQ_API_KEY'i bu prosese yukle (Vercel CLI olusturdu)
const envLocal = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envLocal)) {
  const lines = fs.readFileSync(envLocal, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const m = /^([A-Z0-9_]+)="(.*)"$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}


// api/groq.js ESM export ediyor; CJS icinden dinamik import ile yukle
const HANDLER_PATH = path.resolve(__dirname, '..', 'api', 'groq.js');

const PORT = Number(process.env.DEV_API_PORT || 5174);

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

(async () => {
  const mod = await import('file://' + HANDLER_PATH.replace(/\\/g, '/'));
  const handler = mod.default;
  if (typeof handler !== 'function') {
    console.error('[dev-api] api/groq.js default export bulunamadi');
    process.exit(1);
  }

  const server = http.createServer(async (req, res) => {
    const url = (req.url || '').split('?')[0];
    if (url !== '/groq') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bilinmeyen endpoint' }));
      return;
    }
    // Vercel benzeri req/res arayuzu:
    // - body elle parse edilir
    // - res.status() zincirlenebilir metodu eklenir (Vercel API)
    req.body = await readBody(req);
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (obj) => {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify(obj));
      return res;
    };
    try {
      await handler(req, res);
    } catch (err) {
      console.error('[dev-api] handler hatasi:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Sunucu hatasi' }));
    }
  });

  server.listen(PORT, () => {
    console.log(`[dev-api] /groq dinleniyor: http://localhost:${PORT}/groq`);
    console.log('[dev-api] GROQ_API_KEY var mi:', Boolean(process.env.GROQ_API_KEY));
  });
})();
