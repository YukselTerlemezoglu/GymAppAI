import { localDayKey } from '../../utils/dateKey';
import React, { useState, useEffect } from 'react';
import { Droplets, Plus, Minus, Check, Settings2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import useLocalStorage from '../../hooks/useLocalStorage';
import { useToast } from '../ui/ToastProvider';

const GLASS_ML = 250;
const FALLBACK_GOAL_ML = 2500;
const ML_PER_KG = 33; // 30-35ml/kg ortalamasi

function getTodayKey() {
    return localDayKey();
}

/**
 * Gundem su takibi.
 * - Hedef: kullanici ayari > kilo bazli (33ml/kg) > 2500ml
 * - Bardak tabanli sayac (250ml), gun degisince otomatik sifirlanir
 */
function WaterTrackerWidget() {
    const { t } = useLanguage();
    const { haptic } = useToast();
    const [waterState, setWaterState] = useLocalStorage('gym_app_water', { date: getTodayKey(), ml: 0 });
    const [goalSetting, setGoalSetting] = useLocalStorage('gym_app_water_goal', null); // { mode: 'auto'|'manual', ml: number }
    const [bodyMetrics] = useLocalStorage('gym_app_body_metrics', []);
    const [showGoalEditor, setShowGoalEditor] = useState(false);
    const [manualGoalL, setManualGoalL] = useState('');

    const today = getTodayKey();
    const currentMl = waterState.date === today ? waterState.ml : 0;

    // En guncel kilo kaydi (yoksa null)
    const latestWeightKg = (() => {
        const withWeight = (bodyMetrics || []).filter(m => m && parseFloat(m.weight) > 0);
        if (withWeight.length === 0) return null;
        // Tarih siralama: en yeni kayit (date alanina gore)
        const sorted = withWeight.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        return parseFloat(sorted[0].weight);
    })();

    const autoGoalMl = latestWeightKg
        ? Math.round((latestWeightKg * ML_PER_KG) / 250) * 250 // bardak hizasina yuvarla
        : FALLBACK_GOAL_ML;

    const goalMl = goalSetting?.mode === 'manual' && goalSetting.ml >= 500
        ? goalSetting.ml
        : autoGoalMl;

    const glasses = Math.ceil(goalMl / GLASS_ML);
    const doneGlasses = Math.floor(currentMl / GLASS_ML);
    const pct = Math.min(100, Math.round((currentMl / goalMl) * 100));
    const isDone = currentMl >= goalMl;

    const update = (deltaMl) => {
        const newMl = Math.max(0, currentMl + deltaMl);
        setWaterState({ date: today, ml: newMl });
        haptic(deltaMl > 0 ? 12 : 8);
    };

    const glassStatus = (i) => {
        const filled = i < doneGlasses;
        const partial = i === doneGlasses && currentMl % GLASS_ML > 0;
        return { filled, partial };
    };

    const saveManualGoal = () => {
        const liters = parseFloat(manualGoalL);
        if (isNaN(liters) || liters < 0.5 || liters > 10) return;
        setGoalSetting({ mode: 'manual', ml: Math.round(liters * 1000) });
        setShowGoalEditor(false);
    };

    const setAutoGoal = () => {
        setGoalSetting({ mode: 'auto', ml: autoGoalMl });
        setShowGoalEditor(false);
    };

    const isManual = goalSetting?.mode === 'manual';

    // Hedef tamamlanan gunleri kaydet (rozet: Su Ustasi).
    // Her gun bir kez yazilir; hedef sonradan duserse kayit silinmez.
    const [waterHistory, setWaterHistory] = useLocalStorage('gym_app_water_history', []);
    useEffect(() => {
        if (!isDone) return;
        if (waterHistory.includes(today)) return;
        setWaterHistory([...waterHistory, today].slice(-400));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sadece hedef tamamlaninca yaz
    }, [isDone, today]);

    return (
        <div
            className="glass-card slide-in"
            style={{
                animationDelay: '0.25s',
                border: `1px solid ${isDone ? 'rgba(0,195,255,0.5)' : 'rgba(0,195,255,0.2)'}`,
                background: 'linear-gradient(145deg, rgba(0,0,0,0.4) 0%, rgba(0,195,255,0.05) 100%)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Droplets size={18} color="#00c3ff" /> {t('water_title')}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: isDone ? '#00c3ff' : 'var(--text-light)', fontWeight: 'bold' }}>
                        {isDone ? <Check size={16} color="#00c3ff" /> : `${(currentMl / 1000).toFixed(2)}L / ${(goalMl / 1000).toFixed(1)}L`}
                    </span>
                    <button
                        onClick={() => { setShowGoalEditor(!showGoalEditor); setManualGoalL(isManual ? (goalSetting.ml / 1000).toFixed(1) : (autoGoalMl / 1000).toFixed(1)); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '8px', margin: '-6px', display: 'flex' }}
                        title={t('water_goal_edit')}
                        aria-label={t('water_goal_edit')}
                    >
                        <Settings2 size={16} />
                    </button>
                </div>
            </div>

            {showGoalEditor && (
                <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '10px', padding: '0.8rem', marginBottom: '0.8rem', border: '1px solid rgba(0,195,255,0.15)' }}>
                    <p style={{ margin: '0 0 8px 0', color: 'var(--text-light)', fontSize: '0.78rem' }}>
                        {latestWeightKg
                            ? t('water_goal_auto_info').replace('{kg}', latestWeightKg).replace('{l}', (autoGoalMl / 1000).toFixed(1))
                            : t('water_goal_no_weight')}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min="0.5"
                            max="10"
                            value={manualGoalL}
                            onChange={(e) => setManualGoalL(e.target.value)}
                            placeholder="2.5"
                            style={{ width: '76px', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontWeight: 'bold', outline: 'none', fontSize: '16px' }}
                        />
                        <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>L {t('water_goal_manual')}</span>
                        <button onClick={saveManualGoal} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--accent-primary)', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                            {t('water_goal_save')}
                        </button>
                        {latestWeightKg && (
                            <button onClick={setAutoGoal} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(0,195,255,0.3)', background: 'transparent', color: '#00c3ff', cursor: 'pointer', fontSize: '0.8rem' }}>
                                {t('water_goal_use_auto')}
                            </button>
                        )}
                    </div>
                    {isManual && (
                        <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            {t('water_goal_current_manual').replace('{l}', (goalSetting.ml / 1000).toFixed(1))}
                        </p>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                    onClick={() => update(-GLASS_ML)}
                    disabled={currentMl === 0}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: currentMl > 0 ? 'rgba(0,195,255,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,195,255,0.3)', color: currentMl > 0 ? '#00c3ff' : 'var(--text-muted)', cursor: currentMl > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
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
                                    width: '30px',
                                    height: '40px',
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
                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,195,255,0.15)', border: '1px solid rgba(0,195,255,0.3)', color: '#00c3ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
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

