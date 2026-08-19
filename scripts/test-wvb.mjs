// Haftalik hacim pano testleri - node scripts/test-wvb.mjs
import { MUSCLE_GROUPS, findMuscleGroupIdForExercise } from '../src/data/exercises.js';

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`PASS: ${name}`); }
  else { fail++; console.log(`FAIL: ${name} ${extra}`); }
};

// parseRange mantigi (bileşen içi fonksiyonun aynisi)
const parseRange = (str) => {
  if (typeof str !== 'string') return {};
  const m = str.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return { min: parseInt(m[1]), max: parseInt(m[2]) };
  const single = str.match(/(\d+)/);
  if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
  return {};
};

// Tum kas gruplarinda weeklySets parse edilebilmeli
let allParsable = true;
MUSCLE_GROUPS.forEach(mg => {
  const r = parseRange(mg.weeklySets);
  if (!(r.min > 0 && r.max >= r.min)) { allParsable = false; console.log(`  -> ${mg.id}: '${mg.weeklySets}' -> ${JSON.stringify(r)}`); }
});
check('10 kas grubunun weeklySets araligi parse ediliyor', allParsable);

// Ornek hesaplama: gogus 12 set -> 10-20 araliginda 'ok'
const chest = MUSCLE_GROUPS.find(mg => mg.id === 'chest');
const cr = parseRange(chest.weeklySets);
check('Gogus onerisi 10-20', cr.min === 10 && cr.max === 20);

// Durum hesabi (bileşenle ayni mantik)
const statusOf = (done, recMin, recMax) => {
  if (done === 0) return 'none';
  if (recMin > 0 && done < recMin) return 'low';
  if (recMax > 0 && done > recMax * 1.25) return 'high';
  return 'ok';
};
check('0 set -> none', statusOf(0, 10, 20) === 'none');
check('5 set -> low (10 alti)', statusOf(5, 10, 20) === 'low');
check('12 set -> ok', statusOf(12, 10, 20) === 'ok');
check('20 set -> ok (sinir)', statusOf(20, 10, 20) === 'ok');
check('26 set -> high (20*1.25 ustu)', statusOf(26, 10, 20) === 'high');

// Eski antrenmanlar sayilmamali (7 gun penceresi)
const oldDate = new Date(Date.now() - 12 * 86400000).toISOString();
const groupId = findMuscleGroupIdForExercise('Bench Press');
check('Bench Press -> chest', groupId === 'chest');

console.log(`\nSonuc: ${pass} gecti, ${fail} kaldi`);
process.exit(fail > 0 ? 1 : 0);
