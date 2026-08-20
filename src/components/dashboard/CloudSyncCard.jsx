import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Cloud, LogIn, RefreshCcw, LogOut, CheckCircle } from 'lucide-react';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { pushDataToCloud } from '../../utils/cloudSync';
import { error as logError } from '../../utils/logger';
import { useToast } from '../ui/ToastProvider';

function CloudSyncCard({ currentUser, onLoginClick }) {
    const { t } = useLanguage();
    const { toast, confirmDialog } = useToast();
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);

    const handleForceSync = async () => {
        if (!currentUser) return;
        setIsSyncing(true);
        setSyncSuccess(false);
        try {
            await pushDataToCloud(currentUser.uid);
            setSyncSuccess(true);
            toast.success(t('cloud_synced'));
            setTimeout(() => setSyncSuccess(false), 3000); // 3 saniye sonra başarı ikonunu kaldır
        } catch (error) {
            logError("Senkronizasyon hatası:", error);
            toast.error(t('cloud_error'));
        } finally {
            setIsSyncing(false);
        }
    };

    const handleLogout = async () => {
        const ok = await confirmDialog({
            title: t('confirm_logout_title'),
            message: t('confirm_logout'),
            confirmLabel: t('cloud_logout'),
            cancelLabel: t('aw_exit_cancel')
        });
        if (ok) {
            try {
                await signOut(auth);
                toast.info(t('cloud_logout_toast'));
            } catch (error) {
                logError("Çıkış yapılırken hata:", error);
            }
        }
    };

    if (!currentUser) {
        return (
            <div className="glass-card slide-in" style={{ border: '1px solid #00c3ff', background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0, 195, 255, 0.05) 100%)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(0, 195, 255, 0.2)', padding: '10px', borderRadius: '50%' }}>
                        <Cloud size={24} color="#00c3ff" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{t('cloud_title')}</h3>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-light)', fontSize: '0.85rem' }}>{t('cloud_description')}</p>
                    </div>
                </div>
                <button 
                    onClick={onLoginClick} 
                    className="neon-btn" 
                    style={{ borderColor: '#00c3ff', color: '#00c3ff', background: 'rgba(0, 195, 255, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                    <LogIn size={18} /> {t('cloud_login').toLocaleUpperCase('tr-TR')}
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card slide-in" style={{ border: '1px solid #00ff88', background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0, 255, 136, 0.05) 100%)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(0, 255, 136, 0.2)', padding: '10px', borderRadius: '50%' }}>
                    <Cloud size={24} color="#00ff88" />
                </div>
                <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t('cloud_logged_in')} {syncSuccess && <CheckCircle size={16} color="#00ff88" />}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                        <strong style={{ color: '#00ff88' }}>{currentUser.email}</strong> {t('cloud_connected_as')}.
                    </p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                    onClick={handleForceSync} 
                    disabled={isSyncing} 
                    className="neon-btn" 
                    style={{ flex: 2, borderColor: '#00ff88', color: '#00ff88', background: 'rgba(0, 255, 136, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                    <RefreshCcw size={18} className={isSyncing ? "spin-animation" : ""} /> 
                    {isSyncing ? t('cloud_syncing').toLocaleUpperCase('tr-TR') : t('cloud_backup_now')}
                </button>
                <button 
                    onClick={handleLogout} 
                    className="neon-btn" 
                    style={{ flex: 1, borderColor: '#ff4757', color: '#ff4757', background: 'rgba(255, 71, 87, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.5rem' }}
                    title={t('app_logout_tooltip')}
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
    );
}

export default CloudSyncCard;
