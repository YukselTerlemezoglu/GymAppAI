// SEZON SISTEMI v1 (Faz 5a).
// 8 haftalik sezonlar + 1 hafta off-season. SP (Sezon Puani) birikimi:
//   - antrenman tamamlama (hedefe gore)
//   - hacim katkisi (logaritmik — spam cezası)
//   - PR bonuslari
// Ligler: Bronz -> Gumus -> Altin -> Elmas -> Efsane. DUSUS YOKTUR.
// Her sezon SP sifirlanir (arkadaslarla adil yarisma), lig korunur.

const DAY = 86400000;

export const SEASON_WEEKS = 8;
export const OFFSEASON_WEEKS = 1;

export const LEAGUES = [
    { id: 'bronze', minSP: 0, icon: '🥉', color: '#cd7f32' },
    { id: 'silver', minSP: 1500, icon: '🥈', color: '#c0c0c0' },
    { id: 'gold', minSP: 4000, icon: '🥇', color: '#ffd700' },
    { id: 'diamond', minSP: 8000, icon: '💎', color: '#00c3ff' },
    { id: 'legend', minSP: 14000, icon: '👑', color: '#ff0088' }
];

export function leagueForSP(sp) {
    let l = LEAGUES[0];
    LEAGUES.forEach(x => { if (sp >= x.minSP) l = x; });
    return l;
}

export function nextLeague(sp) {
    return LEAGUES.find(x => x.minSP > sp) || null;
}

// ---------------------------------------------------------------------------
// Sezon takvimi
// ---------------------------------------------------------------------------

/**
 * Belirli bir tarih anindaki sezon bilgisini hesaplar.
 * Sezon 1: uygulamanin sezon baslangic tarihinden itibaren 8+1 haftalik dongu.
 * @param {number} epoch - sezon 1 baslangic zamani (ms) — sabit epoch kullanilir
 * @param {number} now - simdi (ms)
 */
export function seasonInfo(epoch, now = Date.now()) {
    const cycleMs = (SEASON_WEEKS + OFFSEASON_WEEKS) * 7 * DAY;
    const elapsed = Math.max(0, now - epoch);
    const idx = Math.floor(elapsed / cycleMs);
    const intoCycle = elapsed % cycleMs;
    const isOffSeason = intoCycle >= SEASON_WEEKS * 7 * DAY;

    const seasonStart = epoch + idx * cycleMs;
    const seasonEnd = seasonStart + SEASON_WEEKS * 7 * DAY;

    return {
        number: idx + 1,
        isOffSeason,
        week: Math.min(SEASON_WEEKS, Math.floor(intoCycle / (7 * DAY)) + 1),
        daysLeft: Math.max(0, Math.ceil((seasonEnd - now) / DAY)),
        seasonStart,
        seasonEnd
    };
}

// Sabit epoch: 2026-09-07 (ilk pazartesi) — uygulamanin sezon 1 baslangici
export const SEASON_EPOCH = new Date('2026-09-07T00:00:00Z').getTime();

// ---------------------------------------------------------------------------
// SP hesaplama
// ---------------------------------------------------------------------------

/**
 * Bir antrenman kaydindan SP uretir.
 * @param {Object} w - workout kaydi
 * @param {number} baseSP - antrenman basi taban puan (varsayilan 25)
 */
export function spFromWorkout(w, baseSP = 25) {
    if (!w) return 0;
    let sp = baseSP;

    // Hacim katkisi: logaritmik (spam korumasi) — 5000kg'da ~+20, 20k'da ~+33
    const vol = (w.totalWeight) || ((w.maxWeight || 0) * (w.bestReps || 0) * (w.sets || 0));
    if (vol > 0) sp += Math.round(Math.log10(vol) * 5);

    // Set sayisi bonusu
    const sets = parseInt(w.sets) || 0;
    if (sets >= 12) sp += 10;
    else if (sets >= 8) sp += 5;

    return sp;
}

/**
 * Sezon ICINDE kalan kayitlarin toplam SP'si.
 * @param {Array} workoutHistory
 * @param {Object|null} prBonusLog - { 'YYYY-MM-DD': count } gunluk PR sayilari (opsiyonel)
 */
export function seasonSP(workoutHistory, prBonusLog = null, epoch = SEASON_EPOCH, now = Date.now()) {
    const { seasonStart, seasonEnd } = seasonInfo(epoch, now);
    let sp = 0;
    let workouts = 0;

    (Array.isArray(workoutHistory) ? workoutHistory : []).forEach(w => {
        if (!w || !w.date) return;
        const ts = new Date(w.date).getTime();
        if (isNaN(ts) || ts < seasonStart || ts >= seasonEnd) return;
        sp += spFromWorkout(w);
        workouts += 1;
    });

    // PR bonuslari: her PR +50 SP
    if (prBonusLog) {
        Object.entries(prBonusLog).forEach(([dateKey, count]) => {
            const ts = new Date(dateKey).getTime();
            if (!isNaN(ts) && ts >= seasonStart && ts < seasonEnd) {
                sp += (parseInt(count) || 0) * 50;
            }
        });
    }

    return { sp, workouts };
}

/**
 * Sezon bitiminde yapilacak gecis: yeni sezon SP'si 0, lig korunur/yukselir.
 * @returns {Object} yeni sezon durumu
 */
export function rolloverSeason(prev) {
    const total = (prev?.totalSP || 0) + (prev?.seasonSP || 0);
    const league = leagueForSP(total);
    return {
        seasonNumber: (prev?.seasonNumber || 1) + 1,
        seasonSP: 0,
        totalSP: total,
        league: league.id,
        history: [...(prev?.history || []), { season: prev?.seasonNumber || 1, sp: prev?.seasonSP || 0, league: prev?.league || 'bronze' }]
    };
}

// ---------------------------------------------------------------------------
// Sezon odulleri (kosmetik) — lig bazli
// ---------------------------------------------------------------------------
export const SEASON_REWARDS = {
    bronze: null,
    silver: { type: 'frame', id: 'frame_silver_wave' },
    gold: { type: 'frame', id: 'frame_gold_aurora' },
    diamond: { type: 'flame', id: 'flame_diamond' },
    legend: { type: 'frame', id: 'frame_legend_crown' }
};
