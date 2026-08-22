/*
 * GACHA MOTORU
 *
 * Sans kutusu, dost yumurtasi ve gunluk cark icin agirlikli rastgele cekilis.
 * Pity sistemi YALNIZCA kutu ve yumurta icin (carkta pity YOK - kullanici karari).
 *
 * localStorage:
 *  - gym_app_gacha_pity : { chest: number, chestGuarantee: number|null, egg: number, eggLegendary: number }
 *     chest: Destansı+ cikmayan kutu sayaci (10'da garanti)
 *     egg:   Destansı+ cikmayan yumurta sayaci (10'da garanti)
 *     eggLegendary: Efsanevi cikmayan yumurta sayaci (30'da garanti)
 */

import { BUDDIES, DUPE_XP } from './buddy.js';
import { COSMETIC_FRAMES, COSMETIC_NAME_STYLES, COSMETIC_FLAMES, COSMETIC_PR_EFFECTS, ALL_COSMETICS } from '../data/shopItems.js';

// Deterministik test edilebilirlik icin rastgelelik enjekte edilebilir
const defaultRandom = Math.random;

// Agirlikli rastgele secim: [{ ..., weight }] listesinden bir eleman
const weightedPick = (entries, random = defaultRandom) => {
    const total = entries.reduce((s, e) => s + e.weight, 0);
    let roll = random() * total;
    for (const e of entries) {
        roll -= e.weight;
        if (roll <= 0) return e;
    }
    return entries[entries.length - 1];
};

const randInt = (min, max, random = defaultRandom) => Math.floor(random() * (max - min + 1)) + min;

// ---------- DOST YUMURTASI ----------

// Yumurta agirliklari: Sıradan %55, Nadir %30, Destansı %12, Efsanevi %3
const EGG_RARITY_WEIGHTS = { common: 55, rare: 30, epic: 12, legendary: 3 };

export const EGG_PITY_EPIC = 10;   // 10 yumurtada Destansı+ garanti
export const EGG_PITY_LEGENDARY = 30; // 30 yumurtada Efsanevi garanti

/*
 * Yumurta ac. Pity sayaclariyla calisir:
 *  - eggLegendary >= 29 -> garanti legendary
 *  - egg >= 9           -> garanti epic+
 * Donus: { buddyId, rarity, dupe, dupeXp }
 */
export const openEgg = (pity = {}, random = defaultRandom) => {
    const eggCount = pity.egg || 0;
    const legCount = pity.eggLegendary || 0;

    let rarity;
    if (legCount >= EGG_PITY_LEGENDARY - 1) {
        rarity = 'legendary';
    } else if (eggCount >= EGG_PITY_EPIC - 1) {
        // epic veya legendary'den rastgele (agirlikla)
        rarity = weightedPick([{ k: 'epic', weight: 80 }, { k: 'legendary', weight: 20 }], random).k;
    } else {
        rarity = weightedPick(
            Object.entries(EGG_RARITY_WEIGHTS).map(([k, weight]) => ({ k, weight })),
            random
        ).k;
    }

    const pool = BUDDIES.filter(b => b.rarity === rarity);
    const buddy = pool[randInt(0, pool.length - 1, random)];

    return {
        type: 'buddy',
        buddyId: buddy.id,
        rarity,
        // dupe/dupeXp, cagiran taraf tarafindan koleksiyona bakilarak belirlenir
        dupeXp: DUPE_XP[rarity]
    };
};

// Yumurta sonrasi pity guncelleme
export const updateEggPity = (pity, result) => {
    const next = { ...(pity || {}), egg: (pity.egg || 0) + 1, eggLegendary: (pity.eggLegendary || 0) + 1 };
    if (result.rarity === 'epic' || result.rarity === 'legendary') next.egg = 0;
    if (result.rarity === 'legendary') next.eggLegendary = 0;
    return next;
};

// ---------- SANS KUTUSU ----------

export const CHEST_PITY_EPIC = 10;

const CHEST_TABLE = [
    // Sıradan %60
    { rarity: 'common', weight: 24, kind: 'xp', min: 60, max: 150 },
    { rarity: 'common', weight: 18, kind: 'coins', min: 30, max: 80 },
    { rarity: 'common', weight: 18, kind: 'buddyXp', min: 60, max: 120 },
    // Nadir %25
    { rarity: 'rare', weight: 10, kind: 'xp', min: 200, max: 350 },
    { rarity: 'rare', weight: 8, kind: 'coins', min: 100, max: 200 },
    { rarity: 'rare', weight: 7, kind: 'snack', min: 1, max: 3 },
    // Destansı %12
    { rarity: 'epic', weight: 5, kind: 'xp', min: 400, max: 700 },
    { rarity: 'epic', weight: 4, kind: 'cosmetic' },
    { rarity: 'epic', weight: 3, kind: 'buddyXp', min: 400, max: 600 },
    // Efsanevi %3 (jackpot)
    { rarity: 'legendary', weight: 2, kind: 'jackpot', min: 1000, max: 1500, coinsMin: 250, coinsMax: 400 },
    { rarity: 'legendary', weight: 1, kind: 'cosmetic', highValueOnly: true }
];

/*
 * Kutu ac. ownedCosmetics: kullaniciya ait kozmetik id listesi
 * (kozmetik dususu sahip olunmayanlardan secer; hepsi varsa coin'e donusur).
 */
export const openChest = (pity = {}, ownedCosmetics = [], random = defaultRandom) => {
    const chestCount = pity.chest || 0;

    let table = CHEST_TABLE;
    if (chestCount >= CHEST_PITY_EPIC - 1) {
        // Pity: sadece epic+ kisitlari
        table = CHEST_TABLE.filter(e => e.rarity === 'epic' || e.rarity === 'legendary');
    }

    let entry = weightedPick(table, random);
    let result = { rarity: entry.rarity };

    switch (entry.kind) {
        case 'xp':
            result.type = 'xp';
            result.amount = randInt(entry.min, entry.max, random);
            break;
        case 'coins':
            result.type = 'coins';
            result.amount = randInt(entry.min, entry.max, random);
            break;
        case 'buddyXp':
            result.type = 'buddyXp';
            result.amount = randInt(entry.min, entry.max, random);
            break;
        case 'snack':
            result.type = 'snack';
            result.amount = randInt(entry.min, entry.max, random);
            break;
        case 'cosmetic': {
            // Deger siniri: normal slot <=400, efsanevi slot <=600
            const maxPrice = entry.highValueOnly ? 600 : 400;
            let pool = ALL_COSMETICS.filter(c => !ownedCosmetics.includes(c.id) && c.price <= maxPrice);
            if (pool.length === 0) {
                // Her seye sahipse coin'e donus (250-400)
                result.type = 'coins';
                result.amount = randInt(250, 400, random);
                result.converted = true;
            } else {
                const pick = pool[randInt(0, pool.length - 1, random)];
                result.type = 'cosmetic';
                result.cosmeticId = pick.id;
            }
            break;
        }
        case 'jackpot':
            result.type = 'jackpot';
            result.amount = randInt(entry.min, entry.max, random);   // XP
            result.coins = randInt(entry.coinsMin, entry.coinsMax, random);
            break;
        default:
            result.type = 'xp';
            result.amount = randInt(60, 150, random);
    }

    return result;
};

// Kutu sonrasi pity guncelleme
export const updateChestPity = (pity, result) => {
    const next = { ...(pity || {}), chest: (pity.chest || 0) + 1 };
    if (result.rarity === 'epic' || result.rarity === 'legendary') next.chest = 0;
    return next;
};

// ---------- GUNLUK CARK (pity YOK) ----------

export const WHEEL_SEGMENTS = [
    { label_tr: '+50 XP', label_en: '+50 XP', rarity: 'common', weight: 16, kind: 'xp', amount: 50 },
    { label_tr: '+80 🪙', label_en: '+80 🪙', rarity: 'common', weight: 16, kind: 'coins', amount: 80 },
    { label_tr: '+100 XP', label_en: '+100 XP', rarity: 'common', weight: 16, kind: 'xp', amount: 100 },
    { label_tr: '🍖 +120', label_en: '🍖 +120', rarity: 'rare', weight: 15, kind: 'buddyXp', amount: 120 },
    { label_tr: '+250 XP', label_en: '+250 XP', rarity: 'rare', weight: 15, kind: 'xp', amount: 250 },
    { label_tr: '+400 🪙', label_en: '+400 🪙', rarity: 'epic', weight: 8, kind: 'coins', amount: 400 },
    { label_tr: '+600 XP', label_en: '+600 XP', rarity: 'epic', weight: 8, kind: 'xp', amount: 600 },
    { label_tr: '🎰 JACKPOT', label_en: '🎰 JACKPOT', rarity: 'legendary', weight: 6, kind: 'jackpot', amount: 1000, coins: 250 }
];

export const WHEEL_PRICE = 125;      // ekstra cevirme fiyati
export const WHEEL_EXTRA_MAX = 2;    // gunluk ekstra cevirme siniri

// Cark cevir (pity yok)
export const spinWheel = (random = defaultRandom) => {
    const seg = weightedPick(WHEEL_SEGMENTS, random);
    const idx = WHEEL_SEGMENTS.indexOf(seg);
    return {
        segmentIndex: idx,
        segment: seg,
        rarity: seg.rarity,
        type: seg.kind,
        amount: seg.amount,
        coins: seg.coins || 0
    };
};

// Gunluk anahtar (YYYY-MM-DD, yerel saat)
export const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/*
 * Cark durumu: { lastFreeSpin, extraSpins }
 *  - freeAvailable: bugunun ucretsiz cevirmesi henuz kullanilmadi
 *  - extraLeft: bugun kalan ekstra cevirme
 */
export const getWheelState = (state) => {
    const today = todayKey();
    if (!state || state.lastFreeSpin !== today) {
        return { freeAvailable: true, extraLeft: WHEEL_EXTRA_MAX, day: today };
    }
    const extraToday = state.day === today ? (state.extraSpins || 0) : 0;
    return { freeAvailable: false, extraLeft: Math.max(0, WHEEL_EXTRA_MAX - extraToday), day: today };
};

// cevirme sonrasi durum guncelle (free mi extra mi)
export const updateWheelState = (state, usedFree) => {
    const today = todayKey();
    const base = state && state.day === today ? state : { day: today, extraSpins: 0 };
    if (usedFree) return { ...base, day: today, lastFreeSpin: today, extraSpins: base.extraSpins || 0 };
    return { ...base, day: today, lastFreeSpin: state?.lastFreeSpin || null, extraSpins: (base.extraSpins || 0) + 1 };
};
