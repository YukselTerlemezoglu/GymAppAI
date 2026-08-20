// i18n anahtar denetimi: koddaki t('key') cagrilarini tr.js/en.js ile karsilastirir.
// Kullanim: node scripts/check-i18n.mjs
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');

// tr.js / en.js iceriginden anahtarlari cek
function extractKeys(langFile) {
    const content = readFileSync(langFile, 'utf8');
    const keys = new Set();
    const re = /^\s{4}([a-zA-Z0-9_]+)\s*:/gm;
    let m;
    while ((m = re.exec(content)) !== null) keys.add(m[1]);
    return keys;
}

const trKeys = extractKeys(join(srcDir, 'i18n/tr.js'));
const enKeys = extractKeys(join(srcDir, 'i18n/en.js'));

// src altindaki tum .jsx/.js dosyalarini gez
const jsFiles = [];
(function walk(dir) {
    for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) {
            if (f === 'node_modules' || f === 'dist') continue;
            walk(p);
        } else if (/\.(jsx?|mjs)$/.test(f)) {
            jsFiles.push(p);
        }
    }
})(srcDir);

// t('key') ve t("key") cagrilarini topla
const used = new Map(); // key -> [dosyalar]
const callRe = /\bt\(\s*['"]([a-zA-Z0-9_]+)['"]\s*[,)]/g;
let missingContexts = 0;
for (const file of jsFiles) {
    if (file.includes('i18n')) continue;
    const content = readFileSync(file, 'utf8');
    let m;
    while ((m = callRe.exec(content)) !== null) {
        const key = m[1];
        if (!used.has(key)) used.set(key, []);
        used.get(key).push(file.split(/[\\/]/).pop());
    }
}

let errors = 0;
console.log('=== KODDA KULLANILIP SOZLUKTE OLMAYAN ANAHTARLAR ===');
for (const [key, files] of [...used.entries()].sort()) {
    const inTr = trKeys.has(key);
    const inEn = enKeys.has(key);
    if (!inTr || !inEn) {
        errors++;
        console.log(`YOK  ${key}  (tr:${inTr ? 'ok' : 'EKSIK'} en:${inEn ? 'ok' : 'EKSIK'})  <- ${[...new Set(files)].join(', ')}`);
    }
}
if (errors === 0) console.log('(temiz)');

console.log('\n=== TR/EN ARASI FARKLILIKLAR ===');
let diffCount = 0;
for (const k of trKeys) if (!enKeys.has(k)) { console.log(`EN'DE YOK: ${k}`); diffCount++; }
for (const k of enKeys) if (!trKeys.has(k)) { console.log(`TR'DE YOK: ${k}`); diffCount++; }
if (diffCount === 0) console.log('(temiz)');

console.log(`\nToplam kullanilan anahtar: ${used.size}, tr: ${trKeys.size}, en: ${enKeys.size}`);
console.log(`Eksik anahtar sayisi: ${errors}`);
process.exit(errors > 0 || diffCount > 0 ? 1 : 0);
