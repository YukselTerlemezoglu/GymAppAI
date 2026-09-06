import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Package, Dices, Palette, ArrowLeft, Lock, Check } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';
import { BOOSTS, BOXES, RARITY, COSMETIC_FRAMES, COSMETIC_NAME_STYLES, COSMETIC_FLAMES, COSMETIC_PR_EFFECTS } from '../../data/shopItems';
import { canBuyBoost, ownsCosmetic, buyCosmetic, setCosmeticActive, clearCosmeticActive } from '../../utils/inventory';
import { BUDDIES, getBuddyStageInfo, findBuddy, addBuddyXp } from '../../utils/buddy';
import { openChest, updateChestPity, openEgg, updateEggPity, spinWheel, getWheelState, updateWheelState, WHEEL_SEGMENTS, WHEEL_PRICE, CHEST_PITY_EPIC, EGG_PITY_EPIC, EGG_PITY_LEGENDARY } from '../../utils/gacha';
import GachaRevealModal from './GachaRevealModal';
import { playSound } from '../../utils/sounds';
import { totalXpForLevel, levelFromTotalXp } from '../../utils/levelSystem';
import { THEMES, THEME_CATALOG } from '../../data/themes';
import BuddyCapsule from './BuddyCapsule';
import EvolutionModal from './EvolutionModal';

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
    userLevel,
    setUserLevel,
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
    // Senkron meşguliyet kilidi: cark/kutu/yumurta handler'lari await
    // icerir (onay dialogu); ayni karede ikinci tik state guncellenmeden
    // gecebilirdi -> cift odeme/cift animasyon. Ref ile aninda kilitlenir.
    const busyRef = useRef(false);
    // Envanter senkron aynasi: feed handler'i prop'un render'dan gecikmis
    // degerini degil guncel degeri okur (ayni karede spam tik korumasi).
    const inventoryRef = useRef(inventory);
    useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
    // Reveal sesi zamanlayicisi: bilesen erken kapatinca ses calmasin
    const revealSoundTimerRef = useRef(null);
    useEffect(() => () => {
        if (revealSoundTimerRef.current) clearTimeout(revealSoundTimerRef.current);
    }, []);
    const [wheelAngle, setWheelAngle] = useState(0);
    // Gacha modalinin key'i: her acilista artar (Date.now yerine saf sayaç)
    const [revealKey, setRevealKey] = useState(0);
    // Evrim kutlamasi: { buddyId, newXp } / null
    const [evolution, setEvolution] = useState(null);
    // Toplu satin alma adetleri (boostId -> adet, varsayilan 1)
    const [buyAmounts, setBuyAmounts] = useState({});
    // Yumurta 10'lu paketi: 10 yumurta 9 fiyatina (indirim)
    const EGG_PACK = { count: 10, payFor: 9 };
    const CHEST_PACK = { count: 10, payFor: 9 };

    const wheel = useMemo(() => getWheelState(wheelState), [wheelState]);

    // ---------- BOOST SATIN AL ----------
    const handleBuyBoost = async (boost) => {
        const amount = Math.max(1, buyAmounts[boost.id] || 1);
        const maxByStock = boost.maxStock - (inventory?.[boost.id] || 0);
        if (maxByStock <= 0) {
            toast.warning(t('shop_stock_full'));
            return;
        }
        const buyN = Math.min(amount, maxByStock);
        const total = boost.price * buyN;
        if (userCoins < total) {
            playSound('deny'); toast.warning(t('shop_insufficient_coins', { needed: total - userCoins }));
            return;
        }
        const ok = await confirmDialog({
            title: t('shop_buy_title'),
            message: t('shop_buy_confirm', { name: `${lang === 'tr' ? boost.title_tr : boost.title_en} x${buyN}`, price: total }),
            confirmLabel: t('shop_buy_yes'),
            cancelLabel: t('shop_buy_no')
        });
        if (!ok) return;
        haptic(12);
        setUserCoins((prev) => (prev || 0) - total); playSound('buy');
        setInventory({ ...(inventory || {}), [boost.id]: (inventory?.[boost.id] || 0) + buyN });
        toast.success(t('shop_bought', { name: `${lang === 'tr' ? boost.title_tr : boost.title_en} x${buyN}` }));
    };

    // ---------- KOZMETIK SATIN AL / KUSAN ----------
    const handleBuyCosmetic = async (item) => {
        if (ownsCosmetic(ownedCosmetics, item.id)) return;
        if (userCoins < item.price) {
            playSound('deny'); toast.warning(t('shop_insufficient_coins', { needed: item.price - userCoins }));
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
    const handleOpenChest = async (count = 1) => {
        if (busyRef.current) return;
        busyRef.current = true;
        try {
            const unit = BOXES[0].price;
            const total = count === CHEST_PACK.count ? unit * CHEST_PACK.payFor : unit * count;
            if (userCoins < total) {
                playSound('deny'); toast.warning(t('shop_insufficient_coins', { needed: total - userCoins }));
                return;
            }
            const ok = await confirmDialog({
                title: t('shop_chest_title'),
                message: count === CHEST_PACK.count
                    ? t('shop_chest_pack_confirm', { count: CHEST_PACK.count, price: total })
                    : t('shop_chest_confirm', { price: unit }),
                confirmLabel: t('shop_buy_yes'),
                cancelLabel: t('shop_buy_no')
            });
            if (!ok) return;

            if (count === 1) {
                const result = openChest(gachaPity, ownedCosmetics);
                applyGachaResult({ ...result, source: 'chest' });
                setUserCoins((prev) => (prev || 0) - total); playSound('buy');
                setGachaPity(updateChestPity(gachaPity, result));
                return;
            }

            // Coklu kutu: sonuclar sirali kart animasyonuyla tek modale gider.
            // Dusan kozmetik aninda sahip olunan listesine eklenir; ayni paket
            // icinde ayni kozmetik ikinci kez dusmez (dupe deger kaybi olmaz).
            let pity = gachaPity;
            let owned = [...(ownedCosmetics || [])];
            const results = [];
            for (let i = 0; i < count; i++) {
                const result = openChest(pity, owned);
                pity = updateChestPity(pity, result);
                if (result.type === 'cosmetic') owned = [...owned, result.cosmeticId];
                results.push(result);
            }
            setUserCoins((prev) => (prev || 0) - total); playSound('buy');
            setGachaPity(pity);
            applyGachaResult({ type: 'multiChest', source: 'chest', results, rarity: results.reduce((acc, r) => (r.rarity === 'legendary' || acc === 'legendary') ? 'legendary' : (r.rarity === 'epic' || acc === 'epic') ? 'epic' : 'common', 'common') });
        } finally {
            busyRef.current = false;
        }
    };

    // ---------- DOST YUMURTASI ----------
    const handleOpenEgg = async (count = 1) => {
        if (busyRef.current) return;
        busyRef.current = true;
        try {
            const unit = BOXES[1].price;
            const total = count === EGG_PACK.count ? unit * EGG_PACK.payFor : unit * count;
            if (userCoins < total) {
                playSound('deny'); toast.warning(t('shop_insufficient_coins', { needed: total - userCoins }));
                return;
            }
            const ok = await confirmDialog({
                title: t('shop_egg_title'),
                message: count === EGG_PACK.count
                    ? t('shop_egg_pack_confirm', { count: EGG_PACK.count, price: total })
                    : t('shop_egg_confirm', { price: unit }),
                confirmLabel: t('shop_buy_yes'),
                cancelLabel: t('shop_buy_no')
            });
            if (!ok) return;

            let pity = gachaPity;
            let collection = buddyCollection;
            const results = [];
            const newBuddyIds = [];
            for (let i = 0; i < count; i++) {
                const result = openEgg(pity);
                pity = updateEggPity(pity, result);
                const dupe = !!(collection && collection[result.buddyId]);
                if (dupe) {
                    collection = { ...collection, [result.buddyId]: { xp: (collection[result.buddyId]?.xp || 0) + result.dupeXp } };
                } else {
                    collection = { ...collection, [result.buddyId]: { xp: 0 } };
                    newBuddyIds.push(result.buddyId);
                }
                results.push({ ...result, dupe });
            }
            setUserCoins((prev) => (prev || 0) - total); playSound('buy');
            setGachaPity(pity);
            setBuddyCollection(collection);
            if (!activeBuddyId && newBuddyIds.length > 0) setActiveBuddyId(newBuddyIds[0]);
            // Coklu acilis: tum sonuclar tek modale gider (siralı kartlanma)
            applyGachaResult({ type: 'multiEgg', source: 'egg', results, rarity: results.reduce((acc, r) => (r.rarity === 'legendary' || acc === 'legendary') ? 'legendary' : (r.rarity === 'epic' || acc === 'epic') ? 'epic' : 'common', 'common') });
        } finally {
            busyRef.current = false;
        }
    };

    // ---------- CARK ----------
    const handleSpin = async (useFree) => {
        if (busyRef.current || spinning) return;
        busyRef.current = true;
        if (!useFree) {
            const ws = getWheelState(wheelState);
            if (ws.extraLeft <= 0) {
                toast.warning(t('shop_wheel_no_extra'));
                busyRef.current = false;
                return;
            }
            if (userCoins < WHEEL_PRICE) {
                playSound('deny'); toast.warning(t('shop_insufficient_coins', { needed: WHEEL_PRICE - userCoins }));
                busyRef.current = false;
                return;
            }
            const ok = await confirmDialog({
                title: t('shop_wheel_title'),
                message: t('shop_wheel_extra_confirm', { price: WHEEL_PRICE }),
                confirmLabel: t('shop_buy_yes'),
                cancelLabel: t('shop_buy_no')
            });
            if (!ok) { busyRef.current = false; return; }
            setUserCoins((prev) => (prev || 0) - WHEEL_PRICE); playSound('buy');
        }

        const result = spinWheel();
        setSpinning(true);
        haptic([10, 20, 10]);
        playSound('click');

        // Tikirti sesleri: donus yavasladikca tik araliklari buyur (easing ile uyumlu)
        const SPIN_MS = 4000;
        for (let i = 0; i < 24; i++) {
            const at = Math.round(Math.pow((i + 1) / 24, 2.2) * SPIN_MS);
            setTimeout(() => playSound('tick'), at);
        }

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
            busyRef.current = false; // animasyon bitince kilidi ac
        }, 4000);
    };

    // ---------- GACHA SONUCU UYGULA ----------
    // XP kazançları eğrisel seviye sisteminden geçirilir; seviye atlanabilir.
    // Fonksiyonel updater: coklu pakette ardışık XP dusleri birbirini EZMEZ,
    // toplam XP uzerinden birikir; seviye de son toplamdan hesaplanir.
    const grantXp = (amount) => {
        setUserXP((prevXp) => {
            const after = levelFromTotalXp(totalXpForLevel(userLevel || 1) + (prevXp || 0) + amount);
            if (setUserLevel && after.level !== userLevel) setUserLevel(after.level);
            return after.xp;
        });
    };
    const applySingleResult = (r) => {
        switch (r.type) {
            case 'xp':
                grantXp(r.amount);
                break;
            case 'coins':
                setUserCoins((prev) => (prev || 0) + r.amount);
                break;
            case 'buddyXp': {
                const target = activeBuddyId || Object.keys(buddyCollection || {})[0];
                if (target) {
                    setBuddyCollection((prev) => ({ ...(prev || {}), [target]: { xp: (prev?.[target]?.xp || 0) + r.amount } }));
                } else {
                    // Dostu yok: coin'e donus
                    setUserCoins((prev) => (prev || 0) + 50);
                    r = { ...r, type: 'coins', amount: 50, converted: true };
                }
                break;
            }
            case 'snack':
                setInventory((prev) => ({ ...(prev || {}), snack: (prev?.snack || 0) + r.amount }));
                break;
            case 'cosmetic': {
                // Fonksiyonel updater: ayni pakette birden fazla kozmetik
                // duserse oncekinin uzerine eklenir (statik spread ezmez).
                setOwnedCosmetics((prev) => (prev.includes(r.cosmeticId) ? prev : [...prev, r.cosmeticId]));
                break;
            }
            case 'jackpot':
                grantXp(r.amount);
                setUserCoins((prev) => (prev || 0) + (r.coins || 0));
                break;
            default:
                break;
        }
        return r;
    };

    const applyGachaResult = (result) => {
        if (result.type === 'multiChest' && result.results) {
            result = { ...result, results: result.results.map(applySingleResult) };
        } else {
            applySingleResult(result);
        }
        setRevealKey((k) => k + 1);
        setReveal(result);
        // Acilis sesi reveal aninda (GachaRevealModal patlamasiyla es zamanli)
        const delay = result.source === 'wheel' ? 0 : (result.type === 'multiEgg' || result.type === 'multiChest') ? 900 : (result.rarity === 'legendary' ? 1400 : 1100);
        revealSoundTimerRef.current = setTimeout(() => playSound('reveal_' + result.rarity), delay);
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
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                    {/* Adet secici: stok sinirina gore x1/x5/x10 cipleri */}
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {[1, 5, 10].filter((n) => n === 1 || n <= boost.maxStock - stock).map((n) => {
                                            const active = (buyAmounts[boost.id] || 1) === n;
                                            return (
                                                <button
                                                    key={n}
                                                    onClick={() => setBuyAmounts((prev) => ({ ...prev, [boost.id]: n }))}
                                                    style={{ padding: '3px 8px', borderRadius: '8px', border: `1px solid ${active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)'}`, background: active ? 'rgba(0,195,255,0.15)' : 'transparent', color: active ? 'var(--accent-primary)' : 'var(--text-light)', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    x{n}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => handleBuyBoost(boost)}
                                        className="neon-btn"
                                        style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', width: 'auto', flexShrink: 0, borderColor: '#ffd700', color: canBuy ? '#ffd700' : 'rgba(255,215,0,0.4)', background: 'transparent' }}
                                    >
                                        🪙 {boost.price * Math.max(1, buyAmounts[boost.id] || 1)}
                                    </button>
                                </div>
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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                {/* Tek yumurta */}
                                <button onClick={() => handleOpenEgg(1)} className="neon-btn" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', width: 'auto', flexShrink: 0, borderColor: '#ffd700', color: '#ffd700', background: 'transparent' }}>
                                    🪙 {BOXES[1].price}
                                </button>
                                {/* 10'lu paket: 9 fiyatina - eski fiyat ustunun cizili */}
                                <button onClick={() => handleOpenEgg(EGG_PACK.count)} className="neon-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', width: 'auto', flexShrink: 0, borderColor: '#ff6b81', color: '#ff6b81', background: 'rgba(255,107,129,0.08)', display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.2 }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 'bold', color: '#ff6b81' }}>x10 {t('shop_egg_pack_badge')}</span>
                                    <span><span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.7rem' }}>🪙{BOXES[1].price * 10}</span> <span style={{ fontWeight: 'bold' }}>🪙{BOXES[1].price * EGG_PACK.payFor}</span></span>
                                </button>
                            </div>
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
                                        // ATOMIK BESLEME: inventoryRef senkron aynadir; ayni
                                        // karede spam tiklaninca ikinci tik stok 0'i gorur ve
                                        // reddedilir (eski kod prop'tan okuyordu -> bedava XP).
                                        if ((inventoryRef.current?.snack || 0) <= 0) { toast.warning(t('shop_no_snacks')); return; }
                                        haptic(10);
                                        playSound('feed');
                                        const nextInv = { ...inventoryRef.current, snack: inventoryRef.current.snack - 1 };
                                        inventoryRef.current = nextInv;
                                        setInventory(nextInv);
                                        // addBuddyXp evrimi tespit eder; evrim varsa tam ekran kutlama acilir
                                        const res = addBuddyXp(buddyCollection, activeBuddyId, 150);
                                        setBuddyCollection(res.collection);
                                        if (res.evolved) setEvolution({ buddyId: activeBuddyId, newXp: res.xp });
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
                            <motion.div
                                animate={{ rotate: wheelAngle }}
                                transition={spinning ? { duration: 4, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
                                style={{
                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                    background: `conic-gradient(${WHEEL_SEGMENTS.map((s, i) => {
                                        const rc = RARITY[s.rarity].color;
                                        const start = (i / WHEEL_SEGMENTS.length) * 360;
                                        const end = ((i + 1) / WHEEL_SEGMENTS.length) * 360;
                                        return `${rc} ${start}deg ${end}deg`;
                                    }).join(', ')})`,
                                    boxShadow: '0 0 30px rgba(0,195,255,0.25)',
                                    border: '4px solid rgba(255,255,255,0.15)'
                                }}
                            />
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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                {/* Tek kutu */}
                                <button onClick={() => handleOpenChest(1)} className="neon-btn" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', width: 'auto', flexShrink: 0, borderColor: '#ffd700', color: '#ffd700', background: 'transparent' }}>
                                    🪙 {BOXES[0].price}
                                </button>
                                {/* 10'lu paket: 9 fiyati - eski fiyat ustunun cizili */}
                                <button onClick={() => handleOpenChest(CHEST_PACK.count)} className="neon-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', width: 'auto', flexShrink: 0, borderColor: '#ff6b81', color: '#ff6b81', background: 'rgba(255,107,129,0.08)', display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.2 }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 'bold', color: '#ff6b81' }}>x10 {t('shop_egg_pack_badge')}</span>
                                    <span><span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.7rem' }}>🪙{BOXES[0].price * 10}</span> <span style={{ fontWeight: 'bold' }}>🪙{BOXES[0].price * CHEST_PACK.payFor}</span></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ SEKME: TEMALAR ============ */}
            {tab === 'themes' && (
                <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {THEME_CATALOG.map((theme) => {
                        // Renkler CSS degisken tanimindan okunur: katalog isim/
                        // fiyat tasir, THEMES renkleri tek dogru kaynak kalir.
                        const cssVars = THEMES[theme.id] || THEMES.default;
                        const color1 = cssVars['--accent-primary'];
                        const color2 = cssVars['--accent-secondary'];
                        const isUnlocked = unlockedThemes.includes(theme.id);
                        const isActive = activeTheme === theme.id;
                        const themeName = lang === 'tr' ? theme.name_tr : theme.name_en;
                        return (
                            <div key={theme.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', background: isActive ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)', borderRadius: '12px', border: isActive ? `1px solid ${color1}` : '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `linear-gradient(135deg, ${color1}, ${color2})`, border: '2px solid #fff' }}></div>
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
                                                playSound('deny'); toast.warning(t('shop_insufficient_coins', { needed: theme.price - userCoins }));
                                                return;
                                            }
                                            const ok = await confirmDialog({
                                                title: t('shop_buy_title'),
                                                message: t('shop_buy_confirm', { name: themeName, price: theme.price }),
                                                confirmLabel: t('shop_buy_yes'),
                                                cancelLabel: t('shop_buy_no')
                                            });
                                            if (!ok) return;
                                            setUserCoins((prev) => (prev || 0) - theme.price); playSound('buy');
                                            setUnlockedThemes([...unlockedThemes, theme.id]);
                                            setActiveTheme(theme.id);
                                            if (applyThemeFn) applyThemeFn(theme.id);
                                            toast.success(t('shop_buy_ok', { name: themeName }));
                                        }
                                    }}
                                    className="neon-btn"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', borderColor: isUnlocked ? color1 : '#ffd700', color: isUnlocked ? (isActive ? '#fff' : color1) : '#ffd700', boxShadow: isActive ? 'none' : 'auto' }}
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

            {/* Evrim kutlamasi (tam ekran) */}
            {evolution && (
                <EvolutionModal
                    buddyId={evolution.buddyId}
                    newXp={evolution.newXp}
                    onClose={() => setEvolution(null)}
                />
            )}
        </div>
    );
}

export default ShopPage;
