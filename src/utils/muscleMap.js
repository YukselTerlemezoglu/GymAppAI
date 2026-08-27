// Renkli kas haritasi veri katmani.
// workoutHistory kayitlarindan haftalik (son 7 gun) kas grubu set sayilarini
// cikarir ve bilimsel haftalik set araliklarina (MEV/MAV/MRV) gore 0-1 normalize eder.
// Radar grafigiyle ayni kaynagi (exercises.js) kullanir — yeni veri girisi yoktur.

import { findMuscleGroupIdForExercise } from '../data/exercises';

// Haftalik set araliklari (MEV / MRV) — exercises.js weeklySets degerleriyle uyumlu
export const WEEKLY_RANGES = {
    chest:     { min: 10, max: 20 },
    back:      { min: 12, max: 22 },
    shoulders: { min: 12, max: 20 },
    biceps:    { min: 8,  max: 14 },
    triceps:   { min: 8,  max: 16 },
    legs:      { min: 12, max: 20 },
    glutes:    { min: 8,  max: 16 },
    calves:    { min: 8,  max: 16 },
    core:      { min: 6,  max: 12 },
    forearms:  { min: 4,  max: 8 }
};

// muscleGroupId -> harita bolgeleri (one: on yuz, back: arka yuz)
// Bir grup birden fazla bolgeye eslenebilir (orn. biceps sag+sola esit dagilir).
export const GROUP_REGIONS = {
    chest:     { front: ['chestL', 'chestR'], back: [] },
    back:      { front: [], back: ['trapsL', 'trapsR', 'latsL', 'latsR', 'lowerBack'] },
    shoulders: { front: ['deltFrontL', 'deltFrontR'], back: ['deltRearL', 'deltRearR'] },
    biceps:    { front: ['bicepsL', 'bicepsR'], back: [] },
    triceps:   { front: [], back: ['tricepsL', 'tricepsR'] },
    legs:      { front: ['quadsL', 'quadsR'], back: ['hamsL', 'hamsR'] },
    glutes:    { front: [], back: ['glutes'] },
    calves:    { front: ['calvesL', 'calvesR'], back: ['calvesL', 'calvesR'] },
    core:      { front: ['abs', 'obliquesL', 'obliquesR'], back: [] },
    forearms:  { front: ['forearmsL', 'forearmsR'], back: ['forearmsL', 'forearmsR'] }
};

const EMPTY_SETS = () => Object.fromEntries(Object.keys(WEEKLY_RANGES).map(k => [k, 0]));

/**
 * Son N gunun kas grubu bazli set sayimi.
 * @param {Array} workoutHistory - { date, exercise, sets } kayitlari
 * @param {number} days - pencere (varsayilan 7)
 * @returns {Object} { chest: 12, back: 8, ... }
 */
export function weeklySetsByGroup(workoutHistory, days = 7) {
    const counts = EMPTY_SETS();
    if (!workoutHistory || !workoutHistory.length) return counts;

    const cutoff = Date.now() - days * 86400000;
    workoutHistory.forEach(w => {
        if (!w.exercise || !w.sets) return;
        const ts = new Date(w.date).getTime();
        if (isNaN(ts) || ts < cutoff) return;
        const groupId = findMuscleGroupIdForExercise(w.exercise);
        if (groupId && groupId in counts) {
            counts[groupId] += parseInt(w.sets) || 0;
        }
    });
    return counts;
}

/**
 * Set sayisini MEV/MRV araligina gore 0-1 normalize eder.
 * 0    = hic calisilmadi
 * 0.5  = araligin ortasi (MAV civari) — ideal bolge
 * 1    = MRV (maksimum geri kazanilabilir hacim)
 * MRV ustu degerler 1'de doyurulur (haritada en sicak renk).
 */
export function normalizeIntensity(groupId, sets) {
    const range = WEEKLY_RANGES[groupId];
    if (!range || sets <= 0) return 0;
    return Math.min(1, sets / range.max);
}

/**
 * Bolge bazli renk degerleri uretir.
 * @param {Object} setsByGroup - weeklySetsByGroup ciktisi
 * @returns {Object} { chestL: 0.62, ... } — bolge anahtarina gore 0-1
 */
export function regionIntensities(setsByGroup) {
    const out = {};
    Object.entries(GROUP_REGIONS).forEach(([groupId, { front, back }]) => {
        const v = normalizeIntensity(groupId, setsByGroup[groupId] || 0);
        [...front, ...back].forEach(r => { out[r] = v; });
    });
    return out;
}

/**
 * Bir bolgenin normalize siddetini 0-1 hesaplar (tek bolge icin kolaylik).
 */
export function intensityForRegion(setsByGroup, regionId) {
    const all = regionIntensities(setsByGroup);
    return all[regionId] || 0;
}
