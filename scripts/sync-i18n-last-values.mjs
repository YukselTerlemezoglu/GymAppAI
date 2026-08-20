// Eski (HEAD) i18n dosyasinda yinelenen anahtarlarin degerlerini karsilastirir.
// JS'te SON tanim kazandigi icin, korunmasi gereken deger "son"dur.
// Script mevcut dosyada yanlis deger varsa (ilk korunmus) duzeltir.
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const lang of ['tr', 'en']) {
    const rel = `src/i18n/${lang}.js`;
    const oldContent = execSync(`git show HEAD:${rel.replace(/\\/g, '/')}`, { cwd: root, encoding: 'utf8' });
    const oldLines = oldContent.split('\n');

    // eski dosyada anahtar -> son deger
    const lastValue = new Map();
    for (const line of oldLines) {
        const m = line.match(/^\s{4}([a-zA-Z0-9_]+)\s*:\s*(.+)$/);
        if (m) lastValue.set(m[1], m[2]);
    }

    // mevcut dosyada anahtar -> tek deger
    const file = join(root, rel);
    const curLines = readFileSync(file, 'utf8').split('\n');
    let fixes = 0;
    const out = curLines.map(line => {
        const m = line.match(/^(\s{4})([a-zA-Z0-9_]+)(\s*:\s*)(.+)$/);
        if (!m) return line;
        const key = m[2];
        const curVal = m[4];
        const oldVal = lastValue.get(key);
        if (oldVal && oldVal !== curVal) {
            fixes++;
            return `${m[1]}${key}${m[3]}${oldVal}`;
        }
        return line;
    });

    if (fixes > 0) writeFileSync(file, out.join('\n'), 'utf8');
    console.log(`${lang}.js: ${fixes} anahtarda deger eski (son tanim) haliyle senkronize edildi`);
}
