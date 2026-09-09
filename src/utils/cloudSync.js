import { db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { log, warn, error } from './logger';
import { persistToIdb as idbMirror } from '../hooks/useLocalStorage';

// Promise'i zaman aşımına uğratan yardımcı fonksiyon
const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Bağlantı zaman aşımına uğradı. İnternet bağlantınızı veya AdBlocker ayarlarınızı kontrol edin.")), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
};

// Senkronize edilecek tüm LocalStorage anahtarları
// EKONOMI BUTUNLUGU: coin dahil tum oyun ekonomisi (envanter, kozmetik,
// dostlar, pity, cark, DoN, gorevler) birlikte sync olur. Eksik anahtar
// ikinci cihazda "coin geldi ama satin alinanlar yok" durumu yaratirdi
// (coin duplikasyonu / item kaybi).
const LOCAL_STORAGE_KEYS = [
  'gym_app_body_metrics',
  'gym_app_history',
  'gym_app_last_date',
  'gym_app_streak',
  'gym_app_ai_program',
  'gym_app_xp',
  'gym_app_level',
  'gym_app_pinned_badges',
  'gym_app_unlocked_badges',
  'gym_app_completed_days',
  'gym_app_last_reset_date',
  'gym_app_coins',
  'gym_app_unlocked_themes',
  'gym_app_theme',
  'gym_app_user_name',
  'gym_app_nutrition_v2',
  'gym_app_prev_level',
  // --- ekonomi / envanter butunlugu ---
  'gym_app_inventory',
  'gym_app_cosmetics',
  'gym_app_cosmetics_active',
  'gym_app_buddies',
  'gym_app_buddy_active',
  'gym_app_gacha_pity',
  'gym_app_wheel',
  'gym_app_don',
  'gym_app_quests'
];

// Her anahtarin birlestirme stratejisi:
//   'lww'  : Last-Write-Wins — degisim zaman damgasi bilinemiyorsa sayisal
//            deger icerenler icin BUYUK olan kazanir (coin, xp, streak vb.
//            asla geri gitmemeli; kucuk olani secmek veri kaybi olurdu)
//   'list' : liste birlestirme — id bazli dedupe, en yeni ustte
//            (history, badges, completed_days)
//   'max'  : sayisal maksimum (coins, xp, level — cikarma islemi olmadigi
//            icin buyuk olan daima daha guncel/fazla birikimdir)
const MERGE_STRATEGY = {
  'gym_app_history': 'list',
  'gym_app_pinned_badges': 'list',
  'gym_app_unlocked_badges': 'list',
  'gym_app_completed_days': 'list',
  'gym_app_body_metrics': 'list',
  'gym_app_xp': 'max',
  'gym_app_level': 'max',
  'gym_app_prev_level': 'max',
  'gym_app_coins': 'max',
  'gym_app_streak': 'max',
  'gym_app_inventory': 'object-union',
  'gym_app_cosmetics': 'list',
  'gym_app_cosmetics_active': 'lww',
  'gym_app_buddies': 'object-union',
  'gym_app_buddies_active': 'lww',
  'gym_app_buddy_active': 'lww',
  'gym_app_gacha_pity': 'max',
  'gym_app_wheel': 'lww',
  'gym_app_don': 'lww',
  'gym_app_quests': 'lww'
};

// --- Yardımcılar ---

const safeParse = (raw) => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'string') return raw; // zaten parse edilmis
  try { return JSON.parse(raw); } catch { return null; }
};

/**
 * Iki listeyi id bazli dedupe ile birlestirir.
 * Ayni id'li elemanlardan guncel olani (updatedAt/timestamp varsa) tutar.
 */
function mergeLists(localRaw, cloudRaw) {
  const local = safeParse(localRaw);
  const cloud = safeParse(cloudRaw);
  if (local === null) return cloudRaw; // lokal yoksa bulut
  if (cloud === null) return localRaw;
  if (!Array.isArray(local) && !Array.isArray(cloud)) return localRaw; // ikisi de dizi degil

  const lArr = Array.isArray(local) ? local : [local];
  const cArr = Array.isArray(cloud) ? cloud : [cloud];

  const map = new Map();
  const keyOf = (item) => {
    if (item && typeof item === 'object') {
      return String(item.id || item.date || item.day || JSON.stringify(item));
    }
    return String(item);
  };
  const tsOf = (item) => {
    if (item && typeof item === 'object') {
      return Number(item.updatedAt || item.timestamp || item.ts || 0) || 0;
    }
    return 0;
  };

  // once lokal (kok deger), sonra bulut ayni id'yi kazannirsa ezer
  for (const item of lArr) map.set(keyOf(item), item);
  for (const item of cArr) {
    const k = keyOf(item);
    const existing = map.get(k);
    if (!existing || tsOf(item) > tsOf(existing)) map.set(k, item);
  }

  return JSON.stringify([...map.values()]);
}

/**
 * Sayisal maksimum birlestirme (coin, xp, streak). Ayrisan sayilar
 * birbirine en az zarar verecek sekilde en buyuk degeri secer.
 */
function mergeMax(localRaw, cloudRaw) {
  const local = safeParse(localRaw);
  const cloud = safeParse(cloudRaw);
  const ln = typeof local === 'number' ? local : parseFloat(local);
  const cn = typeof cloud === 'number' ? cloud : parseFloat(cloud);
  if (Number.isNaN(ln)) return cloudRaw; // lokal yok/bozuk -> bulut
  if (Number.isNaN(cn)) return localRaw; // bulut yok/bozuk -> lokal
  return JSON.stringify(Math.max(ln, cn));
}

/**
 * Objelerin birlesimi: her alan icin iki tarafin maksimumu.
 * Envanter ({itemId: adet}) icin: iki cihazdan yapilan satin almalar
 * HEP korunur - ne lokal ne bulut satin alinmis kalemi dusurmez.
 * Sayisal olmayan alanlarda kapsayici taraftan alinir.
 */
function mergeObjectUnion(localRaw, cloudRaw) {
  if (localRaw === null || localRaw === undefined) return cloudRaw;
  if (cloudRaw === null || cloudRaw === undefined) return localRaw;
  const local = safeParse(localRaw);
  const cloud = safeParse(cloudRaw);
  if (local === null || typeof local !== 'object') return cloudRaw;
  if (cloud === null || typeof cloud !== 'object') return localRaw;

  const out = { ...cloud };
  Object.keys(local).forEach((k) => {
    const lv = local[k];
    const cv = cloud[k];
    if (typeof lv === 'number' && typeof cv === 'number') {
      out[k] = Math.max(lv, cv);
    } else if (cv === undefined) {
      out[k] = lv;
    } else if (typeof lv === 'object' && lv !== null && typeof cv === 'object' && cv !== null) {
      // ic ice obje (orn. buddy koleksiyonu): kapsayici taraf kazanir
      out[k] = Object.keys(lv).length >= Object.keys(cv).length ? lv : cv;
    }
    // skalar farkliysa: bulut degeri korunur (out zaten cv)
  });
  return JSON.stringify(out);
}

/**
 * LWW: degerin icinde "updatedAt" benzeri alan varsa karsilastir,
 * yoksa (konservatif) lokal kalir — bulut degeri SADECE lokalde hic
 * yoksa uygulanir. Boylece daha once yazilmis guncel lokal veriyi
 * eski bir bulut snapshot'i ezemez.
 */
/**
 * ts bilgisi olmayan objeler icin kapsayicilik (superset) heuristigi:
 * daha fazla anahtar tasiyan taraf kazanir. Gerekce: ekonomi objelerinde
 * (envanter, buddy koleksiyonu) "yeni kazanilan" her zaman yeni alan ekler;
 * eski cihaz bu alanlari tasiyamaz. Boylece satin alma kaybi onlenir.
 * Iki taraf da ts tasiyorsa gercek LWW yine once gelir.
 */
function pickSuperset(local, cloud) {
  if (local === null || local === undefined) return null; // caller ele alir
  if (cloud === null || cloud === undefined) return null;
  const lk = (local && typeof local === 'object') ? Object.keys(local).length : 0;
  const ck = (cloud && typeof cloud === 'object') ? Object.keys(cloud).length : 0;
  if (ck > lk) return 'cloud';
  if (lk > ck) return 'local';
  return null; // esit: belirlenemedi
}

function mergeLww(localRaw, cloudRaw) {
  if (localRaw === null || localRaw === undefined) return cloudRaw;
  if (cloudRaw === null || cloudRaw === undefined) return localRaw;

  const local = safeParse(localRaw);
  const cloud = safeParse(cloudRaw);
  if (local === null) return cloudRaw;
  if (cloud === null) return localRaw;

  const lt = (local && typeof local === 'object') ? Number(local.updatedAt || local.ts || 0) || 0 : 0;
  const ct = (cloud && typeof cloud === 'object') ? Number(cloud.updatedAt || cloud.ts || 0) || 0 : 0;
  if (lt === 0 && ct === 0) {
    // Zaman damgasi yok: lokal kazanir yerine kapsayicilik kontrolu.
    // Satin alma/hak kazanma tek yonlu buyur; kucuk (eski) obje buyuk
    // (yeni) olani ezmesin. Esitse lokal kalir (konservatif).
    const superset = pickSuperset(local, cloud);
    if (superset === 'cloud') return cloudRaw;
    return localRaw;
  }
  return ct > lt ? cloudRaw : localRaw;
}

/**
 * Tek anahtari stratejisine gore birlestirir. Donus: birlestirilmis RAW string.
 */
function mergeKey(key, localRaw, cloudRaw) {
  const strat = MERGE_STRATEGY[key];
  if (!strat) return localRaw !== null && localRaw !== undefined ? localRaw : cloudRaw; // tanimsiz: lokal
  if (strat === 'list') return mergeLists(localRaw, cloudRaw);
  if (strat === 'max') return mergeMax(localRaw, cloudRaw);
  if (strat === 'object-union') return mergeObjectUnion(localRaw, cloudRaw);
  return mergeLww(localRaw, cloudRaw);
}

/**
 * Uygulamadaki verileri buluta (Firestore) gönderir.
 *
 * ÖNCEKİ SORUN: setDoc fire-and-forget idi; UI başarılı diyordu ama yazma
 * başarısız olabilirdı (sessiz veri kaybı).
 *
 * ÇÖZÜM: await ile beklenir. Hata fırlatılırsa çağıran tarafa bildirilir.
 *
 * @param {string} uid - Firebase Auth uid
 * @returns {Promise<boolean>} true = başarıyla yazıldı
 * @throws ağ hatası veya yetki hatası durumunda
 */
export const pushDataToCloud = async (uid) => {
    if (!db) throw new Error('Firebase yapılandırılmamış.');
    if (!uid) throw new Error('Geçersiz kullanıcı kimliği.');

    const dataToSync = {};
    LOCAL_STORAGE_KEYS.forEach(key => {
        const val = localStorage.getItem(key);
        if (val !== null) {
            // Veriyi olduğu gibi (string) sakla. JSON parse ETME.
            // Sebep: parse edip sonra tekrar stringify etmek tip round-trip
            // bozulmalarına yol açıyordu (örn. string "5" -> number 5).
            dataToSync[key] = val;
        }
    });

    try {
        // await ile bekle ki çağıran taraf sonucu bilsin.
        await setDoc(doc(db, "users", uid), {
            data: dataToSync,
            lastSynced: new Date().toISOString()
        }, { merge: true });
        log("Veriler başarıyla buluta yüklendi.");
        return true;
    } catch (err) {
        error("Buluta veri yüklenirken hata:", err);
        throw err;
    }
};

/**
 * BULUT + LOKAL BİRLEŞTİRME (merge-sync).
 *
 * ÖNCEKİ DAVRANIŞ: pull = bulut lokalı ezerdi; iki cihaz arasında veri
 * kaybı yaşanıyordu (cihaz A'da antrenman → cihaz B'ye geçince kaybolurdu).
 *
 * YENİ DAVRANIŞ: her anahtar stratejisine göre birleştirilir:
 *   - history/badges/metrics: id bazlı dedupe (iki cihazın antrenmanları
 *     da korunur)
 *   - coins/xp/level/streak: maksimum (birikim asla geri gitmez)
 *   - envanter/kozmetik vb.: updatedAt LWW, damga yoksa lokal korunur
 *
 * @param {string} uid
 * @returns {Promise<boolean>} true = birleştirme yapıldı ve lokal güncellendi
 */
export const mergeAndPullFromCloud = async (uid) => {
    if (!db) throw new Error('Firebase yapılandırılmamış.');
    if (!uid) throw new Error('Geçersiz kullanıcı kimliği.');

    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await withTimeout(getDoc(docRef), 10000);

        if (!docSnap.exists()) return false;
        const cloudData = docSnap.data().data;
        if (!cloudData || typeof cloudData !== 'object') return false;

        let changed = 0;
        Object.keys(cloudData).forEach(key => {
            const cloudRaw = cloudData[key];
            // stratejisi olmayan anahtar (senkron listemiz disindan) yok sayilir
            if (!MERGE_STRATEGY[key] && !LOCAL_STORAGE_KEYS.includes(key)) return;

            const localRaw = localStorage.getItem(key);
            const merged = mergeKey(key, localRaw, normalizeCloudValue(cloudRaw));
            if (merged !== null && merged !== undefined && merged !== localRaw) {
                const strVal = typeof merged === 'string' ? merged : JSON.stringify(merged);
                localStorage.setItem(key, strVal);
                // IDB'yi de esitle: monte edilmemis anahtarlar (orn. streak,
                // prev_level) bir sonraki acilista IDB hidrasyonuyla eski
                // degere geri donmesin (MEDIUM bulgu fix).
                idbMirror(key, strVal);
                changed++;
            }
        });

        // Birlesmeyen taraftan yeni degerler varsa (lokalde olmayan bulut
        // anahtarlari) onlari da yaz
        log(`Merge-sync: ${changed} anahtar birleştirildi.`);
        return true;
    } catch (err) {
        error("Buluttan birleştirme sırasında hata:", err);
        throw err;
    }
};

// Bulut degerini RAW localStorage formatina cevirir (string saklanir)
const normalizeCloudValue = (val) => {
    if (typeof val === 'string') return val;
    if (val === null || val === undefined) return null;
    try { return JSON.stringify(val); } catch { return null; }
};

/**
 * Buluttaki verileri cihaza (LocalStorage) çeker. (ESKİ DAVRANIŞ — üzerine yazma)
 * Yeni kod mergeAndPullFromCloud kullanmalı; bu fonksiyon geriye dönük
 * uyumluluk için duruyor (AuthScreen'deki manuel "buluttan yükle" akışı).
 *
 * @param {string} uid
 * @returns {Promise<boolean>} true = veri bulundu ve yüklendi
 */
export const pullDataFromCloud = async (uid) => {
    if (!db) throw new Error('Firebase yapılandırılmamış.');
    if (!uid) throw new Error('Geçersiz kullanıcı kimliği.');

    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await withTimeout(getDoc(docRef), 10000); // 10 saniye zaman aşımı

        if (docSnap.exists()) {
            const cloudData = docSnap.data().data;
            if (cloudData && typeof cloudData === 'object') {
                Object.keys(cloudData).forEach(key => {
                    const val = cloudData[key];
                    if (typeof val === 'string') {
                        // Yeni format: zaten string (JSON.stringify çıktısı)
                        localStorage.setItem(key, val);
                    } else if (val !== null && val !== undefined) {
                        // Eski format: object/array/number - serialize et
                        try {
                            localStorage.setItem(key, JSON.stringify(val));
                        } catch (e) {
                            warn(`Cloud sync: ${key} değeri serialize edilemedi:`, e);
                        }
                    }
                });
                log("Veriler buluttan başarıyla çekildi.");
                return true;
            }
        }
        return false;
    } catch (err) {
        error("Buluttan veri çekilirken hata:", err);
        throw err;
    }
};
