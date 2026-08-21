/*
 * HAFTALIK TUTARLILIK SISTEMI (weekly consistency)
 *
 * Duolingo tarzi gunluk seri, dinlenme gunleri olan bir spor programiyla
 * celisir (her gun antrenman sartmis gibi). Bu modul seriyi HAFTALIK hale
 * getirir:
 *   - Haftanin kac gununda antrenman yapildi? (Pazartesi baslangicli)
 *   - Haftalik hedef kac gun? (kullanici ayari, varsayilan 3)
 *   - Seri (streak): Ust uste kac haftadir haftalik hedefe ulasildi?
 *     Ara hafta hedefe ulasilamazsa seri sifirlanir; DINLENME GUNLERI
 *     seriyi bozmaz - sadece haftanin toplami onemlidir.
 *
 * Not: Geçmiş hesaplama workoutHistory'den TURETILIR; ayri saklanmaz.
 * Boylece kullanici geckmisi silerse seri de tutarli kalir.
 */

// ISO hafta anahtari: "2026-W34" (Pazartesi gunu haftanin basi)
export const getWeekKey = (date) => {
    const d = date instanceof Date ? new Date(date) : new Date(date);
    if (isNaN(d.getTime())) return null;
    // UTC gece yarisi probleminden kacinmak icin yerel gun bazinda isle
    const day = (d.getDay() + 6) % 7; // Pazartesi=0 ... Pazar=6
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
    const y = monday.getFullYear();
    const jan1 = new Date(y, 0, 1);
    const week = Math.floor((monday - jan1) / (7 * 24 * 3600 * 1000)) + 1;
    return `${y}-W${String(week).padStart(2, '0')}`;
};

// Iki hafta anahtari arasindaki hafta farki (b-a)
export const weekDiff = (a, b) => {
    if (!a || !b) return Infinity;
    const [ya, wa] = a.split('-W').map(Number);
    const [yb, wb] = b.split('-W').map(Number);
    return (yb - ya) * 52 + (wb - wa);
};

const toKey = (dstr) => {
    const d = new Date(dstr);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/*
 * workoutHistory'den butun haftalarin antrenman gun sayilarini cikarir.
 * Donus: Map<weekKey, dayCount>
 */
export const getWeeksMap = (workoutHistory) => {
    const weeks = new Map();
    (workoutHistory || []).forEach(w => {
        if (!w || !w.date) return;
        const key = toKey(w.date);
        if (!key) return;
        const wk = getWeekKey(key);
        if (!wk) return;
        const prev = weeks.get(wk) || { days: new Set(), count: 0 };
        prev.days.add(key);
        prev.count = prev.days.size;
        weeks.set(wk, prev);
    });
    return weeks;
};

/*
 * Ana hesap: ust uste kac haftadir hedefe ulasildi (aktif seri).
 * Gecmis haftalara dogru yurur; hedefe ulasamayan hafta seriyi keser.
 * MEVCUT hafta sayilmaz (daha bitmedi) - sadece "bu hafta s/ hedef"
 * gostergesi olarak kullanilir.
 */
export const calcWeeklyStreak = (workoutHistory, weeklyGoal = 3) => {
    const weeks = getWeeksMap(workoutHistory);
    const currentWeek = getWeekKey(new Date());
    let streak = 0;
    let cursor = currentWeek;
    // Onceki haftadan basla (mevcut hafta henuz tamamlanmadi)
    let weeksBack = 1;
    const maxIter = 520; // ~10 yil guvenlik siniri
    while (weeksBack <= maxIter) {
        // Bir onceki haftanin anahtarini hesapla
        const monday = weekKeyToMonday(cursor);
        monday.setDate(monday.getDate() - 7);
        cursor = getWeekKey(monday);
        const info = weeks.get(cursor);
        if (info && info.count >= weeklyGoal) {
            streak++;
        } else {
            break;
        }
        weeksBack++;
    }
    // En az bir antrenman var ama seri 0 ise: kullanici yeni baslamis olabilir
    return { streak, currentWeek, weeksThisWeek: weeks.get(currentWeek)?.count || 0 };
};

// Hafta anahtarindan Pazartesi Date'ine
export const weekKeyToMonday = (weekKey) => {
    const [y, w] = weekKey.split('-W').map(Number);
    const jan1 = new Date(y, 0, 1);
    // Ilk Pazartesi'yi bul
    const jan1Day = (jan1.getDay() + 6) % 7;
    const firstMonday = new Date(y, 0, 1 + ((8 - jan1Day) % 7 || 7) - 1);
    const monday = new Date(firstMonday);
    monday.setDate(monday.getDate() + (w - 1) * 7);
    return monday;
};

/*
 * XP carpani: haftalik seriye gore (dinlenme gunleri bagimsiz).
 * 4+ hafta: 1.5x, 2+ hafta: 1.2x (bir onceki gunluk sistemle benzer his)
 */
export const weeklyMultiplier = (weeklyStreak) => {
    if (weeklyStreak >= 4) return 1.5;
    if (weeklyStreak >= 2) return 1.2;
    return 1.0;
};
