import React from 'react';
import { X, PlayCircle, Info, AlertTriangle, Target, Repeat } from 'lucide-react';
import { findExerciseData } from '../../data/exerciseLibrary';
import { EXERCISES_DB } from '../../data/exercises';
import { useTranslation } from '../../i18n/LanguageContext';

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9ğüşıöç ]/gi, '').trim();

function findRichExerciseData(exerciseName) {
    if (!exerciseName) return null;
    const target = norm(exerciseName);
    if (!target) return null;
    return EXERCISES_DB.find(ex =>
        norm(ex.name) === target ||
        norm(ex.name_en) === target ||
        norm(ex.name).includes(target) ||
        target.includes(norm(ex.name)) ||
        norm(ex.name_en).includes(target) ||
        target.includes(norm(ex.name_en))
    ) || null;
}

function ExerciseModal({ exerciseName, onClose }) {
    const { t, lang } = useTranslation();
    const exData = findExerciseData(exerciseName);
    const richData = findRichExerciseData(exerciseName);
    const isEn = lang === 'en';

    const primary = richData ? (isEn ? (richData.primaryMuscles_en || richData.primaryMuscles) : richData.primaryMuscles) : null;
    const secondary = richData ? (isEn ? (richData.secondaryMuscles_en || richData.secondaryMuscles) : richData.secondaryMuscles) : null;
    const repRange = richData ? (isEn ? (richData.repRange_en || richData.repRange) : richData.repRange) : null;
    const mistakes = richData ? (isEn ? (richData.commonMistakes_en || richData.commonMistakes) : richData.commonMistakes) : null;
    const tips = exData ? exData.tips : (richData ? (isEn ? (richData.tips_en || richData.tips) : richData.tips) : null);
    const targetText = exData ? exData.muscle : (primary ? primary.join(', ') : null);

    return (
        <div className="modal-overlay fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
            {/* Click outside to close */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onClick={onClose} />

            <div className="glass-card slide-in" style={{ position: 'relative', width: '100%', maxWidth: '450px', background: '#1a1a2e', padding: '0', overflow: 'hidden', border: '1px solid var(--accent-primary)' }}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <PlayCircle size={20} color="var(--accent-primary)" />
                        {exData ? exData.name : (richData ? (isEn ? richData.name_en : richData.name) : exerciseName)}
                    </h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                    {(exData || richData) ? (
                        <>

                            {targetText && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', background: 'rgba(0, 195, 255, 0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                                        💪 {t('ex_modal_target')}: {targetText}
                                    </span>
                                </div>
                            )}

                            {richData && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
                                    {richData.difficulty && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', background: 'rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: '12px' }}>
                                            {isEn ? (richData.difficulty_en || richData.difficulty) : richData.difficulty}
                                        </span>
                                    )}
                                    {richData.equipment && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', background: 'rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: '12px' }}>
                                            🏋️ {isEn ? (richData.equipment_en || richData.equipment) : richData.equipment}
                                        </span>
                                    )}
                                </div>
                            )}

                            {primary && primary.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                    <Target size={15} color="#4ade80" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                        <strong>{t('anatomy_primary')}:</strong> {primary.join(', ')}
                                    </span>
                                </div>
                            )}

                            {secondary && secondary.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                    <Target size={15} color="var(--accent-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                        <strong>{t('anatomy_secondary')}:</strong> {secondary.join(', ')}
                                    </span>
                                </div>
                            )}

                            {repRange && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '1rem' }}>
                                    <Repeat size={15} color="var(--accent-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                        <strong>{t('anatomy_rep_range')}:</strong> {repRange}
                                    </span>
                                </div>
                            )}

                            {tips && tips.length > 0 && (
                                <>
                                    <h4 style={{ color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Info size={16} color="var(--accent-warning)" /> {t('ex_modal_coach_tips')}
                                    </h4>

                                    <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.6', margin: '0 0 1rem 0' }}>
                                        {tips.map((tip, idx) => (
                                            <li key={idx} style={{ marginBottom: '8px' }}>{tip}</li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {mistakes && mistakes.length > 0 && (
                                <>
                                    <h4 style={{ color: '#f87171', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <AlertTriangle size={16} /> {t('anatomy_mistakes')}
                                    </h4>
                                    <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.6', margin: 0 }}>
                                        {mistakes.map((m, idx) => (
                                            <li key={idx} style={{ marginBottom: '8px' }}>{m}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-light)' }}>
                            <Info size={48} color="var(--accent-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>{t('ex_modal_not_found')}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={onClose} className="neon-btn-secondary" style={{ width: '100%' }}>
                        {t('ex_modal_close_btn')}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ExerciseModal;
