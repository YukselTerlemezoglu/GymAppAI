import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { Award, Check } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

function BadgeUnlockModal({ badge, onClose }) {
    const { t, lang } = useTranslation();
    
    useEffect(() => {
        // Fire confetti
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#00ff88', '#ff00ff', '#ffd700']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#00ff88', '#ff00ff', '#ffd700']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }, []);

    if (!badge) return null;

    const badgeTitle = lang === 'tr' ? badge.title : badge.title_en;
    const badgeDesc = lang === 'tr' ? badge.description : badge.description_en;

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-card modal-card-sm" style={{ border: '2px solid #ffd700', position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>
                    {badge.icon}
                </div>
                <h3 style={{ color: '#ffd700', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Award size={24} /> {t('badge_unlocked_title')}
                </h3>
                <h2 style={{ color: '#fff', fontSize: '1.5rem', margin: '0.5rem 0' }}>{badgeTitle}</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                    {badgeDesc}
                </p>
                <button onClick={onClose} className="neon-btn" style={{ width: '100%', background: 'rgba(255, 215, 0, 0.1)', borderColor: '#ffd700', color: '#ffd700', boxShadow: 'none' }}>
                    <Check size={18} style={{ marginRight: '8px' }} /> {t('btn_continue')}
                </button>
            </div>
        </div>,
        document.body
    );
}

export default BadgeUnlockModal;
