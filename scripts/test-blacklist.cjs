// Blacklist unit test - programGenerator + painMapToBlacklist
// Loader copied from test-phases-0-5.cjs (ESM -> CJS)
const path = require('path');
const fs = require('fs');

function loadModule(relPath) {
    const file = path.resolve(__dirname, '..', relPath);
    let src = fs.readFileSync(file, 'utf8');
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
            names.forEach(n => { deps[n] = undefined; });
        }
    }
    const exportNames = new Set();
    const exRe = /export\s+(?:const|function|let)\s+([A-Za-z_$][\w$]*)/g;
    let mm;
    while ((mm = exRe.exec(src)) !== null) exportNames.add(mm[1]);
    src = src.replace(/export\s+default\s+/g, '');
    src = src.replace(/import[^;]+;/g, '');
    src = src.replace(/export\s+(const|function|let)\s+/g, '$1 ');
    const fn = new Function(...Object.keys(deps), src + '\nreturn {' + [...exportNames].join(',') + '};');
    return { exports: fn(...Object.values(deps)) };
}

const { generateProgram } = loadModule('src/utils/programGenerator.js').exports;
const { painMapToBlacklist } = loadModule('src/utils/readiness.js').exports;

let pass = 0, fail = 0;
const check = (name, cond) => {
    if (cond) { pass++; console.log('  PASS', name); }
    else { fail++; console.log('  FAIL', name); }
};

const { program: p1 } = generateProgram(
    { goal: 'hypertrophy', daysPerWeek: 3, sessionMinutes: 60, equipment: 'gym', experience: 'intermediate', blacklist: ['chest'] },
    []
);
const chestExs = [];
p1.days.forEach(d => d.exercises.forEach(e => {
    if (/bench press|chest|fly|dips?$/i.test(e.name)) chestExs.push(e.name);
}));
check('chest blacklisted: no chest exercise (' + chestExs.join(', ') + ')', chestExs.length === 0);

const { program: p2 } = generateProgram(
    { goal: 'hypertrophy', daysPerWeek: 3, sessionMinutes: 60, equipment: 'gym', experience: 'intermediate', blacklist: ['Barbell Squat'] },
    []
);
const all2 = p2.days.flatMap(d => d.exercises.map(e => e.name));
check('exercise-name blacklist: no squat', !all2.includes('Barbell Squat'));

const { program: p3 } = generateProgram(
    { goal: 'hypertrophy', daysPerWeek: 4, sessionMinutes: 60, equipment: 'gym', experience: 'intermediate', blacklist: ['legs', 'shoulders'] },
    []
);
const all3 = p3.days.flatMap(d => d.exercises.map(e => e.name));
console.log('    legs+shoulders programi:', all3.join(' | '));
const banned = /squat|leg press|romanian|bulgarian|hack|leg ext|leg curl|overhead press|seated dumbbell press|arnold|lateral raise|face pull|rear delt/i;
const bad = all3.filter(n => banned.test(n));
check('legs+shoulders blacklisted: ' + bad.length + ' violations', bad.length === 0);

const { program: p4 } = generateProgram(
    { goal: 'hypertrophy', daysPerWeek: 3, sessionMinutes: 60, equipment: 'gym', experience: 'intermediate', blacklist: [] },
    []
);
const total4 = p4.days.reduce((a, d) => a + d.exercises.length, 0);
check('empty blacklist: program generated (' + total4 + ' exercises)', total4 > 0);

check('painMap: chestL=4 -> [chest]', JSON.stringify(painMapToBlacklist({ chestL: 4, chestR: 3 })) === '["chest"]');
check('painMap: low pain excluded', painMapToBlacklist({ chestL: 2 }).length === 0);
check('painMap: null safe', painMapToBlacklist(null).length === 0);

console.log('\nResult:', pass, 'PASS,', fail, 'FAIL');
process.exit(fail ? 1 : 0);
