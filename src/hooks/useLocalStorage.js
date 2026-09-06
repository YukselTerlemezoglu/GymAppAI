import { useState, useEffect, useCallback, useRef } from 'react';
import { warn as logWarn } from '../utils/logger';

const DB_NAME = 'gymapp_storage';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';

// Singleton DB bağlantısı
let dbInstance = null;
const getDB = () => {
    if (dbInstance) return Promise.resolve(dbInstance);
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };
        request.onerror = (event) => reject(event.target.error);
    });
};

const idbGet = async (key) => {
    try {
        const db = await getDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(undefined);
        });
    } catch { return undefined; }
};

const idbSet = async (key, value) => {
    try {
        const db = await getDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    } catch { /* sessiz hata */ }
};

// --- GLOBAL HIDRASYON SINYALI ---
// Tum useLocalStorage ornekleri IDB okumalarini bitirince bir kez ateşlenir
// ve bir daha sönilmez (latch). App.jsx'teki tek seferlik migrasyon/sezon
// efektleri bu sinyali bekleyerek hidrasyon oncesi eski deger yazmayı önler.
const pendingHydrations = new Set();
const hydrationSubs = new Set();
let allHydrated = false;

function notifyHydration() {
    if (!allHydrated && pendingHydrations.size === 0) {
        allHydrated = true;
        hydrationSubs.forEach((fn) => fn());
    }
}

export function useAllStorageHydrated() {
    const [hydrated, setHydrated] = useState(allHydrated);
    useEffect(() => {
        const fn = () => setHydrated(true);
        hydrationSubs.add(fn);
        // Latch zaten atmissa initializer yakalamistir; abonelik yine de
        // kayitli (bu noktada tekrar atmasi soz konusu degil — latch'tir).
        return () => hydrationSubs.delete(fn);
    }, []);
    return hydrated;
}

function useLocalStorage(key, initialValue) {
    // İlk render: LocalStorage'dan senkron oku (ekranın hemen dolması için)
    const [storedValue, setStoredValue] = useState(() => {
        try {
            if (typeof window === 'undefined') return initialValue;
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            logWarn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Hidrasyon oncesi yazmalar kuyruga alinir; IDB degeri geldikten sonra
    // kuyruk IDB tabani uzerinden yeniden oynanir. Aksi halde mount anindaki
    // efekt yazmalari (migrasyon, rozet acma) IDB'deki eski degerle ezilir.
    const pendingWrites = useRef([]);
    const hydratedRef = useRef(false);
    const initialRef = useRef(initialValue);

    // Uygulama açıldığında IndexedDB'den oku ve varsa state'i güncelle
    useEffect(() => {
        let cancelled = false;
        pendingHydrations.add(key);
        idbGet(key).then((idbValue) => {
            if (cancelled) return;
            let base = idbValue;
            if (idbValue !== undefined) {
                try { window.localStorage.setItem(key, JSON.stringify(idbValue)); } catch { /* kota */ }
            }
            if (pendingWrites.current.length > 0) {
                // Kuyrugu IDB degeri uzerinden yeniden oynat
                base = pendingWrites.current.reduce((acc, apply) => apply(acc), base);
                if (base === undefined) base = initialRef.current;
                setStoredValue(base);
                try { window.localStorage.setItem(key, JSON.stringify(base)); } catch { /* kota */ }
                idbSet(key, base);
            } else if (idbValue !== undefined) {
                setStoredValue(idbValue);
            }
            pendingWrites.current = [];
            hydratedRef.current = true;
            pendingHydrations.delete(key);
            notifyHydration();
        });
        return () => { cancelled = true; };
    }, [key]);

    // Dis kaynakli guncellemeler: MobilityView/HiitTimerView gibi bilesenler
    // isaretleri dogrudan localStorage'a yazar. Ayni sekmede native storage
    // event tetiklenmedigi icin ozel bir event kullanilir. Buluttan cekilen
    // (pull) veriler de bu yolla gelir: IDB de guncellenir ki hidrasyonda
    // eski deger geri gelmesin.
    useEffect(() => {
        const onExternal = () => {
            try {
                const item = window.localStorage.getItem(key);
                const next = item === null ? initialRef.current : JSON.parse(item);
                if (!hydratedRef.current) {
                    // Hidrasyon henuz bitmedi: dogrudan yazarsak sırada bekleyen
                    // idbGet bu degeri eski IDB verisiyle geri ezer. Sabit
                    // deger olarak kuyruga al, hidrasyon uzerinden uygula.
                    pendingWrites.current.push(() => next);
                    return;
                }
                setStoredValue(next);
                // IDB'yi de esitle (tek dogru kaynak olmaya devam etsin)
                idbSet(key, next);
            } catch { /* bozuk JSON: dokunma */ }
        };
        window.addEventListener('gymapp-storage', onExternal);
        return () => window.removeEventListener('gymapp-storage', onExternal);
    }, [key]);

    // En son yazilan degeri ref'te tut: setter artik saf (yan etkisiz) ve
    // yan etkiler callback govdesinde calisir. React updater'lari (StrictMode
    // dahil) birden fazla calistirilabilir; safligini korumak cift yazma /
    // cift kuyruk eklemeyi onler.
    const latestRef = useRef(storedValue);
    useEffect(() => { latestRef.current = storedValue; }, [storedValue]);

    // Setter: hem IndexedDB hem LocalStorage'a yaz
    const setValue = useCallback((value) => {
        //Updater SAFTIR: sadece yeni degeri hesaplar, yan etkisi yoktur.
        const valueToStore = (() => {
            try {
                return value instanceof Function ? value(latestRef.current) : value;
            } catch (error) {
                logWarn(`Error computing value for key "${key}":`, error);
                return latestRef.current;
            }
        })();
        latestRef.current = valueToStore;
        setStoredValue(valueToStore);
        // --- Yan etkiler (updater disinda, call basina tam bir kez) ---
        // LocalStorage'a senkron yaz (hızlı okuma için cache)
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            logWarn(`Error setting localStorage key "${key}":`, error);
        }
        if (hydratedRef.current) {
            // IndexedDB'ye asenkron yaz (ana depolama)
            idbSet(key, valueToStore);
        } else {
            // Hidrasyon bekleniyor: uygulanabilir fonksiyon kuyruga alinir
            pendingWrites.current.push((base) => valueToStore === undefined ? base : valueToStore);
        }
    }, [key]);

    return [storedValue, setValue];
}

export const GYM_APP_KEY_PREFIX = 'gym_app_';

/*
 * GERCEK HARD RESET: hem localStorage hem IndexedDB'deki tum gym_app_*
 * verilerini siler. Promise dondurur; cagiran taraf await etmeli.
 * Dil tercihi (gym_app_lang) korunur.
 */
export async function clearAllGymAppStorage() {
    // 1. localStorage
    try {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && key.startsWith(GYM_APP_KEY_PREFIX)) keysToRemove.push(key);
        }
        keysToRemove.forEach(k => window.localStorage.removeItem(k));
        if (!window.localStorage.getItem('gym_app_lang')) {
            window.localStorage.setItem('gym_app_lang', 'tr');
        }
    } catch { /* erisim engellense bile devam */ }

    // 2. IndexedDB (birincil depo - burasi silinmezse veriler geri gelir!)
    try {
        const db = await getDB();
        await new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            tx.oncomplete = () => resolve();
        });
    } catch { /* DB yoksa sessizce gec */ }
}

export default useLocalStorage;

