import React from 'react';
import { Bot, Trash2, Check, Play, Info, BedDouble } from 'lucide-react';
import ExerciseModal from '../workout/ExerciseModal';
import { useTranslation } from '../../i18n/LanguageContext';

function SavedProgramPreview({
    savedAiProgram,
    showCustomBuilder,
    completedDays,
    clearAiProgram,
    startActiveAiWorkout,
    handleUpdateAiProgram
}) {
    const { t, lang } = useTranslation();
    const [selectedExerciseForModal, setSelectedExerciseForModal] = React.useState(null);

    if (!savedAiProgram || showCustomBuilder) return null;

    return (
        <section className="recent-activity fade-in" style={{ animationDelay: '0.25s', marginBottom: '3rem' }}>
            <div className="section-header">
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={20} color="var(--accent-primary)" /> {savedAiProgram.programName || t('preview_active_program_default')}
                </h2>
                <button onClick={clearAiProgram} className="clear-btn" aria-label={t('preview_delete_program')}>
                    <Trash2 size={14} /> {t('preview_delete_program')}
                </button>
            </div>
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="json-program-preview" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                    {(savedAiProgram?.days || []).map((day, dIdx) => (
                        <div key={dIdx} style={{
                            marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '12px',
                            background: day.isRestDay ? 'rgba(0,195,255,0.04)' : 'rgba(0,0,0,0.3)',
                            border: day.isRestDay ? '1px dashed rgba(0,195,255,0.3)' : 'none'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                <h4 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {day.isRestDay && <BedDouble size={16} color="#00c3ff" />}
                                    {day.dayName}
                                    {day.isRestDay && (
                                        <span style={{ fontSize: '0.75rem', background: 'rgba(0,195,255,0.15)', color: '#00c3ff', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {t('preview_rest_tag')}
                                        </span>
                                    )}
                                    {completedDays.includes(dIdx) && (
                                        <span style={{ fontSize: '0.75rem', background: 'rgba(0, 255, 136, 0.2)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Check size={12} /> {t('preview_completed')}
                                        </span>
                                    )}
                                </h4>
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
                                        <button onClick={() => startActiveAiWorkout(dIdx, day)} className="neon-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', opacity: 0.5 }}>
                                            {t('preview_repeat_workout')}
                                        </button>
                                    )
                                )}
                            </div>
                            {!day.isRestDay && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {(day?.exercises || []).map((ex, eIdx) => (
                                    <div key={eIdx} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 200px', gap: '8px' }}>
                                            <span style={{ color: 'var(--text-light)', fontWeight: '500' }}>{ex.name}</span>
                                            <button
                                                onClick={() => setSelectedExerciseForModal(ex.name)}
                                                style={{ background: 'transparent', border: 'none', color: '#00c3ff', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}
                                                title={t('preview_exercise_info')}
                                            >
                                                <Info size={16} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', alignItems: 'center', flexWrap: 'nowrap' }}>
                                            <span style={{ color: 'var(--accent-secondary)' }}>{ex.sets} {t('preview_sets')}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px 6px' }}>
                                                <input
                                                    type="text"
                                                    value={ex.weight}
                                                    onChange={(e) => handleUpdateAiProgram(dIdx, eIdx, 'weight', e.target.value)}
                                                    style={{ width: ex.weight === 'BW' ? '30px' : '40px', background: 'transparent', border: 'none', color: 'var(--accent-primary)', textAlign: 'right', fontWeight: 'bold' }}
                                                />
                                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{ex.weight === 'BW' ? (lang === 'tr' ? 'vücut' : 'body') : t('preview_weight_short')}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px 6px' }}>
                                                <input
                                                    type="text"
                                                    value={ex.reps}
                                                    onChange={(e) => handleUpdateAiProgram(dIdx, eIdx, 'reps', e.target.value)}
                                                    style={{ width: '50px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'right', fontWeight: 'bold' }}
                                                />
                                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{t('preview_reps_short').charAt(0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Exercise Info Modal */}
            {selectedExerciseForModal && (
                <ExerciseModal
                    exerciseName={selectedExerciseForModal}
                    onClose={() => setSelectedExerciseForModal(null)}
                />
            )}
        </section>
    );
}

export default SavedProgramPreview;
