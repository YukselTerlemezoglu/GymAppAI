/*
 * RUTBELER v2 - 10 kademeli progresyon
 *
 * Yeni seviye egrisine (levelSystem.js) gore dengelendi:
 * Demir Çaylak (1-4), Bronz (5-9), Gümüş (10-17), Altın (18-26),
 * Platin (27-34), Elmas (35-44), Master (45-59), Efsane (60-74),
 * Titan (75-89), Olimpos (90+).
 */

export const RANKS = [
    { maxLevel: 4, title_tr: "Demir Çaylak", title_en: "Iron Rookie", color: "#a1a1aa", icon: "🛡️" },
    { maxLevel: 9, title_tr: "Bronz Savaşçı", title_en: "Bronze Warrior", color: "#cd7f32", icon: "⚔️" },
    { maxLevel: 17, title_tr: "Gümüş Atlet", title_en: "Silver Athlete", color: "#c0c0c0", icon: "🏃" },
    { maxLevel: 26, title_tr: "Altın Spartan", title_en: "Golden Spartan", color: "#ffd700", icon: "🔱" },
    { maxLevel: 34, title_tr: "Platin Gladyatör", title_en: "Platinum Gladiator", color: "#e5e4e2", icon: "🏟️" },
    { maxLevel: 44, title_tr: "Elmas Şampiyon", title_en: "Diamond Champion", color: "#00ffff", icon: "💎" },
    { maxLevel: 59, title_tr: "Master Kuşak", title_en: "Master Belt", color: "#adff2f", icon: "🥋" },
    { maxLevel: 74, title_tr: "Efsane Savaşçı", title_en: "Legendary Warrior", color: "#ff8c00", icon: "⚡" },
    { maxLevel: 89, title_tr: "Elit Titan", title_en: "Elite Titan", color: "#ff00ff", icon: "👑" },
    { maxLevel: Infinity, title_tr: "Olimpos Tanrısı", title_en: "Olympian", color: "#ff4757", icon: "🌟" },
];

export const getRank = (level) => {
    return RANKS.find(rank => level <= rank.maxLevel) || RANKS[RANKS.length - 1];
};

// Simdiki rutbenin indeksi (0-tabanli)
export const getRankIndex = (level) => {
    const idx = RANKS.findIndex(rank => level <= rank.maxLevel);
    return idx === -1 ? RANKS.length - 1 : idx;
};

// Sonraki rutbe bilgisi + seviye bazli ilerleme yuzdesi (son rutbede null)
export const getRankProgress = (level) => {
    const idx = getRankIndex(level);
    const current = RANKS[idx];
    const next = RANKS[idx + 1] || null;
    if (!next) return { current, next: null, percent: 100, rankIndex: idx, totalRanks: RANKS.length };
    const prevMax = idx === 0 ? 1 : RANKS[idx - 1].maxLevel + 1;
    const span = next.maxLevel - prevMax + 1;
    const done = level - prevMax;
    const percent = Math.min(100, Math.max(0, (done / span) * 100));
    return { current, next, percent, rankIndex: idx, totalRanks: RANKS.length };
};
