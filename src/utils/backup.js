// Veri yedekleme / geri yukleme modulu.
// Export: tum gym_app_* anahtarlarini (localStorage + IndexedDB) tek JSON
// dosyasina toplar. Import: sema dogrulamasi + .bak guvenlik kopyasi ile
// geri yukler (birlestir veya degistir).
//
// Tarayici destegi: indirme Blob + a[download]; iOS Safari 15+ ve Android
// Chrome icin calisir. navigator.share varsa (iOS) once paylasim sayfasi
// denenir — dosyalar uygulamasina kaydetmek daha kolaydir.

const GYM_APP_KEY_PREFIX = 'gym_app_';
export const BACKUP_VERSION = 1;
const DB_NAME = 'gymapp_storage';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';

const openDB = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
        }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
});

const idbGetAll = async () => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const out = {};
            const req = store.openCursor(null, 'next');
            req.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (String(cursor.key) !== 'gym_app_restore_bak') {
                        out[cursor.key] = cursor.value;
                    }
                    cursor.continue();
                } else {
                    resolve(out);
                }
            };
            req.onerror = () => resolve(out);
        });
    } catch { return {}; }
};

const idbSetMany = async (entries) => {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        entries.forEach(([key, value]) => store.put(value, key));
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
    });
};

const collectLocalStorage = () => {
    const out = {};
    try {
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            // restore_bak haric tutulur: yedek dosyasina bayat geri-yukleme
            // anlik goruntusu sigmasin (geri yuklemede taze anlik goruntuyu ezmesin)
            if (key && key.startsWith(GYM_APP_KEY_PREFIX) && key !== 'gym_app_restore_bak') {
                try { out[key] = JSON.parse(window.localStorage.getItem(key)); } catch { /* bozuk JSON'i atla */ }
            }
        }
    } catch { /* erisim engellendi */ }
    return out;
};

/**
 * Tum uygulama verisini yedek objesine toplar.
 * @returns {Promise<{version:number, createdAt:string, app:string, ls:object, idb:object, stats:object}>}
 */
export async function buildBackup() {
    const ls = collectLocalStorage();
    const idb = await idbGetAll();
    const stats = {
        keys: Object.keys(ls).length + Object.keys(idb).length,
        workouts: (idb['gym_app_history'] || ls['gym_app_history'] || []).length,
        level: idb['gym_app_level'] ?? ls['gym_app_level'] ?? null,
        coins: idb['gym_app_coins'] ?? ls['gym_app_coins'] ?? null
    };
    return {
        version: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        app: 'GymAppAI',
        ls,
        idb,
        stats
    };
}

/**
 * Yedegi tarayiciya indirir. iOS'ta navigator.share (dosya) varsa once onu dener.
 * @returns {Promise<'downloaded'|'shared'|'failed'>}
 */
export async function downloadBackup() {
    const backup = await buildBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `gymapp-yedek-${dateStr}.json`;

    // iOS Safari: a[download] calismaz; Web Share API (dosya ile) calisir
    if (navigator.canShare?.({ files: [new File([blob], fileName, { type: 'application/json' })] })) {
        try {
            const file = new File([blob], fileName, { type: 'application/json' });
            await navigator.share({ files: [file], title: fileName });
            return 'shared';
        } catch (err) {
            if (err?.name === 'AbortError') return 'failed'; // kullanici vazgecti
            // diger hatalar: a[download] fallback
        }
    }

    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        return 'downloaded';
    } catch {
        return 'failed';
    }
}

/**
 * Yedek dosyasinin semasini dogrular. Bozuk/yanlis dosya veritabanini bozmasin.
 * @param {unknown} raw - JSON.parse edilmis obje
 * @returns {{valid:boolean, reason?:string, stats?:object}}
 */
export function validateBackup(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { valid: false, reason: 'format' };
    }
    if (raw.app !== 'GymAppAI') return { valid: false, reason: 'app' };
    if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) {
        return { valid: false, reason: 'version' };
    }
    if (typeof raw.ls !== 'object' || typeof raw.idb !== 'object' || raw.ls === null || raw.idb === null) {
        return { valid: false, reason: 'sections' };
    }
    const hasData = Object.keys(raw.ls).length > 0 || Object.keys(raw.idb).length > 0;
    if (!hasData) return { valid: false, reason: 'empty' };
    return { valid: true, stats: raw.stats };
}

/**
 * Mevcut verileri .bak anahtarina yazar (geri yukleme oncesi guvenlik kopyasi).
 */
export async function snapshotToBackupKeys() {
    const backup = await buildBackup();
    const str = JSON.stringify(backup);
    try { localStorage.setItem('gym_app_restore_bak', str); } catch { /* kota */ }
    try {
        const db = await openDB();
        await new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(str, 'gym_app_restore_bak');
            resolve();
        });
    } catch { /* DB yok */ }
}

/**
 * Dogrulanmis yedegi geri yukler.
 * @param {object} backup - validateBackup'ten gecen obje
 * @param {'merge'|'replace'} mode - merge: mevcutla birlestir (dosyadaki deger kazanir, eksik kalan korunur)
 *                                   replace: dosya disindaki her seyi sil
 * @returns {Promise<{restored:number, workouts:number}>}
 */
export async function restoreBackup(backup, mode = 'merge') {
    await snapshotToBackupKeys();

    if (mode === 'replace') {
        // gym_app_* anahtarlarini temizle (dil tercihi + restore anlik
        // goruntusu korunur — aksi halde geri alma noktasi silinirdi)
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && key.startsWith(GYM_APP_KEY_PREFIX) && key !== 'gym_app_lang' && key !== 'gym_app_restore_bak') keysToRemove.push(key);
        }
        keysToRemove.forEach(k => window.localStorage.removeItem(k));
        try {
            const db = await openDB();
            await new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.openCursor(null, 'next');
                req.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        if (String(cursor.key).startsWith(GYM_APP_KEY_PREFIX) && cursor.key !== 'gym_app_restore_bak') {
                            cursor.delete();
                        }
                        cursor.continue();
                    } else resolve();
                };
                req.onerror = () => resolve();
                tx.oncomplete = () => resolve();
            });
        } catch { /* DB yok */ }
    }

    // localStorage bolumu (restore_bak asla uzerine yazilmaz)
    let restored = 0;
    Object.entries(backup.ls || {}).forEach(([key, value]) => {
        if (key === 'gym_app_restore_bak') return;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            restored++;
        } catch { /* kota / bozuk deger atlanir */ }
    });

    // IndexedDB bolumu
    const idbEntries = Object.entries(backup.idb || {})
        .filter(([key]) => key.startsWith(GYM_APP_KEY_PREFIX) && key !== 'gym_app_restore_bak');
    if (idbEntries.length) await idbSetMany(idbEntries);
    restored += idbEntries.length;

    const history = (backup.idb?.['gym_app_history'] ?? backup.ls?.['gym_app_history']) || [];
    return { restored, workouts: Array.isArray(history) ? history.length : 0 };
}

/**
 * Son geri yukleme oncesi .bak anlik goruntusunu dondurur (geri alma).
 * localStorage'da yoksa IndexedDB'den okumayi dener (replace modu LS'i
 * temizlerken anahtar korunur, ancak eski surumlerden kalan durumlar icin).
 * @returns {Promise<object|null>} yedek objesi veya null
 */
export async function getRestoreSnapshot() {
    let str = null;
    try { str = window.localStorage.getItem('gym_app_restore_bak'); } catch { /* erisim */ }
    if (!str) {
        try {
            const db = await openDB();
            str = await new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get('gym_app_restore_bak');
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            });
        } catch { return null; }
    }
    if (!str) return null;
    try {
        const parsed = JSON.parse(str);
        return validateBackup(parsed).valid ? parsed : null;
    } catch { return null; }
}
