import React, { useEffect } from 'react';
import { Play, Pause, X, Plus } from 'lucide-react';

function RestTimer({
    timeRemaining,
    setTimeRemaining,
    isActive,
    setIsActive,
    onClose
}) {
    // Ses dosyası (Varsayılan HTML5 Audio API ile basit bir beep)
    const playBeep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
            console.error("Audio play failed: ", e);
        }
    };

    useEffect(() => {
        let interval = null;

        if (isActive && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining((time) => time - 1);
            }, 1000);
        } else if (isActive && timeRemaining === 0) {
            setIsActive(false);
            playBeep();
            if (Notification.permission === "granted") {
                new Notification("Süreyi Doldurdun!", { body: "Sete girme vakti geldi, haydi canavar!" });
            }
        }

        return () => clearInterval(interval);
    }, [isActive, timeRemaining, setTimeRemaining, setIsActive]);

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

                <button className="timer-btn stop" onClick={onClose} title="Zamanlayıcıyı Kapat">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

export default RestTimer;
