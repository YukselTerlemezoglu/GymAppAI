// Rozet kutuphanesi v2 dogrulama: tum rozetler gecerli fonksiyonlara sahip mi
// + yeni rozetler ornek istatistiklerle aciliyor mu?
// Kullanim: node scripts/test-badges.mjs
import { BADGE_LIBRARY } from '../src/data/badges.js';

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
    if (cond) { pass++; console.log(`OK   ${name}`); }
    else { fail++; console.log(`FAIL ${name} ${extra}`); }
};

// 1. Tum rozetler id/title/condition icerir; id'ler benzersiz
const ids = new Set(BADGE_LIBRARY.map(b => b.id));
check('Rozet sayisi: ' + BADGE_LIBRARY.length, BADGE_LIBRARY.length >= 25);
check('Idler benzersiz', ids.size === BADGE_LIBRARY.length);
check('Hepsi condition fonksiyonu', BADGE_LIBRARY.every(b => typeof b.condition === 'function'));
check('Hepsi progress fonksiyonu', BADGE_LIBRARY.every(b => typeof b.progress === 'function'));
check('Hepsi TR+EN baslik', BADGE_LIBRARY.every(b => b.title && b.title_en));

// 2. Ornek istatistiklerle yeni rozetler acilir mi
const richStats = {
    totalWorkouts: 60,
    streak: 8,
    aiWorkoutsCompleted: 3,
    history: [
        { date: '2026-08-20T10:00:00', exercise: 'Squat', maxWeight: 110, bestReps: 5, sets: 5, totalReps: 25, totalWeight: 5500 },
        { date: '2026-08-19T10:00:00', exercise: 'Bench Press', maxWeight: 102, bestReps: 5, sets: 5, totalReps: 25, totalWeight: 5100 },
        { date: '2026-08-18T10:00:00', exercise: 'Deadlift', maxWeight: 155, bestReps: 3, sets: 3, totalReps: 9, totalWeight: 1395 },
        { date: '2026-08-17T10:00:00', exercise: 'Row', maxWeight: 70, bestReps: 10, sets: 4, totalReps: 40, totalWeight: 2800 }
    ],
    level: 12,
    totalVolume: 12000,
    totalSets: 1200,
    totalReps: 11000,
    uniqueExercises: 22,
    prCount: 11,
    waterGoalDays: 31,
    friendCount: 1
};

const unlockedIds = BADGE_LIBRARY.filter(b => b.condition(richStats)).map(b => b.id);
const expect = ['streak_7', 'volume_10t', 'sets_1000', 'reps_10000', 'variety_20', 'pr_10', 'squat_100', 'water_30', 'social_first', 'workout_50', 'level_25'.replace('level_25', 'veteran_athlete')];
for (const id of expect) {
    check(`Rozet acilir: ${id}`, unlockedIds.includes(id));
}

// 3. Bos istatistiklerle hicbir rozet acilmaz
const emptyStats = { totalWorkouts: 0, streak: 0, aiWorkoutsCompleted: 0, history: [], level: 1, totalVolume: 0, totalSets: 0, totalReps: 0, uniqueExercises: 0, prCount: 0, waterGoalDays: 0, friendCount: 0 };
const emptyUnlocked = BADGE_LIBRARY.filter(b => b.condition(emptyStats));
check('Bos istatistik: 0 rozet', emptyUnlocked.length === 0, `-> ${emptyUnlocked.map(b => b.id).join(',')}`);

// 4. progress() crash atmaz
let noCrash = true;
try {
    BADGE_LIBRARY.forEach(b => b.progress(emptyStats));
    BADGE_LIBRARY.forEach(b => b.progress(richStats));
} catch { noCrash = false; }
check('progress() hata firlatmaz', noCrash);

console.log(`\nSonuc: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
