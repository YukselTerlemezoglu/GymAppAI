export const exerciseMuscleMap = {
    // Chest
    bench: ['chest', 'front-deltoids', 'triceps'],
    'bench press': ['chest', 'front-deltoids', 'triceps'],
    'incline bench': ['chest', 'front-deltoids', 'triceps'],
    fly: ['chest'],
    pushup: ['chest', 'triceps', 'front-deltoids'],
    'push up': ['chest', 'triceps', 'front-deltoids'],
    dips: ['chest', 'triceps'],

    // Back
    deadlift: ['lower-back', 'hamstring', 'gluteal', 'trapezius'],
    pullup: ['latissimus-dorsi', 'biceps', 'upper-back'],
    'pull up': ['latissimus-dorsi', 'biceps', 'upper-back'],
    row: ['latissimus-dorsi', 'upper-back', 'biceps'],
    lat: ['latissimus-dorsi'],

    // Legs
    squat: ['quadriceps', 'gluteal', 'hamstring', 'calves'],
    leg: ['quadriceps', 'hamstring', 'calves'],
    lunge: ['quadriceps', 'gluteal', 'hamstring'],
    calf: ['calves'],

    // Shoulders
    overhead: ['front-deltoids', 'back-deltoids', 'triceps'],
    shoulder: ['front-deltoids', 'back-deltoids'],
    lateral: ['front-deltoids', 'back-deltoids'],
    raise: ['front-deltoids'],

    // Arms
    curl: ['biceps', 'forearm'],
    bicep: ['biceps'],
    tricep: ['triceps'],
    extension: ['triceps'],

    // Core
    crunch: ['abs'],
    plank: ['abs', 'obliques'],
    situp: ['abs'],
    ab: ['abs']
};

export const getMusclesForExercises = (workouts) => {
    const activeMuscles = new Set();

    if (!workouts || workouts.length === 0) return [];

    // Sadece bugünün antrenmanlarını filtrele
    const today = new Date().toDateString();
    const todaysWorkouts = workouts.filter(w => {
        if (!w || !w.date) return false;
        return new Date(w.date).toDateString() === today;
    });

    todaysWorkouts.forEach(workout => {
        if (!workout || !workout.exercise) return;
        if (typeof workout.exercise !== 'string') return;

        const exNameStr = workout.exercise.toLowerCase();

        // Kelimeleri map'te ara (Örneğin "Incline Bench Press" -> "bench" kelimesini yakalayacak)
        Object.keys(exerciseMuscleMap).forEach(key => {
            if (exNameStr.includes(key)) {
                exerciseMuscleMap[key].forEach(muscle => activeMuscles.add(muscle));
            }
        });
    });

    return Array.from(activeMuscles);
};
