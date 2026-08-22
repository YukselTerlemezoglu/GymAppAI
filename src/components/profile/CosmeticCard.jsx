import React from 'react';
import { Palette, Check } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';
import { RARITY, COSMETIC_FRAMES, COSMETIC_NAME_STYLES, COSMETIC_FLAMES, COSMETIC_PR_EFFECTS } from '../../data/shopItems';
import { ownsCosmetic, setCosmeticActive, clearCosmeticActive } from '../../utils/inventory';

/*
 * PROFIL OZELLESTIRME KARTI: sahip olunan kozmetikleri kusan/cikar.
 * Nerede gorundukleri her kategori basliginda yazili:
 *  - Cerceve: dost kapsulu + paylasim karti kenarligi
 *  - Isim stili: profil, lider tablosu, paylasim karti
 *  - Alev: skor karti + paylasim karti seri alevi
 *  - PR efekti: rekor kirinca patlayan konfeti stili
 */
function CosmeticCard({ ownedCosmetics, activeCosmetics, setActiveCosmetics, onOpenShop }) {
    const { t, lang } = useTranslation();
    const { toast } = useToast();

    const groups = [
        { key: 'frame', title: t('shop_cat_frames'), applies: t('cos_applies_frame'), items: COSMETIC_FRAMES },
        { key: 'nameStyle', title: t('shop_cat_names'), applies: t('cos_applies_name'), items: COSMETIC_NAME_STYLES },
        { key: 'flame', title: t('shop_cat_flames'), applies: t('cos_applies_flame'), items: COSMETIC_FLAMES },
        { key: 'prEffect', title: t('shop_cat_prfx'), applies: t('cos_applies_prfx'), items: COSMETIC_PR_EFFECTS }
    ];

    const ownedTotal = groups.reduce(
        (s, g) => s + g.items.filter((i) => ownsCosmetic(ownedCosmetics, i.id)).length, 0
    );

    const toggle = (item, category) => {
        haptic(8);
        if (activeCosmetics?.[category] === item.id) {
            setActiveCosmetics(clearCosmeticActive(activeCosmetics, category));
            toast.info(t('shop_unequipped'));
        } else {
            setActiveCosmetics(setCosmeticActive(activeCosmetics, item.id));
            toast.success(t('shop_equipped', { name: lang === 'tr' ? item.title_tr : item.title_en }));
        }
    };

    return (
        <div className="glass-card slide-in">
            <h3 style={{ color: '#fff', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={20} color="#c06bff" /> {t('cos_title')}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-light)' }}>{ownedTotal}</span>
            </h3>

            {ownedTotal === 0 ? (
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '0 0 0.8rem' }}>
                    {t('cos_empty')}{' '}
                    <button onClick={onOpenShop} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.85rem' }}>
                        {t('profile_open_shop')}
                    </button>
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    {groups.filter((g) => g.items.some((i) => ownsCosmetic(ownedCosmetics, i.id))).map((g) => (
                        <div key={g.key}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                <h4 style={{ color: 'var(--text-light)', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{g.title}</h4>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{g.applies}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {g.items.filter((i) => ownsCosmetic(ownedCosmetics, i.id)).map((item) => {
                                    const isActive = activeCosmetics?.[g.key] === item.id;
                                    const rarity = RARITY[item.rarity] || RARITY.common;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => toggle(item, g.key)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '0.45rem 0.8rem', borderRadius: '10px', cursor: 'pointer',
                                                background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)',
                                                border: `1px solid ${isActive ? rarity.color : 'rgba(255,255,255,0.08)'}`,
                                                color: '#fff', fontSize: '0.8rem', fontWeight: 'bold',
                                                transition: 'all 0.15s'
                                            }}
                                            title={lang === 'tr' ? item.title_tr : item.title_en}
                                        >
                                            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                                            {lang === 'tr' ? item.title_tr : item.title_en}
                                            {isActive && <Check size={13} color={rarity.color} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CosmeticCard;
