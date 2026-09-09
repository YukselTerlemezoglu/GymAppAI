import React, { useEffect, useState } from 'react';
import { X, PlayCircle, Info, AlertTriangle, Target, Repeat, Youtube, Film } from 'lucide-react';
import { findExerciseByName } from '../../data/exercises';
import { resolveExerciseVideo, youtubeSearchUrl } from '../../utils/exerciseVideo';
import { useLanguage } from '../../i18n/LanguageContext';

function ExerciseModal({ exerciseName, onClose }) {
    const { t, lang } = useLanguage();
    const ex = findExerciseByName(exerciseName);
    const isEn = lang === 'en';

    const name = ex ? (isEn ? (ex.name_en || ex.name) : ex.name) : exerciseName;

    // Video kaynagi async cozulur (wger katalogu lazy yuklenir)
    const [video, setVideo] = useState(null); // null = hesaplaniyor
    const [videoLoaded, setVideoLoaded] = useState(false);
    useEffect(() => {
        let alive = true;
        resolveExerciseVideo(exerciseName).then(v => { if (alive) setVideo(v); });
        return () => { alive = false; };
    }, [exerciseName]);

    const primary = ex ? (isEn ? (ex.primaryMuscles_en || ex.primaryMuscles) : ex.primaryMuscles) : null;
    const secondary = ex ? (isEn ? (ex.secondaryMuscles_en || ex.secondaryMuscles) : ex.secondaryMuscles) : null;
    const repRange = ex ? (isEn ? (ex.repRange_en || ex.repRange) : ex.repRange) : null;
    const tips = ex ? (isEn ? (ex.tips_en || ex.tips) : ex.tips) : null;
    const mistakes = ex ? (isEn ? (ex.commonMistakes_en || ex.commonMistakes) : ex.commonMistakes) : null;

    return (
        <div className="modal-overlay fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
            {/* Click outside to close */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onClick={onClose} />

            <div className="glass-card slide-in" style={{ position: 'relative', width: '100%', maxWidth: '450px', background: '#1a1a2e', padding: '0', overflow: 'hidden', border: '1px solid var(--accent-primary)' }}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.1rem' }}>
                        <PlayCircle size={20} color="var(--accent-primary)" />
                        {name}
                    </h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                    {/* ---------- VIDEO BOLUMU ---------- */}
                    {video && (video.mp4 || video.youtube) && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            {video.mp4 ? (
                                // wger mp4: dogrudan akar, otomatik sessiz oynatma
                                <video
                                    src={video.mp4}
                                    controls
                                    playsInline
                                    preload="metadata"
                                    loop
                                    style={{ width: '100%', borderRadius: '10px', display: 'block', background: '#000', aspectRatio: '16/9', objectFit: 'contain' }}
                                />
                            ) : (
                                // YouTube embed: tiklayinca yuklenir (hafif + mobil guvenli)
                                videoLoaded ? (
                                    <iframe
                                        src={video.youtube}
                                        title={`${name} video`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: '10px', display: 'block' }}
                                    />
                                ) : (
                                    <button
                                        onClick={() => setVideoLoaded(true)}
                                        style={{ width: '100%', aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(255,0,0,0.15), rgba(0,0,0,0.6))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '1rem' }}
                                    >
                                        <Youtube size={44} color="#ff4e45" />
                                        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>{t('ex_modal_watch_form')}</span>
                                        <span style={{ color: 'var(--text-light)', fontSize: '0.7rem' }}>{t('ex_modal_video_tap')}</span>
                                    </button>
                                )
                            )}
                        </div>
                    )}

                    {ex ? (
                        <>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
                                {ex.difficulty && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', background: 'rgba(0, 195, 255, 0.12)', padding: '3px 10px', borderRadius: '12px' }}>
                                        {isEn ? (ex.difficulty_en || ex.difficulty) : ex.difficulty}
                                    </span>
                                )}
                                {ex.equipment && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', background: 'rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: '12px' }}>
                                        🏋️ {isEn ? (ex.equipment_en || ex.equipment) : ex.equipment}
                                    </span>
                                )}
                                {ex.type && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', background: 'rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: '12px' }}>
                                        {ex.type === 'compound' ? (isEn ? 'Compound' : 'Bileşik') : ex.type === 'isometry' ? (isEn ? 'Isometric' : 'İzometrik') : (isEn ? 'Isolation' : 'İzolasyon')}
                                    </span>
                                )}
                            </div>

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
                <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px' }}>
                    <a
                        href={youtubeSearchUrl(name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neon-btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', flex: '0 0 auto' }}
                    >
                        <Film size={15} /> {t('ex_modal_yt_search')}
                    </a>
                    <button onClick={onClose} className="neon-btn-secondary" style={{ flex: 1 }}>
                        {t('ex_modal_close_btn')}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ExerciseModal;
