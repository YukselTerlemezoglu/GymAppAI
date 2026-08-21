import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useToast } from '../ui/ToastProvider';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, Trophy, Info, Settings, TrendingUp, Calculator, History, Link2 } from 'lucide-react';
import useLocalStorage from '../../hooks/useLocalStorage';
import ExerciseModal from './ExerciseModal';
import RestTimer from './RestTimer';
import PrCelebrationModal from '../ui/PrCelebrationModal';
import PlateCalculator from '../ui/PlateCalculator';
import { detectPRs, getOverloadSuggestion, getExerciseHistory } from '../../utils/prTracker';
import { totalXpForLevel, levelFromTotalXp } from '../../utils/levelSystem';
import { normalizeAiWeight, normalizeAiReps } from '../../utils/aiNormalizer';

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
    setUserLevel,
    
    setUserCoins
}) {
    const { t, lang } = useLanguage();
    const { toast, confirmDialog, haptic } = useToast();
    // Timer ve antrenman logları ARTIK bellek içi (useState).
    // Sebep: saniyede bir IndexedDB'ye yazmak performansı bozuyordu ve
    // kullanıcı antrenmanı yarıda bırakıp uygulamayı kapatınca,
    // yeniden açtığında eski/stale değerle yanlış bir "devam" yaşanıyordu.
    const [activeAiWorkoutTimer, setActiveAiWorkoutTimer] = useState(0);
    const [activeAiWorkoutLogs, setActiveAiWorkoutLogs] = useState({});
    const [showAiFeedbackModal, setShowAiFeedbackModal] = useState(false);
    const [aiFeedbackRpe, setAiFeedbackRpe] = useState('');
    const [aiFeedbackFatigue, setAiFeedbackFatigue] = useState('');
    const [feedbackValErr, setFeedbackValErr] = useState('');
    const [selectedExerciseForModal, setSelectedExerciseForModal] = useState(null);
    const [pendingPRs, setPendingPRs] = useState(null);
    const [showPlateCalc, setShowPlateCalc] = useState(false);

    // REST TIMER STATE
    // Varsayilan KAPALI: isteyen antrenman basinda ayarlardan acar.
    const [isRestTimerEnabled, setIsRestTimerEnabled] = useLocalStorage('gym_app_rest_timer_enabled', false);
    const [showRestTimerSettings, setShowRestTimerSettings] = useState(false);
    const [restTimeRemaining, setRestTimeRemaining] = useState(0);
    const [isRestTimerActive, setIsRestTimerActive] = useState(false);

    // TAKIP MODU: set set isaretleme + mola sayaci. Varsayilan kapali (Hizli Mod).
    const [isTrackingMode, setIsTrackingMode] = useLocalStorage('gym_app_tracking_mode', false);

    const timerIntervalRef = useRef(null);

    // Tek seferlik temizlik: eski persistent timer/log storage anahtarları
    // artık kullanılmıyor. Bir defaya mahsus temizleyelim (geriye dönük uyum).
    useEffect(() => {
        try {
            localStorage.removeItem('gym_app_active_timer');
            localStorage.removeItem('gym_app_active_logs');
        } catch {
            /* yok say */
        }
    }, []);

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
    }, [showAiFeedbackModal]);

    // Format Timer (MM:SS)
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const getSetsForExercise = (eIdx, ex) => {
        if (activeAiWorkoutLogs[eIdx]) return activeAiWorkoutLogs[eIdx];
        const numSets = parseInt(ex.sets) || 1;
        // Eski kayitli programlarda weight "15kg"/"Vücut Ağırlığı" gibi string olabilir;
        // input alanini temiz tutmak icin normalize edilir.
        const cleanWeight = normalizeAiWeight(ex.weight);
        const weightVal = cleanWeight === 'BW' ? 'BW' : (cleanWeight === '' ? '' : cleanWeight);
        return Array.from({ length: numSets }).map(() => ({
            weight: weightVal,
            reps: normalizeAiReps(ex.reps),
            mode: 'Normal',
            completed: false
        }));
    };

    const updateSetData = (eIdx, sIdx, field, value) => {
        setActiveAiWorkoutLogs(prev => {
            const updated = { ...prev };
            if (!updated[eIdx]) {
                const ex = activeAiWorkoutDayParams.exercises[eIdx];
                updated[eIdx] = getSetsForExercise(eIdx, ex);
            }
            updated[eIdx] = [...updated[eIdx]];
            updated[eIdx][sIdx] = { ...updated[eIdx][sIdx], [field]: value };
            return updated;
        });
    };

    const addSet = (eIdx, ex) => {
        setActiveAiWorkoutLogs(prev => {
            const updated = { ...prev };
            if (!updated[eIdx]) {
                updated[eIdx] = getSetsForExercise(eIdx, ex);
            }
            updated[eIdx] = [...updated[eIdx], {
                weight: ex.weight || 0,
                reps: ex.reps || 0,
                mode: 'Drop Set',
                completed: false
            }];
            return updated;
        });
    };

    const handleCheckSet = (eIdx, sIdx, ex) => {
        haptic(10);
        setActiveAiWorkoutLogs(prev => {
            const updated = { ...prev };
            if (!updated[eIdx]) {
                updated[eIdx] = getSetsForExercise(eIdx, ex);
            }
            updated[eIdx] = [...updated[eIdx]];
            const isNowChecked = !updated[eIdx][sIdx].completed;
            updated[eIdx][sIdx] = { ...updated[eIdx][sIdx], completed: isNowChecked };

            if (isNowChecked && isTrackingMode && isRestTimerEnabled) {
                let allComplete = true;
                (activeAiWorkoutDayParams?.exercises || []).forEach((loopEx, i) => {
                    const logs = updated[i] || getSetsForExercise(i, loopEx);
                    if (logs.some(set => !set.completed)) {
                        allComplete = false;
                    }
                });

                if (!allComplete) {
                    setRestTimeRemaining(60);
                    setIsRestTimerActive(true);
                } else {
                    setIsRestTimerActive(false);
                    setRestTimeRemaining(0);
                }
            }

            if (isTrackingMode) checkIfAllSetsCompleted(updated);
            return updated;
        });
    };

    const checkIfAllSetsCompleted = (currentLogs) => {
        if (!activeAiWorkoutDayParams) return;
        let allComplete = true;
        (activeAiWorkoutDayParams?.exercises || []).forEach((ex, i) => {
            const logs = currentLogs[i] || getSetsForExercise(i, ex);
            if (logs.some(set => !set.completed)) {
                allComplete = false;
            }
        });
        if (allComplete && activeAiWorkoutDayParams.exercises.length > 0) {
            setShowAiFeedbackModal(true);
        }
    };

    const submitAiFeedbackAndSave = () => {
        if (!aiFeedbackRpe || !aiFeedbackFatigue) {
            setFeedbackValErr(lang === 'tr' ? "Lütfen İdman Zorluğu (RPE) ve Yorgunluk durumunu seçin." : "Please select Workout Difficulty (RPE) and Fatigue level.");
            return;
        }
        setFeedbackValErr('');

        const todayStr = new Date().toISOString().split('T')[0];

        let extraXpFromDifficulty = 0;

        const newWorkouts = [];
        (activeAiWorkoutDayParams?.exercises || []).forEach((ex, index) => {
            const logs = activeAiWorkoutLogs[index] || getSetsForExercise(index, ex);

            let exTotalWeight = 0;
            let exTotalReps = 0;
            let performedSetsCount = 0;

            logs.forEach(setLog => {
                // Hızlı Mod'da (isTrackingMode kapalı) tüm setler "yapıldı" sayılır;
                // Takip Modu'nda yalnız işaretlenenler.
                const performed = isTrackingMode ? setLog.completed : true;
                if (performed) {
                    performedSetsCount++;
                    const w = parseFloat(setLog.weight) || 0;
                    const r = parseInt(setLog.reps) || 0;
                    exTotalWeight += (w * r);
                    exTotalReps += r;
                    // GAMIFICATION: Zorluk Bonusu
                    if (setLog.mode === 'Drop Set' || setLog.mode === 'AMRAP') {
                        extraXpFromDifficulty += 10;
                    }
                }
            });

            // Fallback
            let parsedWeight = parseFloat(ex.weight);
            if (isNaN(parsedWeight)) parsedWeight = 0;
            let parsedReps = parseInt(ex.reps);
            if (isNaN(parsedReps)) parsedReps = 0;

            newWorkouts.push({
                id: Date.now() + index,
                date: new Date().toISOString(),
                exercise: typeof ex.name === 'string' ? ex.name : (lang === 'tr' ? 'Bilinmeyen Egzersiz' : 'Unknown Exercise'),
                sets: performedSetsCount > 0 ? performedSetsCount : parseInt(ex.sets) || 1,
                maxWeight: logs.reduce((max, s) => Math.max(max, parseFloat(s.weight) || 0), parsedWeight) || parsedWeight,
                bestReps: logs.reduce((max, s) => Math.max(max, parseInt(s.reps) || 0), parsedReps) || parsedReps,
                totalWeight: exTotalWeight > 0 ? exTotalWeight : (parsedWeight * parsedReps * parseInt(ex.sets || 1)),
                totalReps: exTotalReps > 0 ? exTotalReps : (parsedReps * parseInt(ex.sets || 1)),
                avgRpe: parseFloat(aiFeedbackRpe) || 0,
                isAiGenerated: !!savedAiProgram?.isAiGenerated
            });
        });

        setWorkoutHistory([...newWorkouts.reverse(), ...workoutHistory]);

        // PR TESPİTİ: yeni kayıtları eski geçmişle karşılaştır
        const prs = detectPRs(newWorkouts, workoutHistory);
        if (prs.length > 0) {
            setPendingPRs(prs);
            haptic([30, 50, 30, 50, 60]); // rekor! guclu titreme
        }

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
                optimizationMessage = lang === 'tr' 
                    ? "AI Koçu idmanın çok zor geçtiğini fark etti. Aşırı antrenman (Overtraining) riskinden korunman için bir sonraki seansının ağırlıkları düşürüldü (Deload)."
                    : "AI Coach noticed the workout was very difficult. To prevent overtraining, weights for your next session have been reduced (Deload).";
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
                optimizationMessage = lang === 'tr'
                    ? "AI Koçu biraz yorulduğunu seziyor. Vücudunun toparlanması adına bir dahaki seansında ağırlıkları çok hafif (-2.5kg) geri çektik."
                    : "AI Coach senses you're a bit tired. To help your body recover, we've slightly reduced weights (-2.5kg) for your next session.";
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
                optimizationMessage = lang === 'tr'
                    ? "AI Koçu bu idmanın sana çok hafif geldiğini gördü! Gelişimini hızlandırmak için bir sonraki seansındaki ağırlıkların artırıldı. Canavarsın!"
                    : "AI Coach saw that this workout was too easy for you! To speed up your progress, weights for your next session have been increased. You're a beast!";
            }
            // 4) NORMAL (ORTA) -> MAINTAIN
            else {
                optimizationMessage = lang === 'tr'
                    ? "İdman tam planlandığı gibi geçti! Ağırlıkların vücudun için ideal seviyede. Bir sonraki seansa aynı ağırlıklarla devam ediyoruz."
                    : "Workout went exactly as planned! Weights are at an ideal level for your body. Continuing with the same weights for the next session.";
            }

            // Programı güncelle
            setSavedAiProgram(updatedProgram);

            // --- DYNAMIC XP & LEVEL LOGIC (v2) ---
            // Bilesenler: taban + set + tekrar + dakika + HACIM + PR bonusu,
            // uzerine RPE ve seri (streak) carpanlari.
            const totalSets = newWorkouts.reduce((sum, w) => sum + (w.sets || 0), 0);
            const totalReps = newWorkouts.reduce((sum, w) => sum + (w.totalReps || 0), 0);
            const totalVolume = newWorkouts.reduce((sum, w) => sum + (parseFloat(w.totalWeight) || 0), 0);
            const timeInMinutes = Math.floor(activeAiWorkoutTimer / 60);
            const rpe = parseFloat(aiFeedbackRpe) || 5;

            let calculatedXP = 50; // Temel idman bitirme XP'si
            calculatedXP += totalSets * 5; // Her set için 5 XP
            calculatedXP += totalReps * 0.5; // Her kaldırılan tekrar için 0.5 XP
            calculatedXP += timeInMinutes * 2; // Antrenmanda geçen her dakika için 2 XP
            calculatedXP += Math.round(totalVolume / 1000) * 10; // Her tam ton (1000 kg) hacim için 10 XP

            // PR BONUSU: bu idmanda kirilan her kisisel rekor 25 XP
            calculatedXP += (prs.length || 0) * 25;

            // Zorluk Derecesine (RPE) göre çarpan (RPE 10 = %25 bonus, RPE 5 = bonus yok)
            const rpeMultiplier = 1 + ((rpe - 5) * 0.05);
            calculatedXP = Math.round(calculatedXP * rpeMultiplier);

            // SERİ ÇARPANI (STREAK MULTIPLIER)
            let streakMultiplier = 1.0;
            if (newStreak >= 7) streakMultiplier = 1.5;
            else if (newStreak >= 3) streakMultiplier = 1.2;

            calculatedXP = Math.round(calculatedXP * streakMultiplier);

            // Add extra gamification XP for AMRAP/Drop Sets
            calculatedXP += extraXpFromDifficulty;

            const gainedXP = Math.max(10, Math.min(2000, calculatedXP)); // Minimum 10, maksimum 2000 XP

            // --- EGRISEL SEVIYE SISTEMI (levelSystem.js) ---
            // Toplam XP uzerinden hesap; birden fazla seviye atlanabilir.
            const prevTotal = totalXpForLevel(userLevel) + userXP;
            const after = levelFromTotalXp(prevTotal + gainedXP);
            const leveledUp = after.level > userLevel;

            setUserLevel(after.level);
            setUserXP(after.xp);

            // Jeton (Coin) Ekleme: Kazanılan XP'nin %10'u kadar Jeton verilir (Ödül Sistemi)
            const earnedCoins = Math.max(1, Math.round(gainedXP * 0.1));
            setUserCoins((prev) => (prev || 0) + earnedCoins);

            let baseMsg = `${lang === 'tr' ? `+${gainedXP} XP` : `+${gainedXP} XP`}`;
            if (streakMultiplier > 1.0) {
                baseMsg += ` · 🔥 ${streakMultiplier}x`;
            }
            baseMsg += ` · 🪙 +${earnedCoins}`;

            // Seviye atlama ve optimizasyon mesaji toast'larla gosterilir
            if (leveledUp) {
                toast.success(`🎉 ${lang === 'tr' ? `Seviye atladın! Yeni seviye: ${after.level}` : `Level up! New level: ${after.level}`}`, { duration: 4200 });
            }
            toast.success(`${baseMsg} ${lang === 'tr' ? 'kazandın!' : 'earned!'}`, { duration: 3200 });
            if (optimizationMessage && optimizationMessage.trim()) {
                toast.info(`🤖 ${optimizationMessage.slice(0, 120)}`, { duration: 4600 });
            }
        }
        // ----------------------------------------

        // Reset active workout state
        setActiveAiWorkoutLogs({});
        setActiveAiWorkoutTimer(0);
        setIsRestTimerActive(false);
        setRestTimeRemaining(0);
        haptic([20, 60, 20]);

        setCurrentView('dashboard');
        setShowAiFeedbackModal(false);
    };

    if (!activeAiWorkoutDayParams) return null;

    return (
        <div className="app-container slide-in">
            <header className="top-bar fade-in" style={{ animationDelay: '0s', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.5)', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                    <button className="back-btn" onClick={async () => {
                        const ok = await confirmDialog({
                            title: t('aw_exit_title'),
                            message: t('aw_exit_msg'),
                            confirmLabel: t('aw_exit_confirm'),
                            cancelLabel: t('aw_exit_cancel'),
                            danger: true
                        });
                        if (ok) {
                            setActiveAiWorkoutLogs({});
                            setActiveAiWorkoutTimer(0);
                            setIsRestTimerActive(false);
                            setCurrentView('dashboard');
                        }
                    }}>
                        <ArrowLeft size={20} /> {t('btn_exit')}
                    </button>
                    <div style={{ color: 'var(--accent-primary)', fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace', textShadow: '0 0 10px rgba(0,255,136,0.3)' }}>
                        {formatTime(activeAiWorkoutTimer)}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h2 style={{ color: '#fff', textAlign: 'left', margin: 0 }}>🔥 {activeAiWorkoutDayParams.dayName}</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setShowPlateCalc(true)}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffd700', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title={lang === 'tr' ? "Pul Hesaplayıcı" : "Plate Calculator"}
                        >
                            <Calculator size={20} />
                        </button>
                        <button
                            onClick={() => setShowRestTimerSettings(!showRestTimerSettings)}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: isRestTimerEnabled ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title={lang === 'tr' ? "Antrenman Ayarları" : "Workout Settings"}
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {showRestTimerSettings && (
                    <div style={{ width: '100%', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1rem', marginTop: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#fff', fontSize: '0.9rem' }}>{lang === 'tr' ? 'Takip Modu (set set işaretle)' : 'Tracking Mode (set-by-set)'}</span>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={isTrackingMode} onChange={(e) => setIsTrackingMode(e.target.checked)} />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem', margin: 0 }}>{lang === 'tr' ? 'Açıksa her seti tek tek işaretlersin; PR tespiti ve gerçek hacim kaydı çalışır. Kapalıysa sadece antrenman süresi takip edilir.' : 'If on, you check off each set; PR detection and real volume logging work. If off, only the workout timer runs.'}</p>

                        {isTrackingMode && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <span style={{ color: '#fff', fontSize: '0.9rem' }}>{lang === 'tr' ? 'Otomatik Dinlenme Sayacı' : 'Auto Rest Timer'}</span>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={isRestTimerEnabled} onChange={(e) => setIsRestTimerEnabled(e.target.checked)} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        )}
                        {isTrackingMode && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem', margin: 0 }}>{lang === 'tr' ? 'Açıksa her set bitişinde sayaç 60 saniyeden otomatik başlar.' : 'If enabled, the timer starts automatically from 60 seconds after each set.'}</p>
                        )}
                    </div>
                )}

                {isTrackingMode && (
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', width: '100%', marginTop: '1rem' }}>{lang === 'tr' ? 'Setleri bitirdikçe yanlarındaki kutucuklara tıklayın.' : 'Check the boxes as you complete each set.'}</p>
                )}
                {!isTrackingMode && (
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', width: '100%', marginTop: '1rem' }}>{lang === 'tr' ? 'Hızlı mod: ağırlık/tekrar alanlarını istersen güncelle, bitince aşağıdan idmanı bitir.' : 'Quick mode: optionally update weight/reps, then finish the workout below.'}</p>
                )}
            </header>

            <div className="workout-tracker-list fade-in" style={{ paddingBottom: '100px', paddingTop: '1rem' }}>
                {activeAiWorkoutDayParams?.exercises?.map((ex, eIdx) => {
                    const setsArray = activeAiWorkoutLogs[eIdx] || getSetsForExercise(eIdx, ex);
                    const isSuperset = !!ex.supersetWithPrev;
                    // Superset rozet numarasi (A1, A2, ...)
                    let supBadge = null;
                    if (isSuperset || activeAiWorkoutDayParams.exercises[eIdx + 1]?.supersetWithPrev) {
                        let n = 1;
                        for (let i = 1; i <= eIdx; i++) {
                            if (activeAiWorkoutDayParams.exercises[i]?.supersetWithPrev) n++;
                            else n = 1;
                        }
                        supBadge = `A${n}`;
                    }

                    return (
                        <div key={eIdx} className="glass-card" style={{
                            marginBottom: '1rem',
                            borderLeft: isSuperset ? '4px solid #ff0088' : undefined,
                            background: isSuperset ? 'rgba(255,0,136,0.05)' : undefined
                        }}>
                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ color: 'var(--accent-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {supBadge && (
                                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ff0088', border: '1px solid #ff0088', borderRadius: '4px', padding: '2px 5px', flexShrink: 0 }} title={t('sup_badge_hint')}>{supBadge}</span>
                                    )}
                                    {ex.name}
                                    {isSuperset && <Link2 size={14} color="#ff0088" title={t('sup_badge_hint')} />}
                                </h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setSelectedExerciseForModal(ex.name)}
                                        style={{ background: 'transparent', border: 'none', color: '#00c3ff', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                                    >
                                        <Info size={18} /> {t('btn_info')}
                                    </button>
                                </div>
                            </div>

                            <LastPerformanceCard exerciseName={ex.name} history={workoutHistory} lang={lang} t={t} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {setsArray.map((setLog, sIdx) => {
                                    const isChecked = setLog.completed;
                                    return (
                                        <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem', background: isChecked ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: isChecked ? '4px solid var(--accent-primary)' : '4px solid transparent', transition: 'all 0.3s ease' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.5)', width: '20px', fontWeight: 'bold' }}>{sIdx + 1}</span>

                                                    {/* Mode Selector */}
                                                    <select
                                                        value={setLog.mode}
                                                        onChange={(e) => updateSetData(eIdx, sIdx, 'mode', e.target.value)}
                                                        style={{ background: 'rgba(0,0,0,0.3)', color: setLog.mode === 'Drop Set' || setLog.mode === 'AMRAP' ? 'var(--accent-warning)' : '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 8px', fontSize: '16px', outline: 'none' }}
                                                    >
                                                        <option value="Normal">{lang === 'tr' ? 'Normal' : 'Normal'}</option>
                                                        <option value="Warmup">{lang === 'tr' ? 'Isınma' : 'Warmup'}</option>
                                                        <option value="Drop Set">Drop Set</option>
                                                        <option value="AMRAP">AMRAP</option>
                                                    </select>

                                                    {/* Weight & Reps inputs container (Flex for spacing) */}
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {/* Weight Input */}
                                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px 8px' }}>
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                placeholder="kg"
                                                                value={setLog.weight === 'BW' ? 'BW' : setLog.weight}
                                                                onChange={(e) => updateSetData(eIdx, sIdx, 'weight', e.target.value)}
                                                                style={{ width: '45px', background: 'transparent', border: 'none', color: '#fff', fontWeight: 'bold', textAlign: 'right', outline: 'none' }}
                                                            />
                                                            <span style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginLeft: '4px' }}>{setLog.weight === 'BW' ? '(vücut)' : 'kg'}</span>
                                                        </div>

                                                        {/* Reps Input */}
                                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px 8px' }}>
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                placeholder="reps"
                                                                value={setLog.reps === 'MAX' ? 'MAX' : setLog.reps}
                                                                onChange={(e) => updateSetData(eIdx, sIdx, 'reps', e.target.value)}
                                                                style={{ width: '40px', background: 'transparent', border: 'none', color: '#fff', fontWeight: 'bold', textAlign: 'right', outline: 'none' }}
                                                            />
                                                            <span style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginLeft: '4px' }}>reps</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isTrackingMode && (
                                                    <button
                                                        onClick={() => handleCheckSet(eIdx, sIdx, ex)}
                                                        style={{
                                                            width: '36px', height: '36px', borderRadius: '50%', background: isChecked ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
                                                        }}>
                                                        {isChecked && <Check size={20} color="#000" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <button
                                    onClick={() => addSet(eIdx, ex)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: 'var(--text-light)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', marginTop: '0.5rem', transition: 'all 0.2s' }}
                                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    + {t('btn_add_set')}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* İDMANI BİTİR BUTONU (Hızlı modda ana akış; Takip modunda setler işaretlenince modal otomatik açılır) */}
                <button
                    onClick={() => setShowAiFeedbackModal(true)}
                    className="neon-btn"
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '0.5rem' }}
                >
                    <Check size={20} /> {lang === 'tr' ? 'İDMANI BİTİR' : 'FINISH WORKOUT'}
                </button>
            </div>

            {/* Feedback Modal Overlay */}
            {showAiFeedbackModal && createPortal(
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div className="glass-card slide-in" style={{ width: '100%', maxWidth: '400px', border: '1px solid var(--accent-primary)', background: '#1a1a2e' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <Trophy size={48} color="var(--accent-warning)" style={{ marginBottom: '1rem' }} />
                            <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>{lang === 'tr' ? 'İdman Tamamlandı!' : 'Workout Completed!'}</h2>
                            <p style={{ color: 'var(--text-light)', opacity: 0.8 }}>{lang === 'tr' ? 'Süre' : 'Duration'}: <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{formatTime(activeAiWorkoutTimer)}</span></p>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '1rem' }}>{lang === 'tr' ? 'Yapay zekanın bir sonraki programını sana özel ayarlayabilmesi için bu idmanı oylamalısın.' : 'Rate this workout so the AI can customize your next program.'}</p>
                        </div>

                        <div className="input-group">
                            <label>{lang === 'tr' ? 'İdman ne kadar zordu? RPE (1-10)' : 'How hard was the workout? RPE (1-10)'}</label>
                            <input
                                type="number"
                                className="neon-input"
                                placeholder={lang === 'tr' ? "Örn: 8 (10 Çok Zor, 1 Çok Kolay)" : "Ex: 8 (10 Very Hard, 1 Very Easy)"}
                                value={aiFeedbackRpe}
                                onChange={(e) => setAiFeedbackRpe(e.target.value)}
                                min="1"
                                max="10"
                            />
                        </div>

                        <div className="input-group">
                            <label>{lang === 'tr' ? 'Şu anki Yorgunluğun Nasıl?' : 'How is your current fatigue?'}</label>
                            <select className="neon-input" value={aiFeedbackFatigue} onChange={(e) => setAiFeedbackFatigue(e.target.value)} required style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                                <option value="">{lang === 'tr' ? 'Seçiniz...' : 'Select...'}</option>
                                <option value="Düşük (Enerji Doluyum)">{lang === 'tr' ? 'Düşük (Canavar gibiyim, ağırlık artır)' : 'Low (Beast mode, increase weight)'}</option>
                                <option value="Orta (Normal)">{lang === 'tr' ? 'Orta (Böyle iyiydi)' : 'Moderate (It was fine)'}</option>
                                <option value="Yüksek (Biraz Bitkinim)">{lang === 'tr' ? 'Yüksek (Beni çok zorladı, biraz hafiflet)' : 'High (Very tough, lighten a bit)'}</option>
                                <option value="Tükendim (Deload İhtiyacı)">{lang === 'tr' ? 'Tükendim (Kas ağrılarım çok olacak, Recovery/Deload yap)' : 'Exhausted (Need Recovery/Deload)'}</option>
                            </select>
                        </div>

                        {feedbackValErr && (
                            <div style={{ color: 'var(--accent-danger)', background: 'rgba(255, 71, 87, 0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                {feedbackValErr}
                            </div>
                        )}

                        <button onClick={submitAiFeedbackAndSave} className="neon-btn" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}>
                            <Check size={20} /> {lang === 'tr' ? 'İDMANI KAYDET VE BİTİR' : 'SAVE AND FINISH WORKOUT'}
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
            {/* PR Kutlama Modalı */}
            {pendingPRs && pendingPRs.length > 0 && (
                <PrCelebrationModal
                    prs={pendingPRs}
                    onClose={() => setPendingPRs(null)}
                />
            )}

            {/* Pul Hesaplayıcı */}
            {showPlateCalc && (
                <PlateCalculator onClose={() => setShowPlateCalc(false)} />
            )}
        </div>
    );
}

// Egzersiz kartında "geçen sefer + bugünün hedefi" gösteren mini kart.
// Genisletilince son 5 seansin performans listesi acilir.
function LastPerformanceCard({ exerciseName, history, t, lang }) {
    const [expanded, setExpanded] = useState(false);
    const suggestion = useMemo(() => getOverloadSuggestion(exerciseName, history), [exerciseName, history]);
    const sessions = useMemo(
        () => (expanded ? getExerciseHistory(exerciseName, history, 5) : []),
        [expanded, exerciseName, history]
    );
    if (!suggestion) return null;
    const { from, kind, targetWeight, targetReps } = suggestion;
    return (
        <div style={{
            background: 'rgba(0, 195, 255, 0.06)',
            border: '1px solid rgba(0, 195, 255, 0.15)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '0.8rem',
            fontSize: '0.8rem'
        }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px' }}>
                <TrendingUp size={14} color="#00c3ff" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text-light)' }}>
                    {t('po_last_time')}: <strong style={{ color: 'var(--text-primary)' }}>{from.weight}kg × {from.reps}</strong>
                </span>
                <span style={{ color: '#00ff88', fontWeight: 600 }}>
                    {kind === 'weight'
                        ? t('po_target_weight').replace('{w}', targetWeight).replace('{r}', targetReps)
                        : t('po_target_reps').replace('{w}', targetWeight).replace('{r}', targetReps)}
                </span>
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#00c3ff', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    <History size={13} /> {t('exh_button')}
                </button>
            </div>
            {expanded && (
                <div style={{ marginTop: '8px', borderTop: '1px solid rgba(0,195,255,0.15)', paddingTop: '8px' }}>
                    {sessions.length === 0 ? (
                        <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.75rem' }}>{t('exh_empty')}</p>
                    ) : (
                        sessions.map((s, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '0.78rem', borderBottom: i < sessions.length - 1 ? '1px dashed rgba(255,255,255,0.06)' : 'none' }}>
                                <span style={{ color: 'var(--text-light)' }}>
                                    {new Date(s.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                                </span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.weight}kg × {s.reps} <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>({s.sets} set)</span></span>
                                <span style={{ color: '#00c3ff', fontSize: '0.72rem' }}>e1RM {Math.round(s.e1rm)}kg</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default ActiveWorkoutView;
