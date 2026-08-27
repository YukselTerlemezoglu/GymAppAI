import React, { useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Bot, AlertTriangle, TrendingUp, Target, Flame, BedDouble, HeartPulse, Gauge, Dumbbell, Sparkles } from 'lucide-react';
import { generateInsights, personalityForBuddy } from '../../utils/coachEngine';
import { MUSCLE_GROUPS } from '../../data/exercises';

// Koc Insgoru Akisi (Faz 1b + 1c).
// coachEngine kural motorundan gelen oncelikli icgoruleri kart olarak sunar.
// Kullanicinin AKTIF DOSTU varsa koçun sesi dostun kisiligiyle tonlanir.
// Analiz gucu HER DOSTTA TAMDIR — kisilik yalnizca selamlama/ton farkidir.

const TONE_ICON = {
    warning: AlertTriangle,
    suggestion: Target,
    success: TrendingUp,
    info: Gauge,
    neutral: Sparkles
};

const TONE_COLOR = {
    warning: '#ff4757',
    suggestion: '#ffd700',
    success: '#00ff88',
    info: '#00c3ff',
    neutral: '#a29bfe'
};

function CoachInsightFeed({ workoutHistory, sleepData, painData, weeklyGoal, activeBuddyId, activeBuddyIcon }) {
    const { t, lang } = useLanguage();

    const personality = useMemo(() => personalityForBuddy(activeBuddyId), [activeBuddyId]);

    const insights = useMemo(
        () => generateInsights({ workoutHistory, sleepData, painData, weeklyGoal }),
        [workoutHistory, sleepData, painData, weeklyGoal]
    );

    // En fazla 3 icgoru — kullanicigi bogmamak icin
    const top = insights.slice(0, 3);

    const groupName = (id) => {
        const g = MUSCLE_GROUPS.find(m => m.id === id);
        return g ? (lang === 'en' ? (g.name_en || g.name) : g.name) : id;
    };

    // --- Icgoru metni (i18n) -------------------------------------------------
    const insightText = (ins) => {
        const d = ins.data || {};
        switch (ins.id) {
            case 'empty_history':
                return { title: t('coach_insight_start_title'), desc: t('coach_insight_start_desc') };
            case 'plateau':
                return {
                    title: t('coach_insight_plateau_title', { exercise: d.exercise }),
                    desc: t('coach_insight_plateau_desc', { weeks: d.weeks, exercise: d.exercise })
                };
            case 'recovery_debt':
                return {
                    title: t('coach_insight_recovery_title'),
                    desc: t('coach_insight_recovery_desc', { rpe: d.avgRpe, freq: d.weeklyFreq, sleep: d.avgSleep > 0 ? d.avgSleep : null })
                };
            case 'recovery_watch':
                return {
                    title: t('coach_insight_watch_title'),
                    desc: t('coach_insight_watch_desc', { rpe: d.avgRpe })
                };
            case 'neglected_group':
                return {
                    title: t('coach_insight_neglected_title', { group: groupName(d.group) }),
                    desc: t('coach_insight_neglected_desc', { group: groupName(d.group), min: d.min })
                };
            case 'overload_opportunity': {
                const target = d.kind === 'weight'
                    ? t('coach_overload_weight', { weight: d.targetWeight, reps: d.targetReps })
                    : d.kind === 'backoff'
                        ? t('coach_overload_backoff', { weight: d.targetWeight })
                        : t('coach_overload_reps', { weight: d.targetWeight, reps: d.targetReps });
                return {
                    title: t('coach_insight_overload_title', { exercise: d.exercise }),
                    desc: t('coach_insight_overload_desc', { exercise: d.exercise, target })
                };
            }
            case 'weekly_goal_risk':
                return {
                    title: t('coach_insight_goal_risk_title'),
                    desc: t('coach_insight_goal_risk_desc', { count: d.count, goal: d.goal, days: d.daysLeft })
                };
            case 'weekly_goal_done':
                return {
                    title: t('coach_insight_goal_done_title'),
                    desc: t('coach_insight_goal_done_desc', { count: d.count, goal: d.goal })
                };
            case 'readiness': {
                const bandMsg = {
                    fresh: t('coach_readiness_fresh', { score: d.score }),
                    ready: t('coach_readiness_ready', { score: d.score }),
                    caution: t('coach_readiness_caution', { score: d.score }),
                    deload: t('coach_readiness_deload', { score: d.score })
                }[d.band] || '';
                return {
                    title: t('coach_readiness_title', { score: d.score }),
                    desc: bandMsg
                };
            }
            case 'deload_week':
                return {
                    title: t('coach_deload_title'),
                    desc: t('coach_deload_desc')
                };
            case 'pain_alert':
                return {
                    title: t('coach_insight_pain_title'),
                    desc: t('coach_insight_pain_desc', { level: d.level })
                };
            default:
                if (ins.id && ins.id.startsWith('balance_')) {
                    return {
                        title: t('coach_insight_balance_title', { label: d.label }),
                        desc: d.status === 'push_heavy'
                            ? t('coach_insight_balance_push', { ratio: d.ratio, label: d.label })
                            : t('coach_insight_balance_pull', { ratio: d.ratio, label: d.label })
                    };
                }
                return { title: t('coach_insight_generic_title'), desc: '' };
        }
    };

    // --- Dost selamlamasi (kisilik tonuna gore) -------------------------------
    const greeting = () => {
        if (!personality) return null;
        const styleKey = {
            dragon: 'coach_greet_dragon',
            bunny: 'coach_greet_bunny',
            owl: 'coach_greet_owl',
            cat: 'coach_greet_cat'
        }[personality.id];
        if (!styleKey) return null;
        const msg = t(styleKey);
        if (!msg || msg === styleKey) return null; // anahtar yoksa gosterme
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem', padding: '0.6rem 0.9rem', background: 'rgba(0,195,255,0.08)', borderRadius: '10px', border: '1px solid rgba(0,195,255,0.2)' }}>
                <span style={{ fontSize: '1.5rem' }}>{activeBuddyIcon || '🐾'}</span>
                <span style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    "{msg}"
                </span>
            </div>
        );
    };

    return (
        <section className="fade-in" style={{ animationDelay: '0.15s', marginBottom: '2rem' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={20} color="var(--accent-primary)" /> {t('coach_feed_title')}
                </h2>
                {personality && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {activeBuddyIcon || '🐾'} {t(personality.nameKey)}
                    </span>
                )}
            </div>

            {greeting()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {top.map((ins, i) => {
                    const Icon = TONE_ICON[ins.tone] || Sparkles;
                    const color = TONE_COLOR[ins.tone] || '#a29bfe';
                    const text = insightText(ins);
                    return (
                        <div key={ins.id} className="glass-card" style={{ borderLeft: `4px solid ${color}`, padding: '1rem 1.2rem', animationDelay: `${0.1 + i * 0.08}s` }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
                                <Icon size={16} color={color} /> {text.title}
                            </h3>
                            {text.desc && (
                                <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                                    {text.desc}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {insights.length > 3 && (
                <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.78rem', marginTop: '0.6rem' }}>
                    {t('coach_more_insights', { count: insights.length - 3 })}
                </p>
            )}
        </section>
    );
}

export default CoachInsightFeed;
