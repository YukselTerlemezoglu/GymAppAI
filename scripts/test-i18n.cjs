/*
 * I18N TUTARLILIK TESTI
 * 1) tr ve en ayni anahtar kumesine mi sahip?
 * 2) Kodda t('...') ile kullanilan anahtarlar her iki dosyada var mi?
 */
const fs = require('fs');
const path = require('path');

// --- i18n dosyalarindan anahtarlari cek (dosya bir module; eval yerine regex) ---
const extractKeys = (file) => {
    const c = fs.readFileSync(file, 'utf8');
    const keys = new Set();
    // "    key_name: ..." veya " key_name: " desenleri (nested olmadigi varsayimi)
    const re = /^\s{4}([a-zA-Z0-9_]+)\s*:/gm;
    let m;
    while ((m = re.exec(c)) !== null) keys.add(m[1]);
    return keys;
};

const trKeys = extractKeys('src/i18n/tr.js');
const enKeys = extractKeys('src/i18n/en.js');

const onlyTr = [...trKeys].filter(k => !enKeys.has(k));
const onlyEn = [...enKeys].filter(k => !trKeys.has(k));

console.log('TR anahtar sayisi:', trKeys.size);
console.log('EN anahtar sayisi:', enKeys.size);
if (onlyTr.length) console.log('SADECE TR:', onlyTr.join(', '));
if (onlyEn.length) console.log('SADECE EN:', onlyEn.join(', '));
if (!onlyTr.length && !onlyEn.length) console.log('OK: tr/en anahtar kumeleri esit');

// --- Kodda kullanilan t('anahtar') cagrilari ---
const srcDir = 'src';
const usedKeys = new Map(); // key -> [dosyalar]
const walk = (dir) => {
    for (const f of fs.readdirSync(dir)) {
        const fp = path.join(dir, f);
        const st = fs.statSync(fp);
        if (st.isDirectory()) { if (f !== 'node_modules') walk(fp); continue; }
        if (!/\.(js|jsx)$/.test(f)) continue;
        if (f === 'tr.js' || f === 'en.js') continue;
        const c = fs.readFileSync(fp, 'utf8');
        const re = /\bt\(\s*['"]([a-zA-Z0-9_]+)['"]/g;
        let m;
        while ((m = re.exec(c)) !== null) {
            const k = m[1];
            if (!usedKeys.has(k)) usedKeys.set(k, []);
            usedKeys.get(k).push(path.relative('src', fp));
        }
    }
};
walk(srcDir);

let missing = 0;
for (const [k, files] of usedKeys) {
    const inTr = trKeys.has(k);
    const inEn = enKeys.has(k);
    if (!inTr || !inEn) {
        missing++;
        console.log(`EKSIK: ${k} (tr:${inTr} en:${inEn}) -> ${[...new Set(files)].slice(0, 3).join(', ')}`);
    }
}
console.log(`Kullanilan anahtar: ${usedKeys.size}, eksik: ${missing}`);
if (missing === 0) console.log('OK: tum kullanilan anahtarlar tanimli');
