import React, { useState } from 'react';
import { Calculator, X, Dumbbell } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

/**
 * Plate (Pul) Hesaplayıcı
 * Hedef toplam ağırlığı gir → bar + pul kombinasyonunu gösterir.
 * İki mod: hedeften pullara, pullardan hedefe.
 */
function PlateCalculator({ onClose }) {
    const { t, lang } = useLanguage();
    const [mode, setMode] = useState('targetToPlates'); // 'targetToPlates' | 'platesToTarget'
    const [barWeight, setBarWeight] = useState(20);
    const [targetWeight, setTargetWeight] = useState(60);
    const [selected, setSelected] = useState({});

    // Mod 1: Hedef -> Pular
    const perSide = ((targetWeight - barWeight) / 2);
    const platesForTarget = (() => {
        if (isNaN(perSide) || perSide < 0) return null;
        let remaining = perSide;
        const result = [];
        PLATES_KG.forEach(p => {
            const count = Math.floor(remaining / p + 1e-9);
            if (count > 0) { result.push({ plate: p, count }); remaining -= count * p; }
        });
        return { result, leftover: Math.round(remaining * 100) / 100 };
    })();

    // Mod 2: Pular -> Hedef
    const platesSum = Object.entries(selected).reduce((sum, [p, c]) => sum + p * c, 0);
    const totalFromPlates = barWeight + platesSum * 2;

    const Plate = ({ w, count }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
                width: w >= 20 ? '26px' : w >= 10 ? '22px' : '18px',
                height: w >= 25 ? '46px' : w >= 20 ? '42px' : w >= 10 ? '36px' : '28px',
                background: w >= 20 ? '#ef4444' : w >= 10 ? '#22c55e' : w >= 5 ? '#eab308' : '#94a3b8',
                borderRadius: '4px',
                border: '1px solid rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#000', fontSize: '9px', fontWeight: 'bold',
                flexShrink: 0
            }}>{w}</div>
            {count > 1 && <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>x{count}</span>}
        </div>
    );

    return (
        <div className="modal-overlay fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
            <div onClick={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

            <div className="glass-card slide-in" style={{ position: 'relative', width: '100%', maxWidth: '420px', background: '#1a1a2e', padding: 0, overflow: 'hidden', border: '1px solid var(--accent-primary)' }}>

                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.05rem' }}>
                        <Calculator size={20} color="var(--accent-primary)" /> {t('pc_title')}
                    </h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                        <X size={22} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
                    {/* Mod seçici */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem' }}>
                        <button
                            onClick={() => setMode('targetToPlates')}
                            className={mode === 'targetToPlates' ? 'neon-btn' : ''}
                            style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', borderRadius: '8px', background: mode === 'targetToPlates' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.07)', color: mode === 'targetToPlates' ? '#000' : 'var(--text-light)', border: '1px solid rgba(255,255,0.1)' }}
                        >
                            {t('pc_mode_target')}
                        </button>
                        <button
                            onClick={() => setMode('platesToTarget')}
                            className={mode === 'platesToTarget' ? 'neon-btn' : ''}
                            style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', borderRadius: '8px', background: mode === 'platesToTarget' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.07)', color: mode === 'platesToTarget' ? '#000' : 'var(--text-light)', border: '1px solid rgba(255,255,0.1)' }}
                        >
                            {t('pc_mode_plates')}
                        </button>
                    </div>

                    {/* Bar seçimi */}
                    <div style={{ marginBottom: '1.2rem' }}>
                        <label style={{ color: 'var(--text-light)', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>{t('pc_bar_weight')}</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[20, 15, 7, 0].map(bw => (
                                <button key={bw} onClick={() => setBarWeight(bw)}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: `1px solid ${barWeight === bw ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)'}`, background: barWeight === bw ? 'rgba(0,195,255,0.15)' : 'rgba(255,255,255,0.05)', color: barWeight === bw ? 'var(--accent-primary)' : 'var(--text-light)', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    {bw}kg
                                </button>
                            ))}
                        </div>
                    </div>

                    {mode === 'targetToPlates' ? (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ color: 'var(--text-light)', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>{t('pc_target_weight')}</label>
                                <input
                                    type="number"
                                    value={targetWeight}
                                    onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                                    step="1.25"
                                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            {platesForTarget && perSide >= 0 ? (
                                <div style={{ background: 'rgba(0,195,255,0.07)', border: '1px solid rgba(0,195,255,0.2)', borderRadius: '10px', padding: '1rem' }}>
                                    <p style={{ margin: '0 0 10px 0', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                                        {t('pc_per_side')} <strong style={{ color: 'var(--accent-primary)' }}>{perSide}kg</strong>
                                    </p>
                                    {platesForTarget.result.length > 0 ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <div style={{ width: '8px', height: '50px', background: 'linear-gradient(180deg, #94a3b8, #64748b)', borderRadius: '2px' }} title="Bar" />
                                            {platesForTarget.result.map(({ plate, count }) => (
                                                <Plate key={plate} w={plate} count={count} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-light)', margin: 0 }}>{t('pc_bar_only')}</p>
                                    )}
                                    {platesForTarget.leftover > 0 && (
                                        <p style={{ color: 'var(--accent-warning)', fontSize: '0.75rem', margin: '8px 0 0 0' }}>
                                            {t('pc_leftover').replace('{x}', platesForTarget.leftover)}
                                        </p>
                    )}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', textAlign: 'center' }}>{t('pc_too_light')}</p>
                            )}
                        </>
                    ) : (
                        <div>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', margin: '0 0 10px 0' }}>{t('pc_pick_plates')}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                                {PLATES_KG.map(p => (
                                    <button key={p} onClick={() => setSelected(prev => ({ ...prev, [p]: ((prev[p] || 0) + 1) % 6 }))}
                                        style={{ width: '52px', height: '52px', borderRadius: '8px', background: p >= 20 ? '#ef4444' : p >= 10 ? '#22c55e' : p >= 5 ? '#eab308' : '#94a3b8', color: '#000', fontWeight: 'bold', fontSize: '0.9rem', border: selected[p] ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        {p}
                                        {selected[p] > 0 && <span style={{ fontSize: '0.65rem' }}>x{selected[p]}</span>}
                                    </button>
                                ))}
                            </div>
                            <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                                <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.8rem' }}>{t('pc_total')}</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#00ff88' }}>
                                    {Math.round(totalFromPlates * 100) / 100} kg
                                </p>
                                <p style={{ margin: '4px 0 0 0', color: 'var(--text-light)', fontSize: '0.75rem' }}>
                                    ({barWeight}kg bar + {Math.round(platesSum * 100) / 100}kg x2)
                                </p>
                            </div>
                            {Object.keys(selected).length > 0 && (
                                <button onClick={() => setSelected({})}
                                    style={{ width: '100%', marginTop: '0.8rem', padding: '0.5rem', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: '8px', color: '#ff4757', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    {t('pc_reset')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PlateCalculator;
