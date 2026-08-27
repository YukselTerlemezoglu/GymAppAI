import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { X, HeartPulse } from 'lucide-react';
import { MuscleMap } from '../dashboard/MuscleMap';

// Gunluk Check-In Sihirbazi (Faz 1d) — TAMAMEN OPSIYONEL.
// Kullanicinin sabitleri: nasil hissediyorsun + agrili bolge + siddet (1-5).
// Sonuc coachEngine'e painData olarak beslenir.
// Acilmayan kullanici hicbir sey gormez; veri yoksa koc antrenman verisiyle calisir.

const MOODS = [
    { id: 'exhausted', emoji: '😫', value: 1 },
    { id: 'tired', emoji: '😕', value: 2 },
    { id: 'ok', emoji: '😐', value: 3 },
    { id: 'good', emoji: '🙂', value: 4 },
    { id: 'great', emoji: '😄', value: 5 }
];

function CheckInModal({ open, onClose, onSave, initial }) {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [mood, setMood] = useState(initial?.mood || null);
    const [painRegions, setPainRegions] = useState(() => new Set(Object.keys(initial?.pain || {})));
    const [painLevels, setPainLevels] = useState(() => ({ ...(initial?.pain || {}) }));
    const [currentRegion, setCurrentRegion] = useState(null);

    const selectedRegionInfo = useMemo(() => {
        if (!currentRegion) return null;
        return { id: currentRegion, level: painLevels[currentRegion] || 0 };
    }, [currentRegion, painLevels]);

    if (!open) return null;

    const toggleRegion = (regionId) => {
        setCurrentRegion(regionId);
        setPainRegions(prev => {
            const next = new Set(prev);
            if (next.has(regionId)) {
                next.delete(regionId);
                setPainLevels(l => {
                    const nl = { ...l };
                    delete nl[regionId];
                    return nl;
                });
            } else {
                next.add(regionId);
            }
            return next;
        });
    };

    const setLevel = (lvl) => {
        if (!currentRegion) return;
        setPainLevels(prev => ({ ...prev, [currentRegion]: lvl }));
    };

    const handleSave = () => {
        const painArr = Object.entries(painLevels).filter(([, v]) => v > 0);
        onSave({
            date: new Date().toISOString(),
            mood,
            pain: Object.fromEntries(painArr)
        });
        setStep(1);
        onClose();
    };

    const painMap = Object.fromEntries(
        Object.entries(painLevels).filter(([, v]) => v > 0)
    );

    return createPortal(
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem'
        }} onClick={onClose}>
            <div
                className="glass-card"
                style={{ maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="close"
                >
                    <X size={16} />
                </button>

                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginTop: 0, marginBottom: '0.3rem' }}>
                    <HeartPulse size={20} color="#ff6b81" /> {t('checkin_title')}
                </h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginTop: 0 }}>
                    {t('checkin_subtitle')} · {step}/2
                </p>

                {step === 1 && (
                    <div>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.8rem' }}>{t('checkin_mood_q')}</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.7rem', margin: '1.5rem 0' }}>
                            {MOODS.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMood(m.value)}
                                    style={{
                                        fontSize: '2rem',
                                        background: mood === m.value ? 'rgba(0,195,255,0.25)' : 'rgba(255,255,255,0.05)',
                                        border: mood === m.value ? '2px solid #00c3ff' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '14px',
                                        padding: '0.6rem 0.8rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        transform: mood === m.value ? 'scale(1.12)' : 'scale(1)'
                                    }}
                                    aria-label={m.id}
                                >
                                    {m.emoji}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            disabled={!mood}
                            className="neon-btn"
                            style={{ width: '100%', padding: '0.8rem', opacity: mood ? 1 : 0.4, cursor: mood ? 'pointer' : 'not-allowed' }}
                        >
                            {t('checkin_next')}
                        </button>
                        <button onClick={onClose} style={{ width: '100%', marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.85rem' }}>
                            {t('checkin_skip_all')}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
                            {t('checkin_pain_q')} <span style={{ color: 'var(--text-light)', fontWeight: 400, fontSize: '0.8rem' }}>({t('checkin_optional')})</span>
                        </p>
                        <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.5rem', background: 'rgba(0,0,0,0.25)' }}>
                            <MuscleMap mode="pain" painMap={painMap} selectedRegions={painRegions} onSelectRegion={toggleRegion} compact />
                        </div>

                        {currentRegion && painRegions.has(currentRegion) && (
                            <div style={{ marginTop: '0.8rem' }}>
                                <p style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                    {t('checkin_pain_level_q')} <span style={{ color: '#ff6b81' }}>1-5</span>
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[1, 2, 3, 4, 5].map(lvl => (
                                        <button
                                            key={lvl}
                                            onClick={() => setLevel(lvl)}
                                            style={{
                                                flex: 1, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                                                background: (painLevels[currentRegion] || 0) === lvl
                                                    ? `rgba(${60 + lvl * 40}, ${220 - lvl * 36}, ${100 - lvl * 12}, 0.4)`
                                                    : 'rgba(255,255,255,0.06)',
                                                border: (painLevels[currentRegion] || 0) === lvl ? '2px solid #ff6b81' : '1px solid rgba(255,255,255,0.12)',
                                                color: '#fff'
                                            }}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                                {selectedRegionInfo && (
                                    <p style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                                        {t('checkin_level_hint_' + ((painLevels[currentRegion]) || 1))}
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            className="neon-btn"
                            style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}
                        >
                            {t('checkin_save')}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

export default CheckInModal;
