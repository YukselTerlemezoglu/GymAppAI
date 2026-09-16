// BU DOSYA OTOMATIK URETILDI - scripts/fetch-wger.mjs tarafindan.
// Kaynak: wger.de acik kaynak egzersiz DB (AGPL-3.0 lisansi, https://wger.de)
// 892 hareket; isimler Ingilizce (kullanici tercihi), wger kategori/kas
// bilgileriyle birlikte.
//
// ONEMLI: 190KB'lik JSON ana bundle'i sisirmesin diye DINAMIK import
// edilir (kullanildigi anda yuklenir). Statik import YAPILMAZ.
//
// Guncellemek icin: node scripts/fetch-wger.mjs  (ciktiyi src/data'ya kopyala)

// wger kategori -> uygulamamizin kas grup ID'leri
const CATEGORY_MAP = {
    'Abs': 'core',
    'Arms': 'biceps', // biceps/triceps karisik; findMuscleGroupIdForExercise inceltir
    'Back': 'back',
    'Calves': 'calves',
    'Chest': 'chest',
    'Forearms': 'forearms',
    'Glutes': 'glutes',
    'Legs': 'legs',
    'Shoulders': 'shoulders'
};

// Kas adindan grup ID (wger muscles listesinden inceltme)
const MUSCLE_MAP = {
    'Biceps brachii': 'biceps',
    'Biceps femoris': 'legs',
    'Brachialis': 'biceps',
    'Brachioradialis': 'forearms',
    'Deltoids': 'shoulders',
    'Gastrocnemius': 'calves',
    'Gluteus maximus': 'glutes',
    'Latissimus dorsi': 'back',
    'Pectoralis major': 'chest',
    'Quadriceps femoris': 'legs',
    'Rectus abdominis': 'core',
    'Soleus': 'calves',
    'Trapezius': 'back',
    'Triceps brachii': 'triceps'
};

/** wger kaydini uygulamamizin satir formatina cevirir. */
export function toAppExercise(w) {
    const mg = (w.muscles && w.muscles.length && MUSCLE_MAP[w.muscles[0]])
        || CATEGORY_MAP[w.category]
        || null;
    return {
        wgerId: w.wgerId,
        name: w.name,
        name_en: w.name,
        muscleGroupId: mg,
        equipment: (w.equipment || []).join(', ') || null,
        equipment_en: (w.equipment || []).join(', ') || null,
        videos: w.videos || []
    };
}

let _cache = null;

/**
 * wger katalogunu DINAMIK yukler (tek sefer cache'lenir).
 * Cagiranlar: await loadWgerExercises()
 */
export async function loadWgerExercises() {
    if (_cache) return _cache;
    const data = await import('./wger-exercises.json');
    _cache = (data.default || data).map(toAppExercise);
    _byGroup = buildGroupIndex(_cache);
    return _cache;
}

/** Senkron erisim: onceden yuklenmisse dondurur, yoksa bos dizi. */
export function getWgerExercisesSync() {
    return _cache || [];
}

/**
 * Kas grubu bazli index: grup ID -> o kasin wger hareketleri.
 * Anatomi sayfasi bu index ile "ozel 5 hareket + katalog" birlesik
 * liste gosterir. Load sonrasi bir kez kurulur, sonraki secimler O(1).
 */
let _byGroup = null;

export function getWgerByMuscleGroup(groupId) {
    if (!_byGroup) return [];
    return _byGroup[groupId] || [];
}

function buildGroupIndex(list) {
    const idx = {};
    list.forEach((ex) => {
        if (!ex.muscleGroupId) return;
        (idx[ex.muscleGroupId] = idx[ex.muscleGroupId] || []).push(ex);
    });
    return idx;
}
