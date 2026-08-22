/*
 * ENVATER YARDIMCI KATMANI
 *
 * Tum satin alma / stok / kozmetik sahiplik mantigi burada.
 * Bilesenler sadece sonucu gosterir. Saf fonksiyonlar -> test edilebilir.
 *
 * localStorage semasi:
 *  - gym_app_inventory        : { boostId: adet }
 *  - gym_app_cosmetics        : [ cosmeticId ]  (sahip olunanlar)
 *  - gym_app_cosmetics_active : { frame, nameStyle, flame, prEffect }
 */

import { BOOSTS, ALL_COSMETICS, cosmeticCategoryOf } from '../data/shopItems.js';

// ---------- BOOST STOGU ----------

export const getStock = (inventory, boostId) => (inventory && inventory[boostId]) || 0;

export const canBuyBoost = (inventory, boostId) => {
    const boost = BOOSTS.find(b => b.id === boostId);
    if (!boost) return false;
    return getStock(inventory, boostId) < boost.maxStock;
};

// Satin al: yetersiz coin -> { ok:false, reason:'coins' }, stok dolu -> 'stock'
export const buyBoost = (coins, inventory, boostId) => {
    const boost = BOOSTS.find(b => b.id === boostId);
    if (!boost) return { ok: false, reason: 'unknown' };
    if (!canBuyBoost(inventory, boostId)) return { ok: false, reason: 'stock' };
    if (coins < boost.price) return { ok: false, reason: 'coins', needed: boost.price - coins };

    const next = { ...(inventory || {}), [boostId]: getStock(inventory, boostId) + 1 };
    return { ok: true, coins: coins - boost.price, inventory: next };
};

// Tuket: stokta varsa 1 azalt
export const consumeBoost = (inventory, boostId) => {
    const cur = getStock(inventory, boostId);
    if (cur <= 0) return null;
    const next = { ...(inventory || {}) };
    if (cur - 1 <= 0) delete next[boostId];
    else next[boostId] = cur - 1;
    return next;
};

// ---------- KOZMETIKLER ----------

export const ownsCosmetic = (owned, id) => Array.isArray(owned) && owned.includes(id);

export const buyCosmetic = (coins, owned, cosmeticId) => {
    const item = ALL_COSMETICS.find(c => c.id === cosmeticId);
    if (!item) return { ok: false, reason: 'unknown' };
    if (ownsCosmetic(owned, cosmeticId)) return { ok: false, reason: 'owned' };
    if (coins < item.price) return { ok: false, reason: 'coins', needed: item.price - coins };

    return { ok: true, coins: coins - item.price, owned: [...(owned || []), cosmeticId] };
};

// Kozmetik kutudan dusme: bedava sahiplenme (coin kontrolu yok)
export const grantCosmetic = (owned, cosmeticId) => {
    if (ownsCosmetic(owned, cosmeticId)) return null; // zaten var
    return [...(owned || []), cosmeticId];
};

// Kusan / cikar. Kategorisi belli degilse islem yok.
export const setCosmeticActive = (activeMap, cosmeticId) => {
    const cat = cosmeticCategoryOf(cosmeticId);
    if (!cat) return null;
    const next = { ...(activeMap || {}), [cat]: cosmeticId };
    return next;
};

export const clearCosmeticActive = (activeMap, category) => {
    const next = { ...(activeMap || {}) };
    delete next[category];
    return next;
};

// Aktif kozmetik tanimini getir (orn. aktif cerceve objesi)
export const getActive = (activeMap, owned, category) => {
    const id = activeMap && activeMap[category];
    if (!id || !ownsCosmetic(owned, id)) return null;
    return ALL_COSMETICS.find(c => c.id === id) || null;
};
