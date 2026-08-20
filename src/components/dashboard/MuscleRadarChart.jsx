import React, { useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Target } from 'lucide-react';
import { MUSCLE_GROUPS, findMuscleGroupIdForExercise } from '../../data/exercises';

function CustomRadarTooltip({ active, payload, t }) {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid #00c3ff', padding: '10px', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 15px rgba(0, 195, 255, 0.2)' }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{payload[0].payload.subjectDisplay}</p>
                <p style={{ margin: '0', color: '#fff' }}>
                    {t('radar_sets')}: <span style={{ color: '#00c3ff', fontWeight: 'bold' }}>{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
}

function MuscleRadarChart({ workoutHistory }) {
    const { t, lang } = useLanguage();
    const isEn = lang === 'en';

    const radarData = useMemo(() => {
        if (!workoutHistory || workoutHistory.length === 0) return [];

        // Kas grup ID'si bazli sayac (tek kaynak: exercises.js)
        const counts = Object.fromEntries(MUSCLE_GROUPS.map(mg => [mg.id, 0]));

        // Son 30 gunun antrenmanlari (daha eski kayitlar radar'i bozmasin)
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        workoutHistory.forEach(w => {
            if (!w.exercise || !w.sets) return;
            if (w.date && !isNaN(new Date(w.date)) && new Date(w.date).getTime() < cutoff) return;
            const sets = parseInt(w.sets) || 0;
            const groupId = findMuscleGroupIdForExercise(w.exercise);
            if (groupId && groupId in counts) {
                counts[groupId] += sets;
            }
        });

        let maxValue = 0;
        const dataArray = MUSCLE_GROUPS.map(mg => {
            if (counts[mg.id] > maxValue) maxValue = counts[mg.id];
            return {
                subject: mg.id,
                subjectDisplay: isEn ? (mg.name_en || mg.name) : mg.name,
                sets: counts[mg.id],
                fullMark: 10
            };
        });

        return dataArray.map(item => ({ ...item, fullMark: maxValue * 1.2 || 10 }));

    }, [workoutHistory, isEn]);

    if (!radarData || radarData.length === 0 || radarData.every(d => d.sets === 0)) {
        return (
            <div className="glass-card" style={{ marginTop: '1rem', border: '1px solid rgba(0, 195, 255, 0.2)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginTop: 0 }}>
                    <Target color="#00c3ff" /> {t('radar_title')}
                </h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                    {t('radar_no_data')}
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card slide-in" style={{ marginTop: '1rem', border: '1px solid rgba(0, 195, 255, 0.3)', background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0, 195, 255, 0.05) 100%)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginTop: 0, marginBottom: '1rem' }}>
                <Target color="#00c3ff" /> {t('radar_title')}
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {t('radar_description')} · <span style={{ color: '#00c3ff', fontWeight: 600 }}>{t('radar_last30')}</span>
            </p>

            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subjectDisplay" tick={{ fill: 'var(--text-light)', fontSize: 11, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Tooltip content={<CustomRadarTooltip t={t} />} />
                        <Radar
                            name={t('radar_sets')}
                            dataKey="sets"
                            stroke="#00c3ff"
                            strokeWidth={2}
                            fill="url(#colorRadar)"
                            fillOpacity={0.6}
                        />
                        <defs>
                            <linearGradient id="colorRadar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00c3ff" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ff0088" stopOpacity={0.4}/>
                            </linearGradient>
                        </defs>
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default MuscleRadarChart;
