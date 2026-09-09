// Derleme oncesi: .env'deki Firebase config'i public/firebase-messaging-sw.js
// icine guvenli sekilde enjekte eder (apiKey vb. istemci tarafinda zaten
// herkese acik degerlerdir; FCM VAPID/server key ASLA buraya konmaz).
// Kullanim: node scripts/gen-fcm-sw.mjs  (vite build oncesi otomatik)

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envFile = path.join(root, '.env');
const swPath = path.join(root, 'public', 'firebase-messaging-sw.js');

// .env oku (basit parse; dotenv sorgusu yok)
const env = {};
if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
        const m = /^([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}

const cfg = {
    apiKey: env.VITE_FIREBASE_API_KEY || env.VITE_FB_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || ''
};

if (!cfg.projectId) {
    console.log('gen-fcm-sw: Firebase config bulunamadi; SW sabilon olarak birakildi.');
    process.exit(0);
}

const tpl = `const firebaseConfig = ${JSON.stringify(cfg, null, 2)};\n`;

let sw = fs.readFileSync(swPath, 'utf8');
// eskiden enjekte edilmis sabiti kaldir (idempotent)
sw = sw.replace(/^\/\/ FCM-CONFIG-START[\s\S]*?^\/\/ FCM-CONFIG-END\r?\n/m, '');
sw = `// FCM-CONFIG-START (otomatik uretildi, elle degistirmeyin)\n${tpl}// FCM-CONFIG-END\n` + sw;

fs.writeFileSync(swPath, sw, 'utf8');
console.log(`gen-fcm-sw: ${cfg.projectId} icin config enjekte edildi.`);
