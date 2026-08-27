// HIIT INTERVAL MOTORU (Faz 5e) — kardiyo & kondisyon zamanlayicisi.
// Saf fonksiyonlar: plan olusturma, ilerleme hesabi, kalori tahmini.
// UI (HiitTimerView) bu motoru kullanir; hicbir React bagimliligi yok.

/**
 * Hazir HIIT protokolleri. work = calisma, rest = dinlenme (sn),
 * rounds = tur, recovery = turler arasi uzun dinlenme (sn).
 */
export const HIIT_PROTOCOLS = {
    tabata:     { id: 'tabata',     work: 20, rest: 10, rounds: 8,  recovery: 0,  meta: true },
   	emom:       { id: 'emom',       work: 45, rest: 15, rounds: 10, recovery: 0,  meta: true },
    ladder:     { id: 'ladder',     work: 30, rest: 30, rounds: 10, recovery: 60, meta: true },
    hiit30:     { id: 'hiit30',     work: 60, rest: 30, rounds: 6,  recovery: 60, meta: true },
    custom:     { id: 'custom',     work: 40, rest: 20, rounds: 8,  recovery: 0,  meta: false }
};

/**
 * Protokol tanimindan zamanlanmis kesit listesi uretir.
 * Ornek tabata: [W20, R10, W20, R10, ...] (recovery 0 ise ara yok)
 * @returns {{type:'work'|'rest'|'recovery', round:number, seconds:number}[]}
 */
export function buildIntervals(protocol) {
    if (!protocol) return [];
    const out = [];
    for (let r = 1; r <= protocol.rounds; r++) {
        out.push({ type: 'work', round: r, seconds: protocol.work });
        if (r < protocol.rounds) {
            out.push({ type: 'rest', round: r, seconds: protocol.rest });
            if (protocol.recovery > 0 && r % 2 === 0 && r + 1 <= protocol.rounds) {
                out.push({ type: 'recovery', round: r, seconds: protocol.recovery });
            }
    }
    }
    return out;
}

/** Kesit listesinin toplam suresi (sn). */
export function totalDuration(intervals) {
    return (intervals || []).reduce((s, i) => s + i.seconds, 0);
}

/**
 * Gecen sureden mevcut kesit ve kesit ici kalan sureyi bulur.
 * @returns {{index:number, type:string, round:number, secondsLeft:number, elapsedTotal:number}|null}
 */
export function currentSegment(intervals, elapsed) {
    if (!Array.isArray(intervals) || intervals.length === 0) return null;
    const total = totalDuration(intervals);
    const e = Math.max(0, Math.min(elapsed, total));
    let acc = 0;
    for (let i = 0; i < intervals.length; i++) {
        const seg = intervals[i];
        if (e < acc + seg.seconds) {
            return { index: i, type: seg.type, round: seg.round, seconds: seg.seconds, secondsLeft: seg.seconds - (e - acc), elapsedTotal: e };
        }
        acc += seg.seconds;
    }
    // Son kesit bitti: son kesit "0 saniye kaldi" ile dondurulur
    const last = intervals[intervals.length - 1];
    return { index: intervals.length - 1, type: last.type, round: last.round, seconds: last.seconds, secondsLeft: 0, elapsedTotal: total };
}

/**
 * MET tabanli kaba kalori tahmini (sadece bilgi amacli).
 * work kesimleri ~8 MET, rest/recovery ~3 MET varsayilir.
 * @param {number} weightKg - vucut agirligi
 */
export function estimateCalories(intervals, weightKg = 70) {
    if (!Array.isArray(intervals)) return 0;
    const metWork = 8, metRest = 3;
    let kcal = 0;
    intervals.forEach(seg => {
        const met = seg.type === 'work' ? metWork : metRest;
        kcal += (met * 3.5 * (weightKg || 70)) / 200 * seg.seconds / 60;
    });
    return Math.round(kcal);
}

/**
 * Ozet satiri: "8 tur • 4 dk calisma • 4:00 toplam" benzeri metinler
 * icin ham sayilar (metin i18n tarafinda kurulur).
 */
export function protocolSummary(protocol) {
    if (!protocol) return null;
    const intervals = buildIntervals(protocol);
    const workSec = intervals.filter(i => i.type === 'work').reduce((s, i) => s + i.seconds, 0);
    return {
        rounds: protocol.rounds,
        workSec,
        totalSec: totalDuration(intervals)
    };
}
