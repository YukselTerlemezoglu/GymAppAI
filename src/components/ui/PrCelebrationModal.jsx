import React, { useEffect, useRef } from 'react';
import { Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../../i18n/LanguageContext';

function PrCelebrationModal({ prs, onClose }) {
    const { t, lang } = useLanguage();
    const firedRef = useRef(false);

    useEffect(() => {
        if (prs && prs.length > 0 && !firedRef.current) {
            firedRef.current = true;
            const colors = ['#00ff88', '#00c3ff', '#ffd700', '#ff0088'];
            confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors });
            setTimeout(() => confetti({ particleCount: 90, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors }), 250);
            setTimeout(() => confetti({ particleCount: 90, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors }), 450);
        }
    }, [prs]);

    if (!prs || prs.length === 0) return null;

    const typeLabel = (p) => {
        if (p.type === 'first') return lang === 'tr' ? 'İlk Kayıt' : 'First Log';
        if (p.type === 'weight') return lang === 'tr' ? 'Ağırlık Rekoru' : 'Weight PR';
        return lang === 'tr' ? 'Güç Rekoru (e1RM)' : 'Strength PR (e1RM)';
    };

    const typeColor = (p) => {
        if (p.type === 'first') return '#00c3ff';
        if (p.type === 'weight') return '#ffd700';
        return '#ffd700';
    };

    return (
        <div className="modal-overlay fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}>
            <div onClick={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

            <div className="glass-card slide-in" style={{ position: 'relative', width: '100%', maxWidth: '420px', background: '#12122a', padding: 0, overflow: 'hidden', border: '2px solid #ffd700', boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)' }}>

                <div style={{ padding: '2rem 1.5rem 1rem 1.5rem', textAlign: 'center', background: 'radial-gradient(circle at 50% 0%, rgba(255,215,0,0.15) 0%, transparent 70%)' }}>
                    <Trophy size={56} color="#ffd700" style={{ filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.6))' }} />
                    <h2 style={{ margin: '12px 0 4px 0', color: '#ffd700', fontSize: '1.5rem', textShadow: '0 0 20px rgba(255,215,0,0.4)' }}>
                        {prs.length > 1 ? t('pr_multi_title') : t('pr_title')}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.85rem' }}>{t('pr_subtitle')}</p>
                </div>

                <div style={{ padding: '0.5rem 1.5rem 1rem 1.5rem', maxHeight: '40vh', overflowY: 'auto' }}>
                    {prs.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', borderLeft: `3px solid ${typeColor(p)}` }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', overflowWrap: 'break-word' }}>{p.exercise}</div>
                                <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginTop: '2px' }}>
                                    {typeLabel(p)}
                                    {p.prevBest && (
                                        <span> · {t('pr_previous')}: {p.prevBest.weight}kg × {p.prevBest.reps}</span>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                                <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '1.05rem' }}>{p.weight}kg × {p.reps}</div>
                                {p.type !== 'first' && (
                                    <div style={{ color: 'var(--text-light)', fontSize: '0.7rem' }}>e1RM: {p.e1rm.toFixed(1)}kg</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} className="neon-btn" style={{ flex: 1, background: 'linear-gradient(90deg, #ffd700, #ffaa00)', color: '#000', fontWeight: 'bold' }}>
                        {t('pr_cta')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PrCelebrationModal;
