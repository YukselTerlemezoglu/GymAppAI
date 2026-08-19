const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const ALLOWED_KINDS = new Set(['program', 'nutrition']);

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(identifier) {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  if (!entry || now - entry.ts > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(identifier, { ts: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

function verifyFirebaseToken(idToken) {
  if (!idToken || typeof idToken !== 'string') return null;

  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    const uid = payload.user_id || payload.sub;
    if (!uid) return null;

    return { uid, email: payload.email || null };
  } catch {
    return null;
  }
}

function setCors(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST desteklenir.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY' || apiKey.length < 20) {
    console.error('GROQ_API_KEY eksik/geçersiz. Length:', apiKey?.length || 0);
    return res.status(500).json({
      error: 'AI servisi yapılandırılmamış.',
      detail: `GROQ_API_KEY env var tanımlı değil veya geçersiz. (current length: ${apiKey?.length || 0})`
    });
  }

  const body = req.body || {};

  const user = verifyFirebaseToken(body.idToken);
  if (!user) {
    return res.status(401).json({ error: 'Yetkisiz. Lütfen giriş yapın.' });
  }

  if (!checkRateLimit(user.uid)) {
    return res.status(429).json({ error: 'Çok fazla istek. Lütfen bir dakika bekleyin.' });
  }

  const { kind, systemPrompt, userPrompt, temperature } = body;
  if (!ALLOWED_KINDS.has(kind)) {
    return res.status(400).json({ error: 'Geçersiz istek türü.' });
  }
  if (typeof systemPrompt !== 'string' || systemPrompt.length === 0) {
    return res.status(400).json({ error: 'systemPrompt gerekli.' });
  }
  if (typeof userPrompt !== 'string' || userPrompt.length === 0) {
    return res.status(400).json({ error: 'userPrompt gerekli.' });
  }
  if (userPrompt.length > 8000) {
    return res.status(400).json({ error: 'userPrompt çok uzun.' });
  }

  const safeTemp = Number.isFinite(temperature) ? Math.min(1, Math.max(0, temperature)) : 0.5;

  const groqBody = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: safeTemp,
  };

  let groqResp;
  try {
    groqResp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(groqBody),
    });
  } catch (err) {
    console.error('Groq fetch hatası:', err);
    return res.status(502).json({ error: 'AI servisine ulaşılamadı.' });
  }

  if (!groqResp.ok) {
    let detail = '';
    try {
      const errData = await groqResp.json();
      detail = errData?.error?.message || '';
    } catch {
      /* json değilse yok say */
    }
    console.error(`Groq HTTP ${groqResp.status}: ${detail}`);

    if (groqResp.status === 429) {
      return res.status(429).json({ error: 'AI servisi quota aşımı. Lütfen birazdan tekrar deneyin.' });
    }
    return res.status(502).json({ error: `AI servisi hatası (${groqResp.status}).`, detail });
  }

  const result = await groqResp.json();
  const content = result?.choices?.[0]?.message?.content;

  if (!content) {
    return res.status(502).json({ error: 'AI geçerli bir içerik üretmedi.' });
  }

  const cleaned = String(content)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  return res.status(200).json({ content: cleaned });
}
