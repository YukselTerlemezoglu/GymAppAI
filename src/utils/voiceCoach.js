// SESLI KOC MOTORU (Faz 2b) — Web Speech API (speechSynthesis).
// Ucretsiz, cevrimdisi, token'siz. Dinlenme sayaci anonslarini seslendirir.
// Kullanim: setVoiceCoachEnabled(true) -> RestTimer'daki anonslar calisir.

let cachedVoices = null;

function getVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    if (cachedVoices && cachedVoices.length) return cachedVoices;
    cachedVoices = window.speechSynthesis.getVoices();
    return cachedVoices;
}

// Ses listesi async yuklenir; degisince cache guncellenir
if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => { cachedVoices = null; };
}

export function isSpeechSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Metni seslendirir. Ayni anda tek anons — onceki konusma kesilir.
 * @param {string} text - okunacak metin (zaten cevrilmis)
 * @param {string} langCode - 'tr-TR' | 'en-US'
 */
export function speak(text, langCode = 'tr-TR') {
    if (!isSpeechSupported() || !text) return false;

    try {
        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = langCode;
        utter.rate = 1.05;
        utter.pitch = 1.0;
        utter.volume = 1.0;

        // Dil'e en uygun sesi sec (tr-TR sesi yoksa varsayilana duser)
        const voices = getVoices();
        const exact = voices.find(v => v.lang === langCode);
        const partial = voices.find(v => v.lang && v.lang.startsWith(langCode.split('-')[0]));
        if (exact) utter.voice = exact;
        else if (partial) utter.voice = partial;

        window.speechSynthesis.speak(utter);
        return true;
    } catch {
        return false;
    }
}

/** Aktif konusmayi durdurur (antrenman iptal/çıkış durumlarında). */
export function stopSpeaking() {
    if (!isSpeechSupported()) return;
    try { window.speechSynthesis.cancel(); } catch { /* yoksay */ }
}

// ---------------------------------------------------------------------------
// Ayar kalıcılığı (localStorage — ses koçu küçük bir tercih, IndexedDB gerektirmez)
// ---------------------------------------------------------------------------
const PREF_KEY = 'gym_app_voice_coach';

export function isVoiceCoachEnabled() {
    if (typeof window === 'undefined') return false;
    try { return window.localStorage.getItem(PREF_KEY) === '1'; } catch { return false; }
}

export function setVoiceCoachEnabled(v) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(PREF_KEY, v ? '1' : '0');
    } catch { /* yoksay */ }
}

/** Anahtar kelimeleri sayilari okunabilir metne cevirir (30 -> otuz saniye zaten tercumede) */
export function restAnnouncement(secondsLeft, lang) {
    if (lang === 'en') {
        if (secondsLeft === 60) return 'One minute left!';
        if (secondsLeft === 30) return '30 seconds left!';
        if (secondsLeft === 10) return '10 seconds!';
        if (secondsLeft === 3) return '3, 2, 1';
        if (secondsLeft <= 0) return 'Rest is over. Lets go!';
        return null;
    }
    if (secondsLeft === 60) return 'Bir dakika kaldı!';
    if (secondsLeft === 30) return 'Otuz saniye kaldı!';
    if (secondsLeft === 10) return 'On saniye!';
    if (secondsLeft === 3) return 'Üç, iki, bir';
    if (secondsLeft <= 0) return 'Dinlenme bitti. Hadi bakalım!';
    return null;
}
