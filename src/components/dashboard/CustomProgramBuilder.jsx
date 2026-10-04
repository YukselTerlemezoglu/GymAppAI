import React, { useMemo, useState } from 'react';
import { Dumbbell, Trash2, Plus, Check, Link2, BedDouble, ChevronUp, ChevronDown, Copy, Search } from 'lucide-react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../ui/ToastProvider';
import { supersetPairIndex } from '../../utils/superset';
import { EXERCISES_DB } from '../../data/exercises';

const emptyExercise = () => ({ name: '', sets: '3', reps: '8-12', weight: '', rest: '90', rpe: '', notes: '' });

function CustomProgramBuilder({ setSavedAiProgram, setShowCustomBuilder }) {
    const { t, lang } = useTranslation();
    const { toast } = useToast();
    const [customProgramName, setCustomProgramName] = useLocalStorage('gym_app_custom_name', '');
    const [customNotes, setCustomNotes] = useLocalStorage('gym_app_custom_notes', '');
    const [customDays, setCustomDays] = useLocalStorage('gym_app_custom_days', [{ dayName: t('builder_default_day_with_focus', { num: 1 }), focus: '', exercises: [emptyExercise()] }]);
    const [openPick, setOpenPick] = useState(null); // { d, e }

    const catalog = useMemo(() => EXERCISES_DB.map((ex) => ({
        id: ex.id,
        name: lang === 'en' ? (ex.name_en || ex.name) : ex.name,
        muscle: lang === 'en' ? (ex.primaryMuscles_en?.[0] || '') : (ex.primaryMuscles?.[0] || ''),
        reps: lang === 'en' ? (ex.repRange_en || ex.repRange || '') : (ex.repRange || '')
    })), [lang]);

    const patchDays = (fn) => {
        const next = customDays.map((d) => ({ ...d, exercises: [...(d.exercises || [])] }));
        fn(next);
        setCustomDays(next);
    };

    const handleAddCustomDay = () => {
        if (customDays.length >= 7) {
            toast.warning(t('builder_max_days_error', { max: 7 }));
            return;
        }
        setCustomDays([...customDays, { dayName: t('builder_default_day_name', { num: customDays.length + 1 }), focus: '', exercises: [emptyExercise()] }]);
    };

    const handleAddRestDay = () => {
        if (customDays.length >= 7) {
            toast.warning(t('builder_max_days_error', { max: 7 }));
            return;
        }
        setCustomDays([...customDays, { dayName: t('builder_rest_day_name'), focus: '', exercises: [], isRestDay: true }]);
    };

    const toggleRestDay = (dayIdx) => {
        patchDays((days) => {
            const day = days[dayIdx];
            if (day.isRestDay) {
                delete day.isRestDay;
                if (day.dayName === t('builder_rest_day_name')) {
                    day.dayName = t('builder_default_day_name', { num: dayIdx + 1 });
                }
                if (!day.exercises.length) day.exercises = [emptyExercise()];
            } else {
                day.isRestDay = true;
                day.exercises = [];
            }
        });
    };

    const moveDay = (idx, dir) => {
        const j = idx + dir;
        if (j < 0 || j >= customDays.length) return;
        const next = [...customDays];
        [next[idx], next[j]] = [next[j], next[idx]];
        setCustomDays(next);
    };

    const duplicateDay = (idx) => {
        if (customDays.length >= 7) {
            toast.warning(t('builder_max_days_error', { max: 7 }));
            return;
        }
        const copy = JSON.parse(JSON.stringify(customDays[idx]));
        copy.dayName = `${copy.dayName} 2`;
        const next = [...customDays];
        next.splice(idx + 1, 0, copy);
        setCustomDays(next);
    };

    const deleteDay = (idx) => {
        if (customDays.length <= 1) return;
        setCustomDays(customDays.filter((_, i) => i !== idx));
    };

    const handleAddCustomExercise = (dayIdx) => {
        patchDays((days) => { days[dayIdx].exercises.push(emptyExercise()); });
    };

    const handleUpdateCustomExercise = (dayIdx, exIdx, field, value) => {
        patchDays((days) => { days[dayIdx].exercises[exIdx] = { ...days[dayIdx].exercises[exIdx], [field]: value }; });
        if (field === 'name') setOpenPick({ d: dayIdx, e: exIdx });
    };

    const pickExercise = (dayIdx, exIdx, item) => {
        patchDays((days) => {
            const prev = days[dayIdx].exercises[exIdx];
            const suggested = (item.reps || '').split('/')[0].trim();
            days[dayIdx].exercises[exIdx] = {
                ...prev,
                name: item.name,
                reps: (!prev.reps || prev.reps === '8-12') && suggested ? suggested : prev.reps
            };
        });
        setOpenPick(null);
    };

    const moveExercise = (dayIdx, exIdx, dir) => {
        const j = exIdx + dir;
        patchDays((days) => {
            const list = days[dayIdx].exercises;
            if (j < 0 || j >= list.length) return;
            [list[exIdx], list[j]] = [list[j], list[exIdx]];
        });
    };

    const deleteExercise = (dayIdx, exIdx) => {
        patchDays((days) => { days[dayIdx].exercises.splice(exIdx, 1); });
    };

    const toggleSuperset = (dayIdx, exIdx) => {
        if (exIdx === 0) return;
        patchDays((days) => {
            const prev = days[dayIdx].exercises[exIdx];
            const next = { ...prev };
            if (next.supersetWithPrev) delete next.supersetWithPrev;
            else next.supersetWithPrev = true;
            days[dayIdx].exercises[exIdx] = next;
        });
    };

    const handleUpdateCustomDayName = (dayIdx, value) => {
        patchDays((days) => { days[dayIdx].dayName = value; });
    };

    const handleUpdateFocus = (dayIdx, value) => {
        patchDays((days) => { days[dayIdx].focus = value; });
    };

    const suggestionsFor = (query) => {
        const q = (query || '').trim().toLocaleLowerCase('tr');
        if (q.length < 1) return catalog.slice(0, 6);
        return catalog.filter((ex) => ex.name.toLocaleLowerCase('tr').includes(q) || ex.muscle.toLocaleLowerCase('tr').includes(q)).slice(0, 8);
    };

    const handleSaveCustomProgram = () => {
        if (!customProgramName.trim()) {
            toast.warning(t('builder_name_error'));
            return;
        }
        let dropped = 0;
        const days = customDays.map((day) => {
            if (day.isRestDay) return { ...day, exercises: [] };
            const exercises = (day.exercises || []).filter((ex) => {
                if (!String(ex.name || '').trim()) { dropped++; return false; }
                return true;
            });
            return { ...day, exercises };
        });
        const hasWork = days.some((d) => !d.isRestDay && d.exercises.length > 0);
        if (!hasWork) {
            toast.warning(t('builder_need_exercise'));
            return;
        }
        if (dropped) toast.info(t('builder_empty_ex'));
        setSavedAiProgram({
            programName: customProgramName.trim(),
            notes: customNotes || '',
            isCustom: true,
            days
        });
        setShowCustomBuilder(false);
        toast.success(t('builder_saved'));
    };

    const iconBtn = (active) => ({
        background: active ? 'rgba(0,195,255,0.15)' : 'transparent',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px', padding: '6px', cursor: 'pointer',
        color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    });

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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 12px 0' }}>{t('builder_hint')}</p>
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
                <div className="input-group">
                    <label>{t('builder_notes_label')}</label>
                    <textarea
                        className="neon-input"
                        placeholder={t('builder_notes_ph')}
                        value={customNotes}
                        rows={2}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        style={{ resize: 'vertical', minHeight: '64px' }}
                    />
                </div>

                {customDays.map((day, dIdx) => (
                    <div key={dIdx} style={{
                        marginBottom: '1.5rem', padding: '1rem', borderRadius: '12px',
                        background: day.isRestDay ? 'rgba(0,195,255,0.04)' : 'rgba(0,0,0,0.3)',
                        border: day.isRestDay ? '1px dashed rgba(0,195,255,0.3)' : '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                className="neon-input"
                                value={day.dayName}
                                onChange={(e) => handleUpdateCustomDayName(dIdx, e.target.value)}
                                placeholder={t('builder_day_name_placeholder')}
                                style={{ flex: '1 1 100%', padding: '0.5rem', fontSize: '1rem' }}
                            />
                            <button type="button" onClick={() => moveDay(dIdx, -1)} aria-label={t('builder_move_up')} style={iconBtn(false)}><ChevronUp size={16} /></button>
                            <button type="button" onClick={() => moveDay(dIdx, 1)} aria-label={t('builder_move_down')} style={iconBtn(false)}><ChevronDown size={16} /></button>
                            <button type="button" onClick={() => duplicateDay(dIdx)} aria-label={t('builder_duplicate_day')} style={iconBtn(false)}><Copy size={15} /></button>
                            <button
                                type="button"
                                onClick={() => toggleRestDay(dIdx)}
                                title={day.isRestDay ? t('builder_rest_to_normal') : t('builder_mark_rest')}
                                style={{ ...iconBtn(day.isRestDay), color: day.isRestDay ? '#00c3ff' : 'var(--text-light)', borderColor: day.isRestDay ? '#00c3ff' : 'rgba(255,255,255,0.15)' }}
                            >
                                <BedDouble size={16} />
                            </button>
                            <button type="button" onClick={() => deleteDay(dIdx)} aria-label={t('builder_delete_day')} disabled={customDays.length <= 1} style={{ ...iconBtn(false), color: '#ff6b81', opacity: customDays.length <= 1 ? 0.3 : 1 }}>
                                <Trash2 size={15} />
                            </button>
                        </div>

                        {!day.isRestDay && (
                            <input
                                type="text"
                                className="neon-input"
                                value={day.focus || ''}
                                onChange={(e) => handleUpdateFocus(dIdx, e.target.value)}
                                placeholder={t('builder_day_focus_ph')}
                                style={{ padding: '0.45rem', fontSize: '0.82rem', marginBottom: '0.8rem' }}
                            />
                        )}

                        {day.isRestDay ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-light)', fontSize: '0.85rem', padding: '0.4rem 0.2rem' }}>
                                <BedDouble size={18} color="#00c3ff" />
                                <span>{t('builder_rest_day_desc')}</span>
                            </div>
                        ) : (
                            <>
                                {day.exercises.map((ex, eIdx) => {
                                    const picking = openPick && openPick.d === dIdx && openPick.e === eIdx;
                                    const suggestions = picking ? suggestionsFor(ex.name) : [];
                                    return (
                                        <div key={eIdx} style={{ marginBottom: '12px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: ex.supersetWithPrev ? '1px solid rgba(255,0,136,0.35)' : '1px solid transparent' }}>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                {(ex.supersetWithPrev || day.exercises[eIdx + 1]?.supersetWithPrev) && (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ff0088', border: '1px solid #ff0088', borderRadius: '4px', padding: '1px 4px' }}>A{supersetPairIndex(day.exercises, eIdx)}</span>
                                                )}
                                                <div style={{ position: 'relative', flex: '1 1 100%', minWidth: 0 }}>
                                                    <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.45 }} />
                                                    <input
                                                        type="text"
                                                        className="neon-input"
                                                        placeholder={t('builder_exercise_placeholder')}
                                                        value={ex.name}
                                                        onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'name', e.target.value)}
                                                        onFocus={() => setOpenPick({ d: dIdx, e: eIdx })}
                                                        style={{ padding: '0.45rem 0.45rem 0.45rem 28px', width: '100%' }}
                                                    />
                                                    {picking && (
                                                        <div style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, top: '100%', marginTop: 4, background: '#16181e', border: '1px solid rgba(0,195,255,0.3)', borderRadius: 10, maxHeight: 220, overflowY: 'auto' }}>
                                                            {suggestions.length === 0 ? (
                                                                <div style={{ padding: '8px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('builder_no_match')}</div>
                                                            ) : suggestions.map((item) => (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    onMouseDown={(ev) => { ev.preventDefault(); pickExercise(dIdx, eIdx, item); }}
                                                                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', padding: '8px 10px', cursor: 'pointer', fontSize: '0.82rem' }}
                                                                >
                                                                    {item.name}
                                                                    {item.muscle && <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.72rem' }}>{item.muscle}</span>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button type="button" onClick={() => toggleSuperset(dIdx, eIdx)} disabled={eIdx === 0} title={eIdx === 0 ? t('sup_first_row_hint') : t('sup_link_hint')} style={{ ...iconBtn(ex.supersetWithPrev), color: ex.supersetWithPrev ? '#ff0088' : 'var(--text-light)', borderColor: ex.supersetWithPrev ? '#ff0088' : 'rgba(255,255,255,0.15)', opacity: eIdx === 0 ? 0.3 : 1 }}>
                                                    <Link2 size={14} />
                                                </button>
                                                <button type="button" onClick={() => moveExercise(dIdx, eIdx, -1)} aria-label={t('builder_move_up')} style={iconBtn(false)}><ChevronUp size={14} /></button>
                                                <button type="button" onClick={() => moveExercise(dIdx, eIdx, 1)} aria-label={t('builder_move_down')} style={iconBtn(false)}><ChevronDown size={14} /></button>
                                                <button type="button" onClick={() => deleteExercise(dIdx, eIdx)} aria-label={t('builder_delete_ex')} style={{ ...iconBtn(false), color: '#ff6b81' }}><Trash2 size={14} /></button>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))', gap: '6px' }}>
                                                <input type="number" className="neon-input" placeholder={t('builder_sets_placeholder')} value={ex.sets} onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'sets', e.target.value)} style={{ padding: '0.4rem', textAlign: 'center' }} />
                                                <input type="text" className="neon-input" placeholder={t('builder_reps_placeholder')} value={ex.reps} onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'reps', e.target.value)} style={{ padding: '0.4rem', textAlign: 'center' }} />
                                                <input type="number" className="neon-input" placeholder={t('builder_weight_placeholder')} value={ex.weight} onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'weight', e.target.value)} style={{ padding: '0.4rem', textAlign: 'center' }} />
                                                <input type="number" className="neon-input" placeholder={t('builder_rest_ph')} value={ex.rest || ''} onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'rest', e.target.value)} style={{ padding: '0.4rem', textAlign: 'center' }} />
                                                <input type="number" className="neon-input" placeholder={t('builder_rpe_ph')} value={ex.rpe || ''} min="1" max="10" step="0.5" onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'rpe', e.target.value)} style={{ padding: '0.4rem', textAlign: 'center' }} />
                                            </div>
                                            <input
                                                type="text"
                                                className="neon-input"
                                                placeholder={t('builder_ex_note_ph')}
                                                value={ex.notes || ''}
                                                onChange={(e) => handleUpdateCustomExercise(dIdx, eIdx, 'notes', e.target.value)}
                                                style={{ marginTop: 6, padding: '0.4rem', fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    );
                                })}
                                <button type="button" onClick={() => handleAddCustomExercise(dIdx)} className="neon-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem', width: '100%', marginTop: '0.3rem' }}>
                                    <Plus size={14} /> {t('builder_add_exercise')}
                                </button>
                            </>
                        )}
                    </div>
                ))}

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={handleAddCustomDay} className="neon-btn-secondary" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}>
                        <Plus size={18} /> {t('builder_add_day')}
                    </button>
                    <button type="button" onClick={handleAddRestDay} className="neon-btn-secondary" style={{ flex: 1, background: 'rgba(0,195,255,0.05)', borderColor: 'rgba(0,195,255,0.3)', color: '#00c3ff' }}>
                        <BedDouble size={16} /> {t('builder_add_rest_day')}
                    </button>
                </div>

                <button type="button" onClick={handleSaveCustomProgram} className="neon-btn" style={{ width: '100%', padding: '1rem' }}>
                    <Check size={20} /> {t('builder_save_btn')}
                </button>
            </div>
        </section>
    );
}

export default CustomProgramBuilder;
