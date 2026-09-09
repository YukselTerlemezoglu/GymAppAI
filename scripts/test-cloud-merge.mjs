// cloudSync merge mantigi testleri (node --test)
// Firestore bagimliligi olmasin diye merge yardimcilarini dosyadan
// ayiklayarak degerlendiriyoruz (modul import'u firebase gerektirir).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync('src/utils/cloudSync.js', 'utf8');

// Eval icin: dosyanin tamamini sahte import'larla sarmala
const moduleCode = src
    .replace(/^import .*$/gm, '')
    .replace(/^export (const|function|async)/gm, 'const');

const ctx = {};
new Function('ctx', `${moduleCode}\nctx.mergeLists = typeof mergeLists !== 'undefined' ? mergeLists : null;
ctx.mergeMax = typeof mergeMax !== 'undefined' ? mergeMax : null;
ctx.mergeLww = typeof mergeLww !== 'undefined' ? mergeLww : null;
ctx.mergeKey = typeof mergeKey !== 'undefined' ? mergeKey : null;
ctx.MERGE_STRATEGY = typeof MERGE_STRATEGY !== 'undefined' ? MERGE_STRATEGY : null;
ctx.hasMergePull = typeof mergeAndPullFromCloud === 'function';`)(ctx);

const { mergeLists, mergeMax, mergeLww, mergeKey, MERGE_STRATEGY } = ctx;
assert.ok(mergeLists && mergeMax && mergeLww && mergeKey, 'merge fonksiyonlari ayiklanamadi');
assert.ok(ctx.hasMergePull, 'mergeAndPullFromCloud tanimli degil');

// ---------- mergeLists ----------
test('mergeLists: iki cihazin history birlesir, id dedupe', () => {
    const local = JSON.stringify([{ id: 'a', name: 'Bench' }, { id: 'b', name: 'Squat' }]);
    const cloud = JSON.stringify([{ id: 'b', name: 'Squat' }, { id: 'c', name: 'Deadlift' }]);
    const merged = JSON.parse(mergeLists(local, cloud));
    assert.equal(merged.length, 3);
    assert.ok(merged.some(x => x.id === 'c'));
});

test('mergeLists: lokal yoksa bulut kalir', () => {
    const cloud = JSON.stringify([{ id: 'c' }]);
    assert.equal(mergeLists(null, cloud), cloud);
});

test('mergeLists: bulut yoksa lokal kalir', () => {
    const local = JSON.stringify([{ id: 'a' }]);
    assert.equal(mergeLists(local, null), local);
});

test('mergeLists: updatedAt iicin guncel olan kazanir', () => {
    const local = JSON.stringify([{ id: 'a', name: 'eski', updatedAt: 100 }]);
    const cloud = JSON.stringify([{ id: 'a', name: 'yeni', updatedAt: 200 }]);
    const merged = JSON.parse(mergeLists(local, cloud));
    assert.equal(merged[0].name, 'yeni');
});

// ---------- mergeMax ----------
test('mergeMax: buyuk coin kazanir', () => {
    assert.equal(JSON.parse(mergeMax('500', '800')), 800);
    assert.equal(JSON.parse(mergeMax('900', '800')), 900);
});

test('mergeMax: lokal yoksa bulut', () => {
    assert.equal(mergeMax(null, '800'), '800');
});

test('mergeMax: bozuk deger lokal kalir', () => {
    assert.equal(mergeMax('abc', '800'), '800');
});

// ---------- mergeLww ----------
test('mergeLww: zaman damgasi yoksa lokal korunur (konservatif)', () => {
    const local = JSON.stringify({ snacks: 3 });
    const cloud = JSON.stringify({ snacks: 1 });
    assert.equal(mergeLww(local, cloud), local);
});

test('mergeLww: bulut daha yeniyse bulut kazanir', () => {
    const local = JSON.stringify({ updatedAt: 100, v: 1 });
    const cloud = JSON.stringify({ updatedAt: 300, v: 2 });
    assert.equal(mergeLww(local, cloud), cloud);
});

test('mergeLww: lokal yoksa bulut uygulanir', () => {
    const cloud = JSON.stringify({ v: 2 });
    assert.equal(mergeLww(null, cloud), cloud);
});

// ---------- mergeKey (strateji yonlendirme) ----------
test('mergeKey: history list stratejisi kullanir', () => {
    const local = JSON.stringify([{ id: 'a' }]);
    const cloud = JSON.stringify([{ id: 'a' }, { id: 'b' }]);
    const merged = JSON.parse(mergeKey('gym_app_history', local, cloud));
    assert.equal(merged.length, 2);
});

test('mergeKey: coins max stratejisi kullanir', () => {
    assert.equal(JSON.parse(mergeKey('gym_app_coins', '100', '999')), 999);
});

test('mergeKey: tanimsiz anahtar lokal kalir', () => {
    assert.equal(mergeKey('gym_app_bilinmeyen', '"lokal"', '"bulut"'), '"lokal"');
});

// ---------- strateji kapsami ----------
test('MERGE_STRATEGY: kritik ekonomi anahtarlari tanimli', () => {
    for (const k of ['gym_app_history', 'gym_app_coins', 'gym_app_xp', 'gym_app_inventory', 'gym_app_quests']) {
        assert.ok(MERGE_STRATEGY[k], `${k} stratejisi eksik`);
    }
});
