import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { X, Wand2, Dumbbell, Timer, Building2, Home, User } from 'lucide-react';
import { generateProgram } from '../../utils/programGenerator';
import { useToast } from '../ui/ToastProvider';

// PROGRAM URETICI SIHIRBAZI (Faz 3 UI).
// 5 adim: hedef -> gun sayisi -> seans suresi -> ekipman -> deneyim.
// Sonuc: mevcut AI program akisina (savedAiProgram) kaydedilir.

const STEPS = 5;

function ProgramWizard({ open, onClose, onProgramCreated, workoutHistory }) {
    const { t } = useLanguage();
    const { toast, haptic } = useToast();
    const [step, setStep] = useState(0);
    const [goal, setGoal] = useState('hypertrophy');
    const [days, setDays] = useState(3);
    const [minutes, setMinutes] = useState(60);
    const [equipment, setEquipment] = useState('gym');
    const [experience, setExperience] = useState('intermediate');
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const next = () => { haptic(8); setStep(s => Math.min(STEPS - 1, s + 1)); };
    const back = () => setStep(s => Math.max(0, s - 1));

    const finish = () => {
        setLoading(true);
        haptic([20, 40, 20]);
        // Kural motoru program uretir (senkron, API yok)
        const { program } = generateProgram(
            { goal, daysPerWeek: days, sessionMinutes: minutes, equipment, experience },
            workoutHistory || []
        );
        setTimeout(() => {
            setLoading(false);
            onProgramCreated(program);
            setStep(0);
            onClose();
            toast.success('✨ ' + t('wizard_created_toast'));
        }, 500); // mini uretim animasyonu
    };

    const Option = ({ active, onClick, icon, label, desc }) => (
        <button
            onClick={() => { haptic(8); onClick(); }}
            style={{
                flex: 1, minWidth: '130px', padding: '1rem',
                background: active ? 'rgba(0,195,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: active ? '2px solid #00c3ff' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s', color: '#fff'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {icon} <span style={{ fontWeight: 700 }}>{label}</span>
            </div>
            {desc && <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{desc}</div>}
        </button>
    );

    const stepContent = () => {
        switch (step) {
            case 0:
                return (
                    <div>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.8rem' }}>{t('wizard_goal_q')}</p>
                        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
                            <Option active={goal === 'hypertrophy'} onClick={() => setGoal('hypertrophy')} icon={<Dumbbell size={18} color="#00c3ff" />} label={t('wizard_goal_hypo')} desc={t('wizard_goal_hypo_d')} />
                            <Option active={goal === 'strength'} onClick={() => setGoal('strength')} icon={<Dumbbell size={18} color="#ff4757" />} label={t('wizard_goal_str')} desc={t('wizard_goal_str_d')} />
                            <Option active={goal === 'endurance'} onClick={() => setGoal('endurance')} icon={<Timer size={18} color="#00ff88" />} label={t('wizard_goal_end')} desc={t('wizard_goal_end_d')} />
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.8rem' }}>{t('wizard_days_q')}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[2, 3, 4, 5, 6].map(d => (
                                <button key={d} onClick={() => { haptic(8); setDays(d); }}
                                    style={{
                                        flex: 1, minWidth: '54px', padding: '0.9rem 0', fontSize: '1.3rem', fontWeight: 700,
                                        background: days === d ? 'rgba(0,195,255,0.2)' : 'rgba(255,255,255,0.04)',
                                        border: days === d ? '2px solid #00c3ff' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', cursor: 'pointer', color: days === d ? '#00c3ff' : '#fff'
                                    }}>
                                    {d}
                                </button>
                            ))}
                        </div>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.78rem', marginTop: '0.6rem', textAlign: 'center' }}>
                            {days === 2 && t('wizard_split_fb')}
                            {days === 3 && t('wizard_split_ppl')}
                            {days === 4 && t('wizard_split_ul')}
                            {days >= 5 && t('wizard_split_custom')}
                        </p>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.8rem' }}>{t('wizard_time_q')}</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[45, 60, 75, 90].map(m => (
                                <button key={m} onClick={() => { haptic(8); setMinutes(m); }}
                                    style={{
                                        flex: 1, padding: '0.9rem 0', fontSize: '1.1rem', fontWeight: 700,
                                        background: minutes === m ? 'rgba(0,195,255,0.2)' : 'rgba(255,255,255,0.04)',
                                        border: minutes === m ? '2px solid #00c3ff' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', cursor: 'pointer', color: minutes === m ? '#00c3ff' : '#fff'
                                    }}>
                                    {m}′
                                </button>
                            ))}
                        </div>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.78rem', marginTop: '0.6rem', textAlign: 'center' }}>
                            {minutes >= 75 ? t('wizard_time_l') : minutes >= 60 ? t('wizard_time_m') : t('wizard_time_s')}
                        </p>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.8rem' }}>{t('wizard_equip_q')}</p>
                        <div style={{ display: 'flex', gap: '0.7rem' }}>
                            <Option active={equipment === 'gym'} onClick={() => setEquipment('gym')} icon={<Building2 size={18} color="#00c3ff" />} label={t('wizard_equip_gym')} desc={t('wizard_equip_gym_d')} />
                            <Option active={equipment === 'home'} onClick={() => setEquipment('home')} icon={<Home size={18} color="#ffd700" />} label={t('wizard_equip_home')} desc={t('wizard_equip_home_d')} />
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.8rem' }}>{t('wizard_exp_q')}</p>
                        <div style={{ display: 'flex', gap: '0.7rem' }}>
                            <Option active={experience === 'beginner'} onClick={() => setExperience('beginner')} icon={<User size={18} color="#00ff88" />} label={t('wizard_exp_b')} desc={t('wizard_exp_b_d')} />
                            <Option active={experience === 'intermediate'} onClick={() => setExperience('intermediate')} icon={<User size={18} color="#00c3ff" />} label={t('wizard_exp_i')} desc={t('wizard_exp_i_d')} />
                            <Option active={experience === 'advanced'} onClick={() => setExperience('advanced')} icon={<User size={18} color="#ff4757" />} label={t('wizard_exp_a')} desc={t('wizard_exp_a_d')} />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }} onClick={onClose}>
            <div className="glass-card" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="close">
                    <X size={16} />
                </button>

                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginTop: 0, marginBottom: '0.2rem' }}>
                    <Wand2 size={20} color="#00c3ff" /> {t('wizard_title')}
                </h3>

                {/* Adim göstergesi */}
                <div style={{ display: 'flex', gap: '5px', margin: '0.7rem 0 1.2rem 0' }}>
                    {Array.from({ length: STEPS }).map((_, i) => (
                        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= step ? '#00c3ff' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <div style={{ fontSize: '2.5rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</div>
                        <p style={{ color: '#fff', fontWeight: 600 }}>{t('wizard_generating')}</p>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{t('wizard_generating_sub')}</p>
                    </div>
                ) : (
                    <>
                        {stepContent()}
                        <div style={{ display: 'flex', gap: '0.7rem', marginTop: '1.4rem' }}>
                            {step > 0 && (
                                <button onClick={back} style={{ flex: '0 0 auto', padding: '0.8rem 1.2rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                                    {t('wizard_back')}
                                </button>
                            )}
                            <button onClick={step === STEPS - 1 ? finish : next} className="neon-btn" style={{ flex: 1, padding: '0.8rem' }}>
                                {step === STEPS - 1 ? `✨ ${t('wizard_create')}` : t('wizard_next')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}

export default ProgramWizard;
