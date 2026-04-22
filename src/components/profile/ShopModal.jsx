import React from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Lock, Palette } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

const THEME_SHOP = [
    { id: 'default', name_tr: 'Klasik Neon (Zümrüt)', name_en: 'Classic Neon (Emerald)', price: 0, color1: '#00ff88', color2: '#00d4ff' },
    { id: 'blood', name_tr: 'Kanlı Ay (Kırmızı)', name_en: 'Blood Moon (Red)', price: 100, color1: '#ff4757', color2: '#ff6b81' },
    { id: 'cyberpunk', name_tr: 'Siberpunk (Mor)', name_en: 'Cyberpunk (Purple)', price: 250, color1: '#ff00ff', color2: '#00ffff' },
    { id: 'gold', name_tr: 'Olimpiyat (Altın)', name_en: 'Olympic (Gold)', price: 500, color1: '#ffd700', color2: '#ffa502' },
    { id: 'abyss', name_tr: 'Abyss (Okyanus Mavisi)', name_en: 'Abyss (Ocean Blue)', price: 750, color1: '#0984e3', color2: '#00cec9' },
    { id: 'toxic', name_tr: 'Zehir (Asit Yeşili)', name_en: 'Toxic (Acid Green)', price: 1000, color1: '#adff2f', color2: '#7fff00' },
    { id: 'sakura', name_tr: 'Sakura (Pembe)', name_en: 'Sakura (Pink)', price: 1000, color1: '#ffb7b2', color2: '#e28495' },
    { id: 'sunset', name_tr: 'Gün Batımı (Turuncu)', name_en: 'Sunset (Orange)', price: 1250, color1: '#ff7e5f', color2: '#feb47b' },
    { id: 'darkmatter', name_tr: 'Karanlık Madde (Siyah&Beyaz)', name_en: 'Dark Matter (B&W)', price: 1500, color1: '#ffffff', color2: '#222222' }
];

function ShopModal({
    onClose,
    userCoins,
    setUserCoins,
    unlockedThemes,
    setUnlockedThemes,
    activeTheme,
    setActiveTheme
}) {
    const { t, lang } = useTranslation();
    
    const handleBuyOrEquipTheme = (theme) => {
        const themeName = lang === 'tr' ? theme.name_tr : theme.name_en;
        if (unlockedThemes.includes(theme.id)) {
            // Equip
            setActiveTheme(theme.id);
        } else {
            // Buy
            if (userCoins >= theme.price) {
                if (window.confirm(t('shop_buy_confirm', { name: themeName, price: theme.price }))) {
                    setUserCoins(userCoins - theme.price);
                    setUnlockedThemes([...unlockedThemes, theme.id]);
                    setActiveTheme(theme.id);
                }
            } else {
                alert(t('shop_insufficient_coins', { needed: theme.price - userCoins }));
            }
        }
    };

    return createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
            <div className="glass-card slide-in" style={{ width: '100%', maxWidth: '400px', background: 'rgba(15, 17, 21, 0.95)', border: '1px solid var(--accent-primary)', position: 'relative', overflow: 'hidden' }}>
                
                <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                    <X size={18} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '0.8rem 1.5rem', borderRadius: '20px', border: '1px solid #ffd700', color: '#ffd700', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🪙</span> {t('shop_coins_total', { count: userCoins })}
                        </div>
                    </div>
                    <h2 style={{ color: '#fff', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0' }}>
                        <Palette size={24} /> {t('shop_title')}
                    </h2>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{t('shop_subtitle')}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '5px' }}>
                    {THEME_SHOP.map(theme => {
                        const isUnlocked = unlockedThemes.includes(theme.id);
                        const isActive = activeTheme === theme.id;
                        const themeName = lang === 'tr' ? theme.name_tr : theme.name_en;
                        
                        return (
                            <div key={theme.id} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '1rem', 
                                background: isActive ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)', 
                                borderRadius: '12px',
                                border: isActive ? `1px solid ${theme.color1}` : '1px solid rgba(255,255,255,0.05)',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`, border: '2px solid #fff' }}></div>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{themeName}</div>
                                        {!isUnlocked && <div style={{ color: '#ffd700', fontSize: '0.8rem', fontWeight: 'bold' }}>🪙 {theme.price}</div>} 
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => handleBuyOrEquipTheme(theme)}
                                    className="neon-btn"
                                    style={{ 
                                        padding: '0.4rem 0.8rem', 
                                        fontSize: '0.85rem', 
                                        width: 'auto',
                                        background: isActive ? `rgba(255,255,255,0.1)` : 'transparent',
                                        borderColor: isUnlocked ? theme.color1 : '#ffd700',
                                        color: isUnlocked ? (isActive ? '#fff' : theme.color1) : '#ffd700',
                                        boxShadow: isActive ? 'none' : 'auto'
                                    }}
                                >
                                    {isActive ? <><Check size={16}/> {t('shop_active')}</> : (isUnlocked ? t('shop_equip') : <><Lock size={16}/> {t('shop_buy_btn')}</>)}
                                </button>
                            </div>
                        )
                    })}
                </div>

            </div>
        </div>,
        document.body
    );
}

export default ShopModal;
