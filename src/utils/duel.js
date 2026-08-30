// Haftalik dost duellosu - saf mantik katmani.
// Veri kaynagi: profiles/{uid} dokumanindaki weekStats { key, days, volume }
// ve duelTarget { uid, week } alanlari (publishProfile ile yazilir).
//
// Duello kurali: iki kullanicinin duelTarget'i ayni hafta icin birbirini
// gosteriyorsa duel aktiftir. Hafta degince skorlar doner, odul acilir.
// Koleksiyon/Cloud Function gerektirmez; mevcut Firestore kurallari yeter.

import { getWeekKey } from './consistency.js';

/** Haftalik antrenman istatistigi: workoutHistory'den bu haftanin ozeti. */
export function computeWeekStats(workoutHistory, now = new Date(), targetWeek = null) {
    const weekKey = targetWeek || getWeekKey(now);
    if (!weekKey) return { key: null, days: 0, volume: 0 };
    const daySet = new Set();
    let volume = 0;
    (workoutHistory || []).forEach((w) => {
        if (!w?.date) return;
        if (getWeekKey(w.date) !== weekKey) return;
        const d = new Date(w.date);
        daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        volume += Number(w.totalWeight) || 0;
    });
    return { key: weekKey, days: daySet.size, volume: Math.round(volume) };
}


/** Haftalik skor kaynagi: profil objesinde weekStats (guncel) veya prevWeekStats (arsiv) uzerinden istenen haftayi bulur. */
function weekStatsFor(profile, week) {
    if (!week) return null;
    const cur = profile?.weekStats;
    if (cur && cur.key === week) return cur;
    const prev = profile?.prevWeekStats;
    if (prev && prev.key === week) return prev;
    return null;
}
/**
 * Duello skoru: gun basina 100 puan + tonaj basina (1000kg) 10 puan.
 * Gun sayisi agirlikli: 4 gun x hafif > 3 gun x agir mantigi korunur.
 */
export function duelScore(weekStats) {
    if (!weekStats || typeof weekStats !== 'object') return 0;
    const days = Number(weekStats.days) || 0;
    const volume = Number(weekStats.volume) || 0;
    if (weekStats.key === null || weekStats.key === undefined) return 0;
    return days * 100 + Math.floor(volume / 1000) * 10;
}

/**
 * Iki tarafin duelTarget'ine bakarak duel durumunu cikarir.
 * @param {object} me    - { uid, weekStats, duelTarget: {uid, week}|null }
 * @param {object} other - { uid, weekStats, duelTarget: {uid, week}|null }
 * @param {string} currentWeek - getWeekKey(new Date())
 * @returns {{active:boolean, mutual:boolean, invited:boolean, week:string, myScore:number, otherScore:number}}
 *          active = bu hafta gecerli karsilikli duel.
 */
export function duelState(me, other, currentWeek) {
    const myScore = duelScore(weekStatsFor(me, currentWeek));
    const otherScore = duelScore(weekStatsFor(other, currentWeek));
    const iAsked = me?.duelTarget?.uid === other?.uid && me?.duelTarget?.week === currentWeek;
    const theyAsked = other?.duelTarget?.uid === me?.uid && other?.duelTarget?.week === currentWeek;
    const hasAny = Boolean(iAsked || theyAsked);
    return {
        active: Boolean(iAsked && theyAsked),
        mutual: Boolean(iAsked && theyAsked),
        invited: hasAny,
        week: currentWeek,
        myScore,
        otherScore
    };
}

/**
 * Gecmis hafta duellosunun sonucu (odul tahsiti icin).
 * @returns {null | {winner:'me'|'other'|'tie', myScore:number, otherScore:number}}
 *          Sadece duel o hafta KARSILIKLI ise sonuc doner.
 */
export function pastDuelResult(me, other, pastWeek) {
    if (!pastWeek) return null;
    const iAsked = me?.duelTarget?.uid === other?.uid && me?.duelTarget?.week === pastWeek;
    const theyAsked = other?.duelTarget?.uid === me?.uid && other?.duelTarget?.week === pastWeek;
    if (!iAsked || !theyAsked) return null;
    const myScore = duelScore(weekStatsFor(me, pastWeek));
    const otherScore = duelScore(weekStatsFor(other, pastWeek));
    return {
        winner: myScore > otherScore ? 'me' : otherScore > myScore ? 'other' : 'tie',
        myScore,
        otherScore
    };
}

/**
 * Odul miktari (haftada bir, EV makul): kazanan 150, kaybeden 50, beraberlik 100.
 */
export function duelReward(winner) {
    if (winner === 'tie') return 100;
    if (winner === 'me') return 150;
    if (winner === 'other') return 50;
    return 0;
}

/** Tahsil edilmis duel odulleri local kaydi icin anahtar uretir. */
export const duelClaimKey = (week, pairId) => `duel_${week}_${pairId}`;

/** Gecen haftanin anahtari (bugune gore). */
export function lastWeekKey(now = new Date()) {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return getWeekKey(d);
}