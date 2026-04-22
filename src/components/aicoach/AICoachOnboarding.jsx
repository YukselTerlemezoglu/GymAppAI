import React, { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { ArrowLeft, Bot, Loader2, Check } from 'lucide-react';


function AICoachOnboarding({ workoutHistory, setSavedAiProgram, setCurrentView }) {
    const { t, lang } = useTranslation();
    const [aiGoal, setAiGoal] = useState('');
    const [aiDays, setAiDays] = useState('');
    const [aiDuration, setAiDuration] = useState('');
    const [aiEquipment, setAiEquipment] = useState('');
    const [aiLevel, setAiLevel] = useState('');
    const [aiPriority, setAiPriority] = useState('');
    const [aiInjury, setAiInjury] = useState('');
    const [aiSplit, setAiSplit] = useState('Auto');
    const [aiCardio, setAiCardio] = useState('');
    const [aiResponseJson, setAiResponseJson] = useState(null);
    const [aiResponseErr, setAiResponseErr] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleGenerateProgram = async (e) => {
        e.preventDefault();
        if (!aiGoal || !aiDays || !aiDuration || !aiEquipment || !aiLevel || !aiCardio) {
            alert(t('coach_error_required'));
            return;
        }

        setIsAiLoading(true);
        setAiResponseJson(null);
        setAiResponseErr('');

        try {
            const API_KEYS = [
                import.meta.env.VITE_GROQ_API_KEY,
            ].filter(k => k && k !== "API_ANAHTARINIZI_BURAYA_YAZIN");

            // --- 4-Week Analytics Engine Calculation ---
            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

            const recentWorkouts = (workoutHistory || []).filter(w => new Date(w.date) >= fourWeeksAgo);

            const exerciseStats = {};
            let totalVolume = 0;

            recentWorkouts.forEach(w => {
                const vol = w.maxWeight * w.bestReps * w.sets;
                totalVolume += w.totalWeight || vol;
                if (!exerciseStats[w.exercise]) {
                    exerciseStats[w.exercise] = { maxW: 0, repsR: 0, rpes: [], records: [] };
                }

                const e1RM = Math.round(w.maxWeight * (1 + (w.bestReps / 30)));
                exerciseStats[w.exercise].records.push({ date: new Date(w.date), e1RM });

                if (w.maxWeight > exerciseStats[w.exercise].maxW) {
                    exerciseStats[w.exercise].maxW = w.maxWeight;
                    exerciseStats[w.exercise].repsR = w.bestReps;
                }
                if (w.avgRpe > 0) exerciseStats[w.exercise].rpes.push(w.avgRpe);
            });

            const analyticsSummary = Object.keys(exerciseStats).map(ex => {
                const stats = exerciseStats[ex];
                const avgRPE = stats.rpes.length > 0 ? (stats.rpes.reduce((a, b) => a + b, 0) / stats.rpes.length).toFixed(1) : "N/A";

                let trend = "N/A";
                if (stats.records.length > 1) {
                    stats.records.sort((a, b) => a.date - b.date);
                    const firstRM = stats.records[0].e1RM;
                    const lastRM = stats.records[stats.records.length - 1].e1RM;
                    if (lastRM > firstRM) trend = "UP";
                    else if (lastRM < firstRM) trend = "DOWN";
                    else trend = "FLAT";
                }
                const bestEpley = Math.round(stats.maxW * (1 + (stats.repsR / 30)));

                return {
                    exercise: ex,
                    bestSet: `${stats.maxW}kg x ${stats.repsR}`,
                    avgRPE: avgRPE,
                    estimated1RM: bestEpley,
                    trend: trend
                };
            });

            const analyticsJSON = JSON.stringify({
                weeklyAvgVolume: Math.round(totalVolume / 4) + " kg",
                exerciseTrends: analyticsSummary.slice(0, 10)
            });

            const strictRules = lang === 'tr' 
                ? `Kurallar (Split 'Auto' seçilmişse haftalık gün sayısına göre aşağıdaki split türünü ZORUNLU olarak uygula): - 2 gün → FullBody A/B - 3 gün → FullBody A/B/C - 4 gün → Upper/Lower (Alt/Üst) - 5 veya 6 gün → PPL (Push/Pull/Legs)`
                : `Rules (If Split 'Auto' is selected, apply the following split type MANDATORILY based on days per week): - 2 days → FullBody A/B - 3 days → FullBody A/B/C - 4 days → Upper/Lower - 5 or 6 days → PPL (Push/Pull/Legs)`;

            const prompt = lang === 'tr' 
                ? `Sen profesyonel bir fitness antrenörüsün. Hedef: ${aiGoal}, Gün: ${aiDays}, Süre: ${aiDuration}, Ekipman: ${aiEquipment}, Seviye: ${aiLevel}. JSON FORMATINDA CEVAP VER. TÜM İSİMLER TÜRKÇE OLMALI.`
                : `You are a professional fitness coach. Goal: ${aiGoal}, Days: ${aiDays}, Duration: ${aiDuration}, Equipment: ${aiEquipment}, Level: ${aiLevel}. OUTPUT IN JSON FORMAT. ALL NAMES MUST BE IN ENGLISH.`;

            let textResult = null;
            let lastError = null;

            for (let i = 0; i < API_KEYS.length; i++) {
                try {
                    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${API_KEYS[i]}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            "model": "llama-3.3-70b-versatile",
                            "messages": [
                                {
                                    "role": "system",
                                    "content": "You are a professional fitness coach. You must ONLY output a valid JSON object matching the requested schema. No other text, no markdown formatting like ```json."
                                },
                                {
                                    "role": "user",
                                    "content": prompt
                                }
                            ],
                            "response_format": { "type": "json_object" },
                            "temperature": 0.5
                        })
                    });

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();

                    if (result.choices && result.choices.length > 0) {
                        textResult = result.choices[0].message.content;
                        break;
                    } else {
                        if (!textResult) throw new Error(t('coach_error_gen'));
                    }
                } catch (err) {
                    console.error(`AI: Error with Key ${i}:`, err.message);
                    lastError = err;

                    const msg = err.message.toLowerCase();
                    const isRetryable = msg.includes("429") || msg.includes("quota") || msg.includes("exhausted");

                    if (isRetryable && i < API_KEYS.length - 1) {
                        continue;
                    } else {
                        break;
                    }
                }
            }

            if (!textResult) {
                throw new Error(lastError ? lastError.message : "AI could not generate content with any provided keys.");
            }

            let text = textResult;
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsedData = JSON.parse(text);
            parsedData.isAiGenerated = true;
            setAiResponseJson(parsedData);
        } catch (error) {
            setAiResponseErr(t('coach_error_gen'));
            console.error(error);
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
                <button onClick={() => { }} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', padding: '0', cursor: 'pointer', marginBottom: '1.5rem', textDecoration: 'underline' }} type="button">
                    {t('coach_advanced_settings')}
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
                    {aiResponseJson.days.map((day, dIdx) => (
                        <div key={dIdx} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                            <h4 style={{ color: '#fff', marginBottom: '1rem' }}>{day.dayName}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {day?.exercises?.map((ex, eIdx) => (
                                    <div key={eIdx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
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
                    <button onClick={saveProgramToDashboard} className="neon-btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                        {t('coach_save_btn')}
                    </button>
                </div>
            )}
        </div>
    );
}

export default AICoachOnboarding;
