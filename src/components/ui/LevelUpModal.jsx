import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';
import { getRank } from '../../utils/ranks';

function LevelUpModal({ level, onClose }) {
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

    return createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
            <div className="glass-card slide-in" style={{ width: '100%', maxWidth: '350px', border: `2px solid ${rank.color}`, background: 'rgba(15, 17, 21, 0.95)', textAlign: 'center', position: 'relative' }}>
                
                <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

                <div style={{ fontSize: '4rem', marginBottom: '1rem', textShadow: `0 0 20px ${rank.color}` }}>
                    {rank.icon}
                </div>
                
                <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                    SEVİYE {level}!
                </h2>
                
                <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                    Tebrikler! Yeni rütben: <br/>
                    <strong style={{ color: rank.color, fontSize: '1.2rem' }}>{rank.title}</strong>
                </p>
                
                <button onClick={onClose} className="neon-btn" style={{ width: '100%', borderColor: rank.color, color: rank.color, background: `${rank.color}15` }}>
                    MUHTEŞEM!
                </button>
            </div>
        </div>,
        document.body
    );
}

export default LevelUpModal;
