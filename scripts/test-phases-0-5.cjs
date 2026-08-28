// FAZ 0-5 mantik birim testleri (Node, CJS).
// strengthMath / coachEngine / season / dailyQuests / readiness / programGenerator
const fs = require('fs');
const path = require('path');
const Module = require('module');

// ESM -> CJS hizli cevirici (basit import karsilama)
function loadModule(relPath) {
    const file = path.resolve(__dirname, '..', relPath);
    let src = fs.readFileSync(file, 'utf8');

    // import satirlarini coz: ayni util klasorunden ve data klasorunden
    const importRe = /import\s+\{([^}]+)\}\s+from\s+'([^']+)';/g;
    const deps = {};
    let m;
    while ((m = importRe.exec(src)) !== null) {
        const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
        const spec = m[2];
        const depSrc = spec.startsWith('.') ? spec : '.' + spec;
        const depFile = path.resolve(path.dirname(file), depSrc) + '.js';
        if (fs.existsSync(depFile)) {
            const depMod = loadModule(path.relative(path.resolve(__dirname, '..'), depFile));
            names.forEach(n => { deps[n] = depMod.exports[n]; });
        } else {
            names.forEach(n => { deps[n] = undefined; }); // bulunamayan bagimlilik (orn. prTracker icin on tanim)
        }
    }

    // export'lari topla
    const exportNames = new Set();
    const exRe = /export\s+(?:const|function|let)\s+([A-Za-z_$][\w$]*)/g;
    let mm;
    while ((mm = exRe.exec(src)) !== null) exportNames.add(mm[1]);
    const exDefRe = /export\s+default\s+/g;
    src = src.replace(exDefRe, '');

    // import'lari kaldir, export anahtar kelimesini kaldir
    src = src.replace(/import[^;]+;/g, '');
    src = src.replace(/export\s+(const|function|let)\s+/g, '$1 ');

    // Toplu export baglama: fonksiyon/const tanimlarini mod.exports'a yaz
    const bindLine = '\n;try{[' + [...exportNames].map(n => `'${n}'`).join(',') + `].forEach(function(k){try{var v=eval(k);if(v!==undefined)module.exports[k]=v;}catch(e){}});}catch(e){}\n`;

    const mod = new Module(file, null);
    mod.filename = file;
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    const fn = new Function('module', 'exports', 'require', ...Object.keys(deps), src + bindLine);
    fn(mod, mod.exports, mod.require.bind(mod), ...Object.values(deps));

    return { exports: mod.exports };
}

let pass = 0, fail = 0;
function ok(cond, label) {
    if (cond) { pass++; console.log('  ✓ ' + label); }
    else { fail++; console.log('  ✗ ' + label); }
}

console.log('--- strengthMath ---');
const sm = loadModule('src/utils/strengthMath.js').exports;

// e1rmSeries
const hist = [
    { exercise: 'Bench Press', date: '2026-08-01', maxWeight: 60, bestReps: 8, sets: 4 },
    { exercise: 'Bench Press', date: '2026-08-08', maxWeight: 62.5, bestReps: 8, sets: 4 },
    { exercise: 'Bench Press', date: '2026-08-15', maxWeight: 65, bestReps: 7, sets: 4 },
    { exercise: 'Bench Press', date: '2026-08-22', maxWeight: 65, bestReps: 7, sets: 4 },
    { exercise: 'Squat', date: '2026-08-10', maxWeight: 100, bestReps: 5, sets: 5 }
];
const series = sm.e1rmSeries('Bench Press', hist);
ok(series.length === 4, 'e1rmSeries 4 oturum');
ok(series[0].e1rm < series[1].e1rm, 'seri artan (baslangicta)');
ok(series.every(s => s.e1rm > 0), 'tum e1rm pozitif');

// detectPlateau: son 3 ayni, onceki dusuk -> plato (21+ gun)
const plateauHist = [
    { exercise: 'Row', date: '2026-07-01', maxWeight: 50, bestReps: 10, sets: 4 },
    { exercise: 'Row', date: '2026-07-10', maxWeight: 50, bestReps: 10, sets: 4 },
    { exercise: 'Row', date: '2026-07-20', maxWeight: 50.5, bestReps: 10, sets: 4 },
    { exercise: 'Row', date: '2026-08-01', maxWeight: 50, bestReps: 10, sets: 4 },
    { exercise: 'Row', date: '2026-08-10', maxWeight: 50, bestReps: 10, sets: 4 },
    { exercise: 'Row', date: '2026-08-20', maxWeight: 50.5, bestReps: 10, sets: 4 }
];
const pl = sm.detectPlateau('Row', plateauHist);
ok(pl !== null, 'detectPlateau plato bulundu');
ok(pl.weeks >= 3, 'plato >= 3 hafta');

// volumeStatusByGroup
const vol = sm.volumeStatusByGroup([
    { exercise: 'Bench Press', date: new Date().toISOString(), sets: 12 },
    { exercise: 'Squat', date: new Date().toISOString(), sets: 2 }
], 7);
ok(vol.chest.status === 'optimal' || vol.chest.status === 'high', 'gogus hacmi makul');
ok(vol.legs.status === 'below', 'bacak MEV alti');
ok(vol.back.status === 'none', 'sirt hic calisilmadi');

// neglectedGroups
const neg = sm.neglectedGroups(hist, 7, 3);
ok(Array.isArray(neg), 'neglectedGroups array dondurur');

// nextLoadSuggestion
const loadHist = [{ exercise: 'Bench Press', date: new Date().toISOString(), maxWeight: 60, bestReps: 8, avgRpe: 6.5 }];
const sug = sm.nextLoadSuggestion('Bench Press', loadHist);
ok(sug.kind === 'weight' && sug.targetWeight > 60, 'dusuk RPE -> agirlik artisi');

const hiRpe = [{ exercise: 'Bench Press', date: new Date().toISOString(), maxWeight: 60, bestReps: 8, avgRpe: 9.7 }];
ok(sm.nextLoadSuggestion('Bench Press', hiRpe).kind === 'backoff', 'yuksek RPE -> geri cekilis');

// balanceRatios
const balHist = [
    { exercise: 'Barbell Bench Press', date: '2026-08-01', maxWeight: 80, bestReps: 5 },
    { exercise: 'Barbell Row', date: '2026-08-01', maxWeight: 70, bestReps: 5 }
];
const bal = sm.balanceRatios(balHist);
ok(bal.length === 1, 'bench:row orani hesaplandi');
ok(bal[0].status === 'balanced' || bal[0].status === 'push_heavy', 'bench:row durum');

console.log('--- coachEngine ---');
const ce = loadModule('src/utils/coachEngine.js').exports;
const insights = ce.generateInsights({ workoutHistory: plateauHist, weeklyGoal: 3 });
ok(Array.isArray(insights) && insights.length > 0, 'icgoru uretildi');
ok(insights.some(i => i.id === 'plateau'), 'plato icgorusu var');
ok(insights.every((a, i) => i === 0 || insights[i - 1].priority >= a.priority), 'oncelik sirali');

const empty = ce.generateInsights({ workoutHistory: [] });
ok(empty.length === 1 && empty[0].id === 'empty_history', 'bos gecmis -> baslangic mesaji');

const painIns = ce.generateInsights({ workoutHistory: plateauHist, painData: { maxLevel: 4, maxRegion: 'chestL' } });
ok(painIns.some(i => i.id === 'pain_alert'), 'agri alerti uretildi');
ok(painIns[0].id === 'pain_alert', 'agri oncelikli (95)');
// Faz 4: hazirlik + deload icgoruleri
const rdIns = ce.generateInsights({ workoutHistory: plateauHist, painData: { maxLevel: 4, maxRegion: 'chestL', lastCheckIn: { mood: 1, pain: { chestL: 4 } } }, sleepData: { log: [{ hours: 5 }, { hours: 5.5 }] } });
ok(rdIns.some(i => i.id === 'readiness'), 'hazirlik icgorusu uretildi');
const rdTop = rdIns.find(i => i.id === 'readiness');
ok(rdTop.data.score >= 0 && rdTop.data.score <= 100, 'hazirlik skoru 0-100');
console.log('   (bilgi) hazirlik bandi:', rdTop.data.band, 'skor:', rdTop.data.score);

console.log('--- season ---');
const se = loadModule('src/utils/season.js').exports;
ok(se.SEASON_WEEKS === 8, '8 haftalik sezon');
ok(se.leagueForSP(0).id === 'bronze', '0 SP -> bronz');
ok(se.leagueForSP(5000).id === 'gold', '5000 SP -> altin');
ok(se.leagueForSP(999999).id === 'legend', 'cok SP -> efsane');
ok(se.spFromWorkout({ totalWeight: 5000, sets: 12 }) > se.spFromWorkout({ totalWeight: 1000, sets: 3 }), 'hacim+set SP artirir');
const rollover = se.rolloverSeason({ seasonNumber: 1, seasonSP: 1000, totalSP: 500, league: 'bronze', history: [] });
ok(rollover.seasonNumber === 2 && rollover.seasonSP === 0, 'rollover: yeni sezon SP=0');
ok(rollover.totalSP === 1500, 'rollover: totalSP birikir');
ok(rollover.league === 'silver', 'rollover: lig korundu/yukseldi');

console.log('--- dailyQuests v2 ---');
const dq = loadModule('src/utils/dailyQuests.js').exports;
const t1 = dq.dailyTasks({ userName: 'test', now: new Date('2026-08-27T10:00:00') });
const t2 = dq.dailyTasks({ userName: 'test', now: new Date('2026-08-27T22:00:00') });
ok(t1.length === 3, '3 gorev uretildi');
ok(JSON.stringify(t1.map(x => x.id)) === JSON.stringify(t2.map(x => x.id)), 'ayni gun ayni gorevler (deterministik)');
ok(t1.map(x => x.tier).join(',') === 'easy,medium,hard', 'tier sirasi kolay/orta/zor');
ok(t1[0].reward.coins === 50 && t1[1].reward.coins === 100 && t1[2].reward.coins === 200, 'oduller 50/100/200');

// Kisisel esikler
const pt = dq.personalTargets([
    { date: '2026-08-20T10:00:00Z', sets: 12, totalWeight: 5000 },
    { date: '2026-08-22T10:00:00Z', sets: 14, totalWeight: 5500 }
], new Date('2026-08-28T10:00:00'));
ok(pt.volumeTarget >= 1500 && pt.volumeTarget <= 8000, 'hacim hedefi sinirlar icinde');
ok(pt.setTarget >= 8 && pt.setTarget <= 24, 'set hedefi sinirlar icinde');
ok(pt.volumeTarget < 5500, 'hedef medyanin altinda (~%90)');

// Kural motoru agirliklandirmasi: bacak ihmalinde legs_today agirlikli
const t3 = dq.dailyTasks({ userName: 'test', workoutHistory: [], neglected: ['legs'], now: new Date('2026-08-28T10:00:00') });
ok(t3.length === 3, 'kural motoru 3 oneri uretti');

const ctx = dq.taskContext([
    { exercise: 'Squat', date: new Date().toISOString(), sets: 8, totalWeight: 4000, avgRpe: 8 },
    { exercise: 'Curl', date: new Date().toISOString(), sets: 4, totalWeight: 500, avgRpe: 8 }
], { mobility: true });
ok(ctx.todaySets === 12, 'bugunun setleri sayildi');
ok(ctx.todayVolume === 4500, 'bugunun hacmi dogru');
ok(ctx.todayNewExercise === true, 'yeni hareket algilandi (Curl once yok)');
ok(ctx.todayMobility === true, 'mobilite isareti okundu');
ok(ctx.personal && ctx.personal.setTarget > 0, 'kisisel hedefler ctx icinde');

const ev = dq.evaluateTasks(t1, ctx);
ok(ev.every(e => typeof e.progress === 'number' && e.progress >= 0 && e.progress <= 1), 'progress 0..1 araliginda');
ok(ev.some(e => e.done), 'en az bir gorev tamamlandi (veriye gore)');

console.log('--- don (Double or Nothing) ---');
const don = loadModule('src/utils/don.js').exports;
ok(don.flip(() => 0.3) === 'heads' && don.flip(() => 0.7) === 'tails', 'flip deterministik random ile');
ok(don.canStartChain(null, '2026-08-28') === true, 'ilk zincir serbest');
ok(don.canStartChain({ day: '2026-08-28', chainsUsed: 1 }, '2026-08-28') === false, 'gunluk hak bitince kilit');
ok(don.canStartChain({ day: '2026-08-27', chainsUsed: 1 }, '2026-08-28') === true, 'yeni gun hak sifirlanir');
ok(don.nextMult(1) === 2 && don.nextMult(2) === 4 && don.nextMult(8) === null, 'carpan zinciri 2-4-8, tavanda null');
const dr1 = don.applyChainResult(null, { banked: 200, lost: 0, chainLen: 2, flips: 2, wins: 2 }, '2026-08-28');
ok(dr1.stats.biggestBank === 200 && dr1.stats.longestChain === 2, 'bankalama istatistigi');
const dr2 = don.applyChainResult(dr1, { banked: 0, lost: 400, chainLen: 2, flips: 3, wins: 2 }, '2026-08-28');
ok(dr2.stats.totalLost === 400 && don.donNet(dr2.stats) === -200, 'kayip + net hesap dogru');

// EV nötrlük simülasyonu: riske girme, uzun vadede "güvenli alma" ile ayni getiri
{
    let won = 0, lost = 0, safeTotal = 0, plays = 0;
    // mulberry32 (dailyQuests ile ayni algoritma)
    let a = 987654321;
    const rnd = () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < 50000; i++) {
        const base = 100;
        plays++;
        safeTotal += base; // guvenli alma alternatifi: her tur base garantisi
        let pot = base;
        // %50 devam stratejisi: kaybedince kaybedilen gercek pot sayilir
        while (pot < 800 && rnd() < 0.5) {
            if (rnd() < 0.5) pot *= 2; else { lost += pot; pot = 0; break; }
        }
        if (pot > 0) won += pot;
    }
    // DoN'in guvenli almaya gore net etkisi ~0 olmali (EV notr)
    const evCoins = (won - safeTotal) / plays;
    ok(Math.abs(evCoins) < 10, 'EV ~ notr (simulasyon: basina ' + evCoins.toFixed(2) + ' fark, 0 olmali)');
    ok(won > 0 && lost > 0, 'hem kazanclar hem kayiplar olusuyor (varyans var)');
}

console.log('--- readiness ---');
const rd = loadModule('src/utils/readiness.js').exports;
const fresh = rd.readinessScore([]);
ok(fresh.score === null && fresh.band === 'fresh', 'bos gecmis -> fresh');
const avgState = rd.readinessScore(hist);
ok(typeof avgState.score === 'number' && avgState.score >= 0 && avgState.score <= 100, 'skor 0-100 araliginda');
ok(['fresh', 'ready', 'caution', 'deload'].includes(avgState.band), 'gecerli band');
const pained = rd.readinessScore(hist, { mood: 1, pain: { chestL: 5 } });
ok(pained.score < avgState.score, 'agri + kotu mood skoru dusurur');

console.log('--- programGenerator ---');
const pg = loadModule('src/utils/programGenerator.js').exports;
const { program } = pg.generateProgram({ goal: 'hypertrophy', daysPerWeek: 3, sessionMinutes: 60, equipment: 'gym', experience: 'intermediate' }, []);
ok(program.days.length === 3, '3 gunluk program');
ok(program.days[0].dayName === 'Push', 'ilk gun Push');
ok(program.days.every(d => d.exercises.length >= 4), 'her gun 4+ hareket');
ok(program.days.every(d => d.exercises.every(e => e.sets && e.reps)), 'tum hareketlerde set+reps');
ok(program.isCoachGenerated === true, 'koç uretimi isaretli');

const home = pg.generateProgram({ goal: 'strength', daysPerWeek: 2, sessionMinutes: 45, equipment: 'home', experience: 'beginner' }, []).program;
ok(home.days[0].exercises.some(e => e.name === 'Push Up'), 'ev modunda Push Up');
ok(home.days.length === 2, '2 gun full body');

const dl = pg.makeDeloadWeek(program);
ok(dl.isDeload === true, 'deload isaretli');
const normalSets = parseInt(program.days[0].exercises[0].sets);
const deloadSets = parseInt(dl.days[0].exercises[0].sets);
ok(deloadSets < normalSets, 'deload setleri azaltilmis');

console.log('');
console.log('SONUC: ' + pass + ' basarili, ' + fail + ' basarisiz');
process.exit(fail > 0 ? 1 : 0);
