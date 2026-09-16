import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RARITY } from '../../data/shopItems';
import { WHEEL_SEGMENTS } from '../../utils/gacha';

/*
 * SVG SANSA CARKI v3
 *
 * Neden SVG (conic-gradient degil):
 *  - CSS konik gradyan GPU rasterizasyonunda dondurme artefaktlari uretir:
 *    dilim dikislerinde ince renk bozulmalari, kenarlarda (ust/alt/sag/sol)
 *    sabit gibi gorunen uyumsuz renk bantlari. SVG arc'lar piksel
 *    hassasiyetindedir; artefakt tamamen kalkar.
 *  - Dilimler orantili: weight -> aci (nadir = ince dilim). Cark bir
 *    bakista "olasilik haritasi"dir.
 *
 * Yazi yerlesimi (radial): SVG text, dilim ortasinda merkezden disa
 * "dikey" (yay yonunde) yerlesir; dar dilimde otomatik kuculur, tasma
 * olmaz. Donus sirasinda yazilar yumusakca silinir, durunca kendi
 * nadirlik renkleriyle geri gelir.
 */

const SIZE = 230;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 106;        // dilim dis cap
const R_RING_OUT = 114;     // halka dis cap
const R_RING_IN = 106;      // halka ic cap

const polar = (cx, cy, r, deg) => {
    const rad = ((deg - 90) * Math.PI) / 180; // 0 = ust
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (startDeg, endDeg) => {
    const p1 = polar(CX, CY, R_OUTER, startDeg);
    const p2 = polar(CX, CY, R_OUTER, endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${CX} ${CY} L ${p1.x} ${p1.y} A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
};

const segmentAngles = () => {
    const total = WHEEL_SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
    let acc = 0;
    return WHEEL_SEGMENTS.map((seg) => {
        const start = (acc / total) * 360;
        acc += seg.weight;
        const end = (acc / total) * 360;
        return { start, end, mid: (start + end) / 2, sweep: end - start };
    });
};

// Basit hex karartma - alternating ton icin
function shade(hex, factor) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * factor);
    const g = Math.round(((n >> 8) & 255) * factor);
    const b = Math.round((n & 255) * factor);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Kisa etiket: deger bazli, TR/EN ayni format; dil destegi icin isEn hazir
const shortLabel = (seg, isEn) => (isEn ? seg.label_en : seg.label_tr) || seg.label_tr;

function WheelSvg({ angle, spinning, isEn, onInfo }) {
    const angles = useMemo(() => segmentAngles(), []);

    return (
        <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '0 auto' }}>
            <motion.div
                animate={{ rotate: angle }}
                transition={spinning ? { duration: 4, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
                style={{ position: 'absolute', inset: 0 }}
            >
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: 'block' }}>
                    <defs>
                        <linearGradient id="wheelRing" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00c3ff" />
                            <stop offset="100%" stopColor="#c06bff" />
                        </linearGradient>
                    </defs>

                    {/* Dis halka: tek tutarli gradyan cerceve (kenar uyumsuzlugu yok) */}
                    <circle cx={CX} cy={CY} r={(R_RING_OUT + R_RING_IN) / 2}
                        fill="none" stroke="url(#wheelRing)" strokeWidth={R_RING_OUT - R_RING_IN} />

                    {/* Dilimler: orantili acilar + alternating ton */}
                    {WHEEL_SEGMENTS.map((seg, i) => {
                        const a = angles[i];
                        const base = RARITY[seg.rarity].color;
                        const fill = i % 2 === 1 ? shade(base, 0.72) : base;
                        return <path key={i} d={arcPath(a.start, a.end)} fill={fill} stroke="#0f1115" strokeWidth="1.5" />;
                    })}

                    {/* Radial yazilar (SVG text): YARICAP BOYUNCA, merkezden disari okunur.
                        Dilim genisliginden bagimsiz (uzun eksen boyunca akar) -> tasma imkansiz.
                        Sol yaridaki etiketler 180 dondurulup disaridan ice okunur (tercihen okunabilir).
                        Donuste yumusakca silinir; durunca NADIRLIK RENGINDE geri gelir. */}
                    <motion.g animate={{ opacity: spinning ? 0 : 1 }} transition={{ duration: spinning ? 0.3 : 0.6 }}>
                        {WHEEL_SEGMENTS.map((seg, i) => {
                            const a = angles[i];
                            const mid = a.mid;
                            const txt = shortLabel(seg, isEn);
                            const fill = seg.rarity === 'legendary' ? '#1a1a2e' : RARITY[seg.rarity].color;
                            // Sol yarim kusak: etiket 180 doner ve DIS kenardan baslayip
                            // ice dogru akar -> harfler asla bas asagi durmaz, okunabilirlik korunur.
                            const flip = mid > 90 && mid < 270;
                            const p = polar(CX, CY, flip ? 100 : 56, mid);
                            const rot = mid - 90 + (flip ? 180 : 0);
                            return (
                                <text
                                    key={i}
                                    x={p.x} y={p.y}
                                    fontSize={9.5}
                                    fontWeight={700}
                                    fill={fill}
                                    stroke="rgba(0,0,0,0.6)" strokeWidth={2}
                                    style={{ paintOrder: 'stroke' }}
                                    textAnchor="start"
                                    dominantBaseline="middle"
                                    transform={`rotate(${rot} ${p.x} ${p.y})`}
                                >
                                    {txt}
                                </text>
                            );
                        })}
                    </motion.g>
                </svg>
            </motion.div>

            {/* Merkez kapak */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: '54px', height: '54px', borderRadius: '50%', background: '#0f1115',
                border: '3px solid var(--accent-primary)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.3rem', zIndex: 2, cursor: 'pointer'
            }}
                onClick={onInfo} title={isEn ? 'Wheel details' : 'Çark detayları'}
            >
                🎡
            </div>

            {/* Isaretci */}
            <div style={{
                position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)',
                width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
                borderTop: '16px solid #fff', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))', zIndex: 3
            }} />
        </div>
    );
}

export default WheelSvg;
