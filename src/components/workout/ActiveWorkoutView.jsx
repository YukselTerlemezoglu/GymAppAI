import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Trophy } from 'lucide-react';
import useLocalStorage from '../../hooks/useLocalStorage';

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
    setCompletedDays
}) {
    const [activeAiWorkoutTimer, setActiveAiWorkoutTimer] = useLocalStorage('gym_app_active_timer', 0); // in seconds
    const [activeAiWorkoutChecked, setActiveAiWorkoutChecked] = useLocalStorage('gym_app_active_checked', {}); // { 'exIdx_setIdx': true }
    const [showAiFeedbackModal, setShowAiFeedbackModal] = useState(false);
    const [aiFeedbackRpe, setAiFeedbackRpe] = useState('');
    const [aiFeedbackFatigue, setAiFeedbackFatigue] = useState('');
    const [feedbackValErr, setFeedbackValErr] = useState('');

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
            const updated = { ...prev, [key]: !prev[key] };
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
                avgRpe: parseFloat(aiFeedbackRpe) || 0
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

        setCurrentView('dashboard');
        setShowAiFeedbackModal(false);
    };

    if (!activeAiWorkoutDayParams) return null;

    return (
        <div className="app-container slide-in">
            <header className="top-bar fade-in" style={{ animationDelay: '0s', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.5)', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                    <button className="back-btn" onClick={() => setCurrentView('dashboard')}>
                        <ArrowLeft size={20} /> Çıkış
                    </button>
                    <div style={{ color: 'var(--accent-primary)', fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace', textShadow: '0 0 10px rgba(0,255,136,0.3)' }}>
                        {formatTime(activeAiWorkoutTimer)}
                    </div>
                </div>
                <h2 style={{ color: '#fff', textAlign: 'center' }}>🔥 {activeAiWorkoutDayParams.dayName}</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', textAlign: 'center' }}>Setleri bitirdikçe yanlarındaki kutucuklara tıklayın.</p>
            </header>

            <div className="workout-tracker-list fade-in" style={{ paddingBottom: '100px', paddingTop: '1rem' }}>
                {activeAiWorkoutDayParams?.exercises?.map((ex, eIdx) => {
                    const numSets = parseInt(ex.sets) || 1;
                    const setsArray = Array.from({ length: numSets });

                    return (
                        <div key={eIdx} className="glass-card" style={{ marginBottom: '1rem' }}>
                            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>{ex.name}</h3>

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
            {showAiFeedbackModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
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
                </div>
            )}
        </div>
    );
}

export default ActiveWorkoutView;
