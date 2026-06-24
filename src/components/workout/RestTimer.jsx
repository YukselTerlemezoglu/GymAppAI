import React, { useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Play, Pause, X, Plus } from 'lucide-react';
import { error as logError } from '../../utils/logger';

// Modül skobunda tek bir AudioContext paylaş.
// Sebep: tarayıcılar ~6 AudioContext örneklemesine izin verir; her beep'te
// yeni context oluşturmak kotaları tüketir ve kullanıcı etkileşimi gerektirir.
let _audioCtx = null;
function getAudioContext() {
    if (_audioCtx) return _audioCtx;
    try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        _audioCtx = new Ctor();
    } catch (err) {
        logError('AudioContext oluşturulamadı:', err);
        _audioCtx = null;
    }
    return _audioCtx;
}

function RestTimer({
    timeRemaining,
    setTimeRemaining,
    isActive,
    setIsActive,
    onClose
}) {
    const { t } = useTranslation();

    // Ses dosyası (cache'lenmiş AudioContext ile basit beep)
    const playBeep = () => {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            // Tarayıcı Politikası: 'suspended' ise (ilk kullanıcı etkileşimi öncesi) resume() gerekir
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => { /* sessiz */ });
            }
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note

            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 1);
        } catch (e) {
            logError('Audio play failed:', e);
        }
    };

    // Notification izni: ilk render'da sessizce talep et.
    // 'default' ise (kullanıcı daha önce cevap vermemişse) bir kerelik sor.
    useEffect(() => {
        if (
            typeof Notification !== 'undefined' &&
            Notification.permission === 'default'
        ) {
            // Kullanıcıdan izin iste; reddederse sessizce devam et
            Notification.requestPermission().catch(() => { /* yok say */ });
        }
    }, []);

    useEffect(() => {
        let interval = null;

        if (isActive && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining((time) => time - 1);
            }, 1000);
        } else if (isActive && timeRemaining === 0) {
            setIsActive(false);
            playBeep();
            if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
                try {
                    new Notification(t('timer_times_up'), {
                        body: t('timer_body')
                    });
                } catch (e) {
                    logError('Notification gösterilemedi:', e);
                }
            }
        }

        return () => clearInterval(interval);
    }, [isActive, timeRemaining, setTimeRemaining, setIsActive, t]);

    if (!isActive && timeRemaining === 0) return null;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const addTime = (amount) => {
        setTimeRemaining(prev => prev + amount);
    };

    return (
        <div className="rest-timer-floating">
            <div className="timer-display">
                {formatTime(timeRemaining)}
            </div>

            <div className="timer-controls">
                <button className="timer-btn" onClick={() => addTime(30)}>+30s</button>
                <button className="timer-btn" onClick={() => addTime(60)}>+60s</button>

                {isActive ? (
                    <button className="timer-btn" onClick={() => setIsActive(false)}>
                        <Pause size={14} />
                    </button>
                ) : (
                    <button className="timer-btn" onClick={() => setIsActive(true)}>
                        <Play size={14} />
                    </button>
                )}

                <button className="timer-btn stop" onClick={onClose} title={t('btn_close')}>
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

export default RestTimer;
