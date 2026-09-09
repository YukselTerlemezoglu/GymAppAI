// PUSH BILDIRIM YARDIMCILARI (FCM web push)
// - izin isteme + token alma (VAPID)
// - token'i Firestore'da kullanici profiline kaydetme
// - hatirlatici ayarlarini sunucuya senkron etme
// Tarayici/OS destegi yoksa tum fonksiyonlar guvenli noop dondurur.

import { getToken, deleteToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebase, getMessaging } from '../services/firebase';
import { getReminderSettings } from './notificationScheduler';
import { error as logError, warn } from './logger';

// VAPID genel anahtari (public bilgisi; env'den)
const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();

export function pushSupported() {
    return typeof window !== 'undefined'
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window
        && !!vapidKey;
}

/**
 * FCM token'i alir (izin gerekirse once ister) ve Firestore'a kaydeder.
 * @returns {Promise<string|null>} token veya null (reddedildi/destek yok)
 */
export async function enablePush() {
    if (!pushSupported()) return null;
    try {
        const messaging = await getMessaging();
        if (!messaging) return null;
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: reg
        });
        if (!token) return null;

        // Token'i kullanici profiline yaz (login gerekli)
        const { auth, db } = await getFirebase();
        const uid = auth?.currentUser?.uid;
        if (uid) {
            await setDoc(doc(db, 'pushTokens', token), {
                uid,
                createdAt: serverTimestamp(),
                lastSeen: serverTimestamp(),
                reminders: getReminderSettings()
            });
        }
        return token;
    } catch (e) {
        logError('enablePush basarisiz:', e);
        return null;
    }
}

/**
 * Push'u kapatir: token'i siler (yerel + Firestore).
 */
export async function disablePush() {
    try {
        const messaging = await getMessaging();
        if (!messaging) return;
        const token = await getToken(messaging, { vapidKey }).catch(() => null);
        if (token) {
            const { db } = await getFirebase();
            await deleteDoc(doc(db, 'pushTokens', token)).catch(() => { });
            await deleteToken(messaging).catch(() => { });
        }
        localStorage.removeItem('gym_app_push_token');
    } catch (e) {
        warn('disablePush:', e);
    }
}

/**
 * Hatirlatici ayarlari degistiginde cagir: Firestore'daki token dokumanini
 * gunceller (sunucu bildirimleri bu ayarlara gore atilir).
 */
export async function syncPushSettings() {
    if (!pushSupported()) return;
    const token = localStorage.getItem('gym_app_push_token');
    if (!token) return;
    try {
        const { auth, db } = await getFirebase();
        const uid = auth?.currentUser?.uid;
        if (!uid) return;
        await setDoc(doc(db, 'pushTokens', token), {
            uid,
            lastSeen: serverTimestamp(),
            reminders: getReminderSettings()
        }, { merge: true });
    } catch (e) {
        warn('syncPushSettings:', e);
    }
}

/**
 * Uygulama acikken (foreground) gelen bildirimleri yakalar.
 * @param {(payload:any)=>void} cb
 * @returns {() => void} unsubscribe
 */
export function onForegroundPush(cb) {
    if (!pushSupported()) return () => { };
    let unsub = () => { };
    getMessaging().then((messaging) => {
        if (!messaging) return;
        unsub = onMessage(messaging, (payload) => cb(payload));
    }).catch(() => { });
    return () => unsub();
}

export { vapidKey };
