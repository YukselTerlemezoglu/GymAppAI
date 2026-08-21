import React from 'react';
import { Dumbbell, Trash2, Plus, Check, Link2 } from 'lucide-react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../ui/ToastProvider';

// Superset zincirinde kaçıncı cift oldugunu bulur (A1, A2, A3...)
// Bir satir "oncekiyle bagli"ysa, zincir basindan itibaren numaralar.
function supersetPairIndex(exercises, idx) {
    let n = 1;
    for (let i = 1; i <= idx; i++) {
        if (exercises[i]?.supersetWithPrev) n++;
        else n = 1;
    }
    return n;
}

function CustomProgramBuilder({ setSavedAiProgram, setShowCustomBuilder }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [customProgramName, setCustomProgramName] = useLocalStorage('gym_app_custom_name', '');
    const [customDays, setCustomDays] = useLocalStorage('gym_app_custom_days', [{ dayName: t('builder_default_day_with_focus', { num: 1 }), exercises: [] }]);

    const handleAddCustomDay = () => {
        if (customDays.length >= 7) {
            toast.warning(t('builder_max_days_error', { max: 7 }));
            return;
        }
        setCustomDays([...customDays, { dayName: t('builder_default_day_name', { num: customDays.length + 1 }), exercises: [] }]);
    };

    const handleAddCustomExercise = (dayIdx) => {
        const updatedDays = [...customDays];
        updatedDays[dayIdx].exercises.push({ name: '', sets: '', reps: '', weight: '' });
        setCustomDays(updatedDays);
    };

    const handleUpdateCustomExercise = (dayIdx, exIdx, field, value) => {
        const updatedDays = [...customDays];
        updatedDays[dayIdx].exercises[exIdx][field] = value;
        setCustomDays(updatedDays);
    };

    // Superset bagini ac/kapa: satiri oncekiyle esler (A1/A2 cifti)
    const toggleSuperset = (dayIdx, exIdx) => {
        if (exIdx === 0) return;
        const updatedDays = [...customDays];
        const ex = updatedDays[dayIdx].exercises[exIdx];
        if (ex.supersetWithPrev) {
            delete ex.supersetWithPrev;
        } else {
            ex.supersetWithPrev = true;
        }
        setCustomDays(updatedDays);
    };

    const handleUpdateCustomDayName = (dayIdx, value) => {
        const updatedDays = [...customDays];
        updatedDays[dayIdx].dayName = value;
        setCustomDays(updatedDays);
    };

    const handleSaveCustomProgram = () => {
        if (!customProgramName.trim()) {
            toast.warning(t('builder_name_error'));
            return;
        }
        const program = {
            programName: customProgramName,
            days: customDays
        };
        setSavedAiProgram(program);
        setShowCustomBuilder(false);
    };

    return (
        <section className="custom-builder fade-in" style={{ animationDelay: '0.2s', marginBottom: '3rem' }}>
            <div className="section-header">
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Dumbbell size={20} color="var(--accent-primary)" /> {t('builder_title')}
                </h2>
                <button onClick={() => setShowCustomBuilder(false)} className="clear-btn" aria-label={t('builder_cancel')}>
                    <Trash2 size={14} /> {t('builder_cancel')}
                </button>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div className="input-group">
                    <label>{t('builder_program_name_label')}</label>
                    <input
                        type="text"
                        className="neon-input"
                        placeholder={t('builder_program_name_placeholder')}
                        value={customProgramName}
                        onChange={(e) => setCustomProgramName(e.target.value)}
                    />
                </div>

                {customDays.map((day, dIdx) => (
                    <div key={dIdx} style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                className="neon-input"
                                value={day.dayName}
                                onChange={(e) => handleUpdateCustomDayName(dIdx, e.target.value)}
                                placeholder={t('builder_day_name_placeholder')}
                                style={{ flex: '1', padding: '0.5rem', fontSize: '1rem' }}
                            />
                        </div>

                        {day.exercises.map((ex, eIdx) => (
                            <div key={eIdx} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 2fr) 1fr 1fr 1fr auto', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', minWidth: 0 }}>
                                    {/* Superset eslestirmesi: bagli satir VE ciftin ilk satiri A1 rozeti tasir */}
                                    {(ex.supersetWithPrev || day.exercises[eIdx + 1]?.supersetWithPrev) && (
                                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ff0088', border: '1px solid #ff0088', borderRadius: '4px', padding: '1px 4px', flexShrink: 0 }}>A{supersetPairIndex(day.exercises, eIdx)}</span>
                                    )}
                                    <input
                                        type="text"
                                        className="neon-input"
                                        placeholder={t('builder_exercise_placeholder')}
                                        value={ex.name}
                                        onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'name', e.target.value)}
                                        style={{ padding: '0.4rem', minWidth: 0 }}
                                    />
                                </div>
                                <input
                                    type="number"
                                    className="neon-input"
                                    placeholder={t('builder_sets_placeholder')}
                                    value={ex.sets}
                                    onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'sets', e.target.value)}
                                    style={{ padding: '0.4rem', textAlign: 'center' }}
                                />
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        className="neon-input"
                                        placeholder={t('builder_weight_placeholder')}
                                        value={ex.weight}
                                        onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'weight', e.target.value)}
                                        style={{ padding: '0.4rem', textAlign: 'center', width: '100%', paddingRight: '20px' }}
                                    />
                                </div>
                                <input
                                    type="text"
                                    className="neon-input"
                                    placeholder={t('builder_reps_placeholder')}
                                    value={ex.reps}
                                    onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'reps', e.target.value)}
                                    style={{ padding: '0.4rem', textAlign: 'center' }}
                                />
                                {/* Superset baglama butonu (ilk satir haric) */}
                                <button
                                    onClick={() => toggleSuperset(dIdx, eIdx)}
                                    title={eIdx === 0 ? t('sup_first_row_hint') : t('sup_link_hint')}
                                    disabled={eIdx === 0}
                                    style={{
                                        background: ex.supersetWithPrev ? 'rgba(255,0,136,0.2)' : 'transparent',
                                        border: `1px solid ${ex.supersetWithPrev ? '#ff0088' : 'rgba(255,255,255,0.15)'}`,
                                        borderRadius: '6px', padding: '6px', cursor: eIdx === 0 ? 'not-allowed' : 'pointer',
                                        color: ex.supersetWithPrev ? '#ff0088' : 'var(--text-light)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: eIdx === 0 ? 0.3 : 1
                                    }}
                                >
                                    <Link2 size={14} />
                                </button>
                            </div>
                        ))}

                        <button onClick={() => handleAddCustomExercise(dIdx)} className="neon-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                            <Plus size={14} /> {t('builder_add_exercise')}
                        </button>
                    </div>
                ))}

                <button onClick={handleAddCustomDay} className="neon-btn-secondary" style={{ width: '100%', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)' }}>
                    <Plus size={18} /> {t('builder_add_day')}
                </button>

                <button onClick={handleSaveCustomProgram} className="neon-btn" style={{ width: '100%', padding: '1rem' }}>
                    <Check size={20} /> {t('builder_save_btn')}
                </button>
            </div>
        </section>
    );
}

export default CustomProgramBuilder;
