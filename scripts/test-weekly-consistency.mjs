// Haftalik tutarlilik sistemi dogrulama.
// Kullanim: node scripts/test-weekly-consistency.mjs
import { getWeekKey, weekDiff, getWeeksMap, calcWeeklyStreak, weeklyMultiplier, weekKeyToMonday } from '../src/utils/consistency.js';

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
    if (cond) { pass++; console.log(`OK   ${name}`); }
    else { fail++; console.log(`FAIL ${name} ${extra}`); }
};

const dateStr = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString();
};

// 1. Hafta anahtari: Pazartesi ayni hafta, Pazar ayni hafta
const mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
check('Pazartesi-Pazar ayni hafta', getWeekKey(mon) === getWeekKey(sun));
check('Hafta anahtari formati', /^\d{4}-W\d{2}$/.test(getWeekKey(new Date())));

// 2. weekKeyToMonday roundtrip
const wk = getWeekKey(mondayOfThisWeek());
const mondayRT = weekKeyToMonday(wk);
check('weekKeyToMonday Pazartesi doner', mondayRT.getDay() === 1, `-> gun: ${mondayRT.getDay()}`);
function mondayOfThisWeek() {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
}

// 3. Bos gecmis: seri 0
const empty = calcWeeklyStreak([], 3);
check('Bos gecmis seri 0', empty.streak === 0);
check('Bos gecmis bu hafta 0', empty.weeksThisWeek === 0);

// 4. Ust uste 3 hafta hedefe ulasan gecmis -> seri 3
// Son 3 haftanin her birinde Pazartesi/Carsamba/Cuma antrenman (3 gun = hedef)
const hist3 = [];
for (let w = 1; w <= 3; w++) {
    const m = mondayOfThisWeek();
    m.setDate(m.getDate() - 7 * w); // w hafta onceki Pazartesi
    [0, 2, 4].forEach(off => {
        const d = new Date(m); d.setDate(m.getDate() + off);
        hist3.push({ date: d.toISOString(), exercise: 'Squat' });
    });
}
const r3 = calcWeeklyStreak(hist3, 3);
check('3 hafta hedef -> seri 3', r3.streak === 3, `-> ${r3.streak}`);

// 5. Dinlenme gunleri seriyi BOZMAZ: haftada sadece 3 gun antrenman yeter
// (yukaridaki test zaten bunu kanitliyor - 4 gun dinlenmis olmasina ragmen seri 3)

// 6. Ara hafta kaciran seri kirar: hafta -3 tamam, -2 BOS, -1 tamam
const histGap = [];
for (let w of [3, 1]) {
    const m = mondayOfThisWeek();
    m.setDate(m.getDate() - 7 * w);
    [0, 2, 4].forEach(off => {
        const d = new Date(m); d.setDate(m.getDate() + off);
        histGap.push({ date: d.toISOString(), exercise: 'Bench' });
    });
}
const rGap = calcWeeklyStreak(histGap, 3);
check('Ara hafta bos -> seri 1 (son hafta)', rGap.streak === 1, `-> ${rGap.streak}`);

// 7. Mevcut hafta seriye dahil DEGIL (hafta bitmedi)
const histWithThisWeek = [...hist3];
[0, 1, 2].forEach(off => histWithThisWeek.push({ date: dateStr(-off), exercise: 'Row' }));
const rCur = calcWeeklyStreak(histWithThisWeek, 3);
check('Mevcut hafta ayri takip edilir', rCur.weeksThisWeek === 3 && rCur.streak === 3, `-> streak: ${rCur.streak}, thisWeek: ${rCur.weeksThisWeek}`);

// 8. Hedef 4 iken 3 gun yetmez
const rGoal4 = calcWeeklyStreak(hist3, 4);
check('Hedef 4 -> 3 gun yetmez, seri 0', rGoal4.streak === 0, `-> ${rGoal4.streak}`);

// 9. weeksMap ayni gun coklu antrenmani 1 gun sayar
const sameDay = [
    { date: dateStr(0), exercise: 'Squat' },
    { date: new Date().toISOString(), exercise: 'Bench' },
    { date: dateStr(0), exercise: 'Row' }
];
const wm = getWeeksMap(sameDay);
check('Ayni gun 3 antrenman = 1 gun', (wm.get(getWeekKey(new Date()))?.count || 0) === 1);

// 10. Carpan esikleri
check('0-1 hafta carpan 1.0', weeklyMultiplier(0) === 1.0 && weeklyMultiplier(1) === 1.0);
check('2-3 hafta carpan 1.2', weeklyMultiplier(2) === 1.2 && weeklyMultiplier(3) === 1.2);
check('4+ hafta carpan 1.5', weeklyMultiplier(4) === 1.5 && weeklyMultiplier(50) === 1.5);

// 11. weekDiff
check('weekDiff ayni hafta 0', weekDiff('2026-W34', '2026-W34') === 0);
check('weekDiff yil basi gecis', weekDiff('2025-W52', '2026-W01') === 1);

console.log(`\nSonuc: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
