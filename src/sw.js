// GymAppAI - tek service worker (PWA precache + Web Push).
// Neden tek dosya: bir scope'a tarayici yalnizca BIR SW kaydeder.
// Eskiden PWA SW'si ve firebase-messaging-sw.js ayni '/' scope'unda
// yarisiyordu; push acan kullanicinin offline cache'i bozuluyordu.
// Artik precache (Workbox) ve push ayni SW icinde.
//
// Push kismi VANILLA'dir: FCM data-only mesajlari tarayicinin sifreli
// Web Push kanaliyla zaten gelir; Firebase SDK/config GEREKMEZ. Boylece
// repoya/asset'e API anahtari tasimadan bildirim gonderilebilir.

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

// Vite PWA injectManifest: build sirasinda manifest sabitleri enjekte edilir
self.__WB_MANIFEST;

clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// wger egzersiz katalogu (190KB JSON) - agresif olmayan cache ile
registerRoute(
    ({ url }) => url.pathname.endsWith('.json') && url.pathname.includes('wger'),
    new StaleWhileRevalidate({ cacheName: 'wger-catalog' })
);

// --- PUSH (vanilla Web Push, SDK yok) ---
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
