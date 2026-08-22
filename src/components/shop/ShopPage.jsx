import React, { useMemo, useState } from 'react';
import { Zap, Package, Dices, Palette, ArrowLeft, Lock, Check } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';
import { BOOSTS, BOXES, RARITY, COSMETIC_FRAMES, COSMETIC_NAME_STYLES, COSMETIC_FLAMES, COSMETIC_PR_EFFECTS } from '../../data/shopItems';
import { canBuyBoost, ownsCosmetic, buyCosmetic, setCosmeticActive, clearCosmeticActive } from '../../utils/inventory';
import { BUDDIES, getBuddyStageInfo, findBuddy } from '../../utils/buddy';
import { openChest, updateChestPity, openEgg, updateEggPity, spinWheel, getWheelState, updateWheelState, WHEEL_SEGMENTS, WHEEL_PRICE, CHEST_PITY_EPIC, EGG_PITY_EPIC, EGG_PITY_LEGENDARY } from '../../utils/gacha';
import GachaRevealModal from './GachaRevealModal';
import BuddyCapsule from './BuddyCapsule';

/*
 * DUKKAN SAYFASI - tam ekran gorunum, 4 sekme:
 *   1. Boostlar (tuketilebilirler)
 *   2. Dost & Profil (yumurta + kozmetik vitrin)
 *   3. Kutular & Cark (sans kutusu + gunluk cark)
 *   4. Temalar (mevcut tema listesi tasinir)
 */

const TABS = [
    { id: 'boosts', icon: Zap, labelKey: 'shop_tab_boosts' },
    { id: 'buddy', icon: Package, labelKey: 'shop_tab_buddy' },
    { id: 'boxes', icon: Dices, labelKey: 'shop_tab_boxes' },
    { id: 'themes', icon: Palette, labelKey: 'shop_tab_themes' }
];

function ShopPage({
    onBack,
    userCoins, setUserCoins,
    // envanter
    inventory, setInventory,
    ownedCosmetics, setOwnedCosmetics,
    activeCosmetics, setActiveCosmetics,
    // dost
    buddyCollection, setBuddyCollection,
    activeBuddyId, setActiveBuddyId,
    // pity + cark
    gachaPity, setGachaPity,
    wheelState, setWheelState,
    // XP (oduller icin)
    setUserXP,
    // temalar
    unlockedThemes, setUnlockedThemes,
    activeTheme, setActiveTheme,
    applyThemeFn
}) {
    const { t, lang } = useTranslation();
    const { toast, confirmDialog } = useToast();
    const [tab, setTab] = useState('boosts');
    const [reveal, setReveal] = useState(null);
    const [spinning, setSpinning] = useState(false);
    const [wheelAngle, setWheelAngle] = useState(0);
    // Gacha modalinin key'i: her acilista artar (Date.now yerine saf sayaç)
    const [revealKey, setRevealKey] = useState(0);

    const wheel = useMemo(() => getWheelState(wheelState), [wheelState]);

    // ---------- BOOST SATIN AL ----------
    const handleBuyBoost = async (boost) => {
        if (!canBuyBoost(inventory, boost.id)) {
            toast.warning(t('shop_stock_full'));
            return;
        }
        if (userCoins < boost.price) {
            toast.warning(t('shop_insufficient_coins', { needed: boost.price - userCoins }));
            return;
        }
        const ok = await confirmDialog({
            title: t('shop_buy_title'),
            message: t('shop_buy_confirm', { name: lang === 'tr' ? boost.title_tr : boost.title_en, price: boost.price }),
            confirmLabel: t('shop_buy_yes'),
            cancelLabel: t('shop_buy_no')
        });
        if (!ok) return;
        haptic(12);
        setUserCoins(userCoins - boost.price);
        setInventory({ ...(inventory || {}), [boost.id]: (inventory?.[boost.id] || 0) + 1 });
        toast.success(t('shop_bought', { name: lang === 'tr' ? boost.title_tr : boost.title_en }));
    };

    // ---------- KOZMETIK SATIN AL / KUSAN ----------
    const handleBuyCosmetic = async (item) => {
        if (ownsCosmetic(ownedCosmetics, item.id)) return;
        if (userCoins < item.price) {
            toast.warning(t('shop_insufficient_coins', { needed: item.price - userCoins }));
            return;
        }
        const ok = await confirmDialog({
            title: t('shop_buy_title'),
            message: t('shop_buy_confirm', { name: lang === 'tr' ? item.title_tr : item.title_en, price: item.price }),
            confirmLabel: t('shop_buy_yes'),
            cancelLabel: t('shop_buy_no')
        });
        if (!ok) return;
        haptic(12);
        const res = buyCosmetic(userCoins, ownedCosmetics, item.id);
        if (res.ok) {
            setUserCoins(res.coins);
            setOwnedCosmetics(res.owned);
            toast.success(t('shop_bought', { name: lang === 'tr' ? item.title_tr : item.title_en }));
        }
    };

    const handleEquipCosmetic = (item, category) => {
        haptic(8);
        const current = activeCosmetics?.[category];
        if (current === item.id) {
            setActiveCosmetics(clearCosmeticActive(activeCosmetics, category));
            toast.info(t('shop_unequipped'));
        } else {
            setActiveCosmetics(setCosmeticActive(activeCosmetics, item.id));
            toast.success(t('shop_equipped', { name: lang === 'tr' ? item.title_tr : item.title_en }));
        }
    };

    // ---------- SANS KUTUSU ----------
    const handleOpenChest = async () => {
        if (userCoins < BOXES[0].price) {
            toast.warning(t('shop_insufficient_coins', { needed: BOXES[0].price - userCoins }));
            return;
        }
        const ok = await confirmDialog({
            title: t('shop_chest_title'),
            message: t('shop_chest_confirm', { price: BOXES[0].price }),
            confirmLabel: t('shop_buy_yes'),
            cancelLabel: t('shop_buy_no')
        });
        if (!ok) return;

        const result = openChest(gachaPity, ownedCosmetics);
        applyGachaResult({ ...result, source: 'chest' });
        setUserCoins(userCoins - BOXES[0].price);
        setGachaPity(updateChestPity(gachaPity, result));
    };

    // ---------- DOST YUMURTASI ----------
    const handleOpenEgg = async () => {
        if (userCoins < BOXES[1].price) {
            toast.warning(t('shop_insufficient_coins', { needed: BOXES[1].price - userCoins }));
            return;
        }
        const ok = await confirmDialog({
            title: t('shop_egg_title'),
            message: t('shop_egg_confirm', { price: BOXES[1].price }),
            confirmLabel: t('shop_buy_yes'),
            cancelLabel: t('shop_buy_no')
        });
        if (!ok) return;

        const result = openEgg(gachaPity);
        const dupe = !!(buddyCollection && buddyCollection[result.buddyId]);
        setUserCoins(userCoins - BOXES[1].price);
        setGachaPity(updateEggPity(gachaPity, result));

        if (dupe) {
            // Tekrar: buddy XP'ye donustur
            const gain = result.dupeXp;
            setBuddyCollection((prev) => ({ ...(prev || {}), [result.buddyId]: { xp: (prev?.[result.buddyId]?.xp || 0) + gain } }));
            // Aktif dost yoksa bunu aktiflestir
            setActiveBuddyId((cur) => cur || result.buddyId);
        } else {
            setBuddyCollection((prev) => ({ ...(prev || {}), [result.buddyId]: { xp: 0 } }));
            setActiveBuddyId((cur) => cur || result.buddyId);
        }
        applyGachaResult({ ...result, source: 'egg', dupe });
    };

    // ---------- CARK ----------
    const handleSpin = async (useFree) => {
        if (spinning) return;
        if (!useFree) {
            const ws = getWheelState(wheelState);
            if (ws.extraLeft <= 0) {
                toast.warning(t('shop_wheel_no_extra'));
                return;
            }
            if (userCoins < WHEEL_PRICE) {
                toast.warning(t('shop_insufficient_coins', { needed: WHEEL_PRICE - userCoins }));
                return;
            }
            const ok = await confirmDialog({
                title: t('shop_wheel_title'),
                message: t('shop_wheel_extra_confirm', { price: WHEEL_PRICE }),
                confirmLabel: t('shop_buy_yes'),
                cancelLabel: t('shop_buy_no')
            });
            if (!ok) return;
            setUserCoins(userCoins - WHEEL_PRICE);
        }

        const result = spinWheel();
        setSpinning(true);
        haptic([10, 20, 10]);

        // Donus acisi: onceki acinin uzerine 4 tam tur + sonuc segmentinin
        // isaretcinin altina gelmesi icin gereken aci (deterministik).
        const segAngle = 360 / WHEEL_SEGMENTS.length;
        const targetCenter = result.segmentIndex * segAngle + segAngle / 2;
        const jitter = (result.segmentIndex * 37 + wheelAngle) % Math.max(1, segAngle - 8) - (segAngle - 8) / 2;
        const nextAngle = wheelAngle + 1440 + (360 - targetCenter) + jitter;
        setWheelAngle(nextAngle);

        // Donus animasyonu suresi (4sn) sonunda sonuc uygulanir
        setTimeout(() => {
            setSpinning(false);
            setWheelState(updateWheelState(wheelState, useFree));
            applyGachaResult({ ...result, source: 'wheel' });
        }, 4000);
    };

    // ---------- GACHA SONUCU UYGULA ----------
    const applyGachaResult = (result) => {
        switch (result.type) {
            case 'xp':
                setUserXP((prev) => (prev || 0) + result.amount);
                break;
            case 'coins':
                setUserCoins((prev) => (prev || 0) + result.amount);
                break;
            case 'buddyXp': {
                const target = activeBuddyId || Object.keys(buddyCollection || {})[0];
                if (target) {
                    setBuddyCollection((prev) => ({ ...(prev || {}), [target]: { xp: (prev?.[target]?.xp || 0) + result.amount } }));
                } else {
                    // Dostu yok: coin'e donus
                    setUserCoins((prev) => (prev || 0) + 50);
                    result = { ...result, type: 'coins', amount: 50, converted: true };
                }
                break;
            }
            case 'snack':
                setInventory((prev) => ({ ...(prev || {}), snack: (prev?.snack || 0) + result.amount }));
                break;
            case 'cosmetic': {
                const next = [...(ownedCosmetics || [])];
                if (!next.includes(result.cosmeticId)) next.push(result.cosmeticId);
                setOwnedCosmetics(next);
                break;
            }
            case 'jackpot':
                setUserXP((prev) => (prev || 0) + result.amount);
                setUserCoins((prev) => (prev || 0) + (result.coins || 0));
                break;
            default:
                break;
        }
        setRevealKey((k) => k + 1);
        setReveal(result);
    };

    // ---------- KOZMETIK SATIR (render yardimcisi; bilesen degil) ----------
    const renderCosmeticRow = (item, category) => {
        const owned = ownsCosmetic(ownedCosmetics, item.id);
        const isActive = activeCosmetics?.[category] === item.id;
        const rarity = RARITY[item.rarity] || RARITY.common;
        return (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', background: isActive ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)', borderRadius: '12px', border: isActive ? `1px solid ${rarity.color}` : '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{lang === 'tr' ? item.title_tr : item.title_en}</div>
                        <div style={{ color: rarity.color, fontSize: '0.7rem' }}>{t(`rarity_${item.rarity}`)}</div>
                    </div>
                </div>
                {owned ? (
                    <button onClick={() => handleEquipCosmetic(item, category)} className="neon-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', borderColor: rarity.color, color: isActive ? '#fff' : rarity.color, boxShadow: 'none' }}>
                        {isActive ? <><Check size={14} /> {t('shop_active')}</> : t('shop_equip')}
                    </button>
                ) : (
                    <button onClick={() => handleBuyCosmetic(item)} className="neon-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto', borderColor: '#ffd700', color: '#ffd700', background: 'transparent' }}>
                        <Lock size={14} /> 🪙 {item.price}
                    </button>
                )}
            </div>
        );
    };

    const renderCosmeticSection = (titleKey, items, category) => (
        <div key={titleKey}>
            <h4 style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '1.2rem 0 0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t(titleKey)}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {items.map((item) => renderCosmeticRow(item, category))}
            </div>
        </div>
    );

    return (
        <div className="app-container slide-in">
            {/* Ust bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '1.2rem' }}>
                <button onClick={onBack} className="neon-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} /> {t('back')}
                </button>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {t('shop_title')}
                </h2>
                <div style={{ background: 'rgba(255, 215, 0, 0.1)', border: '1px solid #ffd700', borderRadius: '12px', padding: '6px 12px', color: '#ffd700', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🪙</span> {userCoins}
                </div>
            </div>

            {/* Sekmeler */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '1.2rem', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '14px', overflowX: 'auto' }}>
                {TABS.map((tabDef) => (
                    <button
                        key={tabDef.id}
                        onClick={() => { haptic(8); setTab(tabDef.id); }}
                        style={{
                            flex: 1, minWidth: 'fit-content', padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            background: tab === tabDef.id ? 'var(--accent-primary)' : 'transparent',
                            color: tab === tabDef.id ? '#000' : 'var(--text-light)',
                            fontWeight: 'bold', fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <tabDef.icon size={15} /> {t(tabDef.labelKey)}
                    </button>
                ))}
            </div>

            {/* ============ SEKME: BOOSTLAR ============ */}
            {tab === 'boosts' && (
                <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {BOOSTS.map((boost) => {
                        const stock = inventory?.[boost.id] || 0;
                        const canBuy = canBuyBoost(inventory, boost.id) && userCoins >= boost.price;
                        return (
                            <div key={boost.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                    <span style={{ fontSize: '1.8rem' }}>{boost.icon}</span>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{lang === 'tr' ? boost.title_tr : boost.title_en}</div>
                                        <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', lineHeight: 1.35 }}>{lang === 'tr' ? boost.desc_tr : boost.desc_en}</div>
                                        <div style={{ color: stock > 0 ? 'var(--accent-primary)' : 'var(--text-muted)', fontSize: '0.7rem', marginTop: '3px' }}>
                                            {t('shop_stock', { count: stock })} / {boost.maxStock}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleBuyBoost(boost)}
                                    className="neon-btn"
                                    style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', width: 'auto', flexShrink: 0, borderColor: '#ffd700', color: canBuy ? '#ffd700' : 'rgba(255,215,0,0.4)', background: 'transparent' }}
                                >
                                    🪙 {boost.price}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ============ SEKME: DOST & PROFIL ============ */}
            {tab === 'buddy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Yumurta + aktif dost */}
                    <div className="glass-card" style={{ padding: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                <span style={{ fontSize: '2rem' }}>🥚</span>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{lang === 'tr' ? BOXES[1].title_tr : BOXES[1].title_en}</div>
                                    <div style={{ color: 'var(--text-light)', fontSize: '0.72rem', lineHeight: 1.35 }}>{lang === 'tr' ? BOXES[1].desc_tr : BOXES[1].desc_en}</div>
                                </div>
                            </div>
                            <button onClick={handleOpenEgg} className="neon-btn" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', width: 'auto', flexShrink: 0, borderColor: '#ffd700', color: '#ffd700', background: 'transparent' }}>
                                🪙 {BOXES[1].price}
                            </button>
                        </div>

                        {/* Pity gostergesi */}
                        <div style={{ marginTop: '0.8rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {t('shop_pity_egg', { epic: EGG_PITY_EPIC - (gachaPity?.egg || 0), leg: EGG_PITY_LEGENDARY - (gachaPity?.eggLegendary || 0) })}
                        </div>
                    </div>

                    {/* Koleksiyon (BuddyDex) */}
                    <div className="glass-card" style={{ padding: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                            <h4 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>{t('shop_buddydex_title')}</h4>
                            <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                {Object.keys(buddyCollection || {}).length}/{BUDDIES.length}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {BUDDIES.map((b) => {
                                const owned = !!(buddyCollection && buddyCollection[b.id]);
                                const rarity = RARITY[b.rarity] || RARITY.common;
                                const active = activeBuddyId === b.id;
                                return (
                                    <button
                                        key={b.id}
                                        onClick={() => {
                                            if (!owned) { toast.info(t('shop_buddy_locked')); return; }
                                            haptic(8);
                                            setActiveBuddyId(active ? null : b.id);
                                            toast.success(active ? t('shop_buddy_unset') : t('shop_buddy_set', { name: lang === 'tr' ? b.title_tr : b.title_en }));
                                        }}
                                        style={{
                                            position: 'relative', aspectRatio: '1', borderRadius: '12px', cursor: owned ? 'pointer' : 'default',
                                            background: owned ? `radial-gradient(circle at 50% 35%, ${rarity.glow} 0%, rgba(0,0,0,0.4) 70%)` : 'rgba(0,0,0,0.3)',
                                            border: active ? `2px solid ${rarity.color}` : `1px solid ${owned ? rarity.color + '55' : 'rgba(255,255,255,0.05)'}`,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                                            filter: owned ? 'none' : 'grayscale(1) brightness(0.5)', transition: 'all 0.2s'
                                        }}
                                        title={owned ? (lang === 'tr' ? b.title_tr : b.title_en) : '???'}
                                    >
                                        <span style={{ fontSize: '1.5rem' }}>{owned ? b.icon : '❔'}</span>
                                        <span style={{ fontSize: '0.55rem', color: owned ? rarity.color : 'var(--text-muted)', fontWeight: 'bold' }}>
                                            {owned ? (lang === 'tr' ? b.title_tr : b.title_en).slice(0, 10) : '???'}
                                        </span>
                                        {active && (
                                            <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 6px var(--accent-primary)' }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Aktif dost kapsulu */}
                        {activeBuddyId && buddyCollection?.[activeBuddyId] && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <BuddyCapsule buddyId={activeBuddyId} xp={buddyCollection[activeBuddyId].xp} size={64} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {(() => {
                                        const info = getBuddyStageInfo(buddyCollection[activeBuddyId].xp);
                                        return (
                                            <>
                                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                    {lang === 'tr' ? findBuddy(activeBuddyId)?.title_tr : findBuddy(activeBuddyId)?.title_en}
                                                    <span style={{ color: 'var(--text-light)', fontWeight: 'normal', fontSize: '0.78rem' }}> · {lang === 'tr' ? info.stage.title_tr : info.stage.title_en}</span>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginBottom: '3px' }}>
                                                    {info.next
                                                        ? `${info.currentXp.toLocaleString()} / ${info.next.threshold.toLocaleString()} XP`
                                                        : t('shop_buddy_max_stage')}
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${info.percent}%`, height: '100%', background: `linear-gradient(90deg, ${RARITY[findBuddy(activeBuddyId)?.rarity]?.color || '#00c3ff'}, #ff0088)`, transition: 'width 0.6s ease' }} />
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                                {/* Atistirmalik besle */}
                                <button
                                    onClick={() => {
                                        const stock = inventory?.snack || 0;
                                        if (stock <= 0) { toast.warning(t('shop_no_snacks')); return; }
                                        haptic(10);
                                        setInventory((prev) => ({ ...prev, snack: (prev.snack || 1) - 1 }));
                                        setBuddyCollection((prev) => ({ ...prev, [activeBuddyId]: { xp: (prev[activeBuddyId]?.xp || 0) + 150 } }));
                                        toast.success(t('shop_fed_buddy', { name: lang === 'tr' ? findBuddy(activeBuddyId)?.title_tr : findBuddy(activeBuddyId)?.title_en }));
                                    }}
                                    className="neon-btn"
                                    style={{ padding: '0.5rem 0.7rem', fontSize: '0.8rem', width: 'auto', flexShrink: 0, borderColor: '#ff6b81', color: '#ff6b81', background: 'transparent' }}
                                    title={t('shop_snack_feed', { count: inventory?.snack || 0 })}
                                >
                                    🍖 ×{inventory?.snack || 0}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Kozmetik vitrin */}
                    <div className="glass-card" style={{ padding: '1.2rem' }}>
                        {renderCosmeticSection('shop_cat_frames', COSMETIC_FRAMES, 'frame')}
                        {renderCosmeticSection('shop_cat_names', COSMETIC_NAME_STYLES, 'nameStyle')}
                        {renderCosmeticSection('shop_cat_flames', COSMETIC_FLAMES, 'flame')}
                        {renderCosmeticSection('shop_cat_prfx', COSMETIC_PR_EFFECTS, 'prEffect')}
                    </div>
                </div>
            )}

            {/* ============ SEKME: KUTULAR & CARK ============ */}
            {tab === 'boxes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Gunluk cark */}
                    <div className="glass-card" style={{ padding: '1.2rem', textAlign: 'center' }}>
                        <h4 style={{ color: '#fff', margin: '0 0 0.4rem', fontSize: '1rem' }}>🎡 {t('shop_wheel_title')}</h4>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.75rem', margin: '0 0 1rem' }}>{t('shop_wheel_desc')}</p>

                        {/* Cark gorseli (CSS konik gradyan) */}
                        <div style={{ position: 'relative', width: '230px', height: '230px', margin: '0 auto 1rem' }}>
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: '50%',
                                background: `conic-gradient(${WHEEL_SEGMENTS.map((s, i) => {
                                    const rc = RARITY[s.rarity].color;
                                    const start = (i / WHEEL_SEGMENTS.length) * 360;
                                    const end = ((i + 1) / WHEEL_SEGMENTS.length) * 360;
                                    return `${rc} ${start}deg ${end}deg`;
                                }).join(', ')})`,
                                transition: 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                transform: `rotate(${wheelAngle}deg)`,
                                boxShadow: '0 0 30px rgba(0,195,255,0.25)',
                                border: '4px solid rgba(255,255,255,0.15)'
                            }} />
                            {/* Merkez */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '54px', height: '54px', borderRadius: '50%', background: '#0f1115', border: '3px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', zIndex: 2 }}>
                                🎡
                            </div>
                            {/* Isaretci */}
                            <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '16px solid #fff', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))', zIndex: 3 }} />
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleSpin(true)} disabled={spinning || !wheel.freeAvailable} className="neon-btn" style={{ flex: 1, opacity: (!wheel.freeAvailable || spinning) ? 0.4 : 1, cursor: (!wheel.freeAvailable || spinning) ? 'not-allowed' : 'pointer' }}>
                                {wheel.freeAvailable ? t('shop_wheel_free') : t('shop_wheel_used')}
                            </button>
                            <button onClick={() => handleSpin(false)} disabled={spinning || wheel.extraLeft <= 0} className="neon-btn-secondary" style={{ flex: 1, opacity: (wheel.extraLeft <= 0 || spinning) ? 0.4 : 1, cursor: (wheel.extraLeft <= 0 || spinning) ? 'not-allowed' : 'pointer' }}>
                                {t('shop_wheel_extra', { price: WHEEL_PRICE, left: wheel.extraLeft })}
                            </button>
                        </div>
                    </div>

                    {/* Sans kutusu */}
                    <div className="glass-card" style={{ padding: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                <span style={{ fontSize: '2rem' }}>🎁</span>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{lang === 'tr' ? BOXES[0].title_tr : BOXES[0].title_en}</div>
                                    <div style={{ color: 'var(--text-light)', fontSize: '0.72rem', lineHeight: 1.35 }}>{lang === 'tr' ? BOXES[0].desc_tr : BOXES[0].desc_en}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '3px' }}>
                                        {t('shop_pity_chest', { left: CHEST_PITY_EPIC - (gachaPity?.chest || 0) })}
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleOpenChest} className="neon-btn" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', width: 'auto', flexShrink: 0, borderColor: '#ffd700', color: '#ffd700', background: 'transparent' }}>
                                🪙 {BOXES[0].price}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ SEKME: TEMALAR ============ */}
            {tab === 'themes' && (
                <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {[
                        { id: 'default', name_tr: 'Klasik Neon (Zümrüt)', name_en: 'Classic Neon (Emerald)', price: 0, color1: '#00ff88', color2: '#00d4ff' },
                        { id: 'blood', name_tr: 'Kanlı Ay (Kırmızı)', name_en: 'Blood Moon (Red)', price: 100, color1: '#ff4757', color2: '#ff6b81' },
                        { id: 'cyberpunk', name_tr: 'Siberpunk (Mor)', name_en: 'Cyberpunk (Purple)', price: 250, color1: '#ff00ff', color2: '#00ffff' },
                        { id: 'gold', name_tr: 'Olimpiyat (Altın)', name_en: 'Olympic (Gold)', price: 500, color1: '#ffd700', color2: '#ffa502' },
                        { id: 'abyss', name_tr: 'Abyss (Okyanus Mavisi)', name_en: 'Abyss (Ocean Blue)', price: 750, color1: '#0984e3', color2: '#00cec9' },
                        { id: 'toxic', name_tr: 'Zehir (Asit Yeşili)', name_en: 'Toxic (Acid Green)', price: 1000, color1: '#adff2f', color2: '#7fff00' },
                        { id: 'sakura', name_tr: 'Sakura (Pembe)', name_en: 'Sakura (Pink)', price: 1000, color1: '#ffb7b2', color2: '#e28495' },
                        { id: 'sunset', name_tr: 'Gün Batımı (Turuncu)', name_en: 'Sunset (Orange)', price: 1250, color1: '#ff7e5f', color2: '#feb47b' },
                        { id: 'darkmatter', name_tr: 'Karanlık Madde (Siyah&Beyaz)', name_en: 'Dark Matter (B&W)', price: 1500, color1: '#ffffff', color2: '#222222' }
                    ].map((theme) => {
                        const isUnlocked = unlockedThemes.includes(theme.id);
                        const isActive = activeTheme === theme.id;
                        const themeName = lang === 'tr' ? theme.name_tr : theme.name_en;
                        return (
                            <div key={theme.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', background: isActive ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)', borderRadius: '12px', border: isActive ? `1px solid ${theme.color1}` : '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`, border: '2px solid #fff' }}></div>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{themeName}</div>
                                        {!isUnlocked && <div style={{ color: '#ffd700', fontSize: '0.8rem', fontWeight: 'bold' }}>🪙 {theme.price}</div>}
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (isUnlocked) {
                                            setActiveTheme(theme.id);
                                            if (applyThemeFn) applyThemeFn(theme.id);
                                            toast.success(t('shop_equip_ok', { name: themeName }));
                                        } else {
                                            if (userCoins < theme.price) {
                                                toast.warning(t('shop_insufficient_coins', { needed: theme.price - userCoins }));
                                                return;
                                            }
                                            const ok = await confirmDialog({
                                                title: t('shop_buy_title'),
                                                message: t('shop_buy_confirm', { name: themeName, price: theme.price }),
                                                confirmLabel: t('shop_buy_yes'),
                                                cancelLabel: t('shop_buy_no')
                                            });
                                            if (!ok) return;
                                            setUserCoins(userCoins - theme.price);
                                            setUnlockedThemes([...unlockedThemes, theme.id]);
                                            setActiveTheme(theme.id);
                                            if (applyThemeFn) applyThemeFn(theme.id);
                                            toast.success(t('shop_buy_ok', { name: themeName }));
                                        }
                                    }}
                                    className="neon-btn"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', borderColor: isUnlocked ? theme.color1 : '#ffd700', color: isUnlocked ? (isActive ? '#fff' : theme.color1) : '#ffd700', boxShadow: isActive ? 'none' : 'auto' }}
                                >
                                    {isActive ? <><Check size={16} /> {t('shop_active')}</> : (isUnlocked ? t('shop_equip') : <><Lock size={16} /> 🪙 {theme.price}</>)}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Acilis animasyonu modali (key: her sonucta yeni mount -> faz sifirlanir) */}
            {reveal && <GachaRevealModal key={revealKey} result={reveal} lang={lang} t={t} onClose={() => setReveal(null)} />}
        </div>
    );
}

export default ShopPage;
