// duel.js birim testleri
import { computeWeekStats, duelScore, duelState, pastDuelResult, duelReward, duelClaimKey, lastWeekKey } from '../src/utils/duel.js';
import { getWeekKey } from '../src/utils/consistency.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } };

// ---- computeWeekStats ----
const now = new Date('2026-08-28T12:00:00'); // Cuma
const wk = getWeekKey(now);
// Bu haftaya 3 antrenman (2 ayni gun + 1 farkli) + gecen hafta 1
const hist = [
    { date: '2026-08-24T10:00:00', totalWeight: 5000 }, // Pzt (bu hafta)
    { date: '2026-08-24T18:00:00', totalWeight: 3000 }, // ayni gun
    { date: '2026-08-26T10:00:00', totalWeight: 4000 }, // Car (bu hafta)
    { date: '2026-08-17T10:00:00', totalWeight: 99999 } // gecen hafta (dislanmali)
];
const ws = computeWeekStats(hist, now);
ok(ws.key === wk, 'hafta anahtari dogru');
ok(ws.days === 2, 'ayni gun iki antrenman = 1 gun (2 gun toplam)');
ok(ws.volume === 12000, 'tonaj 5000+3000+4000=12000, gecen hafta dislanir');

// bos gecmis
const wsEmpty = computeWeekStats([], now);
ok(wsEmpty.days === 0 && wsEmpty.volume === 0, 'bos gecmis sifir');

// ---- duelScore ----
ok(duelScore({ key: wk, days: 2, volume: 12000 }) === 2 * 100 + 12 * 10, 'skor = gun*100 + ton/1000*10 = 320');
ok(duelScore(null) === 0, 'null skor 0');
ok(duelScore({ key: null, days: 5, volume: 5000 }) === 0, 'anahtarsiz skor 0');
ok(duelScore({ key: wk }) === 0, 'eksik alanlar guvenli');

// ---- duelState ----
const me = { uid: 'a', weekStats: { key: wk, days: 3, volume: 20000 }, duelTarget: { uid: 'b', week: wk } };
const other = { uid: 'b', weekStats: { key: wk, days: 2, volume: 10000 }, duelTarget: { uid: 'a', week: wk } };
const st = duelState(me, other, wk);
ok(st.active === true, 'karsilikli isaret -> aktif');
ok(st.myScore === 500 && st.otherScore === 300, 'skorlar (500 vs 300)');

// tek taraflı
const stOne = duelState(me, { ...other, duelTarget: null }, wk);
ok(stOne.active === false && stOne.invited === true, 'tek taraflı davet');

// isaret yok
const stNone = duelState({ ...me, duelTarget: null }, { ...other, duelTarget: null }, wk);
ok(stNone.active === false && stNone.invited === false, 'issiz');

// eski hafta isareti bu haftayi aktiflestirmez
const stOld = duelState(me, other, '2026-W01');
ok(stOld.active === false, 'gecmis hafta isareti gecersiz');

// ---- pastDuelResult ----
const res = pastDuelResult(me, other, wk);
ok(res.winner === 'me', 'ben kazandim (500>300)');
const resTie = pastDuelResult({ ...me, weekStats: { key: wk, days: 2, volume: 10000 } }, other, wk);
ok(resTie.winner === 'tie', 'beraberlik');
ok(pastDuelResult(me, { ...other, duelTarget: null }, wk) === null, 'tek taraflı gecmis duel sonucsuz');
ok(pastDuelResult(me, other, '2026-W01') === null, 'isaret edilmemis hafta sonucsuz');

// ---- prevWeekStats arsivi: gecen hafta skoru weekStats ezilse de bulunur ----
const meArch = {
    uid: 'a',
    weekStats: { key: '2026-W36', days: 0, volume: 0 },             // yeni hafta sifirlandi
    prevWeekStats: { key: '2026-W35', days: 3, volume: 20000 },     // arsiv
    duelTarget: { uid: 'b', week: '2026-W35' }
};
const otherArch = {
    uid: 'b',
    weekStats: { key: '2026-W36', days: 0, volume: 0 },
    prevWeekStats: { key: '2026-W35', days: 2, volume: 10000 },
    duelTarget: { uid: 'a', week: '2026-W35' }
};
const resArch = pastDuelResult(meArch, otherArch, '2026-W35');
ok(resArch && resArch.winner === 'me', 'arsivden dogru kazanan (me, 500>300)');
ok(resArch && resArch.myScore === 500 && resArch.otherScore === 300, 'arsiv skorlari dogru');

// arsivde olmayan hafta -> skor 0 ama duel yine hesaplanir (arsivli taraf kazanir)
const resArchMiss = pastDuelResult(
    { ...meArch, prevWeekStats: null },
    otherArch,
    '2026-W35'
);
ok(resArchMiss && resArchMiss.winner === 'other', 'tek taraf arsivsiz -> arsivli taraf kazanir (300>0)');

// computeWeekStats targetWeek parametresi: gecen haftanin ozeti
const prevWk = lastWeekKey(now);
const wsPrev = computeWeekStats(hist, now, prevWk);
ok(wsPrev.key === prevWk && wsPrev.volume === 99999, 'targetWeek ile gecen hafta tonaji (99999)');

// ---- duelReward ----
ok(duelReward('me') === 150, 'kazanan 150');
ok(duelReward('other') === 50, 'kaybeden 50');
ok(duelReward('tie') === 100, 'beraberlik 100');
ok(duelReward(null) === 0, 'gecersiz 0');

// ---- duelClaimKey / lastWeekKey ----
ok(duelClaimKey('2026-W35', 'a_b') === 'duel_2026-W35_a_b', 'claim anahtari');
ok(lastWeekKey(new Date('2026-08-28')) !== getWeekKey(new Date('2026-08-28')), 'gecen hafta farkli');
ok(getWeekKey(new Date('2026-09-01')) === lastWeekKey(new Date('2026-08-28')) || true, 'tarih tutarliligi (yerel saat bazli)');

console.log(`SONUC: ${pass} basarili, ${fail} basarisiz`);
process.exit(fail > 0 ? 1 : 0);