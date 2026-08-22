import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BuddyCapsule from './BuddyCapsule';
import { findBuddy, getBuddyStageInfo } from '../../utils/buddy';
import { useLanguage } from '../../i18n/LanguageContext';
import { playSound } from '../../utils/sounds';

/*
 * EVRIM KUTLAMASI (tam ekran)
 *
 * Yem besleme veya antrenman XP'si ile dost evrimlestiginde gosterilir:
 * once form buyup titrer, parlak bir patlamayla yeni forma donusur ve
 * konfeti sacar. 4sn sonra otomatik kapanir; tiklayinca hemen kapanir.
 */
export default function EvolutionModal({ buddyId, newXp, onClose }) {
    const { t, lang } = useLanguage();
    const [phase, setPhase] = useState('grow'); // grow -> burst

    useEffect(() => {
        playSound('evolve');
        const t1 = setTimeout(() => setPhase('burst'), 900);
        const t2 = setTimeout(() => onClose(), 4200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [onClose]);

    const buddy = findBuddy(buddyId);
    if (!buddy) return null;
    const info = getBuddyStageInfo(newXp);
    const stage = info.stage;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'radial-gradient(circle at 50% 40%, rgba(0,195,255,0.18), rgba(0,0,0,0.88) 70%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: '24px'
            }}
        >
            {/* Konfeti patlamasi (burst asamasinda) */}
            {phase === 'burst' && (
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    {Array.from({ length: 26 }).map((_, i) => (
                        <motion.span
                            key={i}
                            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                            animate={{
                                x: Math.cos((i / 26) * Math.PI * 2) * (140 + (i % 5) * 34),
                                y: Math.sin((i / 26) * Math.PI * 2) * (140 + (i % 5) * 34) + 60,
                                opacity: 0, scale: 0.4, rotate: (i % 2 ? 1 : -1) * 220
                            }}
                            transition={{ duration: 1.6, ease: 'easeOut' }}
                            style={{
                                position: 'absolute', left: '50%', top: '38%',
                                width: i % 3 === 0 ? 10 : 7, height: i % 3 === 0 ? 10 : 7,
                                borderRadius: '50%',
                                background: ['#00ff88', '#00d4ff', '#ffd700', '#ff6b81', '#c56cf0'][i % 5]
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Baslik */}
            <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                style={{ textAlign: 'center', marginBottom: '20px', zIndex: 2 }}
            >
                <div style={{ fontSize: '2.6rem', filter: 'drop-shadow(0 0 18px rgba(0,195,255,0.9))' }}>✨🧬✨</div>
                <h2 style={{ margin: '10px 0 4px', color: '#fff', fontSize: '1.7rem', textShadow: '0 0 24px rgba(0,195,255,0.65)' }}>
                    {t('shop_buddy_evolved_title')}
                </h2>
                <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.95rem' }}>
                    {t('shop_buddy_evolved_desc', { name: lang === 'tr' ? buddy.title_tr : buddy.title_en })}
                </p>
            </motion.div>

            {/* Yeni form kapsulu (buyume patlamasi animasyonuyla) */}
            <motion.div
                animate={
                    phase === 'grow'
                        ? { scale: [1, 1.18, 0.92, 1.12, 1] }
                        : { scale: [1.12, 0.6, 1.5, 1] }
                }
                transition={{ duration: phase === 'grow' ? 0.9 : 0.55 }}
                style={{ position: 'relative', zIndex: 2 }}
            >
                <BuddyCapsule buddyId={buddyId} xp={newXp} size={190} />
            </motion.div>

            {/* Yeni evre etiketi */}
            <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.25, duration: 0.35 }}
                style={{ marginTop: '18px', zIndex: 2 }}
            >
                <div style={{
                    padding: '8px 22px', borderRadius: '999px',
                    background: 'rgba(0,195,255,0.12)', border: '1px solid var(--accent-primary)',
                    color: '#fff', fontWeight: 'bold', fontSize: '1.05rem',
                    boxShadow: '0 0 24px rgba(0,195,255,0.35)'
                }}>
                    {lang === 'tr' ? stage.title_tr : stage.title_en}
                </div>
                <div style={{ textAlign: 'center', marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {t('shop_buddy_evolved_tap')}
                </div>
            </motion.div>
        </motion.div>
    );
}
