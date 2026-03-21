export const RANKS = [
    { maxLevel: 5, title: "Demir Çaylak", color: "#a1a1aa", icon: "🛡️" },
    { maxLevel: 10, title: "Bronz Savaşçı", color: "#cd7f32", icon: "⚔️" },
    { maxLevel: 20, title: "Gümüş Atlet", color: "#c0c0c0", icon: "🏃" },
    { maxLevel: 30, title: "Altın Spartan", color: "#ffd700", icon: "🔱" },
    { maxLevel: 40, title: "Platin Gladyatör", color: "#e5e4e2", icon: "🏟️" },
    { maxLevel: 50, title: "Elmas Şampiyon", color: "#00ffff", icon: "💎" },
    { maxLevel: Infinity, title: "Elit Titan", color: "#ff00ff", icon: "👑" },
];

export const getRank = (level) => {
    return RANKS.find(rank => level <= rank.maxLevel) || RANKS[RANKS.length - 1];
};
