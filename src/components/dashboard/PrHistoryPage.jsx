import React, { useMemo } from 'react';
import { ArrowLeft, Trophy, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { estimate1RM } from '../../utils/prTracker';

function formatDate(isoStr, lang) {
    try {
        return new Date(isoStr).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return '';
    }
}

/**
 * PR Gecmisi Sayfasi
 * Gecmis kayitlarindan her egzersizin en iyi setini (e1RM) cikarir,
 * tarihe gore siralar. Ayrica en yakin rakip seti gosterir.
 */
function PrHistoryPage({ workoutHistory, onBack }) {
    const { t, lang } = useLanguage();

    const records = useMemo(() => {
        if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) return [];

        // Egzersiz bazinda en iyi e1RM setleri
        const byExercise = new Map();
        workoutHistory.forEach(w => {
            if (!w || !w.exercise) return;
            const e1rm = estimate1RM(w.maxWeight, w.bestReps);
            if (e1rm <= 0) return;
            const entry = { exercise: w.exercise, date: w.date, weight: w.maxWeight, reps: w.bestReps, e1rm };
            const prev = byExercise.get(w.exercise);
            if (!prev || e1rm > prev.e1rm) {
                byExercise.set(w.exercise, entry);
            }
        });

        return Array.from(byExercise.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [workoutHistory]);

    const totalPrs = records.length;

    return (
        <div className="app-container slide-in">
            <header className="top-bar fade-in" style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <button className="back-btn" onClick={onBack} style={{ marginBottom: '1rem' }}>
                    <ArrowLeft size={20} /> {t('btn_back')}
                </button>
                <h2 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Trophy color="#ffd700" /> {t('prh_title')}
                </h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                    {t('prh_subtitle').replace('{n}', totalPrs)}
                </p>
            </header>

            {records.length === 0 ? (
                <div className="glass-card" style={{ marginTop: '1rem', textAlign: 'center', padding: '2rem' }}>
                    <Trophy size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p style={{ color: 'var(--text-light)' }}>{t('prh_empty')}</p>
                </div>
            ) : (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingBottom: '2rem' }}>
                    {records.map((r, i) => (
                        <div key={i} className="glass-card" style={{ padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: i < 3 ? '3px solid #ffd700' : undefined }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem', overflowWrap: 'break-word' }}>
                                    {r.exercise}
                                </div>
                                <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginTop: '2px' }}>
                                    {formatDate(r.date, lang)} · e1RM {r.e1rm.toFixed(1)}kg
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                                <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '1rem' }}>
                                    {r.weight}kg × {r.reps}
                                </div>
                                {i < 3 && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                                        <TrendingUp size={11} /> {t('prh_top')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PrHistoryPage;
