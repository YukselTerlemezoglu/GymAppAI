// STANDART push endpoint - Firebase ID token ile dogrulanir, FCM v1 API ile gonderir.
// Kilavuz: Firebase ID token Authorization: Bearer <idToken> olarak gelir.
// JWT dogrulama Firebase Admin SDK yerine JWKS + WebCrypto ile yapilir
// (firebase-admin serverless bundle'i cok sisirir; ayni guvenlik, sifir bagimlilik).
//
// GONDERIM: FCM HTTP v1 API (legacy /fcm/send 2024'te kapatildi; key= anahtarlari
// artik calismaz). v1 OAuth2 bearer token ister; token service account JWT'si
// imzalanarak mint edilir (RS256, WebCrypto). Sunucuda firebase-admin GEREKMEZ.
//
// Gerekli ortam degiskeni (Vercel > Settings > Environment Variables):
//   FIREBASE_SERVICE_ACCOUNT = service account JSON'un tam metni
//     (Firebase console > Proje ayarlari > Service accounts > "Generate new private key")
//     Iceren: project_id, client_email, private_key
//
// env yoksa endpoint 503 doner (push_disabled) - istemci bunu "sunucu kapali"
// olarak gosterir; uygulamanin diger kisimlari etkilenmez.

export default async function handler(req, res) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const authHeader = req.headers.authorization || '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!jwt) return res.status(401).json({ error: 'unauthorized' });

    const uid = await verifyFirebaseToken(jwt);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });

    // v1: istemci kendi FCM token'ini gonderir (Firestore sorgusu gerekmez)
    const { token: fcmToken, title, body, tag, url } = req.body || {};
    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length > 512) {
        return res.status(400).json({ error: 'bad_request' });
    }

    const accessToken = await getFcmAccessToken();
    if (!accessToken) return res.status(503).json({ error: 'push_disabled' });

    const projectId = getProjectId();

    // FCM v1 data-only mesaj: bildirim tarayici SW'inde vanilla "push" eventi
    // olarak cozulur (data.data || data). notification alanı kullanilmaz;
    // boylece client SDK ve gomulu config gereksinimi olmaz.
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            message: {
                token: fcmToken,
                data: {
                    title: String(title || 'GymApp AI'),
                    body: String(body || ''),
                    tag: String(tag || 'gymapp-push'),
                    url: String(url || '/')
                }
            }
        })
    });

    if (!r.ok) return res.status(502).json({ error: 'fcm_error', status: r.status });
    return res.status(200).json({ sent: 1 });
}

// ---- FCM v1 OAuth2 (service account JWT -> access token) ----

const b64url = (buf) => Buffer.from(buf).toString('base64url');
let saCache = null;

function serviceAccount() {
    if (saCache !== null) return saCache;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) { saCache = undefined; return undefined; }
    try {
        // Vercel env'lerde yeni satirlar \\n olarak gelir - gercek PEM'e cevir
        const normalized = raw.replace(/\\n/g, '\n');
        saCache = JSON.parse(normalized);
    } catch { saCache = undefined; }
    return saCache;
}

function getProjectId() {
    const sa = serviceAccount();
    return sa ? sa.project_id : null;
}

// Access token cache (1 saat gecerli, 60sn erken yenileme payi)
let tokenCache = { token: null, exp: 0 };

async function getFcmAccessToken() {
    const sa = serviceAccount();
    if (!sa || !sa.client_email || !sa.private_key || !sa.project_id) return null;

    const now = Math.floor(Date.now() / 1000);
    if (tokenCache.token && tokenCache.exp > now + 60) return tokenCache.token;

    try {
        const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
        const claims = b64url(JSON.stringify({
            iss: sa.client_email,
            scope: 'https://www.googleapis.com/auth/firebase.messaging',
            aud: 'https://oauth2.googleapis.com/token',
            iat: now,
            exp: now + 3600
        }));
        const unsigned = `${header}.${claims}`;

        // PKCS8 PEM -> ArrayBuffer
        const pemBody = sa.private_key
            .replace(/-----BEGIN PRIVATE KEY-----/, '')
            .replace(/-----END PRIVATE KEY-----/, '')
            .replace(/\s+/g, '');
        const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

        const key = await crypto.subtle.importKey(
            'pkcs8',
            der,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const sigBuf = await crypto.subtle.sign(
            'RSASSA-PKCS1-v1_5',
            key,
            new TextEncoder().encode(unsigned)
        );
        const assertion = `${unsigned}.${Buffer.from(sigBuf).toString('base64url')}`;

        const resp = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`
        });
        if (!resp.ok) return null;
        const j = await resp.json();
        if (!j.access_token) return null;
        tokenCache = { token: j.access_token, exp: now + Number(j.expires_in || 3600) };
        return tokenCache.token;
    } catch {
        return null;
    }
}

// ---- Firebase ID token dogrulama (JWKS, firebase-admin'siz) ----
let jwksCache = { keys: null, at: 0 };

async function getJwks(force = false) {
    if (!force && jwksCache.keys && Date.now() - jwksCache.at < 3600_000) return jwksCache.keys;
    const resp = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
    if (!resp.ok) throw new Error('jwks_failed');
    const data = await resp.json();
    jwksCache = { keys: data.keys, at: Date.now() };
    return data.keys;
}

async function verifyFirebaseToken(jwt) {
    try {
        const [rHead, rBody, rSig] = jwt.split('.');
        if (!rHead || !rBody || !rSig) return null;
        const b64d = (s) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
        const header = b64d(rHead);
        const payload = b64d(rBody);
        if (header.alg !== 'RS256') return null;

        let jwk = (await getJwks()).find((k) => k.kid === header.kid);
        if (!jwk) jwk = (await getJwks(true)).find((k) => k.kid === header.kid);
        if (!jwk) return null;

        const key = await crypto.subtle.importKey(
            'jwk', jwk,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false, ['verify']
        );
        const ok = await crypto.subtle.verify(
            'RSASSA-PKCS1-v1_5', key,
            Buffer.from(rSig, 'base64url'),
            Buffer.from(`${rHead}.${rBody}`)
        );
        if (!ok) return null;

        const projectId = getProjectId();
        if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
        if (payload.aud !== projectId) return null;
        if (payload.exp * 1000 < Date.now()) return null;
        return payload.user_id || null;
    } catch {
        return null;
    }
}
