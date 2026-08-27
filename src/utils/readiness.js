// HAZIRLIK SKORU + DELOAD TESPITI (Faz 4).
// Antrenman yuku (ACWR benzeri), uyku, RPE ve agri verisinden
// 0-100 arasi "hazirlik skoru" uretir + eylem onerisi dondurur.
// Alternatif hareket motoru da burada yasar (agriyan bolgeye yuklenmez).

import { findMuscleGroupIdForExercise } from '../data/exercises';

const DAY = 86400000;

// ---------------------------------------------------------------------------
// Hazirlik skoru
// ---------------------------------------------------------------------------

/**
 * @param {Array} workoutHistory - tum kayitlar
 * @param {Object|null} lastCheckIn - { mood, pain: {region: 1-5} } (opsiyonel)
 * @param {Object|null} sleepData - { log: [{hours}] } (opsiyonel)
 * @returns {{ score, band, factors, action }} band: 'fresh'|'ready'|'caution'|'deload'
 */
export function readinessScore(workoutHistory, lastCheckIn = null, sleepData = null) {
    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) {
        return { score: null, band: 'fresh', factors: [], action: 'start' };
    }

    const now = Date.now();
    const factors = [];
    let score = 100;

    // --- Faktor 1: Akut:hacim artisi (bu hafta vs gecen hafta) -------------
    const volInWindow = (fromDaysAgo, toDaysAgo) => {
        let vol = 0;
        workoutHistory.forEach(w => {
            if (!w || !w.date) return;
            const ts = new Date(w.date).getTime();
            if (isNaN(ts)) return;
            const ageDays = (now - ts) / DAY;
            if (ageDays >= fromDaysAgo && ageDays < toDaysAgo) {
                vol += (w.totalWeight) || ((w.maxWeight || 0) * (w.bestReps || 0) * (w.sets || 0));
            }
        });
        return vol;
    };
    const acute = volInWindow(0, 7);      // bu hafta
    const chronic = volInWindow(7, 21) / 2; // gecen 2 haftanin ortalamasi

    if (chronic > 0) {
        const ratio = acute / chronic;
        if (ratio > 1.5) {
            score -= 20;
            factors.push({ id: 'spike', impact: -20, detail: Math.round(ratio * 10) / 10 });
        } else if (ratio < 0.5) {
            score += 5; // dinlenmis
            factors.push({ id: 'rested', impact: 5, detail: Math.round(ratio * 10) / 10 });
        }
    }

    // --- Faktor 2: Son antrenmandan bu yana gecen sure ----------------------
    let lastTs = 0;
    workoutHistory.forEach(w => {
        if (!w || !w.date) return;
        const ts = new Date(w.date).getTime();
        if (!isNaN(ts) && ts > lastTs) lastTs = ts;
    });
    if (lastTs > 0) {
        const restDays = Math.floor((now - lastTs) / DAY);
        if (restDays === 0) {
            score -= 5;
            factors.push({ id: 'trained_today', impact: -5, detail: 0 });
        } else if (restDays >= 4) {
            score += 8;
            factors.push({ id: 'long_rest', impact: 8, detail: restDays });
        }
    }

    // --- Faktor 3: Son 3 antrenmanin RPE'si ----------------------------------
    const recent = workoutHistory
        .slice()
        .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))
        .slice(0, 3);
    const rpes = recent.map(w => parseFloat(w?.avgRpe) || 0).filter(r => r > 0);
    if (rpes.length >= 2) {
        const avg = rpes.reduce((a, b) => a + b, 0) / rpes.length;
        if (avg >= 8.5) {
            score -= 15;
            factors.push({ id: 'rpe_high', impact: -15, detail: Math.round(avg * 10) / 10 });
        } else if (avg <= 6.5) {
            score += 5;
            factors.push({ id: 'rpe_low', impact: 5, detail: Math.round(avg * 10) / 10 });
        }
    }

    // --- Faktor 4: Check-in ruh hali + agri -----------------------------------
    if (lastCheckIn) {
        const mood = parseInt(lastCheckIn.mood) || 0;
        if (mood > 0 && mood <= 2) {
            score -= 15;
            factors.push({ id: 'mood_low', impact: -15, detail: mood });
        } else if (mood >= 4) {
            score += 5;
            factors.push({ id: 'mood_good', impact: 5, detail: mood });
        }
        const maxPain = Math.max(0, ...Object.values(lastCheckIn.pain || {}).map(v => parseInt(v) || 0));
        if (maxPain >= 4) {
            score -= 20;
            factors.push({ id: 'pain_high', impact: -20, detail: maxPain });
        } else if (maxPain === 3) {
            score -= 8;
            factors.push({ id: 'pain_mid', impact: -8, detail: maxPain });
        }
    }

    // --- Faktor 5: Uyku --------------------------------------------------------
    if (sleepData && Array.isArray(sleepData.log)) {
        const logs = sleepData.log.slice(0, 3).map(l => parseFloat(l?.hours) || 0).filter(h => h > 0);
        if (logs.length >= 2) {
            const avg = logs.reduce((a, b) => a + b, 0) / logs.length;
            if (avg < 6) {
                score -= 12;
                factors.push({ id: 'sleep_low', impact: -12, detail: Math.round(avg * 10) / 10 });
            } else if (avg >= 8) {
                score += 5;
                factors.push({ id: 'sleep_good', impact: 5, detail: Math.round(avg * 10) / 10 });
            }
        }
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let band, action;
    if (score >= 80) { band = 'fresh'; action = 'push'; }
    else if (score >= 60) { band = 'ready'; action = 'normal'; }
    else if (score >= 40) { band = 'caution'; action = 'reduce'; }
    else { band = 'deload'; action = 'deload'; }

    return { score, band, factors, action };
}

/**
 * Deload onerisi: son 5-6 haftada hic deload yoksa ve yuk yukselisse.
 * Basitlestirilmis: asiri yuk artisi + yuksek RPE kombinasyonu.
 */
export function shouldDeload(workoutHistory, lastDeloadDate = null) {
    const now = Date.now();
    if (lastDeloadDate) {
        const weeksSince = (now - new Date(lastDeloadDate).getTime()) / (7 * DAY);
        if (weeksSince < 5) return false;
    }
    const r = readinessScore(workoutHistory);
    return r.action === 'deload';
}

// ---------------------------------------------------------------------------
// Alternatif hareket motoru — agriyan bolgeye yuklenme
// ---------------------------------------------------------------------------

// Bolge bazli alternatifler: ayni islev, agriyi tetiklemeyen varyant
const ALTERNATIVES = {
    chest: {
        'Barbell Bench Press': ['Machine Chest Press', 'Dumbbell Bench Press'],
        'Incline Dumbbell Press': ['Machine Incline Press'],
        'Dips': ['Machine Chest Press']
    },
    shoulders: {
        'Overhead Press': ['Landmine Press', 'Seated Dumbbell Press'],
        'Lateral Raise': ['Cable Lateral Raise']
    },
    back: {
        'Barbell Row': ['Seated Cable Row', 'Chest Supported Row'],
        'Deadlift': ['Romanian Deadlift', 'Hip Thrust']
    },
    legs: {
        'Barbell Squat': ['Leg Press', 'Hack Squat'],
        'Romanian Deadlift': ['Leg Curl', 'Hip Thrust']
    },
    biceps: {
        'Barbell Curl': ['Cable Curl', 'Incline Dumbbell Curl']
    },
    triceps: {
        'Close Grip Bench Press': ['Cable Pushdown'],
        'Dips': ['Cable Pushdown']
    },
    calves: {
        'Standing Calf Raise': ['Seated Calf Raise']
    }
};

/**
 * Bugunun check-in agri haritasini program uretici icin kara liste
 * cevirir: seviyesi >= 3 olan bolgelerin kas grubu ID'leri.
 * @param {Object} painMap - { regionId: 1-5 } (MuscleMap bolge anahtarlari)
 * @returns {string[]} kas grubu ID'leri ('chest', 'legs', ...)
 */
export function painMapToBlacklist(painMap) {
    if (!painMap) return [];
    const REGION_GROUP = {
        chestL: 'chest', chestR: 'chest',
        deltFrontL: 'shoulders', deltFrontR: 'shoulders', deltRearL: 'shoulders', deltRearR: 'shoulders',
        bicepsL: 'biceps', bicepsR: 'biceps',
        tricepsL: 'triceps', tricepsR: 'triceps',
        forearmsL: 'forearms', forearmsR: 'forearms',
        abs: 'core', obliquesL: 'core', obliquesR: 'core',
        quadsL: 'legs', quadsR: 'legs', hamsL: 'legs', hamsR: 'legs',
        glutes: 'glutes',
        calvesL: 'calves', calvesR: 'calves',
        trapsL: 'back', trapsR: 'back', latsL: 'back', latsR: 'back', lowerBack: 'back'
    };
    const out = new Set();
    Object.entries(painMap).forEach(([region, lvl]) => {
        const g = REGION_GROUP[region];
        if (g && (parseInt(lvl) || 0) >= 3) out.add(g);
    });
    return [...out];
}

/**
 * Agri haritasina gore programdaki hareketlere alternatif onerir.
 * @param {Object} program - savedAiProgram formati
 * @param {Object} painMap - { regionId: 1-5 } (MuscleMap bolge anahtarlari)
 * @returns {Array<{ dayIdx, exIdx, from, to, reason }>}
 */
export function suggestAlternatives(program, painMap) {
    if (!program?.days || !painMap) return [];
    const out = [];

    // Bolge -> kas grubu eslesmesi (MuscleMap GROUP_REGIONS tersi)
    const REGION_GROUP = {
        chestL: 'chest', chestR: 'chest',
        deltFrontL: 'shoulders', deltFrontR: 'shoulders', deltRearL: 'shoulders', deltRearR: 'shoulders',
        bicepsL: 'biceps', bicepsR: 'biceps',
        tricepsL: 'triceps', tricepsR: 'triceps',
        forearmsL: 'forearms', forearmsR: 'forearms',
        abs: 'core', obliquesL: 'core', obliquesR: 'core',
        quadsL: 'legs', quadsR: 'legs', hamsL: 'legs', hamsR: 'legs',
        glutes: 'glutes',
        calvesL: 'calves', calvesR: 'calves',
        trapsL: 'back', trapsR: 'back', latsL: 'back', latsR: 'back', lowerBack: 'back'
    };

    // Agrili gruplar (seviye >= 3)
    const painfulGroups = new Set();
    Object.entries(painMap).forEach(([region, lvl]) => {
        const g = REGION_GROUP[region];
        if (g && (parseInt(lvl) || 0) >= 3) painfulGroups.add(g);
    });
    if (painfulGroups.size === 0) return [];

    program.days.forEach((day, dayIdx) => {
        (day.exercises || []).forEach((ex, exIdx) => {
            const g = findMuscleGroupIdForExercise(ex.name);
            if (!g || !painfulGroups.has(g)) return;
            const alt = ALTERNATIVES[g]?.[ex.name];
            if (alt && alt.length > 0) {
                out.push({
                    dayIdx,
                    exIdx,
                    from: ex.name,
                    to: alt[0],
                    reason: 'pain:' + g
                });
            }
        });
    });
    return out;
}
