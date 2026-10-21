// Yağ oranı tahmini. İkisi de ölçüm değildir; kayda ayrı alan olarak yazılır.
// Mezura: ABD donanma formülü (cm, log10). Görünüş: kaba aralık.

const VISUAL = {
    male: [
        { id: 'sharp', low: 6, high: 9 },
        { id: 'abs', low: 10, high: 14 },
        { id: 'faint', low: 15, high: 18 },
        { id: 'soft', low: 19, high: 24 },
        { id: 'high', low: 25, high: 32 }
    ],
    female: [
        { id: 'sharp', low: 14, high: 17 },
        { id: 'abs', low: 18, high: 22 },
        { id: 'faint', low: 23, high: 27 },
        { id: 'soft', low: 28, high: 33 },
        { id: 'high', low: 34, high: 40 }
    ]
};

export function visualOptions(sex) {
    return VISUAL[sex === 'female' ? 'female' : 'male'];
}

export function visualBodyFat(sex, id) {
    const row = visualOptions(sex).find((item) => item.id === id);
    if (!row) return null;
    return { low: row.low, high: row.high, mid: Math.round(((row.low + row.high) / 2) * 10) / 10, method: 'visual' };
}

export function navyBodyFat({ sex, height, neck, waist, hip }) {
    const h = Number(height);
    const n = Number(neck);
    const w = Number(waist);
    if (!(h > 0 && n > 0 && w > 0)) return null;
    let density;
    if (sex === 'female') {
        const hp = Number(hip);
        if (!(hp > 0) || w + hp <= n) return null;
        density = 1.29579 - 0.35004 * Math.log10(w + hp - n) + 0.221 * Math.log10(h);
    } else {
        if (w <= n) return null;
        density = 1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h);
    }
    const bf = 495 / density - 450;
    if (!Number.isFinite(bf) || bf < 3 || bf > 60) return null;
    const mid = Math.round(bf * 10) / 10;
    return { low: Math.round((mid - 3) * 10) / 10, high: Math.round((mid + 3) * 10) / 10, mid, method: 'tape' };
}
