import React from 'react';
import { Bot, Trash2, Check, Play, Info, BedDouble, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import ExerciseModal from '../workout/ExerciseModal';
import { useTranslation } from '../../i18n/LanguageContext';
import { suggestAlternatives } from '../../utils/readiness';
import { AlertTriangle, Repeat } from 'lucide-react';

const emptyExercise = () => ({ name: '', sets: '3', reps: '8-12', weight: '', rest: '90', rpe: '', notes: '' });

function SavedProgramPreview({
    savedAiProgram,
    painData,
    completedDays,
    clearAiProgram,
    startActiveAiWorkout,
    handleUpdateAiProgram,
    patchAiProgram
}) {
    const { t } = useTranslation();
    const [selectedExerciseForModal, setSelectedExerciseForModal] = React.useState(null);

    if (!savedAiProgram) return null;

    const altSuggestions = suggestAlternatives(savedAiProgram, painData?.pain || null);
    const patch = (fn) => patchAiProgram?.(fn);
    const fieldStyle = { padding: '0.4rem', fontSize: '0.85rem' };

    const updateDay = (dayIdx, field, value) => {
        patch((program) => {
            if (!program.days?.[dayIdx]) return;
            program.days[dayIdx][field] = value;
        });
    };

    const moveDay = (idx, dir) => {
        patch((program) => {
            const j = idx + dir;
            if (!program.days || j < 0 || j >= program.days.length) return;
            const next = program.days;
            [next[idx], next[j]] = [next[j], next[idx]];
        });
    };

    const deleteDay = (idx) => {
        patch((program) => {
            if (!program.days || program.days.length <= 1) return;
            program.days.splice(idx, 1);
        });
    };

    const toggleRest = (idx) => {
        patch((program) => {
            const day = program.days?.[idx];
            if (!day) return;
            if (day.isRestDay) {
                delete day.isRestDay;
                if (!day.exercises?.length) day.exercises = [emptyExercise()];
            } else {
                day.isRestDay = true;
                day.exercises = [];
            }
        });
    };

    const addDay = (rest) => {
        patch((program) => {
            if (!Array.isArray(program.days)) program.days = [];
            if (program.days.length >= 7) return;
            program.days.push(rest
                ? { dayName: t('builder_rest_day_name'), focus: '', exercises: [], isRestDay: true }
                : { dayName: t('builder_default_day_name', { num: program.days.length + 1 }), focus: '', exercises: [emptyExercise()] });
        });
    };

    const addExercise = (dayIdx) => {
        patch((program) => {
            const day = program.days?.[dayIdx];
            if (!day || day.isRestDay) return;
            if (!Array.isArray(day.exercises)) day.exercises = [];
            day.exercises.push(emptyExercise());
        });
    };

    const moveExercise = (dayIdx, exIdx, dir) => {
        patch((program) => {
            const list = program.days?.[dayIdx]?.exercises;
            const j = exIdx + dir;
            if (!list || j < 0 || j >= list.length) return;
            [list[exIdx], list[j]] = [list[j], list[exIdx]];
        });
    };

    const deleteExercise = (dayIdx, exIdx) => {
        patch((program) => {
            program.days?.[dayIdx]?.exercises?.splice(exIdx, 1);
        });
    };

    return (
        <section className="recent-activity fade-in" style={{ animationDelay: '0.25s', marginBottom: '1rem' }}>
            <div className="section-header">
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Bot size={20} color="var(--accent-primary)" />
                    <input
                        type="text"
                        className="neon-input"
                        value={savedAiProgram.programName || ''}
                        placeholder={t('preview_active_program_default')}
                        onChange={(e) => patch((program) => { program.programName = e.target.value; })}
                        style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '1rem' }}
                    />
                </h2>
                <button onClick={clearAiProgram} className="clear-btn" aria-label={t('preview_delete_program')}>
                    <Trash2 size={14} /> {t('preview_delete_program')}
                </button>
            </div>
            <textarea
                className="neon-input"
                value={savedAiProgram.notes || ''}
                placeholder={t('builder_notes_ph')}
                rows={2}
                onChange={(e) => patch((program) => { program.notes = e.target.value; })}
                style={{ width: '100%', resize: 'vertical', minHeight: '52px', marginBottom: '12px' }}
            />
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="json-program-preview" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                    {(savedAiProgram?.days || []).map((day, dIdx) => (
                        <div key={dIdx} style={{
                            marginBottom: '0', padding: '1.5rem', borderRadius: '12px',
                            background: day.isRestDay ? 'rgba(0,195,255,0.04)' : 'rgba(0,0,0,0.3)',
                            border: day.isRestDay ? '1px dashed rgba(0,195,255,0.3)' : 'none'
                        }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    className="neon-input"
                                    value={day.dayName || ''}
                                    onChange={(e) => updateDay(dIdx, 'dayName', e.target.value)}
                                    style={{ flex: '1 1 140px', ...fieldStyle }}
                                />
                                <button type="button" onClick={() => moveDay(dIdx, -1)} aria-label={t('builder_move_up')} className="icon-btn"><ChevronUp size={16} /></button>
                                <button type="button" onClick={() => moveDay(dIdx, 1)} aria-label={t('builder_move_down')} className="icon-btn"><ChevronDown size={16} /></button>
                                <button type="button" onClick={() => toggleRest(dIdx)} aria-label={t('builder_mark_rest')} className="icon-btn" style={{ color: day.isRestDay ? '#00c3ff' : undefined }}><BedDouble size={16} /></button>
                                <button type="button" onClick={() => deleteDay(dIdx)} aria-label={t('builder_delete_day')} className="icon-btn" disabled={(savedAiProgram.days || []).length <= 1}><Trash2 size={15} /></button>
                            </div>
                            {!day.isRestDay && (
                                <input
                                    type="text"
                                    className="neon-input"
                                    value={day.focus || ''}
                                    placeholder={t('builder_day_focus_ph')}
                                    onChange={(e) => updateDay(dIdx, 'focus', e.target.value)}
                                    style={{ ...fieldStyle, marginBottom: '0.7rem' }}
                                />
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.8rem' }}>
                                {day.isRestDay ? (
                                    <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <BedDouble size={16} color="#00c3ff" /> {t('preview_rest_desc')}
                                    </span>
                                ) : (
                                    !completedDays.includes(dIdx) ? (
                                        <button onClick={() => startActiveAiWorkout(dIdx, day)} className="neon-btn" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                                            <Play size={14} fill="currentColor" /> {t('preview_start_workout')}
                                        </button>
                                    ) : (
                                        <button onClick={() => startActiveAiWorkout(dIdx, day)} className="neon-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', opacity: 0.7 }}>
                                            {t('preview_repeat_workout')}
                                        </button>
                                    )
                                )}
                            </div>
                            {!day.isRestDay && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {(day?.exercises || []).map((ex, eIdx) => (
                                        <div key={eIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                                                <input
                                                    type="text"
                                                    className="neon-input"
                                                    value={ex.name || ''}
                                                    placeholder={t('builder_exercise_placeholder')}
                                                    onChange={(e) => handleUpdateAiProgram(dIdx, eIdx, 'name', e.target.value)}
                                                    style={{ flex: 1, ...fieldStyle }}
                                                />
                                                <button type="button" onClick={() => setSelectedExerciseForModal(ex.name)} style={{ background: 'transparent', border: 'none', color: '#00c3ff', cursor: 'pointer', padding: 0 }} title={t('preview_exercise_info')}>
                                                    <Info size={16} />
                                                </button>
                                                <button type="button" onClick={() => moveExercise(dIdx, eIdx, -1)} aria-label={t('builder_move_up')} className="icon-btn"><ChevronUp size={14} /></button>
                                                <button type="button" onClick={() => moveExercise(dIdx, eIdx, 1)} aria-label={t('builder_move_down')} className="icon-btn"><ChevronDown size={14} /></button>
                                                <button type="button" onClick={() => deleteExercise(dIdx, eIdx)} aria-label={t('builder_delete_ex')} className="icon-btn"><Trash2 size={14} /></button>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))', gap: '6px' }}>
                                                <input className="neon-input" placeholder={t('builder_sets_placeholder')} value={ex.sets ?? ''} onChange={(e) => handleUpdateAiProgram(dIdx, eIdx, 'sets', e.target.value)} style={fieldStyle} />
                                                <input className="neon-input" placeholder={t('builder_reps_placeholder')} value={ex.reps ?? ''} onChange={(e) => handleUpdateAiProgram(dIdx, eIdx, 'reps', e.target.value)} style={fieldStyle} />
                                                <input className="neon-input" placeholder={t('builder_weight_placeholder')} value={ex.weight ?? ''} onChange={(e) => handleUpdateAiProgram(dIdx, eIdx, 'weight', e.target.value)} style={fieldStyle} />
                                                <input className="neon-input" placeholder={t('builder_rest_ph')} value={ex.rest ?? ''} onChange={(e) => handleUpdateAiProgram(dIdx, eIdx, 'rest', e.target.value)} style={fieldStyle} />
                                            </div>
                                            <input
                                                className="neon-input"
                                                placeholder={t('builder_ex_note_ph')}
                                                value={ex.notes || ''}
                                                onChange={(e) => handleUpdateAiProgram(dIdx, eIdx, 'notes', e.target.value)}
                                                style={{ ...fieldStyle, marginTop: 6 }}
                                            />
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addExercise(dIdx)} className="neon-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem' }}>
                                        <Plus size={14} /> {t('builder_add_exercise')}
                                    </button>
                                </div>
                            )}
                            {completedDays.includes(dIdx) && !day.isRestDay && (
                                <span style={{ display: 'inline-flex', marginTop: '0.6rem', fontSize: '0.75rem', background: 'rgba(0, 255, 136, 0.2)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '12px', alignItems: 'center', gap: '4px' }}>
                                    <Check size={12} /> {t('preview_completed')}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1.5rem 1.2rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => addDay(false)} className="neon-btn-secondary" style={{ flex: 1 }}>
                        <Plus size={16} /> {t('builder_add_day')}
                    </button>
                    <button type="button" onClick={() => addDay(true)} className="neon-btn-secondary" style={{ flex: 1, color: '#00c3ff' }}>
                        <BedDouble size={16} /> {t('builder_add_rest_day')}
                    </button>
                </div>
            </div>

            {selectedExerciseForModal && (
                <ExerciseModal
                    exerciseName={selectedExerciseForModal}
                    onClose={() => setSelectedExerciseForModal(null)}
                />
            )}
            {altSuggestions.length > 0 && (
                <div className="glass-card fade-in" style={{ marginTop: '1rem', padding: '1rem 1.2rem', borderLeft: '4px solid #ffa502', background: 'rgba(255,165,2,0.06)' }}>
                    <h4 style={{ color: '#ffa502', margin: '0 0 0.6rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={16} /> {t('alt_suggest_title')}
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-light)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {altSuggestions.map((a, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Repeat size={12} color="#ffa502" />
                                <span><b style={{ color: '#fff' }}>{a.from}</b> → <b style={{ color: '#00ff88' }}>{a.to}</b></span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}

export default SavedProgramPreview;
