// GUNLUK GOREVLER (Faz 5b -> v2 reform: DoN ekonomisi).
// Her gun KURAL MOTORU 3 gorev onerir (kolay/orta/zor), kullanici 1'ini secer.
// Odul sabit kademeli: kolay 50, orta 100, zor 200 coin.
// Esikler kisisel: son 30 gunun medyan gun hacmi/set sayisindan turetilir.
// Deterministik seed korunur (ayni gun ayni kullanici = ayni oneriler).

const DAY = 86400000;

// Deterministik RNG (mulberry32)
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

// Odul kademeleri (kullanici onayli tablo)
export const REWARD_TIERS = {
    easy:   { coins: 50,  xp: 25 },
    medium: { coins: 100, xp: 50 },
    hard:   { coins: 200, xp: 100 }
};

/*
 * Gorev sablonlari v2.
 * threshold(ctx): kisisel esik hesabi (ctx.personal icinden).
 * progress(ctx): 0..1 arasi ilerleme (progress bar icin; done ise 1).
 */
const TASK_TEMPLATES = [
    // ---- KOLAY ----
    {
        id: 'workout_any',
        tier: 'easy',
        check: (ctx) => ctx.todayWorkouts > 0,
        progress: (ctx) => Math.min(1, ctx.todayWorkouts)
    },
    {
        id: 'mobility_complete',
        tier: 'easy',
        check: (ctx) => ctx.todayMobility,
        progress: (ctx) => ctx.todayMobility ? 1 : 0
    },
    // ---- ORTA ----
    {
        id: 'sets_personal',
        tier: 'medium',
        check: (ctx) => ctx.todaySets >= ctx.personal.setTarget,
        progress: (ctx) => Math.min(1, ctx.todaySets / Math.max(1, ctx.personal.setTarget))
    },
    {
        id: 'volume_personal',
        tier: 'medium',
        check: (ctx) => ctx.todayVolume >= ctx.personal.volumeTarget,
        progress: (ctx) => Math.min(1, ctx.todayVolume / Math.max(1, ctx.personal.volumeTarget))
    },
    {
        id: 'new_exercise',
        tier: 'medium',
        check: (ctx) => ctx.todayNewExercise,
        progress: (ctx) => ctx.todayNewExercise ? 1 : 0
    },
    {
        id: 'rpe_push',
        tier: 'medium',
        check: (ctx) => ctx.todayAvgRpe >= 8,
        progress: (ctx) => Math.min(1, ctx.todayAvgRpe / 8)
    },
    {
        id: 'hiit_complete',
        tier: 'medium',
        check: (ctx) => ctx.todayHiit,
        progress: (ctx) => ctx.todayHiit ? 1 : 0
    },
    // ---- ZOR ----
    {
        id: 'legs_today',
        tier: 'hard',
        check: (ctx) => ctx.todayLegSets >= ctx.personal.legsTarget,
        progress: (ctx) => Math.min(1, ctx.todayLegSets / Math.max(1, ctx.personal.legsTarget))
    },
    {
        id: 'volume_pr',
        tier: 'hard',
        check: (ctx) => ctx.todayVolume > ctx.bestDayVolume,
        progress: (ctx) => ctx.bestDayVolume > 0 ? Math.min(1, ctx.todayVolume / ctx.bestDayVolume) : (ctx.todayVolume > 0 ? 1 : 0)
    },
    {
        id: 'volume_plus20',
        tier: 'hard',
        check: (ctx) => ctx.todayVolume >= ctx.personal.volumeTarget * 1.2,
        progress: (ctx) => Math.min(1, ctx.todayVolume / Math.max(1, ctx.personal.volumeTarget * 1.2))
    }
];

// ---------------------------------------------------------------------------
// Kisisel esikler
// ---------------------------------------------------------------------------

function median(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Son 30 gunun antrenman gunlerinden kisisel hedefler turetir.
 * Yeni kullanicida (veri yok) makul varsayilanara duser.
 */
export function personalTargets(workoutHistory, now = new Date()) {
    const cutoff = now.getTime() - 30 * DAY;
    const volByDay = new Map();
    const setsByDay = new Map();
    const legSetsByDay = new Map();

    (Array.isArray(workoutHistory) ? workoutHistory : []).forEach(w => {
        if (!w || !w.date) return;
        const ts = new Date(w.date).getTime();
        if (isNaN(ts) || ts < cutoff) return;
        const key = Math.floor(ts / DAY);
        const vol = (w.totalWeight) || ((w.maxWeight || 0) * (w.bestReps || 0) * (w.sets || 0));
        volByDay.set(key, (volByDay.get(key) || 0) + vol);
        setsByDay.set(key, (setsByDay.get(key) || 0) + (parseInt(w.sets) || 0));
        const g = w.muscleGroup;
        if (g && ['legs', 'glutes', 'calves'].includes(g)) {
            legSetsByDay.set(key, (legSetsByDay.get(key) || 0) + (parseInt(w.sets) || 0));
        }
    });

    const vols = [...volByDay.values()];
    const sets = [...setsByDay.values()];
    const legs = [...legSetsByDay.values()];

    // Medyanin ~%90'i (hedef: "normal bir gunun biraz uzeri")
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    return {
        medVolume: Math.round(median(vols)),
        medSets: Math.round(median(sets)),
        volumeTarget: clamp(Math.round(median(vols) * 0.9), 1500, 8000),
        setTarget: clamp(Math.round(median(sets) * 0.9), 8, 24),
        legsTarget: clamp(Math.round((median(legs) || 8) * 0.9), 6, 16)
    };
}

// ---------------------------------------------------------------------------
// Kural motoru (token'siz "AI" secici)
// ---------------------------------------------------------------------------

/**
 * Kullanici verisine gore sablonlara agirlik verip her tier'dan 1 oneri secer.
 * Kurallar:
 *  - Neglected (ihmal edilen) bolge varsa bacak/omuz gorevleri one cikar
 *  - Plato varsa new_exercise / rpe_push one cikar
 *  - Hazirlik dusukse (yorgun) zor tier'dan "istirahat dostu" gorev secilmez
 *    (volume_pr yerine legs/volume_plus20 gibi) — basitlestirilmis: hazirlik
 *    dusukken hard tier yine sunulur ama okunabilirlik icin degismez.
 * @param {Object} opts - { userName, workoutHistory, neglected, plateau, now }
 */
export function dailyTasks(opts = {}) {
    const {
        userName = 'user',
        neglected = [],
        plateau = false,
        now = new Date()
    } = opts;

    const seedStr = `${userName}:${dayKey(now)}`;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
        seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    }
    const rand = seededRandom(seed);

    const byTier = { easy: [], medium: [], hard: [] };
    TASK_TEMPLATES.forEach(t => byTier[t.tier].push(t));

    // Agirliklandirma: kural sinyalleri
    const weightOf = (t) => {
        let w = 1;
        if (t.id === 'legs_today' && (neglected.includes('legs') || neglected.includes('glutes'))) w += 2;
        if (t.id === 'new_exercise' && plateau) w += 2;
        if (t.id === 'rpe_push' && plateau) w += 1;
        if (t.id === 'mobility_complete' && neglected.length === 0) w += 0.5; // tuzak degil, hafif cesitlilik
        return w;
    };

    const weightedPick = (arr) => {
        const weights = arr.map(weightOf);
        const total = weights.reduce((s, w) => s + w, 0);
        let roll = rand() * total;
        for (let i = 0; i < arr.length; i++) {
            roll -= weights[i];
            if (roll <= 0) return arr[i];
        }
        return arr[arr.length - 1];
    };

    const out = [weightedPick(byTier.easy), weightedPick(byTier.medium), weightedPick(byTier.hard)];
    return out.map(t => ({
        id: t.id,
        tier: t.tier,
        reward: REWARD_TIERS[t.tier],
        check: t.check,
        progress: t.progress
    }));
}

// ---------------------------------------------------------------------------
// Gunun baglami (ilerleme olcumu)
// ---------------------------------------------------------------------------

/**
 * Gorev ilerlemesini bugunun kayitlarindan hesaplar.
 * todayMobility/todayHiit: App tarafinda localStorage isaretlerinden okunur.
 */
export function taskContext(workoutHistory, marks = {}, now = new Date()) {
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

        const g = w.muscleGroup || null;
        if (g && ['legs', 'glutes', 'calves'].includes(g)) todayLegSets += parseInt(w.sets) || 0;
    });

    // Yeni hareket: bugunden once hic yapilmamis
    const beforeToday = new Set();
    (Array.isArray(workoutHistory) ? workoutHistory : []).forEach(w => {
        if (!w || !w.exercise) return;
        const ts = new Date(w.date).getTime();
        if (!isNaN(ts) && ts < startOfDay) beforeToday.add(w.exercise);
    });
    let todayNewExercise = false;
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
        bestDayVolume,
        todayMobility: !!marks.mobility,
        todayHiit: !!marks.hiit,
        personal: personalTargets(workoutHistory, now)
    };
}

/**
 * Gorev durumlarini degerlendirir (done + progress 0..1).
 */
export function evaluateTasks(tasks, ctx) {
    return tasks.map(t => ({
        id: t.id,
        tier: t.tier,
        reward: t.reward,
        done: t.check(ctx),
        progress: t.progress ? t.progress(ctx) : (t.check(ctx) ? 1 : 0)
    }));
}

// ---------------------------------------------------------------------------
// Dost antrenman bonusu
// ---------------------------------------------------------------------------

export function buddyWorkoutMultiplier(workoutHistory, now = new Date()) {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const trained = (Array.isArray(workoutHistory) ? workoutHistory : []).some(w => {
        if (!w || !w.date) return false;
        const ts = new Date(w.date).getTime();
        return !isNaN(ts) && ts >= startOfDay;
    });
    return trained ? 1.5 : 1;
}
