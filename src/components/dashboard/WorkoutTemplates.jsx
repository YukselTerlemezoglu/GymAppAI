import React, { useMemo, useState } from 'react';
import { Zap, Trash2, Play, Save, X, Plus, Search } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';
import useLocalStorage from '../../hooks/useLocalStorage';
import { EXERCISES_DB } from '../../data/exercises';

// Antrenman sablonlari: kaydedilen egzersiz listeleri.
// Tek dokunusla aktif antrenman olarak baslatilabilir.
// Sablon formati: { id, name, createdAt, exercises: [{name, sets, reps, weight}] }
function WorkoutTemplates({ onStartTemplate }) {
    const { t, lang } = useTranslation();
    const { toast, confirmDialog } = useToast();
    const [templates, setTemplates] = useLocalStorage('gym_app_templates', []);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [manualExercises, setManualExercises] = useState('');
    // E2: veritabanindan secmeli mod
    const [inputMode, setInputMode] = useState('manual'); // 'manual' | 'picker'
    const [exSearch, setExSearch] = useState('');
    const [picked, setPicked] = useState([]); // [{name, sets, reps, weight}]
    const [newRow, setNewRow] = useState({ name: '', sets: 3, reps: '10', weight: '' });

    // Secmeli modda ekleme: isim veritabanindan ya da serbest metin
    const addPickedRow = () => {
        if (!newRow.name.trim()) return;
        setPicked(prev => [...prev, { ...newRow, name: newRow.name.trim() }]);
        setNewRow({ name: '', sets: 3, reps: '10', weight: '' });
        setExSearch('');
    };

    // Arama sonuclari (veritabani isimleri, TR+EN arama)
    const searchResults = useMemo(() => {
        const q = exSearch.trim().toLowerCase();
        if (!q) return [];
        return EXERCISES_DB
            .filter(ex => {
                const tr = (ex.name || '').toLowerCase();
                const en = (ex.name_en || '').toLowerCase();
                return tr.includes(q) || en.includes(q);
            })
            .slice(0, 8);
    }, [exSearch]);

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
        setPicked([]);
        setNewRow({ name: '', sets: 3, reps: '10', weight: '' });
    };

    // Manuel hizli sablon: satirlar "Ismi | set | tekrar | kilo" formatinda.
    // Esneklik: "3x10" birlesik yazim da kabul edilir (Bench Press | 3x10 | 40).
    const parseManualInput = (text) => {
        return text.split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
                let parts = line.split('|').map(p => p.trim());
                // "3x10" / "3X10" tek parçası: set ve tekrarı ayır
                const expand = (p) => {
                    const m = /^(\d+)\s*[x×]\s*(.+)$/i.exec(p || '');
                    return m ? [m[1], m[2]] : [p];
                };
                const expanded = [];
                parts.forEach((p, idx) => {
                    // sadece 2. alan (set bölgesi) "3x10" olabilir; sonraki
                    // alanlar (tekrar/kilo) "8-12" aralığı taşıdığından dokunulmaz
                    if (idx === 1) expanded.push(...expand(p));
                    else expanded.push(p);
                });
                parts = expanded;
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
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
                            {/* Giris modu secici: secmeli / manuel */}
                            <div className="seg-group" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px' }}>
                                <button
                                    type="button"
                                    className="seg-btn"
                                    style={{
                                        flex: 1, padding: '0.55rem', fontSize: '0.8rem', borderRadius: '6px', border: 'none',
                                        background: inputMode === 'picker' ? 'var(--accent-primary)' : 'transparent',
                                        color: inputMode === 'picker' ? '#000' : 'var(--text-light)',
                                        fontWeight: inputMode === 'picker' ? 700 : 500, cursor: 'pointer'
                                    }}
                                    onClick={() => setInputMode('picker')}
                                >
                                    {t('tpl_mode_picker')}
                                </button>
                                <button
                                    type="button"
                                    className="seg-btn"
                                    style={{
                                        flex: 1, padding: '0.55rem', fontSize: '0.8rem', borderRadius: '6px', border: 'none',
                                        background: inputMode === 'manual' ? 'var(--accent-primary)' : 'transparent',
                                        color: inputMode === 'manual' ? '#000' : 'var(--text-light)',
                                        fontWeight: inputMode === 'manual' ? 700 : 500, cursor: 'pointer'
                                    }}
                                    onClick={() => setInputMode('manual')}
                                >
                                    {t('tpl_mode_manual')}
                                </button>
                            </div>

                            {inputMode === 'picker' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                    {/* Veritabani arama + ekleme satiri */}
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                <input
                                                    type="text"
                                                    className="neon-input"
                                                    value={newRow.name}
                                                    onChange={(e) => { setNewRow(r => ({ ...r, name: e.target.value })); setExSearch(e.target.value); }}
                                                    placeholder={t('tpl_search_ph')}
                                                    style={{ paddingLeft: '30px', fontSize: '0.85rem' }}
                                                    maxLength={50}
                                                />
                                            </div>
                                            <input type="number" min="1" max="20" className="neon-input" value={newRow.sets} onChange={(e) => setNewRow(r => ({ ...r, sets: parseInt(e.target.value) || 1 }))} style={{ width: '58px', textAlign: 'center', fontSize: '0.85rem' }} title={t('tpl_sets')} />
                                            <input type="text" className="neon-input" value={newRow.reps} onChange={(e) => setNewRow(r => ({ ...r, reps: e.target.value }))} style={{ width: '64px', textAlign: 'center', fontSize: '0.85rem' }} title={t('tpl_reps')} />
                                            <input type="text" className="neon-input" value={newRow.weight} onChange={(e) => setNewRow(r => ({ ...r, weight: e.target.value }))} style={{ width: '64px', textAlign: 'center', fontSize: '0.85rem' }} placeholder="kg" title={t('tpl_weight')} />
                                            <button onClick={addPickedRow} className="icon-btn" style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', flexShrink: 0 }} title={t('tpl_add_row')}>
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        {/* Arama sonuclari dropdown */}
                                        {searchResults.length > 0 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(10,14,20,0.98)', border: '1px solid rgba(0,195,255,0.3)', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '220px', overflowY: 'auto' }}>
                                                {searchResults.map(ex => (
                                                    <button
                                                        key={ex.id}
                                                        onClick={() => {
                                                            setNewRow(r => ({ ...r, name: lang === 'en' ? (ex.name_en || ex.name) : ex.name }));
                                                            setExSearch('');
                                                        }}
                                                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                    >
                                                        {lang === 'en' ? (ex.name_en || ex.name) : ex.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Eklenen satirlar */}
                                    {picked.length === 0 ? (
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.78rem', margin: 0, opacity: 0.8 }}>{t('tpl_picker_hint')}</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {picked.map((p, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(0,195,255,0.07)', borderRadius: '8px' }}>
                                                    <span style={{ color: '#fff', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i + 1}. {p.name}</span>
                                                    <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', flexShrink: '0' }}>{p.sets}×{p.reps}{p.weight ? ` · ${p.weight}kg` : ''}</span>
                                                    <button onClick={() => setPicked(picked.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: 'rgba(255,100,100,0.7)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
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
                            )}
                            <button
                                onClick={() => saveTemplate(newName, inputMode === 'picker' ? picked : parseManualInput(manualExercises))}
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
