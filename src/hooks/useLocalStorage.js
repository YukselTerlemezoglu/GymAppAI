import { useState, useEffect, useCallback } from 'react';
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

    // Uygulama açıldığında IndexedDB'den oku ve varsa state'i güncelle
    useEffect(() => {
        let cancelled = false;
        idbGet(key).then((idbValue) => {
            if (!cancelled && idbValue !== undefined) {
                setStoredValue(idbValue);
                // LocalStorage cache'ini de güncelle
                try { window.localStorage.setItem(key, JSON.stringify(idbValue)); } catch { /* kota dolu olabilir; sessizce yoksay */ }
            }
        });
        return () => { cancelled = true; };
    }, [key]);

    // Setter: hem IndexedDB hem LocalStorage'a yaz
    const setValue = useCallback((value) => {
        setStoredValue(prev => {
            const valueToStore = value instanceof Function ? value(prev) : value;
            // LocalStorage'a senkron yaz (hızlı okuma için cache)
            try {
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {
                logWarn(`Error setting localStorage key "${key}":`, error);
            }
            // IndexedDB'ye asenkron yaz (ana depolama)
            idbSet(key, valueToStore);
            return valueToStore;
        });
    }, [key]);

    return [storedValue, setValue];
}

export default useLocalStorage;

