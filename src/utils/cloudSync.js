import { db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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

// Uygulamadaki verileri buluta (Firestore) gönderir
export const pushDataToCloud = async (uid) => {
    try {
        const dataToSync = {};
        LOCAL_STORAGE_KEYS.forEach(key => {
            const val = localStorage.getItem(key);
            if (val !== null) {
                try {
                    dataToSync[key] = JSON.parse(val);
                } catch {
                    dataToSync[key] = val;
                }
            }
        });

        // Fire-and-forget mantığı: UI'yi bekletmemek için await kullanmıyoruz.
        // Firebase arka planda eşitlemeyi kendisi halledecektir.
        setDoc(doc(db, "users", uid), {
            data: dataToSync,
            lastSynced: new Date().toISOString()
        }, { merge: true })
        .then(() => console.log("Veriler arka planda başarıyla buluta yüklendi."))
        .catch(err => console.error("Arka planda yükleme hatası:", err));
        
        return true;
    } catch (error) {
        console.error("Buluta veri yüklenirken hata:", error);
        throw error;
    }
};

// Buluttaki verileri cihaza (LocalStorage) çeker
export const pullDataFromCloud = async (uid) => {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await withTimeout(getDoc(docRef), 10000); // 10 saniye zaman aşımı

        if (docSnap.exists()) {
            const cloudData = docSnap.data().data;
            if (cloudData) {
                Object.keys(cloudData).forEach(key => {
                    const val = cloudData[key];
                    if (typeof val === 'object' && val !== null) {
                        localStorage.setItem(key, JSON.stringify(val));
                    } else {
                        localStorage.setItem(key, String(val));
                    }
                });
                console.log("Veriler buluttan başarıyla çekildi.");
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Buluttan veri çekilirken hata:", error);
        throw error;
    }
};
