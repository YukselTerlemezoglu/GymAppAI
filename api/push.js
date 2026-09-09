// POST /api/push - kayitli FCM token'larina bildirim gonderir (v1).
// Kimlik: Firebase ID token (Authorization: Bearer). v1 kapsamda yalnizca
// "kendi token'ina test bildirimi" akisi desteklenir; toplu cron gonderimi
// icin firebase-admin + Node runtime gerekir (v2 backlog).
//
// Env: FCM_SERVER_KEY yoksa endpoint 503 dondurur (ozellik sessiz kapali).

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) return res.status(503).json({ error: 'push_disabled' });

    const authHeader = req.headers.authorization || '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!jwt) return res.status(401).json({ error: 'unauthorized' });

    const uid = await verifyFirebaseToken(jwt);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });

    // v1: istemci kendi FCM token'ini gonderir (Firestore sorgusu gerekmez)
    const { token: fcmToken, title, body, tag } = req.body || {};
    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length > 512) {
        return res.status(400).json({ error: 'bad_request' });
    }

    const r = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `key=${serverKey}` },
        body: JSON.stringify({
            to: fcmToken,
            data: {
                title: String(title || 'GymApp AI'),
                body: String(body || ''),
                tag: String(tag || 'gymapp-push')
            }
        })
    });

    if (!r.ok) return res.status(502).json({ error: 'fcm_error', status: r.status });
    return res.status(200).json({ sent: 1 });
}

// --- Firebase ID token dogrulama (api/groq.js ile ayni yontem) ---
const _jwksCache = { at: 0, keys: null };

async function getJwks(force = false) {
    if (!force && _jwksCache.keys && Date.now() - _jwksCache.at < 3600_000) return _jwksCache.keys;
    const res = await fetch('https://www.googleapis.com/service_accounts/v1/jwks/securetoken@system.gserviceaccount.com');
    if (!res.ok) throw new Error('jwks fetch failed');
    const data = await res.json();
    _jwksCache.at = Date.now();
    _jwksCache.keys = data.keys || [];
    return _jwksCache.keys;
}

async function verifyFirebaseToken(jwt) {
    try {
        const [hRaw, pRaw] = jwt.split('.');
        const header = JSON.parse(Buffer.from(hRaw, 'base64url').toString('utf8'));
        if (header.alg !== 'RS256') return null;

        let jwk = (await getJwks()).find(k => k.kid === header.kid);
        if (!jwk) {
            const fresh = await getJwks(true);
            jwk = fresh.find(k => k.kid === header.kid);
        }
        if (!jwk) return null;

        const { crypto } = await import('node:crypto');
        const keyObj = crypto.createPublicKey({ key: jwk, format: 'jwk' });
        const ok = crypto.verify('RSA-SHA256', Buffer.from(`${hRaw}.${pRaw}`), keyObj, Buffer.from(jwt.split('.')[2], 'base64url'));
        if (!ok) return null;

        const payload = JSON.parse(Buffer.from(pRaw, 'base64url').toString('utf8'));
        const project = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
        if (!project) return null;
        if (payload.iss !== `https://securetoken.google.com/${project}`) return null;
        if (payload.aud !== project) return null;
        if (payload.exp * 1000 < Date.now()) return null;
        return payload.user_id || null;
    } catch {
        return null;
    }
}