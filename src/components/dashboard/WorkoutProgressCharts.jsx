import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line } from 'recharts';
import { Activity, BarChart2, TrendingUp, Trophy } from 'lucide-react';
import MuscleRadarChart from './MuscleRadarChart';
import MuscleMapCard from './MuscleMap';
import WeeklyVolumeBoard from './WeeklyVolumeBoard';
import { useTranslation } from '../../i18n/LanguageContext';

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '8px', color: '#fff' }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ margin: '0', color: entry.color }}>
                        {entry.name}: {entry.value} kg
                    </p>
                ))}
            </div>
        );
    }
    return null;
}

function WorkoutProgressCharts({ workoutHistory, onOpenPrHistory }) {
    const { t } = useTranslation();
    const [chartTab, setChartTab] = useState('volume'); // 'volume' | 'strength'

    const { weeklyVolumeData, strengthData, topExercises } = useMemo(() => {
        if (!workoutHistory || workoutHistory.length === 0) {
            return { weeklyVolumeData: [], strengthData: [], topExercises: [] };
        }

        // 1. Weekly Volume Data (Son 8 Hafta)
        const volumeMap = {};
        const today = new Date();
        const startOfThisWeek = new Date(today);
        startOfThisWeek.setDate(today.getDate() - today.getDay());
        startOfThisWeek.setHours(0, 0, 0, 0);

        workoutHistory.forEach(w => {
            const wDate = new Date(w.date);
            // Hafta hesaplama (Pazar başlangıçlı)
            const diffTime = Math.abs(startOfThisWeek - wDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const weeksAgo = wDate < startOfThisWeek ? Math.floor(diffDays / 7) + 1 : 0;

            if (weeksAgo <= 7) {
                const label = weeksAgo === 0 ? t('charts_this_week') : t('charts_weeks_ago', { count: weeksAgo });
                const volume = w.totalWeight || (w.maxWeight * w.bestReps * w.sets) || 0;

                if (!volumeMap[label]) {
                    // Hafta sırasını korumak için sortIndex ekliyoruz
                    volumeMap[label] = { hafta: label, hacim: 0, sortIndex: weeksAgo };
                }
                volumeMap[label].hacim += volume;
            }
        });

        const weeklyVolumeData = Object.values(volumeMap).sort((a, b) => b.sortIndex - a.sortIndex); // Eskiden yeniye

        // 2. Strength Data (Top 2 Exercise E1RM Trend)
        const exerciseCounts = {};
        workoutHistory.forEach(w => {
            exerciseCounts[w.exercise] = (exerciseCounts[w.exercise] || 0) + 1;
        });

        // En çok yapılan 2 egzersizi bul
        const topExercises = Object.keys(exerciseCounts)
            .sort((a, b) => exerciseCounts[b] - exerciseCounts[a])
            .slice(0, 2);

        const strengthMap = {}; // { dateStr: { date: '...', ex1: val, ex2: val } }

        // Sadece son 30 günün trendine bakalım ki grafik çok sıkışmasın
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        [...workoutHistory].reverse().forEach(w => {
            if (topExercises.includes(w.exercise) && new Date(w.date) >= thirtyDaysAgo) {
                const dateObj = new Date(w.date);
                const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

                if (!strengthMap[dateStr]) {
                    strengthMap[dateStr] = { date: dateStr, timestamp: dateObj.getTime() };
                }

                // Estimated 1RM
                const e1rm = Math.round((w.maxWeight || 0) * (1 + ((w.bestReps || 0) / 30)));

                // Aynı gün birden fazla set varsa en yüksek olanı al
                if (!strengthMap[dateStr][w.exercise] || e1rm > strengthMap[dateStr][w.exercise]) {
                    strengthMap[dateStr][w.exercise] = e1rm;
                }
            }
        });

        const strengthData = Object.values(strengthMap).sort((a, b) => a.timestamp - b.timestamp);

        return { weeklyVolumeData, strengthData, topExercises };
    }, [workoutHistory, t]);

    if (!workoutHistory || workoutHistory.length === 0) {
        return null;
    }

    return (
        <section className="fade-in" style={{ animationDelay: '0.2s', marginBottom: '2rem' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Activity size={20} color="var(--accent-primary)" /> {t('charts_analysis_title')}
                </h2>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => onOpenPrHistory && onOpenPrHistory()}
                        style={{
                            background: 'rgba(255, 215, 0, 0.12)',
                            color: '#ffd700',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                        title={t('prh_title')}
                    >
                        <Trophy size={15} /> {t('prh_title')}
                    </button>
                    <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setChartTab('volume')}
                        style={{
                            background: chartTab === 'volume' ? 'rgba(0, 195, 255, 0.2)' : 'transparent',
                            color: chartTab === 'volume' ? '#00c3ff' : 'var(--text-light)',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <BarChart2 size={16} /> {t('charts_volume_tab')}
                    </button>
                    <button
                        onClick={() => setChartTab('strength')}
                        style={{
                            background: chartTab === 'strength' ? 'rgba(255, 0, 136, 0.2)' : 'transparent',
                            color: chartTab === 'strength' ? '#ff0088' : 'var(--text-light)',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <TrendingUp size={16} /> {t('charts_strength_tab')}
                    </button>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ height: '300px' }}>
                {chartTab === 'volume' ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="hafta" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                            <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Bar dataKey="hacim" name={t('charts_total_volume')} fill="#00c3ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={strengthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                            <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            {topExercises[0] && (
                                <Line type="monotone" dataKey={topExercises[0]} name={`${topExercises[0]} (${t('charts_strength_tab')})`} stroke="#ff0088" strokeWidth={3} dot={{ r: 4, fill: '#ff0088' }} activeDot={{ r: 6 }} connectNulls />
                            )}
                            {topExercises[1] && (
                                <Line type="monotone" dataKey={topExercises[1]} name={`${topExercises[1]} (${t('charts_strength_tab')})`} stroke="#00ff88" strokeWidth={3} dot={{ r: 4, fill: '#00ff88' }} activeDot={{ r: 6 }} connectNulls />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* KAS DENGESİ ANALİZİ (RADAR CHART) */}
            <MuscleRadarChart workoutHistory={workoutHistory} />

            {/* RENKLİ KAS HARİTASI (GÖRSEL HACİM) */}
            <MuscleMapCard workoutHistory={workoutHistory} />

            {/* HAFTALIK KAS HACMİ PANOSU */}
            <WeeklyVolumeBoard workoutHistory={workoutHistory} />
        </section>
    );
}

export default WorkoutProgressCharts;
