// KUVVET ANALITIK MOTORU (Faz 0 — koç ve program üreticinin veri temeli).
// Tum fonksiyonlar saf (pure): workoutHistory alir, sayisal analiz dondurur.
// Metin/i18n katmani burada YOKTUR — sunum bileşenleri uretir.

import { estimate1RM } from './prTracker';
import { findMuscleGroupIdForExercise } from '../data/exercises';
import { WEEKLY_RANGES } from './muscleMap';

const DAY = 86400000;

// ---------------------------------------------------------------------------
// 1) e1RM ZAMAN SERISI — kuvvet egrileri (Faz 2c) icin temel veri
// ---------------------------------------------------------------------------

/**
 * Bir egzersizin tum gecmisini tarih sirali e1RM serisine cevirir.
 * Ayni gunde birden fazla kayit varsa en iyi set alinir.
 * @returns {Array<{ date: string, ts: number, e1rm: number, weight: number, reps: number }>}
 */
export function e1rmSeries(exerciseName, history) {
    if (!exerciseName || !Array.isArray(history)) return [];
    const byDay = new Map();
    history.forEach(w => {
        if (!w || w.exercise !== exerciseName) return;
        const ts = new Date(w.date).getTime();
        if (isNaN(ts)) return;
        const e1rm = estimate1RM(w.maxWeight, w.bestReps);
        if (e1rm <= 0) return;
        const key = Math.floor(ts / DAY);
        const cur = byDay.get(key);
        if (!cur || e1rm > cur.e1rm) {
            byDay.set(key, { date: w.date, ts, e1rm, weight: parseFloat(w.maxWeight) || 0, reps: parseInt(w.bestReps) || 0 });
        }
    });
    return [...byDay.values()].sort((a, b) => a.ts - b.ts);
}

// ---------------------------------------------------------------------------
// 2) PLATEAU TESPITI
// ---------------------------------------------------------------------------

/**
 * Bir egzersizde plato (tikanma) analizi yapar.
 * Kriter: son 3 seansin en iyi e1RM'si, oncesindeki en iyi degerle
 * kiyaslandiginda %1'den az artis ve en az 21 gun gecmissa plato.
 * @returns {null | { weeks: number, bestE1rm: number, lastE1rm: number, sessions: number }}
 */
export function detectPlateau(exerciseName, history) {
    const series = e1rmSeries(exerciseName, history);
    if (series.length < 4) return null;

    const last = series[series.length - 1];
    const spanMs = last.ts - series[0].ts;
    if (spanMs < 21 * DAY) return null; // en az 3 haftalik gecmis

    const recentBest = Math.max(...series.slice(-3).map(s => s.e1rm));
    const beforeBest = Math.max(...series.slice(0, -3).map(s => s.e1rm));

    if (beforeBest <= 0) return null;
    const improvement = (recentBest - beforeBest) / beforeBest;

    if (improvement < 0.01) {
        return {
            weeks: Math.round(spanMs / (7 * DAY)),
            bestE1rm: beforeBest,
            lastE1rm: recentBest,
            sessions: series.length
        };
    }
    return null;
}

/**
 * Tum egzersizleri tarayip plato'da olanlari bulur (koç kurali girdisi).
 * @returns {Array<{ exercise, weeks, lastE1rm, sessions }>}
 */
export function findAllPlateaus(history, minSessions = 4) {
    if (!Array.isArray(history)) return [];
    const byEx = new Map();
    history.forEach(w => {
        if (!w || !w.exercise) return;
        if (!byEx.has(w.exercise)) byEx.set(w.exercise, []);
        byEx.get(w.exercise).push(w);
    });

    const out = [];
    byEx.forEach((logs, exercise) => {
        if (logs.length < minSessions) return;
        const p = detectPlateau(exercise, logs);
        if (p) out.push({ exercise, ...p });
    });
    // En uzun sureli plato once
    return out.sort((a, b) => b.weeks - a.weeks);
}

// ---------------------------------------------------------------------------
// 3) HACIM ANALIZI — MEV/MAV/MRV siniflandirmasi
// ---------------------------------------------------------------------------

/**
 * Son 7 gunun kas grubu hacmini bilimsel araliklarla siniflandirir.
 * status: 'none' | 'below' (MEV alti) | 'optimal' (MEV-MAV) | 'high' (MAV-MRV) | 'max' (MRV ustu)
 */
export function volumeStatusByGroup(history, days = 7) {
    const counts = Object.fromEntries(Object.keys(WEEKLY_RANGES).map(k => [k, 0]));
    const cutoff = Date.now() - days * DAY;

    (Array.isArray(history) ? history : []).forEach(w => {
        if (!w || !w.exercise || !w.sets) return;
        const ts = new Date(w.date).getTime();
        if (isNaN(ts) || ts < cutoff) return;
        const g = findMuscleGroupIdForExercise(w.exercise);
        if (g && g in counts) counts[g] += parseInt(w.sets) || 0;
    });

    const out = {};
    Object.entries(WEEKLY_RANGES).forEach(([g, range]) => {
        const sets = counts[g];
        const { min, max } = range;
        const mav = Math.round((min + max) / 2);
        let status = 'optimal';
        if (sets <= 0) status = 'none';
        else if (sets < min) status = 'below';
        else if (sets > max) status = 'max';
        else if (sets > mav) status = 'high';
        out[g] = { sets, min, mav, max, status, ratio: Math.min(1.5, sets / max) };
    });
    return out;
}

/**
 * En cok ihmal edilen kas gruplarini dondurur (koç + program uretici girdisi).
 */
export function neglectedGroups(history, days = 7, limit = 3) {
    const v = volumeStatusByGroup(history, days);
    return Object.entries(v)
        .filter(([, s]) => s.status === 'none' || s.status === 'below')
        .map(([g, s]) => ({ group: g, sets: s.sets, min: s.min, severity: s.status === 'none' ? 1 : 0 }))
        .sort((a, b) => (b.severity - a.severity) || (a.sets - b.sets))
        .slice(0, limit);
}

// ---------------------------------------------------------------------------
// 4) PROGRESIF ASIRI YUK ONERISI v2 — RPE farkindalikli
// ---------------------------------------------------------------------------

/**
 * Son seans performansina + (varsa) RPE'ye gore sonraki hedefi hesaplar.
 * Mantik:
 *  - RPE <= 7 ve tum setler tamamlandi  -> agirlik artisi (+2.5 / +5 kg)
 *  - RPE >= 9.5                          -> %5 geri cekilis
 *  - diger durumlar                      -> ayni agirlik +1 tekrar
 * @returns {null | { kind: 'weight'|'reps'|'backoff', targetWeight, targetReps, reason }}
 */
export function nextLoadSuggestion(exerciseName, history) {
    if (!exerciseName || !Array.isArray(history)) return null;
    let last = null;
    for (const w of history) {
        if (w && w.exercise === exerciseName) { last = w; break; }
    }
    if (!last || !last.maxWeight) return null;

    const weight = parseFloat(last.maxWeight) || 0;
    const reps = parseInt(last.bestReps) || 0;
    const rpe = parseFloat(last.avgRpe) || 0;
    const roundTo2_5 = (n) => Math.round(n / 2.5) * 2.5;

    if (rpe >= 9.5) {
        return {
            kind: 'backoff',
            targetWeight: Math.max(0, roundTo2_5(weight * 0.95)),
            targetReps: reps,
            reason: 'rpe_high'
        };
    }
    if (rpe > 0 && rpe <= 7) {
        const inc = weight >= 40 ? 5 : 2.5;
        return {
            kind: 'weight',
            targetWeight: roundTo2_5(weight + inc),
            targetReps: reps,
            reason: 'rpe_low'
        };
    }
    // RPE bilinmiyorsa veya 8-9 bandindaysa tekrar artisi dene
    return {
        kind: 'reps',
        targetWeight: weight,
        targetReps: reps + 1,
        reason: 'next_rep'
    };
}

// ---------------------------------------------------------------------------
// 5) KUVVET DENGESI ORANLARI
// ---------------------------------------------------------------------------

// Oran ciftleri: ana hareket eslesmeleri (bilimsel referans araliklar)
export const BALANCE_PAIRS = [
    { id: 'push_pull', push: ['Barbell Bench Press', 'Bench Press'], pull: ['Barbell Row', 'Bent Over Row', 'Barbell Bent Over Row'], ideal: [1.0, 1.2], label: 'Bench : Row' },
    { id: 'quad_ham', push: ['Barbell Squat', 'Squat'], pull: ['Romanian Deadlift', 'Deadlift'], ideal: [1.3, 1.7], label: 'Squat : RDL' }
];

/**
 * En iyi e1RM uzerinden kuvvet dengesi oranlarini hesaplar.
 * @returns {Array<{ id, label, pushName, pullName, ratio, idealMin, idealMax, status }>}
 * status: 'balanced' | 'push_heavy' | 'pull_heavy'
 */
export function balanceRatios(history) {
    if (!Array.isArray(history) || !history.length) return [];

    const bestE1rm = (names) => {
        let best = null;
        history.forEach(w => {
            if (!w || !names.includes(w.exercise)) return;
            const e = estimate1RM(w.maxWeight, w.bestReps);
            if (e > 0 && (!best || e > best.e1rm)) best = { name: w.exercise, e1rm: e };
        });
        return best;
    };

    return BALANCE_PAIRS.map(p => {
        const push = bestE1rm(p.push);
        const pull = bestE1rm(p.pull);
        if (!push || !pull || pull.e1rm <= 0) return null;

        const ratio = push.e1rm / pull.e1rm;
        const [idealMin, idealMax] = p.ideal;
        const status = ratio < idealMin ? 'pull_heavy' : ratio > idealMax ? 'push_heavy' : 'balanced';

        return {
            id: p.id,
            label: p.label,
            pushName: push.name,
            pullName: pull.name,
            ratio,
            idealMin,
            idealMax,
            status
        };
    }).filter(Boolean);
}

// ---------------------------------------------------------------------------
// 6) ILERLEME HIZI — hedef projeksiyonu (Faz 5c) icin
// ---------------------------------------------------------------------------

/**
 * Bir egzersizin e1RM trend hızını hesaplar (kg/hafta, son 90 gun).
 * @returns {null | { perWeek: number, current: number, weeks: number }}
 */
export function progressionRate(exerciseName, history, days = 90) {
    const cutoff = Date.now() - days * DAY;
    const series = e1rmSeries(exerciseName, history).filter(s => s.ts >= cutoff);
    if (series.length < 3) return null;

    const first = series[0];
    const last = series[series.length - 1];
    const weeks = Math.max(1, (last.ts - first.ts) / (7 * DAY));
    const perWeek = (last.e1rm - first.e1rm) / weeks;

    return { perWeek, current: last.e1rm, weeks: Math.round(weeks) };
}

/**
 * Hedef e1RM'ye kac hafta sonra ulasilir (mevcut hizla).
 * @returns {null | { weeks: number, perWeek: number, target, current }}
 */
export function projectGoal(exerciseName, history, targetE1rm) {
    if (!targetE1rm || targetE1rm <= 0) return null;
    const rate = progressionRate(exerciseName, history);
    if (!rate || rate.perWeek <= 0) return null;
    if (rate.current >= targetE1rm) return null;

    const weeks = Math.ceil((targetE1rm - rate.current) / rate.perWeek);
    return { weeks, perWeek: rate.perWeek, target: targetE1rm, current: rate.current };
}
