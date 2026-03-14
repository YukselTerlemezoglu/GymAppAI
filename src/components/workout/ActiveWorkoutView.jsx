import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, Trophy, Info, Settings } from 'lucide-react';
import useLocalStorage from '../../hooks/useLocalStorage';
import ExerciseModal from './ExerciseModal';
import RestTimer from './RestTimer';

function ActiveWorkoutView({
    activeAiWorkoutDayIdx,
    activeAiWorkoutDayParams,
    setCurrentView,
    workoutHistory,
    setWorkoutHistory,
    streak,
    setStreak,
    lastWorkoutDate,
    setLastWorkoutDate,
    completedDays,
    setCompletedDays,
    savedAiProgram,
    setSavedAiProgram,
    userXP,
    setUserXP,
    userLevel,
    setUserLevel
}) {
    const [activeAiWorkoutTimer, setActiveAiWorkoutTimer] = useLocalStorage('gym_app_active_timer', 0); // in seconds
    const [activeAiWorkoutChecked, setActiveAiWorkoutChecked] = useLocalStorage('gym_app_active_checked', {}); // { 'exIdx_setIdx': true }
    const [showAiFeedbackModal, setShowAiFeedbackModal] = useState(false);
    const [aiFeedbackRpe, setAiFeedbackRpe] = useState('');
    const [aiFeedbackFatigue, setAiFeedbackFatigue] = useState('');
    const [feedbackValErr, setFeedbackValErr] = useState('');
    const [selectedExerciseForModal, setSelectedExerciseForModal] = useState(null);

    // REST TIMER STATE
    const [isRestTimerEnabled, setIsRestTimerEnabled] = useLocalStorage('gym_app_rest_timer_enabled', true);
    const [showRestTimerSettings, setShowRestTimerSettings] = useState(false);
    const [restTimeRemaining, setRestTimeRemaining] = useState(0);
    const [isRestTimerActive, setIsRestTimerActive] = useState(false);

    const timerIntervalRef = useRef(null);

    // Active Timer Effect
    useEffect(() => {
        if (!showAiFeedbackModal) {
            timerIntervalRef.current = setInterval(() => {
                setActiveAiWorkoutTimer((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerIntervalRef.current);
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [showAiFeedbackModal, setActiveAiWorkoutTimer]);

    // Format Timer (MM:SS)
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleCheckSet = (exIdx, setIdx) => {
        const key = `${exIdx}_${setIdx}`;
        setActiveAiWorkoutChecked(prev => {
            const isNowChecked = !prev[key];
            const updated = { ...prev, [key]: isNowChecked };

            // Eğer seti bitirdiyse (işaretlediyse) ve zamanlayıcı açıksa dinlenmeyi başlat
            if (isNowChecked && isRestTimerEnabled) {
                let totalSetsInDay = 0;
                (activeAiWorkoutDayParams?.exercises || []).forEach(ex => {
                    const sets = parseInt(ex.sets) || 0;
                    totalSetsInDay += sets;
                });

                const checkedBoxesCount = Object.values(updated).filter(v => v === true).length;

                // Son set değilse sayacı başlat
                if (checkedBoxesCount < totalSetsInDay) {
                    setRestTimeRemaining(60); // Varsayılan 60 saniye
                    setIsRestTimerActive(true);
                } else {
                    // İdman bittiyse sayacı zorla kapat
                    setIsRestTimerActive(false);
                    setRestTimeRemaining(0);
                }
            }

            checkIfAllSetsCompleted(updated);
            return updated;
        });
    };

    const checkIfAllSetsCompleted = (currentCheckedMap) => {
        if (!activeAiWorkoutDayParams) return;

        let totalSetsInDay = 0;
        (activeAiWorkoutDayParams?.exercises || []).forEach(ex => {
            const sets = parseInt(ex.sets) || 0;
            totalSetsInDay += sets;
        });

        const checkedBoxesCount = Object.values(currentCheckedMap).filter(v => v === true).length;

        if (checkedBoxesCount === totalSetsInDay && totalSetsInDay > 0) {
            setShowAiFeedbackModal(true);
        }
    };

    const submitAiFeedbackAndSave = () => {
        if (!aiFeedbackRpe || !aiFeedbackFatigue) {
            setFeedbackValErr("Lütfen İdman Zorluğu (RPE) ve Yorgunluk durumunu seçin.");
            return;
        }
        setFeedbackValErr('');

        const todayStr = new Date().toISOString().split('T')[0];

        const newWorkouts = [];
        (activeAiWorkoutDayParams?.exercises || []).forEach((ex, index) => {
            let parsedWeight = parseFloat(ex.weight);
            if (isNaN(parsedWeight)) parsedWeight = 0;

            let parsedReps = parseInt(ex.reps);
            if (isNaN(parsedReps)) parsedReps = 0;

            let parsedSets = parseInt(ex.sets);
            if (isNaN(parsedSets)) parsedSets = 1;

            newWorkouts.push({
                id: Date.now() + index,
                date: new Date().toISOString(),
                exercise: typeof ex.name === 'string' ? ex.name : 'Bilinmeyen Egzersiz',
                sets: parsedSets,
                maxWeight: parsedWeight,
                bestReps: parsedReps,
                totalWeight: parsedWeight * parsedReps * parsedSets,
                totalReps: parsedReps * parsedSets,
                avgRpe: parseFloat(aiFeedbackRpe) || 0,
                isAiGenerated: !!savedAiProgram?.isAiGenerated
            });
        });

        setWorkoutHistory([...newWorkouts.reverse(), ...workoutHistory]);

        // Update streaks
        const isYesterday = new Date(lastWorkoutDate).toDateString() === new Date(new Date().setDate(new Date().getDate() - 1)).toDateString();
        const newStreak = lastWorkoutDate === todayStr ? streak : (isYesterday ? streak + 1 : 1);
        setStreak(newStreak);
        setLastWorkoutDate(todayStr);

        // Mark current day as completed
        if (!completedDays.includes(activeAiWorkoutDayIdx)) {
            setCompletedDays([...completedDays, activeAiWorkoutDayIdx]);
        }

        // --- SMART FATIGUE OPTIMIZATION ENGINE ---
        if (savedAiProgram && savedAiProgram.days && savedAiProgram.days[activeAiWorkoutDayIdx]) {
            const rpeVal = parseFloat(aiFeedbackRpe) || 0;
            const updatedProgram = JSON.parse(JSON.stringify(savedAiProgram)); // Deep copy
            const currentDayExs = updatedProgram.days[activeAiWorkoutDayIdx].exercises;

            let optimizationMessage = "";

            // Yardımcı Fonksiyon: 2.5'un katlarına yuvarla (Örn: 59 -> 60, 56 -> 55)
            const roundToNearest2_5 = (num) => Math.round(num / 2.5) * 2.5;

            // 1) TÜKENDİM -> FULL DELOAD
            if (aiFeedbackFatigue.includes("Tükendim") || rpeVal >= 9) {
                currentDayExs.forEach(ex => {
                    if (ex.weight && !isNaN(parseFloat(ex.weight)) && parseFloat(ex.weight) > 0) {
                        let currentW = parseFloat(ex.weight);
                        let newW = roundToNearest2_5(currentW * 0.9); // %10 düşür
                        if (newW >= currentW) newW = currentW - 2.5; // Kesinlikle düşmesini garanti et
                        ex.weight = Math.max(0, newW).toString();
                    } else if (ex.sets && parseInt(ex.sets) > 1) {
                        ex.sets = (parseInt(ex.sets) - 1).toString();
                    }
                });
                optimizationMessage = "AI Koçu idmanın çok zor geçtiğini fark etti. Aşırı antrenman (Overtraining) riskinden korunman için bir sonraki seansının ağırlıkları düşürüldü (Deload).";
            }
            // 2) BİRAZ YORULDUM -> HAFİF DROPOFF
            else if (aiFeedbackFatigue.includes("Yüksek") || rpeVal === 8) {
                currentDayExs.forEach(ex => {
                    if (ex.weight && !isNaN(parseFloat(ex.weight)) && parseFloat(ex.weight) > 0) {
                        let currentW = parseFloat(ex.weight);
                        let newW = currentW - 2.5; // Sadece ufak bir eksi
                        ex.weight = Math.max(0, newW).toString();
                    }
                });
                optimizationMessage = "AI Koçu biraz yorulduğunu seziyor. Vücudunun toparlanması adına bir dahaki seansında ağırlıkları çok hafif (-2.5kg) geri çektik.";
            }
            // 3) ENERJİ DOLUYUM -> PROGRESSIVE OVERLOAD
            else if (aiFeedbackFatigue.includes("Düşük") || (rpeVal > 0 && rpeVal <= 5)) {
                currentDayExs.forEach(ex => {
                    if (ex.weight && !isNaN(parseFloat(ex.weight)) && parseFloat(ex.weight) > 0) {
                        let currentW = parseFloat(ex.weight);
                        let inc = currentW >= 40 ? 5.0 : 2.5;
                        ex.weight = roundToNearest2_5(currentW + inc).toString();
                    } else if (ex.reps) {
                        let parts = ex.reps.split('-');
                        if (parts.length > 0 && !isNaN(parseInt(parts[0]))) {
                            ex.reps = `${parseInt(parts[0]) + 2}`;
                        }
                    }
                });
                optimizationMessage = "AI Koçu bu idmanın sana çok hafif geldiğini gördü! Gelişimini hızlandırmak için bir sonraki seansındaki ağırlıkların artırıldı. Canavarsın!";
            }
            // 4) NORMAL (ORTA) -> MAINTAIN
            else {
                optimizationMessage = "İdman tam planlandığı gibi geçti! Ağırlıkların vücudun için ideal seviyede. Bir sonraki seansa aynı ağırlıklarla devam ediyoruz.";
            }

            // Programı güncelle
            setSavedAiProgram(updatedProgram);

            // --- DYNAMIC XP & LEVEL LOGIC ---
            // Dinamik XP Hesaplama: Set sayısı, tekrar sayısı, süre ve RPE zorluk derecesini baz alır.
            const totalSets = newWorkouts.reduce((sum, w) => sum + (w.sets || 0), 0);
            const totalReps = newWorkouts.reduce((sum, w) => sum + (w.totalReps || 0), 0);
            const timeInMinutes = Math.floor(activeAiWorkoutTimer / 60);
            const rpe = parseFloat(aiFeedbackRpe) || 5;

            let calculatedXP = 50; // Temel idman bitirme XP'si
            calculatedXP += totalSets * 5; // Her set için 5 XP
            calculatedXP += totalReps * 0.5; // Her kaldırılan tekrar için 0.5 XP
            calculatedXP += timeInMinutes * 2; // Antrenmanda geçen her dakika için 2 XP

            // Zorluk Derecesine (RPE) göre çarpan (RPE 10 = %25 bonus, RPE 5 = bonus yok)
            const rpeMultiplier = 1 + ((rpe - 5) * 0.05);
            calculatedXP = Math.round(calculatedXP * rpeMultiplier);

            const gainedXP = Math.max(10, Math.min(1000, calculatedXP)); // Minimum 10, maksimum 1000 XP verecek şekilde sınırla

            // Dinamik Level Barajı Hesaplayıcı (Örn: Lvl 1: 500XP, Lvl 2: 700XP, Lvl 3: 900XP vs...)
            const calculateRequiredXP = (level) => level * 500 + (level * 100);

            let newTotalXP = userXP + gainedXP;
            let leveledUp = false;
            let currentLvl = userLevel;
            let currentRequiredXP = calculateRequiredXP(currentLvl);

            // Kullanıcı tek idmanda çok fazla XP kazanırsa birden fazla level atlayabilsin diye 'while' döngüsü:
            while (newTotalXP >= currentRequiredXP) {
                newTotalXP -= currentRequiredXP;
                currentLvl += 1;
                currentRequiredXP = calculateRequiredXP(currentLvl);
                leveledUp = true;
            }

            setUserLevel(currentLvl);
            setUserXP(newTotalXP);

            let finalMsg = `🤖 YAPAY ZEKA OPTİMİZASYONU:\n\n${optimizationMessage}\n\n⭐ +${gainedXP} XP Kazandın! (${newTotalXP} / ${currentRequiredXP})`;
            if (leveledUp) {
                finalMsg += `\n🎉 TEBRİKLER SEVİYE ATLADIN! Yeni Güç Seviyen: ${currentLvl}`;
            }

            alert(finalMsg);
        }
        // ----------------------------------------

        // Reset active workout state
        setActiveAiWorkoutChecked({});
        setActiveAiWorkoutTimer(0);
        setIsRestTimerActive(false);
        setRestTimeRemaining(0);

        setCurrentView('dashboard');
        setShowAiFeedbackModal(false);
    };

    if (!activeAiWorkoutDayParams) return null;

    return (
        <div className="app-container slide-in">
            <header className="top-bar fade-in" style={{ animationDelay: '0s', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.5)', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                    <button className="back-btn" onClick={() => {
                        if (window.confirm("İdmanı bitirmeden çıkmak istediğine emin misin? (İlerlemen sıfırlanacak)")) {
                            setActiveAiWorkoutChecked({});
                            setActiveAiWorkoutTimer(0);
                            setIsRestTimerActive(false);
                            setCurrentView('dashboard');
                        }
                    }}>
                        <ArrowLeft size={20} /> Çıkış
                    </button>
                    <div style={{ color: 'var(--accent-primary)', fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace', textShadow: '0 0 10px rgba(0,255,136,0.3)' }}>
                        {formatTime(activeAiWorkoutTimer)}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h2 style={{ color: '#fff', textAlign: 'left', margin: 0 }}>🔥 {activeAiWorkoutDayParams.dayName}</h2>
                    <button
                        onClick={() => setShowRestTimerSettings(!showRestTimerSettings)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: isRestTimerEnabled ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Zamanlayıcı Ayarları"
                    >
                        <Settings size={20} />
                    </button>
                </div>

                {showRestTimerSettings && (
                    <div style={{ width: '100%', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1rem', marginTop: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#fff', fontSize: '0.9rem' }}>Otomatik Dinlenme Sayacı</span>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={isRestTimerEnabled} onChange={(e) => setIsRestTimerEnabled(e.target.checked)} />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem', margin: 0 }}>Açıksa her set bitişinde sayaç 60 saniyeden otomatik başlar.</p>
                    </div>
                )}

                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', width: '100%', marginTop: '1rem' }}>Setleri bitirdikçe yanlarındaki kutucuklara tıklayın.</p>
            </header>

            <div className="workout-tracker-list fade-in" style={{ paddingBottom: '100px', paddingTop: '1rem' }}>
                {activeAiWorkoutDayParams?.exercises?.map((ex, eIdx) => {
                    const numSets = parseInt(ex.sets) || 1;
                    const setsArray = Array.from({ length: numSets });

                    return (
                        <div key={eIdx} className="glass-card" style={{ marginBottom: '1rem' }}>
                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ color: 'var(--accent-primary)', margin: 0 }}>{ex.name}</h3>
                                <button
                                    onClick={() => setSelectedExerciseForModal(ex.name)}
                                    style={{ background: 'transparent', border: 'none', color: '#00c3ff', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    <Info size={18} /> Bilgi
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {setsArray.map((_, sIdx) => {
                                    const isChecked = activeAiWorkoutChecked[`${eIdx}_${sIdx}`] || false;
                                    return (
                                        <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: isChecked ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: isChecked ? '4px solid var(--accent-primary)' : '4px solid transparent', transition: 'all 0.3s ease' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.5)', width: '30px', fontWeight: 'bold' }}>{sIdx + 1}</span>
                                                <span style={{ color: '#fff', fontWeight: '600' }}>{ex.weight} kg</span>
                                                <span style={{ color: 'var(--text-light)' }}>x {ex.reps} reps</span>
                                            </div>
                                            <button
                                                onClick={() => handleCheckSet(eIdx, sIdx)}
                                                style={{
                                                    width: '36px', height: '36px', borderRadius: '50%', background: isChecked ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s'
                                                }}>
                                                {isChecked && <Check size={20} color="#000" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Feedback Modal Overlay */}
            {showAiFeedbackModal && createPortal(
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div className="glass-card slide-in" style={{ width: '100%', maxWidth: '400px', border: '1px solid var(--accent-primary)', background: '#1a1a2e' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <Trophy size={48} color="var(--accent-warning)" style={{ marginBottom: '1rem' }} />
                            <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>İdman Tamamlandı!</h2>
                            <p style={{ color: 'var(--text-light)', opacity: 0.8 }}>Süre: <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{formatTime(activeAiWorkoutTimer)}</span></p>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '1rem' }}>Yapay zekanın bir sonraki programını sana özel ayarlayabilmesi için bu idmanı oylamalısın.</p>
                        </div>

                        <div className="input-group">
                            <label>İdman ne kadar zordu? RPE (1-10)</label>
                            <input
                                type="number"
                                className="neon-input"
                                placeholder="Örn: 8 (10 Çok Zor, 1 Çok Kolay)"
                                value={aiFeedbackRpe}
                                onChange={(e) => setAiFeedbackRpe(e.target.value)}
                                min="1"
                                max="10"
                            />
                        </div>

                        <div className="input-group">
                            <label>Şu anki Yorgunluğun Nasıl?</label>
                            <select className="neon-input" value={aiFeedbackFatigue} onChange={(e) => setAiFeedbackFatigue(e.target.value)} required style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                                <option value="">Seçiniz...</option>
                                <option value="Düşük (Enerji Doluyum)">Düşük (Canavar gibiyim, ağırlık artır)</option>
                                <option value="Orta (Normal)">Orta (Böyle iyiydi)</option>
                                <option value="Yüksek (Biraz Bitkinim)">Yüksek (Beni çok zorladı, biraz hafiflet)</option>
                                <option value="Tükendim (Deload İhtiyacı)">Tükendim (Kas ağrılarım çok olacak, Recovery/Deload yap)</option>
                            </select>
                        </div>

                        {feedbackValErr && (
                            <div style={{ color: 'var(--accent-danger)', background: 'rgba(255, 71, 87, 0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                {feedbackValErr}
                            </div>
                        )}

                        <button onClick={submitAiFeedbackAndSave} className="neon-btn" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}>
                            <Check size={20} /> İDMANI KAYDET VE BİTİR
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Exercise Info Modal */}
            {selectedExerciseForModal && (
                <ExerciseModal
                    exerciseName={selectedExerciseForModal}
                    onClose={() => setSelectedExerciseForModal(null)}
                />
            )}

            {/* Floating Rest Timer */}
            {createPortal(
                <RestTimer
                    timeRemaining={restTimeRemaining}
                    setTimeRemaining={setRestTimeRemaining}
                    isActive={isRestTimerActive}
                    setIsActive={setIsRestTimerActive}
                    onClose={() => {
                        setIsRestTimerActive(false);
                        setRestTimeRemaining(0);
                    }}
                />,
                document.body
            )}
        </div>
    );
}

export default ActiveWorkoutView;
