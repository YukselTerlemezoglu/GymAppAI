export const RANKS = [
    { maxLevel: 5, title_tr: "Demir Çaylak", title_en: "Iron Rookie", color: "#a1a1aa", icon: "🛡️" },
    { maxLevel: 10, title_tr: "Bronz Savaşçı", title_en: "Bronze Warrior", color: "#cd7f32", icon: "⚔️" },
    { maxLevel: 20, title_tr: "Gümüş Atlet", title_en: "Silver Athlete", color: "#c0c0c0", icon: "🏃" },
    { maxLevel: 30, title_tr: "Altın Spartan", title_en: "Golden Spartan", color: "#ffd700", icon: "🔱" },
    { maxLevel: 40, title_tr: "Platin Gladyatör", title_en: "Platinum Gladiator", color: "#e5e4e2", icon: "🏟️" },
    { maxLevel: 50, title_tr: "Elmas Şampiyon", title_en: "Diamond Champion", color: "#00ffff", icon: "💎" },
    { maxLevel: Infinity, title_tr: "Elit Titan", title_en: "Elite Titan", color: "#ff00ff", icon: "👑" },
];

export const getRank = (level) => {
    return RANKS.find(rank => level <= rank.maxLevel) || RANKS[RANKS.length - 1];
};
