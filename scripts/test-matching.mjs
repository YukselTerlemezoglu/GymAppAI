// Eşleştirme mantığı testleri — node scripts/test-matching.mjs
import { findExerciseByName, findMuscleGroupIdForExercise, normalizeName } from '../src/data/exercises.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`PASS: ${name}`); }
  else { fail++; console.log(`FAIL: ${name} -> got '${actual}', expected '${expected}'`); }
}

// --- Eski bug senaryoları ---
// 'lateral raise' içinde 'lat' geçer ama sırt OLMAMALI
check('lateral raise -> omuz (lat bug fix)', findMuscleGroupIdForExercise('Lateral Raise'), 'shoulders');
check('Lat Pulldown -> sırt', findMuscleGroupIdForExercise('Lat Pulldown'), 'back');
check('leg raise -> core (leg bug fix)', findMuscleGroupIdForExercise('Hanging Leg Raise'), 'core');
check('leg press -> bacak', findMuscleGroupIdForExercise('Leg Press'), 'legs');
check('leg curl -> bacak (curl = biceps değil)', findMuscleGroupIdForExercise('Leg Curl'), 'legs');
check('tricep pushdown -> triceps', findMuscleGroupIdForExercise('Tricep Pushdown'), 'triceps');

// --- Veritabanı eşleşmeleri ---
check('Bench Press bulunur', findExerciseByName('Bench Press')?.id, 'bench-press');
check('barfiks bulunur', findExerciseByName('Barfiks')?.id, 'pull-up');
check('RDL alias', findExerciseByName('RDL')?.id, 'romanian-deadlift');
check('Şınav (Türkçe karakter)', findExerciseByName('Şınav')?.id, 'pushup');
check('sınav normalize', findExerciseByName('sınav')?.id, 'pushup');
check('Incline Bench Press alias', findExerciseByName('Incline Bench Press')?.id, 'incline-db-press');
check('Hammer curl alias', findExerciseByName('hammer curl')?.id, 'hammer-curl');
check('Ölü Çekiş (TR)', findExerciseByName('Ölü Çekiş')?.id, 'deadlift');

// --- Bilinmeyenler null dönmeli (tahmin yok) ---
check('bilinmeyen egzersiz -> null', findExerciseByName('Zumba Dance'), null);
check('boş -> null', findExerciseByName(''), null);

// --- Kelime bazlı (2+ kelime) ---
check('dumbbell bench press (2+ kelime)', findExerciseByName('Dumbbell Bench Press')?.id, 'bench-press');
check('cable seated row', findExerciseByName('Cable Seated Row')?.id, 'seated-cable-row');

// --- Fallback kelime sınırı testleri ---
check('shrug -> back', findMuscleGroupIdForExercise('Barbell Shrug'), 'back');
check('dumbbell fly -> chest', findMuscleGroupIdForExercise('Dumbbell Fly'), 'chest');
check('mekik -> core', findMuscleGroupIdForExercise('Mekik'), 'core');
check('kalça kickback -> glutes', findMuscleGroupIdForExercise('Glute Kickback'), 'glutes');
check('calf raises -> calves', findMuscleGroupIdForExercise('Calf Raises'), 'calves');
check('wrist curls -> forearms', findMuscleGroupIdForExercise('Wrist Curls'), 'forearms');

// --- normalize ---
check('normalize türkçe', normalizeName('ÖLÜ ÇEKİŞ ĞÜŞÖÇİ'), 'olu cekis gusoci');

console.log(`\nSonuç: ${pass} geçti, ${fail} kaldı`);
process.exit(fail > 0 ? 1 : 0);
