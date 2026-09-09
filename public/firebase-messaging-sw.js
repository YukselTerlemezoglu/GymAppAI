// Push bildirim service worker'i (VANILLA - Firebase SDK/config ICERMEZ).
// Neden boyle: FCM data mesajlari tarayicinin sagladigi sifreli Web Push
// kanaliyla gelir; SW bunu duz "push" event'i olarak alir. SDK'ya ve
// gomulu firebaseConfig'e gerek YOKTUR. Boylece repoda/asset'te anahtar
// tasiman gerekmez (GitHub secret taramasi da tetiklenmez).
//
// Istemci tarafi token uretimi (getToken) sayfa icinde yapilir; oradaki
// config .env'den runtime'da gelir ve minified bundle icinde kalir.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Arka planda gelen data bildirimini goster
self.addEventListener('push', (event) => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch { /* bos/yamuk payload */ }
    // FCM data-only payload: { data: { title, body, tag, url } }
    const p = data.data || data;
    const title = p.title || 'GymApp AI';
    const body = p.body || '';
    event.waitUntil(self.registration.showNotification(title, {
        body,
        icon: 'pwa-192x192.png',
        badge: 'pwa-192x192.png',
        tag: p.tag || 'gymapp-push',
        data: { url: p.url || '/' },
        vibrate: [60, 40, 60]
    }));
});

// Bildirime tiklayinca uygulamayi ac / odaga al
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
        for (const client of list) {
            if ('focus' in client) {
                client.focus();
                if (url !== '/' && client.navigate) client.navigate(url);
                return;
            }
        }
        return self.clients.openWindow(url);
    }));
});