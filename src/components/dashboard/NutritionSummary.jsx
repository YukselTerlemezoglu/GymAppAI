import { localDayKey } from '../../utils/dateKey';
import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Utensils, ChevronsRight } from 'lucide-react';

function NutritionSummary({ nutritionData = {}, onClick }) {
    const { t } = useTranslation();
    const todayStr = localDayKey();
    const todayData = nutritionData[todayStr] || { meals: [], goals: { kcal: 2500, protein: 150, carbs: 250, fat: 80 } };

    const totals = todayData.meals.reduce((acc, meal) => ({
        kcal: acc.kcal + (parseFloat(meal.kcal) || 0),
        protein: acc.protein + (parseFloat(meal.protein) || 0),
        carbs: acc.carbs + (parseFloat(meal.carbs) || 0),
        fat: acc.fat + (parseFloat(meal.fat) || 0)
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

    const percent = Math.min(100, Math.round((totals.kcal / todayData.goals.kcal) * 100)) || 0;

    return (
        <div
            className="glass-card slide-in"
            style={{
                animationDelay: '0.2s',
                cursor: 'pointer',
                border: '1px solid rgba(255, 107, 129, 0.2)',
                background: 'linear-gradient(145deg, rgba(0,0,0,0.4) 0%, rgba(255, 107, 129, 0.05) 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}
            onClick={onClick}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Utensils size={18} color="#ff6b81" /> {t('nutrition_title')}
                </h3>
                <ChevronsRight size={18} color="var(--text-muted)" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-light)' }}>{t('nutrition_kcal')}</span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{Math.round(totals.kcal)} / {todayData.goals.kcal} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kcal</span></span>
                    </div>
                    {/* Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, #ff6b81, #ffa502)' }}></div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#ff4757', fontWeight: 'bold' }}>{t('nutrition_protein_short')}: {Math.round(totals.protein)}g</div>
                    <div style={{ fontSize: '0.75rem', color: '#00c3ff', fontWeight: 'bold' }}>{t('nutrition_carbs_short')}: {Math.round(totals.carbs)}g</div>
                    <div style={{ fontSize: '0.75rem', color: '#2ed573', fontWeight: 'bold' }}>{t('nutrition_fat_short')}: {Math.round(totals.fat)}g</div>
                </div>
            </div>
        </div>
    );
}

export default NutritionSummary;

