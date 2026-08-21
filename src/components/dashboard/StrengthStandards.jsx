import React, { useMemo, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

// Kuvvet standartlari: e1RM / vucut agirligi orani bantlari.
// Kaynaklar: Strength Level / ExRx klasik bantlama (erkek, ~%50 persentil ayarlamali).
const LIFTS = [
    { key: 'bench', label: 'Bench Press' },
    { key: 'squat', label: 'Squat' },
    { key: 'deadlift', label: 'Deadlift' },
    { key: 'ohp', label: 'Overhead Press' }
];

// [yeni baslayan, acemi, orta, ileri, elit] — e1RM / vucut agirligi carpanlari
const STANDARDS = {
    male: {
        bench:   [0.50, 0.75, 1.00, 1.50, 2.00],
        squat:   [0.75, 1.25, 1.50, 2.00, 2.50],
        deadlift:[1.00, 1.50, 2.00, 2.50, 3.00],
        ohp:     [0.35, 0.55, 0.70, 0.90, 1.10]
    },
    female: {
        bench:   [0.25, 0.50, 0.70, 1.00, 1.40],
        squat:   [0.50, 0.75, 1.10, 1.50, 2.00],
        deadlift:[0.75, 1.00, 1.40, 2.00, 2.50],
        ohp:     [0.20, 0.35, 0.50, 0.65, 0.85]
    }
};

const LEVEL_NAMES_TR = ['Yeni Başlayan', 'Acemi', 'Orta', 'İleri', 'Elit'];
const LEVEL_NAMES_EN = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];
const LEVEL_COLORS = ['#8a8a8a', '#4caf50', '#00c3ff', '#ff9800', '#ff0088'];

// Big-three tarzi lift isimleri: kullanici/AI farkli varyantlar yazabilir
const LIFT_ALIASES = {
    bench: ['bench press', 'barbell bench press', 'bench', 'incline bench press', 'dumbbell bench press', 'chest press', 'gogus press', 'bench press (barbell)'],
    squat: ['squat', 'back squat', 'barbell squat', 'front squat', 'hack squat', 'smith machine squat', 'bacak squat', 'squat (barbell)'],
    deadlift: ['deadlift', 'conventional deadlift', 'barbell deadlift', 'romanian deadlift', 'rdl', 'sumo deadlift', 'cekilis', 'deadlift (barbell)'],
    ohp: ['overhead press', 'ohp', 'military press', 'shoulder press', 'strict press', 'barbell overhead press', 'omuz press', 'arnold press']
};

// Ilgili lift'in en iyi e1RM setini bul: dogrudan ad + bilinen varyantlar
function findLiftE1RM(liftKey, history) {
    if (!history || history.length === 0) return null;
    const names = new Set(LIFT_ALIASES[liftKey] || []);
    let best = null;
    history.forEach(w => {
        if (!w || !w.exercise) return;
        const n = w.exercise.toLowerCase().trim();
        if (names.has(n)) {
            const e1rm = (parseFloat(w.maxWeight) || 0) * (1 + (parseInt(w.bestReps) || 0) / 30);
            if (e1rm > 0 && (!best || e1rm > best.e1rm)) {
                best = { date: w.date, weight: w.maxWeight, reps: w.bestReps, e1rm };
            }
        }
    });
    return best;
}

function StrengthStandards({ workoutHistory }) {
    const { t, lang } = useTranslation();
    const [sex, setSex] = useLocalState('gym_app_sex', null);

    const bodyWeight = useMemo(() => {
        try {
            const metrics = JSON.parse(localStorage.getItem('gym_app_body_metrics') || '[]');
            if (!Array.isArray(metrics) || metrics.length === 0) return null;
            const withWeight = metrics.filter(m => m && parseFloat(m.weight) > 0).sort((a, b) => new Date(b.date) - new Date(a.date));
            return withWeight.length ? parseFloat(withWeight[0].weight) : null;
        } catch {
            return null;
        }
    }, []);

    const rows = useMemo(() => {
        if (!bodyWeight) return null;
        return LIFTS.map(lift => {
            const best = findLiftE1RM(lift.key, workoutHistory);
            const ratio = best ? best.e1rm / bodyWeight : 0;
            const bands = STANDARDS[sex || 'male'][lift.key];
            let level = -1; // -1 = veri yok
            if (best) {
                level = 0;
                for (let i = 0; i < bands.length; i++) {
                    if (ratio >= bands[i]) level = i;
                }
            }
            const nextThreshold = level >= 0 && level < 4 ? bands[level + 1] * bodyWeight : null;
            return { ...lift, best, ratio, level, nextThreshold, bands };
        });
    }, [bodyWeight, workoutHistory, sex]);

    if (!workoutHistory || workoutHistory.length === 0) return null;

    // Veri yoksa (vucut agirligi girilmemisse) kartin kendisini goster ama bilgilendir
    return (
        <div className="glass-card slide-in" style={{ animationDelay: '0.1s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Dumbbell size={20} color="var(--accent-primary)" /> {t('ss_title')}
                </h3>
                {/* Cinsiyet secimi (standartlar cinsiyete gore farklilasir) */}
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    {[['male', '♂'], ['female', '♀']].map(([val, icon]) => (
                        <button
                            key={val}
                            onClick={() => setSex(val)}
                            style={{
                                padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: (sex || 'male') === val ? 'var(--accent-primary)' : 'transparent',
                                color: (sex || 'male') === val ? '#000' : '#fff',
                                fontWeight: 'bold', fontSize: '0.85rem'
                            }}
                        >{icon}</button>
                    ))}
                </div>
            </div>

            {!bodyWeight ? (
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0 }}>
                    {t('ss_need_weight')}
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {rows.map(row => {
                        const names = lang === 'tr' ? LEVEL_NAMES_TR : LEVEL_NAMES_EN;
                        return (
                            <div key={row.key} style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                    <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{row.label}</strong>
                                    {row.best ? (
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                                            {Math.round(row.best.e1rm)}kg e1RM · {t('ss_ratio')}: {row.ratio.toFixed(2)}×
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', opacity: 0.6 }}>{t('ss_no_data')}</span>
                                    )}
                                </div>
                                {row.best && (
                                    <>
                                        {/* Seviye bantlari */}
                                        <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
                                            {row.bands.map((b, i) => {
                                                const reached = row.level >= i;
                                                return (
                                                    <div key={i} style={{ flex: 1, textAlign: 'center', padding: '3px 2px', borderRadius: '4px', fontSize: '0.65rem', background: reached ? LEVEL_COLORS[i] : 'rgba(255,255,255,0.06)', color: reached ? '#000' : 'var(--text-light)', fontWeight: reached ? 'bold' : 400 }}>
                                                        {names[i]}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {row.nextThreshold && (
                                            <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                                {t('ss_next_level').replace('{kg}', Math.ceil(row.nextThreshold / 2.5) * 2.5).replace('{level}', names[row.level + 1])}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-light)', opacity: 0.6 }}>
                        {t('ss_note')}
                    </p>
                </div>
            )}
        </div>
    );
}

// Kucuk yardimci: localStorage destekli lokal state
function useLocalState(key, initial) {
    const [value, setValue] = useState(() => {
        try {
            const v = localStorage.getItem(key);
            return v !== null ? v : initial;
        } catch {
            return initial;
        }
    });
    return [value, (v) => {
        setValue(v);
        try { localStorage.setItem(key, v); } catch { /* yazma engellenebilir */ }
    }];
}

export default StrengthStandards;
