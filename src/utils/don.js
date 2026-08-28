// DOUBLE OR NOTHING (DoN) MOTORU
//
// Gorev odulu tahsil edilirken coin'i riske atma mekligi.
// - Odul coin'i HIC cuzdana girmeden "pot" (escrow) olarak modalda tutulur.
// - "Riske Gir": yazı-tura. Tura -> pot x2 (devam/cekil), Yazı -> pot 0.
// - Tavan: MAX_MULT (8x). Tavana ulasinca zincir otomatik biter (guvenli alma).
// - Gunluk limit: gunde 1 zincir (3'ten 1 secim sistemiyle uyumlu).
// - Kayip mesaji notr: kınama yok, dram yok.
//
// localStorage: gym_app_don -> { day, chainsUsed, stats }
//   stats: { longestChain, biggestBank, totalWon, totalLost, flips, wins }

export const DON_MAX_MULT = 8;        // zincir carpani tavani (1x -> 2x -> 4x -> 8x)
export const DON_CHAINS_PER_DAY = 1;  // 3'ten 1 secim: gunde tek gorev, tek zincir

/**
 * Yazı-tura. random enjekte edilebilir (test).
 * @returns {'heads'|'tails'} heads = tura (kazanc), tails = yazı (kayıp)
 */
export function flip(random = Math.random) {
    return random() < 0.5 ? 'heads' : 'tails';
}

/**
 * Gunluk hak kontrolu.
 * @param {Object} donData - { day, chainsUsed, stats }
 * @param {string} dayKey - bugunun 'YYYY-MM-DD' anahtari
 */
export function canStartChain(donData, dayKey) {
    if (!donData) return true;
    if (donData.day !== dayKey) return true;
    return (donData.chainsUsed || 0) < DON_CHAINS_PER_DAY;
}

/**
 * Zincirdeki siradaki carpan. pot = base * mult.
 * @returns {number} siradaki carpan (2, 4, 8) veya null (tavanda)
 */
export function nextMult(currentMult) {
    if (currentMult >= DON_MAX_MULT) return null;
    return currentMult * 2;
}

/**
 * Flip sonucunu istatistige isle + gunluk hakki dusur.
 * CAGRIDA cagirilir: gunluk hak zincirin BASINDA dusulmez, bitisinde dusulur
 * (kayip/cekilme/ayrilma hangisi olursa olsun zincir "kullanildi" sayilir).
 *
 * @param {Object} donData - mevcut gym_app_don
 * @param {Object} res - { day, banked, lost, chainLen, flips }
 *   banked: cekilince cuzdana giren coin (guvenli alma = banked > 0)
 *   lost:   yazı gelince yanip giden pot (0 degilse kayip zamani)
 * @returns {Object} yeni donData (immutable)
 */
export function applyChainResult(donData, res, dayKey) {
    const prevStats = (donData && donData.day === dayKey ? donData.stats : null) || {
        longestChain: 0, biggestBank: 0, totalWon: 0, totalLost: 0, flips: 0, wins: 0
    };

    const stats = {
        longestChain: Math.max(prevStats.longestChain || 0, res.chainLen || 0),
        biggestBank: Math.max(prevStats.biggestBank || 0, res.banked || 0),
        totalWon: (prevStats.totalWon || 0) + (res.banked || 0),
        totalLost: (prevStats.totalLost || 0) + (res.lost || 0),
        flips: (prevStats.flips || 0) + (res.flips || 0),
        wins: (prevStats.wins || 0) + (res.wins || 0)
    };

    return {
        day: dayKey,
        chainsUsed: res.banked > 0 || res.lost > 0 ? 1 : 0,
        stats
    };
}

/**
 * Net kar/zarar (istatistik karti icin).
 */
export function donNet(stats) {
    if (!stats) return 0;
    return (stats.totalWon || 0) - (stats.totalLost || 0);
}
