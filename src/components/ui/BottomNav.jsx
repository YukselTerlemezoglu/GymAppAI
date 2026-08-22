import React from 'react';
import { createPortal } from 'react-dom';
import { Home, Dumbbell, Trophy, User, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
/**
 * Sabit alt navigasyon cubugu (document.body'ye portal ile).
 * Portal sayesinde framer-motion parent transform'larindan etkilenmez.
 * Stil index.css'teki .bottom-nav / .bottom-nav-item class'larinda;
 * burada sadece tema bagimli ikon renkleri hesaplanir.
 */
function BottomNav({ currentView, dashboardTab, onGoHome, onSelectTab, onOpenShop }) {
    const { t } = useLanguage();

    const isDashboard = currentView === 'dashboard';
    const items = [
        { id: 'today', icon: Home, label: t('tab_today') },
        { id: 'train', icon: Dumbbell, label: t('tab_train') },
        { id: 'progress', icon: Trophy, label: t('tab_progress') },
        { id: 'shop', icon: ShoppingBag, label: t('tab_shop') },
        { id: 'profile', icon: User, label: t('nav_profile') }
    ];

    return createPortal(
        <nav className="bottom-nav" role="navigation">
            {items.map(item => {
                const isActive = (isDashboard && item.id === dashboardTab) || (!isDashboard && item.id === 'profile' && currentView === 'profile');
                const Icon = item.icon;
                const isProfile = item.id === 'profile';
                const isShop = item.id === 'shop';
                return (
                    <button
                        key={item.id}
                        onClick={() => {
                            if (isProfile) {
                                onGoHome('profile');
                            } else if (isShop) {
                                onOpenShop();
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
                            {isShop && (
                                <span
                                    style={{
                                        position: 'absolute', top: '-2px', right: '-4px', fontSize: '0.62rem',
                                        animation: 'wheelHint 1.2s ease-in-out infinite'
                                    }}
                                    title={t('shop_wheel_free_ready')}
                                >🎡</span>
                            )}
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
