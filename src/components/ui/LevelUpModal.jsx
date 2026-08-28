import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';
import { getRank, getRankIndex } from '../../utils/ranks';
import { useTranslation } from '../../i18n/LanguageContext';

function LevelUpModal({ level, prevLevel = 1, onClose }) {
    const { t, lang } = useTranslation();

    useEffect(() => {
        // Trigger confetti
        var duration = 3 * 1000;
        var end = Date.now() + duration;

        var frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#00ff88', '#00d4ff', '#ff00ff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#00ff88', '#00d4ff', '#ff00ff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }, []);

    const rank = getRank(level);
    const rankTitle = lang === 'tr' ? rank.title_tr : rank.title_en;

    // Rutbe atladi mi? (yeni seviyenin rutbe indeksi, onceki seviyeninkinden buyukse)
    const rankUp = getRankIndex(level) > getRankIndex(prevLevel);

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-card modal-card-sm" style={{ border: `2px solid ${rank.color}`, textAlign: 'center', position: 'relative', padding: '1.5rem' }}>

                <button onClick={onClose} className="icon-btn" style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)' }}>
                    <X size={24} />
                </button>

                <div style={{ fontSize: '4rem', marginBottom: '1rem', textShadow: `0 0 20px ${rank.color}` }}>
                    {rank.icon}
                </div>

                <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                    {t('level_up_title', { level })}
                </h2>

                <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                    {t('level_up_congrats')} {t('level_up_rank_label')} <br />
                    <strong style={{ color: rank.color, fontSize: '1.2rem' }}>{rankTitle}</strong>
                </p>

                {rankUp && (
                    <p style={{
                        color: '#ffd700', fontSize: '0.95rem', fontWeight: 'bold',
                        marginBottom: '1.5rem', padding: '0.6rem 1rem',
                        background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.4)',
                        borderRadius: '10px', animation: 'pulse 2s infinite'
                    }}>
                        ⭐ {t('rank_up_banner')} ⭐
                    </p>
                )}

                <button onClick={onClose} className="neon-btn" style={{ width: '100%', borderColor: rank.color, color: rank.color, background: `${rank.color}15` }}>
                    {t('level_up_btn')}
                </button>
            </div>
        </div>,
        document.body
    );
}

export default LevelUpModal;
