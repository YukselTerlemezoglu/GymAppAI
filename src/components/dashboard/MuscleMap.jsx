import React, { useMemo, useState } from 'react';
import { PersonStanding } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { weeklySetsByGroup, regionIntensities, WEEKLY_RANGES } from '../../utils/muscleMap';
import { MUSCLE_GROUPS } from '../../data/exercises';

// ============================================================================
// Stilize atletik figur — on yuz + arka yuz yan yana.
// Her kas bolgesi ayri SVG path; blok-degil organik yuvarlatilmais sekiller.
// Gorsel referans: modern flat "gym poster" estetigi, koyu temaya uyumlu.
// Oran sistemi (8-bas kurali): toplam 460px — kafa 0-56, boyun 56-70,
// omuz cizgisi 74, bel 170, kalca 200, diz 330, ayak 455.
// Omuz genisligi ~2.5 kafa (150px), bacaklar boyun yarisi.
// ============================================================================

// --- Yardimci: bolge tanimlari -------------------------------------------
// id: muscleMap.js GROUP_REGIONS anahtarlariyla birebir eslesir.
const FRONT_REGIONS = [
    // Omuzlar (on deltoid) — omuz ucu yumru
    { id: 'deltFrontL', d: 'M 63 78 Q 50 76 44 86 Q 40 98 48 108 Q 58 112 64 104 Q 66 90 63 78 Z' },
    { id: 'deltFrontR', d: 'M 137 78 Q 150 76 156 86 Q 160 98 152 108 Q 142 112 136 104 Q 134 90 137 78 Z' },
    // Gogus (2 parca, sternum'da ayrilir)
    { id: 'chestL', d: 'M 66 88 Q 64 104 70 116 Q 82 126 97 128 Q 99 112 98 98 Q 82 88 66 88 Z' },
    { id: 'chestR', d: 'M 134 88 Q 136 104 130 116 Q 118 126 103 128 Q 101 112 102 98 Q 118 88 134 88 Z' },
    // Biceps (kolun ust segmenti — omuzdan dirsege, kalın)
    { id: 'bicepsL', d: 'M 52 112 Q 44 128 42 148 Q 41 162 48 171 Q 56 166 58 150 Q 58 128 56 114 Z' },
    { id: 'bicepsR', d: 'M 148 112 Q 156 128 158 148 Q 159 162 152 171 Q 144 166 142 150 Q 142 128 144 114 Z' },
    // On kol (dirsekten bilege)
    { id: 'forearmsL', d: 'M 46 175 Q 38 192 34 212 Q 31 226 38 234 Q 46 231 49 216 Q 52 194 53 178 Z' },
    { id: 'forearmsR', d: 'M 154 175 Q 162 192 166 212 Q 169 226 162 234 Q 154 231 151 216 Q 148 194 147 178 Z' },
    // Karin (rectus abdominis) — gogus altindan kalca ustune
    { id: 'abs', d: 'M 82 136 Q 80 160 84 184 Q 90 200 100 203 Q 110 200 116 184 Q 120 160 118 136 Q 100 130 82 136 Z' },
    // Yan karin (obliques)
    { id: 'obliquesL', d: 'M 72 130 Q 68 152 70 176 Q 73 192 80 200 Q 77 180 77 158 Q 77 142 76 132 Z' },
    { id: 'obliquesR', d: 'M 128 130 Q 132 152 130 176 Q 127 192 120 200 Q 123 180 123 158 Q 123 142 124 132 Z' },
    // Quadriceps (on bacak) — kalcadan dize
    { id: 'quadsL', d: 'M 72 216 Q 66 244 68 278 Q 70 306 78 326 Q 86 334 92 326 Q 95 296 93 266 Q 91 238 89 218 Q 80 212 72 216 Z' },
    { id: 'quadsR', d: 'M 128 216 Q 134 244 132 278 Q 130 306 122 326 Q 114 334 108 326 Q 105 296 107 266 Q 109 238 111 218 Q 120 212 128 216 Z' },
    // Baldiz (on) — dizden bilege
    { id: 'calvesL', d: 'M 76 336 Q 70 362 72 388 Q 74 406 82 416 Q 90 412 92 396 Q 92 370 89 344 Z' },
    { id: 'calvesR', d: 'M 124 336 Q 130 362 128 388 Q 126 406 118 416 Q 110 412 108 396 Q 108 370 111 344 Z' }
];

const BACK_REGIONS = [
    // Trapez (ust sirt, boyun kenarindan omuza inen ucgen)
    { id: 'trapsL', d: 'M 78 74 Q 70 78 66 88 Q 64 102 72 112 Q 84 118 92 112 Q 94 96 90 82 Q 84 74 78 74 Z' },
    { id: 'trapsR', d: 'M 122 74 Q 130 78 134 88 Q 136 102 128 112 Q 116 118 108 112 Q 106 96 110 82 Q 116 74 122 74 Z' },
    // Arka deltoid (omuz ucu arkasi)
    { id: 'deltRearL', d: 'M 62 80 Q 50 78 44 88 Q 40 100 48 110 Q 58 114 64 106 Q 66 92 62 80 Z' },
    { id: 'deltRearR', d: 'M 138 80 Q 150 78 156 88 Q 160 100 152 110 Q 142 114 136 106 Q 134 92 138 80 Z' },
    // Latissimus (kanatlar) — koltuk altindan bele
    { id: 'latsL', d: 'M 66 116 Q 62 138 68 162 Q 76 180 88 186 Q 91 166 89 144 Q 87 126 82 116 Q 74 110 66 116 Z' },
    { id: 'latsR', d: 'M 134 116 Q 138 138 132 162 Q 124 180 112 186 Q 109 166 111 144 Q 113 126 118 116 Q 126 110 134 116 Z' },
    // Triceps (kol arkasi, kalın)
    { id: 'tricepsL', d: 'M 50 114 Q 42 130 40 150 Q 39 164 46 173 Q 54 168 56 152 Q 56 130 54 116 Z' },
    { id: 'tricepsR', d: 'M 150 114 Q 158 130 160 150 Q 161 164 154 173 Q 146 168 144 152 Q 144 130 146 116 Z' },
    // On kol (arka gorunum)
    { id: 'forearmsL', d: 'M 44 177 Q 36 194 32 214 Q 29 228 36 236 Q 44 233 47 218 Q 50 196 51 180 Z' },
    { id: 'forearmsR', d: 'M 156 177 Q 164 194 168 214 Q 171 228 164 236 Q 156 233 153 218 Q 150 196 149 180 Z' },
    // Bel alti (erector spinae) — lat altindan kalcaya
    { id: 'lowerBack', d: 'M 84 188 Q 82 196 84 206 Q 90 216 100 218 Q 110 216 116 206 Q 118 196 116 188 Q 100 182 84 188 Z' },
    // Kalca (gluteus) — genis, yuvarlak
    { id: 'glutes', d: 'M 70 222 Q 64 244 72 262 Q 86 274 100 270 Q 114 274 128 262 Q 136 244 130 222 Q 100 212 70 222 Z' },
    // Hamstring (arka bacak)
    { id: 'hamsL', d: 'M 72 278 Q 66 304 68 332 Q 70 352 78 364 Q 87 368 92 360 Q 95 330 93 302 Q 91 286 89 278 Z' },
    { id: 'hamsR', d: 'M 128 278 Q 134 304 132 332 Q 130 352 122 364 Q 113 368 108 360 Q 105 330 107 302 Q 109 286 111 278 Z' },
    // Baldiz (arka)
    { id: 'calvesL', d: 'M 74 372 Q 68 394 70 412 Q 72 424 80 430 Q 88 426 90 412 Q 90 392 88 376 Z' },
    { id: 'calvesR', d: 'M 126 372 Q 132 394 130 412 Q 128 424 120 430 Q 112 426 110 412 Q 110 392 112 376 Z' }
];

// --- Yardimci: pasif siluet parcalari (renklenmez) -------------------------
// Kafa, boyun, eller, ayaklar — kas bolgelerinden AYRI durur, koyu gri ton.
const HEAD_PATH = 'M 100 8 Q 86 8 81 20 Q 77 32 83 42 Q 91 50 100 50 Q 109 50 117 42 Q 123 32 119 20 Q 114 8 100 8 Z';
const NECK_PATH = 'M 92 49 Q 92 60 88 68 L 112 68 Q 108 60 108 49 Z';

const HAND_L = 'M 36 238 Q 30 250 32 260 Q 38 266 44 260 Q 45 248 42 240 Z';
const HAND_R = 'M 164 238 Q 170 250 168 260 Q 162 266 156 260 Q 155 248 158 240 Z';

const FOOT_L = 'M 74 420 Q 68 436 72 448 Q 84 454 94 448 Q 94 434 90 424 Z';
const FOOT_R = 'M 126 420 Q 132 436 128 448 Q 116 454 106 448 Q 106 434 110 424 Z';

const FRONT_SILHOUETTE = (
    <>
        <path d={HEAD_PATH} />
        <path d={NECK_PATH} />
        <path d={HAND_L} />
        <path d={HAND_R} />
        <path d={FOOT_L} />
        <path d={FOOT_R} />
    </>
);

const BACK_SILHOUETTE = (
    <>
        <path d={HEAD_PATH} />
        <path d={NECK_PATH} />
        <path d={HAND_L} />
        <path d={HAND_R} />
        <path d={FOOT_L} />
        <path d={FOOT_R} />
    </>
);

// Govde dis hatti (tum figuru cerveveleyen ana kontur) — kafa/boyun HARIC,
// govde+uzuvlar tek organik hat: omuz tepesi -> kol disi -> bel -> kalca ->
// bacak disi -> ayak -> ic bacak -> tekrar yukari.
const BODY_OUTLINE_FRONT = 'M 60 76 Q 52 80 46 92 Q 42 106 44 122 Q 46 140 42 158 Q 38 178 36 198 Q 34 218 40 234 Q 46 240 52 234 Q 54 214 56 196 Q 58 214 54 236 Q 50 260 56 282 Q 62 300 58 322 Q 54 348 60 372 Q 66 394 64 416 Q 62 436 70 446 Q 82 452 92 444 Q 94 460 100 462 Q 106 460 108 444 Q 118 452 130 446 Q 138 436 136 416 Q 134 394 140 372 Q 146 348 142 322 Q 138 300 144 282 Q 150 260 146 236 Q 142 214 144 196 Q 146 214 148 234 Q 154 240 160 234 Q 166 218 164 198 Q 162 178 158 158 Q 154 140 156 122 Q 158 106 154 92 Q 148 80 140 76 Q 128 70 120 72 Q 108 66 100 68 Q 92 66 80 72 Q 72 70 60 76 Z';

const BODY_OUTLINE_BACK = 'M 60 76 Q 52 80 46 92 Q 42 106 44 122 Q 46 140 42 158 Q 38 178 36 198 Q 34 218 40 234 Q 46 240 52 234 Q 54 214 56 196 Q 58 214 54 236 Q 50 260 56 282 Q 62 300 58 322 Q 54 348 60 372 Q 66 394 64 416 Q 62 436 70 446 Q 82 452 92 444 Q 94 460 100 462 Q 106 460 108 444 Q 118 452 130 446 Q 138 436 136 416 Q 134 394 140 372 Q 146 348 142 322 Q 138 300 144 282 Q 150 260 146 236 Q 142 214 144 196 Q 146 214 148 234 Q 154 240 160 234 Q 166 218 164 198 Q 162 178 158 158 Q 154 140 156 122 Q 158 106 154 92 Q 148 80 140 76 Q 128 70 120 72 Q 108 66 100 68 Q 92 66 80 72 Q 72 70 60 76 Z';

// --- Bolge -> grup eslesmesi (tooltip icin) --------------------------------
const REGION_TO_GROUP = {};
Object.entries({
    chest: ['chestL', 'chestR'],
    shoulders: ['deltFrontL', 'deltFrontR', 'deltRearL', 'deltRearR'],
    biceps: ['bicepsL', 'bicepsR'],
    forearms: ['forearmsL', 'forearmsR'],
    core: ['abs', 'obliquesL', 'obliquesR'],
    legs: ['quadsL', 'quadsR', 'hamsL', 'hamsR'],
    calves: ['calvesL', 'calvesR'],
    back: ['trapsL', 'trapsR', 'latsL', 'latsR', 'lowerBack'],
    triceps: ['tricepsL', 'tricepsR'],
    glutes: ['glutes']
}).forEach(([g, regions]) => regions.forEach(r => { REGION_TO_GROUP[r] = g; }));

const GROUP_LABELS = Object.fromEntries(MUSCLE_GROUPS.map(mg => [mg.id, mg]));

// --- Renk skala motoru (HSL interpolasyonu) ---------------------------------
// volume modu: gri -> tema moru -> sari -> turuncu -> kirmizi
// cb (renk koru dostu): ayni siddet ama tek ton (turuncu)
function heatColor(v, colorBlind = false) {
    if (v <= 0) return 'rgba(255,255,255,0.06)';
    const stops = colorBlind
        ? [
            [248, 160, 36],   // turuncu baz
            [230, 100, 20],   // koyu turuncu
            [192, 40, 10]     // kirmizi-msi
        ]
        : [
            [56, 130, 246],   // mavi (dusuk)
            [0, 195, 255],    // tema mavisi
            [255, 214, 0],    // sari
            [255, 120, 0],    // turuncu
            [255, 45, 60]     // kirmizi (yuksek)
        ];
    const n = stops.length - 1;
    const pos = Math.min(0.999, Math.max(0.001, v)) * n;
    const i = Math.floor(pos);
    const f = pos - i;
    const a = stops[i], b = stops[Math.min(n, i + 1)];
    const c = a.map((av, k) => Math.round(av + (b[k] - av) * f));
    return `rgba(${c[0]},${c[1]},${c[2]},0.92)`;
}

// pain modu: yesil -> sari -> kirmizi
function painColor(v) {
    if (v <= 0) return 'rgba(255,255,255,0.06)';
    const stops = [
        [60, 220, 100],   // yesil
        [255, 220, 40],   // sari
        [255, 60, 60]     // kirmizi
    ];
    const n = stops.length - 1;
    const pos = Math.min(0.999, v) * n;
    const i = Math.floor(pos);
    const f = pos - i;
    const a = stops[i], b = stops[Math.min(n, i + 1)];
    const c = a.map((av, k) => Math.round(av + (b[k] - av) * f));
    return `rgba(${c[0]},${c[1]},${c[2]},0.92)`;
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));

// ============================================================================
// Ana bilesen
// ============================================================================
function MuscleMap({
    workoutHistory,
    mode = 'volume',        // 'volume' | 'pain' | 'select'
    painMap = null,         // { regionId: 1-5 } — pain modunda
    selectedRegions = null, // Set<regionId> — select modunda
    onSelectRegion = null,  // (regionId) => void
    days = 7,
    colorBlind = false,
    compact = false
}) {
    const { t, lang } = useTranslation();
    const [hovered, setHovered] = useState(null);
    const [cbMode, setCbMode] = useState(colorBlind);

    const setsByGroup = useMemo(() => weeklySetsByGroup(workoutHistory, days), [workoutHistory, days]);
    const intensities = useMemo(() => regionIntensities(setsByGroup), [setsByGroup]);

    const regionValue = (regionId) => {
        if (mode === 'pain') return painMap ? clamp01((painMap[regionId] || 0) / 5) : 0;
        if (mode === 'select') return selectedRegions && selectedRegions.has(regionId) ? 1 : 0;
        return intensities[regionId] || 0;
    };

    const regionFill = (regionId) => {
        const v = regionValue(regionId);
        if (mode === 'pain') return painColor(v);
        if (mode === 'select') return v > 0 ? 'rgba(0,195,255,0.85)' : 'rgba(255,255,255,0.06)';
        return heatColor(v, cbMode);
    };

    const regionLabel = (regionId) => {
        const g = REGION_TO_GROUP[regionId];
        const info = GROUP_LABELS[g];
        if (!info) return regionId;
        return lang === 'en' ? (info.name_en || info.name) : info.name;
    };

    const regionTooltipText = (regionId) => {
        const g = REGION_TO_GROUP[regionId];
        if (mode === 'pain') {
            const p = painMap ? (painMap[regionId] || 0) : 0;
            return p > 0 ? `${regionLabel(regionId)} — ${p}/5` : regionLabel(regionId);
        }
        if (mode === 'select') return regionLabel(regionId);
        const sets = setsByGroup[g] || 0;
        const range = WEEKLY_RANGES[g];
        return `${regionLabel(regionId)} — ${sets} ${t('musclemap_sets')} (${range.min}-${range.max})`;
    };

    const renderRegion = (r) => {
        const isSel = mode === 'select' && selectedRegions && selectedRegions.has(r.id);
        const isHov = hovered === r.id;
        return (
            <path
                key={r.id}
                d={r.d}
                fill={regionFill(r.id)}
                stroke={isSel ? '#fff' : 'rgba(0,0,0,0.35)'}
                strokeWidth={isSel ? 1.8 : 1}
                opacity={hovered && !isHov && mode !== 'select' ? 0.75 : 1}
                onMouseEnter={() => setHovered(r.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectRegion && onSelectRegion(r.id)}
                style={{
                    cursor: onSelectRegion ? 'pointer' : 'default',
                    transition: 'fill 300ms ease'
                }}
            />
        );
    };

    const figWidth = compact ? 140 : 190;
    const figHeight = compact ? 322 : 437;
    const svgWidth = figWidth * 2 + 60;

    return (
        <div style={{ position: 'relative' }}>
            <svg
                viewBox={`0 0 460 470`}
                style={{ width: '100%', maxWidth: svgWidth, height: 'auto', display: 'block', margin: '0 auto' }}
                role="img"
                aria-label={t('musclemap_title')}
            >
                {/* Figur 1: On yuz */}
                <g transform={`translate(10, 5) scale(${figWidth / 200}, ${figHeight / 460})`}>
                    <path d={BODY_OUTLINE_FRONT} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                    <g fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth={1}>
                        {FRONT_SILHOUETTE}
                    </g>
                    {FRONT_REGIONS.map(renderRegion)}
                </g>

                {/* Figur 2: Arka yuz */}
                <g transform={`translate(250, 5) scale(${figWidth / 200}, ${figHeight / 460})`}>
                    <path d={BODY_OUTLINE_BACK} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                    <g fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth={1}>
                        {BACK_SILHOUETTE}
                    </g>
                    {BACK_REGIONS.map(renderRegion)}
                </g>

                {/* Etiketler */}
                <text x={10 + figWidth / 2} y={figHeight + 24} textAnchor="middle" fill="var(--text-light)" fontSize={13} fontWeight={600}>
                    {t('musclemap_front')}
                </text>
                <text x={250 + figWidth / 2} y={figHeight + 24} textAnchor="middle" fill="var(--text-light)" fontSize={13} fontWeight={600}>
                    {t('musclemap_back_view')}
                </text>
            </svg>

            {/* Tooltip */}
            {hovered && mode !== 'select' && (
                <div style={{
                    position: 'absolute',
                    bottom: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(0,195,255,0.4)',
                    borderRadius: 8,
                    padding: '6px 14px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 2
                }}>
                    {regionTooltipText(hovered)}
                </div>
            )}

            {/* Legend */}
            {mode === 'volume' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{t('musclemap_low')}</span>
                    {[0, 0.25, 0.5, 0.75, 1].map(v => (
                        <div key={v} style={{ width: 18, height: 10, borderRadius: 3, background: heatColor(v, cbMode) }} />
                    ))}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{t('musclemap_high')}</span>
                    <button
                        onClick={() => setCbMode(m => !m)}
                        style={{
                            marginLeft: 8, background: 'rgba(255,255,255,0.06)', color: 'var(--text-light)',
                            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '2px 8px',
                            fontSize: '0.65rem', cursor: 'pointer'
                        }}
                        title={t('musclemap_cb_hint')}
                    >
                        {t('musclemap_cb')}
                    </button>
                </div>
            )}
        </div>
    );
}

// --- Sarmalayici kart (Gelisim ekraninda radar yaninda gosterilir) -----------
function MuscleMapCard({ workoutHistory }) {
    const { t } = useTranslation();
    return (
        <div className="glass-card slide-in" style={{ marginTop: '1rem', border: '1px solid rgba(0, 195, 255, 0.3)', background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0, 195, 255, 0.05) 100%)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginTop: 0, marginBottom: '0.5rem' }}>
                <PersonStanding color="#00c3ff" /> {t('musclemap_title')}
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {t('musclemap_description')} · <span style={{ color: '#00c3ff', fontWeight: 600 }}>{t('musclemap_last7')}</span>
            </p>
            <MuscleMap workoutHistory={workoutHistory} mode="volume" />
        </div>
    );
}

export { MuscleMap };
export default MuscleMapCard;
