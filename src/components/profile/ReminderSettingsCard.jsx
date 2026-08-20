import React, { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useToast } from '../ui/ToastProvider';
import {
    getReminderSettings,
    saveReminderSettings,
    requestNotificationPermission,
    notificationsSupported
} from '../../utils/notificationScheduler';

const DAYS_TR = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Bildirim/hatirlatma ayarlari karti (profil sayfasi).
 * Antrenman gunleri + saat secimi, su hatirlatma araligi.
 */
function ReminderSettingsCard() {
    const { t, lang } = useLanguage();
    const { toast } = useToast();
    const [settings, setSettings] = useState(getReminderSettings());
    const [permission, setPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
    );

    const days = lang === 'tr' ? DAYS_TR : DAYS_EN;
    const supported = notificationsSupported();

    const persist = (next) => {
        setSettings(next);
        saveReminderSettings(next);
    };

    const toggleDay = (d) => {
        const has = settings.workoutDays.includes(d);
        const next = {
            ...settings,
            workoutDays: has ? settings.workoutDays.filter(x => x !== d) : [...settings.workoutDays, d]
        };
        persist(next);
    };

    const enableReminders = async () => {
        const perm = await requestNotificationPermission();
        setPermission(perm);
        if (perm === 'granted') {
            persist({ ...settings, enabled: true });
            toast.success(t('rem_enabled_ok'));
        } else if (perm === 'denied') {
            toast.error(t('rem_blocked'));
        } else {
            toast.warning(t('rem_unsupported'));
        }
    };

    return (
        <div className="glass-card slide-in" style={{ border: '1px solid rgba(0,195,255,0.2)', background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0,195,255,0.05) 100%)', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.7rem' }}>
                {settings.enabled ? <Bell size={20} color="#00c3ff" /> : <BellOff size={20} color="var(--text-muted)" />}
                <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{t('rem_title')}</h3>
                    <p style={{ margin: '2px 0 0 0', color: 'var(--text-light)', fontSize: '0.75rem' }}>{t('rem_subtitle')}</p>
                </div>
            </div>

            {!supported ? (
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0 }}>
                    {t('rem_unsupported')}
                </p>
            ) : !settings.enabled ? (
                <button
                    onClick={enableReminders}
                    className="neon-btn"
                    style={{ padding: '0.7rem', fontSize: '0.9rem', borderColor: '#00c3ff', color: '#00c3ff', background: 'rgba(0,195,255,0.1)' }}
                >
                    <Bell size={16} /> {t('rem_enable')}
                </button>
            ) : (
                <>
                    {/* Antrenman gunleri */}
                    <div style={{ marginBottom: '0.9rem' }}>
                        <div style={{ color: 'var(--text-light)', fontSize: '0.78rem', marginBottom: '6px', fontWeight: 600 }}>
                            {t('rem_days')}
                        </div>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {days.map((d, i) => {
                                // Takvim sirasiyla goster (Pzt'den basla)
                                const dayIdx = (i + 6) % 7;
                                const active = settings.workoutDays.includes(dayIdx);
                                return (
                                    <button
                                        key={dayIdx}
                                        onClick={() => toggleDay(dayIdx)}
                                        style={{
                                            padding: '6px 0',
                                            width: '40px',
                                            borderRadius: '8px',
                                            border: `1px solid ${active ? 'rgba(0,195,255,0.5)' : 'rgba(255,255,255,0.12)'}`,
                                            background: active ? 'rgba(0,195,255,0.18)' : 'transparent',
                                            color: active ? '#00c3ff' : 'var(--text-light)',
                                            fontSize: '0.72rem',
                                            fontWeight: active ? 700 : 500,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Saat */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.78rem', fontWeight: 600 }}>{t('rem_time')}</span>
                        <input
                            type="time"
                            value={settings.time}
                            onChange={(e) => persist({ ...settings, time: e.target.value })}
                            style={{
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(0,195,255,0.3)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                color: '#fff',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                outline: 'none',
                                colorScheme: 'dark'
                            }}
                        />
                    </div>

                    {/* Su hatirlatma */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.78rem', fontWeight: 600 }}>{t('rem_water')}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {settings.waterReminder && (
                                <select
                                    value={settings.waterEveryMin}
                                    onChange={(e) => persist({ ...settings, waterEveryMin: parseInt(e.target.value, 10) })}
                                    style={{
                                        background: 'rgba(0,0,0,0.4)',
                                        border: '1px solid rgba(0,255,136,0.3)',
                                        borderRadius: '8px',
                                        padding: '6px 8px',
                                        color: '#fff',
                                        fontSize: '0.8rem',
                                        outline: 'none'
                                    }}
                                >
                                    <option value={30}>30 dk</option>
                                    <option value={60}>1 sa</option>
                                    <option value={90}>1.5 sa</option>
                                    <option value={120}>2 sa</option>
                                </select>
                            )}
                            <button
                                onClick={() => persist({ ...settings, waterReminder: !settings.waterReminder })}
                                style={{
                                    width: '44px', height: '24px',
                                    borderRadius: '12px',
                                    border: `1px solid ${settings.waterReminder ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.15)'}`,
                                    background: settings.waterReminder ? 'rgba(0,255,136,0.25)' : 'rgba(255,255,255,0.06)',
                                    position: 'relative',
                                    cursor: 'pointer'
                                }}
                                aria-label={t('rem_water')}
                            >
                                <span style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: settings.waterReminder ? '22px' : '2px',
                                    width: '18px', height: '18px',
                                    borderRadius: '50%',
                                    background: settings.waterReminder ? '#00ff88' : '#888',
                                    transition: 'all 0.2s'
                                }} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => { persist({ ...settings, enabled: false }); toast.info(t('rem_disabled')); }}
                        style={{
                            width: '100%',
                            padding: '8px 0',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'transparent',
                            color: 'var(--text-light)',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        {t('rem_disable')}
                    </button>
                </>
            )}
        </div>
    );
}

export default ReminderSettingsCard;
