import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { MUSCLE_GROUPS, findMuscleGroupIdForExercise } from '../../data/exercises';
import { useCutoff } from '../../hooks/useToday';

/**
 * Haftalık Kas Hacim Panosu
 * Son 7 günde kas grubu başına kaç set çalıştıldığını sayar ve
 * anatomi verisindeki weeklySets önerisiyle karşılaştırır.
 */
function WeeklyVolumeBoard({ workoutHistory }) {
    const { t, lang } = useLanguage();
    const isEn = lang === 'en';
    const cutoff7 = useCutoff(7);

    const rows = useMemo(() => {
        const cutoff = cutoff7;
        const counts = Object.fromEntries(MUSCLE_GROUPS.map(mg => [mg.id, 0]));

        (workoutHistory || []).forEach(w => {
            if (!w || !w.exercise) return;
            const d = new Date(w.date).getTime();
            if (isNaN(d) || d < cutoff) return;
            const sets = parseInt(w.sets) || 0;
            const groupId = findMuscleGroupIdForExercise(w.exercise);
            if (groupId && groupId in counts) counts[groupId] += sets;
        });

        return MUSCLE_GROUPS.map(mg => {
            const done = counts[mg.id];
            const rec = (mg.weeklySets && typeof mg.weeklySets === 'object')
                ? mg.weeklySets
                : { min: 0, max: 0, ...parseRange(mg.weeklySets) };
            const recMin = rec.min ?? 0;
            const recMax = rec.max ?? 0;
            const target = recMax > 0 ? recMax : recMin;
            const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : (done > 0 ? 100 : 0);
            let status = 'ok';
            if (done === 0) status = 'none';
            else if (recMin > 0 && done < recMin) status = 'low';
            else if (recMax > 0 && done > recMax * 1.25) status = 'high';
            return { mg, done, recMin, recMax, pct, status };
        });
    }, [workoutHistory, cutoff7]);

    if (!workoutHistory || workoutHistory.length === 0) {
        return (
            <div className="glass-card" style={{ marginTop: '1rem', border: '1px solid rgba(0,195,255,0.2)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginTop: 0 }}>
                    <Layers color="#00c3ff" /> {t('wvb_title')}
                </h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                    {t('wvb_no_data')}
                </p>
            </div>
        );
    }

    const statusMeta = {
        none: { color: '#94a3b8', label: isEn ? 'Not trained' : 'Çalışılmadı' },
        low: { color: '#f59e0b', label: isEn ? 'Below range' : 'Öneri altında' },
        ok: { color: '#00ff88', label: isEn ? 'In range' : 'Öneri aralığında' },
        high: { color: '#ff4757', label: isEn ? 'Above range' : 'Öneri üstünde' }
    };

    return (
        <div className="glass-card slide-in" style={{ marginTop: '1rem', border: '1px solid rgba(0,195,255,0.3)', background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0, 195, 255, 0.05) 100%)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginTop: 0, marginBottom: '4px' }}>
                <Layers color="#00c3ff" /> {t('wvb_title')}
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', margin: '0 0 1rem 0' }}>
                {t('wvb_subtitle')}
            </p>

            <div>
                {rows.map(({ mg, done, recMin, recMax, pct, status }) => {
                    const meta = statusMeta[status];
                    const hint = status === 'low' ? t('wvb_low_hint') : status === 'high' ? t('wvb_high_hint') : '';
                    return (
                        <div key={mg.id} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {isEn ? (mg.name_en || mg.name) : mg.name}
                                    {hint && <span style={{ color: meta.color, fontSize: '0.72rem', fontWeight: 400, marginLeft: '6px' }}>{'- ' + hint}</span>}
                                </span>
                                <span style={{ fontSize: '0.78rem' }}>
                                    <span style={{ color: meta.color, fontWeight: 'bold' }}>{done}</span>
                                    <span style={{ color: 'var(--text-light)' }}> / {recMin > 0 ? `${recMin}-${recMax}` : recMax} {t('wvb_sets')}</span>
                                </span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// "10-20" gibi metin aralığını {min, max}'a çevirir
function parseRange(str) {
    if (typeof str !== 'string') return {};
    const m = str.match(/(\d+)\s*-\s*(\d+)/);
    if (m) return { min: parseInt(m[1]), max: parseInt(m[2]) };
    const single = str.match(/(\d+)/);
    if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
    return {};
}

export default WeeklyVolumeBoard;
