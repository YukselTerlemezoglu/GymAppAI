import React, { useMemo, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../ui/ToastProvider';
import { ListChecks } from 'lucide-react';
import { dailyTasks, taskContext, evaluateTasks } from '../../utils/dailyQuests';

// GUNLUK GOREVLER KARTI (Faz 5b).
// Her gun (kullaniciya ozel seed'le) 3 gorev: kolay/orta/zor.
// Antrenman kaydedilince otomatik tamamlanir; odul "Tahsil Et" ile alinir.
// questsData: { day: 'YYYY-MM-DD', claimed: [taskId, ...] }

function DailyQuestsCard({ workoutHistory, userName, userCoins, setUserCoins, userXP, setUserXP, questsData, setQuestsData }) {
    const { t } = useTranslation();
    const { toast, haptic } = useToast();
    const todayKey = new Date().toISOString().split('T')[0];

    // Gunun gorevleri (deterministik)
    const tasks = useMemo(() => dailyTasks({ userName }), [userName]);

    // Bugunun baglami (gercek veriden)
    const ctx = useMemo(() => taskContext(workoutHistory), [workoutHistory]);

    // Gorev degerlendirmesi
    const evaluated = useMemo(() => evaluateTasks(tasks, ctx), [tasks, ctx]);

    const claimed = questsData?.day === todayKey ? (questsData.claimed || []) : [];

    // Gun degisince claim kaydini sifirla
    useEffect(() => {
        if (questsData && questsData.day !== todayKey) {
            setQuestsData({ day: todayKey, claimed: [] });
        } else if (!questsData) {
            setQuestsData({ day: todayKey, claimed: [] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [todayKey]);

    const claim = (taskId, reward) => {
        if (claimed.includes(taskId)) return;
        haptic([15, 30, 15]);
        setUserCoins(userCoins + reward.coins);
        setUserXP(userXP + reward.xp);
        setQuestsData({ day: todayKey, claimed: [...claimed, taskId] });
        toast.success(`🎁 ${t('quest_claimed', { coins: reward.coins, xp: reward.xp })}`);
    };

    const taskLabel = (id) => {
        switch (id) {
            case 'workout_any': return t('quest_workout_any');
            case 'sets_12': return t('quest_sets_12');
            case 'volume_3000': return t('quest_volume_3000');
            case 'legs_today': return t('quest_legs_today');
            case 'rpe_push': return t('quest_rpe_push');
            case 'new_exercise': return t('quest_new_exercise');
            case 'volume_pr': return t('quest_volume_pr');
            default: return id;
        }
    };

    const doneCount = evaluated.filter(e => e.done).length;

    return (
        <div className="glass-card slide-in" style={{ border: '1px solid rgba(0, 255, 136, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                    <ListChecks size={18} color="#00ff88" /> {t('quests_title')}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{doneCount}/3</span>
            </div>

            {evaluated.map(e => {
                const isClaimed = claimed.includes(e.id);
                return (
                    <div key={e.id} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '0.55rem 0.7rem', borderRadius: '10px', marginBottom: '6px',
                        background: isClaimed ? 'rgba(0,255,136,0.07)' : e.done ? 'rgba(0,195,255,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isClaimed ? 'rgba(0,255,136,0.3)' : e.done ? 'rgba(0,195,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                        opacity: isClaimed ? 0.65 : 1
                    }}>
                        {/* Durum ikonu */}
                        <span style={{ fontSize: '0.95rem', width: '22px', textAlign: 'center' }}>
                            {isClaimed ? '✅' : e.done ? '🎯' : '⭕'}
                        </span>

                        {/* Gorev metni */}
                        <span style={{ flex: 1, color: '#fff', fontSize: '0.84rem' }}>
                            {taskLabel(e.id)}
                        </span>

                        {/* Odul / tahsil butonu */}
                        {isClaimed ? (
                            <span style={{ fontSize: '0.72rem', color: '#00ff88', fontWeight: 700 }}>+{e.reward.coins}🪙</span>
                        ) : e.done ? (
                            <button
                                onClick={() => claim(e.id, e.reward)}
                                style={{
                                    background: 'linear-gradient(90deg, #00c3ff, #00ff88)', border: 'none',
                                    borderRadius: '8px', padding: '4px 12px', cursor: 'pointer',
                                    color: '#001a26', fontWeight: 800, fontSize: '0.75rem'
                                }}
                            >
                                {t('quest_claim_btn')}
                            </button>
                        ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>+{e.reward.coins}🪙 +{e.reward.xp}XP</span>
                        )}
                    </div>
                );
            })}

            <p style={{ color: 'var(--text-light)', fontSize: '0.68rem', margin: '0.4rem 0 0 0', textAlign: 'center' }}>
                {t('quests_reset_hint')}
            </p>
        </div>
    );
}

export default DailyQuestsCard;
