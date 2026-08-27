import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { ArrowLeft, Play, Pause, Square, Timer, Flame, Zap, Settings2 } from 'lucide-react';
import { HIIT_PROTOCOLS, buildIntervals, totalDuration, currentSegment, estimateCalories, protocolSummary } from '../../utils/hiit';
import { speak, stopSpeaking, isVoiceCoachEnabled } from '../../utils/voiceCoach';
import { playSound } from '../../utils/sounds';
import { haptic } from '../ui/ToastProvider';

// Renk paleti: work = enerji (turuncu/kirmizi), rest = sakin (mavi), recovery = yesil
const SEG_STYLE = {
    work:     { color: '#ff6b3d', bg: 'rgba(255,107,61,0.12)',  ring: 'rgba(255,107,61,0.35)' },
    rest:     { color: '#00c3ff', bg: 'rgba(0,195,255,0.10)',   ring: 'rgba(0,195,255,0.30)' },
    recovery: { color: '#2ed573', bg: 'rgba(46,213,115,0.10)',  ring: 'rgba(46,213,115,0.30)' }
};

function HiitTimerView({ onBack }) {
    const { t, lang } = useTranslation();

    // ---- Kurulum (setup) asamasi ----
    const [protoId, setProtoId] = useState(() => localStorage.getItem('gym_app_hiit_proto') || 'tabata');
    const [customWork, setCustomWork] = useState(40);
    const [customRest, setCustomRest] = useState(20);
    const [customRounds, setCustomRounds] = useState(8);
    const [weightKg, setWeightKg] = useState(() => {
        const v = parseFloat(localStorage.getItem('gym_app_hiit_weight'));
        return isNaN(v) ? 70 : v;
    });

    // ---- Kosma (running) asamasi ----
    const [phase, setPhase] = useState('setup'); // setup | running | done
    const [elapsed, setElapsed] = useState(0);
    const [running, setRunning] = useState(false);
    const lastSegIndexRef = useRef(-1);

    const protocol = useMemo(() => {
        if (protoId === 'custom') {
            return { id: 'custom', work: customWork, rest: customRest, rounds: customRounds, recovery: 0 };
        }
        return HIIT_PROTOCOLS[protoId] || HIIT_PROTOCOLS.tabata;
    }, [protoId, customWork, customRest, customRounds]);

    const intervals = useMemo(() => buildIntervals(protocol), [protocol]);
    const totalSec = useMemo(() => totalDuration(intervals), [intervals]);
    const seg = useMemo(() => currentSegment(intervals, elapsed), [intervals, elapsed]);

    // Setup'da secilen protokol/agirlik kalici olsun
    useEffect(() => {
        localStorage.setItem('gym_app_hiit_proto', protoId);
        localStorage.setItem('gym_app_hiit_weight', String(weightKg));
    }, [protoId, weightKg]);

    // Ana saat + bitis kontrolu: setState yalnizca interval callback'inde
    // cagrilir (set-state-in-effect kaskadini onler). Son tick'te elapsed
    // toplam sureye ulasir; o anda ses/titreme/anons tetiklenir ve faz
    // 'done' olur. Bitirme yardimcisi effect disinda tanimlanir.
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
                        speak(lang === 'tr' ? 'Antrenman tamamlandı. Harika iş!' : 'Workout complete. Great job!', lang === 'tr' ? 'tr-TR' : 'en-US');
                    }
                }
                return Math.min(next, totalSec);
            });
        }, 1000);
        return () => clearInterval(id);
        // totalSec kosum sirasinda sabittir; lang anons metnini belirler
    }, [running, totalSec, lang]);

    // Kesit gecisleri: ses + titreme + sesli koc
    useEffect(() => {
        if (!running || !seg) return;
        if (seg.index !== lastSegIndexRef.current) {
            lastSegIndexRef.current = seg.index;
            const iv = intervals[seg.index];
            if (iv.type === 'work') {
                playSound('coin');
                haptic([30, 50, 30]);
                if (isVoiceCoachEnabled()) {
                    speak(lang === 'tr' ? `Tur ${iv.round}. Başla!` : `Round ${iv.round}. Go!`, lang === 'tr' ? 'tr-TR' : 'en-US');
                }
            } else {
                playSound('click');
                haptic(20);
                if (isVoiceCoachEnabled()) {
                    speak(lang === 'tr' ? 'Dinlen.' : 'Rest.', lang === 'tr' ? 'tr-TR' : 'en-US');
                }
            }
        }
        // Son 3 saniye sayma
        if (seg.secondsLeft === 3 && isVoiceCoachEnabled()) {
            speak(lang === 'tr' ? 'Üç, iki, bir' : 'Three, two, one', lang === 'tr' ? 'tr-TR' : 'en-US');
        }
    }, [seg, running, intervals, lang]);

    const start = () => {
        // Ilk etkilesimde AudioContext'i acar; otonom oynatma politikasi icin onemli
        playSound('click');
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
        lastSegIndexRef.current = -1;
        setElapsed(0);
        setPhase('setup');
        setRunning(false);
    };

    const fmt = (s) => {
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${String(r).padStart(2, '0')}`;
    };

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
                        <h2 style={{ color: '#ff6b3d', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
                            <Timer size={28} /> {t('hiit_title')}
                        </h2>
                        <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}>{t('hiit_subtitle')}</p>
                    </div>
                </header>

                <div className="workout-tracker-list fade-in" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingTop: '1.5rem', paddingBottom: '3rem' }}>

                    {/* Protokol secimi */}
                    <div className="glass-card slide-in">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: '#fff' }}>
                            <Zap size={20} color="#ff6b3d" /> {t('hiit_pick_protocol')}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                            {Object.values(HIIT_PROTOCOLS).map(p => {
                                const s = protocolSummary(p);
                                const active = protoId === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setProtoId(p.id)}
                                        style={{
                                            padding: '12px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                                            background: active ? 'rgba(255,107,61,0.18)' : 'rgba(255,255,255,0.04)',
                                            border: active ? '1px solid #ff6b3d' : '1px solid rgba(255,255,255,0.08)',
                                            color: active ? '#ff6b3d' : '#fff', transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{t(`hiit_proto_${p.id}`)}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '4px' }}>
                                            {p.work}/{p.rest} × {p.rounds}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{fmt(s.totalSec)}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Ozel protokol ayarlari */}
                    {protoId === 'custom' && (
                        <div className="glass-card slide-in" style={{ background: 'rgba(255,107,61,0.05)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: '#fff' }}>
                                <Settings2 size={18} color="#ff6b3d" /> {t('hiit_custom_setup')}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                {[
                                    { label: t('hiit_work_sec'), val: customWork, set: setCustomWork, min: 5, max: 300 },
                                    { label: t('hiit_rest_sec'), val: customRest, set: setCustomRest, min: 5, max: 300 },
                                    { label: t('hiit_rounds'), val: customRounds, set: setCustomRounds, min: 2, max: 30 }
                                ].map(f => (
                                    <div key={f.label} style={{ textAlign: 'center' }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{f.label}</label>
                                        <input
                                            type="number"
                                            className="neon-input"
                                            min={f.min} max={f.max}
                                            value={f.val}
                                            onChange={e => {
                                                const v = parseInt(e.target.value) || f.min;
                                                f.set(Math.max(f.min, Math.min(f.max, v)));
                                            }}
                                            style={{ textAlign: 'center', padding: '0.5rem' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Agirlik (kalori tahmini icin) */}
                    <div className="glass-card slide-in">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: '#fff' }}>
                            <Flame size={20} color="#ffa502" /> {t('hiit_estimate')}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1', minWidth: '140px' }}>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{t('hiit_bodyweight')}</label>
                                <input
                                    type="number"
                                    className="neon-input"
                                    min={30} max={250}
                                    value={weightKg}
                                    onChange={e => {
                                        const v = parseFloat(e.target.value);
                                        setWeightKg(isNaN(v) ? 70 : Math.max(30, Math.min(250, v)));
                                    }}
                                    style={{ padding: '0.5rem' }}
                                />
                            </div>
                            <div style={{ textAlign: 'center', background: 'rgba(255,165,2,0.08)', padding: '12px 20px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{t('hiit_est_kcal')}</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffa502' }}>~{estimateCalories(intervals, weightKg)}</div>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{fmt(totalSec)} • {t('hiit_total')}</div>
                            </div>
                        </div>
                    </div>

                    <button onClick={start} className="neon-btn" style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', fontWeight: 800, background: 'rgba(255,107,61,0.15)', borderColor: '#ff6b3d', color: '#ff6b3d' }}>
                        <Play size={22} /> {t('hiit_start')}
                    </button>
                </div>
            </div>
        );
    }
    // =========================================================
    // RUNNING / DONE EKRANI
    // =========================================================
    const st = SEG_STYLE[seg?.type] || SEG_STYLE.work;
    const pct = seg && totalSec > 0 ? Math.min(100, (elapsed / totalSec) * 100) : 0;
    const segPct = seg ? ((seg.seconds - seg.secondsLeft) / seg.seconds) * 100 : 0;

    return (
        <div className="app-container slide-in" style={{ maxWidth: '720px' }}>
            <header className="top-bar fade-in" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
                <button className="back-btn" onClick={restart} style={{ color: 'var(--text-light)' }}>
                    <ArrowLeft size={20} /> {t('hiit_back_setup')}
                </button>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', paddingTop: '2rem', paddingBottom: '3rem' }}>

                {phase === 'done' ? (
                    <>
                        <div style={{ fontSize: '4rem' }}>🔥</div>
                        <h2 style={{ margin: 0, color: '#ffa502' }}>{t('hiit_done_title')}</h2>
                        <div style={{ color: 'var(--text-light)', textAlign: 'center', fontSize: '0.95rem' }}>
                            {t('hiit_done_stats', { rounds: protocol.rounds, time: fmt(Math.min(elapsed, totalSec)), kcal: estimateCalories(intervals, weightKg) })}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button onClick={restart} className="neon-btn" style={{ padding: '0.8rem 1.5rem', width: 'auto' }}>
                                <Timer size={18} /> {t('hiit_again')}
                            </button>
                            <button onClick={onBack} className="neon-btn" style={{ padding: '0.8rem 1.5rem', width: 'auto', background: 'rgba(255,255,255,0.05)' }}>
                                {t('btn_back')}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Tur sayaci */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '420px' }}>
                            {Array.from({ length: protocol.rounds }).map((_, i) => {
                                const done = seg && i + 1 < seg.round;
                                const now = seg && i + 1 === seg.round;
                                return (
                                    <div key={i} style={{
                                        width: '16px', height: '16px', borderRadius: '50%',
                                        background: done ? '#ff6b3d' : now ? st.color : 'rgba(255,255,255,0.12)',
                                        boxShadow: now ? `0 0 12px ${st.ring}` : 'none',
                                        transition: 'all 0.3s'
                                    }} />
                                );
                            })}
                        </div>

                        {/* Ana sayaç karti — SVG halka (conic-gradient yerine
                            stroke-dasharray: React style ile %100 guvenilir) */}
                        <div style={{
                            width: 'min(78vw, 380px)', aspectRatio: '1', borderRadius: '50%', position: 'relative',
                            background: st.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 60px ${st.ring}`
                        }}>
                            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <circle cx="50" cy="50" r="47" fill="none" stroke={st.color} strokeWidth="4"
                                    strokeDasharray={`${segPct * 2.954} 295.4`} strokeLinecap="round"
                                    style={{ transition: 'stroke-dasharray 1s linear, stroke 0.4s' }} />
                            </svg>
                            <div style={{
                                position: 'absolute', inset: '14px', borderRadius: '50%',
                                background: 'radial-gradient(circle at 30% 30%, rgba(30,30,40,0.98), rgba(10,10,15,0.99))',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px', color: st.color }}>
                                    {t(`hiit_seg_${seg?.type || 'work'}`)}
                                </div>
                                <div style={{ fontSize: '4.2rem', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                                    {seg?.secondsLeft ?? 0}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                                    {t('hiit_round_n', { n: seg?.round || 1 })} / {protocol.rounds}
                                </div>
                            </div>
                        </div>

                        {/* Genel ilerleme */}
                        <div style={{ width: 'min(78vw, 380px)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '4px' }}>
                                <span>{fmt(elapsed)}</span>
                                <span>−{fmt(Math.max(0, totalSec - elapsed))}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #ff6b3d, #ffa502)', borderRadius: '4px', transition: 'width 1s linear' }} />
                            </div>
                        </div>

                        {/* Kontrol butonlari */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {running ? (
                                <button onClick={() => setRunning(false)} className="neon-btn" style={{ width: 'auto', padding: '0.8rem 1.6rem' }}>
                                    <Pause size={20} /> {t('hiit_pause')}
                                </button>
                            ) : (
                                <button onClick={() => setRunning(true)} className="neon-btn" style={{ width: 'auto', padding: '0.8rem 1.6rem', background: 'rgba(46,213,115,0.15)', borderColor: '#2ed573', color: '#2ed573' }}>
                                    <Play size={20} /> {t('hiit_resume')}
                                </button>
                            )}
                            <button onClick={finishEarly} className="neon-btn" style={{ width: 'auto', padding: '0.8rem 1.6rem', background: 'rgba(255,71,87,0.12)', borderColor: '#ff4757', color: '#ff4757' }}>
                                <Square size={18} /> {t('hiit_finish')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default HiitTimerView;
