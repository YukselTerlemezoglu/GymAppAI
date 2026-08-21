import React, { useMemo, useState, useCallback } from 'react';
import { Bot, RefreshCw, CalendarRange, Target } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../ui/ToastProvider';
import { useCutoff } from '../../hooks/useToday';
import { generateWeeklyReport } from '../../services/groq';
import useLocalStorage from '../../hooks/useLocalStorage';
import { findMuscleGroupIdForExercise } from '../../data/exercises';

// Haftalik AI raporu: son 7 gunun lokal istatistikleri + Groq yorumu.
// Rapor localStorage'a kaydedilir; "Yenile" ile yeni rapor alinir.
function WeeklyAiReport({ workoutHistory }) {
    const { t, lang } = useTranslation();
    const { toast } = useToast();
    const [report, setReport] = useLocalStorage('gym_app_weekly_report', null);
    const [loading, setLoading] = useState(false);
    const cutoff7 = useCutoff(7);

    // Son 7 gunun lokal istatistikleri
    const stats = useMemo(() => {
        if (!workoutHistory || workoutHistory.length === 0) return null;
        const recent = workoutHistory.filter(w => {
            const d = new Date(w.date);
            return !isNaN(d.getTime()) && d.getTime() >= cutoff7;
        });
        if (recent.length === 0) return null;

        const totalVolume = recent.reduce((s, w) => s + (w.totalWeight || w.maxWeight * w.bestReps * w.sets || 0), 0);
        const totalSets = recent.reduce((s, w) => s + (w.sets || 0), 0);
        const days = new Set(recent.map(w => new Date(w.date).toDateString())).size;
        const rpeList = recent.filter(w => w.avgRpe > 0);
        const avgRpe = rpeList.length ? rpeList.reduce((s, w) => s + w.avgRpe, 0) / rpeList.length : 0;

        // En cok calisilan kas gruplari
        const muscleCount = {};
        recent.forEach(w => {
            const g = findMuscleGroupIdForExercise(w.exercise);
            if (g) muscleCount[g] = (muscleCount[g] || 0) + (w.sets || 0);
        });
        const topMuscles = Object.entries(muscleCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

        return { totalVolume, totalSets, days, avgRpe, topMuscles };
    }, [workoutHistory, cutoff7]);

    const fetchReport = useCallback(async () => {
        if (!stats) return;
        setLoading(true);
        try {
            const result = await generateWeeklyReport({
                lang,
                stats: {
                    workouts: stats.days,
                    totalSets: stats.totalSets,
                    totalVolumeKg: Math.round(stats.totalVolume),
                    avgRpe: Number(stats.avgRpe.toFixed(1)),
                    topMuscles: stats.topMuscles.map(([g, s]) => `${g}(${s} set)`).join(', ') || '-'
                }
            });
            setReport({ ...result, generatedAt: new Date().toISOString() });
            toast.success(t('war_generated'));
        } catch (err) {
            const msg = err.code === 'UNAUTHENTICATED'
                ? t('war_need_login')
                : err.code === 'RATE_LIMIT'
                    ? t('war_rate_limited')
                    : t('war_error');
            toast.error(`${msg}`);
        } finally {
            setLoading(false);
        }
    }, [stats, lang, setReport, toast, t]);

    if (!stats) return null; // son 7 gunde antrenman yoksa kart gorunmez

    const fmt = n => Math.round(n).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');

    return (
        <div className="glass-card slide-in" style={{ animationDelay: '0.12s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={20} color="var(--accent-primary)" /> {t('war_title')}
                </h3>
                <button
                    onClick={fetchReport}
                    disabled={loading}
                    className="neon-btn"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? t('war_loading') : t('war_refresh')}
                </button>
            </div>

            {/* Lokal istatistik seridi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stats.days}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{t('war_stat_days')}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{fmt(stats.totalSets)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{t('war_stat_sets')}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{fmt(stats.totalVolume)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{t('war_stat_volume')}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stats.avgRpe > 0 ? stats.avgRpe.toFixed(1) : '—'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{t('war_stat_rpe')}</div>
                </div>
            </div>

            {/* AI yorumu */}
            {report ? (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-light)', opacity: 0.7, marginBottom: '0.4rem' }}>
                        {new Date(report.generatedAt).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {report.summary && (
                        <p style={{ color: '#fff', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 0.6rem 0' }}>{report.summary}</p>
                    )}
                    {Array.isArray(report.suggestions) && report.suggestions.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {report.suggestions.slice(0, 3).map((s, i) => (
                                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                    <Target size={14} color="#00ff88" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span>{s}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarRange size={14} /> {t('war_empty')}
                </p>
            )}
        </div>
    );
}

export default WeeklyAiReport;
