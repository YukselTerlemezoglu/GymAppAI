import React, { useMemo } from 'react';
import { Users, Swords, Trophy, Dumbbell } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { computeWeekStats } from '../../utils/duel';

// SOSYAL HAFTALIK OZET KARTI: dostlarin bu haftaki antrenman nabzi.
// Arkadas listesi + haftalik skorlari (duello puani) tek bakista.
// Firestore canli aboneligi YOK; profiller parent'tan (FriendsCard ile ayni
// kaynaktan) verilir - ekstra okuma maliyeti sifir.
function SocialWeeklyCard({ friends, myName, workoutHistory }) {
    const { t } = useLanguage();

    const rows = useMemo(() => {
        const my = computeWeekStats(workoutHistory);
        const list = [
            { name: myName, workouts: my.days || 0, volume: my.volume || 0, score: my.days || 0, isMe: true },
            ...(friends || []).map(f => ({
                name: f.name || 'Athlete',
                workouts: f.weekStats?.days || 0,
                volume: f.weekStats?.volume || 0,
                score: f.weekStats?.days || 0,
                isMe: false
            }))
        ];
        list.sort((a, b) => b.score - a.score);
        return list.slice(0, 5);
    }, [friends, myName, workoutHistory]);

    const activeCount = rows.filter(r => r.workouts > 0).length;

    return (
        <div className="glass-card fade-in" style={{ border: '1px solid rgba(168,85,247,0.25)', background: 'linear-gradient(145deg, rgba(0,0,0,0.55), rgba(168,85,247,0.06))' }}>
            <div className="card-header">
                <h3 className="card-title"><Users size={18} color="#c084fc" /> {t('social_week_title')}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                    {activeCount}/{rows.length} {t('social_week_active')}
                </span>
            </div>

            {rows.length <= 1 ? (
                <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', margin: 0, textAlign: 'center', padding: '0.8rem 0' }}>
                    {t('social_week_empty')}
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {rows.map((r, i) => (
                        <div
                            key={r.name + i}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 10px', borderRadius: '10px',
                                background: r.isMe ? 'rgba(0,195,255,0.1)' : 'rgba(255,255,255,0.04)',
                                border: r.isMe ? '1px solid rgba(0,195,255,0.25)' : '1px solid transparent'
                            }}
                        >
                            <span style={{ fontSize: '0.85rem', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                                {i === 0 ? <Trophy size={14} color="#ffd700" /> : i + 1}
                            </span>
                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', color: r.isMe ? '#00c3ff' : 'var(--text-primary)', fontWeight: r.isMe ? 700 : 500 }}>
                                {r.name}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: 'var(--text-light)', flexShrink: 0 }}>
                                <Dumbbell size={12} /> {r.workouts}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: 'var(--text-light)', flexShrink: 0 }}>
                                <Swords size={12} /> {(r.volume / 1000).toFixed(1)}t
                            </span>
                        </div>
                    ))}
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {t('social_week_hint')}
                    </p>
                </div>
            )}
        </div>
    );
}

export default SocialWeeklyCard;
