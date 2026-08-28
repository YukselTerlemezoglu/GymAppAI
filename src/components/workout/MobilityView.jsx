import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { ArrowLeft, Play, Pause, Square, PersonStanding, ChevronRight, ChevronLeft, Repeat } from 'lucide-react';
import { FLOWS, buildSteps, flowDuration, currentStep } from '../../utils/mobility';
import { speak, stopSpeaking, isVoiceCoachEnabled } from '../../utils/voiceCoach';
import { playSound } from '../../utils/sounds';
import { haptic } from '../ui/ToastProvider';

const FLOW_COLOR = {
    warmup:   '#ffa502',
    cooldown: '#00c3ff',
    fullBody: '#2ed573',
    lowerBody:'#ff6b81',
    upperBody:'#b794ff'
};

function MobilityView({ onBack }) {
    const { t, lang } = useTranslation();

    const [flowId, setFlowId] = useState(() => localStorage.getItem('gym_app_mobility_flow') || 'warmup');
    const [phase, setPhase] = useState('setup'); // setup | running | done
    const [elapsed, setElapsed] = useState(0);
    const [running, setRunning] = useState(false);
    const lastStepRef = useRef(-1);

    const steps = useMemo(() => buildSteps(flowId), [flowId]);
    const totalSec = useMemo(() => flowDuration(flowId), [flowId]);
    const cur = useMemo(() => currentStep(steps, elapsed), [steps, elapsed]);

    useEffect(() => {
        localStorage.setItem('gym_app_mobility_flow', flowId);
    }, [flowId]);

    // Gorev baglami: bugunun mobilite isareti (dailyQuests taskContext okur)
    useEffect(() => {
        if (phase !== 'done') return;
        try {
            const dayKey = new Date().toISOString().split('T')[0];
            const raw = JSON.parse(localStorage.getItem('gym_app_activity_marks') || 'null');
            if (!raw || raw.day !== dayKey || !raw.marks?.mobility) {
                localStorage.setItem('gym_app_activity_marks', JSON.stringify({ day: dayKey, marks: { ...(raw?.day === dayKey ? raw.marks : {}), mobility: true } }));
            }
        } catch { /* yoksay */ }
    }, [phase]);

    // Saat + bitis (setState yalnizca interval callback icinde)
    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => {
            setElapsed(prev => {
                const next = prev + 1;
                if (next >= totalSec) {
                    clearInterval(id);
                    setRunning(false);
                    setPhase('done');
                    playSound('pr');
                    haptic([40, 60, 40, 60, 80]);
                    if (isVoiceCoachEnabled()) {
                        speak(lang === 'tr' ? 'Mobilite akışı tamamlandı.' : 'Mobility flow complete.', lang === 'tr' ? 'tr-TR' : 'en-US');
                    }
                }
                return Math.min(next, totalSec);
            });
        }, 1000);
        return () => clearInterval(id);
    }, [running, totalSec, lang]);

    // Adim gecisleri: ses + titreme + anons
    useEffect(() => {
        if (!running || !cur) return;
        if (cur.step !== lastStepRef.current) {
            lastStepRef.current = cur.step;
            playSound('coin');
            haptic([25, 40, 25]);
            if (isVoiceCoachEnabled()) {
                const name = t(`mob_pose_${cur.poseId}`);
                const sideTxt = cur.side === 'L' ? (lang === 'tr' ? 'sol' : 'left') : cur.side === 'R' ? (lang === 'tr' ? 'sağ' : 'right') : null;
                speak(sideTxt ? `${name} — ${sideTxt}` : name, lang === 'tr' ? 'tr-TR' : 'en-US');
            }
        }
        // Adim icinde son 3 saniye
        if (cur.secondsLeft === 3 && isVoiceCoachEnabled()) {
            speak(lang === 'tr' ? 'Üç, iki, bir' : 'Three, two, one', lang === 'tr' ? 'tr-TR' : 'en-US');
        }
    }, [cur, running, t, lang]);

    const start = () => {
        playSound('click');
        lastStepRef.current = -1;
        setPhase('running');
        setRunning(true);
    };

    const finishEarly = () => {
        stopSpeaking();
        setRunning(false);
        setPhase('done');
    };

    const restart = () => {
        stopSpeaking();
        lastStepRef.current = -1;
        setElapsed(0);
        setPhase('setup');
        setRunning(false);
    };

    // Adim atlama (ilerlet/geri al) — duraklatilmisken adimlar arasi gezinme
    const jumpToStep = (target) => {
        if (!steps.length) return;
        const clamped = Math.max(0, Math.min(steps.length - 1, target));
        let acc = 0;
        for (let i = 0; i < clamped; i++) acc += steps[i].seconds;
        setElapsed(acc);
        lastStepRef.current = -2; // adim degisim anonsunu tetikle
    };

    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const color = FLOW_COLOR[flowId] || '#ffa502';

    // =========================================================
    // SETUP EKRANI
    // =========================================================
    if (phase === 'setup') {
        return (
            <div className="app-container slide-in">
                <header className="top-bar fade-in" style={{ animationDelay: '0s', flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    <button className="back-btn" onClick={onBack} style={{ marginBottom: '1rem' }}>
                        <ArrowLeft size={20} /> {t('btn_back')}
                    </button>
                    <div>
                        <h2 style={{ color, display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
                            <PersonStanding size={28} /> {t('mob_title')}
                        </h2>
                        <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}>{t('mob_subtitle')}</p>
                    </div>
                </header>

                <div className="workout-tracker-list fade-in" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingTop: '1.5rem', paddingBottom: '3rem' }}>
                    <div className="glass-card slide-in">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: '#fff' }}>
                            <Repeat size={20} color={color} /> {t('mob_pick_flow')}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                            {Object.values(FLOWS).map(f => {
                                const active = flowId === f.id;
                                const c = FLOW_COLOR[f.id] || '#ffa502';
                                const stps = buildSteps(f.id);
                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => setFlowId(f.id)}
                                        style={{
                                            padding: '12px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                                            background: active ? `${c}22` : 'rgba(255,255,255,0.04)',
                                            border: active ? `1px solid ${c}` : '1px solid rgba(255,255,255,0.08)',
                                            color: active ? c : '#fff', transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{t(`mob_flow_${f.id}`)}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '4px' }}>
                                            {stps.length} {t('mob_steps')} • {fmt(stps.reduce((s, x) => s + x.seconds, 0))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Poz listesi onizleme */}
                    <div className="glass-card slide-in">
                        <h3 style={{ marginTop: 0, color: '#fff', fontSize: '1rem' }}>{t(`mob_flow_${flowId}`)} — {t('mob_flow_list')}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {steps.map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 12px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#fff' }}>
                                        <span style={{ color: 'var(--text-light)', width: '18px', fontSize: '0.75rem' }}>{i + 1}</span>
                                        {t(`mob_pose_${s.poseId}`)}
                                        {s.side !== '-' && (
                                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color, background: `${color}22`, borderRadius: '5px', padding: '1px 6px' }}>
                                                {s.side === 'L' ? (lang === 'tr' ? 'SOL' : 'LEFT') : (lang === 'tr' ? 'SAĞ' : 'RIGHT')}
                                            </span>
                                        )}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{s.seconds}s</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={start} className="neon-btn" style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', fontWeight: 800, background: `${color}22`, borderColor: color, color }}>
                        <Play size={22} /> {t('mob_start')}
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================
    // RUNNING / DONE
    // =========================================================
    const pct = totalSec > 0 ? Math.min(100, (elapsed / totalSec) * 100) : 0;
    const stepPct = cur && cur.seconds > 0 ? ((cur.seconds - cur.secondsLeft) / cur.seconds) * 100 : 0;
    const sideLabel = cur && cur.side === 'L' ? (lang === 'tr' ? 'SOL TARAF' : 'LEFT SIDE') : cur && cur.side === 'R' ? (lang === 'tr' ? 'SAĞ TARAF' : 'RIGHT SIDE') : null;

    return (
        <div className="app-container slide-in" style={{ maxWidth: '720px' }}>
            <header className="top-bar fade-in" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
                <button className="back-btn" onClick={restart} style={{ color: 'var(--text-light)' }}>
                    <ArrowLeft size={20} /> {t('mob_back_setup')}
                </button>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', paddingTop: '2rem', paddingBottom: '3rem' }}>

                {phase === 'done' ? (
                    <>
                        <div style={{ fontSize: '4rem' }}>🧘</div>
                        <h2 style={{ margin: 0, color }}>{t('mob_done_title')}</h2>
                        <div style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
                            {t('mob_done_stats', { steps: steps.length, time: fmt(Math.min(elapsed, totalSec)) })}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button onClick={restart} className="neon-btn" style={{ padding: '0.8rem 1.5rem', width: 'auto' }}>
                                <Repeat size={18} /> {t('mob_again')}
                            </button>
                            <button onClick={onBack} className="neon-btn" style={{ padding: '0.8rem 1.5rem', width: 'auto', background: 'rgba(255,255,255,0.05)' }}>
                                {t('btn_back')}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Poz sayaci */}
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                            {t('mob_step_n', { cur: (cur?.step ?? 0) + 1, total: steps.length })}
                        </div>

                        {/* Ana poz karti */}
                        <div style={{
                            width: 'min(88vw, 420px)', borderRadius: '20px', padding: '2rem 1.5rem', textAlign: 'center',
                            background: `linear-gradient(160deg, ${color}1a, rgba(10,10,15,0.9))`,
                            border: `1px solid ${color}55`,
                            boxShadow: `0 0 50px ${color}22`
                        }}>
                            <div style={{ fontSize: '2.6rem', marginBottom: '0.5rem' }}>🧘</div>
                            <h3 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1.5rem' }}>
                                {t(`mob_pose_${cur?.poseId || 'childPose'}`)}
                            </h3>
                            {sideLabel && (
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color, marginBottom: '10px' }}>{sideLabel}</div>
                            )}
                            <div style={{ fontSize: '3.6rem', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                                {cur?.secondsLeft ?? 0}
                            </div>
                            {/* Poz ici ilerleme */}
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginTop: '14px' }}>
                                <div style={{ height: '100%', width: `${stepPct}%`, background: color, borderRadius: '4px', transition: 'width 1s linear' }} />
                            </div>
                        </div>

                        {/* Adim atlama */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => jumpToStep((cur?.step ?? 0) - 1)} className="neon-btn" style={{ width: 'auto', padding: '0.6rem 1rem' }}>
                                <ChevronLeft size={18} />
                            </button>
                            {running ? (
                                <button onClick={() => setRunning(false)} className="neon-btn" style={{ width: 'auto', padding: '0.6rem 1.4rem' }}>
                                    <Pause size={18} /> {t('mob_pause')}
                                </button>
                            ) : (
                                <button onClick={() => setRunning(true)} className="neon-btn" style={{ width: 'auto', padding: '0.6rem 1.4rem', background: 'rgba(46,213,115,0.15)', borderColor: '#2ed573', color: '#2ed573' }}>
                                    <Play size={18} /> {t('mob_resume')}
                                </button>
                            )}
                            <button onClick={() => jumpToStep((cur?.step ?? 0) + 1)} className="neon-btn" style={{ width: 'auto', padding: '0.6rem 1rem' }}>
                                <ChevronRight size={18} />
                            </button>
                            <button onClick={finishEarly} className="neon-btn" style={{ width: 'auto', padding: '0.6rem 1rem', background: 'rgba(255,71,87,0.12)', borderColor: '#ff4757', color: '#ff4757' }}>
                                <Square size={16} />
                            </button>
                        </div>

                        {/* Genel ilerleme */}
                        <div style={{ width: 'min(88vw, 420px)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '4px' }}>
                                <span>{fmt(elapsed)}</span>
                                <span>−{fmt(Math.max(0, totalSec - elapsed))}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, #fff8)`, borderRadius: '4px', transition: 'width 1s linear' }} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default MobilityView;
