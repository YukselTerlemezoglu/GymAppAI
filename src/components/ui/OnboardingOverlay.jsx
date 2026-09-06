import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Dumbbell, TrendingUp, User, Cloud } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Ilk acilis rehberi (onboarding turu).
 * 5 adim: Bugun / Antrenman / Gelim / Profil + hesap olusturma CTA'si.
 * "gym_app_onboarded" bayragi App.jsx'te tek useLocalStorage orneginde
 * tutulur; burada ikinci writer tutmak IDB/LS esitlemesini bozuyordu.
 * 5. adimda "Hesap Olustur" auth ekranina yonlendirir; tur tamamlanmis sayilir.
 */
function OnboardingOverlay({ onFinish, onCreateAccount }) {
    const { t } = useLanguage();
    const [step, setStep] = useState(0);

    const steps = [
        {
            icon: <Zap size={42} color="#00c3ff" />,
            title: t('onb_step1_title'),
            text: t('onb_step1_text')
        },
        {
            icon: <Dumbbell size={42} color="#ff0088" />,
            title: t('onb_step2_title'),
            text: t('onb_step2_text')
        },
        {
            icon: <TrendingUp size={42} color="#00ff88" />,
            title: t('onb_step3_title'),
            text: t('onb_step3_text')
        },
        {
            icon: <User size={42} color="#ffd700" />,
            title: t('onb_step4_title'),
            text: t('onb_step4_text')
        },
        {
            icon: <Cloud size={42} color="#00c3ff" />,
            title: t('onb_step5_title'),
            text: t('onb_step5_text')
        }
    ];

    const current = steps[step];
    const isAccountStep = step === steps.length - 1;

    const finish = () => {
        // Kalici bayrak App'teki tek useLocalStorage orneginde yasar
        // (cift writer IDB/LS esitlemesini bozuyordu).
        onFinish && onFinish();
    };

    const createAccount = () => {
        onFinish && onFinish();
        onCreateAccount && onCreateAccount();
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10002,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                style={{
                    width: 'min(92vw, 380px)',
                    background: 'linear-gradient(160deg, rgba(20,26,38,0.98), rgba(10,14,22,0.98))',
                    border: `1px solid ${isAccountStep ? 'rgba(0,255,136,0.4)' : 'rgba(0,195,255,0.35)'}`,
                    borderRadius: '20px',
                    padding: '1.8rem 1.5rem',
                    textAlign: 'center',
                    boxShadow: '0 24px 70px rgba(0,0,0,0.6)'
                }}
            >
                <div style={{
                    width: '76px', height: '76px', borderRadius: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    background: isAccountStep ? 'rgba(0,255,136,0.08)' : 'rgba(0,195,255,0.08)',
                    border: isAccountStep ? '1px solid rgba(0,255,136,0.25)' : '1px solid rgba(0,195,255,0.25)'
                }}>
                    {current.icon}
                </div>

                <h2 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '1.25rem' }}>{current.title}</h2>
                <p style={{ margin: '0 0 1.4rem 0', color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                    {current.text}
                </p>

                {/* Adim gostergeleri */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '7px', marginBottom: '1.3rem' }}>
                    {steps.map((_, i) => (
                        <span key={i} style={{
                            width: i === step ? '22px' : '7px',
                            height: '7px',
                            borderRadius: '4px',
                            background: i === step ? (isAccountStep ? '#00ff88' : '#00c3ff') : 'rgba(255,255,255,0.18)',
                            transition: 'all 0.25s',
                            boxShadow: i === step ? `0 0 8px ${isAccountStep ? 'rgba(0,255,136,0.6)' : 'rgba(0,195,255,0.6)'}` : 'none'
                        }} />
                    ))}
                </div>

                {isAccountStep ? (
                    // Hesap adimi: guclu yesil CTA + nazik "simdi degil"
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            onClick={createAccount}
                            style={{
                                width: '100%',
                                padding: '13px 0',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #00ff88, #00c3ff)',
                                color: '#04121c',
                                fontWeight: 800,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 6px 24px rgba(0,255,136,0.35)'
                            }}
                        >
                            {t('onb_step5_cta')}
                        </button>
                        <button
                            onClick={finish}
                            style={{
                                width: '100%',
                                padding: '10px 0',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.14)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'var(--text-light)',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            {t('onb_step5_later')}
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={finish}
                            style={{
                                flex: step === 0 ? 0 : 1,
                                display: step === 0 ? 'none' : 'block',
                                padding: '11px 0',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.14)',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'var(--text-light)',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            {t('onb_skip')}
                        </button>
                        <button
                            onClick={() => setStep(step + 1)}
                            style={{
                                flex: 2,
                                padding: '11px 0',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #00c3ff, #ff0088)',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(0,195,255,0.35)'
                            }}
                        >
                            {t('onb_next')}
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>,
        document.body
    );
}

export default OnboardingOverlay;
