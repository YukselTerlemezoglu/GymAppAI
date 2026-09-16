import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RARITY, findCosmetic } from '../../data/shopItems';
import { findBuddy, BUDDIES } from '../../utils/buddy';
import { playSound } from '../../utils/sounds';

/*
 * CS2 TARZI ACILIS REEL'I
 *
 * Yatay kart seridi: once hizli akar, yavaslar ve kazananin biraz
 * gecip hafif geri teperek ustunde durur ("near miss + snap back"),
 * CS2 kasa acilisindaki gibi. Her kart gecisinde tik sesi.
 *
 * Gosterim: kazanan KESIN olarak ortadaki isaretcinin altina gelir;
 * reel icerigi ornentli (gercek olasilikla orantili, sansli) -
 * sonuc onceden bellidir, reel yalnizca SUNUMDUR.
 */

const CARD_W = 84;    // kart genisligi (gap dahil)
const GAP = 8;
const VISIBLE = 4.2;  // gorsel pencere (kart)

const iconFor = (r, isEgg) => {
    if (isEgg) {
        const b = findBuddy(r.buddyId);
        return b ? b.icon : '❔';
    }
    switch (r.type) {
        case 'xp': return '⭐';
        case 'coins': return '🪙';
        case 'buddyXp': return '🍖';
        case 'snack': return '🍖';
        case 'jackpot': return '🎰';
        case 'cosmetic': {
            const c = findCosmetic(r.cosmeticId);
            return c ? c.icon : '🎁';
        }
        default: return '🎁';
    }
};

const nameFor = (r, isEgg, lang) => {
    if (isEgg) {
        const b = findBuddy(r.buddyId);
        return b ? (lang === 'tr' ? b.title_tr : b.title_en) : '?';
    }
    switch (r.type) {
        case 'xp': return `+${r.amount} XP`;
        case 'coins': return `+${r.amount} 🪙`;
        case 'buddyXp': return `+${r.amount} 🍖`;
        case 'snack': return `+${r.amount}× 🍖`;
        case 'jackpot': return `+${r.amount} XP +${r.coins} 🪙`;
        case 'cosmetic': {
            const c = findCosmetic(r.cosmeticId);
            return c ? (lang === 'tr' ? c.title_tr : c.title_en) : '?';
        }
        default: return '?';
    }
};

/*
 * Reel icerigi uret: kazanan + etrafinda olasilikla orantili rastgele
 * "dolgu" kartlar (nadir seyrek gorunur -> gercek cekilis hissi).
 */
const buildReel = (winner, pool, count) => {
    // pool: [{ rarity, weight }] seklinde doldurulur (cagiran verir)
    const total = pool.reduce((s, e) => s + e.weight, 0);
    const pick = () => {
        let roll = Math.random() * total;
        for (const e of pool) {
            roll -= e.weight;
            if (roll <= 0) return e;
        }
        return pool[pool.length - 1];
    };
    const items = [];
    const WINNER_AT = count - 3; // bitiste onceki konum: snap-back icin
    for (let i = 0; i < count; i++) {
        items.push(i === WINNER_AT ? winner : { ...pick(), __filler: true });
    }
    return { items, winnerIndex: WINNER_AT };
};

function CsReel({ result, mode, lang, onDone }) {
    // mode: 'chest' | 'egg'  (cark icin kullanilmaz)
    const [reel] = React.useState(() => {
        // Dolgu havuzu: cekilis tablosundan rarity agirliklariyla.
        // Yumurta modunda her filler'a o rarity'den GERCEK bir buddy atanir;
        // boylece akteritte ❔/bozuk kart gorunmez.
        const pickBuddyId = (rarity) => {
            const pool = BUDDIES.filter(b => b.rarity === rarity);
            return pool[Math.floor(Math.random() * pool.length)].id;
        };
        const pool = mode === 'egg'
            ? [
                { rarity: 'common', weight: 55, type: 'buddy', buddyId: pickBuddyId('common') },
                { rarity: 'rare', weight: 30, type: 'buddy', buddyId: pickBuddyId('rare') },
                { rarity: 'epic', weight: 12, type: 'buddy', buddyId: pickBuddyId('epic') },
                { rarity: 'legendary', weight: 3, type: 'buddy', buddyId: pickBuddyId('legendary') }
            ]
            : [
                { rarity: 'common', type: 'xp', amount: 100, weight: 60 },
                { rarity: 'common', type: 'coins', amount: 60, weight: 60 },
                { rarity: 'rare', type: 'xp', amount: 300, weight: 25 },
                { rarity: 'rare', type: 'coins', amount: 150, weight: 25 },
                { rarity: 'epic', type: 'xp', amount: 600, weight: 12 },
                { rarity: 'legendary', type: 'jackpot', amount: 1000, coins: 250, weight: 3 }
            ];
        return buildReel(result, pool, 28);
    });
    const timers = useRef([]);

    // Tik sesleri: hiz -> yavas easing ile senkron (once sik, sonra seyrek)
    useEffect(() => {
        const SPIN_MS = 3200;
        for (let i = 0; i < 30; i++) {
            const at = Math.round(Math.pow((i + 1) / 30, 2.0) * SPIN_MS);
            timers.current.push(setTimeout(() => playSound('tick'), at));
        }
        timers.current.push(setTimeout(() => { if (onDone) onDone(); }, SPIN_MS + 650));
        return () => { timers.current.forEach(clearTimeout); timers.current = []; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isEgg = mode === 'egg';
    const winnerIdx = reel.winnerIndex;
    // Hedef: kazanan kartin MERKEZI pencere ortasina gelsin + hafif asiri donup geri teper
    const windowW = VISIBLE * CARD_W;
    const winnerCenter = (winnerIdx + 0.5) * CARD_W;
    const overshootPx = CARD_W * 0.55;
    const settleX = -(winnerCenter - windowW / 2);

    return (
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '12px', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Ortadaki isaretci */}
            <div style={{
                position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px',
                background: '#fff', zIndex: 3, transform: 'translateX(-50%)',
                boxShadow: '0 0 8px rgba(255,255,255,0.9)'
            }} />
            {/* Kenar vinyet */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,12,16,0.95) 0%, transparent 18%, transparent 82%, rgba(10,12,16,0.95) 100%)', zIndex: 2, pointerEvents: 'none' }} />

            <motion.div
                initial={{ x: 0 }}
                animate={{ x: [0, settleX - overshootPx, settleX] }}
                transition={{
                    duration: 3.85,
                    times: [0, 0.88, 1],
                    ease: ['circOut', 'backOut']
                }}
                style={{ display: 'flex', gap: `${GAP}px`, padding: '10px 0' }}
            >
                {reel.items.map((item, i) => {
                    const rarity = RARITY[item.rarity] || RARITY.common;
                    const isWinner = i === winnerIdx;
                    return (
                        <div key={i} style={{
                            width: `${CARD_W - GAP}px`, height: '100px', flexShrink: 0,
                            borderRadius: '10px', position: 'relative',
                            background: `radial-gradient(circle at 50% 30%, ${rarity.glow}55 0%, rgba(0,0,0,0.5) 80%)`,
                            border: `2px solid ${isWinner ? rarity.color : rarity.color + '66'}`,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                            boxShadow: isWinner ? `0 0 18px ${rarity.glow}` : 'none'
                        }}>
                            <span style={{ fontSize: '1.7rem' }}>{iconFor(item, isEgg)}</span>
                            <span style={{ fontSize: '0.55rem', color: rarity.color, fontWeight: 700, textAlign: 'center', padding: '0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                {nameFor(item, isEgg, lang)}
                            </span>
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
}

export default CsReel;
