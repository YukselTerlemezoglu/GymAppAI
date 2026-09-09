// FCM-CONFIG-START (otomatik uretildi, elle degistirmeyin)
const firebaseConfig = {
  "apiKey": "AIzaSyArhTUcmzuBEPHbZNXBcnB5gEIQP6NZgg8",
  "authDomain": "gymappai.firebaseapp.com",
  "projectId": "gymappai",
  "storageBucket": "gymappai.firebasestorage.app",
  "messagingSenderId": "797274144350",
  "appId": "1:797274144350:web:d72420bb1c58de96e47ecf"
};
// FCM-CONFIG-END
// Firebase Cloud Messaging service worker'i.
// Bu dosya tarayici tarafinda statik servis edilir; bundling disi kalir
// (importScripts ile CDN'den compat SDK alir). VitePWA ana SW'sinden
// BAGIMSIZDIR - bildirim odakli tek is yapar.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Konfigurasyon derleme sirasinda env'den enjekte edilir (scripts/gen-fcm-sw.mjs).
if (typeof firebaseConfig !== 'undefined' && firebaseConfig && firebaseConfig.projectId) {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // Arka planda gelen bildirimleri goster
    messaging.onBackgroundMessage((payload) => {
        const title = (payload.data && payload.data.title)
            || (payload.notification && payload.notification.title)
            || 'GymApp AI';
        const body = (payload.data && payload.data.body)
            || (payload.notification && payload.notification.body)
            || '';
        self.registration.showNotification(title, {
            body,
            icon: 'pwa-192x192.png',
            badge: 'pwa-192x192.png',
            tag: (payload.data && payload.data.tag) || 'gymapp-push',
            data: { url: (payload.data && payload.data.url) || '/' },
            vibrate: [60, 40, 60]
        });
    });

    // Bildirime tiklayinca uygulamayi ac / odaga al
    self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        const url = (event.notification.data && event.notification.data.url) || '/';
        event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            for (const client of list) {
                if ('focus' in client) {
                    client.focus();
                    if (url !== '/' && client.navigate) client.navigate(url);
                    return;
                }
            }
            return clients.openWindow(url);
        }));
    });
}