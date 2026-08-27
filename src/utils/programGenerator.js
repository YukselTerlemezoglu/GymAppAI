// AKILLI PROGRAM URETICI (Faz 3) — veri katmani.
// Sihirbaz girdileri + kullanicinin GERCEK GECMISI birlestirilerek
// periyodize (4 yukleme + 1 deload) program uretir.
// Cikti formati mevcut savedAiProgram yapisina %100 uyumludur:
// { name, days: [{ dayName, focus, exercises: [{ name, sets, reps, weight, rest }] }], isCoachGenerated: true }

import { neglectedGroups, nextLoadSuggestion } from './strengthMath';

// ---------------------------------------------------------------------------
// Hareket havuzu — ekipman ve deneyim seviyesine gore filtrelenir
// ---------------------------------------------------------------------------
// compound oncelik: ana hareketler en basta, izolasyon tamamlar.
const POOL = {
    chest: {
        compound: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Dips', 'Machine Chest Press'],
        isolation: ['Cable Fly', 'Dumbbell Fly']
    },
    back: {
        compound: ['Pull Up', 'Barbell Row', 'Lat Pulldown', 'Seated Cable Row'],
        isolation: ['Straight Arm Pulldown']
    },
    shoulders: {
        compound: ['Overhead Press', 'Seated Dumbbell Press', 'Arnold Press'],
        isolation: ['Lateral Raise', 'Face Pull', 'Rear Delt Fly']
    },
    biceps: {
        compound: ['Barbell Curl', 'Hammer Curl'],
        isolation: ['Incline Dumbbell Curl', 'Cable Curl']
    },
    triceps: {
        compound: ['Close Grip Bench Press', 'Dips'],
        isolation: ['Cable Pushdown', 'Overhead Triceps Extension']
    },
    legs: {
        compound: ['Barbell Squat', 'Leg Press', 'Romanian Deadlift', 'Bulgarian Split Squat', 'Hack Squat'],
        isolation: ['Leg Extension', 'Leg Curl']
    },
    glutes: {
        compound: ['Hip Thrust', 'Romanian Deadlift'],
        isolation: ['Cable Kickback']
    },
    calves: {
        compound: [],
        isolation: ['Standing Calf Raise', 'Seated Calf Raise']
    },
    core: {
        compound: [],
        isolation: ['Plank', 'Hanging Leg Raise', 'Cable Crunch']
    },
    forearms: {
        compound: [],
        isolation: ['Wrist Curl', 'Reverse Curl']
    }
};

// Ev antrenmani alternatifleri (barbell yoksa)
const HOME_ALT = {
    'Barbell Bench Press': 'Push Up',
    'Incline Dumbbell Press': 'Pike Push Up',
    'Barbell Row': 'Inverted Row',
    'Barbell Squat': 'Goblet Squat',
    'Romanian Deadlift': 'Single Leg RDL',
    'Overhead Press': 'Pike Push Up',
    'Barbell Curl': 'Resistance Band Curl',
    'Hip Thrust': 'Single Leg Glute Bridge',
    'Leg Press': 'Bulgarian Split Squat',
    'Lat Pulldown': 'Resistance Band Pulldown',
    'Close Grip Bench Press': 'Diamond Push Up'
};

// Split iskeletleri — gun sayisina gore
const SPLITS = {
    2: [
        { dayName: 'Full Body A', focus: ['chest', 'back', 'legs', 'core'] },
        { dayName: 'Full Body B', focus: ['shoulders', 'legs', 'biceps', 'triceps'] }
    ],
    3: [
        { dayName: 'Push', focus: ['chest', 'shoulders', 'triceps'] },
        { dayName: 'Pull', focus: ['back', 'biceps'] },
        { dayName: 'Legs', focus: ['legs', 'glutes', 'calves'] }
    ],
    4: [
        { dayName: 'Upper A', focus: ['chest', 'back', 'shoulders'] },
        { dayName: 'Lower A', focus: ['legs', 'glutes', 'core'] },
        { dayName: 'Upper B', focus: ['chest', 'back', 'biceps', 'triceps'] },
        { dayName: 'Lower B', focus: ['legs', 'calves', 'core'] }
    ],
    5: [
        { dayName: 'Push A', focus: ['chest', 'shoulders', 'triceps'] },
        { dayName: 'Pull A', focus: ['back', 'biceps'] },
        { dayName: 'Legs', focus: ['legs', 'glutes', 'calves'] },
        { dayName: 'Upper B', focus: ['chest', 'back', 'shoulders', 'triceps'] },
        { dayName: 'Lower B', focus: ['legs', 'core'] }
    ],
    6: [
        { dayName: 'Push A', focus: ['chest', 'shoulders', 'triceps'] },
        { dayName: 'Pull A', focus: ['back', 'biceps'] },
        { dayName: 'Legs A', focus: ['legs', 'glutes'] },
        { dayName: 'Push B', focus: ['chest', 'triceps', 'core'] },
        { dayName: 'Pull B', focus: ['back', 'shoulders', 'biceps'] },
        { dayName: 'Legs B', focus: ['legs', 'calves', 'core'] }
    ]
};

// Hedefe gore set/tekrar sablonlari
const GOAL_SCHEMES = {
    strength: { compound: { sets: 4, reps: '3-5', rest: 180 }, isolation: { sets: 3, reps: '8-10', rest: 90 } },
    hypertrophy: { compound: { sets: 4, reps: '6-10', rest: 120 }, isolation: { sets: 3, reps: '10-14', rest: 75 } },
    endurance: { compound: { sets: 3, reps: '12-15', rest: 60 }, isolation: { sets: 3, reps: '15-20', rest: 45 } }
};

/**
 * Program uretici ana fonksiyon.
 * @param {Object} wizard - { goal, daysPerWeek, sessionMinutes, equipment, experience, blacklist }
 * @param {Array} workoutHistory - kullanicinin gercek gecmisi
 * @returns {{ program, notes }} — program savedAiProgram formatinda
 */
export function generateProgram(wizard, workoutHistory = []) {
    const {
        goal = 'hypertrophy',
        daysPerWeek = 3,
        sessionMinutes = 60,
        equipment = 'gym',
        experience = 'intermediate',
        blacklist = []
    } = wizard;

    const days = Math.max(2, Math.min(6, parseInt(daysPerWeek) || 3));
    const split = SPLITS[days] || SPLITS[3];
    const scheme = GOAL_SCHEMES[goal] || GOAL_SCHEMES.hypertrophy;

    // Kullanicinin gecmisTE en cok yaptigi hareketler (sevdigi hareketler one cikar)
    const freq = {};
    workoutHistory.forEach(w => { if (w?.exercise) freq[w.exercise] = (freq[w.exercise] || 0) + 1; });

    // Ihmal edilen bolge: fazladan 1 set ekstra hak
    const neglected = neglectedGroups(workoutHistory, 7, 3);
    const neglectedSet = new Set(neglected.map(n => n.group));

// Kara liste: sihirbazdan kas grubu ID'si ('chest', 'legs'...) veya
// hareket adi gelebilir. Hareket adini POOL anahtari uzerinden kas
// grubuna esleyip kontrol eder.
const exerciseToGroups = {};
Object.entries(POOL).forEach(([g, entry]) => {
    [...entry.compound, ...entry.isolation].forEach(name => {
        (exerciseToGroups[name] = exerciseToGroups[name] || []).push(g);
    });
});
// Ikincil grup eslesmeleri: hareketin POOL'daki ana grubu disinda
// anlamli olcude yuklendigi bolgeler (agri oradaysa hareket girmez)
const SECONDARY_GROUPS = {
    'Close Grip Bench Press': ['chest'],   // triseps ana, gogus ikincil
    'Dips': ['chest'],                     // triseps/gogus cift yonlu
    'Romanian Deadlift': ['back'],         // legs ana, arka zincir ikincil
    'Hip Thrust': ['back']                 // glutes ana, arka zincir ikincil
};
Object.entries(SECONDARY_GROUPS).forEach(([name, groups]) => {
    if (exerciseToGroups[name]) exerciseToGroups[name].push(...groups);
});
const blSet = new Set(blacklist.map(b => String(b).toLowerCase()));
const isBlacklisted = (name) => {
    if (blSet.has(String(name).toLowerCase())) return true;
    const groups = exerciseToGroups[name];
    return !!groups && groups.some(g => blSet.has(g.toLowerCase()));
};

    // Hareket secici: havuzdan, kara liste disi, tanidik oncelikli.
    // compoundCount/isoCount GUN BASINA toplam hedeftir — gruplar arasi
    // round-robin dengeli dagitilir (bir gun 14 hareket yigilmasin).
    const pickExercises = (groups, compoundCount, isoCount, globalUsed) => {
        const picked = [];
        // Program geneli cesitlilik: ayni hareket iki gunde tekrarlanmasin
        const usedNames = globalUsed || new Set();

        // Grup bazli aday listeleri (compound oncelik sirali)
        const queues = groups
            .filter(g => POOL[g])
            .map(g => ({
                group: g,
                compound: [...POOL[g].compound].sort((a, b) => (freq[b] || 0) - (freq[a] || 0)),
                iso: [...POOL[g].isolation]
            }));

        // Round 1: compound'lari gruplar arasi donerek dagit
        let cTotal = 0;
        let progressed = true;
        while (cTotal < compoundCount && progressed) {
            progressed = false;
            for (const q of queues) {
                if (cTotal >= compoundCount) break;
                while (q.compound.length > 0) {
                    const name = q.compound.shift();
                    const finalName = equipment === 'home' && HOME_ALT[name] ? HOME_ALT[name] : name;
                    if (usedNames.has(finalName) || isBlacklisted(finalName)) continue;
                    picked.push({ name: finalName, kind: 'compound', group: q.group });
                    usedNames.add(finalName);
                    cTotal++;
                    progressed = true;
                    break;
                }
            }
        }

        // Round 2: izolasyonlari ayni sekilde dagit
        let iTotal = picked.length;
        progressed = true;
        const target = compoundCount + isoCount;
        while (iTotal < target && progressed) {
            progressed = false;
            for (const q of queues) {
                if (iTotal >= target) break;
                while (q.iso.length > 0) {
                    const name = q.iso.shift();
                    if (usedNames.has(name) || isBlacklisted(name)) continue;
                    picked.push({ name, kind: 'isolation', group: q.group });
                    usedNames.add(name);
                    iTotal++;
                    progressed = true;
                    break;
                }
            }
        }

        return picked;
    };


    // Gun basina hareket sayisi: sureye gore (60 dk ~ 5-6 hareket)
    const perDayExercises = sessionMinutes >= 75 ? 6 : sessionMinutes >= 60 ? 5 : 4;

    // Agirlik onerisi: gecmiste varsa nextLoadSuggestion, yoksa bos (kullanici doldurur)
    const suggestWeight = (exerciseName) => {
        const s = nextLoadSuggestion(exerciseName, workoutHistory);
        if (!s) return '';
        // sadece mantikli turler
        if (s.kind === 'backoff' || s.kind === 'weight') return String(Math.round(s.targetWeight * 10) / 10);
        // reps artisi durumunda mevcut agirlik
        const last = workoutHistory.find(w => w?.exercise === exerciseName);
        if (last?.maxWeight) return String(parseFloat(last.maxWeight));
        return '';
    };

    // Tum program boyunca kullanilan hareketler (A/B gunleri ayni hareketleri tekrar etmesin)
    const programWideUsed = new Set();
    const programDays = split.map((day) => {
        const groups = day.focus;
        const nCompound = Math.max(2, Math.ceil(perDayExercises * 0.55));
        const nIso = perDayExercises - nCompound;
        let picked = pickExercises(groups, nCompound, nIso, programWideUsed);

        // Cok az hareket secildiyse tampon (havuz bos kaldıysa core/calves ekle)
        if (picked.length < perDayExercises) {
            ['core', 'calves', 'forearms'].forEach(g => {
                if (picked.length >= perDayExercises) return;
                POOL[g].isolation.forEach(name => {
                    if (picked.length >= perDayExercises) return;
                    if (!picked.some(p => p.name === name) && !isBlacklisted(name) && !programWideUsed.has(name)) {
                        picked.push({ name, kind: 'isolation', group: g });
                        programWideUsed.add(name);
                    }
                });
            });
        }

        return {
            dayName: day.dayName,
            focus: groups.join(', '),
            exercises: picked.map(p => {
                const s = p.kind === 'compound' ? scheme.compound : scheme.isolation;
                // Ihmal edilen gruba +1 set (telafi hacmi)
                let sets = s.sets;
                if (neglectedSet.has(p.group)) sets += 1;
                return {
                    name: p.name,
                    sets: String(sets),
                    reps: s.reps,
                    weight: suggestWeight(p.name),
                    rest: String(s.rest)
                };
            })
        };
    });

    // Periyodizasyon notlari (gorsel programda gosterilir)
    const notes = [];
    if (experience === 'beginner') {
        notes.push('lineer_progression');
    } else {
        notes.push('dup_progression');
    }
    if (days >= 5) notes.push('watch_recovery');
    if (neglected.length > 0) notes.push('neglected_boost:' + neglected.map(n => n.group).join(','));
    if (equipment === 'home') notes.push('home_setup');

    const program = {
        name: `${goal === 'strength' ? 'Güç' : goal === 'endurance' ? 'Dayanıklılık' : 'Hypertrophy'} · ${days} Gün`,
        days: programDays,
        isAiGenerated: true,
        isCoachGenerated: true,
        createdAt: new Date().toISOString(),
        cycle: { loadWeeks: 4, deloadWeek: 5 }
    };

    return { program, notes };
}

/**
 * Deload haftasi varyanti: ayni program, setler %60'a dusurulur.
 */
export function makeDeloadWeek(program) {
    if (!program || !program.days) return program;
    const clone = JSON.parse(JSON.stringify(program));
    clone.name = (clone.name || 'Program') + ' — Deload';
    clone.isDeload = true;
    clone.days.forEach(d => {
        (d.exercises || []).forEach(ex => {
            const s = parseInt(ex.sets) || 3;
            ex.sets = String(Math.max(2, Math.round(s * 0.6)));
            if (ex.weight) {
                const w = parseFloat(ex.weight);
                if (!isNaN(w) && w > 0) ex.weight = String(Math.round(w * 0.9 * 10) / 10);
            }
        });
    });
    return clone;
}
