import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { RARITY, findCosmetic } from '../../data/shopItems';
import { findBuddy, DUPE_XP } from '../../utils/buddy';
import { haptic } from '../ui/ToastProvider';

/*
 * Gacha acilis modali: kutu / yumurta / cark sonucunu gosterir.
 * Faz 1: kap titrer (gerilim, ~1.1sn)
 * Faz 2: patlama + nadirlik rengine gore konfeti + sonuc karti
 *
 * result turleri:
 *  - { source: 'chest'|'egg'|'wheel', ...openChest/openEgg/spinWheel ciktisi }
 *  - egg icin dupe bilgisi cagiran taraf ekler: { dupe: bool }
 */

const shakeColors = (rarity) => {
    switch (rarity) {
        case 'legendary': return ['#ffd700', '#ffaa00', '#fff3b0'];
        case 'epic': return ['#c06bff', '#8a2be2', '#e8d5ff'];
        case 'rare': return ['#00c3ff', '#0088ff', '#d0f4ff'];
        default: return ['#a1a1aa', '#d4d4d8', '#f4f4f5'];
    }
};

function ResultCard({ result, lang, t }) {
    const rarity = RARITY[result.rarity] || RARITY.common;

    // Yumurta: dost karti
    if (result.source === 'egg') {
        const buddy = findBuddy(result.buddyId);
        if (!buddy) return null;
        return (
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4.5rem', lineHeight: 1, filter: `drop-shadow(0 0 18px ${rarity.glow})` }}>{buddy.icon}</div>
                <div style={{ color: rarity.color, fontWeight: 'bold', fontSize: '1.4rem', marginTop: '8px' }}>
                    {lang === 'tr' ? buddy.title_tr : buddy.title_en}
                </div>
                <div style={{ fontSize: '0.8rem', color: rarity.color, border: `1px solid ${rarity.color}`, borderRadius: '10px', padding: '2px 10px', display: 'inline-block', marginTop: '6px' }}>
                    {t(`rarity_${rarity.key}`)}
                </div>
                {result.dupe ? (
                    <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '10px' }}>
                        {t('shop_dupe_converted', { xp: DUPE_XP[result.rarity] })}
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '10px' }}>{t('shop_new_buddy')}</div>
                )}
            </div>
        );
    }

    // Kutu / cark odulleri
    const iconFor = (r) => {
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

    const labelFor = (r) => {
        switch (r.type) {
            case 'xp': return `+${r.amount} XP`;
            case 'coins': return `+${r.amount} 🪙` + (r.converted ? ` (${t('shop_converted')})` : '');
            case 'buddyXp': return `+${r.amount} ${t('shop_buddy_xp')}`;
            case 'snack': return `+${r.amount} × ${t('boost_snack_title')}`;
            case 'jackpot': return `JACKPOT! +${r.amount} XP +${r.coins} 🪙`;
            case 'cosmetic': {
                const c = findCosmetic(r.cosmeticId);
                return c ? (lang === 'tr' ? c.title_tr : c.title_en) : '';
            }
            default: return '';
        }
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', lineHeight: 1, filter: `drop-shadow(0 0 18px ${rarity.glow})` }}>{iconFor(result)}</div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.3rem', marginTop: '10px', overflowWrap: 'break-word' }}>{labelFor(result)}</div>
            <div style={{ fontSize: '0.75rem', color: rarity.color, border: `1px solid ${rarity.color}`, borderRadius: '10px', padding: '2px 10px', display: 'inline-block', marginTop: '8px' }}>
                {t(`rarity_${rarity.key}`)}
            </div>
        </div>
    );
}

function GachaRevealModal({ result, lang, t, onClose }) {
    // Faz yalnizca "mount anindaki" sonuctan turetilir; modal her acilista
    // yeni mount edilir (parent key ile ya da conditional render), bu yuzden
    // effect icinde faz set etmek gerekmez.
    const [phase, setPhase] = useState(result ? 'shake' : 'reveal');
    const timers = useRef([]);

    useEffect(() => {
        if (!result) return;
        haptic(20);
        timers.current.push(setTimeout(() => haptic(15), 400), setTimeout(() => haptic(15), 800));

        const revealDelay = result.rarity === 'legendary' ? 1400 : 1100;
        timers.current.push(setTimeout(() => {
            setPhase('reveal');
            const colors = shakeColors(result.rarity);

            if (result.rarity === 'common') {
                confetti({ particleCount: 40, spread: 60, origin: { y: 0.55 }, colors });
            } else if (result.rarity === 'rare') {
                confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 }, colors });
            } else if (result.rarity === 'epic') {
                confetti({ particleCount: 150, spread: 90, origin: { y: 0.55 }, colors });
                timers.current.push(setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 65, origin: { x: 0, y: 0.7 }, colors }), 200));
                timers.current.push(setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 65, origin: { x: 1, y: 0.7 }, colors }), 380));
                haptic([30, 50, 30]);
            } else {
                // Efsanevi: tam savas
                confetti({ particleCount: 220, spread: 110, origin: { y: 0.5 }, colors });
                for (let i = 0; i < 5; i++) {
                    timers.current.push(setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { x: Math.random(), y: 0.4 }, colors }), 250 * (i + 1)));
                }
                haptic([40, 60, 40, 60, 80]);
            }
        }, revealDelay));

        return () => { timers.current.forEach(clearTimeout); timers.current = []; };
    }, [result]);

    if (!result) return null;

    const rarity = RARITY[result.rarity] || RARITY.common;
    const sourceIcon = result.source === 'egg' ? '🥚' : result.source === 'chest' ? '🎁' : '🎡';

    return createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 11000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}>
            <div onClick={phase === 'reveal' ? onClose : undefined} style={{ position: 'absolute', inset: 0 }} />

            <AnimatePresence mode="wait">
                {phase === 'shake' ? (
                    <motion.div
                        key="shake"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            rotate: [0, -8, 8, -10, 10, -12, 12, -8, 8, 0],
                            y: [0, -6, 0, -8, 0, -6, 0]
                        }}
                        exit={{ scale: 1.6, opacity: 0, transition: { duration: 0.18 } }}
                        transition={{ duration: 1.1, ease: 'easeInOut' }}
                        style={{ fontSize: '6rem', filter: `drop-shadow(0 0 30px ${rarity.glow})`, userSelect: 'none' }}
                    >
                        {sourceIcon}
                    </motion.div>
                ) : (
                    <motion.div
                        key="reveal"
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                        className="glass-card"
                        style={{
                            position: 'relative', width: '100%', maxWidth: '340px', padding: '2rem 1.5rem 1.5rem',
                            background: 'rgba(15,17,21,0.96)', textAlign: 'center',
                            border: `2px solid ${rarity.color}`,
                            boxShadow: `0 0 40px ${rarity.glow}`
                        }}
                    >
                        <ResultCard result={result} lang={lang} t={t} />
                        <button onClick={onClose} className="neon-btn" style={{ marginTop: '1.5rem', width: '100%', borderColor: rarity.color, color: rarity.color }}>
                            {t('shop_reveal_ok')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>,
        document.body
    );
}

export default GachaRevealModal;
