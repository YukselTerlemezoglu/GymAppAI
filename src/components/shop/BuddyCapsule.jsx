import React from 'react';
import { findBuddy, getBuddyStageInfo } from '../../utils/buddy';
import { RARITY } from '../../data/shopItems';

/*
 * Dost kapsulu: evreye gore gorunus (Steam avatar tarzi vitrin).
 * Evreler: boyut + aura + halka kalinligi + tac/parcaciklar ile ayrisir.
 *  - Yumurta/Çatlama: 🥚 gosterilir (dost henuz dogmadi)
 *  - Yavru..Efsane: dost emojisi, boyut evreyle buyur
 *  - Usta+: parcaciklar; Efsane: taç
 *
 * size: kapsul capi (px). frameCosmeticId: opsiyonel kozmetik cerceve.
 */
function BuddyCapsule({ buddyId, xp = 0, size = 64, frameCosmeticId = null, onClick }) {
    const buddy = findBuddy(buddyId);
    if (!buddy) return null;

    const rarity = RARITY[buddy.rarity] || RARITY.common;
    const info = getBuddyStageInfo(xp);
    const stage = info.stage;

    // Yumurta asamalarinda dost emojisi degil yumurta gosterilir
    const displayIcon = stage.icon !== null ? stage.icon : buddy.icon;
    const isEggStage = stage.icon !== null;

    // Cerceve kozmetigi: kenar stili
    let frameStyle = {};
    if (frameCosmeticId === 'frame_neon') frameStyle = { border: `3px solid #00c3ff`, boxShadow: `0 0 14px rgba(0,195,255,0.55)` };
    else if (frameCosmeticId === 'frame_retro') frameStyle = { border: `3px dashed #ff7e5f`, boxShadow: `inset 0 0 10px rgba(255,126,95,0.35)` };
    else if (frameCosmeticId === 'frame_gold') frameStyle = { border: `3px solid #ffd700`, boxShadow: `0 0 16px rgba(255,215,0,0.55)` };
    else if (frameCosmeticId === 'frame_crown') frameStyle = { border: `3px double #ffd700`, boxShadow: `0 0 20px rgba(255,215,0,0.7), 0 0 40px rgba(255,215,0,0.3)` };

    // Halka kalinligi evreyle artar
    const ringWidth = 2 + info.stageIndex * 0.6;

    return (
        <div
            onClick={onClick}
            style={{
                position: 'relative',
                width: size, height: size, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `radial-gradient(circle at 50% 35%, ${rarity.glow} 0%, rgba(0,0,0,0.5) 75%)`,
                border: stage.aura ? `${ringWidth}px solid ${rarity.color}` : `${ringWidth}px solid rgba(255,255,255,0.15)`,
                boxShadow: stage.aura ? `0 0 ${8 + info.stageIndex * 4}px ${rarity.glow}` : 'none',
                cursor: onClick ? 'pointer' : 'default',
                flexShrink: 0,
                ...frameStyle
            }}
            title={`${lang(buddy)} · ${stage.title_tr}`}
        >
            {/* Emoji boyutu evreyle buyur; yumurta asamasinda hafif soluk */}
            <span style={{
                fontSize: size * 0.48 * (isEggStage ? 1 : stage.size),
                lineHeight: 1,
                filter: isEggStage && info.stageIndex === 0 ? 'grayscale(0.3) brightness(0.9)' : 'none',
                userSelect: 'none'
            }}>
                {displayIcon}
            </span>

            {/* Usta+ parcaciklari */}
            {stage.sparks && (
                <>
                    <span style={{ position: 'absolute', top: '2px', right: '6px', fontSize: size * 0.16, animation: 'buddySpark 1.6s ease-in-out infinite' }}>⚡</span>
                    <span style={{ position: 'absolute', bottom: '3px', left: '5px', fontSize: size * 0.14, animation: 'buddySpark 1.9s ease-in-out infinite 0.4s' }}>✨</span>
                </>
            )}

            {/* Efsane taci */}
            {stage.crown && (
                <span style={{ position: 'absolute', top: `-${size * 0.14}px`, left: '50%', transform: 'translateX(-50%)', fontSize: size * 0.3, filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.7))' }}>👑</span>
            )}
        </div>
    );
}

// Kucuk yardimci: basligi dil secimine gore dondurur (title attribute icin)
const lang = (buddy) => buddy.title_tr;

export default BuddyCapsule;
