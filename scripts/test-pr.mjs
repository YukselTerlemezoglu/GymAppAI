// PR tespiti testleri — node scripts/test-pr.mjs
import { estimate1RM, getBestSet, detectPRs, getOverloadSuggestion } from '../src/utils/prTracker.js';

let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`PASS: ${name}`); }
  else { fail++; console.log(`FAIL: ${name} ${extra}`); }
}

// e1RM
check('e1RM 100kg x1 = 103.3', Math.abs(estimate1RM(100, 1) - 103.33) < 0.1);
check('e1RM 100kg x10 = 133.3', Math.abs(estimate1RM(100, 10) - 133.33) < 0.1);
check('e1RM geçersiz = 0', estimate1RM(0, 5) === 0);

// Geçmiş
const history = [
  { date: '2026-08-01', exercise: 'Bench Press', maxWeight: 80, bestReps: 8 },
  { date: '2026-08-08', exercise: 'Bench Press', maxWeight: 82.5, bestReps: 8 },
  { date: '2026-08-08', exercise: 'Squat', maxWeight: 100, bestReps: 5 }
];

const best = getBestSet('Bench Press', history);
check('En iyi set 82.5x8 (e1RM 104.4)', best && best.weight === 82.5 && best.reps === 8);

// PR tespiti: kilo arttı, tekrar aynı -> e1rm PR
let prs = detectPRs([{ exercise: 'Bench Press', maxWeight: 85, bestReps: 8 }], history);
check('85x8 -> e1RM PR', prs.length === 1 && prs[0].type === 'e1rm');
check('PR prevBest dogru', prs[0].prevBest && prs[0].prevBest.weight === 82.5);

// Aynı kilo ama +tekrar -> e1RM PR
prs = detectPRs([{ exercise: 'Bench Press', maxWeight: 82.5, bestReps: 10 }], history);
check('82.5x10 -> e1RM PR', prs.length === 1 && prs[0].type === 'e1rm');

// PR degil: ayni performans
prs = detectPRs([{ exercise: 'Bench Press', maxWeight: 80, bestReps: 8 }], history);
check('80x8 -> PR degil', prs.length === 0, JSON.stringify(prs));

// Ilk kayit
prs = detectPRs([{ exercise: 'Deadlift', maxWeight: 120, bestReps: 3 }], []);
check('Ilk kayit first tipi', prs.length === 1 && prs[0].type === 'first');

// Ayni antrenmanda ayni egzersiz iki kez -> tek PR (en iyisi)
prs = detectPRs([
  { exercise: 'Squat', maxWeight: 95, bestReps: 6 },
  { exercise: 'Squat', maxWeight: 105, bestReps: 5 }
], history);
check('Ayni egzersiz x2 -> tek PR, en iyi secilir', prs.length === 1 && prs[0].weight === 105);

// Overload önerisi
const sug = getOverloadSuggestion('Bench Press', history);
check('Öneri: 12 tekrar alti -> reps artir', sug && sug.kind === 'reps' && sug.targetReps === 9 && sug.targetWeight === 82.5);

const sug2 = getOverloadSuggestion('Squat', history); // 100x5 -> reps +1
check('Squat önerisi 100x6', sug2 && sug2.kind === 'reps' && sug2.targetReps === 6);

const highRepHistory = [{ date: '2026-08-01', exercise: 'Curl', maxWeight: 15, bestReps: 14 }];
const sug3 = getOverloadSuggestion('Curl', highRepHistory);
check('14 tekrar -> kilo artir (17.5x10)', sug3 && sug3.kind === 'weight' && sug3.targetWeight === 17.5 && sug3.targetReps === 10);

const noHist = getOverloadSuggestion('Nev Var', []);
check('Geçmişi olmayan -> null', noHist === null);

console.log(`\nSonuç: ${pass} geçti, ${fail} kaldı`);
process.exit(fail > 0 ? 1 : 0);
