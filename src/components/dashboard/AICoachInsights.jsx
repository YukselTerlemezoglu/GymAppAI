import React, { useMemo } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Bot, Clock, Activity, Flame } from 'lucide-react';

function AICoachInsights({ workoutHistory }) {
    const { t } = useTranslation();
    const localAiCoachData = useMemo(() => {
        if (!workoutHistory || workoutHistory.length === 0) {
            return {
                todaysPlan: {
                    title: t('ai_coach_start_title'),
                    desc: t('ai_coach_start_desc')
                },
                progression: {
                    title: t('ai_coach_first_step_title'),
                    desc: t('ai_coach_first_step_desc')
                },
                microGoal: t('ai_coach_micro_goal_initial')
            };
        }

        // 1. Today's Plan
        const last3DaysEx = workoutHistory.slice(0, 10).map(w => (w.exercise || '').toLowerCase());
        let target = t('ai_coach_target_push');
        let targetType = t('ai_coach_type_endurance');

        if (last3DaysEx.some(x => x.includes('bench') || x.includes('push'))) {
            if (last3DaysEx.some(x => x.includes('pull') || x.includes('row') || x.includes('lat'))) {
                target = t('ai_coach_target_legs');
                targetType = t('ai_coach_type_strength');
            } else {
                target = t('ai_coach_target_pull');
                targetType = t('ai_coach_type_volume');
            }
        } else {
            target = t('ai_coach_target_push');
            targetType = t('ai_coach_type_hypertrophy');
        }

        const todaysPlan = {
            title: t('ai_coach_plan_focused_title', { target }),
            desc: t('ai_coach_plan_focused_desc', { target, targetType })
        };

        // 2. Progression (Plateau Analizi)
        const exCounts = {};
        workoutHistory.forEach(w => {
            exCounts[w.exercise] = (exCounts[w.exercise] || 0) + 1;
        });
        let topEx = Object.keys(exCounts).reduce((a, b) => exCounts[a] > exCounts[b] ? a : b, "");

        const topExHistory = workoutHistory.filter(w => w.exercise === topEx).slice(0, 5);
        let progTitle = t('ai_coach_prog_weight_title');
        let progDesc = t('ai_coach_prog_weight_desc', { exercise: topEx });

        if (topExHistory.length >= 3) {
            const w1 = Number(topExHistory[0]?.maxWeight) || 0;
            const w2 = Number(topExHistory[1]?.maxWeight) || 0;
            const w3 = Number(topExHistory[2]?.maxWeight) || 0;
            if (w1 > 0 && w1 === w2 && w2 === w3) {
                progTitle = t('ai_coach_prog_plateau_title');
                progDesc = t('ai_coach_prog_plateau_desc', { exercise: topEx, weight: w1 });
            }
        }

        const progression = { title: progTitle, desc: progDesc };

        // 3. Akıllı Mikro Hedef
        let dynamicGoal = t('ai_coach_micro_goal_initial');

        if (workoutHistory.length > 0) {
            const lastWorkout = workoutHistory[0];
            const lastWorkoutDate = new Date(lastWorkout.date);
            const daysSinceLastWorkout = Math.floor((new Date() - lastWorkoutDate) / (1000 * 60 * 60 * 24));
            const avgRecentRpe = workoutHistory.slice(0, 5).reduce((a, b) => a + (b.avgRpe || 0), 0) / Math.min(workoutHistory.length, 5);
            const thisWeekWorkouts = workoutHistory.filter(w => {
                const diffTime = Math.abs(new Date() - new Date(w.date));
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            }).length;

            if (daysSinceLastWorkout >= 4) {
                dynamicGoal = t('ai_coach_micro_goal_long_time', { days: daysSinceLastWorkout });
            } else if (avgRecentRpe >= 8.5) {
                dynamicGoal = t('ai_coach_micro_goal_high_rpe', { rpe: avgRecentRpe.toFixed(1) });
            } else if (thisWeekWorkouts >= 15) {
                dynamicGoal = t('ai_coach_micro_goal_high_freq');
            } else if (lastWorkout.totalReps < 15) {
                dynamicGoal = t('ai_coach_micro_goal_low_volume');
            } else {
                dynamicGoal = t('ai_coach_micro_goal_regular', { exercise: topEx });
            }
        }

        return { todaysPlan, progression, microGoal: dynamicGoal };
    }, [workoutHistory, t]);

    const microGoal = localAiCoachData.microGoal;

    return (
        <section className="fade-in" style={{ animationDelay: '0.15s', marginBottom: '2rem' }}>
            <div className="section-header">
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={20} color="var(--accent-primary)" /> {t('ai_coach_title')}
                </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Bugün Ne Yapayım? */}
                <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-primary)', padding: '1.2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} color="var(--accent-primary)" /> 1) {t('ai_coach_what_should_i_do')}
                    </h3>
                    <p style={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>{localAiCoachData.todaysPlan.title}</p>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {localAiCoachData.todaysPlan.desc}
                    </p>
                </div>

                {/* Progression Önerisi */}
                <div className="glass-card" style={{ borderLeft: '4px solid #00c3ff', padding: '1.2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={16} color="#00c3ff" /> 2) {t('ai_coach_progression_label')}
                    </h3>
                    <p style={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>{localAiCoachData.progression.title}</p>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {localAiCoachData.progression.desc}
                    </p>
                </div>

                {/* Motivasyon / Mikro Hedef */}
                <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-warning)', padding: '1.2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Flame size={16} color="var(--accent-warning)" /> 3) {t('ai_coach_micro_goal_label')}
                    </h3>
                    <div style={{ padding: '1rem', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '8px', border: '1px dashed var(--accent-warning)', textAlign: 'center' }}>
                        <p style={{ color: 'var(--accent-warning)', fontWeight: 'bold', fontSize: '1.05rem' }}>
                            "{microGoal}"
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AICoachInsights;
