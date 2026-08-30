import React, { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../ui/ToastProvider';
import { ArrowLeft, Bot, Loader2 } from 'lucide-react';
import { generateProgram } from '../../services/groq';
import { error as logError } from '../../utils/logger';
import { normalizeAiProgram } from '../../utils/aiNormalizer';


function AICoachOnboarding({ setSavedAiProgram, setCurrentView }) {
    const { t, lang } = useTranslation();
    const { toast } = useToast();
    const [aiGoal, setAiGoal] = useState('');
    const [aiDays, setAiDays] = useState('');
    const [aiDuration, setAiDuration] = useState('');
    const [aiEquipment, setAiEquipment] = useState('');
    const [aiLevel, setAiLevel] = useState('');
    const [aiCardio, setAiCardio] = useState('');
    const [aiResponseJson, setAiResponseJson] = useState(null);
    const [aiResponseErr, setAiResponseErr] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleGenerateProgram = async (e) => {
        e.preventDefault();
        if (!aiGoal || !aiDays || !aiDuration || !aiEquipment || !aiLevel || !aiCardio) {
            toast.warning(t('coach_error_required'));
            return;
        }

        setIsAiLoading(true);
        setAiResponseJson(null);
        setAiResponseErr('');

        try {
            const parsedData = await generateProgram({
                goal: aiGoal,
                days: aiDays,
                duration: aiDuration,
                equipment: aiEquipment,
                level: aiLevel,
                cardio: aiCardio,
                lang,
            });

            const normalized = normalizeAiProgram(parsedData);
            // AI arada istenen gun sayisindan az dondurebilir (tek-gun yanit).
            // Program yine kullanilabilir ama kullaniciyi uyarmak dogru olur;
            // istemezse yeniden uretebilir.
            const istenen = parseInt(aiDays, 10) || 0;
            const gelen = Array.isArray(normalized?.days) ? normalized.days.length : 0;
            if (istenen > 0 && gelen > 0 && gelen < istenen) {
                toast.warning(
                    lang === 'tr'
                        ? `AI ${istenen} gün yerine ${gelen} gün üretti. İstersen tekrar dene.`
                        : `AI generated ${gelen} day(s) instead of ${istenen}. You can try again.`
                );
            }
            setAiResponseJson(normalized);
        } catch (err) {
            logError('AI Coach generate error:', err);

            // Kullanıcıya lokalize mesaj göster
            let userMsg = t('coach_error_gen');
            if (err?.code === 'UNAUTHENTICATED' || err?.code === 'unauthenticated') {
                userMsg = lang === 'tr'
                    ? 'AI için giriş yapmalısınız. Lütfen profil sayfasından giriş yapın.'
                    : 'You must sign in to use AI. Please log in from the profile page.';
            } else if (err?.code === 'RATE_LIMIT' || err?.code === 'resource-exhausted') {
                userMsg = lang === 'tr'
                    ? 'Çok fazla istek gönderdiniz. Lütfen bir dakika bekleyip tekrar deneyin.'
                    : 'Too many requests. Please wait a minute and try again.';
            } else if (err?.code === 'UNAVAILABLE' || err?.code === 'unavailable') {
                userMsg = lang === 'tr'
                    ? 'AI servisi şu an ulaşılamaz. Lütfen kısa süre sonra tekrar deneyin.'
                    : 'AI service is temporarily unavailable. Please try again shortly.';
            }
            setAiResponseErr(userMsg);
        } finally {
            setIsAiLoading(false);
        }
    };

    const saveProgramToDashboard = () => {
        if (aiResponseJson) {
            setSavedAiProgram(aiResponseJson);
            setCurrentView('dashboard');
        }
    };

    return (
        <div className="app-container slide-in">
            <header className="top-bar fade-in" style={{ animationDelay: '0s', flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <button className="back-btn" onClick={() => setCurrentView('dashboard')} style={{ marginBottom: '1rem' }}>
                    <ArrowLeft size={20} /> {t('btn_back')}
                </button>
                <div>
                    <h2 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
                        <Bot size={28} /> {t('coach_title')}
                    </h2>
                    <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}>{t('coach_subtitle')}</p>
                </div>
            </header>

            <form onSubmit={handleGenerateProgram} className="glass-card" style={{ marginBottom: '2rem' }}>
                <div className="metrics-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group">
                        <label>{t('coach_goal_label')}</label>
                        <select className="neon-input" value={aiGoal} onChange={(e) => setAiGoal(e.target.value)} required>
                            <option value="">{lang === 'tr' ? 'Seçiniz...' : 'Select...'}</option>
                            <option value="Kas Kütlesi Artırmak (Hypertrophy)">{lang === 'tr' ? 'Kas Kütlesi Artırmak (Hypertrophy)' : 'Muscle Mass (Hypertrophy)'}</option>
                            <option value="Yağ Yakmak & Sıkılaşmak (Fat Loss)">{lang === 'tr' ? 'Yağ Yakmak & Sıkılaşmak (Fat Loss)' : 'Fat Loss & Toning'}</option>
                            <option value="Güç Artışı (Powerlifting)">{lang === 'tr' ? 'Güç Artışı (Powerlifting)' : 'Strength Gain (Powerlifting)'}</option>
                            <option value="Dayanıklılık (Conditioning)">{lang === 'tr' ? 'Dayanıklılık (Conditioning)' : 'Endurance (Conditioning)'}</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>{t('coach_days_label')}</label>
                        <select className="neon-input" value={aiDays} onChange={(e) => setAiDays(e.target.value)} required>
                            <option value="">{lang === 'tr' ? 'Seçiniz...' : 'Select...'}</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                        </select>
                    </div>
                </div>

                <div className="metrics-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group">
                        <label>{t('coach_duration_label')}</label>
                        <select className="neon-input" value={aiDuration} onChange={(e) => setAiDuration(e.target.value)} required>
                            <option value="">{lang === 'tr' ? 'Seçiniz...' : 'Select...'}</option>
                            <option value="30-45 Dakika">{lang === 'tr' ? '30-45 Dakika' : '30-45 Minutes'}</option>
                            <option value="45-60 Dakika">{lang === 'tr' ? '45-60 Dakika' : '45-60 Minutes'}</option>
                            <option value="60-90 Dakika">{lang === 'tr' ? '60-90 Dakika' : '60-90 Minutes'}</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>{t('coach_equipment_label')}</label>
                        <select className="neon-input" value={aiEquipment} onChange={(e) => setAiEquipment(e.target.value)} required>
                            <option value="">{lang === 'tr' ? 'Seçiniz...' : 'Select...'}</option>
                            <option value="Full Gym (Her Şey Var)">{lang === 'tr' ? 'Full Gym (Her Şey Var)' : 'Full Gym (Everything)'}</option>
                            <option value="Sadece Dumbbell & Barbell">{lang === 'tr' ? 'Sadece Dumbbell & Barbell' : 'Only Dumbbell & Barbell'}</option>
                            <option value="Sadece Dumbbell">{lang === 'tr' ? 'Sadece Dumbbell' : 'Only Dumbbells'}</option>
                            <option value="Vücut Ağırlığı (Ekipman Yok)">{lang === 'tr' ? 'Vücut Ağırlığı (Ekipman Yok)' : 'Bodyweight (No Equipment)'}</option>
                        </select>
                    </div>
                </div>

                <div className="metrics-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group">
                        <label>{t('coach_level_label')}</label>
                        <select className="neon-input" value={aiLevel} onChange={(e) => setAiLevel(e.target.value)} required>
                            <option value="">{lang === 'tr' ? 'Seçiniz...' : 'Select...'}</option>
                            <option value="Başlangıç (0-6 ay)">{lang === 'tr' ? 'Başlangıç (0-6 ay)' : 'Beginner (0-6 months)'}</option>
                            <option value="Orta (1-2 yıl)">{lang === 'tr' ? 'Orta (1-2 yıl)' : 'Intermediate (1-2 years)'}</option>
                            <option value="İleri (3+ yıl)">{lang === 'tr' ? 'İleri (3+ yıl)' : 'Advanced (3+ years)'}</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>{t('coach_cardio_label')}</label>
                        <select className="neon-input" value={aiCardio} onChange={(e) => setAiCardio(e.target.value)} required>
                            <option value="">{lang === 'tr' ? 'Seçiniz...' : 'Select...'}</option>
                            <option value="İstemiyorum">{lang === 'tr' ? 'İstemiyorum' : "I don't want it"}</option>
                            <option value="Hafif (İdman Sonu 10 dk)">{lang === 'tr' ? 'Hafif (İdman Sonu 10 dk)' : 'Light (10 min post-workout)'}</option>
                            <option value="Orta (İdman Sonu 20 dk)">{lang === 'tr' ? 'Orta (İdman Sonu 20 dk)' : 'Moderate (20 min post-workout)'}</option>
                            <option value="Ayrı Günlerde (30-40 dk)">{lang === 'tr' ? 'Ayrı Günlerde (30-40 dk)' : 'Separate Days (30-40 min)'}</option>
                        </select>
                    </div>
                </div>

                <button type="submit" className="neon-btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={isAiLoading}>
                    {isAiLoading ? <Loader2 className="spinner" /> : <Bot size={24} />}
                    {isAiLoading ? t('coach_generating') : t('coach_generate_btn')}
                </button>
            </form>

            {aiResponseErr && (
                <div className="glass-card slide-in" style={{ padding: '1.5rem', marginBottom: '3rem', border: '1px solid var(--accent-danger)' }}>
                    <p style={{ color: 'var(--accent-danger)' }}>{aiResponseErr}</p>
                </div>
            )}

            {aiResponseJson && (
                <div className="ai-response glass-card slide-in" style={{ padding: '1.5rem', marginBottom: '3rem' }}>
                    <div className="glass-card slide-in" style={{ animationDelay: '0.2s', border: '1px solid var(--accent-primary)', background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0, 255, 136, 0.05) 100%)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: '#fff' }}>
                            <Bot size={20} color="var(--accent-primary)" /> {t('coach_params_title')}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{t('coach_params_desc')}</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1.5rem', alignItems: 'start' }}>
                        {aiResponseJson.days.map((day, dIdx) => (
                            <div key={dIdx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                                <h4 style={{ color: '#fff', marginBottom: '1rem' }}>{day.dayName}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {day?.exercises?.map((ex, eIdx) => (
                                        <div key={eIdx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '4px' }}>
                                            <span style={{ color: 'var(--text-light)' }}>{ex.name}</span>
                                            <div style={{ display: 'flex', gap: '10px', fontSize: '0.9rem' }}>
                                                <span style={{ color: 'var(--accent-secondary)' }}>{ex.sets} {t('preview_sets')}</span>
                                                <span style={{ color: 'var(--accent-primary)' }}>{ex.weight} {t('preview_weight_short')}</span>
                                                <span>{ex.reps} {t('preview_reps_short')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={saveProgramToDashboard} className="neon-btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                        {t('coach_save_btn')}
                    </button>
                </div>
            )}
        </div>
    );
}

export default AICoachOnboarding;
