import React, { useMemo, useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../ui/ToastProvider';
import { ListChecks, Target } from 'lucide-react';
import { dailyTasks, taskContext, evaluateTasks } from '../../utils/dailyQuests';
import { canStartChain, applyChainResult, donNet } from '../../utils/don';
import DonModal from './DonModal';

// GUNLUK GOREVLER KARTI v2 (DoN ekonomisi).
// Kural motoru 3 oneri sunar (kolay/orta/zor); kullanici 1'ini secer.
// Secim tahsile kadar degistirilebilir. Tahsil -> DonModal (escrow pot).
// questsData: { day, claimed: [taskId], selected: taskId|null }

const TIER_COLOR = { easy: '#00ff88', medium: '#00c3ff', hard: '#ff6b81' };

function DailyQuestsCard({ workoutHistory, userName, userCoins, setUserCoins, userXP, setUserXP, questsData, setQuestsData, donData, setDonData, marks }) {
    const { t } = useTranslation();
    const { toast, haptic } = useToast();
    const todayKey = new Date().toISOString().split('T')[0];
    const [donOpen, setDonOpen] = useState(null); // { baseCoins, rewardXp }

    const tasks = useMemo(() => dailyTasks({ userName, workoutHistory }), [userName, workoutHistory]);
    const ctx = useMemo(() => taskContext(workoutHistory, marks || {}), [workoutHistory, marks]);
    const evaluated = useMemo(() => evaluateTasks(tasks, ctx), [tasks, ctx]);

    const sameDay = questsData?.day === todayKey;
    const claimed = sameDay ? (questsData.claimed || []) : [];
    const selected = sameDay ? (questsData.selected || null) : null;
    const allClaimed = claimed.length > 0;

    // Gun degisince kaydi sifirla
    useEffect(() => {
        if (!questsData || questsData.day !== todayKey) {
            setQuestsData({ day: todayKey, claimed: [], selected: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [todayKey]);

    const select = (taskId) => {
        if (allClaimed) return;
        haptic(10);
        setQuestsData({ day: todayKey, claimed: [], selected: taskId });
    };

    // Tahsil: XP aninda, coin -> escrow (DonModal)
    const claim = (task) => {
        if (claimed.includes(task.id) || selected !== task.id) return;
        haptic([15, 30, 15]);
        setUserXP(userXP + task.reward.xp);
        setQuestsData({ day: todayKey, claimed: [task.id], selected: task.id });
        if (canStartChain(donData, todayKey)) {
            setDonOpen({ baseCoins: task.reward.coins });
        } else {
            // Gunluk DoN hakki yoksa dogrudan guvenli odule don
            setUserCoins(userCoins + task.reward.coins);
            toast.success(`🎁 ${t('quest_claimed', { coins: task.reward.coins, xp: task.reward.xp })}`);
        }
    };

    // DoN sonucu: banked coin cuzdana, kayip notr mesaj
    const handleDonFinish = (res) => {
        const next = applyChainResult(donData, res, todayKey);
        setDonData(next);
        if (res.banked > 0) {
            setUserCoins(userCoins + res.banked);
            toast.success(`💰 ${t('don_banked_toast', { coins: res.banked })}`);
        } else if (res.lost > 0) {
            toast.info(`🎲 ${t('don_lost_toast')}`);
        } else {
            setUserCoins(userCoins + res.banked);
        }
        setDonOpen(null);
    };

    const taskLabel = (id) => {
        switch (id) {
            case 'workout_any': return t('quest_workout_any');
            case 'mobility_complete': return t('quest_mobility_complete');
            case 'sets_personal': return t('quest_sets_personal', { n: ctx.personal.setTarget });
            case 'volume_personal': return t('quest_volume_personal', { n: ctx.personal.volumeTarget });
            case 'new_exercise': return t('quest_new_exercise');
            case 'rpe_push': return t('quest_rpe_push');
            case 'hiit_complete': return t('quest_hiit_complete');
            case 'legs_today': return t('quest_legs_today', { n: ctx.personal.legsTarget });
            case 'volume_pr': return t('quest_volume_pr');
            case 'volume_plus20': return t('quest_volume_plus20', { n: ctx.personal.volumeTarget });
            default: return id;
        }
    };

    const tierLabel = (tier) => tier === 'easy' ? t('quest_tier_easy') : tier === 'medium' ? t('quest_tier_medium') : t('quest_tier_hard');
    const stats = donData?.stats;

    return (
        <div className="glass-card slide-in" style={{ border: '1px solid rgba(0, 255, 136, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                    <ListChecks size={18} color="#00ff88" /> {t('quests_title')}
                </h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                    {allClaimed ? t('quests_done_today') : t('quests_pick_one')}
                </span>
            </div>

            {/* 3 oneri karti */}
            {evaluated.map(e => {
                const isClaimed = claimed.includes(e.id);
                const isSelected = selected === e.id;
                const c = TIER_COLOR[e.tier];
                const canSelect = !allClaimed;
                const pct = Math.round((e.progress || 0) * 100);
                return (
                    <div
                        key={e.id}
                        onClick={canSelect ? () => select(e.id) : undefined}
                        style={{
                            display: 'flex', flexDirection: 'column', gap: '4px',
                            padding: '0.55rem 0.7rem', borderRadius: '10px', marginBottom: '6px', cursor: canSelect ? 'pointer' : 'default',
                            background: isClaimed ? 'rgba(0,255,136,0.07)' : isSelected ? `${c}18` : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isClaimed ? 'rgba(0,255,136,0.3)' : isSelected ? c : 'rgba(255,255,255,0.07)'}`,
                            opacity: isClaimed || (selected && !isSelected) ? 0.55 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.95rem', width: '22px', textAlign: 'center' }}>
                                {isClaimed ? '✅' : isSelected ? <Target size={16} color={c} /> : e.done ? '🎯' : '⭕'}
                            </span>
                            <span style={{ flex: 1, color: '#fff', fontSize: '0.82rem' }}>
                                {taskLabel(e.id)}
                            </span>
                            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: c, background: `${c}15`, borderRadius: '5px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                {tierLabel(e.tier)}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700 }}>
                                +{e.reward.coins}🪙
                            </span>
                        </div>

                        {/* Secili gorevde canli progress */}
                        {isSelected && !isClaimed && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '30px' }}>
                                <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                </div>
                                <span style={{ fontSize: '0.62rem', color: 'var(--text-light)', minWidth: '30px', textAlign: 'right' }}>{pct}%</span>
                                {e.done && !isClaimed && (
                                    <button
                                        onClick={(ev) => { ev.stopPropagation(); claim(e); }}
                                        style={{
                                            background: 'linear-gradient(90deg, #00c3ff, #00ff88)', border: 'none',
                                            borderRadius: '8px', padding: '4px 12px', cursor: 'pointer',
                                            color: '#001a26', fontWeight: 800, fontSize: '0.72rem'
                                        }}
                                    >
                                        {t('quest_claim_btn')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* DoN istatistik satiri */}
            {stats && (stats.flips > 0) && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.65rem', color: 'var(--text-light)', marginTop: '4px' }}>
                    <span>🔥 {t('don_stat_chain')}: {stats.longestChain}</span>
                    <span>💰 {t('don_stat_bank')}: {stats.biggestBank}🪙</span>
                    <span style={{ color: donNet(stats) >= 0 ? '#00ff88' : '#ff6b81' }}>
                        📊 {t('don_stat_net')}: {donNet(stats) >= 0 ? '+' : ''}{donNet(stats)}🪙
                    </span>
                </div>
            )}

            <p style={{ color: 'var(--text-light)', fontSize: '0.68rem', margin: '0.4rem 0 0 0', textAlign: 'center' }}>
                {t('quests_reset_hint')}
            </p>

            {/* Double or Nothing modalı */}
            {donOpen && (
                <DonModal
                    baseCoins={donOpen.baseCoins}
                    donData={donData}
                    dayKey={todayKey}
                    onFinish={handleDonFinish}
                    onClose={() => setDonOpen(null)}
                />
            )}
        </div>
    );
}

export default DailyQuestsCard;
