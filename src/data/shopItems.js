/*
 * DUKKAN URUN KATALOGU v1
 *
 * Tek dogruluk kaynagi. Bilesenler sadece goruntuler; mantik inventory.js'de.
 *
 * Kategoriler:
 *  - boost   : tuketilebilir (stok sinirli)
 *  - box     : sans kutusu / yumurta (gacha)
 *  - cosmetic: kalici kozmetik (frame / name / flame / prfx)
 *
 * Nadirlik renkleri (rarity): common, rare, epic, legendary
 */

export const RARITY = {
    common: { key: 'common', color: '#a1a1aa', glow: 'rgba(161,161,170,0.35)' },
    rare: { key: 'rare', color: '#00c3ff', glow: 'rgba(0,195,255,0.45)' },
    epic: { key: 'epic', color: '#c06bff', glow: 'rgba(192,107,255,0.5)' },
    legendary: { key: 'legendary', color: '#ffd700', glow: 'rgba(255,215,0,0.55)' }
};

// ---------- BOOST'LAR (tuketilebilir) ----------
export const BOOSTS = [
    {
        id: 'freeze',
        icon: '🧊',
        price: 150,
        maxStock: 2,
        title_tr: 'Seri Dondurucu',
        title_en: 'Streak Freeze',
        desc_tr: 'Haftalık hedefi kaçırırsan seriyi otomatik korur.',
        desc_en: 'Automatically protects your streak if you miss the weekly goal.'
    },
    {
        id: 'xp2',
        icon: '⚡',
        price: 250,
        maxStock: 3,
        title_tr: 'Çifte XP İksiri',
        title_en: 'Double XP Potion',
        desc_tr: 'Sıradaki antrenman XP ve jeton kazanımını 2x yapar.',
        desc_en: 'Doubles XP and coin gain for your next workout.'
    },
    {
        id: 'snack',
        icon: '🍖',
        price: 50,
        maxStock: 10,
        title_tr: 'Dost Atıştırmalığı',
        title_en: 'Buddy Snack',
        desc_tr: 'Aktif dostuna +150 buddy XP verir.',
        desc_en: 'Gives your active buddy +150 buddy XP.'
    }
];

// ---------- GACHA KUTULARI ----------
export const BOXES = [
    {
        id: 'chest',
        icon: '🎲',
        price: 100,
        title_tr: 'Şans Kutusu',
        title_en: 'Lucky Chest',
        desc_tr: 'XP, jeton, buddy XP veya kozmetik çıkabilir. Pity: 10 kutuda Destansı+ garanti.',
        desc_en: 'Contains XP, coins, buddy XP or cosmetics. Pity: Epic+ guaranteed in 10 boxes.'
    },
    {
        id: 'egg',
        icon: '🥚',
        price: 350,
        title_tr: 'Dost Yumurtası',
        title_en: 'Buddy Egg',
        desc_tr: '16 dosttan biri çıkar. Tekrar düşenler buddy XP\'ye dönüşür. Pity: 10\'da Destansı+, 30\'da Efsanevi.',
        desc_en: 'One of 16 buddies. Duplicates convert to buddy XP. Pity: Epic+ at 10, Legendary at 30.'
    }
];

// ---------- KOZMETIKLER (kalici) ----------
// v2 ekonomi: gunluk gorev geliri 50-200 (tek secim) — prestij fiyatlari
// buna gore kalibre: rare ~1.5-2 gun, epic ~2-3 gun, legendary ~3-5 gun birikim.
// frame: dost kapsulu + paylasim karti cercevesi
export const COSMETIC_FRAMES = [
    { id: 'frame_neon', rarity: 'rare', price: 250, icon: '💠', title_tr: 'Neon Çerçeve', title_en: 'Neon Frame' },
    { id: 'frame_retro', rarity: 'rare', price: 350, icon: '📺', title_tr: 'Retro Çerçeve', title_en: 'Retro Frame' },
    { id: 'frame_gold', rarity: 'epic', price: 500, icon: '🏅', title_tr: 'Altın Çerçeve', title_en: 'Gold Frame' },
    { id: 'frame_crown', rarity: 'legendary', price: 800, icon: '👑', title_tr: 'Şampiyon Tacı', title_en: 'Champion Crown' }
];

// nameStyle: profil + lider tablosu + paylasim karti isim stili
export const COSMETIC_NAME_STYLES = [
    { id: 'name_gold', rarity: 'rare', price: 350, icon: '✨', cssColor: '#ffd700', cssTextShadow: '0 0 8px rgba(255,215,0,0.6)', title_tr: 'Altın İsim', title_en: 'Golden Name' },
    { id: 'name_neon', rarity: 'epic', price: 500, icon: '🌟', cssColor: '#00c3ff', cssTextShadow: '0 0 10px rgba(0,195,255,0.8)', title_tr: 'Neon Parıltılı İsim', title_en: 'Neon Glowing Name' },
    { id: 'name_flame', rarity: 'legendary', price: 800, icon: '🔥', cssColor: '#ff6b35', cssTextShadow: '0 0 10px rgba(255,107,53,0.8)', title_tr: 'Alevli İsim', title_en: 'Flaming Name' }
];

// flame: skor karti + paylasim kartindaki seri alevi rengi
export const COSMETIC_FLAMES = [
    { id: 'flame_blue', rarity: 'rare', price: 300, icon: '🔥', color: '#00c3ff', title_tr: 'Mavi Alev', title_en: 'Blue Flame' },
    { id: 'flame_purple', rarity: 'epic', price: 500, icon: '🔥', color: '#c06bff', title_tr: 'Mor Alev', title_en: 'Purple Flame' },
    { id: 'flame_ice', rarity: 'legendary', price: 800, icon: '🔥', color: '#a8e6ff', title_tr: 'Buz Alevi', title_en: 'Ice Flame' }
];

// prfx: PR kutlamasinda kullanilan konfeti stili
export const COSMETIC_PR_EFFECTS = [
    { id: 'prfx_hearts', rarity: 'rare', price: 250, icon: '💖', title_tr: 'Kalp Patlaması', title_en: 'Heart Burst' },
    { id: 'prfx_gold', rarity: 'rare', price: 300, icon: '💛', title_tr: 'Altın Yağmuru', title_en: 'Gold Rain' },
    { id: 'prfx_fireworks', rarity: 'epic', price: 450, icon: '🎆', title_tr: 'Havai Fişek', title_en: 'Fireworks' },
    { id: 'prfx_stars', rarity: 'legendary', price: 650, icon: '🌟', title_tr: 'Yıldız Şöleni', title_en: 'Star Festival' }
];

// Tum kozmetikler tek listede (sahiplik sorgulari icin)
export const ALL_COSMETICS = [
    ...COSMETIC_FRAMES,
    ...COSMETIC_NAME_STYLES,
    ...COSMETIC_FLAMES,
    ...COSMETIC_PR_EFFECTS
];

export const COSMETIC_CATEGORY = {
    frame: COSMETIC_FRAMES,
    nameStyle: COSMETIC_NAME_STYLES,
    flame: COSMETIC_FLAMES,
    prEffect: COSMETIC_PR_EFFECTS
};

// Kozmetik id -> kategori adi
export const cosmeticCategoryOf = (id) => {
    if (COSMETIC_FRAMES.some(c => c.id === id)) return 'frame';
    if (COSMETIC_NAME_STYLES.some(c => c.id === id)) return 'nameStyle';
    if (COSMETIC_FLAMES.some(c => c.id === id)) return 'flame';
    if (COSMETIC_PR_EFFECTS.some(c => c.id === id)) return 'prEffect';
    return null;
};

// Id'den kozmetik tanimini bul
export const findCosmetic = (id) => ALL_COSMETICS.find(c => c.id === id) || null;
