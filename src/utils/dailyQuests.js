// GUNLUK GOREVLER (Faz 5b) + DOST ANTRENMAN BONUSU.
// Her gun 3 kisiye ozel gorev uretilir (seed'li — gun icinde sabit).
// Gorevler kullanicinin gercek verisinden turetilir; tamamlayinca coin/XP.
// Dost antrenmani: aktif dostla ayni gun antrenman = dost XP +%50.

const DAY = 86400000;

// Deterministik RNG (mulberry32) — ayni gun + ayni kullanici = ayni gorevler
function seededRandom(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function dayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Gorev sablonlari — kosullar ve oduller
const TASK_TEMPLATES = [
    {
        id: 'workout_any',
        check: (ctx) => ctx.todayWorkouts > 0,
        reward: { coins: 30, xp: 15 },
        difficulty: 1
    },
    {
        id: 'sets_12',
        check: (ctx) => ctx.todaySets >= 12,
        reward: { coins: 40, xp: 20 },
        difficulty: 2
    },
    {
        id: 'volume_3000',
        check: (ctx) => ctx.todayVolume >= 3000,
        reward: { coins: 50, xp: 25 },
        difficulty: 2
    },
    {
        id: 'legs_today',
        check: (ctx) => ctx.todayLegSets >= 6,
        reward: { coins: 60, xp: 30 },
        difficulty: 3
    },
    {
        id: 'rpe_push',
        check: (ctx) => ctx.todayAvgRpe >= 8,
        reward: { coins: 45, xp: 25 },
        difficulty: 2
    },
    {
        id: 'new_exercise',
        check: (ctx) => ctx.todayNewExercise,
        reward: { coins: 35, xp: 20 },
        difficulty: 2
    },
    {
        id: 'volume_pr',
        check: (ctx) => ctx.todayVolume > ctx.bestDayVolume,
        reward: { coins: 80, xp: 40 },
        difficulty: 3
    }
];

/**
 * Gunun gorevlerini uretir (deterministik, kullaniciya ozel).
 * @param {Object} opts - { userName, workoutHistory, now }
 * @returns {Array<{ id, reward, difficulty }>} 3 gorev
 */
export function dailyTasks(opts = {}) {
    const { userName = 'user', now = new Date() } = opts;
    const seedStr = `${userName}:${dayKey(now)}`;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
        seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    }
    const rand = seededRandom(seed);

    // Kolay 1 + orta 1 + zor 1 karisim
    const byDiff = { 1: [], 2: [], 3: [] };
    TASK_TEMPLATES.forEach(t => byDiff[t.difficulty].push(t));

    const pick = (arr) => arr[Math.floor(rand() * arr.length)];
    return [pick(byDiff[1]), pick(byDiff[2]), pick(byDiff[3])];
}

/**
 * Gorev ilerlemesini bugunun kayitlarindan hesaplar.
 * @returns {Object} ctx — sablon check() fonksiyonlarina gider
 */
export function taskContext(workoutHistory, allTimeExercises = new Set(), now = new Date()) {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let todaySets = 0, todayVolume = 0, todayLegSets = 0, todayWorkouts = 0;
    const rpes = [];
    const todayExercises = new Set();

    (Array.isArray(workoutHistory) ? workoutHistory : []).forEach(w => {
        if (!w || !w.date) return;
        const ts = new Date(w.date).getTime();
        if (isNaN(ts) || ts < startOfDay) return;

        todayWorkouts += 1;
        todaySets += parseInt(w.sets) || 0;
        const vol = (w.totalWeight) || ((w.maxWeight || 0) * (w.bestReps || 0) * (w.sets || 0));
        todayVolume += vol;
        if (w.avgRpe > 0) rpes.push(parseFloat(w.avgRpe));
        if (w.exercise) todayExercises.add(w.exercise);

        // Bacak setleri (legs + glutes + calves)
        const g = w.muscleGroup || null;
        if (g && ['legs', 'glutes', 'calves'].includes(g)) todayLegSets += parseInt(w.sets) || 0;
    });

    // Bugun yapilanlardan hicbiri gecmiste yok mu? (yeni hareket)
    let todayNewExercise = false;
    todayExercises.forEach(ex => { if (!allTimeExercises.has(ex)) todayNewExercise = true; });
    // Not: workoutHistory zaten bugunu iceriyor; "yeni" = bugunden once hic yapilmamis
    const beforeToday = new Set();
    (Array.isArray(workoutHistory) ? workoutHistory : []).forEach(w => {
        if (!w || !w.exercise) return;
        const ts = new Date(w.date).getTime();
        if (!isNaN(ts) && ts < startOfDay) beforeToday.add(w.exercise);
    });
    todayNewExercise = false;
    todayExercises.forEach(ex => { if (!beforeToday.has(ex)) todayNewExercise = true; });

    // En iyi gun hacmi (bugun haric)
    let bestDayVolume = 0;
    const volByDay = new Map();
    (Array.isArray(workoutHistory) ? workoutHistory : []).forEach(w => {
        if (!w || !w.date) return;
        const ts = new Date(w.date).getTime();
        if (isNaN(ts) || ts >= startOfDay) return;
        const key = Math.floor(ts / DAY);
        const vol = (w.totalWeight) || ((w.maxWeight || 0) * (w.bestReps || 0) * (w.sets || 0));
        volByDay.set(key, (volByDay.get(key) || 0) + vol);
    });
    volByDay.forEach(v => { if (v > bestDayVolume) bestDayVolume = v; });

    return {
        todayWorkouts,
        todaySets,
        todayVolume: Math.round(todayVolume),
        todayLegSets,
        todayAvgRpe: rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0,
        todayNewExercise,
        bestDayVolume
    };
}

/**
 * Gorev durumlarini degerlendirir.
 * @returns {Array<{ id, done, reward, difficulty }>}
 */
export function evaluateTasks(tasks, ctx) {
    return tasks.map(t => ({
        id: t.id,
        done: t.check(ctx),
        reward: t.reward,
        difficulty: t.difficulty
    }));
}

// ---------------------------------------------------------------------------
// Dost antrenman bonusu
// ---------------------------------------------------------------------------

/**
 * Bugun dostla antrenman yapildi mi? (check-in benzeri)
 * Dost bonusu: bugun antrenman varsa dost XP'si x1.5.
 * @returns {number} carpan (1 veya 1.5)
 */
export function buddyWorkoutMultiplier(workoutHistory, now = new Date()) {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const trained = (Array.isArray(workoutHistory) ? workoutHistory : []).some(w => {
        if (!w || !w.date) return false;
        const ts = new Date(w.date).getTime();
        return !isNaN(ts) && ts >= startOfDay;
    });
    return trained ? 1.5 : 1;
}
