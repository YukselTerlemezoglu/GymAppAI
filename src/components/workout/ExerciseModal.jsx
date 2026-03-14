import React from 'react';
import { X, PlayCircle, Info } from 'lucide-react';
import { findExerciseData } from '../../data/exerciseLibrary';

function ExerciseModal({ exerciseName, onClose }) {
    const exData = findExerciseData(exerciseName);

    return (
        <div className="modal-overlay fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
            {/* Click outside to close */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onClick={onClose} />

            <div className="glass-card slide-in" style={{ position: 'relative', width: '100%', maxWidth: '450px', background: '#1a1a2e', padding: '0', overflow: 'hidden', border: '1px solid var(--accent-primary)' }}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <PlayCircle size={20} color="var(--accent-primary)" />
                        {exData ? exData.name : exerciseName}
                    </h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                    {exData ? (
                        <>

                            <div style={{ marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', background: 'rgba(0, 195, 255, 0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                                    💪 Hedef: {exData.muscle}
                                </span>
                            </div>

                            <h4 style={{ color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Info size={16} color="var(--accent-warning)" /> Koçun İpuçları
                            </h4>

                            <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.6' }}>
                                {exData.tips.map((tip, idx) => (
                                    <li key={idx} style={{ marginBottom: '8px' }}>{tip}</li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-light)' }}>
                            <Info size={48} color="var(--accent-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Bu egzersiz kütüphanede bulunamadı. Yapılışını bir antrenöre veya internete sorabilirsin!</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={onClose} className="neon-btn-secondary" style={{ width: '100%' }}>
                        ANLADIM, İDMANA DÖN
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ExerciseModal;
