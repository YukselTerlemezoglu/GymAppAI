// Radar kas eslestme kapsama testi: yaygin egzersiz adlarinin
// kac tanesi kas grubuna eslesiyor, hangileri null donuyor?
// Kullanim: node scripts/test-muscle-map.mjs
import { findMuscleGroupIdForExercise } from '../src/data/exercises.js';

const COMMON = [
  // AI'in uretebilecegi Ingilizce adlar
  'Barbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Bench Press',
  'Push Up', 'Push-Ups', 'Cable Fly', 'Chest Press Machine',
  'Squat', 'Back Squat', 'Front Squat', 'Goblet Squat', 'Leg Press',
  'Romanian Deadlift', 'Bulgarian Split Squat', 'Walking Lunge',
  'Leg Extension', 'Leg Curl', 'Hip Thrust', 'Calf Raise', 'Seated Calf Raise',
  'Deadlift', 'Conventional Deadlift', 'Barbell Row', 'Dumbbell Row',
  'Lat Pulldown', 'Pull Up', 'Chin Up', 'Seated Cable Row', 'T-Bar Row',
  'Face Pull', 'Straight Arm Pulldown', 'Shrug', 'Barbell Shrug',
  'Overhead Press', 'Shoulder Press', 'Military Press', 'Arnold Press',
  'Lateral Raise', 'Side Lateral Raise', 'Front Raise', 'Rear Delt Fly',
  'Bicep Curl', 'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl',
  'Concentration Curl', 'Cable Curl', 'EZ Bar Curl',
  'Tricep Pushdown', 'Skullcrusher', 'Tricep Extension', 'Overhead Tricep Extension',
  'Close Grip Bench Press', 'Dips', 'Tricep Dip',
  'Plank', 'Crunch', 'Sit Up', 'Hanging Leg Raise', 'Cable Crunch',
  'Russian Twist', 'Ab Wheel Rollout', 'Mountain Climber',
  'Wrist Curl', 'Farmers Walk', 'Dead Hang',
  // Turkce adlar (kullanici ozel program/AI tr cikti)
  'Bench Press', 'Iticus', 'Sinev', 'Sinav', 'Sınav', 'Şınav',
  'Barfiks', 'Barfikis', 'Dominant', 'Dogal Cekilis', 'Mekik',
  'Plank', 'Karın Kası', 'Kolay Karin', 'Omuz Press', 'Yan Omuz',
  'Arska Kol', 'Triceps', 'Biceps', 'Bacak Press', 'Leg Press',
  'Deadlift', 'Küçük Deadlift', 'Sumo Deadlift', 'Kaldırış',
  'Dumbbell Omuz', 'Seated Row', 'Cable Row', 'Trapez', 'Trapez Kası',
  'Kalça Küçültme', 'Hip Thrust', 'Glute Bridge', 'Kickback',
  'Smith Machine Squat', 'Hack Squat', 'Leg Press Machine',
  'Leg Raise', 'Knee Raise', 'Toe Raise', 'Donkey Calf Raise',
  'Close-Grip Bench', 'Wide Grip Pull-Up', 'Reverse Curl',
  'Upright Row', 'Cable Crossover', 'Pec Deck', 'Butterfly',
  'Pull Over', 'Pullover', 'Straight Leg Deadlift', 'Good Morning',
  'Nordic Curl', 'Glute Ham Raise', 'Hyperextension', 'Back Extension'
];

let ok = 0, fail = 0;
const failed = [];
const matched = {};
for (const name of COMMON) {
  const g = findMuscleGroupIdForExercise(name);
  if (g) {
    ok++;
    matched[g] = (matched[g] || 0) + 1;
  } else {
    fail++;
    failed.push(name);
  }
}

console.log(`OK: ${ok}  FAIL: ${fail}  oran: ${(ok / (ok + fail) * 100).toFixed(1)}%`);
console.log('\nGrup bazinda eslesen:', JSON.stringify(matched, null, 0));
console.log('\nEslesmeyenler:');
for (const f of failed) console.log('  YOK ->', f);
