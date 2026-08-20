import React from 'react';
import { createPortal } from 'react-dom';
import { Home, Dumbbell, Trophy, User } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

// Sabit renkler: lucide SVG attribute'larinda CSS var() calismaz
const COL_ACTIVE = '#00c3ff';
const COL_IDLE = '#9fb0c9';

/**
 * Sabit alt navigasyon cubugu (document.body'ye portal ile).
 * Portal sayesinde framer-motion parent transform'larindan etkilenmez.
 * Ana ekranda aktif sekmeyi gosterir; diger ekranlarda sekmeler dashboard'a dondurur.
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

    return createPortal(
        <nav
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 900,
                display: 'flex',
                justifyContent: 'center',
                paddingTop: '8px',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
                background: 'rgba(8, 11, 18, 0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderTop: '1px solid rgba(0, 195, 255, 0.18)',
                boxShadow: '0 -8px 30px rgba(0,0,0,0.4)'
            }}
        >
            <div style={{ display: 'flex', width: '100%', maxWidth: '600px' }}>
                {items.map(item => {
                    const isActive = isDashboard && item.id === dashboardTab;
                    const Icon = item.icon;
                    const isProfile = item.id === 'profile';
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (isProfile) {
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
                                cursor: 'pointer'
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
                                    color={isActive ? COL_ACTIVE : COL_IDLE}
                                    strokeWidth={isActive ? 2.4 : 2}
                                />
                            </span>
                            <span style={{
                                fontSize: '0.62rem',
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? COL_ACTIVE : COL_IDLE,
                                letterSpacing: '0.2px'
                            }}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>,
        document.body
    );
}

export default BottomNav;
