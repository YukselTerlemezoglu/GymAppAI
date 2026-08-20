import React from 'react';
import { createPortal } from 'react-dom';
import { Home, Dumbbell, Trophy, User } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Sabit alt navigasyon cubugu (document.body'ye portal ile).
 * Portal sayesinde framer-motion parent transform'larindan etkilenmez.
 * Stil index.css'teki .bottom-nav / .bottom-nav-item class'larinda;
 * burada sadece tema bagimli ikon renkleri hesaplanir.
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
        <nav className="bottom-nav" role="navigation">
            {items.map(item => {
                const isActive = (isDashboard && item.id === dashboardTab) || (!isDashboard && item.id === 'profile' && currentView === 'profile');
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
                        className={`bottom-nav-item${isActive ? ' active' : ''}`}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <span className="bn-icon">
                            <Icon
                                size={20}
                                color="currentColor"
                                strokeWidth={isActive ? 2.4 : 2}
                                style={{ color: isActive ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}
                            />
                        </span>
                        <span className="bn-label">
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>,
        document.body
    );
}

export default BottomNav;
