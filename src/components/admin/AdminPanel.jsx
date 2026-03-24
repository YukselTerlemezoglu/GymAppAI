import React, { useState } from 'react';
import { Shield, Save, RefreshCcw, Trash2, ArrowLeft } from 'lucide-react';

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
    const [passwordInput, setPasswordInput] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Hardcoded simple admin password
    const ADMIN_PASS = "1234";

    const [editXP, setEditXP] = useState(userXP);
    const [editLevel, setEditLevel] = useState(userLevel);
    const [editCoins, setEditCoins] = useState(userCoins);

    const [simulateXP, setSimulateXP] = useState(1000);

    const handleLogin = (e) => {
        e.preventDefault();
        if (passwordInput === ADMIN_PASS) {
            setIsAuthenticated(true);
        } else {
            alert("Hatalı Şifre!");
            setPasswordInput('');
        }
    };

    const handleSaveModifications = () => {
        if (window.confirm("Girdiğiniz statik değerler sisteme kaydedilsin mi?")) {
            setUserXP(Number(editXP));
            setUserLevel(Number(editLevel));
            setUserCoins(Number(editCoins));
            alert("Değerler başarıyla güncellendi!");
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

        alert(`Simülasyon Başarılı! \n+${simulateXP} XP Eklendi.\n+${earnedCoins} Jeton Eklendi.\nYeni Seviyen: ${currentLvl}. \n\nDashboard'a dönünce konfetiler patlayacak!`);
    };

    const handleFullReset = () => {
        if (window.confirm("BÜYÜK UYARI: Uygulamadaki tüm idman geçmişi, skorlar, jetonlar, temalar, rozetler ve istatistiklerinizi KESİN OLARAK SIFIRLAMAK istiyor musunuz? Bu işlem geri alınamaz!")) {
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
            localStorage.clear(); // Tam temizlik
            alert("Sistem tamamen sıfırlandı. Lütfen sayfayı yenisi ile başlatın.");
            window.location.reload();
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="app-container slide-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '1rem' }}>
                <form onSubmit={handleLogin} className="glass-card" style={{ width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', border: '1px solid #ff4757' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                        <button type="button" className="back-btn" onClick={onBack} style={{ margin: 0 }}>
                            <ArrowLeft size={20} /> Geri
                        </button>
                    </div>

                    <div>
                        <Shield size={48} color="#ff4757" style={{ margin: '0 auto 1rem' }} />
                        <h2 style={{ color: '#fff', margin: 0 }}>Admin Paneli</h2>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Geliştirici kontrolleri için şifre girin.</p>
                    </div>

                    <input
                        type="password"
                        className="neon-input"
                        placeholder="Admin Şifresi (admin123)"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        required
                        autoFocus
                    />

                    <button type="submit" className="neon-btn" style={{ width: '100%', borderColor: '#ff4757', color: '#ff4757', background: 'rgba(255, 71, 87, 0.1)' }}>
                        GİRİŞ YAP
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="app-container slide-in">
            <header className="top-bar" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <button className="back-btn" onClick={onBack} style={{ margin: 0 }}>
                    <ArrowLeft size={20} /> Geri
                </button>
                <h2 style={{ color: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Shield size={24} /> Admin Modu
                </h2>
            </header>

            <div className="glass-card fade-in" style={{ border: '1px solid #00ff88', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                <h3 style={{ color: '#00ff88', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,255,136,0.1)', paddingBottom: '0.5rem' }}>📈 XP ve Seviye Simülatörü</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>Gerçek bir idman bitirmiş gibi XP ve Jeton kazandırır, gerekirse seviye atlatır.</p>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="input-group" style={{ flexGrow: 1, marginBottom: 0 }}>
                        <input type="number" className="neon-input" value={simulateXP} onChange={(e) => setSimulateXP(e.target.value)} placeholder="Eklenecek XP" />
                    </div>
                    <button onClick={handleSimulateXP} className="neon-btn" style={{ borderColor: '#00ff88', color: '#00ff88', whiteSpace: 'nowrap' }}>
                        XP KAZAN!
                    </button>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setStreak(streak + 1)} className="neon-btn-secondary" style={{ flexGrow: 1 }}>
                        🔥 Seriyi +1 Artır (Mevcut: {streak})
                    </button>
                    <button onClick={() => setStreak(0)} className="neon-btn-secondary" style={{ flexGrow: 1, color: '#ff4757' }}>
                        🧨 Seriyi Boz
                    </button>
                </div>
            </div>

            <div className="glass-card fade-in" style={{ border: '1px solid #00c3ff', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#00c3ff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,195,255,0.1)', paddingBottom: '0.5rem' }}>🛠 Manuel Veri Düzenleme</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>Aşağıdaki değerleri doğrudan üzerine yazar. (Seviye atlatma mantığını çalıştırmaz).</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>XP Ekle / Düzenle</label>
                        <input type="number" className="neon-input" value={editXP} onChange={(e) => setEditXP(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Level (Seviye) Düzenle</label>
                        <input type="number" className="neon-input" value={editLevel} onChange={(e) => setEditLevel(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Jeton (Coin) Düzenle</label>
                        <input type="number" className="neon-input" value={editCoins} onChange={(e) => setEditCoins(e.target.value)} />
                    </div>
                </div>

                <button onClick={handleSaveModifications} className="neon-btn" style={{ width: '100%', borderColor: '#00c3ff', color: '#00c3ff', background: 'rgba(0, 195, 255, 0.1)' }}>
                    <Save size={18} /> DEĞERLERİ KAYDET
                </button>
            </div>

            <div className="glass-card fade-in" style={{ border: '1px solid #ff4757', background: 'rgba(255, 71, 87, 0.05)' }}>
                <h3 style={{ color: '#ff4757', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 71, 87, 0.2)', paddingBottom: '0.5rem' }}>Tehlikeli Bölge (Sıfırlama)</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1rem' }}>Sistemi tamamen sıfırlamak istiyorsanız aşağıdaki butonu kullanın. Tüm kayıtlı veriler kalıcı olarak silinir.</p>
                <button onClick={handleFullReset} className="neon-btn" style={{ width: '100%', borderColor: '#ff4757', color: '#ff4757', background: 'rgba(255, 71, 87, 0.1)' }}>
                    <Trash2 size={18} /> TÜM SİSTEMİ SIFIRLA (HARD RESET)
                </button>
            </div>
        </div>
    );
}

export default AdminPanel;
