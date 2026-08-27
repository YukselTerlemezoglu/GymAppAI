// KOC KURAL MOTORU (Faz 1a).
// Kullanici verisini inceleyip icgoru (insight) uretir.
// Turetme: her kural { id, priority, tone, data } dondurur; metin katmani
// (bilesen + i18n) bunu kullanicinin dilinde ve DOSTUN KISILIGINE gore sunar.
// Sifir API cagrisi, sifir token — tamamen yerel analiz.

import { findAllPlateaus, neglectedGroups, nextLoadSuggestion, balanceRatios } from './strengthMath';
import { readinessScore, shouldDeload } from './readiness';
import { MUSCLE_GROUPS } from '../data/exercises';

const DAY = 86400000;

// ---------------------------------------------------------------------------
// Dost kisilikleri — ayni analiz, farkli ton (Faz 1c ile entegre).
// Kisilikler yalnizca sunum farkidir; analiz gucu her dostta tamdir.
// ---------------------------------------------------------------------------
export const BUDDY_PERSONALITIES = {
    // sert ama iyi kalpli antrenor
    dragon: {
        id: 'dragon',
        nameKey: 'coach_personality_dragon',
        greetingKey: 'coach_dragon_hello',
        style: 'tough'
    },
    // sabirli, sicak destekci
    bunny: {
        id: 'bunny',
        nameKey: 'coach_personality_bunny',
        greetingKey: 'coach_bunny_hello',
        style: 'gentle'
    },
    // bilimsel, sakin analist
    owl: {
        id: 'owl',
        nameKey: 'coach_personality_owl',
        greetingKey: 'coach_owl_hello',
        style: 'analytical'
    },
    // enerjik hiperman
    cat: {
        id: 'cat',
        nameKey: 'coach_personality_cat',
        greetingKey: 'coach_cat_hello',
        style: 'hype'
    }
};

// Uygulamadaki 13 dost tipi -> kisilik eslesmesi (buddy.js BUDDIES id'leri)
export function personalityForBuddy(buddyId) {
    if (!buddyId) return null;
    const id = String(buddyId);
    if (/dragon|rex|dino/.test(id)) return BUDDY_PERSONALITIES.dragon;
    if (/bunny|rabbit/.test(id)) return BUDDY_PERSONALITIES.bunny;
    if (/owl|fox|wolf/.test(id)) return BUDDY_PERSONALITIES.owl;
    if (/cat|tiger|lion|panda/.test(id)) return BUDDY_PERSONALITIES.cat;
    return null; // eslesme yoksa nötr koç tonu kullanilir
}

// ---------------------------------------------------------------------------
// Icgoru uretici — ana giris noktasi
// ---------------------------------------------------------------------------

/**
 * Tum veri kaynaklarini tarayip oncelik sirali icgoruler uretir.
 * @param {Object} ctx
 * @param {Array}  ctx.workoutHistory - antrenman kayitlari
 * @param {Object|null} ctx.sleepData - uyku kayitlari (opsiyonel)
 * @param {Object|null} ctx.painData  - check-in agri haritasi (opsiyonel)
 * @param {number} ctx.weeklyGoal     - haftalik hedef (varsayilan 3)
 * @returns {Array<{ id, priority, tone, data }>} en yuksek oncelik ilk
 */
export function generateInsights(ctx) {
    const { workoutHistory = [], sleepData = null, painData = null, weeklyGoal = 3 } = ctx || {};
    const insights = [];

    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) {
        return [{
            id: 'empty_history',
            priority: 100,
            tone: 'neutral',
            data: {}
        }];
    }

    // --- 1) PLATO TESPITI -------------------------------------------------
    const plateaus = findAllPlateaus(workoutHistory);
    if (plateaus.length > 0) {
        const p = plateaus[0];
        insights.push({
            id: 'plateau',
            priority: 90,
            tone: 'warning',
            data: { exercise: p.exercise, weeks: p.weeks, lastE1rm: Math.round(p.lastE1rm), sessions: p.sessions }
        });
    }

    // --- 2) TOPARLANMA BORCU (uyku + frekans) ------------------------------
    const recovery = analyzeRecovery(workoutHistory, sleepData);
    if (recovery && recovery.level === 'high') {
        insights.push({
            id: 'recovery_debt',
            priority: 85,
            tone: 'warning',
            data: recovery
        });
    } else if (recovery && recovery.level === 'moderate') {
        insights.push({
            id: 'recovery_watch',
            priority: 60,
            tone: 'info',
            data: recovery
        });
    }

    // --- 3) IHMAL EDILEN KAS GRUBU ----------------------------------------
    const neglected = neglectedGroups(workoutHistory, 7, 1);
    if (neglected.length > 0) {
        const g = neglected[0];
        insights.push({
            id: 'neglected_group',
            priority: 70,
            tone: 'suggestion',
            data: { group: g.group, sets: g.sets, min: g.min }
        });
    }

    // --- 4) PROGRESIF ASIRI YUK FIRSATI ------------------------------------
    const overloadOp = findOverloadOpportunity(workoutHistory);
    if (overloadOp) {
        insights.push({
            id: 'overload_opportunity',
            priority: 65,
            tone: 'success',
            data: overloadOp
        });
    }

    // --- 5) HAFTALIK HEDEF DURUMU ------------------------------------------
    const weekStatus = weeklyStatus(workoutHistory, weeklyGoal);
    if (weekStatus.behind && weekStatus.daysLeft > 0) {
        insights.push({
            id: 'weekly_goal_risk',
            priority: 55,
            tone: 'info',
            data: weekStatus
        });
    } else if (weekStatus.done) {
        insights.push({
            id: 'weekly_goal_done',
            priority: 40,
            tone: 'success',
            data: weekStatus
        });
    }

    // --- 6) KUVVET DENGESI --------------------------------------------------
    const balances = balanceRatios(workoutHistory);
    const imbalance = balances.find(b => b.status !== 'balanced');
    if (imbalance) {
        insights.push({
            id: 'balance_' + imbalance.id,
            priority: 50,
            tone: 'suggestion',
            data: { ...imbalance, ratio: imbalance.ratio.toFixed(2) }
        });
    }

    // --- 6b) HAZIRLIK SKORU (Faz 4) ----------------------------------------
    const lastCheckIn = painData && painData.lastCheckIn ? painData.lastCheckIn : null;
    const rd = readinessScore(workoutHistory, lastCheckIn, sleepData);
    if (rd.score !== null) {
        insights.push({
            id: 'readiness',
            priority: rd.band === 'deload' ? 92 : rd.band === 'caution' ? 75 : 62,
            tone: rd.band === 'deload' || rd.band === 'caution' ? 'warning' : rd.band === 'fresh' ? 'success' : 'info',
            data: { score: rd.score, band: rd.band, action: rd.action, factors: rd.factors }
        });
    }

    // --- 6c) DELOAD ONERISI (Faz 4) ----------------------------------------
    if (shouldDeload(workoutHistory)) {
        insights.push({
            id: 'deload_week',
            priority: 93,
            tone: 'warning',
            data: {}
        });
    }

    // --- 7) AGRI VERISI VARSA (check-in) -------------------------------------
    if (painData && painData.maxLevel >= 4) {
        insights.push({
            id: 'pain_alert',
            priority: 95,
            tone: 'warning',
            data: { region: painData.maxRegion, level: painData.maxLevel }
        });
    }

    return insights.sort((a, b) => b.priority - a.priority);
}

// ---------------------------------------------------------------------------
// Yardimci analizler
// ---------------------------------------------------------------------------

/** Toparlanma durumu: uyku ortalamasi + son 14 gun antrenman sikligi + RPE */
export function analyzeRecovery(workoutHistory, sleepData) {
    const cutoff = Date.now() - 14 * DAY;
    const recent = (Array.isArray(workoutHistory) ? workoutHistory : []).filter(w => {
        const ts = new Date(w?.date).getTime();
        return !isNaN(ts) && ts >= cutoff;
    });

    if (recent.length === 0) return null;

    // Ortalama RPE (kayitli ise)
    const rpes = recent.map(w => parseFloat(w?.avgRpe) || 0).filter(r => r > 0);
    const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;

    // Benzersiz antrenman gunleri (son 14 gunde)
    const days = new Set(recent.map(w => Math.floor(new Date(w.date).getTime() / DAY)));
    const freq = days.size / 2; // haftalik oran

    // Uyku ortalamasi (son 7 kayit, saat)
    let avgSleep = 0;
    if (sleepData && Array.isArray(sleepData.log)) {
        const logs = sleepData.log.slice(0, 7).map(l => parseFloat(l?.hours) || 0).filter(h => h > 0);
        if (logs.length) avgSleep = logs.reduce((a, b) => a + b, 0) / logs.length;
    }

    // Skorlama: 0 (iyi) - 3 (kritik) arasi borc puani
    let debt = 0;
    if (freq >= 5) debt += 1;
    if (avgRpe >= 8.5) debt += 1;
    if (avgSleep > 0 && avgSleep < 6.5) debt += 1;

    const level = debt >= 2 ? 'high' : debt === 1 ? 'moderate' : 'low';

    return {
        level,
        debt,
        avgRpe: Math.round(avgRpe * 10) / 10,
        weeklyFreq: Math.round(freq * 10) / 10,
        avgSleep: Math.round(avgSleep * 10) / 10,
        sessions14d: days.size
    };
}

/** Haftalik hedef durumu: kac antrenman yapildi, hedefe uzaklik */
export function weeklyStatus(workoutHistory, weeklyGoal = 3) {
    const cutoff = Date.now() - 7 * DAY;
    const recent = (Array.isArray(workoutHistory) ? workoutHistory : []).filter(w => {
        const ts = new Date(w?.date).getTime();
        return !isNaN(ts) && ts >= cutoff;
    });
    const days = new Set(recent.map(w => Math.floor(new Date(w.date).getTime() / DAY)));
    const done = days.size >= weeklyGoal;

    // Haftanin kac gunu kaldi (pazartesi bazli)
    const now = new Date();
    const dow = (now.getDay() + 6) % 7; // 0 = pzt
    const daysLeft = 7 - dow - 1 + (dow === 6 ? 0 : 1);

    return {
        done,
        count: days.size,
        goal: weeklyGoal,
        behind: !done && (weeklyGoal - days.size) > daysLeft,
        daysLeft: Math.max(0, daysLeft)
    };
}

/** En guclu progresif overload firsati: en cok yapilan harekette son yuk onerisi */
export function findOverloadOpportunity(workoutHistory) {
    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) return null;

    const counts = {};
    workoutHistory.forEach(w => {
        if (w?.exercise) counts[w.exercise] = (counts[w.exercise] || 0) + 1;
    });
    const topEx = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    if (!topEx) return null;

    const sugg = nextLoadSuggestion(topEx, workoutHistory);
    if (!sugg) return null;

    return {
        exercise: topEx,
        kind: sugg.kind,
        targetWeight: sugg.targetWeight,
        targetReps: sugg.targetReps,
        reason: sugg.reason,
        sessions: counts[topEx]
    };
}

/** Grup id -> gorunen ad (i18n'siz fallback; bilesen MUSCLE_GROUPS'tan alir) */
export function groupName(group) {
    const g = MUSCLE_GROUPS.find(m => m.id === group);
    return g ? g.name : group;
}
