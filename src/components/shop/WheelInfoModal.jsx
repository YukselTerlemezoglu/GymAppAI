import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Percent, Info } from 'lucide-react';
import { RARITY } from '../../data/shopItems';
import { WHEEL_SEGMENTS } from '../../utils/gacha';

/*
 * CARKI INCELE modalı: her dilimin rengi, odulu ve GERCEK cikma sansi.
 * Dilimler carktaki sirayla ve orantili genislikte gosterilir.
 */
function WheelInfoModal({ lang, t, onClose }) {
    const isEn = lang === 'en';
    const total = WHEEL_SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
    const maxPct = Math.max(...WHEEL_SEGMENTS.map((s) => s.weight / total));

    const kindLabel = (seg) => {
        switch (seg.kind) {
            case 'xp': return isEn ? 'Experience' : 'Deneyim';
            case 'coins': return isEn ? 'Coins' : 'Jeton';
            case 'buddyXp': return isEn ? 'Buddy XP' : 'Dost XP';
            case 'jackpot': return isEn ? 'Jackpot (XP + coins)' : 'Jackpot (XP + jeton)';
            default: return seg.kind;
        }
    };

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
                        🎡 {t('shop_wheel_info_title')}
                    </h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex' }}>
                        <X size={22} />
                    </button>
                </div>

                <p style={{ color: 'var(--text-light)', fontSize: '0.78rem', margin: '0 0 1rem', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    {t('shop_wheel_info_desc')}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {WHEEL_SEGMENTS.map((seg, i) => {
                        const rarity = RARITY[seg.rarity];
                        const pct = (seg.weight / total) * 100;
                        const barW = Math.max(6, (pct / (maxPct * 100)) * 100);
                        return (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '8px 10px', borderLeft: `3px solid ${rarity.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>
                                        {isEn ? seg.label_en : seg.label_tr}
                                    </span>
                                    <span style={{ color: rarity.color, fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                                        <Percent size={11} /> {pct.toFixed(1).replace(/\.0$/, '')}%
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                    <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                        <div style={{ width: `${barW}%`, height: '100%', background: `linear-gradient(90deg, ${rarity.color}, ${rarity.color}88)`, borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', flexShrink: 0 }}>{kindLabel(seg)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {t('shop_wheel_info_note')}
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

export default WheelInfoModal;
