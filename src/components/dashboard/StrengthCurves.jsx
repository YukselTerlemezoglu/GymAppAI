import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, TrendingUp, Ghost, Target } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { e1rmSeries, balanceRatios, progressionRate } from '../../utils/strengthMath';

// KUVVET EGRILERI + DENGES ORANLARI (Faz 2c + 2d) + PROJEKSIYON (Faz 5c).
// e1rmSeries: hareket bazinda tahmini 1RM zaman serisi (kuvvet egrisi).
// balanceRatios: Bench:Row / Squat:RDL oranlariyla simetri analizi.
// projection: mevcut ilerleme hiziyla hedef e1RM'ye kac hafta.

function StrengthCurves({ workoutHistory }) {
    const { t, lang } = useTranslation();
    const [tab, setTab] = useState('curves'); // 'curves' | 'balance' | 'goal'

    // PROJEKSIYON (Faz 5c): hedef e1RM girisi
    const [goalInput, setGoalInput] = useState('');

    // En cok yapilan 4 hareket (egri secimi icin)
    const topExercises = useMemo(() => {
        if (!Array.isArray(workoutHistory)) return [];
        const counts = {};
        workoutHistory.forEach(w => { if (w?.exercise) counts[w.exercise] = (counts[w.exercise] || 0) + 1; });
        return Object.keys(counts)
            .sort((a, b) => counts[b] - counts[a])
            .slice(0, 4)
            .map(name => ({ name, sessions: counts[name] }));
    }, [workoutHistory]);

    const [selectedEx, setSelectedEx] = useState(null);

    const activeEx = useMemo(() => {
        if (selectedEx) return selectedEx;
        return topExercises[0]?.name || null;
    }, [selectedEx, topExercises]);

    const rate = useMemo(() => activeEx ? progressionRate(activeEx, workoutHistory) : null, [activeEx, workoutHistory]);
    const goalNum = parseFloat(goalInput) || 0;
    const projection = useMemo(() => {
        if (!rate || goalNum <= rate.current) return null;
        const weeks = Math.ceil((goalNum - rate.current) / rate.perWeek);
        return { weeks, perWeek: rate.perWeek, current: rate.current, target: goalNum };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rate, goalInput]);
    // HAYALET RAKIP: gecmis benzin — 4 hafta onceki sen
    const ghost = useMemo(() => {
        if (!activeEx) return null;
        const series = e1rmSeries(activeEx, workoutHistory);
        if (series.length < 2) return null;
        const last = series[series.length - 1];
        const cutoff = last.ts - 28 * 86400000;
        const past = series.filter(s => s.ts <= cutoff).pop() || series[0];
        return { current: last.e1rm, past: past.e1rm, gained: last.e1rm - past.e1rm };
    }, [activeEx, workoutHistory]);

    const curveData = useMemo(() => {
        if (!activeEx) return [];
        return e1rmSeries(activeEx, workoutHistory).map(s => ({
            date: new Date(s.ts).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' }),
            e1rm: Math.round(s.e1rm),
            kg: s.weight,
            reps: s.reps
        }));
    }, [activeEx, workoutHistory, lang]);

    const balances = useMemo(() => balanceRatios(workoutHistory), [workoutHistory]);

    if (!workoutHistory || workoutHistory.length === 0) return null;

    const COLORS = ['#00c3ff', '#ff0088', '#00ff88', '#ffd700'];

    return (
        <div className="glass-card slide-in" style={{ marginTop: '1rem', border: '1px solid rgba(0, 195, 255, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={20} color="#00c3ff" /> {t('strength_title')}
                </h3>
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setTab('curves')}
                        style={{
                            background: tab === 'curves' ? 'rgba(0,195,255,0.2)' : 'transparent',
                            color: tab === 'curves' ? '#00c3ff' : 'var(--text-light)',
                            border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
                        }}
                    >
                        {t('strength_tab_curves')}
                    </button>
                    <button
                        onClick={() => setTab('balance')}
                        style={{
                            background: tab === 'balance' ? 'rgba(255,0,136,0.2)' : 'transparent',
                            color: tab === 'balance' ? '#ff0088' : 'var(--text-light)',
                            border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
                        }}
                    >
                        {t('strength_tab_balance')}
                    </button>
                    <button
                        onClick={() => setTab('goal')}
                        style={{
                            background: tab === 'goal' ? 'rgba(255,215,0,0.2)' : 'transparent',
                            color: tab === 'goal' ? '#ffd700' : 'var(--text-light)',
                            border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
                        }}
                    >
                        {t('strength_tab_goal')}
                    </button>
                </div>
            </div>

            {tab === 'curves' && (
                <div>
                    {/* Hareket secici */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                        {topExercises.map((ex, i) => (
                            <button
                                key={ex.name}
                                onClick={() => setSelectedEx(ex.name)}
                                style={{
                                    background: activeEx === ex.name ? `rgba(0,195,255,0.15)` : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${activeEx === ex.name ? COLORS[i % COLORS.length] : 'rgba(255,255,255,0.1)'}`,
                                    color: activeEx === ex.name ? COLORS[i % COLORS.length] : 'var(--text-light)',
                                    borderRadius: '999px', padding: '4px 12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                {ex.name}
                            </button>
                        ))}
                    </div>

                    {curveData.length >= 2 ? (
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={curveData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} unit=" kg" />
                                    <Tooltip
                                        contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(0,195,255,0.3)', borderRadius: 8 }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="e1rm" name="e1RM" stroke="#00c3ff" strokeWidth={2.5} dot={{ r: 3, fill: '#00c3ff' }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                            {t('strength_need_more_data')}
                        </p>
                    )}
                    <p style={{ color: 'var(--text-light)', fontSize: '0.72rem', margin: '0.4rem 0 0 0', textAlign: 'center' }}>
                        e1RM = {t('strength_e1rm_note')}
                    </p>
                </div>
            )}

            {tab === 'balance' && (
                <div>
                    {balances.length === 0 ? (
                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                            {t('strength_balance_need_data')}
                        </p>
                    ) : (
                        balances.map(b => {
                            const statusColor = b.status === 'balanced' ? '#00ff88' : '#ffd700';
                            const pct = Math.min(100, Math.round((b.ratio / (b.idealMax * 1.4)) * 100));
                            return (
                                <div key={b.id} style={{ padding: '0.7rem 0.9rem', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', marginBottom: '0.7rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Scale size={14} color={statusColor} /> {b.label}
                                        </span>
                                        <span style={{ color: statusColor, fontWeight: 700, fontSize: '0.95rem' }}>{b.ratio.toFixed(2)}</span>
                                    </div>
                                    {/* Ideal aralik gosterimi */}
                                    <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                        {/* ideal bolge */}
                                        <div style={{
                                            position: 'absolute', left: `${Math.round((b.idealMin / (b.idealMax * 1.4)) * 100)}%`,
                                            width: `${Math.round(((b.idealMax - b.idealMin) / (b.idealMax * 1.4)) * 100)}%`,
                                            top: 0, bottom: 0, background: 'rgba(0,255,136,0.25)'
                                        }} />
                                        {/* mevcut oran */}
                                        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, top: 0, bottom: 0, background: `linear-gradient(90deg, rgba(0,195,255,0.6), ${statusColor})`, borderRadius: '4px' }} />
                                        {/* oran isi cetveli */}
                                        <div style={{ position: 'absolute', left: `${pct}%`, top: -3, bottom: -3, width: '2px', background: '#fff', borderRadius: '1px' }} />
                                    </div>
                                    <p style={{ color: 'var(--text-light)', fontSize: '0.75rem', margin: '0.45rem 0 0 0' }}>
                                        {t('strength_ideal_range')}: {b.idealMin}–{b.idealMax} · {b.pushName} / {b.pullName}
                                        {b.status === 'balanced' ? ` · ✅ ${t('strength_balanced')}` : ` · ⚠️ ${t('strength_imbalanced')}`}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {tab === 'goal' && (
                <div>
                    {/* Hedef girişi */}
                    <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Target size={16} color="#ffd700" />
                        <input
                            type="number"
                            min="1"
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            placeholder={rate ? `${Math.round(rate.current)} → ${Math.round(rate.current * 1.2)}` : '...'}
                            style={{
                                flex: 1, minWidth: '120px', padding: '0.55rem 0.8rem', borderRadius: '8px',
                                background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,215,0,0.35)',
                                color: '#fff', fontSize: '0.95rem', outline: 'none'
                            }}
                        />
                        <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>kg e1RM</span>
                    </div>

                    {activeEx && (
                        <p style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 0.8rem 0' }}>
                            🏋️ <strong>{activeEx}</strong>
                            {rate && ` · ${t('strength_current')}: ${Math.round(rate.current)} kg · ${rate.perWeek >= 0 ? '+' : ''}${(rate.perWeek).toFixed(1)} kg/${t('strength_per_week')}`}
                        </p>
                    )}

                    {projection && rate ? (
                        <div style={{ padding: '1rem', background: 'rgba(255,215,0,0.08)', borderRadius: '12px', border: '1px dashed rgba(255,215,0,0.4)', textAlign: 'center' }}>
                            <p style={{ color: '#ffd700', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                                🎯 {t('strength_goal_eta', { weeks: projection.weeks, target: Math.round(projection.target) })}
                            </p>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.78rem', margin: '0.4rem 0 0 0' }}>
                                {t('strength_goal_rate_note')}
                            </p>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem 0' }}>
                            {t('strength_goal_hint')}
                        </p>
                    )}

                    {/* Hayalet rakip: 4 hafta onceki sen */}
                    {ghost && ghost.gained !== 0 && (
                        <div style={{ marginTop: '1rem', padding: '0.9rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Ghost size={22} color="#a29bfe" />
                            <div style={{ flex: 1 }}>
                                <p style={{ color: '#fff', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                                    {t('strength_ghost_title')}
                                </p>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>
                                    {t('strength_ghost_desc', {
                                        past: Math.round(ghost.past),
                                        now: Math.round(ghost.current),
                                        diff: (ghost.gained > 0 ? '+' : '') + Math.round(ghost.gained)
                                    })}
                                </p>
                            </div>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: ghost.gained > 0 ? '#00ff88' : '#ff6b81' }}>
                                {ghost.gained > 0 ? '↑' : '↓'}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default StrengthCurves;
