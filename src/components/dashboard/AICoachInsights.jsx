import React, { useMemo } from 'react';
import { Bot, Clock, Activity, Flame } from 'lucide-react';

function AICoachInsights({ workoutHistory }) {
    const localAiCoachData = useMemo(() => {
        if (!workoutHistory || workoutHistory.length === 0) {
            return {
                todaysPlan: {
                    title: "Full Body Başlangıç",
                    desc: "Henüz bir geçmişin yok. Tüm vücudu çalıştıran temel hareketlerle (Squat, Pushup, Row) başlamaya ne dersin?"
                },
                progression: {
                    title: "İlk Adımı At",
                    desc: "Düzenli antrenman girdikçe burada Plateau analizi ve ağırlık artırma önerileri göreceksin."
                },
                microGoal: "Bugün 3 Set Squat + 3 Set Şınav"
            };
        }

        // 1. Today's Plan (Bugün Ne Yapayım?)
        const last3DaysEx = workoutHistory.slice(0, 10).map(w => (w.exercise || '').toLowerCase());
        let target = "Full Body";
        let targetType = "Hypertrophy";
        if (last3DaysEx.some(x => x.includes('bench') || x.includes('push'))) {
            if (last3DaysEx.some(x => x.includes('pull') || x.includes('row') || x.includes('lat'))) {
                target = "Bacak (Legs)";
                targetType = "Güç";
            } else {
                target = "Sırt & Biceps (Pull)";
                targetType = "Hacim";
            }
        } else {
            target = "Göğüs & Triceps (Push)";
            targetType = "Dayanıklılık";
        }

        const todaysPlan = {
            title: `${target} Odaklı`,
            desc: `Son günlerdeki yorgunluğunu hesaba katarak bugün ${targetType} odaklı bir ${target} antrenmanı öneriyorum.`
        };

        // 2. Progression (Plateau Analizi)
        const exCounts = {};
        workoutHistory.forEach(w => {
            exCounts[w.exercise] = (exCounts[w.exercise] || 0) + 1;
        });
        let topEx = Object.keys(exCounts).reduce((a, b) => exCounts[a] > exCounts[b] ? a : b, "");

        const topExHistory = workoutHistory.filter(w => w.exercise === topEx).slice(0, 5);
        let progTitle = "Ağırlık Artırma Vakti";
        let progDesc = `${topEx} hareketinde harika gidiyorsun. Sonraki idmanda ağırlığı 2.5kg artırmayı veya 1 tekrar fazla yapmayı dene.`;

        if (topExHistory.length >= 3) {
            const w1 = topExHistory[0].maxWeight;
            const w2 = topExHistory[1].maxWeight;
            const w3 = topExHistory[2].maxWeight;
            if (w1 === w2 && w2 === w3 && w1 > 0) {
                progTitle = "Plateau (Duraklama) Tespit Edildi";
                progDesc = `${topEx} hareketinde son 3 idmandır aynı ağırlıktasın (${w1}kg). Bir sonraki seans Deload (ağırlığı %15 düşür) yapmanı veya ağırlığı sabit tutup set sayısını artırmanı öneririm.`;
            }
        }

        const progression = { title: progTitle, desc: progDesc };

        // 3. Akıllı Mikro Hedef / Tavsiye Sistemi (Eski rastgele sistem yerine geçmişe dayalı)
        let dynamicGoal = "Bugün 3 Set Squat + 3 Set Şınav ile güne zinde başla.";

        if (workoutHistory.length > 0) {
            // Son idman verileri
            const lastWorkout = workoutHistory[0];
            const lastWorkoutDate = new Date(lastWorkout.date);
            const daysSinceLastWorkout = Math.floor((new Date() - lastWorkoutDate) / (1000 * 60 * 60 * 24));
            const avgRecentRpe = workoutHistory.slice(0, 5).reduce((a, b) => a + (b.avgRpe || 0), 0) / Math.min(workoutHistory.length, 5);
            const thisWeekWorkouts = workoutHistory.filter(w => {
                const diffTime = Math.abs(new Date() - new Date(w.date));
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            }).length;

            if (daysSinceLastWorkout >= 4) {
                dynamicGoal = `🚀 ${daysSinceLastWorkout} gündür salona gitmiyorsun. Bugün sadece 20 dakikalık hafif bir antrenman yapıp o ivmeyi geri kazanmaya ne dersin?`;
            } else if (avgRecentRpe >= 8.5) {
                dynamicGoal = `🛌 Son idmanların seni çok zorlamış (Ort RPE: ${avgRecentRpe.toFixed(1)}). Bugün ağırlıklara saldırmak yerine hafif kardiyo veya stretching (esneme) yapıp dinlenmeni tavsiye ederim.`;
            } else if (thisWeekWorkouts >= 15) { // 15 hareket/set kaydı vs.
                dynamicGoal = `🔥 Bu hafta salonda adeta şov yaptın! Kaslarının büyümesi için bugünü Off-Day (dinlenme günü) ilan etmeyi düşünebilirsin.`;
            } else if (lastWorkout.totalReps < 15) {
                dynamicGoal = `⚡ Son idmanında hacmin (Volume) biraz düşük kalmış gibi. Bugün yapacağın idmanda her harekete ekstra 1 set daha ekleyerek kasları şaşırt!`;
            } else {
                dynamicGoal = `🎯 ${topEx} hareketinde harikasın. Bugünkü hedefin geçen seferki ${topEx} rekoruna +1 tekrar daha eklemek olsun. Başarabilirsin!`;
            }
        }

        return { todaysPlan, progression, microGoal: dynamicGoal };
    }, [workoutHistory]);

    // useMemo artık doğrudan string dönüyor, random'a gerek kalmadı
    const microGoal = localAiCoachData.microGoal;

    return (
        <section className="fade-in" style={{ animationDelay: '0.15s', marginBottom: '2rem' }}>
            <div className="section-header">
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={20} color="var(--accent-primary)" /> Yapay Zeka Koçu Önerileri
                </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {/* Bugün Ne Yapayım? */}
                <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-primary)', padding: '1.2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} color="var(--accent-primary)" /> 1) Bugün Ne Yapayım?
                    </h3>
                    <p style={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>{localAiCoachData.todaysPlan.title}</p>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {localAiCoachData.todaysPlan.desc}
                    </p>
                </div>

                {/* Progression Önerisi */}
                <div className="glass-card" style={{ borderLeft: '4px solid #00c3ff', padding: '1.2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={16} color="#00c3ff" /> 2) Progression (Gelişim)
                    </h3>
                    <p style={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>{localAiCoachData.progression.title}</p>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {localAiCoachData.progression.desc}
                    </p>
                </div>

                {/* Motivasyon / Mikro Hedef */}
                <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-warning)', padding: '1.2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Flame size={16} color="var(--accent-warning)" /> 3) Mikro Hedef
                    </h3>
                    <div style={{ padding: '1rem', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '8px', border: '1px dashed var(--accent-warning)', textAlign: 'center' }}>
                        <p style={{ color: 'var(--accent-warning)', fontWeight: 'bold', fontSize: '1.05rem' }}>
                            "{microGoal}"
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AICoachInsights;
