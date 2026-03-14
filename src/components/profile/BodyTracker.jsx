import React, { useState } from 'react';
import { ArrowLeft, Save, Trash2, LineChart as LineChartIcon, TrendingUp, Award, Zap, RefreshCcw } from 'lucide-react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BADGE_LIBRARY } from '../../data/badges';
import OneRepMaxCalc from '../tools/OneRepMaxCalc';
import DataSync from './DataSync';

function BodyTracker({ onBack, userXP = 0, setUserXP, userLevel = 1, setUserLevel, workoutHistory = [], streak = 0, pinnedBadges = [], setPinnedBadges }) {
    const [bodyMetrics, setBodyMetrics] = useLocalStorage('gym_app_body_metrics', []);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        bodyFat: '',
        chest: '',
        waist: '',
        arms: '',
        legs: '',
        shoulders: ''
    });

    const [chartDataKey, setChartDataKey] = useState('weight');
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [isBadgesExpanded, setIsBadgesExpanded] = useState(false);
    const [show1RMCalc, setShow1RMCalc] = useState(false);

    // Başarı (Badge) İstatistiklerinin Kaplanması
    // history array'deki farklı gün sayısını unique totalWorkout kabul ediyoruz.
    const uniqueWorkoutDays = new Set((workoutHistory || []).map(w => {
        const d = new Date(w.date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })).size;

    // Sadece AI ile üretilen programlardaki farklı gün sayısı
    const uniqueAiWorkoutDays = new Set((workoutHistory || []).filter(w => w.isAiGenerated).map(w => {
        const d = new Date(w.date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })).size;

    const stats = {
        totalWorkouts: uniqueWorkoutDays,
        streak: streak,
        aiWorkoutsCompleted: uniqueAiWorkoutDays
    };

    const handlePinToggle = (badgeId) => {
        if (!setPinnedBadges) return;
        if (pinnedBadges.includes(badgeId)) {
            setPinnedBadges(pinnedBadges.filter(id => id !== badgeId));
        } else {
            if (pinnedBadges.length >= 3) {
                alert("Dashboard vitrinine en fazla 3 rozet sabitleyebilirsiniz. Lütfen mevcut olanlardan birini kaldırın.");
                return;
            }
            setPinnedBadges([...pinnedBadges, badgeId]);
        }
    };

    const handleResetGamification = () => {
        if (window.confirm("Seviye, XP ve Rozet (Vitrin) verilerinizi tamamen sıfırlamak istediğinize emin misiniz? (İdman geçmişiniz ve Ölçümleriniz SİLİNMEZ, sadece gamification verileriniz sıfırlanır.)")) {
            if (setUserXP) setUserXP(0);
            if (setUserLevel) setUserLevel(1);
            if (setPinnedBadges) setPinnedBadges([]);
            alert("Seviye ve Rozet verileriniz sıfırlandı.");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveMetrics = (e) => {
        e.preventDefault();

        if (!formData.weight && !formData.bodyFat && !formData.chest && !formData.waist && !formData.arms && !formData.legs && !formData.shoulders) {
            alert("Lütfen en az bir ölçüm girin.");
            return;
        }

        const newMetric = {
            id: Date.now().toString(),
            date: formData.date,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
            chest: formData.chest ? parseFloat(formData.chest) : null,
            waist: formData.waist ? parseFloat(formData.waist) : null,
            arms: formData.arms ? parseFloat(formData.arms) : null,
            legs: formData.legs ? parseFloat(formData.legs) : null,
            shoulders: formData.shoulders ? parseFloat(formData.shoulders) : null,
        };

        // Aynı tarih varsa üstüne yazalım veya listeye aynen ekleyelim. Güncelleme mantığı (Aynı gün sadece 1 kayıt):
        setBodyMetrics(prev => {
            const filtered = prev.filter(m => m.date !== newMetric.date);
            return [...filtered, newMetric].sort((a, b) => new Date(a.date) - new Date(b.date)); // Tarihe göre sırala
        });

        alert("Ölçümler başarıyla kaydedildi!");
        // Formu temizlemiyoruz, kullanıcı diğer güne geçip kolayca ekleyebilir
    };

    const handleDeleteMetric = (id) => {
        if (window.confirm("Bu ölçüm kaydını silmek istediğinize emin misiniz?")) {
            setBodyMetrics(prev => prev.filter(m => m.id !== id));
        }
    };

    const getChartColor = (key) => {
        switch (key) {
            case 'weight': return '#00c3ff';
            case 'bodyFat': return '#ff4757';
            case 'waist': return '#ffa502';
            default: return '#1dd1a1';
        }
    };

    const getMetricLabel = (key) => {
        switch (key) {
            case 'weight': return 'Kilo (kg)';
            case 'bodyFat': return 'Yağ Oranı (%)';
            case 'waist': return 'Bel (cm)';
            case 'chest': return 'Göğüs (cm)';
            case 'arms': return 'Kol (cm)';
            case 'legs': return 'Bacak (cm)';
            case 'shoulders': return 'Omuz (cm)';
            default: return key;
        }
    };

    if (show1RMCalc) {
        return <OneRepMaxCalc onBack={() => setShow1RMCalc(false)} />;
    }

    return (
        <div className="app-container slide-in">
            <header className="top-bar fade-in" style={{ animationDelay: '0s', flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <button className="back-btn" onClick={onBack} style={{ marginBottom: '1rem' }}>
                    <ArrowLeft size={20} /> Geri
                </button>
                <div>
                    <h2 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
                        <TrendingUp size={28} /> Vücut Ölçüleri
                    </h2>
                    <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}>Fiziksel gelişimini kaydet ve grafiklerle takip et.</p>
                </div>
            </header>

            <div className="workout-tracker-list fade-in" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: '2rem', paddingTop: '1.5rem', paddingBottom: '3rem' }}>

                {/* ARAÇLAR: 1RM Hesaplayıcı Girişi */}
                <div className="glass-card slide-in" style={{ border: '1px solid rgba(255, 0, 136, 0.2)', background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(255, 0, 136, 0.05) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>1RM Hesaplayıcı</h3>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Maksimum kaldırma kapasiteni ölç</p>
                    </div>
                    <button onClick={() => setShow1RMCalc(true)} className="neon-btn" style={{ background: 'rgba(255, 0, 136, 0.1)', borderColor: '#ff0088', color: '#ff0088', width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        Aç
                    </button>
                </div>

                {/* 1. SEVİYE VE XP BARI (Gamification) */}
                <div className="glass-card slide-in" style={{ border: '1px solid rgba(0, 195, 255, 0.2)', background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0, 195, 255, 0.05) 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem' }}>
                            <Zap color="#00c3ff" /> Seviye {userLevel}
                        </h3>
                        {(() => {
                            const reqXP = userLevel * 500 + (userLevel * 100);
                            return (
                                <span style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    {userXP} / {reqXP} XP
                                </span>
                            );
                        })()}
                    </div>
                    {/* Progress Bar Container */}
                    <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        {(() => {
                            const reqXP = userLevel * 500 + (userLevel * 100);
                            return (
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, (userXP / reqXP) * 100)}%`,
                                    background: 'linear-gradient(90deg, #00c3ff, #ff0088)',
                                    borderRadius: '10px',
                                    transition: 'width 0.5s ease-out'
                                }}></div>
                            );
                        })()}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.8rem', marginBottom: 0, textAlign: 'center' }}>İdmanları tamamlayarak yeni seviyelere ulaş ve profilini güçlendir!</p>
                </div>

                {/* 2. ROZETLER (Badges) VİTRİNİ */}
                <div className="glass-card slide-in" style={{ animationDelay: '0.15s' }}>
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setIsBadgesExpanded(!isBadgesExpanded)}
                    >
                        <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award color="#ffa502" /> Başarı Rozetleri
                        </h3>
                        <span style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
                            {isBadgesExpanded ? 'Kapat 🔼' : 'Aç 🔽'}
                        </span>
                    </div>

                    {isBadgesExpanded && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '1rem' }}>
                                {[...BADGE_LIBRARY].sort((a, b) => {
                                    const aUn = a.condition(stats) ? 1 : 0;
                                    const bUn = b.condition(stats) ? 1 : 0;
                                    return bUn - aUn; // 1 (unlocked) önce gelsin
                                }).map(badge => {
                                    const isUnlocked = badge.condition(stats);
                                    return (
                                        <div
                                            key={badge.id}
                                            onClick={() => setSelectedBadge(badge)}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '1rem 0.5rem',
                                                background: isUnlocked ? 'rgba(0, 195, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                                border: isUnlocked ? '1px solid rgba(0, 195, 255, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                opacity: isUnlocked ? 1 : 0.5,
                                                filter: isUnlocked ? 'none' : 'grayscale(100%)',
                                                transition: 'all 0.2s ease',
                                                transform: selectedBadge?.id === badge.id ? 'scale(1.05)' : 'scale(1)'
                                            }}
                                        >
                                            <div style={{ fontSize: '2rem' }}>{badge.icon}</div>
                                            <span style={{ fontSize: '0.75rem', color: isUnlocked ? 'var(--accent-primary)' : 'var(--text-light)', textAlign: 'center', fontWeight: 'bold' }}>{badge.title}</span>
                                            {!isUnlocked && badge.progress && (
                                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                                    {badge.progress(stats)}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Seçili Rozet Detayı */}
                            {selectedBadge && (
                                <div className="fade-in" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', borderLeft: '4px solid #ffa502' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{selectedBadge.icon}</span>
                                        <h4 style={{ color: '#fff', margin: 0 }}>{selectedBadge.title} {selectedBadge.condition(stats) ? '✅' : '🔒'}</h4>
                                    </div>
                                    <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '0 0 1rem 0', lineHeight: '1.4' }}>{selectedBadge.description}</p>

                                    {selectedBadge.condition(stats) && (
                                        <button
                                            onClick={() => handlePinToggle(selectedBadge.id)}
                                            className="neon-btn"
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.8rem',
                                                width: 'auto',
                                                background: pinnedBadges.includes(selectedBadge.id) ? 'rgba(255, 71, 87, 0.1)' : 'rgba(0, 195, 255, 0.1)',
                                                borderColor: pinnedBadges.includes(selectedBadge.id) ? '#ff4757' : '#00c3ff',
                                                color: pinnedBadges.includes(selectedBadge.id) ? '#ff4757' : '#00c3ff',
                                                boxShadow: 'none'
                                            }}
                                        >
                                            {pinnedBadges.includes(selectedBadge.id) ? 'Vitrininden Kaldır' : 'Dashboard\'a Sabitle (Max 3)'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Form Section */}
                <div className="glass-card slide-in" style={{ animationDelay: '0.2s' }}>
                    <h3 style={{ color: '#fff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Yeni Ölçüm Ekle</h3>
                    <form onSubmit={handleSaveMetrics} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        <div className="input-group" style={{ marginBottom: '0.5rem' }}>
                            <label>Tarih</label>
                            <input
                                type="date"
                                name="date"
                                className="neon-input"
                                value={formData.date}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Kilo (kg)</label>
                                <input type="number" step="0.1" name="weight" className="neon-input" placeholder="Örn: 75.5" value={formData.weight} onChange={handleInputChange} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Yağ Oranı (%)</label>
                                <input type="number" step="0.1" name="bodyFat" className="neon-input" placeholder="Örn: 15" value={formData.bodyFat} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Omuz (cm)</label>
                                <input type="number" step="0.5" name="shoulders" className="neon-input" placeholder="Örn: 120" value={formData.shoulders} onChange={handleInputChange} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Göğüs (cm)</label>
                                <input type="number" step="0.5" name="chest" className="neon-input" placeholder="Örn: 100" value={formData.chest} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Bel (cm)</label>
                                <input type="number" step="0.5" name="waist" className="neon-input" placeholder="Örn: 80" value={formData.waist} onChange={handleInputChange} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Kol (cm)</label>
                                <input type="number" step="0.5" name="arms" className="neon-input" placeholder="Örn: 35" value={formData.arms} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>Bacak (cm)</label>
                            <input type="number" step="0.5" name="legs" className="neon-input" placeholder="Örn: 60" value={formData.legs} onChange={handleInputChange} />
                        </div>

                        <button type="submit" className="neon-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            <Save size={18} /> ÖLÇÜMÜ KAYDET
                        </button>
                    </form>
                </div>

                {/* Chart Section */}
                {bodyMetrics.length > 0 && (
                    <div className="glass-card slide-in" style={{ animationDelay: '0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LineChartIcon size={20} color="var(--accent-primary)" /> Gelişim Grafiği
                            </h3>
                            <select
                                className="neon-input"
                                style={{ width: 'auto', padding: '0.5rem', fontSize: '0.9rem', backgroundColor: 'rgba(0,0,0,0.5)' }}
                                value={chartDataKey}
                                onChange={(e) => setChartDataKey(e.target.value)}
                            >
                                <option value="weight">Kilo (kg)</option>
                                <option value="bodyFat">Yağ Oranı (%)</option>
                                <option value="shoulders">Omuz (cm)</option>
                                <option value="chest">Göğüs (cm)</option>
                                <option value="waist">Bel (cm)</option>
                                <option value="arms">Kol (cm)</option>
                                <option value="legs">Bacak (cm)</option>
                            </select>
                        </div>

                        <div style={{ width: '100%', height: 250, background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '10px 10px 10px 0' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={bodyMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="rgba(255,255,255,0.3)"
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                        tickFormatter={(val) => {
                                            const d = new Date(val);
                                            return `${d.getDate()}/${d.getMonth() + 1}`;
                                        }}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.3)"
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                        domain={['auto', 'auto']}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1d24', border: '1px solid rgba(0, 195, 255, 0.3)', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: getChartColor(chartDataKey) }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}
                                        formatter={(value, name) => [value, getMetricLabel(name)]}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('tr-TR')}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={chartDataKey}
                                        stroke={getChartColor(chartDataKey)}
                                        strokeWidth={3}
                                        dot={{ fill: getChartColor(chartDataKey), strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#fff', stroke: getChartColor(chartDataKey) }}
                                        connectNulls={true}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* History List */}
                {bodyMetrics.length > 0 && (
                    <div className="glass-card slide-in" style={{ animationDelay: '0.3s' }}>
                        <h3 style={{ color: '#fff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Geçmiş Ölçümler</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {bodyMetrics.slice().reverse().map((metric) => (
                                <div key={metric.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '1rem' }}>
                                            {new Date(metric.date).toLocaleDateString('tr-TR')}
                                        </span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                            {metric.weight && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>Kilo: {metric.weight}kg</span>}
                                            {metric.bodyFat && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>Yağ: %{metric.bodyFat}</span>}
                                            {metric.waist && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>Bel: {metric.waist}cm</span>}
                                            {metric.arms && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>Kol: {metric.arms}cm</span>}
                                            {metric.chest && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>Göğüs: {metric.chest}cm</span>}
                                            {metric.shoulders && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>Omuz: {metric.shoulders}cm</span>}
                                            {metric.legs && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>Bacak: {metric.legs}cm</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteMetric(metric.id)}
                                        style={{ background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.2)', width: '36px', height: '36px', borderRadius: '8px', color: 'var(--accent-danger)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
                                        title="Sil"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reset Gamification Options */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <button
                        onClick={handleResetGamification}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'underline' }}
                        title="Seviye ve Rozetleri Sıfırla"
                    >
                        <RefreshCcw size={14} /> Oyunlaştırma Verilerini Sıfırla
                    </button>
                </div>

                {/* Veri Yedekleme (Data Sync) */}
                <DataSync />

            </div>
        </div >
    );
}

export default BodyTracker;
