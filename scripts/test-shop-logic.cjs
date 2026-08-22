/*
 * DUKKAN MANTIGI BIRIM TESTLERI (v3)
 * ESM -> CJS: export isimleri otomatik toplanir, bagimliliklar recursif cozulur.
 */
const fs = require('fs');
const path = require('path');

const moduleCache = new Map();

function loadModule(file) {
    if (moduleCache.has(file)) return moduleCache.get(file);
    let c = fs.readFileSync(file, 'utf8');

    // import ... from '...' -> bagimlilik
    const deps = [];
    const importRe = /^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm;
    let m;
    while ((m = importRe.exec(c)) !== null) {
        const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
        const spec = m[2];
        const depPath = path.join(path.dirname(file), spec);
        deps.push({ names, depPath });
    }
    c = c.replace(importRe, '');
    c = c.replace(/^import .*$/gm, '');

    // export isimlerini topla
    const exportNames = [];
    const expRe = /^export (?:const|function|let) ([A-Za-z0-9_]+)/gm;
    while ((m = expRe.exec(c)) !== null) exportNames.push(m[1]);
    c = c.replace(/^export (const|function|let) /gm, '$1 ');

    // bagimlilik prelude
    let prelude = '';
    for (const d of deps) {
        loadModule(d.depPath);
        prelude += 'const { ' + d.names.join(', ') + ' } = __D' + deps.indexOf(d) + '__;\n';
    }

    const mod = { exports: {} };
    moduleCache.set(file, mod.exports);
    const body = prelude + c + '\nmodule.exports = {' + exportNames.join(', ') + '};';
    const fn = new Function('module', 'exports', 'require', ...deps.map((d, i) => '__D' + i + '__'), body);
    fn(mod, mod.exports, require, ...deps.map(d => moduleCache.get(d.depPath)));
    moduleCache.set(file, mod.exports);
    return mod.exports;
}

let pass = 0, fail = 0;
const check = (name, cond) => {
    if (cond) { pass++; console.log('  PASS:', name); }
    else { fail++; console.log('  FAIL:', name); }
};

console.log('--- gacha.js ---');
const gacha = loadModule('src/utils/gacha.js');

// 1) Yumurta epic pity
let pity = {};
for (let i = 0; i < gacha.EGG_PITY_EPIC - 1; i++) {
    const r = gacha.openEgg(pity, () => 0.0);
    pity = gacha.updateEggPity(pity, r);
}
const forced = gacha.openEgg(pity, () => 0.0);
check('yumurta pity epic+ garanti', forced.rarity === 'epic' || forced.rarity === 'legendary');

// 2) Yumurta legendary pity 30 icinde
let pity2 = {};
let sawLeg = false;
for (let i = 0; i < gacha.EGG_PITY_LEGENDARY; i++) {
    const r = gacha.openEgg(pity2, () => 0.999999);
    pity2 = gacha.updateEggPity(pity2, r);
    if (r.rarity === 'legendary') sawLeg = true;
}
check('yumurta legendary pity', sawLeg === true);

// 3) Cark free kullanildi
const ws1 = gacha.updateWheelState(null, true);
check('free kullanildi', gacha.getWheelState(ws1).freeAvailable === false);
check('ayni gun extra var', gacha.getWheelState(ws1).extraLeft > 0);

// 4) Ekstra siniri
let ws3 = { day: gacha.todayKey(), lastFreeSpin: gacha.todayKey(), extraSpins: 0 };
for (let i = 0; i < 10; i++) ws3 = gacha.updateWheelState(ws3, false);
check('ekstra tukendi', gacha.getWheelState(ws3).extraLeft === 0);

// 5) Yeni gun reset
const wsOld = { day: '2000-01-01', lastFreeSpin: '2000-01-01', extraSpins: 5 };
check('yeni gun -> free reset', gacha.getWheelState(wsOld).freeAvailable === true && gacha.getWheelState(wsOld).extraLeft > 0);

// 6) Kutu pity
let cp = {};
let lastR = null;
for (let i = 0; i < gacha.CHEST_PITY_EPIC; i++) {
    lastR = gacha.openChest(cp, [], () => 0.0);
    cp = gacha.updateChestPity(cp, lastR);
}
check('kutu pity epic+', lastR.rarity === 'epic' || lastR.rarity === 'legendary');

// 7) Cark sonuc yapisı
const spin = gacha.spinWheel(() => 0.5);
check('cark sonucu gecerli', spin.segmentIndex >= 0 && spin.segmentIndex < gacha.WHEEL_SEGMENTS.length && !!spin.rarity);

// 8) Kutu deterministik
const chestC = gacha.openChest({}, [], () => 0.0);
check('kutu random=0 -> common', chestC.rarity === 'common');

console.log('--- buddy.js ---');
const buddy = loadModule('src/utils/buddy.js');

check('13 dost tanimli', buddy.BUDDIES.length === 13);

const T = buddy.EVOLUTION_STAGES.map(s => s.threshold);
let col = { bud_common_1: { xp: T[1] - 10 } };
const res1 = buddy.addBuddyXp(col, 'bud_common_1', 20);
check('evrim tespit edildi', res1.evolved === true);
check('evrim xp dogru', res1.xp === T[1] + 10);

const res2 = buddy.addBuddyXp(col, 'bud_common_1', 5);
check('evrim yoksa false', res2.evolved === false);

let col2 = { bud_common_1: { xp: 0 } };
const res3 = buddy.addBuddyXp(col2, 'bud_common_1', T[3] + 50);
check('coklu evrim tespit', res3.evolved === true);

check('koleksiyon sayisi', buddy.collectionCount({ a: {}, b: {} }) === 2);

const g1 = buddy.buddyGainFromWorkout(100, 'legendary');
const g2 = buddy.buddyGainFromWorkout(100, 'common');
check('nadirlik carpani (leg>=common, common>0)', g1 >= g2 && g2 > 0);

console.log('--- inventory.js ---');
const inv = loadModule('src/utils/inventory.js');

let inv1 = {};
let coins = 10000;
const freeze = { id: 'freeze', price: 150, maxStock: 2 };
const b1 = inv.buyBoost(coins, inv1, 'freeze', freeze);
check('boost 1 alindi', b1.ok === true);
inv1 = b1.inventory; coins = b1.coins;
const b2 = inv.buyBoost(coins, inv1, 'freeze', freeze);
check('boost 2 alindi', b2.ok === true);
inv1 = b2.inventory; coins = b2.coins;
const b3 = inv.buyBoost(coins, inv1, 'freeze', freeze);
check('stok siniri (max 2)', b3.ok === false && b3.reason === 'stock');

const b4 = inv.buyBoost(10, {}, 'freeze', freeze);
check('yetersiz coin red', b4.ok === false && b4.reason === 'coins');

check('coin dogru dustu', coins === 10000 - 300);

let inv2 = { freeze: 1 };
const cons = inv.consumeBoost(inv2, 'freeze');
check('tuketim: 1 -> stok sifir (anahtar silindi)', cons.freeze === undefined || cons.freeze === 0);
const consNull = inv.consumeBoost({ freeze: 0 }, 'freeze');
check('0 stokta tuketim null', consNull === null);

let owned = [];
let act = {};
const buy1 = inv.buyCosmetic(10000, owned, 'name_gold');
check('kozmetik alindi', buy1.ok === true);
owned = buy1.owned;
check('coin dustu (300)', buy1.coins === 9700);
const rebuy = inv.buyCosmetic(buy1.coins, owned, 'name_gold');
check('tekrar alinamaz', rebuy.ok === false && rebuy.reason === 'owned');
act = inv.setCosmeticActive(act, 'name_gold');
check('isim stili kusandi', inv.getActive(act, owned, 'nameStyle')?.id === 'name_gold');
act = inv.clearCosmeticActive(act, 'nameStyle');
check('isim stili cikarildi', inv.getActive(act, owned, 'nameStyle') === null);

const ghost = inv.getActive({ nameStyle: 'name_flame' }, owned, 'nameStyle');
check('sahip olunmayan aktif olamaz', ghost === null);

console.log('--- sounds.js ---');
global.window = undefined;
const sounds = loadModule('src/utils/sounds.js');
let threw = false;
try { sounds.playSound('buy'); sounds.playSound('nonexistent'); } catch (e) { threw = true; }
check('playSound guvenli', threw === false);

console.log('--- ShopPage sabitleri ---');
const sp = fs.readFileSync('src/components/shop/ShopPage.jsx', 'utf8');
const packMatch = sp.match(/const EGG_PACK = \{ count: (\d+), payFor: (\d+) \}/);
check('EGG_PACK 10/9', !!packMatch && packMatch[1] === '10' && packMatch[2] === '9');
check('eski fiyat cizili', sp.includes('line-through'));
check('handleOpenEgg(count)', /handleOpenEgg = async \(count = 1\)/.test(sp));
check('multiEgg isleniyor', sp.includes("type: 'multiEgg'"));
check('x1/x5/x10 secici', sp.includes('[1, 5, 10]'));

console.log('');
console.log('=================================');
console.log(`SONUC: ${pass} PASS, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
