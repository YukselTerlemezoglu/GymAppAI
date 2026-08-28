/*
 * DUKKAN EKONOMISI TESTLERI
 * Calistirma: node scripts/test-shop-economy.mjs
 *
 * Kapsam:
 *  1. Envanter: boost satin alma / stok siniri / tuketim
 *  2. Kozmetik: satin alma / sahiplik / kusanma
 *  3. Gacha: yumurata + kutu olasilik dagilimi (100k cekilis)
 *  4. Pity: kutu 10'da epic+, yumurta 10'da epic+, 30'da legendary garanti
 *  5. Evrim: esik gecisleri + dupe donusumu
 *  6. Cark: gunluk ucretsiz + ekstra siniri
 */

import { buyBoost, canBuyBoost, consumeBoost, buyCosmetic, ownsCosmetic, setCosmeticActive, clearCosmeticActive, getActive } from '../src/utils/inventory.js';
import { BOOSTS, ALL_COSMETICS } from '../src/data/shopItems.js';
import { openEgg, updateEggPity, openChest, updateChestPity, spinWheel, getWheelState, updateWheelState, WHEEL_EXTRA_MAX } from '../src/utils/gacha.js';
import { BUDDIES, addBuddyXp, stageOf, getBuddyStageInfo, buddyGainFromWorkout, DUPE_XP, EVOLUTION_STAGES } from '../src/utils/buddy.js';
import { calcWeeklyStreak } from '../src/utils/consistency.js';

let passed = 0, failed = 0;
const ok = (cond, name) => {
    if (cond) { passed++; console.log(`  ✓ ${name}`); }
    else { failed++; console.error(`  ✗ ${name}`); }
};

// Yardimci: n gun once tarih
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

// Tarih -> ISO benzeri gun anahtari (consistency.js ile ayni mantik yerel)
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

console.log('\n=== 1. ENVANTER (boost) ===');
{
    const freeze = BOOSTS.find(b => b.id === 'freeze');
    ok(freeze.price === 150 && freeze.maxStock === 2, 'Dondurucu: 150 jeton, max 2 stok');

    let coins = 1000, inv = {};
    const r1 = buyBoost(coins, inv, 'freeze');
    ok(r1.ok && r1.inventory.freeze === 1 && r1.coins === 850, 'Satin alma: stok 1, jeton 850');

    const r2 = buyBoost(r1.coins, r1.inventory, 'freeze');
    ok(r2.ok && r2.inventory.freeze === 2, 'Ikinci satin alma: stok 2');

    const r3 = buyBoost(r2.coins, r2.inventory, 'freeze');
    ok(!r3.ok && r3.reason === 'stock', 'Ucuncu satin alma reddi: stok siniri');

    const after = consumeBoost(r2.inventory, 'freeze');
    ok(after.freeze === 1, 'Tuketim: stok 2 -> 1');

    const after2 = consumeBoost(after, 'freeze');
    ok(!('freeze' in after2), 'Tuketim: stok 1 -> 0 (anahtar silinir)');

    ok(consumeBoost(after2, 'freeze') === null, 'Bos stokta tuketim null doner');

    const poor = buyBoost(10, {}, 'freeze');
    ok(!poor.ok && poor.reason === 'coins' && poor.needed === 140, 'Yetersiz jeton: needed=140');
}

console.log('\n=== 2. KOZMETIK ===');
{
    const goldFrame = ALL_COSMETICS.find(c => c.id === 'frame_gold');
    ok(goldFrame.price === 500, 'Altin cerceve 500 jeton (v2 ekonomi)');

    let coins = 600, owned = [];
    const r1 = buyCosmetic(coins, owned, 'frame_gold');
    ok(r1.ok && ownsCosmetic(r1.owned, 'frame_gold') && r1.coins === 100, 'Satin alma + sahiplik');

    const r2 = buyCosmetic(r1.coins, r1.owned, 'frame_gold');
    ok(!r2.ok && r2.reason === 'owned', 'Sahip olunan tekrar alinamaz');

    // Kusanma
    let active = setCosmeticActive({}, 'frame_gold');
    ok(active.frame === 'frame_gold', 'Kusanma: frame=frame_gold');
    active = clearCosmeticActive(active, 'frame');
    ok(!('frame' in active), 'Cikarma: frame yok');
    ok(getActive({ frame: 'frame_gold' }, ['frame_gold'], 'frame')?.id === 'frame_gold', 'getActive dogru tanimi dondurur');
    ok(getActive({ frame: 'frame_gold' }, [], 'frame') === null, 'getActive sahiplik yoksa null');
}

console.log('\n=== 3. GACHA DAGILIM (100.000 cekilis) ===');
{
    // Yumurta nadirlik dagilimi
    const N = 100000;
    const eggCount = { common: 0, rare: 0, epic: 0, legendary: 0 };
    let pity = {};
    for (let i = 0; i < N; i++) {
        const r = openEgg(pity);
        eggCount[r.rarity]++;
        pity = updateEggPity(pity, r);
    }
    const pct = (n) => (n / N * 100).toFixed(2) + '%';
    console.log(`  Yumurta: common=${pct(eggCount.common)} rare=${pct(eggCount.rare)} epic=${pct(eggCount.epic)} legendary=${pct(eggCount.legendary)}`);
    ok(eggCount.common / N > 0.45 && eggCount.common / N < 0.62, 'Yumurta common ~%55 (pity ile biraz dusuk)');
    ok(eggCount.legendary / N > 0.025 && eggCount.legendary / N < 0.06, 'Yumurta legendary ~%3-5');

    // Kutu
    const chestCount = { common: 0, rare: 0, epic: 0, legendary: 0 };
    let types = { xp: 0, coins: 0, buddyXp: 0, snack: 0, cosmetic: 0, jackpot: 0 };
    let cpity = {};
    for (let i = 0; i < N; i++) {
        const r = openChest(cpity, []);
        chestCount[r.rarity]++;
        types[r.type] = (types[r.type] || 0) + 1;
        cpity = updateChestPity(cpity, r);
    }
    console.log(`  Kutu: common=${pct(chestCount.common)} rare=${pct(chestCount.rare)} epic=${pct(chestCount.epic)} legendary=${pct(chestCount.legendary)}`);
    console.log(`  Kutu tipleri: ${JSON.stringify(types)}`);
    ok(chestCount.common / N > 0.5 && chestCount.common / N < 0.65, 'Kutu common ~%60 (pity etkisiyle hafif dusuk)');
    ok(types.jackpot / N > 0.015 && types.jackpot / N < 0.035, 'Jackpot ~%2-3');
    ok(types.cosmetic > 0, 'Kutudan kozmetik dusebiliyor');

    // Kutu kozmetik sahiplik kontrolu: sahi olunmayan secilir
    const allOwned = ALL_COSMETICS.map(c => c.id);
    let cosOwnedHit = 0;
    for (let i = 0; i < 5000; i++) {
        const r = openChest({}, allOwned, () => 0.999); // hep en son slot (cosmetic/jackpot bolgesi)
        if (r.type === 'cosmetic') {
            cosOwnedHit++;
            ok(false, 'Sahip olunan kozmetik verilmemeli'); break;
        }
    }
    ok(cosOwnedHit === 0, 'Her seye sahipken kozmetik dussmez (coin\'e doner)');
}

console.log('\n=== 4. PITY GARANTILERI ===');
{
    // Yumurta: 9 kotu cekilisten sonra 10. epic+ olmali
    const bad = () => 0.999; // hep en agir (common) tarafina
    let pity = {};
    let lastRarity = null;
    for (let i = 0; i < 10; i++) {
        const r = openEgg(pity, bad);
        pity = updateEggPity(pity, r);
        lastRarity = r.rarity;
    }
    // 10. cekilis destansı+ garantisi: kotu rastgelelik pity'i hizlandirir
    ok(pity.egg === 0 || lastRarity === 'epic' || lastRarity === 'legendary', '10 yumurtada en az bir epic+ (pity)');

    // Deterministik pity: 29 legendary beklerken garanti
    let pity2 = { egg: 0, eggLegendary: 29 };
    const r = openEgg(pity2, bad);
    ok(r.rarity === 'legendary', '30. yumurtada legendary garanti');

    // Kutu: 9 kutu epic cikmadysa 10. epic+
    let cpity = {};
    let gotEpic = false;
    for (let i = 0; i < 10; i++) {
        const r = openChest(cpity, [], bad);
        cpity = updateChestPity(cpity, r);
        if (r.rarity === 'epic' || r.rarity === 'legendary') gotEpic = true;
    }
    ok(gotEpic, '10 kutuda en az bir epic+ (pity)');

    // Carkta pity yok: 1000 cevirme jackpot orani stabil
    let jackpot = 0;
    for (let i = 0; i < 10000; i++) {
        const r = spinWheel(() => 0.99); // en son segment (jackpot agirlik kismi)
        if (r.type === 'jackpot') jackpot++;
    }
    ok(jackpot === 10000, 'Cark: rastgelelik 0.99 ile her zaman jackpot segmenti (pity yok, dogru segment)');
}

console.log('\n=== 5. EVRIM ===');
{
    ok(EVOLUTION_STAGES.length === 6, '6 evrim evresi');
    ok(stageOf(0) === 0 && stageOf(499) === 0, '0-499 XP: Yumurta');
    ok(stageOf(500) === 1, '500 XP: Catlama');
    ok(stageOf(1500) === 2, '1500 XP: Yavru');
    ok(stageOf(4000) === 3, '4000 XP: Genc');
    ok(stageOf(10000) === 4, '10000 XP: Usta');
    ok(stageOf(25000) === 5, '25000 XP: Efsane');

    const info = getBuddyStageInfo(6000);
    ok(info.stageIndex === 3 && info.next.threshold === 10000 && info.needXp === 4000, 'getBuddyStageInfo: genc, 4000 XP kalsin');
    ok(getBuddyStageInfo(30000).percent === 100, 'Maks evrede percent=100');

    // XP ekleme + evrim tespiti
    let collection = { wolf: { xp: 480 } };
    const res = addBuddyXp(collection, 'wolf', 30);
    ok(res.evolved === true && res.xp === 510 && res.stageIndex === 1, '480->510 XP evrim tetikler (Yumurta->Catlama)');

    // Dupe donusumu
    ok(DUPE_XP.common === 100 && DUPE_XP.legendary === 1000, 'Dupe XP: common=100, legendary=1000');

    // Buddy kazanc carpani
    ok(buddyGainFromWorkout(100, 'common') === 30, 'Sıradan dost: 100 XP antrenman -> 30 buddy XP');
    ok(buddyGainFromWorkout(100, 'legendary') === 45, 'Efsanevi dost: 100 XP -> 45 buddy XP (%50 fazla)');
}

console.log('\n=== 6. DONDURUCU + CARK DURUMU ===');
{
    // Haftalik seri: hedefi kaciran hafta seriyi keser
    const hist1 = [
        { date: dateKey(daysAgo(2)) }, { date: dateKey(daysAgo(3)) }, { date: dateKey(daysAgo(4)) }, // bu hafta (3 antrenman)
        { date: dateKey(daysAgo(9)) }, { date: dateKey(daysAgo(10)) }, { date: dateKey(daysAgo(11)) } // gecen hafta
    ];
    const s1 = calcWeeklyStreak(hist1, 3);
    ok(s1.streak >= 1, 'Hedefe ulasan haftalar seriyi olusturur');

    // Dondurucu: arada kacirilan hafta varken stok 1 dondurucu seriyi korur
    // Tarihler bu haftanin Pazartesi'sine sabitlanir (hafta siniri bagimsizligi icin)
    const now = new Date();
    const dow = (now.getDay() + 6) % 7; // Pazartesi=0
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow);
    const weekDate = (weekOffset, dayOffset) => {
        const d = new Date(thisMonday);
        d.setDate(d.getDate() + weekOffset * 7 + dayOffset);
        return dateKey(d);
    };

    const hist2 = [
        { date: weekDate(0, 1) }, { date: weekDate(0, 2) }, { date: weekDate(0, 3) },  // bu hafta tamam
        // -1. hafta BOS (kacirildi)
        { date: weekDate(-2, 0) }, { date: weekDate(-2, 1) }, { date: weekDate(-2, 2) } // -2. hafta tamam
    ];
    const noFreeze = calcWeeklyStreak(hist2, 3, { weeks: [], stock: 0 });
    ok(noFreeze.streak === 0, 'Dondurucu yokken kacirilan hafta seriyi keser');

    const withFreeze = calcWeeklyStreak(hist2, 3, { weeks: [], stock: 1 });
    ok(withFreeze.streak >= 2, `Dondurucu stokla kacirilan hafta korunur (seri=${withFreeze.streak})`);
    ok(withFreeze.freezeUsed.length === 1, 'Bir dondurucu sanal harcandi');

    // Ayni hafta icin harcanmis dondurucu tekrar harcanmaz
    const alreadyFrozen = calcWeeklyStreak(hist2, 3, { weeks: withFreeze.freezeUsed, stock: 1 });
    ok(alreadyFrozen.streak >= 2 && alreadyFrozen.freezeUsed.length === 0, 'Daha once dondurulan hafta icin stok harcanmaz');

    // Cark durumu
    const today = new Date();
    const tk = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const ws1 = getWheelState(null);
    ok(ws1.freeAvailable === true && ws1.extraLeft === WHEEL_EXTRA_MAX, 'Ilk gun: ucretsiz + 2 ekstra');

    const afterFree = updateWheelState(null, true);
    ok(afterFree.lastFreeSpin === tk, 'Ucretsiz cevirme kaydedildi');
    const ws2 = getWheelState(afterFree);
    ok(ws2.freeAvailable === false && ws2.extraLeft === 2, 'Ucretsiz kullanildi, ekstra 2 kaldı');

    const afterExtra1 = updateWheelState(afterFree, false);
    const afterExtra2 = updateWheelState(afterExtra1, false);
    ok(getWheelState(afterExtra2).extraLeft === 0, '3 cevirme sonrasi ekstra biter');
}

console.log(`\n========================================`);
console.log(`SONUC: ${passed} gecti, ${failed} kaldi`);
console.log(`========================================\n`);
process.exit(failed > 0 ? 1 : 0);
