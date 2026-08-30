// tr.js / en.js anahtar paritesi kontrolu
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tr = require('../src/i18n/tr.js');
const en = require('../src/i18n/en.js');
const flatten = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' && v !== null) ? flatten(v, prefix + k + '.') : [prefix + k]);
const trKeys = new Set(flatten(tr.default || tr));
const enKeys = new Set(flatten(en.default || en));
const missingInEn = [...trKeys].filter(k => !enKeys.has(k));
const missingInTr = [...enKeys].filter(k => !trKeys.has(k));
console.log('TR:', trKeys.size, 'EN:', enKeys.size);
if (missingInEn.length) console.log('EN eksik:', missingInEn.join(', '));
if (missingInTr.length) console.log('TR eksik:', missingInTr.join(', '));
if (!missingInEn.length && !missingInTr.length) console.log('PARITE OK');
process.exit((missingInEn.length || missingInTr.length) ? 1 : 0);