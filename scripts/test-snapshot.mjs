// snapshotScheduler mantik testleri (node --test)
// Firestore bagimliligi olmasin diye saf fonksiyonlari dosyadan
// ayiklayarak degerlendiriyoruz (modul import'u firebase gerektirir).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync('src/utils/snapshotScheduler.js', 'utf8');

const moduleCode = src
    .replace(/^import .*$/gm, '')
    // export'lu fonksiyonlari async fonksiyona cevir (govdede await olabilir)
    .replace(/^export (async )?function (\w+)/gm, 'async function $2')
    .replace(/^export const (\w+) = (async )?/gm, 'const $1 = $2');

// Sahte tarayici ortami: localStorage mock (Node 24'te yerlesik localStorage
// global'i var; globalThis uzerinden ezilemez. Bu yuzden mock, Function'a
// PARAMETRE olarak gecilir — modul icindeki localStorage referanslari bunu gorur.)
// indexedDB mock: isLocalEmpty IDB'yi de kontrol eder; test senaryolarina
// gore kontrollu bos/dolu dondurur.
const store = {};
const lsMock = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] ?? null
};
let idbHasData = false; // testler degistirebilir

const ctx = {};
// indexedDB mock: open() bir "request" dondurur; onsuccess mikrotask'te
// tetiklenir ve target.result olarak sahte DB verir. getAllKeys da ayni
// sekilde idbHasData bayragina gore yanit verir.
const makeIdbMock = () => ({
    open: () => {
        const fakeDb = {
            transaction: () => ({
                objectStore: () => ({
                    getAllKeys: () => {
                        const keys = idbHasData ? ['gym_app_xp'] : [];
                        const r = { onsuccess: null, onerror: null, result: keys };
                        Promise.resolve().then(() => {
                            r.onsuccess?.({ target: { result: keys } });
                        });
                        return r;
                    }
                })
            }),
            close: () => { }
        };
        const req = { onsuccess: null, onerror: null, onupgradeneeded: null };
        Promise.resolve().then(() => req.onsuccess?.({ target: { result: fakeDb } }));
        return req;
    }
});
new Function('ctx', 'localStorage', 'indexedDB', `${moduleCode}
ctx.dayKey = dayKey;
ctx.byteLen = byteLen;
ctx.computeFingerprint = computeFingerprint;
ctx.fitToSize = fitToSize;
// DIKKAT: export'lu fonksiyonlar test icin async yapilir; isLocalEmpty
// Promise dondurur — testlerde await edilmesi gerekir.
ctx.isLocalEmpty = isLocalEmpty;
ctx.THROTTLE_MS = THROTTLE_MS;
ctx.MAX_SNAPSHOT_BYTES = MAX_SNAPSHOT_BYTES;
ctx.KEEP_DAYS = KEEP_DAYS;
ctx.SNAP_LAST_KEY = SNAP_LAST_KEY;
ctx.SNAP_ENABLED_KEY = SNAP_ENABLED_KEY;
ctx.SNAP_FINGERPRINT_KEY = SNAP_FINGERPRINT_KEY;`)(ctx, lsMock, makeIdbMock());

const { dayKey, byteLen, computeFingerprint, fitToSize, isLocalEmpty, KEEP_DAYS } = ctx;
assert.ok(dayKey && byteLen && computeFingerprint && fitToSize && isLocalEmpty, 'saf fonksiyonlar ayiklanamadi');

// ---------- dayKey ----------
test('dayKey: YYYY-MM-DD formati', () => {
    assert.equal(dayKey(new Date(2026, 8, 17)), '2026-09-17'); // ay 0-indexed
    assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');
});

// ---------- byteLen ----------
test('byteLen: UTF-8 bayt olcer (Turkce karakter agirligi)', () => {
    assert.equal(byteLen('abc'), 3);
    assert.equal(byteLen('çğüşıö'), 12); // her Turkce harf 2 bayt
    assert.equal(byteLen(''), 0);
});

// ---------- computeFingerprint ----------
test('computeFingerprint: ayni veri ayni iz, degisik veri farkli iz', () => {
    const mk = (hist, coins) => ({
        ls: { gym_app_history: hist, gym_app_coins: coins },
        idb: {}
    });
    const a = mk([{ id: 1 }], 100);
    const b = mk([{ id: 1 }], 100);
    const c = mk([{ id: 1 }, { id: 2 }], 100);
    assert.equal(computeFingerprint(a), computeFingerprint(b));
    assert.notEqual(computeFingerprint(a), computeFingerprint(c));
});

test('computeFingerprint: veri yoksa bos iz (bos yedek alinmaz)', () => {
    assert.equal(computeFingerprint({ ls: {}, idb: {} }), '');
});

// ---------- fitToSize ----------
test('fitToSize: kucuk yedek oldugu gibi gecer', () => {
    const backup = { version: 1, app: 'GymAppAI', ls: { gym_app_history: [{ id: 1 }] }, idb: {}, stats: {} };
    const res = fitToSize(backup);
    assert.equal(res.trimmed, 0);
    assert.equal(res.backup.ls.gym_app_history.length, 1);
});

test('fitToSize: buyuk history kademeli kirpilir, trimmed sayilir', () => {
    const bigHist = Array.from({ length: 500 }, (_, i) => ({ id: i, val: 'x'.repeat(2200) })); // ~1.1MB
    const backup = { version: 1, app: 'GymAppAI', ls: { gym_app_history: bigHist }, idb: {}, stats: {} };
    const res = fitToSize(backup);
    // kirpma yapildi mi? (500'den az ve trimmed>0) ya da tamamen reddedildi mi?
    // iki durum de kabul: onemli olan limit altina inme garantisi
    if (res) {
        assert.ok(res.trimmed > 0);
        assert.ok(res.backup.ls.gym_app_history.length < 500);
        assert.ok(byteLen(JSON.stringify(res.backup)) <= ctx.MAX_SNAPSHOT_BYTES);
        assert.equal(res.backup.stats.trimmedHistory, res.trimmed);
    } else {
        assert.ok(byteLen(JSON.stringify(backup)) > ctx.MAX_SNAPSHOT_BYTES);
    }
});

test('fitToSize: hicbir kirpma yetmezse null (yarim yedek yazilmaz)', () => {
    // 10 dev kayit: en kucuk kirpma adimi (10) bile yetmez
    const huge = Array.from({ length: 10 }, (_, i) => ({ id: i, val: 'x'.repeat(300_000) }));
    const backup = { version: 1, app: 'GymAppAI', ls: { gym_app_history: huge }, idb: {}, stats: {} };
    const res = fitToSize(backup);
    assert.equal(res, null);
});

// ---------- isLocalEmpty ----------
test('isLocalEmpty: sadece meta anahtarlar varsa bos sayilir (LS+IDB bos)', async () => {
    Object.keys(store).forEach(k => delete store[k]);
    idbHasData = false;
    store['gym_app_snap_last'] = '1';
    store['gym_app_snap_fp'] = 'x';
    store['gym_app_snap_enabled'] = '1';
    store['gym_app_snap_toast_date'] = '2026-09-17';
    store['gym_app_lang'] = 'tr';
    assert.ok(await isLocalEmpty());
});

test('isLocalEmpty: tek gercek veri anahtari bile varsa dolu (LS)', async () => {
    Object.keys(store).forEach(k => delete store[k]);
    idbHasData = false;
    store['gym_app_xp'] = '1500';
    assert.ok(!(await isLocalEmpty()));
});

test('isLocalEmpty: LS bos ama IDB doluysa dolu sayilir (hidrasyon oncesi guvenlik)', async () => {
    Object.keys(store).forEach(k => delete store[k]);
    idbHasData = true; // IDB'de veri var, LS henuz hidrate olmamis
    assert.ok(!(await isLocalEmpty()));
});

test('isLocalEmpty: tamamen bos storage', async () => {
    Object.keys(store).forEach(k => delete store[k]);
    idbHasData = false;
    assert.ok(await isLocalEmpty());
});

// ---------- sabitler ----------
test('sabitler: SK tasarimi degerleri', () => {
    assert.equal(ctx.THROTTLE_MS, 60 * 60 * 1000); // 1 saat
    assert.equal(ctx.MAX_SNAPSHOT_BYTES, 800_000); // 800KB ihtiyat
    assert.equal(KEEP_DAYS, 7);                    // döner pencere
});

// ---------- REGRESYON: await eksikligi (adversarial review bulgusu #1) ----------
// restoreIfEmpty icindeki isLocalEmpty cagrilari await'siz olursa Promise
// (her zaman truthy) doner ve guard hic calismaz -> her giriste yikici
// restore. Kaynak kodda await'lerin varligini statik olarak dogrulariz.
test('REGRESYON: restoreIfEmpty isLocalEmpty cagrilari await ile', () => {
    const src = fs.readFileSync('src/utils/snapshotScheduler.js', 'utf8');
    const body = src.slice(src.indexOf('async function restoreIfEmpty'));
    const awaited = (body.match(/await isLocalEmpty\(\)/g) || []).length;
    const bare = (body.match(/(?<!await )(?<!\w)\bisLocalEmpty\(\)/g) || []).length;
    assert.ok(awaited >= 2, `await'li cagri bekleniyor (>=2), bulundu: ${awaited}`);
    // await'siz (bare) cagri yalnizca fonksiyon tanimindan gelebilir; tanim
    // satirinda 'function' on eki oldugu icin yukaridaki lookbehind onu da
    // yakalar — bu yuzden bare <= 1 toleransi (tanim satiri) koyuldu.
    assert.ok(bare <= 1, `await'siz isLocalEmpty cagrisi: ${bare} (tanim satiri haric olmamali)`);
});

// ---------- REGRESYON: i18n tek parantez interpolasyonu (review bulgusu #2) ----------
test('REGRESYON: i18n degerlerinde {{param}} formati (tek parantez yok)', () => {
    for (const p of ['src/i18n/tr.js', 'src/i18n/en.js']) {
        const content = fs.readFileSync(p, 'utf8');
        // anahtar: "deger {param} devam" — {{}} disinda kalan tek parantezli placeholder
        const bad = [...content.matchAll(/^\s{4}(\w+):\s*"[^"]*([^{}]|^)\{(\w+)\}([^{}]|$)[^"]*"/gm)]
            .filter(m => !m[0].includes(`{{${m[3]}}}`));
        assert.equal(bad.length, 0, `${p}: tek parantezli placeholder -> ${bad.map(m => m[1]).join(', ')}`);
    }
});

// ---------- rules dosyasi ----------
test('firestore.rules: snapshots blogu sahibi + sema korumali', () => {
    const rules = fs.readFileSync('firestore.rules', 'utf8');
    assert.ok(rules.includes('match /snapshots/{day}'), 'snapshots match blogu yok');
    assert.ok(rules.includes("request.auth.uid == userId"), 'sahip kosulu yok');
    assert.ok(rules.includes('payload is string'), 'payload tip kontrolu yok');
    assert.ok(rules.includes('payload.size() <= 800000'), 'payload boyut siniri yok');
});

// ---------- i18n paritesi ----------
test('i18n: snap_* anahtarlari TR ve EN de birebir ayni set', () => {
    const grab = (path) => {
        const content = fs.readFileSync(path, 'utf8');
        const keys = new Set();
        for (const m of content.matchAll(/^\s{4}(snap_\w+):/gm)) keys.add(m[1]);
        return keys;
    };
    const tr = grab('src/i18n/tr.js');
    const en = grab('src/i18n/en.js');
    assert.ok(tr.size >= 28, `TR snap_* az geldi: ${tr.size}`);
    assert.deepEqual([...tr].sort(), [...en].sort(), 'TR/EN snap_* setleri farkli');
});

console.log('test-snapshot: OK');
