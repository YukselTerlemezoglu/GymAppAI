import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../ui/ToastProvider';
import { flip, DON_MAX_MULT } from '../../utils/don';
import { playSound } from '../../utils/sounds';

// DOUBLE OR NOTHING MODALI
// Gorev odulu coin'i escrow "pot" olarak burada tutulur.
// Fazlar: offer -> flipping -> won -> lost -> banked
// Zincir tavani: 8x. Tavana ulasinca otomatik bankalanir.

const FLIP_MS = 1300;

function DonModal({ baseCoins, dayKey, onFinish, onClose }) {
    const { t } = useTranslation();
    const { haptic } = useToast();

    const [stage, setStage] = useState('offer'); // offer | flipping | won | lost | banked
    const [pot, setPot] = useState(baseCoins);
    const [mult, setMult] = useState(1);
    const [flips, setFlips] = useState(0);
    const [wins, setWins] = useState(0);
    const timeoutRef = useRef(null);

    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

    // Zincir sonu: istatistige isle + coin'i isle (ya da yanip gitti)
    const finish = (banked, lost) => {
        onFinish({ banked, lost, chainLen: flips, flips, wins, dayKey });
    };

    const doFlip = () => {
        if (stage !== 'offer' && stage !== 'won') return;
        const outcome = flip();
        setStage('flipping');
        playSound('click');
        haptic([15, 30, 15]);

        timeoutRef.current = setTimeout(() => {
            if (outcome === 'heads') {
                setPot(pot * 2);
                setMult(mult * 2);
                setFlips(flips + 1);
                setWins(wins + 1);
                playSound('coin');
                haptic([20, 40, 20]);
                setStage('won');
            } else {
                setFlips(flips + 1);
                setStage('lost');
                playSound('deny');
                haptic([40, 60, 40]);
            }
        }, FLIP_MS);
    };

    const takeSafe = () => { setStage('banked'); finish(pot, 0); playSound('buy'); haptic([15, 20, 15]); };
    const safeFromOffer = () => { setStage('banked'); finish(baseCoins, 0); playSound('buy'); };
    const closeAfterLoss = () => finish(0, pot);

    // 8x tavanina ulasildi mi? (won asamasinda otomatik bankala)
    const atCap = mult >= DON_MAX_MULT;
    useEffect(() => {
        if (stage === 'won' && atCap) {
            // Kisa bir gecikmeyle otomatik cekilis — kullanici serbest birakmis olamaz
            const id = setTimeout(() => { setStage('banked'); finish(pot, 0); playSound('pr'); }, 1400);
            return () => clearTimeout(id);
        }
        return undefined;
    }, [stage, atCap]); // eslint-disable-line react-hooks/exhaustive-deps

    // Konfeti: buyuk bankalama veya tavan
    const fireConfetti = () => {
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: ['#ffd700', '#00ff88', '#00d4ff'] });
    };

    return createPortal(
        <div className="modal-overlay">
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="modal-card modal-card-sm"
                style={{ border: '2px solid #ffd700', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
            >
                {/* Baslik */}
                <div style={{ padding: '1.4rem 1rem 0.4rem' }}>
                    <h3 style={{ margin: 0, color: '#ffd700', fontSize: '1.15rem', letterSpacing: '0.5px' }}>
                        🎲 {t('don_title')}
                    </h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: '0.72rem' }}>{t('don_subtitle')}</p>
                </div>

                {/* Madeni para / pot alani */}
                <div style={{ padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>

                    {stage === 'offer' && (
                        <>
                            <div style={{ fontSize: '3.2rem', lineHeight: 1 }}>🪙</div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>{baseCoins} 🪙</div>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.78rem', margin: 0 }}>{t('don_offer_hint')}</p>
                        </>
                    )}

                    {stage === 'flipping' && (
                        <motion.div
                            key={`flip-${flips}`}
                            animate={{ rotateY: 1800, scale: [1, 1.15, 1] }}
                            transition={{ duration: FLIP_MS / 1000, ease: 'easeOut' }}
                            style={{ fontSize: '3.2rem', lineHeight: 1, perspective: 600 }}
                        >
                            🪙
                        </motion.div>
                    )}

                    {(stage === 'won' || stage === 'banked') && (
                        <>
                            <motion.div initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} style={{ fontSize: '3.2rem', lineHeight: 1 }}>🪙</motion.div>
                            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#00ff88' }}>{pot} 🪙</div>
                            <div style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 700 }}>{mult}x {t('don_mult')}</div>
                        </>
                    )}

                    {stage === 'lost' && (
                        <>
                            <motion.div initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ fontSize: '3.2rem', lineHeight: 1 }}>💀</motion.div>
                            <div style={{ fontSize: '1.1rem', color: '#ff6b81', fontWeight: 700 }}>{t('don_tails')}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{t('don_lost_msg')}</div>
                        </>
                    )}
                </div>

                {/* Butonlar */}
                <div style={{ padding: '0.6rem 1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {stage === 'offer' && (
                        <>
                            <button onClick={doFlip} className="neon-btn" style={{ background: 'rgba(255,215,0,0.12)', borderColor: '#ffd700', color: '#ffd700', fontWeight: 800 }}>
                                🎲 {t('don_risk')} ({t('don_next', { coins: baseCoins * 2 })})
                            </button>
                            <button onClick={safeFromOffer} className="neon-btn-secondary" style={{ fontSize: '0.85rem' }}>
                                {t('don_safe', { coins: baseCoins })}
                            </button>
                        </>
                    )}

                    {stage === 'flipping' && (
                        <div style={{ padding: '0.8rem', color: 'var(--text-light)', fontSize: '0.85rem' }}>{t('don_flipping')}</div>
                    )}

                    {stage === 'won' && !atCap && (
                        <>
                            <button onClick={doFlip} className="neon-btn" style={{ background: 'rgba(255,215,0,0.12)', borderColor: '#ffd700', color: '#ffd700', fontWeight: 800 }}>
                                🎲 {t('don_continue')} ({t('don_next', { coins: pot * 2 })})
                            </button>
                            <button onClick={() => { takeSafe(); fireConfetti(); }} className="neon-btn" style={{ background: 'rgba(0,255,136,0.1)', borderColor: '#00ff88', color: '#00ff88', fontSize: '0.85rem', fontWeight: 800 }}>
                                💰 {t('don_take', { coins: pot })}
                            </button>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.65rem' }}>{t('don_cap_hint', { max: DON_MAX_MULT })}</p>
                        </>
                    )}

                    {stage === 'won' && atCap && (
                        <div style={{ padding: '0.8rem', color: '#ffd700', fontWeight: 800 }}>{t('don_cap_auto', { coins: pot })}</div>
                    )}

                    {stage === 'lost' && (
                        <button onClick={closeAfterLoss} className="neon-btn-secondary">
                            {t('don_ok')}
                        </button>
                    )}

                    {stage === 'banked' && (
                        <button onClick={onClose} className="neon-btn" style={{ background: 'rgba(0,255,136,0.1)', borderColor: '#00ff88', color: '#00ff88' }}>
                            {t('don_nice')}
                        </button>
                    )}
                </div>

                {/* Alt bilgi: gunluk hak */}
                <div style={{ padding: '0 1rem 0.8rem', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {t('don_daily_limit')}
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

export default DonModal;
