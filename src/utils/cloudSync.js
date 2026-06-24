import { db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { log, warn, error } from './logger';

// Promise'i zaman aşımına uğratan yardımcı fonksiyon
const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Bağlantı zaman aşımına uğradı. İnternet bağlantınızı veya AdBlocker ayarlarınızı kontrol edin.")), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
};

// Senkronize edilecek tüm LocalStorage anahtarları
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
  'gym_app_prev_level'
];

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
            // Firestore object içinde string saklayabilir; geri çekerken
            // typeof kontrolü ile doğru şekilde localStorage'a yazarız.
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
 * Buluttaki verileri cihaza (LocalStorage) çeker.
 *
 * Tip korunumu: cloudSync artık string olarak sakladığı için, çekilen veri
 * string ise doğrudan, object ise (eski kayıtlar) JSON.stringify ile yazılır.
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
