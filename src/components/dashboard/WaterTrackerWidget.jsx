import React, { useMemo } from 'react';
import { Droplets, Plus, Minus, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import useLocalStorage from '../../hooks/useLocalStorage';

const GLASS_ML = 250;
const DEFAULT_GOAL_ML = 2500;

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Günlük Su Takibi
 * Bardak tabanlı sayaç (250ml). Gün değişince otomatik sıfırlanır.
 * Hedef: sabit 2500ml (ileride kilo bazlı hesaba açılabilir).
 */
function WaterTrackerWidget() {
    const { t, lang } = useLanguage();
    const [waterState, setWaterState] = useLocalStorage('gym_app_water', { date: getTodayKey(), ml: 0 });

    // Gün değiştiyse sıfırla (okuma anında normalle)
    const today = getTodayKey();
    const currentMl = waterState.date === today ? waterState.ml : 0;

    const goalMl = DEFAULT_GOAL_ML;
    const glasses = Math.ceil(goalMl / GLASS_ML);
    const doneGlasses = Math.floor(currentMl / GLASS_ML);
    const pct = Math.min(100, Math.round((currentMl / goalMl) * 100));
    const isDone = currentMl >= goalMl;

    const update = (deltaMl) => {
        const newMl = Math.max(0, currentMl + deltaMl);
        setWaterState({ date: today, ml: newMl });
    };

    const glassStatus = (i) => {
        const filled = i < doneGlasses;
        const partial = i === doneGlasses && currentMl % GLASS_ML > 0;
        return { filled, partial };
    };

    return (
        <div
            className="glass-card slide-in"
            style={{
                animationDelay: '0.25s',
                marginBottom: '1rem',
                border: `1px solid ${isDone ? 'rgba(0,195,255,0.5)' : 'rgba(0,195,255,0.2)'}`,
                background: 'linear-gradient(145deg, rgba(0,0,0,0.4) 0%, rgba(0,195,255,0.05) 100%)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Droplets size={18} color="#00c3ff" /> {t('water_title')}
                </h3>
                <span style={{ fontSize: '0.85rem', color: isDone ? '#00c3ff' : 'var(--text-light)', fontWeight: 'bold' }}>
                    {isDone ? <Check size={16} color="#00c3ff" /> : `${(currentMl / 1000).toFixed(2)}L / ${(goalMl / 1000).toFixed(1)}L`}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                    onClick={() => update(-GLASS_ML)}
                    disabled={currentMl === 0}
                    style={{ width: '34px', height: '34px', borderRadius: '50%', background: currentMl > 0 ? 'rgba(0,195,255,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,195,255,0.3)', color: currentMl > 0 ? '#00c3ff' : 'var(--text-muted)', cursor: currentMl > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    aria-label={t('water_remove')}
                >
                    <Minus size={16} />
                </button>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', flex: 1 }}>
                    {Array.from({ length: glasses }).map((_, i) => {
                        const { filled, partial } = glassStatus(i);
                        return (
                            <button
                                key={i}
                                onClick={() => update(filled || partial ? -(currentMl - i * GLASS_ML) : (i + 1) * GLASS_ML - currentMl)}
                                title={`${(i + 1) * GLASS_ML}ml`}
                                style={{
                                    width: '26px',
                                    height: '34px',
                                    borderRadius: '4px 4px 8px 8px',
                                    border: `1.5px solid ${filled ? '#00c3ff' : 'rgba(0,195,255,0.3)'}`,
                                    background: filled
                                        ? 'linear-gradient(180deg, rgba(0,195,255,0.8), rgba(0,116,217,0.9))'
                                        : partial
                                            ? `linear-gradient(180deg, rgba(0,195,255,0.5) ${(currentMl % GLASS_ML) / GLASS_ML * 100}%, rgba(255,255,255,0.04) ${(currentMl % GLASS_ML) / GLASS_ML * 100}%)`
                                            : 'rgba(255,255,255,0.04)',
                                    cursor: 'pointer',
                                    padding: 0,
                                    transition: 'all 0.2s'
                                }}
                                aria-label={`${t('water_set')} ${(i + 1) * GLASS_ML}ml`}
                            />
                        );
                    })}
                </div>

                <button
                    onClick={() => update(GLASS_ML)}
                    style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(0,195,255,0.15)', border: '1px solid rgba(0,195,255,0.3)', color: '#00c3ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    aria-label={t('water_add')}
                >
                    <Plus size={16} />
                </button>
            </div>

            <div style={{ marginTop: '8px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #00c3ff, #00ff88)', transition: 'width 0.3s' }} />
            </div>
            {isDone && (
                <p style={{ margin: '8px 0 0 0', color: '#00c3ff', fontSize: '0.78rem', textAlign: 'center' }}>
                    {t('water_done_msg')}
                </p>
            )}
        </div>
    );
}

export default WaterTrackerWidget;
