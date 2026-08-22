/*
 * DOST (BUDDY) SISTEMI
 *
 * 16 dost, 4 nadirlik, 6 evrim evresi.
 * Buddy XP kaynaklari: antrenman XP'sinin %30 KOPYASI (kullanicidan dusmez),
 * atistirmalik (+150), kutu odulu. Nadirlik cokenin buddy XP carpanini etkiler.
 *
 * localStorage:
 *  - gym_app_buddies      : { [buddyId]: { xp } }
 *  - gym_app_buddy_active : buddyId
 */

import { RARITY } from '../data/shopItems.js';

// ---------- DOST TURLERI ----------
export const BUDDIES = [
    // Sıradan (4)
    { id: 'monkey', icon: '🐵', rarity: 'common', title_tr: 'Maymun', title_en: 'Monkey' },
    { id: 'turtle', icon: '🐢', rarity: 'common', title_tr: 'Kaplumbağa', title_en: 'Turtle' },
    { id: 'hamster', icon: '🐹', rarity: 'common', title_tr: 'Hamster', title_en: 'Hamster' },
    { id: 'frog', icon: '🐸', rarity: 'common', title_tr: 'Kurbağa', title_en: 'Frog' },
    // Nadir (4)
    { id: 'gorilla', icon: '🦍', rarity: 'rare', title_tr: 'Goril', title_en: 'Gorilla' },
    { id: 'wolf', icon: '🐺', rarity: 'rare', title_tr: 'Kurt', title_en: 'Wolf' },
    { id: 'eagle', icon: '🦅', rarity: 'rare', title_tr: 'Kartal', title_en: 'Eagle' },
    { id: 'bear', icon: '🐻', rarity: 'rare', title_tr: 'Ayı', title_en: 'Bear' },
    // Destansı (3)
    { id: 'dragon', icon: '🐉', rarity: 'epic', title_tr: 'Ejderha', title_en: 'Dragon' },
    { id: 'robot', icon: '🤖', rarity: 'epic', title_tr: 'Robot', title_en: 'Robot' },
    { id: 'kraken', icon: '🐙', rarity: 'epic', title_tr: 'Kraken', title_en: 'Kraken' },
    // Efsanevi (2)
    { id: 'lion', icon: '🦁', rarity: 'legendary', title_tr: 'Altın Aslan', title_en: 'Golden Lion' },
    { id: 'phoenix', icon: '🔥', rarity: 'legendary', title_tr: 'Anka Kuşu', title_en: 'Phoenix' }
];

export const findBuddy = (id) => BUDDIES.find(b => b.id === id) || null;

// ---------- NADIRLIK CARPANLARI (buddy XP kazanci) ----------
export const RARITY_MULTIPLIER = {
    common: 1.0,
    rare: 1.1,
    epic: 1.25,
    legendary: 1.5
};

// ---------- EVRIM EVRELERI ----------
// Esikler buddy XP; gorsel evreler emoji boyut + aura ile ayristirilir.
export const EVOLUTION_STAGES = [
    { key: 'egg', threshold: 0, title_tr: 'Yumurta', title_en: 'Egg', icon: '🥚', size: 0.8, aura: false },
    { key: 'crack', threshold: 500, title_tr: 'Çatlıyor', title_en: 'Cracking', icon: '🥚', size: 0.85, aura: true },
    { key: 'baby', threshold: 1500, title_tr: 'Yavru', title_en: 'Baby', icon: null, size: 0.6, aura: true }, // icon null -> dost emojisi kullanilir
    { key: 'teen', threshold: 4000, title_tr: 'Genç', title_en: 'Teen', icon: null, size: 0.8, aura: true },
    { key: 'master', threshold: 10000, title_tr: 'Usta', title_en: 'Master', icon: null, size: 1.0, aura: true, sparks: true },
    { key: 'legend', threshold: 25000, title_tr: 'Efsane', title_en: 'Legend', icon: null, size: 1.15, aura: true, crown: true, sparks: true }
];

export const MAX_STAGE = EVOLUTION_STAGES.length - 1;

// Buddy XP -> evre indeksi
export const stageOf = (buddyXp) => {
    let idx = 0;
    for (let i = 0; i < EVOLUTION_STAGES.length; i++) {
        if (buddyXp >= EVOLUTION_STAGES[i].threshold) idx = i;
    }
    return idx;
};

// Evre bilgisi + sonraki evre ilerlemesi (progress bar icin)
export const getBuddyStageInfo = (buddyXp) => {
    const idx = stageOf(buddyXp);
    const stage = EVOLUTION_STAGES[idx];
    const next = EVOLUTION_STAGES[idx + 1] || null;
    const from = stage.threshold;
    const to = next ? next.threshold : stage.threshold + 1;
    const percent = next
        ? Math.min(100, Math.max(0, ((buddyXp - from) / (to - from)) * 100))
        : 100;
    return { stage, stageIndex: idx, next, percent, currentXp: buddyXp, needXp: next ? to - buddyXp : 0 };
};

// ---------- XP ISLEMLERI ----------

// Antrenman XP'sinden buddy kazanci (%30 kopya * nadirlik carpani)
export const buddyGainFromWorkout = (workoutXp, rarity) => {
    const mult = RARITY_MULTIPLIER[rarity] || 1.0;
    return Math.max(1, Math.round(workoutXp * 0.30 * mult));
};

// Dost koleksiyonuna XP ekle -> yeni koleksiyon + evrim bilgisi
export const addBuddyXp = (collection, buddyId, amount) => {
    const cur = collection && collection[buddyId] ? collection[buddyId].xp : 0;
    const newXp = Math.max(0, Math.floor(cur + amount));
    const next = { ...(collection || {}), [buddyId]: { xp: newXp } };
    const prevStage = stageOf(cur);
    const newStage = stageOf(newXp);
    return { collection: next, evolved: newStage > prevStage, stageIndex: newStage, xp: newXp };
};

// Sahip olunan dost sayisi (koleksiyon tamamlanma orani)
export const collectionCount = (collection) => Object.keys(collection || {}).length;

export const COLLECTION_TOTAL = BUDDIES.length;

// Tekrar (dupe) buddy XP donusumu
export const DUPE_XP = {
    common: 100,
    rare: 250,
    epic: 500,
    legendary: 1000
};

// ---------- AKTIF DOST ----------

export const getActiveBuddy = (collection, activeId) => {
    if (!activeId || !collection || !collection[activeId]) return null;
    const def = findBuddy(activeId);
    if (!def) return null;
    return { ...def, xp: collection[activeId].xp };
};

// Nadirlik rengi kisa yolu
export const rarityColor = (rarity) => (RARITY[rarity] || RARITY.common).color;
