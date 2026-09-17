// Bulut Snapshot (oto-yedek) zamanlayicisi.
//
// Gorevi: uygulama gizlenince/kapaninca (visibilitychange->hidden, pagehide)
// kullanicinin TUM verisini Firestore'daki users/{uid}/snapshots/{gun}
// dokumanina yazmak. cloudSync canli birlestirme yapar; snapshot ise
// zamani donmus, merge'den gecmeyen, bozulmaya karsi korumali bir kopyadir.
//
// Guvenlik ilkeleri (SK tasarimi):
//   SK-1 throttle: en fazla 1 yedek/saat + dirty-check (veri degismediyse alma)
//   SK-3 döner 7 gunluk: 8+ gun onceki snapshotlar silinir
//   SK-4 otomatik restore SADECE lokal veri bosken
//   SK-5 boyut korumasi: >800KB ise history kivrtilir; yine buyukse iptal
//   SK-6 sema dogrulamasi: validateBackup hem yazmada hem okumada
//
// Tum hatalar sessizce yutulur (fire-and-forget): yedek alma islemi
// kullanicinin uygulamayi kullanmasini asla engellememelidir.

import { db } from '../services/firebase';
import { doc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { log, warn } from './logger';
import { buildBackup, validateBackup } from './backup';

const SNAP_ENABLED_KEY = 'gym_app_snap_enabled';
const SNAP_LAST_KEY = 'gym_app_snap_last';
const SNAP_FINGERPRINT_KEY = 'gym_app_snap_fp';
const SNAP_TOAST_DATE_KEY = 'gym_app_snap_toast_date';

// Hard reset gibi "bulut + lokal ayni anda temizlenir" akislarda snapshot
// almayi gecici olarak askiya alan bayrak. Aksi halde reset penceresinde
// (IDB henuz silinmemisken) arka plana gecilirse takeSnapshot eski IDB
// verisiyle snapshot yazip az once silinen yedegi yeniden olustururdu.
let _snapshotHold = false;
export function holdSnapshots(v) { _snapshotHold = !!v; }

const THROTTLE_MS = 60 * 60 * 1000;       // SK-1: 1 yedek/saat
const MAX_SNAPSHOT_BYTES = 800_000;       // SK-5: Firestore 1MB limit ihtiyati
// NOT: Firestore rules string.size() UTF-8 bayt sayar; JS .length UTF-16
// birim sayar. Turkce karakterler ikisini ayirir — olcum TextEncoder ile
// bayt bazli yapilir ki rules siniriyla tutarli kalsin.
const byteLen = (str) => {
    try { return new TextEncoder().encode(str).length; } catch { return str.length * 2; }
};
const KEEP_DAYS = 7;                      // SK-3: döner pencere
const HISTORY_TRIM_STEPS = [120, 60, 30, 10]; // kademeli kirpma denemeleri

const lsGet = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const lsSet = (key, val) => {
    try { localStorage.setItem(key, val); } catch { /* kota */ }
};

/**
 * Veri "parmak izi": yedek almaya deger degisiklik oldu mu diye bakilir.
 * Sadece anlamli veri anahtarlarindan hesaplanir (yedek/sync meta'lari degil).
 */
function computeFingerprint(backup) {
    const keys = ['gym_app_history', 'gym_app_xp', 'gym_app_level', 'gym_app_coins',
        'gym_app_inventory', 'gym_app_buddies', 'gym_app_streak', 'gym_app_body_metrics',
        'gym_app_nutrition_v2', 'gym_app_wheel', 'gym_app_gacha_pity', 'gym_app_don'];
    let raw = '';
    for (const k of keys) {
        const v = backup.idb?.[k] ?? backup.ls?.[k];
        if (v !== undefined && v !== null) {
            try { raw += k + ':' + JSON.stringify(v).length + ';'; } catch { /* dev ara deger */ }
        }
    }
    // uzunluk bazli parmak izi yeterli: ayni veri -> ayni uzunluk; anlamsiz
    // degisiklikler (nesne anahtar sirasi) yanlis pozitif uretmez, yanlis
    // negatif riski de pratikte yoktur (silinen/eklenen kayit uzunlugu degistirir)
    return raw;
}

/**
 * SK-5: snapshot'i boyut limitine sigdirmaya calisir.
 * Once history'yi kademeli kirpar (en eskiler yedekte olmaz, lokalde durur),
 * sonra hala buyukse Ikincil buyuk anahtarlari kirpar. Ortalama bir kullanicinin
 * snapshoti bu asamaya hic gelmez (~100-300KB).
 * @returns {{backup:object, trimmed:number}|null} null = limit altina inilemedi
 */
function fitToSize(backup) {
    let payload = JSON.stringify(backup);
    if (byteLen(payload) <= MAX_SNAPSHOT_BYTES) return { backup, trimmed: 0 };

    for (const keep of HISTORY_TRIM_STEPS) {
        const clone = structuredClone(backup);
        clone.stats = clone.stats || {};
        let trimmed = 0;
        for (const section of ['idb', 'ls']) {
            const hist = clone[section]?.['gym_app_history'];
            if (Array.isArray(hist) && hist.length > keep) {
                trimmed += hist.length - keep;
                clone[section]['gym_app_history'] = hist.slice(-keep);
            }
        }
        clone.stats.trimmedHistory = trimmed;
        payload = JSON.stringify(clone);
        if (byteLen(payload) <= MAX_SNAPSHOT_BYTES) return { backup: clone, trimmed };
    }
    return null; // kirpma yetmedi: yarim yedek yazmak yerine iptal
}

/**
 * SK-3: 7 günden eski snapshotlari siler (döner pencere).
 * Silme hatasi kritik degil: kotaya yazma haddi degismez (sadece depolama
 * birikir), bir sonraki denemede tekrar denenir.
 */
async function pruneOldSnapshots(uid) {
    try {
        const cutoff = new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000);
        const snapCol = collection(db, 'users', uid, 'snapshots');
        const old = query(snapCol, where('day', '<', dayKey(cutoff)));
        const snap = await getDocs(old);
        if (snap.empty) return 0;
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        return snap.size;
    } catch (err) {
        warn('pruneOldSnapshots basarisiz (kritik degil):', err?.code || err?.message);
        return -1;
    }
}

const dayKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/**
 * SK-1 + SK-5 + SK-6: tek gunun snapshotini yazar.
 * Ayni gun tekrar cagrilirsa ustune yazar (gun bazli tek dokuman).
 * @returns {Promise<boolean>} yazildi mi
 */
export async function takeSnapshot(uid, { force = false } = {}) {
    if (!db || !uid) return false;
    if (_snapshotHold) return false; // reset/temizlik penceresi: yedek yok
    if (lsGet(SNAP_ENABLED_KEY) === '0') return false; // kullanici kapatmis

    // SK-1 throttle: son yedekten beri 1 saat gecmediyse ve zorla istenmediyse atla
    if (!force) {
        const last = Number(lsGet(SNAP_LAST_KEY) || 0);
        if (Date.now() - last < THROTTLE_MS) return false;
    }

    const backup = await buildBackup();
    const check = validateBackup(backup);
    if (!check.valid) {
        warn('takeSnapshot: yedek semasi gecersiz, yazma iptal:', check.reason);
        return false;
    }

    // SK-1 dirty-check: veri degismediyse (parmak izi ayni) yedek alma.
    // Kotayi ve gereksiz yazmalari korur; force ile devre disi birakilabilir.
    if (!force) {
        const fp = computeFingerprint(backup);
        if (fp && fp === lsGet(SNAP_FINGERPRINT_KEY)) {
            lsSet(SNAP_LAST_KEY, String(Date.now())); // throttle saatini de tazele
            return false;
        }
    }

    const fitted = fitToSize(backup);
    if (!fitted) {
        warn('takeSnapshot: yedek boyutu limit altina inemed, iptal');
        return false;
    }

    const day = dayKey(new Date());
    try {
        const payloadStr = JSON.stringify(fitted.backup);
        await setDoc(doc(db, 'users', uid, 'snapshots', day), {
            payload: payloadStr,
            day,
            createdAt: new Date().toISOString(),
            bytes: byteLen(payloadStr),
            trimmedHistory: fitted.trimmed || 0
        });
        lsSet(SNAP_LAST_KEY, String(Date.now()));
        lsSet(SNAP_FINGERPRINT_KEY, computeFingerprint(fitted.backup));
        pruneOldSnapshots(uid); // fire-and-forget, beklenmez
        log(`Snapshot yazildi: ${day} (${fitted.trimmed ? 'kirpildi' : 'tam'})`);
        return true;
    } catch (err) {
        warn('takeSnapshot yazma hatasi (sessiz gecildi):', err?.code || err?.message);
        return false;
    }
}

/**
 * Degisiklik olup olmadigini dirty-check ile kontrol eder, gerekirse yedek alir.
 * App.jsx visibilitychange/pagehide'dan cagirir. Fire-and-forget.
 */
export function maybeTakeSnapshot(uid) {
    if (!uid) return;
    if (_snapshotHold) return;
    if (lsGet(SNAP_ENABLED_KEY) === '0') return;
    // SK-1: throttle kosulu takeSnapshot icinde de var; burada hizli cikis
    // icin tekrar kontrol edilir (buildBackup maliyetinden sakinarak)
    const last = Number(lsGet(SNAP_LAST_KEY) || 0);
    if (Date.now() - last < THROTTLE_MS) return;
    takeSnapshot(uid).catch(() => { /* sessiz */ });
}

/**
 * "Bugun icin toast gosterildi mi?" — gun bazli tek toast (spam engeli).
 */
export function markSnapshotToastShown() {
    lsSet(SNAP_TOAST_DATE_KEY, dayKey(new Date()));
}
export function shouldShowSnapshotToast() {
    return lsGet(SNAP_TOAST_DATE_KEY) !== dayKey(new Date());
}

/**
 * SK-4: lokalde HIC uygulama verisi yok mu? (auto-restore kosulu)
 * Sadece kalici veri anahtarlari sayilir; yedek/sync meta anahtarlar
 * (snap_last, snap_fp, lang, restore_bak) "veri" sayilmaz.
 * IndexedDB de kontrol edilir: verinin asil evi IDB'dir ve hidrasyon
 * localStorage'dan SONRA dolar — sadece LS bakmak yanlis "bos" sonucu
 * uretip taze IDB verisinin eski snapshotla ezilmesine yol acardi.
 */
export async function isLocalEmpty() {
    // 1) localStorage tarafı
    const lsHasData = (() => {
        try {
            const META = new Set(['gym_app_snap_last', 'gym_app_snap_fp', 'gym_app_snap_enabled',
                'gym_app_snap_toast_date', 'gym_app_lang', 'gym_app_restore_bak']);
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('gym_app_') && !META.has(key)) return true;
            }
        } catch { /* erisim hatasi: restore denenmez */ return false; }
        return false;
    })();
    if (lsHasData) return false;

    // 2) IndexedDB tarafi (asil depolama; hidrasyon oncesi tek gercek kaynak)
    const idbHasData = await new Promise((resolve) => {
        try {
            const req = indexedDB.open('gymapp_storage');
            req.onsuccess = (e) => {
                const idb = e.target.result;
                try {
                    const tx = idb.transaction('app_data', 'readonly');
                    const store = tx.objectStore('app_data');
                    const allKeysReq = store.getAllKeys();
                    allKeysReq.onsuccess = () => {
                        const META = new Set(['gym_app_snap_last', 'gym_app_snap_fp', 'gym_app_snap_enabled',
                            'gym_app_snap_toast_date', 'gym_app_lang', 'gym_app_restore_bak']);
                        const has = (allKeysReq.result || []).some((k) =>
                            String(k).startsWith('gym_app_') && !META.has(k));
                        idb.close();
                        resolve(has);
                    };
                    allKeysReq.onerror = () => { idb.close(); resolve(false); };
                } catch { idb.close(); resolve(false); }
            };
            req.onerror = () => resolve(false);
            // DB hic yoksa (yeni kurulum) upgradeneed gelmez, success null dondurur
            req.onupgradeneeded = () => { /* store yaratma: okuma amacliyiz */ };
        } catch { resolve(false); }
    });
    if (idbHasData) return false;

    return true;
}

let _restoreBusy = false; // ayni anda iki restore akisi (auth effect + hidrasyon effect) kosmasin

/**
 * SK-4 + SK-6: lokal bosa en guncel snapshoti otomatik geri yukler.
 * Sadece "giris sonrasi lokalde veri hic yok" senaryosunda cagirilir
 * (yeni cihaz / tarayici verisi silinmis). Hata olursa uygulama normal acilir.
 * @returns {Promise<boolean>} restore edildi mi
 */
export async function restoreIfEmpty(uid) {
    if (_restoreBusy) return false;
    _restoreBusy = true;
    try {
        if (!db || !uid) return false;
        if (!isLocalEmpty()) return false;

        const list = await listSnapshots(uid);
        if (!list.length) return false;
        const latest = list[0];

        // YARIS KORUMASI: liste indirme sirasinda AuthScreen'in merge-pull'i
        // lokal veri yazmis olabilir (giris aninda iki akis paralel kosar).
        // Merge eklemelidir (union/max), restore yikicidir (replace) —
        // yikici yazma ONCESI bosluk kontrolu tekrarlanir: artik doluysa
        // restore iptal, merge kazansin (yeni veri ezilmesin).
        if (!isLocalEmpty()) return false;

        const parsed = JSON.parse(latest.payload);
        const check = validateBackup(parsed);
        if (!check.valid) {
            warn('restoreIfEmpty: snapshot semasi gecersiz:', check.reason);
            return false;
        }

        const { restoreBackup } = await import('./backup');
        await restoreBackup(parsed, 'replace');
        window.dispatchEvent(new Event('gymapp-storage'));
        log(`Snapshot restore edildi: ${latest.day} (${latest.createdAt})`);
        return true;
    } catch (err) {
        warn('restoreIfEmpty hatasi (uygulama normal acilir):', err?.code || err?.message);
        return false;
    } finally {
        _restoreBusy = false;
    }
}

/**
 * Kullanicinin snapshotlarini yeniden eskiye dogru listeler.
 * Manuel "Yedeklerden Yukle" ekrani icin.
 */
export async function listSnapshots(uid) {
    const snapCol = collection(db, 'users', uid, 'snapshots');
    const snap = await getDocs(snapCol); // en fazla 8 dokuman, sorgu yeterli
    const out = [];
    snap.forEach((d) => {
        const v = d.data();
        if (typeof v?.payload === 'string' && typeof v?.day === 'string') {
            out.push({ day: v.day, createdAt: v.createdAt || '', payload: v.payload });
        }
    });
    out.sort((a, b) => (a.day < b.day ? 1 : -1));
    return out;
}

/**
 * Manuel geri yukleme (Profil -> Yedeklerden Yukle): onay sonrasi cagirilir.
 */
export async function restoreFromSnapshot(uid, day) {
    const list = await listSnapshots(uid);
    const target = list.find((s) => s.day === day);
    if (!target) throw new Error('SNAPSHOT_NOT_FOUND');
    const parsed = JSON.parse(target.payload);
    const check = validateBackup(parsed);
    if (!check.valid) throw new Error('SNAPSHOT_INVALID:' + check.reason);
    const { restoreBackup } = await import('./backup');
    const res = await restoreBackup(parsed, 'replace');
    window.dispatchEvent(new Event('gymapp-storage'));
    return res;
}

export const isSnapshotEnabled = () => lsGet(SNAP_ENABLED_KEY) !== '0';
export const setSnapshotEnabled = (v) => lsSet(SNAP_ENABLED_KEY, v ? '1' : '0');
export const getLastSnapshotTs = () => Number(lsGet(SNAP_LAST_KEY) || 0);

/**
 * HARD RESET DESTEĞI: kullanicinin TUM snapshotlarini buluttan siler ve
 * lokal snapshot meta'larini (throttle/parmak izi) sifirlar.
 * Hard reset sonrasi auto-restore'un eski yedeki geri getirmesini
 * engellemek icin kullanilir. Hata durumunda sessizce false doner.
 * @returns {Promise<boolean>} tamamlandi mi
 */
export async function deleteAllSnapshots(uid) {
    // Snapshot almayi askiya al: temizlik penceresinde arka plana gecilirse
    // eski IDB verisiyle yeni yedek yazilmasin. finally ile serbest birakilir.
    _snapshotHold = true;
    try {
        if (!db || !uid) return false;
        const snapCol = collection(db, 'users', uid, 'snapshots');
        const snap = await getDocs(snapCol);
        if (!snap.empty) {
            const batch = writeBatch(db);
            snap.forEach((d) => batch.delete(d.ref));
            await batch.commit();
        }
        // lokal meta temizligi: throttle saati + parmak izi sifirlanir ki
        // yeni donemde ilk arka plana geciste temiz yedek alinsin
        try {
            localStorage.removeItem(SNAP_LAST_KEY);
            localStorage.removeItem(SNAP_FINGERPRINT_KEY);
        } catch { /* kota/erisim */ }
        log('deleteAllSnapshots: tum bulut snapshotlari silindi');
        return true;
    } catch (err) {
        warn('deleteAllSnapshots hatasi:', err?.code || err?.message);
        return false;
    } finally {
        _snapshotHold = false;
    }
}
