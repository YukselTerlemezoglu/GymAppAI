// Superset zincir yardimcilari ActiveWorkoutView ve CustomProgramBuilder
// arasinda paylasilan saf fonksiyonlar.

/**
 * Bir egzersizin dahil oldugu superset zincirini index listesi olarak dondurur.
 * Zincir ardisik satirlardan olusur; satir i>0 ve exercises[i].supersetWithPrev ise
 * onceki satirla baglidir. Ornek: [E1, E2(link), E3(link)] -> [0,1,2];
 * [E1, E2(link), E3] -> eIdx 0/1 icin [0,1], eIdx 2 icin [2].
 */
export function getSupersetChain(dayParams, eIdx) {
    const exercises = dayParams?.exercises || [];
    if (eIdx < 0 || eIdx >= exercises.length) return [];
    let start = eIdx;
    while (start > 0 && exercises[start]?.supersetWithPrev) start--;
    let end = eIdx;
    while (end + 1 < exercises.length && exercises[end + 1]?.supersetWithPrev) end++;
    const chain = [];
    for (let i = start; i <= end; i++) chain.push(i);
    return chain;
}

/**
 * Superset rozet numarasi A1, A2, ... zincir icindeki sirani hesaplar.
 */
export function supersetPairIndex(exercises, idx) {
    let n = 1;
    for (let i = 1; i <= idx; i++) {
        if (exercises[i]?.supersetWithPrev) n++;
        else n = 1;
    }
    return n;
}