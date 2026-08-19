// Gercek Firebase token ile verifyFirebaseToken yerel testi
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const token = readFileSync(join(tmpdir(), 'diag_token.txt'), 'utf8').trim();
if (!token) { console.log('TOKEN YOK'); process.exit(1); }

const FIREBASE_PROJECT_ID = 'gymappai';

function base64UrlToBuffer(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64');
}

let jwksCache = { keys: null, fetchedAt: 0 };

async function getJwks() {
  if (jwksCache.keys && Date.now() - jwksCache.fetchedAt < 3600000) return jwksCache.keys;
  const resp = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  if (!resp.ok) throw new Error(`JWKS fetch failed: ${resp.status}`);
  const data = await resp.json();
  jwksCache = { keys: data.keys || [], fetchedAt: Date.now() };
  return jwksCache.keys;
}

async function verify(idToken, debug = false) {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return { ok: false, reason: 'parca sayisi' };
    const [headerB64, payloadB64, signatureB64] = parts;

    const header = JSON.parse(base64UrlToBuffer(headerB64).toString('utf-8'));
    const payload = JSON.parse(base64UrlToBuffer(payloadB64).toString('utf-8'));

    if (debug) {
      console.log('header:', JSON.stringify(header));
      console.log('payload iss:', payload.iss);
      console.log('payload aud:', payload.aud);
      console.log('payload exp:', payload.exp, 'now:', Math.floor(Date.now() / 1000));
      console.log('typ kontrol:', header.typ, '===', header.typ === 'JWT');
    }

    if (header.alg !== 'RS256') return { ok: false, reason: 'alg != RS256' };
    if (header.typ !== 'JWT') return { ok: false, reason: `typ: ${header.typ}` };
    const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
    if (payload.iss !== expectedIssuer) return { ok: false, reason: `iss: ${payload.iss}` };
    if (payload.aud !== FIREBASE_PROJECT_ID) return { ok: false, reason: `aud: ${payload.aud}` };

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now - 60) return { ok: false, reason: 'exp gecmis' };
    if (payload.iat && payload.iat > now + 60) return { ok: false, reason: 'iat gelecekte' };

    const jwks = await getJwks();
    const jwk = jwks.find(k => k.kid === header.kid);
    if (!jwk) return { ok: false, reason: `kid yok: ${header.kid}` };

    const { createPublicKey, createVerify } = await import('node:crypto');
    const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToBuffer(signatureB64);
    const isValid = verifier.verify(publicKey, signature);
    if (!isValid) return { ok: false, reason: 'imza gecersiz' };

    const uid = payload.user_id || payload.sub;
    if (!uid) return { ok: false, reason: 'uid yok' };
    return { ok: true, uid, email: payload.email };
  } catch (e) {
    return { ok: false, reason: 'exception: ' + e.message };
  }
}

const result = await verify(token, true);
console.log('\nSONUC:', JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
