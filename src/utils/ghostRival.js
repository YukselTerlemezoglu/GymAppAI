// HAYALET RAKIP (Faz 5d) — gecen seansin set/set performansiyla duselme.
// Aktif antrenmanda her setin yaninda "hayalet" (gecen seansin ayni
// numarali seti) gosterilir; e1RM yaklasimiyla kazanma/kaybetme hesaplanir.

const e1rmApprox = (w, r) => (w > 0 && r > 0) ? w * (1 + r / 30) : 0;

/**
 * Hareketin gecen seans setlerini dondurur (hayalet).
 * Oncelik: kayitli setLogs (set set veri); yoksa maxWeight/bestReps'ten
 * turetilmis esit setler. Uygun veri yoksa null.
 * @param {string} exerciseName
 * @param {Array} workoutHistory
 * @returns {{weight:number, reps:number}[]|null}
 */
export function getGhostSets(exerciseName, history) {
    if (!exerciseName || !Array.isArray(history)) return null;
    const entry = history.find(w => w && w.exercise === exerciseName);
    if (!entry) return null;

    if (Array.isArray(entry.setLogs) && entry.setLogs.length > 0) {
        const sets = entry.setLogs
            .map(s => ({ weight: parseFloat(s?.weight) || 0, reps: parseInt(s?.reps) || 0 }))
            .filter(s => s.weight > 0 && s.reps > 0);
        if (sets.length > 0) return sets;
    }

    // Fallback: en iyi setten turet (kayitli set set veri yokken)
    const setCount = parseInt(entry.sets) || 1;
    const w = parseFloat(entry.maxWeight) || 0;
    const r = parseInt(entry.bestReps) || 0;
    if (w <= 0 || r <= 0) return null;
    return Array.from({ length: setCount }).map(() => ({ weight: w, reps: r }));
}

/**
 * Tek set karsilastirmasi — e1RM yaklasimi (%0.5 tolerans esitlik).
 * @returns {'win'|'lose'|'tie'|null} gecerli veri yoksa null
 */
export function compareSetToGhost(curWeight, curReps, ghostSet) {
    if (!ghostSet) return null;
    const cur = e1rmApprox(parseFloat(curWeight) || 0, parseInt(curReps) || 0);
    if (cur <= 0) return null;
    const gh = e1rmApprox(ghostSet.weight, ghostSet.reps);
    if (gh <= 0) return null;
    if (cur > gh * 1.005) return 'win';
    if (cur < gh * 0.995) return 'lose';
    return 'tie';
}

/**
 * Hareket bazli skor: karsilastirilabilir setlerde kim kac set aldi.
 * @param {Array} currentSets - aktif set loglari ({weight, reps, completed})
 * @param {{weight,reps}[]|null} ghostSets
 * @param {boolean} trackingMode - true: sadece isaretlenen setler sayilir
 * @returns {{you:number, ghost:number, pending:number}|null}
 */
export function ghostScore(currentSets, ghostSets, trackingMode) {
    if (!ghostSets || !Array.isArray(currentSets)) return null;
    let you = 0, ghost = 0, pending = 0;
    currentSets.forEach((s, i) => {
        if (trackingMode && !s.completed) return;
        const res = compareSetToGhost(s.weight, s.reps, ghostSets[i]);
        if (res === 'win') you++;
        else if (res === 'lose') ghost++;
        else if (res === 'tie') { you += 0.5; ghost += 0.5; }
        else pending++;
    });
    return { you, ghost, pending };
}
