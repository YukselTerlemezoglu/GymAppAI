// i18n dosyalarindaki yinelenen anahtarlari temizler (ilk tanim korunur).
// Kullanim: node scripts/dedupe-i18n.mjs
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const lang of ['tr', 'en']) {
    const file = join(root, 'src/i18n', `${lang}.js`);
    const lines = readFileSync(file, 'utf8').split('\n');
    const seen = new Set();
    const out = [];
    let removed = 0;

    for (const line of lines) {
        const m = line.match(/^(\s{4})([a-zA-Z0-9_]+)(\s*:.*)$/);
        if (m) {
            if (seen.has(m[2])) {
                removed++;
                continue; // yinelenen satiri atla
            }
            seen.add(m[2]);
        }
        out.push(line);
    }

    writeFileSync(file, out.join('\n'), 'utf8');
    console.log(`${lang}.js: ${removed} yinelenen anahtar silindi, ${seen.size} benzersiz anahtar kaldi`);
}
