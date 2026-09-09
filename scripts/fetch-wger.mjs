// wger acik kaynak egzersiz DB'sinden hareket listesini ceker.
// Kullanim: node scripts/fetch-wger.mjs
// Cikti: scripts/wger-data.json (wgerId, name, equipment, category, muscles, videos)
//
// Not: wger API v2'de isimler exerciseinfo endpoint'inde "translations"
// icinde tasinir; exercise endpoint'i sadece ID listesi verir.

import fs from 'node:fs';

const BASE = 'https://wger.de/api/v2';

async function getJSON(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'GymAppAI/1.0 (personal project)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return res.json();
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 1) exerciseinfo: isim (translations) + ekipman + kas + kategori tek cagrıda
async function fetchAll() {
    const all = [];
    let next = `${BASE}/exerciseinfo/?format=json&limit=100`;
    let page = 0;
    while (next && page < 40) {
        const data = await getJSON(next);
        for (const info of data.results || []) {
            // Ingilizce ceviriyi bul; yoksa herhangi ilk dolu olan
            const tr = (info.translations || []).find(x => x.language === 'en')
                || (info.translations || [])[0]
                || null;
            const name = (tr && (tr.name || '').trim()) || '';
            if (!name) continue;
            all.push({
                wgerId: info.id,
                name,
                category: info.category ? info.category.name : null,
                muscles: (info.muscles || []).map(m => m.name).filter(Boolean),
                musclesSecondary: (info.musclesSecondary || []).map(m => m.name).filter(Boolean),
                equipment: (info.equipment || []).map(e => e.name).filter(Boolean)
            });
        }
        next = data.next;
        page++;
        if (page % 4 === 0) console.log(`  sayfa ${page}: toplam ${all.length}`);
        await sleep(150); // nazik ol
    }
    return all;
}

// 2) videolar
async function fetchVideos() {
    const map = {};
    try {
        let next = `${BASE}/video/?format=json&limit=100`;
        let page = 0;
        while (next && page < 20) {
            const data = await getJSON(next);
            for (const v of data.results || []) {
                if (!map[v.exercise]) map[v.exercise] = [];
                const url = v.video || v.videoFile || null;
                if (url) map[v.exercise].push(url);
            }
            next = data.next;
            page++;
            await sleep(100);
        }
        console.log(`  video: ${Object.keys(map).length} hareket`);
    } catch (e) {
        console.log('  video API atlandi:', e.message);
    }
    return map;
}

const exercises = await fetchAll();
const videoMap = await fetchVideos();

const out = exercises.map(e => ({
    ...e,
    videos: (videoMap[e.wgerId] || []).filter(Boolean)
}));

fs.writeFileSync('scripts/wger-data.json', JSON.stringify(out, null, 1), 'utf8');
console.log(`\nTAMAM: ${out.length} hareket scripts/wger-data.json'a yazildi`);
console.log(`Video lu: ${out.filter(e => e.videos.length > 0).length}`);
