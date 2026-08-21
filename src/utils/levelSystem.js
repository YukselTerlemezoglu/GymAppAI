/*
 * SEVIYE SISTEMI v2 - tek dogruluk kaynagi (single source of truth)
 *
 * Onceki sistem: her seviye icin gereken XP = level * 600 (dogrusal).
 * Yeni sistem: taban + ustsel buyume - her seviye bir oncekinden ~%8 zor.
 *
 * Eski kayitlardaki (level, xp) ikilisi yeni sistemde anlamini yitirir;
 * bu yuzden migrasyon fonksiyonu eski dogrusal sisteme gore TOPLAM XP
 * hesaplayip yeni sistemde karsiligini bulur. Kullanici XP kaybetmez.
 *
 * Eski sistemin "seviye icinde birikmis XP" degeri korunur: migrasyon,
 * toplam eski XP'yi yeni egrinin uzerine yerlestirir.
 */

// Yeni bir seviyeye gecmek icin gereken XP (seviye L -> L+1)
export const xpForNextLevel = (level) => {
    const lvl = Math.max(1, Math.floor(level));
    // Taban 500, seviye basina %8 buyume: L1=540, L5=734, L10=1080, L20=2333, L50=16900
    return Math.round(500 * Math.pow(1.08, lvl - 1) / 10) * 10;
};

// 1..L arasi tum seviyelerin XP toplami (L seviyesine ulasmak icin toplam XP)
export const totalXpForLevel = (level) => {
    let sum = 0;
    for (let i = 1; i < Math.max(1, Math.floor(level)); i++) sum += xpForNextLevel(i);
    return sum;
};

// Toplam XP -> seviye + seviye icindeki kalan XP
export const levelFromTotalXp = (totalXp) => {
    let lvl = 1;
    let rem = Math.max(0, Math.floor(totalXp || 0));
    while (rem >= xpForNextLevel(lvl) && lvl < 999) {
        rem -= xpForNextLevel(lvl);
        lvl += 1;
    }
    return { level: lvl, xp: rem, need: xpForNextLevel(lvl) };
};

/*
 * MIGRASYON: eski dogrusal sistemdeki (level, xp) degerini yeni sisteme cevirir.
 * Eslesen degerler: totalOldXp = eski level'e kadar gerekenler + birikmis xp.
 * Sonra yeni sistemde ayni toplam XP ile seviye bulunur.
 */
export const migrateLevelData = (oldLevel, oldXp, oldVersion = 0) => {
    if (oldVersion >= 2) return null; // zaten yeni sistem
    const oldLinearNeed = (lvl) => lvl * 500 + lvl * 100; // eski formul (v1)
    let totalOld = Math.max(0, Math.floor(oldXp || 0));
    for (let i = 1; i < Math.max(1, Math.floor(oldLevel || 1)); i++) {
        totalOld += oldLinearNeed(i);
    }
    return {
        ...levelFromTotalXp(totalOld),
        totalXp: totalOld,
        version: 2
    };
};

// Progress helpers
export const levelProgress = (xp, level) => {
    const need = xpForNextLevel(level);
    return {
        need,
        percent: Math.min(100, Math.max(0, (xp / need) * 100))
    };
};
