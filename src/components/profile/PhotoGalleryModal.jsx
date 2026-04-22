import React, { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';

function PhotoGalleryModal({ photos, metrics, onClose }) {
    // Sadece fotoğrafı olan kayıtları alıp tarihe göre sıralayalım
    const photoMetrics = metrics.filter(m => m.hasPhoto && photos[m.id]).sort((a, b) => new Date(a.date) - new Date(b.date));

    const [mode, setMode] = useState('gallery'); // 'gallery' veya 'compare'
    const [currentIndex, setCurrentIndex] = useState(photoMetrics.length > 0 ? photoMetrics.length - 1 : 0);

    const [compareBeforeId, setCompareBeforeId] = useState(photoMetrics.length > 1 ? photoMetrics[0].id : null);
    const [compareAfterId, setCompareAfterId] = useState(photoMetrics.length > 0 ? photoMetrics[photoMetrics.length - 1].id : null);

    if (photoMetrics.length === 0) {
        return (
            <div className="modal-overlay">
                <div className="glass-card fade-in" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                    <ImageIcon size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ color: 'white' }}>Henüz Fotoğraf Yok</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Ölçüm eklerken fotoğraf yükleyerek gelişiminizi takip edebilirsiniz.</p>
                </div>
            </div>
        );
    }

    const currentMetric = photoMetrics[currentIndex];

    return (
        <div className="modal-overlay" style={{ zIndex: 9999, padding: '1rem' }}>
            <div className="glass-card slide-in" style={{ width: '100%', maxWidth: '800px', height: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => setMode('gallery')} 
                            className="neon-btn"
                            style={{ 
                                padding: '0.5rem 1rem', 
                                fontSize: '0.9rem', 
                                background: mode === 'gallery' ? 'rgba(0, 195, 255, 0.2)' : 'transparent',
                                borderColor: mode === 'gallery' ? '#00c3ff' : 'rgba(255,255,255,0.2)',
                                color: mode === 'gallery' ? '#00c3ff' : 'white',
                                width: 'auto'
                            }}
                        >
                            Galeri
                        </button>
                        {photoMetrics.length > 1 && (
                            <button 
                                onClick={() => setMode('compare')} 
                                className="neon-btn"
                                style={{ 
                                    padding: '0.5rem 1rem', 
                                    fontSize: '0.9rem', 
                                    background: mode === 'compare' ? 'rgba(255, 0, 136, 0.2)' : 'transparent',
                                    borderColor: mode === 'compare' ? '#ff0088' : 'rgba(255,255,255,0.2)',
                                    color: mode === 'compare' ? '#ff0088' : 'white',
                                    width: 'auto'
                                }}
                            >
                                Öncesi / Sonrası
                            </button>
                        )}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                    
                    {mode === 'gallery' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
                                <button 
                                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentIndex === 0}
                                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.3 : 1 }}
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <div style={{ textAlign: 'center' }}>
                                    <h3 style={{ margin: 0, color: 'var(--accent-primary)' }}>{new Date(currentMetric.date).toLocaleDateString('tr-TR')}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                        {currentMetric.weight ? `${currentMetric.weight} kg` : ''} 
                                        {currentMetric.bodyFat ? ` | %${currentMetric.bodyFat} Yağ` : ''}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => setCurrentIndex(prev => Math.min(photoMetrics.length - 1, prev + 1))}
                                    disabled={currentIndex === photoMetrics.length - 1}
                                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: currentIndex === photoMetrics.length - 1 ? 'not-allowed' : 'pointer', opacity: currentIndex === photoMetrics.length - 1 ? 0.3 : 1 }}
                                >
                                    <ArrowRight size={24} />
                                </button>
                            </div>
                            
                            <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', background: 'rgba(0,0,0,0.5)', borderRadius: '12px' }}>
                                <img 
                                    src={photos[currentMetric.id]} 
                                    alt="Gelişim" 
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'compare' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <label style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Öncesi (Before)</label>
                                    <select 
                                        className="neon-input" 
                                        value={compareBeforeId} 
                                        onChange={(e) => setCompareBeforeId(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.5)' }}
                                    >
                                        {photoMetrics.map(m => (
                                            <option key={m.id} value={m.id}>{new Date(m.date).toLocaleDateString('tr-TR')} {m.weight ? `(${m.weight}kg)` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <label style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Sonrası (After)</label>
                                    <select 
                                        className="neon-input" 
                                        value={compareAfterId} 
                                        onChange={(e) => setCompareAfterId(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.5)' }}
                                    >
                                        {photoMetrics.map(m => (
                                            <option key={m.id} value={m.id}>{new Date(m.date).toLocaleDateString('tr-TR')} {m.weight ? `(${m.weight}kg)` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ flex: 1, display: 'flex', gap: '1rem', overflow: 'hidden' }}>
                                {/* Before Image */}
                                <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', zIndex: 10 }}>ÖNCESİ</div>
                                    <img 
                                        src={photos[compareBeforeId]} 
                                        alt="Öncesi" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                
                                {/* After Image */}
                                <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#ff0088', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', zIndex: 10, fontWeight: 'bold' }}>SONRASI</div>
                                    <img 
                                        src={photos[compareAfterId]} 
                                        alt="Sonrası" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default PhotoGalleryModal;
