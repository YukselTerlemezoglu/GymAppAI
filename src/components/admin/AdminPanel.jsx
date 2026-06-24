import React, { useState } from 'react';
import { Shield, Save, RefreshCcw, Trash2, ArrowLeft, Cloud, LogOut } from 'lucide-react';
import { auth } from '../../services/firebase';
import { useTranslation } from '../../i18n/LanguageContext';
import { error as logError } from '../../utils/logger';

// Bilinen tüm GymAppAI LocalStorage/IndexedDB anahtarları.
// Bunların dışındaki anahtarlar ASLA silinmemeli (origin'de başka
// uygulamalar olabilir). 'gym_app_' ön eki korunarak ileride eklenen
// anahtarlar da yakalanır.
const GYM_APP_STORAGE_PREFIX = 'gym_app_';

function clearGymAppStorage() {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(GYM_APP_STORAGE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // Language ayarını koruyalım (kullanıcı tercihini sıfırlamak kötü UX)
        // gym_app_lang zaten prefix ile silindi; varsayılanı geri yükleyelim:
        if (!localStorage.getItem('gym_app_lang')) {
            localStorage.setItem('gym_app_lang', 'tr');
        }
    } catch (err) {
        logError('Storage temizlenirken hata:', err);
    }
}

function AdminPanel({
    onBack,
    userXP, setUserXP,
    userLevel, setUserLevel,
    userCoins, setUserCoins,
    streak, setStreak,
    setWorkoutHistory,
    setPinnedBadges,
    setCompletedDays,
    setSavedAiProgram,
    setUnlockedThemes,
    setActiveTheme
}) {
    const { t } = useTranslation();
    const [passwordInput, setPasswordInput] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Admin parolası (.env'den). Placeholder veya eksikse panel erişilemez.
    const RAW_ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD;
    const PLACEHOLDER_VALUES = new Set([
        'YOUR_ADMIN_PASSWORD',
        'API_ANAHTARINIZI_BURAYA_YAZIN',
        '',
        undefined,
    ]);
    const ADMIN_PASS = PLACEHOLDER_VALUES.has(RAW_ADMIN_PASS) ? null : RAW_ADMIN_PASS;

    const [editXP, setEditXP] = useState(userXP);
    const [editLevel, setEditLevel] = useState(userLevel);
    const [editCoins, setEditCoins] = useState(userCoins);

    const [simulateXP, setSimulateXP] = useState(1000);

    const handleLogin = (e) => {
        e.preventDefault();
        if (!ADMIN_PASS) {
            // .env eksik veya placeholder bırakılmış
            alert(t('admin_disabled') || 'Admin paneli devre dışı (parola yapılandırılmamış).');
            return;
        }
        if (passwordInput === ADMIN_PASS) {
            setIsAuthenticated(true);
        } else {
            alert(t('admin_wrong_pass'));
            setPasswordInput('');
        }
    };

    const handleSaveModifications = () => {
        if (window.confirm(t('admin_save_confirm'))) {
            setUserXP(Number(editXP));
            setUserLevel(Number(editLevel));
            setUserCoins(Number(editCoins));
            alert(t('admin_save_success'));
        }
    };

    const handleSimulateXP = () => {
        const calculateRequiredXP = (level) => level * 500 + (level * 100);
        let newTotalXP = userXP + Number(simulateXP);
        let currentLvl = userLevel;
        let currentRequiredXP = calculateRequiredXP(currentLvl);

        while (newTotalXP >= currentRequiredXP) {
            newTotalXP -= currentRequiredXP;
            currentLvl += 1;
            currentRequiredXP = calculateRequiredXP(currentLvl);
        }

        setUserLevel(currentLvl);
        setUserXP(newTotalXP);

        // Jeton da verelim
        const earnedCoins = Math.max(1, Math.round(Number(simulateXP) * 0.1));
        setUserCoins((prev) => (prev || 0) + earnedCoins);

        alert(t('admin_simulate_success', { 
            xp: simulateXP, 
            coins: earnedCoins, 
            level: currentLvl 
        }));
    };

    const handleFullReset = () => {
        if (window.confirm(t('admin_full_reset_warning'))) {
            setUserXP(0);
            setUserLevel(1);
            setUserCoins(0);
            setStreak(0);
            if (setWorkoutHistory) setWorkoutHistory([]);
            if (setPinnedBadges) setPinnedBadges([]);
            if (setCompletedDays) setCompletedDays([]);
            if (setSavedAiProgram) setSavedAiProgram(null);
            if (setUnlockedThemes) setUnlockedThemes(['default']);
            if (setActiveTheme) setActiveTheme('default');
            // Sadece GymApp'ye ait anahtarları sil (origin'i korumak için).
            clearGymAppStorage();
            alert(t('admin_full_reset_success'));
            window.location.reload();
        }
    };

    if (!ADMIN_PASS) {
        return (
            <div className="app-container slide-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '1rem' }}>
                <div className="glass-card" style={{ width: '100%', maxWidth: '350px', padding: '2rem', textAlign: 'center', border: '1px solid #ff4757' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', marginBottom: '1rem' }}>
                        <button type="button" className="back-btn" onClick={onBack} style={{ margin: 0 }}>
                            <ArrowLeft size={20} /> {t('btn_back')}
                        </button>
                    </div>
                    <Shield size={48} color="#ff4757" style={{ margin: '0 auto 1rem' }} />
                    <h2 style={{ color: '#fff', margin: 0 }}>{t('admin_title')}</h2>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        {t('admin_disabled') || 'Admin paneli devre dışı. .env dosyasında VITE_ADMIN_PASSWORD tanımlı olmalı ve placeholder değerinde olmamalıdır.'}
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="app-container slide-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '1rem' }}>
                <form onSubmit={handleLogin} className="glass-card" style={{ width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', border: '1px solid #ff4757' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                        <button type="button" className="back-btn" onClick={onBack} style={{ margin: 0 }}>
                            <ArrowLeft size={20} /> {t('btn_back')}
                        </button>
                    </div>

                    <div>
                        <Shield size={48} color="#ff4757" style={{ margin: '0 auto 1rem' }} />
                        <h2 style={{ color: '#fff', margin: 0 }}>{t('admin_title')}</h2>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{t('admin_subtitle')}</p>
                    </div>

                    <input
                        type="password"
                        className="neon-input"
                        placeholder={t('admin_pass_placeholder')}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        required
                        autoFocus
                    />

                    <button type="submit" className="neon-btn" style={{ width: '100%', borderColor: '#ff4757', color: '#ff4757', background: 'rgba(255, 71, 87, 0.1)' }}>
                        {t('auth_btn_login')}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="app-container slide-in">
            <header className="top-bar" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <button className="back-btn" onClick={onBack} style={{ margin: 0 }}>
                    <ArrowLeft size={20} /> {t('btn_back')}
                </button>
                <h2 style={{ color: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Shield size={24} /> {t('admin_mode_title')}
                </h2>
            </header>

            <div className="glass-card fade-in" style={{ border: '1px solid #00ff88', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                <h3 style={{ color: '#00ff88', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,255,136,0.1)', paddingBottom: '0.5rem' }}>📈 {t('admin_xp_simulator')}</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>{t('admin_xp_simulator_desc')}</p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="input-group" style={{ flexGrow: 1, marginBottom: 0 }}>
                        <input type="number" className="neon-input" value={simulateXP} onChange={(e) => setSimulateXP(e.target.value)} placeholder="XP" />
                    </div>
                    <button onClick={handleSimulateXP} className="neon-btn" style={{ borderColor: '#00ff88', color: '#00ff88', whiteSpace: 'nowrap' }}>
                        {t('admin_xp_btn')}
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setStreak(streak + 1)} className="neon-btn-secondary" style={{ flexGrow: 1 }}>
                        🔥 {t('admin_streak_inc')} (Mevcut: {streak})
                    </button>
                    <button onClick={() => setStreak(0)} className="neon-btn-secondary" style={{ flexGrow: 1, color: '#ff4757' }}>
                        🧨 {t('admin_streak_reset')}
                    </button>
                </div>
            </div>

            <div className="glass-card fade-in" style={{ border: '1px solid #00c3ff', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#00c3ff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,195,255,0.1)', paddingBottom: '0.5rem' }}>🛠 {t('admin_manual_edit')}</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>{t('admin_manual_edit_desc')}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>{t('admin_edit_xp')}</label>
                        <input type="number" className="neon-input" value={editXP} onChange={(e) => setEditXP(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>{t('admin_edit_level')}</label>
                        <input type="number" className="neon-input" value={editLevel} onChange={(e) => setEditLevel(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>{t('admin_edit_coins')}</label>
                        <input type="number" className="neon-input" value={editCoins} onChange={(e) => setEditCoins(e.target.value)} />
                    </div>
                </div>

                <button onClick={handleSaveModifications} className="neon-btn" style={{ width: '100%', borderColor: '#00c3ff', color: '#00c3ff', background: 'rgba(0, 195, 255, 0.1)' }}>
                    <Save size={18} /> {t('btn_save').toUpperCase()}
                </button>
            </div>

            <div className="glass-card fade-in" style={{ border: '1px solid #ff4757', background: 'rgba(255, 71, 87, 0.05)' }}>
                <h3 style={{ color: '#ff4757', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 71, 87, 0.2)', paddingBottom: '0.5rem' }}>{t('admin_danger_zone')}</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1rem' }}>{t('admin_danger_zone_desc')}</p>
                <button onClick={handleFullReset} className="neon-btn" style={{ width: '100%', borderColor: '#ff4757', color: '#ff4757', background: 'rgba(255, 71, 87, 0.1)' }}>
                    <Trash2 size={18} /> {t('admin_hard_reset_btn')}
                </button>
            </div>
        </div>
    );
}

export default AdminPanel;
