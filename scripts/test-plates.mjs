// Pul hesaplayici mantik testleri
let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`PASS: ${name}`); }
  else { fail++; console.log(`FAIL: ${name} ${extra}`); }
};

const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const calcPlates = (target, bar) => {
  const perSide = (target - bar) / 2;
  if (isNaN(perSide) || perSide < 0) return null;
  let remaining = perSide;
  const result = [];
  PLATES_KG.forEach(p => {
    const count = Math.floor(remaining / p + 1e-9);
    if (count > 0) { result.push({ plate: p, count }); remaining -= count * p; }
  });
  return { result, leftover: Math.round(remaining * 100) / 100 };
};

// Klasik ornekler
let r = calcPlates(60, 20);
check('60kg bar20 -> taraf basina 20kg = 1x20', r && r.result.length === 1 && r.result[0].plate === 20 && r.result[0].count === 1 && r.leftover === 0, JSON.stringify(r));

r = calcPlates(100, 20);
check('100kg bar20 -> 25+15 taraf basina (greedy, toplam 40)', r && r.result.length === 2 && r.result[0].plate === 25 && r.result[1].plate === 15 && r.leftover === 0, JSON.stringify(r));

r = calcPlates(42.5, 20);
check('42.5kg bar20 -> 10+1.25 taraf basina, kalan 0', r && r.leftover === 0 && r.result.some(x => x.plate === 10) && r.result.some(x => x.plate === 1.25), JSON.stringify(r));

r = calcPlates(22.5, 20);
check('22.5kg bar20 -> 1.25 x1 taraf basina', r && r.result.length === 1 && r.result[0].plate === 1.25 && r.result[0].count === 1, JSON.stringify(r));

r = calcPlates(61.25, 20);
check('61.25kg -> 20.625 kalan yok, 20+0.625 olmaz; leftover 0.625', r && r.leftover === 0.63 || r && r.leftover === 0.625, JSON.stringify(r));

r = calcPlates(20, 20);
check('20kg = sadece bar', r && r.result.length === 0, JSON.stringify(r));

r = calcPlates(15, 20);
check('15kg < bar -> null', r === null);

r = calcPlates(50, 15);
check('50kg bar15 -> 17.5/taraf = 15+2.5', r && r.result.length === 2 && r.result[0].plate === 15 && r.result[1].plate === 2.5, JSON.stringify(r));

console.log(`\nSonuc: ${pass} gecti, ${fail} kaldi`);
process.exit(fail > 0 ? 1 : 0);
