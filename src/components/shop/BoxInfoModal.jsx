import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Percent, Info, HeartHandshake } from 'lucide-react';
import { RARITY } from '../../data/shopItems';
import { CHEST_TABLE, CHEST_PITY_EPIC, EGG_RARITY_WEIGHTS, EGG_PITY_EPIC, EGG_PITY_LEGENDARY } from '../../utils/gacha';

/*
 * KUTUYU INCELE modalı (kutu + yumurta):
 *  - mode 'chest': CHEST_TABLE satirlari — sans, tur, aralik degerleri
 *  - mode 'egg'  : EGG_RARITY_WEIGHTS — nadirlik sanslari + pity bilgisi
 */
function BoxInfoModal({ mode, lang, t, gachaPity, onClose }) {
    const isEn = lang === 'en';

    const kindLabel = (kind) => {
        switch (kind) {
            case 'xp': return isEn ? 'XP' : 'XP';
            case 'coins': return isEn ? 'Coins' : 'Jeton';
            case 'buddyXp': return isEn ? 'Buddy XP' : 'Dost XP';
            case 'snack': return isEn ? 'Snacks' : 'Atıştırmalık';
            case 'cosmetic': return isEn ? 'Cosmetic' : 'Kozmetik';
            case 'jackpot': return isEn ? 'Jackpot' : 'Jackpot';
            default: return kind;
        }
    };

    const rangeLabel = (e) => {
        switch (e.kind) {
            case 'xp': return `+${e.min}–${e.max} XP`;
            case 'coins': return `+${e.min}–${e.max} 🪙`;
            case 'buddyXp': return `+${e.min}–${e.max} 🍖`;
            case 'snack': return `+${e.min}–${e.max}× 🍖`;
            case 'jackpot': return `+${e.min}–${e.max} XP +${e.coinsMin}–${e.coinsMax} 🪙`;
            case 'cosmetic': return e.highValueOnly ? (isEn ? 'Any cosmetic' : 'Herhangi bir kozmetik') : (isEn ? 'Cosmetic (≤500🪙)' : 'Kozmetik (≤500🪙)');
            default: return '';
        }
    };

    const isEgg = mode === 'egg';
    const total = isEgg
        ? Object.values(EGG_RARITY_WEIGHTS).reduce((s, w) => s + w, 0)
        : CHEST_TABLE.reduce((s, e) => s + e.weight, 0);

    const rows = isEgg
        ? Object.entries(EGG_RARITY_WEIGHTS).map(([rarity, weight]) => ({ rarity, weight, label: t(`rarity_${rarity}`) }))
        : CHEST_TABLE.map((e) => ({ ...e, label: `${kindLabel(e.kind)} · ${rangeLabel(e)}` }));

    const title = isEgg ? t('shop_egg_info_title') : t('shop_chest_info_title');

    return createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 12000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0 }} />
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 18, stiffness: 240 }}
                className="glass-card"
                style={{ position: 'relative', width: '100%', maxWidth: '380px', maxHeight: '85vh', overflowY: 'auto', padding: '1.4rem', background: 'rgba(15,17,21,0.98)' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isEgg ? '🥚' : '🎁'} {title}
                    </h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex' }}>
                        <X size={22} />
                    </button>
                </div>

                <p style={{ color: 'var(--text-light)', fontSize: '0.78rem', margin: '0 0 1rem', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    {isEgg ? t('shop_egg_info_desc') : t('shop_chest_info_desc')}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {rows.map((row, i) => {
                        const rarity = RARITY[row.rarity] || RARITY.common;
                        const pct = (row.weight / total) * 100;
                        return (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '8px 10px', borderLeft: `3px solid ${rarity.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>{row.label}</span>
                                    <span style={{ color: rarity.color, fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                                        <Percent size={11} /> {pct.toFixed(1).replace(/\.0$/, '')}%
                                    </span>
                                </div>
                                <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: '5px' }}>
                                    <div style={{ width: `${Math.max(6, pct * 2)}%`, height: '100%', background: `linear-gradient(90deg, ${rarity.color}, ${rarity.color}88)`, borderRadius: '3px' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pity bilgisi */}
                <div style={{ marginTop: '1rem', background: 'rgba(0,195,255,0.06)', borderRadius: '10px', padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'flex-start', border: '1px solid rgba(0,195,255,0.15)' }}>
                    <HeartHandshake size={15} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                        {isEgg
                            ? t('shop_pity_egg', { epic: EGG_PITY_EPIC - (gachaPity?.egg || 0), leg: EGG_PITY_LEGENDARY - (gachaPity?.eggLegendary || 0) })
                            : t('shop_pity_chest', { left: CHEST_PITY_EPIC - (gachaPity?.chest || 0) })}
                    </span>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

export default BoxInfoModal;
