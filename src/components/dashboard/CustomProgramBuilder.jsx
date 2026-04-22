import React from 'react';
import { Dumbbell, Trash2, Plus, Check } from 'lucide-react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { useTranslation } from '../../i18n/LanguageContext';

function CustomProgramBuilder({ setSavedAiProgram, setShowCustomBuilder }) {
    const { t } = useTranslation();
    const [customProgramName, setCustomProgramName] = useLocalStorage('gym_app_custom_name', '');
    const [customDays, setCustomDays] = useLocalStorage('gym_app_custom_days', [{ dayName: t('builder_default_day_with_focus', { num: 1 }), exercises: [] }]);

    const handleAddCustomDay = () => {
        if (customDays.length >= 7) {
            alert(t('builder_max_days_error', { max: 7 }));
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

    const handleUpdateCustomDayName = (dayIdx, value) => {
        const updatedDays = [...customDays];
        updatedDays[dayIdx].dayName = value;
        setCustomDays(updatedDays);
    };

    const handleSaveCustomProgram = () => {
        if (!customProgramName.trim()) {
            alert(t('builder_name_error'));
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
                            <div key={eIdx} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 2fr) 1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                                <input
                                    type="text"
                                    className="neon-input"
                                    placeholder={t('builder_exercise_placeholder')}
                                    value={ex.name}
                                    onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'name', e.target.value)}
                                    style={{ padding: '0.4rem' }}
                                />
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
