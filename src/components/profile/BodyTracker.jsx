import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../ui/ToastProvider';
import ReminderSettingsCard from './ReminderSettingsCard';
import { Save, Trash2, LineChart as LineChartIcon, TrendingUp, Award, Zap, RefreshCcw, Camera, X, Image as ImageIcon, Settings, Type, Globe } from 'lucide-react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BADGE_LIBRARY } from '../../data/badges';
import { getRank } from '../../utils/ranks';
import { savePhoto, getPhoto, deletePhoto } from '../../utils/db';
import { compressImage } from '../../utils/imageCompressor';
import PhotoGalleryModal from './PhotoGalleryModal';
import CloudSyncCard from '../dashboard/CloudSyncCard';
import ShareCard from './ShareCard';
import Leaderboard from './Leaderboard';
import { error as logError } from '../../utils/logger';

function BodyTracker({ currentUser, onLoginClick, userXP = 0, userLevel = 1, workoutHistory = [], streak = 0, pinnedBadges = [], setPinnedBadges, unlockedBadges = [], userName = 'Athlete', setUserName }) {
    const { t, lang, setLang } = useTranslation();
    const { toast, confirmDialog } = useToast();
    const [nameDraft, setNameDraft] = useState(userName);

    const saveName = () => {
        const trimmed = nameDraft.trim();
        if (!trimmed) {
            toast.warning(t('set_name_error'));
            return;
        }
        setUserName(trimmed);
        // Firebase profilini de guncelle (girisliyse); hata olsa da yerel isim guncellenmis olur
        if (currentUser && typeof currentUser.updateProfile === 'function') {
            currentUser.updateProfile({ displayName: trimmed }).catch(() => {});
        }
        toast.success(t('set_name_saved', { name: trimmed }));
    };
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

    // Photo Tracking States
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [historyPhotos, setHistoryPhotos] = useState({});
    const [selectedViewPhoto, setSelectedViewPhoto] = useState(null);
    const [showGallery, setShowGallery] = useState(false);

    // Load photos from IndexedDB
    // Not: historyPhotos yalnizca cache kontrolu icin okunur; fonksiyonel
    // guncelleme + ref sayesinde dep listesine eklemek gerekmez.
    const historyPhotosRef = useRef(historyPhotos);
    useEffect(() => {
        historyPhotosRef.current = historyPhotos;
    }, [historyPhotos]);
    useEffect(() => {
        const loadPhotos = async () => {
            const photos = {};
            for (const metric of bodyMetrics) {
                if (metric.hasPhoto && !historyPhotosRef.current[metric.id]) {
                    try {
                        const photoData = await getPhoto(metric.id);
                        if (photoData) photos[metric.id] = photoData;
                    } catch (e) {
                        logError("Fotoğraf yüklenemedi", e);
                    }
                }
            }
            if (Object.keys(photos).length > 0) {
                setHistoryPhotos(prev => ({ ...prev, ...photos }));
            }
        };
        loadPhotos();
    }, [bodyMetrics]);

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
        aiWorkoutsCompleted: uniqueAiWorkoutDays,
        history: workoutHistory || []
    };

    const handlePinToggle = (badgeId) => {
        if (!setPinnedBadges) return;
        if (pinnedBadges.includes(badgeId)) {
            setPinnedBadges(pinnedBadges.filter(id => id !== badgeId));
        } else {
            if (pinnedBadges.length >= 3) {
                toast.warning(t('body_badges_max_error'));
                return;
            }
            setPinnedBadges([...pinnedBadges, badgeId]);
        }
    };

    ;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveMetrics = async (e) => {
        e.preventDefault();

        if (!formData.weight && !formData.bodyFat && !formData.chest && !formData.waist && !formData.arms && !formData.legs && !formData.shoulders && !selectedPhoto) {
            toast.warning(t('body_error_empty'));
            return;
        }

        const newMetricId = Date.now().toString();
        const newMetric = {
            id: newMetricId,
            date: formData.date,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
            chest: formData.chest ? parseFloat(formData.chest) : null,
            waist: formData.waist ? parseFloat(formData.waist) : null,
            arms: formData.arms ? parseFloat(formData.arms) : null,
            legs: formData.legs ? parseFloat(formData.legs) : null,
            shoulders: formData.shoulders ? parseFloat(formData.shoulders) : null,
            hasPhoto: !!selectedPhoto
        };

        if (selectedPhoto) {
            try {
                const compressedBase64 = await compressImage(selectedPhoto);
                await savePhoto(newMetricId, compressedBase64);
                setHistoryPhotos(prev => ({ ...prev, [newMetricId]: compressedBase64 }));
            } catch (error) {
                logError("Fotoğraf kaydedilemedi:", error);
                toast.error(t('body_error_photo'));
                newMetric.hasPhoto = false;
            }
        }

        // Aynı tarih varsa üstüne yazalım veya listeye aynen ekleyelim. Güncelleme mantığı (Aynı gün sadece 1 kayıt):
        setBodyMetrics(prev => {
            const filtered = prev.filter(m => m.date !== newMetric.date);
            return [...filtered, newMetric].sort((a, b) => new Date(a.date) - new Date(b.date)); // Tarihe göre sırala
        });

        setSelectedPhoto(null);
        setPhotoPreview(null);
        toast.success(t('saved_success'));
    };

    const handleDeleteMetric = async (id) => {
        const ok = await confirmDialog({
            title: t('confirm_delete_title'),
            message: t('confirm_delete'),
            confirmLabel: t('confirm_delete_ok'),
            cancelLabel: t('aw_exit_cancel'),
            danger: true
        });
        if (ok) {
            setBodyMetrics(prev => prev.filter(m => m.id !== id));
            await deletePhoto(id);
            setHistoryPhotos(prev => {
                const newPhotos = { ...prev };
                delete newPhotos[id];
                return newPhotos;
            });
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
            case 'weight': return t('profile_weight');
            case 'bodyFat': return t('profile_body_fat');
            case 'waist': return t('profile_waist');
            case 'chest': return t('profile_chest');
            case 'arms': return t('profile_arms');
            case 'legs': return t('profile_legs');
            case 'shoulders': return t('profile_shoulders');
            default: return key;
        }
    };

    const currentRank = getRank(userLevel);
    const rankTitle = lang === 'tr' ? currentRank.title_tr : currentRank.title_en;

    return (
        <div className="app-container slide-in">
            <header className="top-bar fade-in" style={{ animationDelay: '0s', flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <div style={{ width: '100%' }}>
                    <h2 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
                        <TrendingUp size={28} /> {t('profile_title')}
                    </h2>
                    <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}>{t('profile_subtitle')}</p>
                </div>
            </header>

            <div className="workout-tracker-list fade-in" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: '2rem', paddingTop: '1.5rem', paddingBottom: '3rem' }}>

                {/* 0. AYARLAR: isim + dil */}
                <div className="glass-card slide-in">
                    <h3 style={{ color: '#fff', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={20} color="var(--accent-primary)" /> {t('set_title')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Isim */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '6px' }}>
                                <Type size={14} /> {t('set_name_label')}
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    className="neon-input"
                                    style={{ flex: 1 }}
                                    value={nameDraft}
                                    onChange={(e) => setNameDraft(e.target.value)}
                                    maxLength={24}
                                    placeholder={t('auth_name_placeholder')}
                                />
                                <button
                                    className="neon-btn"
                                    onClick={saveName}
                                    style={{ padding: '0.6rem 1.1rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Save size={16} /> {t('set_save')}
                                </button>
                            </div>
                        </div>
                        {/* Dil */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '6px' }}>
                                <Globe size={14} /> {t('set_lang_label')}
                            </label>
                            <div style={{ display: 'flex', gap: '5px', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '10px', border: '1px solid var(--glass-border)', width: 'fit-content' }}>
                                <button
                                    onClick={() => setLang('tr')}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: lang === 'tr' ? 'var(--accent-primary)' : 'transparent',
                                        color: lang === 'tr' ? '#000' : '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold'
                                    }}
                                >🇹🇷 TR</button>
                                <button
                                    onClick={() => setLang('en')}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: lang === 'en' ? 'var(--accent-primary)' : 'transparent',
                                        color: lang === 'en' ? '#000' : '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold'
                                    }}
                                >🇬🇧 EN</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bulut Eşitleme Kartı */}
                <CloudSyncCard currentUser={currentUser} onLoginClick={onLoginClick} />

                {/* Lider Tablosu (sanal rakipler) */}
                <Leaderboard userName={userName} userLevel={userLevel} userXP={userXP} />

                {/* Paylaşım Kartı */}
                <ShareCard
                    userName={userName}
                    userLevel={userLevel}
                    userXP={userXP}
                    streak={streak}
                    workoutHistory={workoutHistory}
                />

                {/* 1. SEVİYE VE XP BARI (Gamification) */}
                <div className="glass-card slide-in" style={{ border: '1px solid rgba(0, 195, 255, 0.2)', background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0, 195, 255, 0.05) 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>{currentRank.icon}</span>
                            <span style={{ color: currentRank.color }}>{rankTitle}</span>
                            <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>({t('level')} {userLevel})</span>
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
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.8rem', marginBottom: 0, textAlign: 'center' }}>{t('profile_xp_desc')}</p>
                </div>

                {/* 2. ROZETLER (Badges) VİTRİNİ */}
                <div className="glass-card slide-in" style={{ animationDelay: '0.15s' }}>
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setIsBadgesExpanded(!isBadgesExpanded)}
                    >
                        <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award color="#ffa502" /> {t('body_badges_title')}
                        </h3>
                        <span style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
                            {isBadgesExpanded ? `${t('body_badges_collapse')} 🔼` : `${t('body_badges_expand')} 🔽`}
                        </span>
                    </div>

                    {isBadgesExpanded && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '1rem' }}>
                                {[...BADGE_LIBRARY].sort((a, b) => {
                                    const aUn = unlockedBadges.includes(a.id);
                                    const bUn = unlockedBadges.includes(b.id);
                                    if (aUn && !bUn) return -1;
                                    if (!aUn && bUn) return 1;
                                    if (!aUn && !bUn) {
                                        if (a.isSecret && !b.isSecret) return 1;
                                        if (!a.isSecret && b.isSecret) return -1;
                                    }
                                    return 0;
                                }).map(badge => {
                                    const isUnlocked = unlockedBadges.includes(badge.id);
                                    const badgeTitle = lang === 'tr' ? (badge.isSecret && !isUnlocked ? t('body_badges_secret') : badge.title) : (badge.isSecret && !isUnlocked ? t('body_badges_secret') : badge.title_en);
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
                                            <div style={{ fontSize: '2rem' }}>{badge.isSecret && !isUnlocked ? "🔒" : badge.icon}</div>
                                            <span style={{ fontSize: '0.75rem', color: isUnlocked ? 'var(--accent-primary)' : 'var(--text-light)', textAlign: 'center', fontWeight: 'bold' }}>
                                                {badgeTitle}
                                            </span>
                                            {!isUnlocked && badge.progress && !badge.isSecret && (
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
                                        <span style={{ fontSize: '1.5rem' }}>
                                            {selectedBadge.isSecret && !unlockedBadges.includes(selectedBadge.id) ? "🔒" : selectedBadge.icon}
                                        </span>
                                        <h4 style={{ color: '#fff', margin: 0 }}>
                                            {selectedBadge.isSecret && !unlockedBadges.includes(selectedBadge.id) ? t('body_badges_secret') : (lang === 'tr' ? selectedBadge.title : selectedBadge.title_en)} 
                                            {unlockedBadges.includes(selectedBadge.id) ? ' ✅' : ''}
                                        </h4>
                                    </div>
                                    <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
                                        {selectedBadge.isSecret && !unlockedBadges.includes(selectedBadge.id) 
                                            ? t('body_badges_secret_desc')
                                            : (lang === 'tr' ? selectedBadge.description : selectedBadge.description_en)}
                                    </p>

                                    {unlockedBadges.includes(selectedBadge.id) && (
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
                                            {pinnedBadges.includes(selectedBadge.id) ? t('body_badges_unpin') : t('body_badges_pin')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Form Section */}
                <div className="glass-card slide-in" style={{ animationDelay: '0.2s' }}>
                    <h3 style={{ color: '#fff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>{t('body_add_new_title')}</h3>
                    <form onSubmit={handleSaveMetrics} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        <div className="input-group" style={{ marginBottom: '0.5rem' }}>
                            <label>{t('body_date_label')}</label>
                            <input
                                type="date"
                                name="date"
                                className="neon-input"
                                value={formData.date}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="metrics-row" style={{ marginBottom: '1rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>{t('body_weight_label')}</label>
                                <input type="number" step="0.1" name="weight" className="neon-input" placeholder={t('body_weight_placeholder')} value={formData.weight} onChange={handleInputChange} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>{t('body_fat_label')}</label>
                                <input type="number" step="0.1" name="bodyFat" className="neon-input" placeholder={t('body_fat_placeholder')} value={formData.bodyFat} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="metrics-row" style={{ marginBottom: '1rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>{t('body_shoulder_label')}</label>
                                <input type="number" step="0.5" name="shoulders" className="neon-input" placeholder="120" value={formData.shoulders} onChange={handleInputChange} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>{t('body_chest_label')}</label>
                                <input type="number" step="0.5" name="chest" className="neon-input" placeholder="100" value={formData.chest} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="metrics-row" style={{ marginBottom: '1rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>{t('body_waist_label')}</label>
                                <input type="number" step="0.5" name="waist" className="neon-input" placeholder="80" value={formData.waist} onChange={handleInputChange} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>{t('body_arms_label')}</label>
                                <input type="number" step="0.5" name="arms" className="neon-input" placeholder="35" value={formData.arms} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>{t('body_legs_label')}</label>
                            <input type="number" step="0.5" name="legs" className="neon-input" placeholder="60" value={formData.legs} onChange={handleInputChange} />
                        </div>

                        {/* Fotoğraf Yükleme Alanı */}
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <Camera size={16} /> {t('body_photo_label')}
                            </label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <label className="neon-btn" style={{ 
                                    background: 'rgba(0, 195, 255, 0.1)', 
                                    borderColor: '#00c3ff', 
                                    color: '#00c3ff', 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.8rem',
                                    width: '100%',
                                    marginBottom: 0
                                }}>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        capture="environment" 
                                        onChange={handlePhotoChange} 
                                        style={{ display: 'none' }} 
                                    />
                                    {t('body_photo_btn')}
                                </label>
                            </div>
                            {photoPreview && (
                                <div style={{ position: 'relative', marginTop: '10px', width: 'fit-content' }}>
                                    <img src={photoPreview} alt="Önizleme" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #00c3ff' }} />
                                    <button 
                                        type="button" 
                                        onClick={() => { setSelectedPhoto(null); setPhotoPreview(null); }}
                                        style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff4757', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="neon-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            <Save size={18} /> {t('body_save_btn')}
                        </button>
                    </form>
                </div>

                {/* Chart Section */}
                {bodyMetrics.length > 0 && (
                    <div className="glass-card slide-in" style={{ animationDelay: '0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LineChartIcon size={20} color="var(--accent-primary)" /> {t('body_chart_title')}
                            </h3>
                            <select
                                className="neon-input"
                                style={{ width: 'auto', padding: '0.5rem', fontSize: '16px', backgroundColor: 'rgba(0,0,0,0.5)' }}
                                value={chartDataKey}
                                onChange={(e) => setChartDataKey(e.target.value)}
                            >
                                <option value="weight">{t('body_weight')} (kg)</option>
                                <option value="bodyFat">{t('body_fat')} (%)</option>
                                <option value="shoulders">{t('body_shoulders')} (cm)</option>
                                <option value="chest">{t('body_chest')} (cm)</option>
                                <option value="waist">{t('body_waist')} (cm)</option>
                                <option value="arms">{t('body_arms')} (cm)</option>
                                <option value="legs">{t('body_legs')} (cm)</option>
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
                                        labelFormatter={(label) => new Date(label).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={{ color: '#fff', margin: 0 }}>{t('profile_history')}</h3>
                            {bodyMetrics.some(m => m.hasPhoto) && (
                                <button 
                                    onClick={() => setShowGallery(true)}
                                    className="neon-btn"
                                    style={{ 
                                        padding: '0.5rem 1rem', 
                                        fontSize: '0.8rem', 
                                        background: 'rgba(255, 0, 136, 0.1)',
                                        borderColor: '#ff0088',
                                        color: '#ff0088',
                                        width: 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <ImageIcon size={16} /> {t('body_gallery_btn')}
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {bodyMetrics.slice().reverse().map((metric) => (
                                <div key={metric.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '1rem' }}>
                                            {new Date(metric.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                                        </span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                            {metric.weight && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>{t('body_weight')}: {metric.weight}kg</span>}
                                            {metric.bodyFat && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>{t('body_fat')}: %{metric.bodyFat}</span>}
                                            {metric.waist && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>{t('body_waist')}: {metric.waist}cm</span>}
                                            {metric.arms && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>{t('body_arms')}: {metric.arms}cm</span>}
                                            {metric.chest && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>{t('body_chest')}: {metric.chest}cm</span>}
                                            {metric.shoulders && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>{t('body_shoulders')}: {metric.shoulders}cm</span>}
                                            {metric.legs && <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>{t('body_legs')}: {metric.legs}cm</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {metric.hasPhoto && historyPhotos[metric.id] && (
                                            <div 
                                                onClick={() => setSelectedViewPhoto(historyPhotos[metric.id])}
                                                style={{ cursor: 'pointer', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', width: '40px', height: '40px' }}
                                            >
                                                <img src={historyPhotos[metric.id]} alt="Ölçüm Fotoğrafı" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleDeleteMetric(metric.id)}
                                            style={{ background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.2)', width: '36px', height: '36px', borderRadius: '8px', color: 'var(--accent-danger)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
                                            title={t('btn_delete')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Tam Ekran Fotoğraf Görüntüleyici Modal */}
            {selectedViewPhoto && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '1rem'
                }}>
                    <button 
                        onClick={() => setSelectedViewPhoto(null)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            padding: '10px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={selectedViewPhoto} 
                        alt="Tam Ekran Gelişim" 
                        style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} 
                    />
                </div>
            )}

            {/* Öncesi/Sonrası Gelişim Galerisi Modal */}
            {showGallery && (
                <PhotoGalleryModal
                    photos={historyPhotos}
                    metrics={bodyMetrics}
                    onClose={() => setShowGallery(false)}
                />
            )}

            {/* Bildirim / Hatirlatma Ayarlari */}
            <ReminderSettingsCard />
        </div >
    );
}

export default BodyTracker;
