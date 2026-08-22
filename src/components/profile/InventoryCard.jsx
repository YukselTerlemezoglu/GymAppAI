import React from 'react';
import { Backpack, Info } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';
import { BOOSTS } from '../../data/shopItems';
import { findBuddy } from '../../utils/buddy';

/*
 * ENVANTER KARTI: satin alinan boostlarin stogunu gosterir ve nerede
 * kullanilacaklarini aciklar. Dondurucu otomatik, iksir antrenman basinda
 * sorulur, atistirmalik buradan (veya dukkan Dost sekmesinden) beslenir.
 */
function InventoryCard({ inventory, activeBuddyId, onFeedSnack, onOpenShop }) {
    const { t, lang } = useTranslation();
    const { toast } = useToast();

    const rows = BOOSTS.map((b) => ({ ...b, stock: (inventory && inventory[b.id]) || 0 }));
    const hasAnything = rows.some((r) => r.stock > 0);
    const snackRow = rows.find((r) => r.id === 'snack');

    // Atistirmalik icin hedef dost
    const buddy = activeBuddyId ? findBuddy(activeBuddyId) : null;

    const usageOf = (id) => {
        if (id === 'freeze') return t('myinv_usage_freeze');
        if (id === 'xp2') return t('myinv_usage_xp2');
        return t('myinv_usage_snack');
    };

    const feed = () => {
        if (!snackRow || snackRow.stock <= 0) return;
        if (!activeBuddyId) {
            toast.warning(t('myinv_no_buddy'));
            return;
        }
        haptic(10);
        onFeedSnack();
        toast.success(t('shop_fed_buddy', { name: lang === 'tr' ? buddy.title_tr : buddy.title_en }));
    };

    return (
        <div className="glass-card slide-in">
            <h3 style={{ color: '#fff', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Backpack size={20} color="#ffd700" /> {t('myinv_title')}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-light)' }}>{t('myinv_count', { count: rows.reduce((s, r) => s + r.stock, 0) })}</span>
            </h3>

            {!hasAnything ? (
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '0 0 0.8rem' }}>
                    {t('myinv_empty')}{' '}
                    <button onClick={onOpenShop} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.85rem' }}>
                        {t('profile_open_shop')}
                    </button>
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {rows.filter((r) => r.stock > 0).map((r) => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{r.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                    {lang === 'tr' ? r.title_tr : r.title_en}
                                    <span style={{ color: 'var(--accent-primary)', marginLeft: '6px' }}>×{r.stock}</span>
                                </div>
                                <div style={{ color: 'var(--text-light)', fontSize: '0.72rem', marginTop: '2px' }}>{usageOf(r.id)}</div>
                            </div>
                            {r.id === 'snack' && (
                                <button onClick={feed} className="neon-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto', flexShrink: 0, borderColor: '#ff6b81', color: '#ff6b81', background: 'transparent' }}>
                                    {t('myinv_feed_btn')}
                                </button>
                            )}
                        </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-muted)', fontSize: '0.72rem', paddingTop: '0.4rem' }}>
                        <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>{t('myinv_hint')}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InventoryCard;
