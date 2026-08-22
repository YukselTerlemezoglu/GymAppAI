/*
 * SES EFEKTLERI MOTORU (Web Audio API)
 *
 * Harici dosya gerektirmez: tum sesler oscilator ile sentezlenir.
 * Tum caldirmalar kullanici etkilesimi (tiklama) ile tetiklendigi icin
 * mobil otomatik-oynatma politikasiyla uyumludur.
 *
 * Kullanim:  playSound('buy')  |  toggleSound()  |  isSoundEnabled()
 * Kalici ayar: localStorage 'gym_app_sound_enabled' (varsayilan: acik)
 */

let ctx = null;
let enabled = null; // null = localStorage'dan ilk okuma bekleniyor

const readEnabled = () => {
    if (enabled === null) {
        try {
            enabled = localStorage.getItem('gym_app_sound_enabled') !== '0';
        } catch {
            enabled = true;
        }
    }
    return enabled;
};

export const isSoundEnabled = () => readEnabled();

export const setSoundEnabled = (value) => {
    enabled = Boolean(value);
    try {
        localStorage.setItem('gym_app_sound_enabled', enabled ? '1' : '0');
    } catch {
        /* private mode: sessizce yut */
    }
};

export const toggleSound = () => {
    setSoundEnabled(!readEnabled());
    return enabled;
};

const getCtx = () => {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
    }
    // iOS: askiya alinmis baglami etkilesimde cozundur
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => { /* sessizce yut */ });
    }
    return ctx;
};

/*
 * Tek nota calar.
 * freq: Hz, dur: saniye, type: dalga formu, gain: ses seviyesi,
 * delay: baslangictan sonra gecikme (notalar icin)
 */
const tone = (freq, dur = 0.1, type = 'sine', gain = 0.12, delay = 0) => {
    const c = getCtx();
    if (!c) return;
    try {
        const t0 = c.currentTime + delay;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
    } catch {
        /* ses desteklenmiyorsa sessizce yut */
    }
};

// Kisa tıkirti (cark/roulette tigi gibi) - cok kisa, metalik
const tick = (gain = 0.05) => tone(900, 0.03, 'square', gain);

/*
 * Ses kütüphanesi. Her ses bir fonksiyon: tone/tick cagrilari.
 */
const SOUNDS = {
    // UI tiklama (sekme/nav gecisi)
    click: () => tone(520, 0.06, 'triangle', 0.08),

    // Satin alma: iki nota yukari (kasa sesi)
    buy: () => {
        tone(880, 0.09, 'sine', 0.12);
        tone(1318, 0.14, 'sine', 0.12, 0.09);
    },

    // Jeton kazanma: parlak ikili
    coin: () => {
        tone(1200, 0.07, 'square', 0.06);
        tone(1600, 0.12, 'square', 0.06, 0.07);
    },

    // Red / yetersiz jeton: alcalan iki nota
    deny: () => {
        tone(220, 0.12, 'sawtooth', 0.08);
        tone(160, 0.18, 'sawtooth', 0.08, 0.12);
    },

    // Cark tikirtisi
    tick: () => tick(0.045),

    // Yem yeme: iki kisa "munch"
    feed: () => {
        tone(180, 0.07, 'sawtooth', 0.1);
        tone(140, 0.09, 'sawtooth', 0.1, 0.09);
    },

    // Gacha acilis: siradann efsaneviye buyuyen fanfar
    reveal_common: () => {
        tone(440, 0.14, 'triangle', 0.1);
    },
    reveal_rare: () => {
        tone(523, 0.12, 'triangle', 0.1);
        tone(659, 0.18, 'triangle', 0.1, 0.11);
    },
    reveal_epic: () => {
        tone(523, 0.11, 'triangle', 0.11);
        tone(659, 0.11, 'triangle', 0.11, 0.1);
        tone(784, 0.16, 'triangle', 0.11, 0.2);
    },
    reveal_legendary: () => {
        tone(523, 0.12, 'triangle', 0.13);
        tone(659, 0.12, 'triangle', 0.13, 0.11);
        tone(784, 0.12, 'triangle', 0.13, 0.22);
        tone(1047, 0.3, 'triangle', 0.14, 0.33);
        tone(784, 0.4, 'sine', 0.08, 0.5);
    },

    // Evrim: yukselen arpej + son parlak nota
    evolve: () => {
        tone(440, 0.12, 'sine', 0.12);
        tone(554, 0.12, 'sine', 0.12, 0.11);
        tone(659, 0.12, 'sine', 0.12, 0.22);
        tone(880, 0.34, 'sine', 0.13, 0.33);
        tone(1109, 0.44, 'triangle', 0.07, 0.45);
    },

    // Rekor (PR): zafer ikilisi
    pr: () => {
        tone(659, 0.12, 'square', 0.07);
        tone(988, 0.22, 'square', 0.07, 0.12);
    }
};

/*
 * Ana caldirici. playSound('buy') seklinde kullanilir.
 * Ses kapaliysa (localStorage) hicbir sey yapmaz.
 */
export const playSound = (name) => {
    if (!readEnabled()) return;
    const fn = SOUNDS[name];
    if (fn) fn();
};
