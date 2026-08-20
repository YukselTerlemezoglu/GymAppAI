import React from 'react';
import { Home, Dumbbell, Bot, Trophy, User } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Sabit alt navigasyon cubugu.
 * Ana ekranda aktif sekmeyi gosterir; diger ekranlarda "Ana Sayfa" donus ikonu olur.
 * safe-area-inset-bottom ile iPhone cukuruna oturur.
 */
function BottomNav({ currentView, dashboardTab, onGoHome, onSelectTab }) {
    const { t } = useLanguage();

    const isDashboard = currentView === 'dashboard';
    const items = [
        { id: 'today', icon: Home, label: t('tab_today') },
        { id: 'train', icon: Dumbbell, label: t('tab_train') },
        { id: 'progress', icon: Trophy, label: t('tab_progress') },
        { id: 'profile', icon: User, label: t('nav_profile') }
    ];

    return (
        <nav
            className="fade-in"
            style={{
                position: 'fixed',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '600px',
                zIndex: 900,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'stretch',
                paddingTop: '8px',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
                background: 'rgba(8, 11, 18, 0.88)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderTop: '1px solid rgba(0, 195, 255, 0.18)',
                boxShadow: '0 -8px 30px rgba(0,0,0,0.4)'
            }}
        >
            {items.map(item => {
                const isActive = isDashboard && item.id === dashboardTab;
                const Icon = item.icon;
                const clickable = item.id === 'profile' || isDashboard;
                return (
                    <button
                        key={item.id}
                        disabled={!clickable}
                        onClick={() => {
                            if (!clickable) return;
                            if (item.id === 'profile') {
                                onGoHome('profile');
                            } else {
                                onSelectTab(item.id);
                            }
                        }}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            padding: '4px 2px',
                            background: 'transparent',
                            border: 'none',
                            cursor: clickable ? 'pointer' : 'default',
                            opacity: clickable ? 1 : 0.35,
                            transition: 'opacity 0.2s'
                        }}
                        aria-label={item.label}
                    >
                        <span
                            style={{
                                display: 'flex',
                                padding: '4px 14px',
                                borderRadius: '10px',
                                background: isActive ? 'linear-gradient(135deg, rgba(0,195,255,0.25), rgba(255,0,136,0.2))' : 'transparent',
                                boxShadow: isActive ? '0 0 14px rgba(0,195,255,0.3)' : 'none'
                            }}
                        >
                            <Icon
                                size={20}
                                color={isActive ? '#00c3ff' : 'var(--text-light)'}
                                strokeWidth={isActive ? 2.4 : 2}
                            />
                        </span>
                        <span style={{
                            fontSize: '0.62rem',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#00c3ff' : 'var(--text-light)',
                            letterSpacing: '0.2px'
                        }}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}

export default BottomNav;
