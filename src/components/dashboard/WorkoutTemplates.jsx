import React, { useState } from 'react';
import { Zap, Trash2, Play, Save, X } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';
import useLocalStorage from '../../hooks/useLocalStorage';

// Antrenman sablonlari: kaydedilen egzersiz listeleri.
// Tek dokunusla aktif antrenman olarak baslatilabilir.
// Sablon formati: { id, name, createdAt, exercises: [{name, sets, reps, weight}] }
function WorkoutTemplates({ onStartTemplate }) {
    const { t } = useTranslation();
    const { toast, confirmDialog } = useToast();
    const [templates, setTemplates] = useLocalStorage('gym_app_templates', []);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [manualExercises, setManualExercises] = useState('');

    const saveTemplate = (name, exercises) => {
        if (!name.trim()) {
            toast.warning(t('tpl_name_error'));
            return;
        }
        if (!exercises || exercises.length === 0) {
            toast.warning(t('tpl_empty_error'));
            return;
        }
        const tpl = {
            id: Date.now(),
            name: name.trim(),
            createdAt: new Date().toISOString(),
            exercises
        };
        setTemplates([tpl, ...templates]);
        toast.success(t('tpl_saved'));
        setShowSaveModal(false);
        setNewName('');
        setManualExercises('');
    };

    // Manuel hizli sablon: satirlar "Ismi | set | tekrar | kilo" formatinda
    const parseManualInput = (text) => {
        return text.split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
                const parts = line.split('|').map(p => p.trim());
                return {
                    name: parts[0] || 'Egzersiz',
                    sets: parseInt(parts[1]) || 3,
                    reps: parts[2] || '10',
                    weight: parts[3] || ''
                };
            });
    };

    const deleteTemplate = async (tpl) => {
        const ok = await confirmDialog({
            title: t('tpl_delete_confirm_title'),
            message: t('tpl_delete_confirm_msg').replace('{name}', tpl.name),
            confirmLabel: t('tpl_delete_yes'),
            cancelLabel: t('tpl_cancel'),
            danger: true
        });
        if (!ok) return;
        setTemplates(templates.filter(x => x.id !== tpl.id));
        toast.info(t('tpl_deleted'));
    };

    const startTemplate = (tpl) => {
        haptic(12);
        onStartTemplate({
            dayName: tpl.name,
            exercises: tpl.exercises.map(e => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                weight: e.weight
            }))
        });
    };

    return (
        <div className="glass-card slide-in" style={{ animationDelay: '0.1s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={20} color="#ffd700" /> {t('tpl_title')}
                </h3>
                <button
                    onClick={() => setShowSaveModal(true)}
                    className="neon-btn"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <Save size={14} /> {t('tpl_new')}
                </button>
            </div>

            {templates.length === 0 ? (
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0 }}>
                    {t('tpl_empty_hint')}
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {templates.map(tpl => (
                        <div key={tpl.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.name}</strong>
                                <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>
                                    {tpl.exercises.length} {t('tpl_ex_count')} · {tpl.exercises.reduce((s, e) => s + (parseInt(e.sets) || 0), 0)} {t('tpl_sets_total')}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button
                                    onClick={() => startTemplate(tpl)}
                                    style={{ background: 'rgba(0,195,255,0.15)', border: '1px solid rgba(0,195,255,0.4)', color: '#00c3ff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                                >
                                    <Play size={13} /> {t('tpl_start')}
                                </button>
                                <button
                                    onClick={() => deleteTemplate(tpl)}
                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,100,100,0.7)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                                    title={t('tpl_delete')}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Yeni sablon modal */}
            {showSaveModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }} onClick={() => setShowSaveModal(false)}>
                    <div className="glass-card" style={{ maxWidth: '480px', width: '100%', margin: 0 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: '#fff', margin: 0 }}>{t('tpl_modal_title')}</h3>
                            <button onClick={() => setShowSaveModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>{t('tpl_name_label')}</label>
                                <input
                                    type="text"
                                    className="neon-input"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    maxLength={40}
                                    placeholder={t('tpl_name_placeholder')}
                                />
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>{t('tpl_manual_label')}</label>
                                <textarea
                                    className="neon-input"
                                    rows={6}
                                    value={manualExercises}
                                    onChange={e => setManualExercises(e.target.value)}
                                    placeholder={t('tpl_manual_placeholder')}
                                    style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
                                />
                                <p style={{ color: 'var(--text-light)', fontSize: '0.7rem', margin: '4px 0 0 0', opacity: 0.7 }}>{t('tpl_manual_hint')}</p>
                            </div>
                            <button
                                onClick={() => saveTemplate(newName, parseManualInput(manualExercises))}
                                className="neon-btn"
                                style={{ padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                            >
                                <Save size={16} /> {t('tpl_save_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorkoutTemplates;
