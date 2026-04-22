import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ArrowLeft, User, Mail, Lock, LogIn, UserPlus, Type } from 'lucide-react';
import { auth } from '../../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { pushDataToCloud, pullDataFromCloud } from '../../utils/cloudSync';

function AuthScreen({ onBack, onLoginSuccess, setUserName }) {
    const { t, lang } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [syncStatusText, setSyncStatusText] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                setSyncStatusText(t('auth_signing_in'));
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                
                // Kullanıcı giriş yaptı, buluttan veriyi çek
                try {
                    setSyncStatusText(t('auth_searching_cloud'));
                    // 3 Saniye içinde cevap gelmezse geç
                    const pullPromise = pullDataFromCloud(userCredential.user.uid);
                    const pulled = await Promise.race([
                        pullPromise,
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
                    ]);

                    if (pulled) {
                        setSyncStatusText(t('auth_data_synced'));
                        window.location.reload(); // Değişikliklerin yansıması için sayfayı yenile
                        return;
                    } else {
                        setSyncStatusText(t('auth_backing_up'));
                        pushDataToCloud(userCredential.user.uid);
                    }
                } catch (syncErr) {
                    console.warn("Giriş yapıldı ama eşitleme başarısız veya zaman aşımı:", syncErr);
                }
                onLoginSuccess();
            } else {
                setSyncStatusText(t('auth_creating_account'));
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // İsim eklendiğinde Firebase Profilini ve uygulamanın localStorage ismini güncelle
                if (name.trim()) {
                    await updateProfile(userCredential.user, { displayName: name });
                    if (setUserName) setUserName(name);
                }

                // Yeni kayıt oldu, mevcut cihaz verilerini buluta yedekle
                try {
                    setSyncStatusText(t('auth_backing_up'));
                    pushDataToCloud(userCredential.user.uid);
                } catch (syncErr) {
                    console.warn("Kayıt olundu ama yedekleme başarısız:", syncErr);
                }
                onLoginSuccess();
            }
        } catch (err) {
            console.error("Auth Error:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') setError(t('auth_error_not_found'));
            else if (err.code === 'auth/wrong-password') setError(t('auth_error_wrong_password'));
            else if (err.code === 'auth/email-already-in-use') setError(t('auth_error_email_in_use'));
            else if (err.code === 'auth/weak-password') setError(t('auth_error_weak_password'));
            else setError(t('auth_error_generic') + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container slide-in">
            <header className="top-bar fade-in" style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={20} /> {t('btn_back')}
                </button>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '1rem' }}>
                <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <User size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ color: 'white', margin: 0 }}>
                            {isLogin ? t('auth_title_login') : t('auth_title_register')}
                        </h2>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            {t('cloud_description')}
                        </p>
                    </div>

                    {error && (
                        <div style={{ background: 'rgba(255, 71, 87, 0.1)', border: '1px solid #ff4757', color: '#ff4757', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {!isLogin && (
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Type size={16} /> {t('auth_name')}</label>
                                <input 
                                    type="text" 
                                    className="neon-input" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin} 
                                    placeholder={t('auth_name_placeholder')}
                                />
                            </div>
                        )}

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} /> {t('auth_email')}</label>
                            <input 
                                type="email" 
                                className="neon-input" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                placeholder="ornek@email.com"
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={16} /> {t('auth_password')}</label>
                            <input 
                                type="password" 
                                className="neon-input" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                                placeholder="******"
                                minLength="6"
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="neon-btn" 
                            disabled={loading}
                            style={{ 
                                marginTop: '1rem', 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                gap: '8px',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? syncStatusText || t('auth_processing') : (isLogin ? <><LogIn size={18} /> {t('auth_btn_login')}</> : <><UserPlus size={18} /> {t('auth_btn_register')}</>)}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            {isLogin ? t('auth_switch_to_register') : t('auth_switch_to_login')}
                        </p>
                        <button 
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', textDecoration: 'underline', cursor: 'pointer', fontSize: '1rem' }}
                        >
                            {isLogin ? t('auth_title_register') : t('auth_title_login')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthScreen;
