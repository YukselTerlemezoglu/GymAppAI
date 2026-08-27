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

console.log('--- dailyQuests ---');
const dq = loadModule('src/utils/dailyQuests.js').exports;
const t1 = dq.dailyTasks({ userName: 'test', now: new Date('2026-08-27T10:00:00') });
const t2 = dq.dailyTasks({ userName: 'test', now: new Date('2026-08-27T22:00:00') });
ok(t1.length === 3, '3 gorev uretildi');
ok(JSON.stringify(t1.map(x => x.id)) === JSON.stringify(t2.map(x => x.id)), 'ayni gun ayni gorevler (deterministik)');

const ctx = dq.taskContext([
    { exercise: 'Squat', date: new Date().toISOString(), sets: 8, totalWeight: 4000, avgRpe: 8 },
    { exercise: 'Curl', date: new Date().toISOString(), sets: 4, totalWeight: 500, avgRpe: 8 }
], new Set(['Squat']));
ok(ctx.todaySets === 12, 'bugunun setleri sayildi');
ok(ctx.todayVolume === 4500, 'bugunun hacmi dogru');
ok(ctx.todayNewExercise === true, 'yeni hareket algilandi (Curl once yok)');

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
