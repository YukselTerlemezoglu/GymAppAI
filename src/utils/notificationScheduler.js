// PWA bildirim/hatirlatma motoru.
// Push sunucusu gerektirmez: uygulama acikken calisir, service worker
// uzerinden sistem bildirimi gonderir. Tarayici destegi yoksa sessizce devre disi.

const LS_KEY = 'gym_app_reminders';

const DEFAULTS = {
    enabled: false,
    workoutDays: [1, 2, 3, 4, 5], // Pazartesi-Cuma (0=Pazar)
    time: '18:00',                // HH:MM
    waterReminder: false,
    waterEveryMin: 90
};

export function getReminderSettings() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return { ...DEFAULTS };
        const parsed = JSON.parse(raw);
        return { ...DEFAULTS, ...parsed };
    } catch {
        return { ...DEFAULTS };
    }
}

export function saveReminderSettings(settings) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(settings));
    } catch { /* storage dolu olabilir */ }
}

export function notificationsSupported() {
    return typeof window !== 'undefined'
        && 'Notification' in window
        && 'serviceWorker' in navigator;
}

export async function requestNotificationPermission() {
    if (!notificationsSupported()) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    try {
        return await Notification.requestPermission();
    } catch {
        return 'denied';
    }
}

async function showNotification(title, body, tag) {
    if (!notificationsSupported() || Notification.permission !== 'granted') return;
    try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
            body,
            tag,           // ayni tag yeni bildirimi eskisinin uzerine yazar
            icon: 'pwa-192x192.png',
            badge: 'pwa-192x192.png',
            vibrate: [60, 40, 60],
            silent: false
        });
    } catch { /* SW yoksa sessiz gec */ }
}

// Bir kez bildirilen gunun kaydi (spam onleme)
const NOTIFIED_KEY = 'gym_app_last_notified';
const WATER_KEY = 'gym_app_last_water_notified';

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Uygulama acikken her dakika cagirilir.
 * Ayarlar: { enabled, workoutDays, time, waterReminder, waterEveryMin }
 */
export function tickReminders() {
    const s = getReminderSettings();
    if (!s.enabled) return;

    const now = new Date();
    const day = now.getDay();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Antrenman hatirlatma: bugun antrenman gunu + saat eslesti + bugun icin henuz bildirilmemis
    if (s.workoutDays.includes(day) && s.time === hhmm) {
        const last = localStorage.getItem(NOTIFIED_KEY);
        if (last !== todayStr()) {
            localStorage.setItem(NOTIFIED_KEY, todayStr());
            const lang = (navigator.language || 'tr').startsWith('tr') ? 'tr' : 'en';
            const msg = lang === 'tr'
                ? 'Antrenman saatin geldi! Bugünkü programını kontrol et. 💪'
                : 'Time to train! Check today\'s program. 💪';
            showNotification(lang === 'tr' ? 'Antrenman Zamanı 🔥' : 'Workout Time 🔥', msg, 'workout-reminder');
        }
    }

    // Su hatirlatma: uygulama acikken belirli araliklarla
    if (s.waterReminder) {
        const lastTs = parseInt(localStorage.getItem(WATER_KEY) || '0', 10);
        const intervalMs = Math.max(15, s.waterEveryMin) * 60 * 1000;
        if (Date.now() - lastTs >= intervalMs) {
            localStorage.setItem(WATER_KEY, String(Date.now()));
            const lang = (navigator.language || 'tr').startsWith('tr') ? 'tr' : 'en';
            showNotification(
                lang === 'tr' ? 'Su içme zamanı 💧' : 'Time to drink water 💧',
                lang === 'tr' ? 'Bir bardak su içmeye ne dersin?' : 'How about a glass of water?',
                'water-reminder'
            );
        }
    }
}

/**
 * setInterval ile baglanir, temizleme fonksiyonu dondurur.
 */
export function startReminderTicker() {
    tickReminders(); // acilista hemen kontrol
    const id = setInterval(tickReminders, 30 * 1000); // 30 sn'de bir (dakika kacirilmasin)
    return () => clearInterval(id);
}
