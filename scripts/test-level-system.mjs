// Seviye sistemi v2 dogrulama testi.
// Kullanim: node scripts/test-level-system.mjs
import { xpForNextLevel, totalXpForLevel, levelFromTotalXp, migrateLevelData, levelProgress } from '../src/utils/levelSystem.js';
import { getRank, getRankProgress, RANKS } from '../src/utils/ranks.js';

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
    if (cond) { pass++; console.log(`OK   ${name}`); }
    else { fail++; console.log(`FAIL ${name} ${extra}`); }
};

// 1. Egriden buyume: her seviye oncekinden zor
let monotonic = true;
for (let l = 1; l < 98; l++) {
    if (xpForNextLevel(l + 1) <= xpForNextLevel(l)) { monotonic = false; break; }
}
check('Seviye XP monoton artiyor', monotonic);

// 2. Ornek degerler
check('L1 XP = 500', xpForNextLevel(1) === 500, `-> ${xpForNextLevel(1)}`);
check('L10 XP ~ 1000+', xpForNextLevel(10) >= 1000, `-> ${xpForNextLevel(10)}`);
check('L50 XP cok buyuk', xpForNextLevel(50) > 15000, `-> ${xpForNextLevel(50)}`);

// 3. totalXpForLevel ile levelFromTotalXp roundtrip
const samples = [0, 100, 500, 1200, 5400, 50000, 250000, 1000000];
let roundtripOk = true;
for (const tx of samples) {
    const { level } = levelFromTotalXp(tx);
    const back = totalXpForLevel(level);
    if (level > 1 && back > tx) roundtripOk = false;      // seviye icine tasima
    if (level === 1 && tx >= 500) roundtripOk = false;
}
check('Roundtrip totalXp <-> level tutarli', roundtripOk);

// 4. Migrasyon: eski v1 kullanicilar (level, xp) -> v2
// Eski formul: L->L+1 = lvl*600 (yani L1=600, L2=1200). Level 3, 200xp birikmis
// eski toplam = 600 + 1200 + 200 = 2000. Yeni sistemde 2000 XP kac eder?
const mig = migrateLevelData(3, 200, 0);
check('Migrasyon null donmez (v0)', mig !== null);
check('Migrasyon v2 isaretli', mig.version === 2);
const sameAgain = migrateLevelData(mig.level, mig.xp, 2);
check('v2 verisinde tekrar migrasyon null', sameAgain === null);
check('Migrasyon toplam XP korunur', mig.totalXp === 2000, `-> ${mig.totalXp}`);
// 1600 XP yeni sistemde: 500 + 540 = 1040 (L2), kalan 560 < 1080 (L3 gereksinimi ~ 583)
check('Migrasyon sonrasi seviye makul (>=3)', mig.level >= 3, `-> ${mig.level}`);

// 5. Yeni baslayan: level 1, 0 xp
const fresh = migrateLevelData(1, 0, 0);
check('Yeni kullanici ayni kalir', fresh.level === 1 && fresh.xp === 0);

// 6. Progress helper
const p1 = levelProgress(0, 1);
check('Progress 0% baslangic', Math.round(p1.percent) === 0);
const p2 = levelProgress(250, 1);
check('Progress yari', Math.round(p2.percent) === 50);
const p3 = levelProgress(10000, 1);
check('Progress max 100', p3.percent === 100);

// 7. Rutbeler
check('10 rutbe tanimli', RANKS.length === 10);
let rankMonotonic = true;
for (let l = 1; l <= 95; l++) {
    const a = getRank(l); const b = getRank(l + 1);
    // a.maxLevel >= b.maxLevel olamaz (siralama bozulur)
    if (a.maxLevel > b.maxLevel && b.maxLevel !== Infinity) rankMonotonic = false;
}
check('Rutbe sinirlari sirali', rankMonotonic);
const rp90 = getRankProgress(90);
check('L90 son rutbe (next yok)', rp90.next === null && rp90.percent === 100);
const rp1 = getRankProgress(1);
check('L1 sonraki rutbe var', rp1.next !== null && rp1.percent === 0);

// 8. Toplam XP hesabi aktif idman ile uyumlu:
// ActiveWorkoutView: prevTotal = totalXpForLevel(userLevel) + userXP
const prevTotal = totalXpForLevel(3) + 200;
const after = levelFromTotalXp(prevTotal + 700);
check('Idman sonrasi seviye hesabi calisir', after.level > 3 && after.need > 0, `-> L${after.level}, ${after.xp}/${after.need}`);

console.log(`\nSonuc: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
