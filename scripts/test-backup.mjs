// backup.js birim testleri — Node ortaminda IndexedDB olmadigi icin
// globals mock'lanir, saf fonksiyonlar (validateBackup) gercek veriyle test edilir.
import { validateBackup, BACKUP_VERSION } from '../src/utils/backup.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } };

// ---- validateBackup ----
// gecerli yedek
const validBackup = {
    version: 1,
    createdAt: '2026-08-30T00:00:00Z',
    app: 'GymAppAI',
    ls: { gym_app_xp: 1000 },
    idb: { gym_app_history: [{}, {}, {}] },
    stats: { workouts: 3 }
};
const v1 = validateBackup(validBackup);
ok(v1.valid === true, 'gecerli yedek kabul');
ok(v1.stats?.workouts === 3, 'istatistik tasinir');

// null / array / string
ok(validateBackup(null).valid === false, 'null red');
ok(validateBackup([]).valid === false, 'array red');
ok(validateBackup('x').valid === false, 'string red');

// yanlis uygulama
ok(validateBackup({ ...validBackup, app: 'Other' }).reason === 'app', 'yanlis app red');

// yeni surum
ok(validateBackup({ ...validBackup, version: BACKUP_VERSION + 1 }).reason === 'version', 'ileri surum red');
// eski surum kabul (geriye donuk uyum)
ok(validateBackup({ ...validBackup, version: BACKUP_VERSION - 1 }).valid === true, 'eski surum kabul');

// eksik bolumler
ok(validateBackup({ ...validBackup, ls: null }).reason === 'sections', 'ls null red');
ok(validateBackup({ ...validBackup, idb: 'text' }).reason === 'sections', 'idb string red');

// bos yedek
ok(validateBackup({ ...validBackup, ls: {}, idb: {} }).reason === 'empty', 'bos yedek red');

console.log(`SONUC: ${pass} basarili, ${fail} basarisiz`);
process.exit(fail > 0 ? 1 : 0);
