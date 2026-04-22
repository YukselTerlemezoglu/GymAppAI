import React, { useMemo } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Target } from 'lucide-react';

const MUSCLE_KEYWORDS = {
    'Göğüs': ['bench press', 'chest', 'göğüs', 'pec', 'push up', 'şınav', 'fly', 'dips'],
    'Sırt': ['pull up', 'barfiks', 'row', 'kürek', 'sırt', 'back', 'lat', 'deadlift', 'pulldown', 'shrug'],
    'Bacak': ['squat', 'leg', 'bacak', 'calf', 'kalf', 'lunge', 'extension', 'curl'],
    'Omuz': ['shoulder', 'omuz', 'lateral', 'raise', 'deltoid', 'military', 'overhead'],
    'Kol': ['bicep', 'tricep', 'curl', 'extension', 'arm', 'kol', 'skullcrusher', 'pushdown'],
    'Merkez': ['core', 'karın', 'abs', 'crunch', 'plank', 'mekik', 'sit up', 'russian twist', 'leg raise']
};

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
    const { t } = useTranslation();
    const radarData = useMemo(() => {
        if (!workoutHistory || workoutHistory.length === 0) return [];

        const groupCounts = {
            'Göğüs': 0,
            'Sırt': 0,
            'Bacak': 0,
            'Omuz': 0,
            'Kol': 0,
            'Merkez': 0
        };

        workoutHistory.forEach(w => {
            if (!w.exercise || !w.sets) return;
            const exName = w.exercise.toLowerCase();
            const sets = parseInt(w.sets) || 0;

            let foundGroup = null;

            // En iyi eşleşmeyi bul
            for (const [group, keywords] of Object.entries(MUSCLE_KEYWORDS)) {
                if (keywords.some(keyword => exName.includes(keyword))) {
                    foundGroup = group;
                    break;
                }
            }

            // Omuz press'leri göğüsle karışmasın diye özel kontrol
            if (exName.includes('press') && !foundGroup) {
                if (exName.includes('shoulder') || exName.includes('overhead')) foundGroup = 'Omuz';
                else if (exName.includes('leg')) foundGroup = 'Bacak';
                else foundGroup = 'Göğüs'; // Varsayılan press göğüstür
            }

            if (foundGroup) {
                groupCounts[foundGroup] += sets;
            }
        });

        // Tüm grupların maksimum değerini bulup grafiği şekillendirmek için
        let maxValue = 0;
        const dataArray = Object.keys(groupCounts).map(subject => {
            if (groupCounts[subject] > maxValue) maxValue = groupCounts[subject];
            
            // subjectDisplay için çeviri anahtarı oluştur
            const transKey = subject === 'Göğüs' ? 'muscle_chest' :
                           subject === 'Sırt' ? 'muscle_back' :
                           subject === 'Bacak' ? 'muscle_legs' :
                           subject === 'Omuz' ? 'muscle_shoulders' :
                           subject === 'Kol' ? 'muscle_arms' :
                           subject === 'Merkez' ? 'muscle_core' : subject;

            return {
                subject,
                subjectDisplay: t(transKey),
                sets: groupCounts[subject],
                fullMark: maxValue * 1.2 || 10
            };
        });

        return dataArray.map(item => ({ ...item, fullMark: maxValue * 1.2 || 10 }));

    }, [workoutHistory, t]);

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
                {t('radar_description')}
            </p>
            
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subjectDisplay" tick={{ fill: 'var(--text-light)', fontSize: 12, fontWeight: 'bold' }} />
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
