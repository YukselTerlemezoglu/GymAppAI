import React, { useMemo } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Trophy, CalendarCheck } from 'lucide-react';

function ScoreTracker({ workoutHistory, streak, weeklyGoal = 3, weeksThisWeek = 0, flameColor = '#ffa502' }) {
    const { t } = useTranslation();
    const { volumeScore, prScore, streakScore, totalScore } = useMemo(() => {
        if (!workoutHistory || workoutHistory.length === 0) return { volumeScore: 0, prScore: 0, streakScore: 0, totalScore: 0 };

        // 1. Volume Score (Max 60 points) - based on 4-week average weekly volume
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        let last4WeeksVolume = 0;
        workoutHistory.forEach(w => {
            if (new Date(w.date) >= fourWeeksAgo) {
                last4WeeksVolume += Number(w.totalWeight) || (Number(w.maxWeight || 0) * Number(w.bestReps || 0) * Number(w.sets || 0)) || 0;
            }
        });

        const weeklyAvgVolume = last4WeeksVolume / 4;
        let vScore = Math.min((weeklyAvgVolume / 10000) * 60, 60);

        // 2. PR Score (Max 25 points) - based on improving 1RM records in the last 4 weeks
        let newPRsCount = 0;
        const exerciseRecordsMap = {};

        [...workoutHistory].reverse().forEach(w => {
            const e1RM = Math.round((w.maxWeight || 0) * (1 + ((w.bestReps || 0) / 30)));
            if (e1RM > 0) {
                if (!exerciseRecordsMap[w.exercise]) {
                    exerciseRecordsMap[w.exercise] = e1RM;
                } else if (e1RM > exerciseRecordsMap[w.exercise] && new Date(w.date) >= fourWeeksAgo) {
                    newPRsCount += 1;
                    exerciseRecordsMap[w.exercise] = e1RM;
                }
            }
        });

        let pScore = Math.min((newPRsCount / 5) * 25, 25);

        // 3. Consistency Score (Max 15 points) - haftalik seri (dinlenme gunleri seriyi bozmaz)
        let sScore = Math.min((streak / 4) * 15, 15);

        const total = Math.round(vScore + pScore + sScore) || 0;

        return {
            volumeScore: isNaN(vScore) ? 0 : Math.round(vScore),
            prScore: isNaN(pScore) ? 0 : Math.round(pScore),
            streakScore: isNaN(sScore) ? 0 : Math.round(sScore),
            totalScore: isNaN(total) ? 0 : total
        };
    }, [workoutHistory, streak]);

    // Bu haftanin ilerlemesi: hedefe kac gun kaldi / tamamlandi mi
    const weekDone = weeksThisWeek >= weeklyGoal;
    const weekPct = Math.min(100, Math.round((weeksThisWeek / weeklyGoal) * 100));
    const multActive = streak >= 2;

    return (
        <div className="stats-grid fade-in" style={{ animationDelay: '0.1s', gridTemplateColumns: '1fr' }}>
            <div className="glass-card stat-card" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', width: '100%', marginBottom: '1.5rem', position: 'relative' }}>

                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-primary)', textShadow: '0 0 20px rgba(0,255,136,0.6)' }}>
                            {totalScore}
                        </span>
                        <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', marginLeft: '4px' }}>/100</span>
                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.2rem', letterSpacing: '1px' }}>{t('score_gym_puan').toUpperCase()}</div>
                    </div>
                    {totalScore >= 80 && <Trophy size={48} color="var(--accent-warning)" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))' }} />}

                    {multActive && (
                        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255, 165, 0, 0.2)', border: '1px solid #ffa502', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', color: '#ffa502', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            🔥 {streak >= 4 ? '1.5x' : '1.2x'} {t('score_multiplier_active')}
                        </div>
                    )}
                </div>

                {/* Bu haftanin hedefi: 7 gunluk nokta seridi (dinlenme gunleri serbest) */}
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.25)', padding: '0.7rem 0.9rem', borderRadius: '10px', marginBottom: '1rem' }}>
                    <CalendarCheck size={18} color={weekDone ? '#00ff88' : '#ffa502'} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-light)' }}>
                                {t('score_week_progress', { done: weeksThisWeek, goal: weeklyGoal })}
                            </span>
                            <span style={{ color: weekDone ? '#00ff88' : '#ffa502', fontWeight: 'bold' }}>
                                {weekDone ? `✓ ${t('score_week_done')}` : `${weekPct}%`}
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${weekPct}%`, height: '100%', background: weekDone ? 'linear-gradient(90deg, #00c3ff, #00ff88)' : 'linear-gradient(90deg, #ffa502, #ff6348)', transition: 'width 0.6s ease' }} />
                        </div>
                    </div>
                    {streak > 0 && (
                        <div style={{ textAlign: 'center', flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: flameColor, filter: `drop-shadow(0 0 6px ${flameColor})` }}>🔥{streak}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-light)' }}>{t('score_week_streak_unit')}</div>
                        </div>
                    )}
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {/* Volume Score Progress */}
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-light)' }}>{t('score_volume')} <span style={{ opacity: 0.5 }}>(Volume)</span></span>
                            <span style={{ fontWeight: 'bold', color: '#fff' }}>{volumeScore}/60</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(volumeScore / 60) * 100}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 1s ease' }}></div>
                        </div>
                    </div>

                    {/* PR Score Progress */}
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-light)' }}>{t('score_strength')} <span style={{ opacity: 0.5 }}>(PRs)</span></span>
                            <span style={{ fontWeight: 'bold', color: '#fff' }}>{prScore}/25</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(prScore / 25) * 100}%`, height: '100%', background: '#00c3ff', transition: 'width 1s ease' }}></div>
                        </div>
                    </div>

                    {/* Consistency Score Progress - haftalik seri */}
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-light)' }}>{t('score_consistency')} <span style={{ opacity: 0.5 }}>({t('score_weeks_count', { count: streak })})</span></span>
                            <span style={{ fontWeight: 'bold', color: '#fff' }}>{streakScore}/15</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(streakScore / 15) * 100}%`, height: '100%', background: 'var(--accent-warning)', transition: 'width 1s ease' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScoreTracker;
