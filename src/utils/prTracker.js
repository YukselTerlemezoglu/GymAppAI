// PR (Kisisel Rekor) tespiti ve Progressive Overload onerileri.
// Epley formulu ile tahmini 1 tekrar maksimum (e1RM) hesaplanir:
// e1RM = kilo * (1 + tekrar / 30)

export const estimate1RM = (weight, reps) => {
  const w = parseFloat(weight) || 0;
  const r = parseInt(reps) || 0;
  if (w <= 0 || r <= 0) return 0;
  return w * (1 + r / 30);
};

// Bir egzersizin gecmisteki en iyi e1RM setini bulur.
export const getBestSet = (exerciseName, history) => {
  if (!exerciseName || !Array.isArray(history)) return null;
  let best = null;
  history.forEach(w => {
    if (!w || w.exercise !== exerciseName) return;
    const e1rm = estimate1RM(w.maxWeight, w.bestReps);
    if (e1rm > 0 && (!best || e1rm > best.e1rm)) {
      best = { date: w.date, weight: w.maxWeight, reps: w.bestReps, e1rm };
    }
  });
  return best;
};

// Egzersizin gecmisteki en yuksek kilolu setini bulur (agirlik PR'i icin).
export const getMaxWeightSet = (exerciseName, history) => {
  if (!exerciseName || !Array.isArray(history)) return null;
  let best = null;
  history.forEach(w => {
    if (!w || w.exercise !== exerciseName) return;
    const wgt = parseFloat(w.maxWeight) || 0;
    if (wgt > 0 && (!best || wgt > best.weight)) {
      best = { date: w.date, weight: wgt, reps: w.bestReps };
    }
  });
  return best;
};

/**
 * Yeni kaydedilecek antrenmanlari gecmisle karsilastirip PR listesi uretir.
 * PR turleri:
 *  - 'first': Ilk kayit (bilgi amacli)
 *  - 'e1rm': Tahmini 1RM rekoru (en kapsayici guc gostergesi)
 *  - 'weight': Ayni egzersizde en yuksek kilo
 */
export const detectPRs = (newWorkouts, history) => {
  if (!Array.isArray(newWorkouts) || newWorkouts.length === 0) return [];
  const prs = [];

  // Ayni egzersizin yeni kayitlarini en iyi sete indir (tek seferde tek PR)
  const merged = new Map();
  newWorkouts.forEach(w => {
    if (!w || !w.exercise) return;
    const e1rm = estimate1RM(w.maxWeight, w.bestReps);
    if (e1rm <= 0) return;
    const prev = merged.get(w.exercise);
    if (!prev || e1rm > prev.e1rm) {
      merged.set(w.exercise, { exercise: w.exercise, weight: w.maxWeight, reps: w.bestReps, e1rm });
    }
  });

  merged.forEach(m => {
    const pastBest = getBestSet(m.exercise, history);
    const pastMaxW = getMaxWeightSet(m.exercise, history);

    let pr = null;
    if (!pastBest) {
      pr = { ...m, type: 'first', prevBest: null };
    } else if (m.e1rm > pastBest.e1rm * 1.005) { // %0.5 tolerans ustu gercek artis
      pr = { ...m, type: 'e1rm', prevBest: pastBest };
    } else if (pastMaxW && m.weight > pastMaxW.weight) {
      pr = { ...m, type: 'weight', prevBest: pastMaxW };
    }

    if (pr) prs.push(pr);
  });

  return prs;
};

/**
 * Progressive overload onerisi uretir.
 * Gecmisteki en iyi sete gore bir sonraki hedefi hesaplar:
 *  - Ayni kiloda +1 tekrar, veya
 *  - Ust sinir tekrara ulasildiysa +2.5 kg
 */
export const getOverloadSuggestion = (exerciseName, history) => {
  const best = getBestSet(exerciseName, history);
  if (!best) return null;

  const topReps = 12; // Bu tekrarin ustunde agirlik artirmak daha verimli
  const roundTo2_5 = (n) => Math.round(n / 2.5) * 2.5;

  if (best.reps >= topReps) {
    const nextW = Math.max(2.5, roundTo2_5(best.weight + 2.5));
    return { kind: 'weight', from: best, targetWeight: nextW, targetReps: Math.max(6, best.reps - 4) };
  }
  return { kind: 'reps', from: best, targetWeight: best.weight, targetReps: best.reps + 1 };
};

/**
 * Bir egzersizin son N seanstaki performansini listeler.
 * Her seans: { date, weight, reps, sets, e1rm } — en iyi sete (e1RM) gore.
 * Tarih sirasina gore yeniden eskiye dondurur.
 */
export const getExerciseHistory = (exerciseName, history, limit = 5) => {
  if (!exerciseName || !Array.isArray(history)) return [];
  const sessions = [];
  history.forEach(w => {
    if (!w || w.exercise !== exerciseName) return;
    const e1rm = estimate1RM(w.maxWeight, w.bestReps);
    if (e1rm <= 0) return;
    sessions.push({
      date: w.date,
      weight: parseFloat(w.maxWeight) || 0,
      reps: parseInt(w.bestReps) || 0,
      sets: parseInt(w.sets) || 0,
      e1rm
    });
  });
  // Guncel en iyi seans once
  sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  return sessions.slice(0, limit);
};
