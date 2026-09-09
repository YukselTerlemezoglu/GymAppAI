// HAREKET VIDEOSU COZUMLEYICI
// Oncelik sirasi:
//   1. Uygulama DB'sindeki wger mp4 (dogrudan akar, en guvenilir)
//   2. YouTube arama fallback (watch?v= degil /embed/ formatinda)
//
// YouTube fallback NEDEN guvenli: iframe embed icin youtube-nocookie.com
// kullanilir; URL harfiyen JS string sabitinden uretilir (kullanici girisi
// icine sizmez). Arama sorgusu encodeURIComponent ile kacis edilir.
//
// wger katalogu (190KB JSON) ana bundle'i sisirmesin diye DINAMIK yuklenir.

import { findExerciseByName } from '../data/exercises';
import { loadWgerExercises } from '../data/wgerExercises';

const YT_EMBED = (videoId) => `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;

// Elle secilmis, formu guvenilir kanallardan bilinen hareketlerin
// YouTube video ID'leri (kisa liste; wger video'su olmayan populer
// hareketler icin). Sonradan genisletilebilir.
const CURATED_YT = {
    'bench-press': 'vcBig73ojpE',
    'squat': 'ultWZbUMPL8',
    'deadlift': 'r4MzxtBKyNE',
    'overhead-press': '2yjwXTZQDDI',
    'pull-up': 'eGo4IYlbE5g',
    'barbell-row': 'kBWAon7ItDw',
    'romanian-deadlift': 'JCXUYuzwNrM',
    'hip-thrust': 'LM8XHLYJoYs',
    'lateral-raise': '3VcKaXpzqRo',
    'bicep-curl': 'ykJmrZ5v0Oo',
    'tricep-pushdown': '2-LAMcpzODU',
    'leg-press': 'IZxyjW7MPJQ',
    'leg-curl': '1Tq3QdYUuHs',
    'leg-extension': 'Dbupzh9ZIag',
    'plank': 'pSHjTRCQxIw',
    'pushup': 'IODxDxX7oi4',
    'lat-pulldown': 'CAwf7n6Luuc',
    'dips': 'dX_nSOOJIsE',
    'skullcrusher': 'd_KZxkY_0kc',
    'face-pull': 'rep-qVOkqgQ'
};

const normalize = (s) => String(s || '')
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// wger indeksi lazy kurulur (katalog ilk kullanildiginda)
let _wgerIndex = null;
async function wgerIndex() {
    if (_wgerIndex) return _wgerIndex;
    try {
        const list = await loadWgerExercises();
        _wgerIndex = list.map(e => ({
            e,
            names: [e.name, e.name_en].filter(Boolean).map(normalize)
        }));
    } catch {
        _wgerIndex = []; // katalog yuklenemedi: bos indeks, YouTube fallback devrede
    }
    return _wgerIndex;
}

/**
 * Hareket icin oynatilabilir video kaynaklarini dondurur (async).
 * @returns {Promise<{mp4: string|null, youtube: string|null, query: string}>}
 *   mp4: dogrudan aktilabilir video dosyasi (wger CDN)
 *   youtube: iframe embed URL'si (hazir; tik ile yuklenir)
 *   query: kullanici isterse YouTube'da kendisi arayabilir
 */
export async function resolveExerciseVideo(exerciseName) {
    const q = normalize(exerciseName);
    if (!q) return { mp4: null, youtube: null, query: exerciseName };

    // 1) wger mp4 (ad eslesmesi)
    const index = await wgerIndex();
    const hit = index.find(({ names }) => names.includes(q))
        || (q.split(' ').length >= 2
            ? index.find(({ names }) => names.some(n => q.split(' ').every(w => n.includes(w))))
            : null);
    if (hit && hit.e.videos && hit.e.videos.length > 0) {
        return { mp4: hit.e.videos[0], youtube: null, query: exerciseName };
    }

    // 2) Uygulama DB kimligi uzerinden elle secilmis YouTube
    const dbEx = findExerciseByName(exerciseName);
    if (dbEx && CURATED_YT[dbEx.id]) {
        return { mp4: null, youtube: YT_EMBED(CURATED_YT[dbEx.id]), query: exerciseName };
    }

    // 3) Fallback: YouTube arama (embed degil; kullanicinin kendi acmasi icin)
    return { mp4: null, youtube: null, query: exerciseName };
}

/**
 * YouTube arama linki (fallback "YouTube'da ara" butonu icin).
 */
export function youtubeSearchUrl(exerciseName) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' proper form')}`;
}

export { YT_EMBED };
