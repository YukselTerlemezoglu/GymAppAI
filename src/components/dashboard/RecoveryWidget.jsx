import React, { useMemo } from 'react';
import { Moon, Battery, BatteryMedium, BatteryLow } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { haptic } from '../ui/ToastProvider';
import useLocalStorage from '../../hooks/useLocalStorage';

const dateKey = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Uyku + form girisi ve toparlanma skoru widget'i.
// Skor: son 3 gun uyku ortalamasi (6-9 saat ideal) ve form notu (1-5).
// Antrenman yuku bilgi olarak gosterilir; skor dusukse "hafif geçir" onerisi.
function RecoveryWidget({ workoutHistory }) {
    const { t, lang } = useTranslation();
    const [logs, setLogs] = useLocalStorage('gym_app_sleep_logs', {});

    const today = dateKey();
    const todayLog = logs[today] || null;

    // Son 3 gunun uyku ortalamasi
    const sleepAvg = useMemo(() => {
        const vals = [];
        for (let i = 0; i < 3; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const h = logs[dateKey(d)]?.hours;
            if (typeof h === 'number' && h > 0) vals.push(h);
        }
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    }, [logs]);

    // Bugunku antrenman var mi (hafif onerisi icin)
    const todayWorkoutCount = useMemo(() => {
        if (!workoutHistory || workoutHistory.length === 0) return 0;
        return workoutHistory.filter(w => {
            const d = new Date(w.date);
            return !isNaN(d.getTime()) && dateKey(d) === today;
        }).length;
    }, [workoutHistory, today]);

    // Toparlanma skoru 0-100
    const score = useMemo(() => {
        if (!sleepAvg) return null;
        let s = 50;
        // Uyku katkisi: 7.5 saat merkezli, 6-9 arasi iyi
        if (sleepAvg >= 7 && sleepAvg <= 9) s += 30;
        else if (sleepAvg >= 6 && sleepAvg < 7) s += 15;
        else if (sleepAvg > 9) s += 5;
        else s -= 10; // 6 saatten az
        // Form notu katkisi (1-5)
        if (todayLog?.mood) s += (todayLog.mood - 3) * 10;
        return Math.max(0, Math.min(100, Math.round(s)));
    }, [sleepAvg, todayLog]);

    const saveLog = (hours, mood) => {
        haptic(8);
        setLogs({ ...logs, [today]: { hours, mood, at: new Date().toISOString() } });
    };

    // Skor durumuna gore ikon + renk + mesaj
    const state = (() => {
        if (score === null) return { icon: <Moon size={22} color="#a29bfe" />, color: 'var(--text-light)', msg: t('rec_log_prompt') };
        if (score >= 75) return { icon: <Battery size={26} color="#2ed573" />, color: '#2ed573', msg: t('rec_state_good') };
        if (score >= 50) return { icon: <BatteryMedium size={26} color="#ffa502" />, color: '#ffa502', msg: t('rec_state_ok') };
        return { icon: <BatteryLow size={26} color="#ff4757" />, color: '#ff4757', msg: t('rec_state_bad') };
    })();

    const SleepOption = ({ h }) => (
        <button
            onClick={() => saveLog(h, todayLog?.mood || 3)}
            style={{
                padding: '6px 0', flex: 1, borderRadius: '8px', cursor: 'pointer',
                border: `1px solid ${todayLog?.hours === h ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)'}`,
                background: todayLog?.hours === h ? 'rgba(0,195,255,0.15)' : 'transparent',
                color: todayLog?.hours === h ? 'var(--accent-primary)' : 'var(--text-light)',
                fontWeight: todayLog?.hours === h ? 'bold' : 400, fontSize: '0.8rem'
            }}
        >{h}s</button>
    );

    const MoodOption = ({ m, emoji }) => (
        <button
            onClick={() => saveLog(todayLog?.hours || 7.5, m)}
            style={{
                padding: '6px 0', flex: 1, borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem',
                border: `1px solid ${todayLog?.mood === m ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)'}`,
                background: todayLog?.mood === m ? 'rgba(0,195,255,0.15)' : 'transparent'
            }}
        >{emoji}</button>
    );

    return (
        <div className="glass-card slide-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                    {state.icon} {t('rec_title')}
                </h3>
                {score !== null && (
                    <span style={{ fontWeight: 'bold', fontSize: '1rem', color: state.color }}>{score}</span>
                )}
            </div>

            {/* Skor mesaji */}
            <p style={{ color: state.color, fontSize: '0.8rem', margin: '0 0 0.7rem 0' }}>
                {state.msg}
                {score !== null && score < 50 && todayWorkoutCount === 0 && ` ${t('rec_light_day_suggest')}`}
            </p>

            {/* Skor barı */}
            {score !== null && (
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.7rem' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: state.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
            )}

            {/* Hizli uyku girisi */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                {[5, 6, 7, 8, 9].map(h => <SleepOption key={h} h={h} />)}
            </div>

            {/* Form notu */}
            <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map(m => (
                    <MoodOption key={m} m={m} emoji={['😫', '😕', '😐', '🙂', '😄'][m - 1]} />
                ))}
            </div>

            {/* Uyku ortalamasi detay */}
            {sleepAvg !== null && (
                <p style={{ color: 'var(--text-light)', fontSize: '0.7rem', margin: '8px 0 0 0', textAlign: 'center', opacity: 0.7 }}>
                    {t('rec_avg_sleep')}: {sleepAvg.toFixed(1)}s
                    {todayLog && ` · ${new Date(todayLog.at).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
            )}
        </div>
    );
}

export default RecoveryWidget;
