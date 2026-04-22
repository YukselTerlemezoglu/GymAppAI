import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { ArrowLeft, Plus, Trash2, Utensils, PieChart, Info, Bot, Loader2 } from 'lucide-react';
import useLocalStorage from '../../hooks/useLocalStorage';

function NutritionTracker({ onBack }) {
    const { t, lang } = useTranslation();
    // Veri yapısı: { "2023-10-25": { meals: [{id, name, kcal, protein, carbs, fat}], goals: {kcal, protein, carbs, fat} } }
    const [nutritionData, setNutritionData] = useLocalStorage('gym_app_nutrition_v2', {});
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

    const [showAddMeal, setShowAddMeal] = useState(false);
    const [mealForm, setMealForm] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });
    const [isAiLoading, setIsAiLoading] = useState(false);

    const currentDayData = nutritionData[currentDate] || { meals: [], goals: { kcal: 2500, protein: 150, carbs: 250, fat: 80 } };

    // Calculate totals
    const totals = currentDayData.meals.reduce((acc, meal) => ({
        kcal: acc.kcal + (parseFloat(meal.kcal) || 0),
        protein: acc.protein + (parseFloat(meal.protein) || 0),
        carbs: acc.carbs + (parseFloat(meal.carbs) || 0),
        fat: acc.fat + (parseFloat(meal.fat) || 0)
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

    const handleAddMeal = (e) => {
        e.preventDefault();
        if (!mealForm.name || !mealForm.kcal) {
            alert(t('nutrition_error_empty'));
            return;
        }

        const newMeal = {
            id: Date.now().toString(),
            name: mealForm.name,
            kcal: parseFloat(mealForm.kcal) || 0,
            protein: parseFloat(mealForm.protein) || 0,
            carbs: parseFloat(mealForm.carbs) || 0,
            fat: parseFloat(mealForm.fat) || 0,
        };

        const updatedCurrentDay = {
            ...currentDayData,
            meals: [...currentDayData.meals, newMeal]
        };

        setNutritionData(prev => ({ ...prev, [currentDate]: updatedCurrentDay }));
        setMealForm({ name: '', kcal: '', protein: '', carbs: '', fat: '' });
        setShowAddMeal(false);
    };

    const handleDeleteMeal = (id) => {
        const updatedMeals = currentDayData.meals.filter(m => m.id !== id);
        setNutritionData(prev => ({
            ...prev,
            [currentDate]: { ...currentDayData, meals: updatedMeals }
        }));
    };

    const handleGoalChange = (field, value) => {
        const val = parseFloat(value) || 0;
        setNutritionData(prev => ({
            ...prev,
            [currentDate]: {
                ...currentDayData,
                goals: { ...currentDayData.goals, [field]: val }
            }
        }));
    };

    const handleCalculateAI = async () => {
        if (!mealForm.name) {
            alert(t('nutrition_ai_prompt'));
            return;
        }

        setIsAiLoading(true);
        try {
            const API_KEYS = [import.meta.env.VITE_GROQ_API_KEY].filter(k => k && k !== "API_ANAHTARINIZI_BURAYA_YAZIN");
            const prompt = lang === 'tr' 
                ? `Sen profesyonel bir diyetisyensin. Kullanıcı şu besinleri girdi: "${mealForm.name}". Bunun ortalama kalori ve makro değerlerini (protein, karbonhidrat, yağ) gram cinsinden tahmin et. DİKKAT: CEvap GÖVDESİ (BODY) MUTLAKA JSON FORMATINDA OLMALIDIR. Sadece JSON.`
                : `You are a professional dietitian. The user entered: "${mealForm.name}". Estimate average calories and macro values (protein, carbs, fat) in grams. ATTENTION: The response BODY MUST be in JSON FORMAT. Only JSON.`;

            let textResult = null;

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
                                { "role": "system", "content": "You are a professional dietitian. Output JSON only." },
                                { "role": "user", "content": prompt }
                            ],
                            "response_format": { "type": "json_object" },
                            "temperature": 0.3
                        })
                    });

                    if (!response.ok) throw new Error("API hatası");
                    const result = await response.json();
                    if (result.choices && result.choices.length > 0) {
                        textResult = result.choices[0].message.content;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!textResult) throw new Error(t('nutrition_api_limit'));

            let text = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(text);

            setMealForm(prev => ({
                ...prev,
                kcal: parsed.kcal || '',
                protein: parsed.protein || '',
                carbs: parsed.carbs || '',
                fat: parsed.fat || ''
            }));

        } catch (err) {
            console.error(err);
            alert(t('nutrition_ai_error'));
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="app-container slide-in">
            <header className="top-bar fade-in" style={{ animationDelay: '0s', flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <button className="back-btn" onClick={onBack} style={{ marginBottom: '1rem' }}>
                    <ArrowLeft size={20} /> {t('btn_back')}
                </button>
                <div>
                    <h2 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
                        <Utensils size={28} /> {t('nutrition_title')}
                    </h2>
                    <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}> {t('nutrition_subtitle')}</p>
                </div>
            </header>

            <div className="workout-tracker-list fade-in" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '1.5rem', paddingBottom: '3rem' }}>

                {/* Date Selector */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={currentDate}
                        onChange={(e) => setCurrentDate(e.target.value)}
                        style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-primary)', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }}
                    />
                </div>

                {/* Macros Summary Panel */}
                <div className="glass-card slide-in" style={{ background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0, 195, 255, 0.05) 100%)', border: '1px solid rgba(0, 195, 255, 0.2)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: '#fff' }}><PieChart size={20} color="#00c3ff" /> {t('nutrition_macro_summary')}</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                        {/* Kalori */}
                        <div style={{ background: 'rgba(255,165,2,0.1)', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '5px' }}>{t('nutrition_kcal')}</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffa502' }}>{Math.round(totals.kcal)}</span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>/ {currentDayData.goals.kcal}</span>
                        </div>
                        {/* Protein */}
                        <div style={{ background: 'rgba(255,71,87,0.1)', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '5px' }}>{t('nutrition_protein')}</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff4757' }}>{Math.round(totals.protein)}g</span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>/ {currentDayData.goals.protein}g</span>
                        </div>
                        {/* Karbonhidrat */}
                        <div style={{ background: 'rgba(0,195,255,0.1)', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '5px' }}>{t('nutrition_carbs')}</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#00c3ff' }}>{Math.round(totals.carbs)}g</span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>/ {currentDayData.goals.carbs}g</span>
                        </div>
                        {/* Yağ */}
                        <div style={{ background: 'rgba(46,213,115,0.1)', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '5px' }}>{t('nutrition_fat')}</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2ed573' }}>{Math.round(totals.fat)}g</span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>/ {currentDayData.goals.fat}g</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '15px' }}>
                        {/* Progress bars could be added here */}
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (totals.kcal / currentDayData.goals.kcal) * 100)}%`, background: 'linear-gradient(90deg, #ffa502, #ff4757)' }}></div>
                        </div>
                    </div>
                </div>

                {/* Meals List */}
                <div className="glass-card slide-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#fff' }}>{t('nutrition_meals')}</h3>
                        <button onClick={() => setShowAddMeal(!showAddMeal)} className="neon-btn" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', width: 'auto' }}>
                            <Plus size={16} /> {t('btn_add')}
                        </button>
                    </div>

                    {showAddMeal && (
                        <form onSubmit={handleAddMeal} style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px' }}>
                            <div className="input-group" style={{ marginBottom: '10px' }}>
                                <label>{t('nutrition_meal_name_label')}</label>
                                <input type="text" className="neon-input" placeholder={t('nutrition_meal_name_placeholder')} value={mealForm.name} onChange={e => setMealForm({ ...mealForm, name: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label>{t('nutrition_kcal')}</label>
                                    <input type="number" step="0.1" className="neon-input" value={mealForm.kcal} onChange={e => setMealForm({ ...mealForm, kcal: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label>{t('nutrition_protein')} (g)</label>
                                    <input type="number" step="0.1" className="neon-input" value={mealForm.protein} onChange={e => setMealForm({ ...mealForm, protein: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label>{t('nutrition_carbs')} (g)</label>
                                    <input type="number" step="0.1" className="neon-input" value={mealForm.carbs} onChange={e => setMealForm({ ...mealForm, carbs: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label>{t('nutrition_fat')} (g)</label>
                                    <input type="number" step="0.1" className="neon-input" value={mealForm.fat} onChange={e => setMealForm({ ...mealForm, fat: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={handleCalculateAI} className="neon-btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', color: isAiLoading ? '#fff' : 'var(--accent-primary)', borderColor: 'var(--accent-primary)', fontSize: '0.9rem' }} disabled={isAiLoading}>
                                    {isAiLoading ? <Loader2 className="spinner" size={16} /> : <Bot size={16} />}
                                    {isAiLoading ? t('nutrition_ai_loading') : t('nutrition_ai_fill')}
                                </button>
                                <button type="submit" className="neon-btn" style={{ flex: 1, background: 'rgba(0, 195, 255, 0.1)', fontSize: '0.9rem' }}>
                                    {t('nutrition_add_meal_btn')}
                                </button>
                            </div>
                        </form>
                    )}

                    {currentDayData.meals.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0', fontSize: '0.9rem' }}>{t('nutrition_no_meals')}</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {currentDayData.meals.map(meal => (
                                <div key={meal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>{meal.name}</div>
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                            <span style={{ color: '#ffa502' }}>{meal.kcal} kcal</span>
                                            <span style={{ color: '#ff4757' }}>{meal.protein}g P</span>
                                            <span style={{ color: '#00c3ff' }}>{meal.carbs}g K</span>
                                            <span style={{ color: '#2ed573' }}>{meal.fat}g Y</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteMeal(meal.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '5px' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Goals Settings */}
                <div className="glass-card slide-in">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: '#fff', fontSize: '1.1rem' }}>
                        <Info size={18} /> {t('nutrition_daily_goals')}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>{t('nutrition_goal_kcal')}</label>
                            <input type="number" className="neon-input" style={{ fontSize: '0.9rem' }} value={currentDayData.goals.kcal} onChange={(e) => handleGoalChange('kcal', e.target.value)} />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>{t('nutrition_goal_protein')} (g)</label>
                            <input type="number" className="neon-input" style={{ fontSize: '0.9rem' }} value={currentDayData.goals.protein} onChange={(e) => handleGoalChange('protein', e.target.value)} />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>{t('nutrition_goal_carbs')} (g)</label>
                            <input type="number" className="neon-input" style={{ fontSize: '0.9rem' }} value={currentDayData.goals.carbs} onChange={(e) => handleGoalChange('carbs', e.target.value)} />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>{t('nutrition_goal_fat')} (g)</label>
                            <input type="number" className="neon-input" style={{ fontSize: '0.9rem' }} value={currentDayData.goals.fat} onChange={(e) => handleGoalChange('fat', e.target.value)} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default NutritionTracker;
