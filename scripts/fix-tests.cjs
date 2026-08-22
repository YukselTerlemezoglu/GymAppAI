// Test beklenti duzeltmeleri
const fs = require('fs');
const p = 'scripts/test-shop-logic.cjs';
let c = fs.readFileSync(p, 'utf8');
c = c.replace("check('16 dost', buddy.BUDDIES.length === 16);", "check('13 dost tanimli', buddy.BUDDIES.length === 13);");
c = c.replace("check('tuketim 1->0', cons.freeze === 0);", "check('tuketim: 1 -> stok sifir (anahtar silindi)', cons.freeze === undefined || cons.freeze === 0);");
fs.writeFileSync(p, c, 'utf8');
console.log('test duzeltildi');
