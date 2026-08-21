import React, { useMemo, useState } from 'react';
import { Calculator, Check } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../ui/ToastProvider';
import useLocalStorage from '../../hooks/useLocalStorage';

// Aktivite faktorleri ve hedef ayarlama sabitleri (bileşen dışı — sabitler)
const ACTIVITY = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9
};
const GOALS = {
    cut: { kcal: -0.20, proteinPerKg: 2.2 },
    maintain: { kcal: 0, proteinPerKg: 1.8 },
    bulk: { kcal: 0.15, proteinPerKg: 2.0 }
};

// Mifflin-St Jeor BMR + aktivite faktoru + hedef ayarlamasi ile
// gunluk kalori/makro hedefi hesaplar ve beslenme hedeflerine uygular.
function MacroCalculator({ onApply }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [profile, setProfile] = useLocalStorage('gym_app_macro_profile', null);
    const [form, setForm] = useState(() => ({
        sex: profile?.sex || 'male',
        age: profile?.age || 25,
        height: profile?.height || '',
        weight: profile?.weight || '',
        activity: profile?.activity || 'moderate',
        goal: profile?.goal || 'maintain'
    }));

    const result = useMemo(() => {
        const w = parseFloat(form.weight);
        const h = parseFloat(form.height);
        const a = parseFloat(form.age);
        if (!w || !h || !a || w <= 0 || h <= 0 || a <= 0) return null;

        // Mifflin-St Jeor
        const bmr = form.sex === 'male'
            ? 10 * w + 6.25 * h - 5 * a + 5
            : 10 * w + 6.25 * h - 5 * a - 161;
        const tdee = bmr * (ACTIVITY[form.activity] || 1.55);
        const goalCfg = GOALS[form.goal] || GOALS.maintain;
        const targetKcal = Math.round(tdee * (1 + goalCfg.kcal));

        // Protein hedefe gore, yag ~%25 kalori, kalan karbonhidrat
        const protein = Math.round(w * goalCfg.proteinPerKg);
        const fat = Math.round((targetKcal * 0.25) / 9);
        const carbs = Math.max(0, Math.round((targetKcal - protein * 4 - fat * 9) / 4));

        return { bmr: Math.round(bmr), tdee: Math.round(tdee), targetKcal, protein, fat, carbs };
    }, [form]);

    const apply = () => {
        if (!result) {
            toast.warning(t('mc_fill_all'));
            return;
        }
        setProfile({ ...form });
        onApply({
            kcal: result.targetKcal,
            protein: result.protein,
            carbs: result.carbs,
            fat: result.fat
        });
        toast.success(t('mc_applied'));
    };

    const fieldRow = (label, key, type = 'number', min, max) => (
        <div>
            <label style={{ color: 'var(--text-light)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>{label}</label>
            <input
                type={type}
                className="neon-input"
                style={{ fontSize: '16px' }}
                min={min}
                max={max}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: type === 'number' ? e.target.value : e.target.value })}
            />
        </div>
    );

    const selectRow = (label, key, options) => (
        <div>
            <label style={{ color: 'var(--text-light)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>{label}</label>
            <select
                className="neon-input"
                style={{ fontSize: '16px' }}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
            >
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
        </div>
    );

    return (
        <div className="glass-card slide-in">
            <h3 style={{ color: '#fff', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={20} color="#ffa502" /> {t('mc_title')}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.8rem' }}>
                {selectRow(t('mc_sex'), 'sex', [['male', t('mc_male')], ['female', t('mc_female')]])}
                {fieldRow(t('mc_age'), 'age', 'number', 10, 100)}
                {fieldRow(`${t('mc_height')} (cm)`, 'height', 'number', 100, 250)}
                {fieldRow(`${t('mc_weight')} (kg)`, 'weight', 'number', 30, 300)}
                {selectRow(t('mc_activity'), 'activity', [
                    ['sedentary', t('mc_act_sedentary')],
                    ['light', t('mc_act_light')],
                    ['moderate', t('mc_act_moderate')],
                    ['active', t('mc_act_active')],
                    ['athlete', t('mc_act_athlete')]
                ])}
                {selectRow(t('mc_goal'), 'goal', [
                    ['cut', t('mc_goal_cut')],
                    ['maintain', t('mc_goal_maintain')],
                    ['bulk', t('mc_goal_bulk')]
                ])}
            </div>

            {result && (
                <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255,165,2,0.08)', border: '1px solid rgba(255,165,2,0.25)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.4rem', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.6rem' }}>
                        <span>BMR: <strong style={{ color: '#fff' }}>{result.bmr}</strong> kcal</span>
                        <span>TDEE: <strong style={{ color: '#fff' }}>{result.tdee}</strong> kcal</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.4rem', fontWeight: 'bold' }}>
                        <span style={{ color: '#ffa502' }}>{result.targetKcal} kcal</span>
                        <span style={{ color: '#ff4757' }}>{result.protein}g {t('mc_p')}</span>
                        <span style={{ color: '#00c3ff' }}>{result.carbs}g {t('mc_c')}</span>
                        <span style={{ color: '#ffd700' }}>{result.fat}g {t('mc_f')}</span>
                    </div>
                </div>
            )}

            <button
                onClick={apply}
                className="neon-btn"
                style={{ marginTop: '1rem', width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255,165,2,0.1)', borderColor: '#ffa502', color: '#ffa502' }}
            >
                <Check size={16} /> {t('mc_apply')}
            </button>
        </div>
    );
}

export default MacroCalculator;
