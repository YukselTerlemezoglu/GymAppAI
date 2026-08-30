// superset.js birim testleri (gercek modul)
import { getSupersetChain, supersetPairIndex } from '../src/utils/superset.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.error('FAIL:', msg); } };

const day = (flags) => ({ exercises: flags.map((f, i) => ({ name: 'E' + i, supersetWithPrev: f })) });

// getSupersetChain
ok(JSON.stringify(getSupersetChain(day([false, false, false]), 1)) === '[1]', 'tek basina');
ok(JSON.stringify(getSupersetChain(day([false, true]), 0)) === '[0,1]', 'cift ilk eleman');
ok(JSON.stringify(getSupersetChain(day([false, true]), 1)) === '[0,1]', 'cift ikinci eleman');
ok(JSON.stringify(getSupersetChain(day([false, true, true]), 2)) === '[0,1,2]', '3lu zincir sonu');
ok(JSON.stringify(getSupersetChain(day([false, true, false, true]), 3)) === '[2,3]', 'ikinci cift');
ok(JSON.stringify(getSupersetChain(day([false, true, false, true]), 0)) === '[0,1]', 'ilk cift izole');
ok(JSON.stringify(getSupersetChain(null, 0)) === '[]', 'null day');
ok(JSON.stringify(getSupersetChain(day([false]), -1)) === '[]', 'negatif idx');
ok(JSON.stringify(getSupersetChain(day([false, true, true]), 99)) === '[]', 'tasan idx');

// supersetPairIndex
ok(supersetPairIndex(day([false, true]).exercises, 1) === 2, 'rozet A2');
ok(supersetPairIndex(day([false, true, false, true]).exercises, 3) === 2, 'ikinci cift rozet 2');
ok(supersetPairIndex(day([false, false]).exercises, 1) === 1, 'baglantisiz rozet 1');
ok(supersetPairIndex(day([false, true, true]).exercises, 2) === 3, '3lu zincir A3');

console.log(`SONUC: ${pass} basarili, ${fail} basarisiz`);
process.exit(fail > 0 ? 1 : 0);