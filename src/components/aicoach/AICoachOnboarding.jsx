import React, { useState } from 'react';
import { ArrowLeft, Bot, Loader2, Check } from 'lucide-react';


function AICoachOnboarding({ workoutHistory, setSavedAiProgram, setCurrentView }) {
    const [aiGoal, setAiGoal] = useState('');
    const [aiDays, setAiDays] = useState('');
    const [aiDuration, setAiDuration] = useState('');
    const [aiEquipment, setAiEquipment] = useState('');
    const [aiLevel, setAiLevel] = useState('');
    const [aiPriority, setAiPriority] = useState('');
    const [aiInjury, setAiInjury] = useState('');
    const [aiSplit, setAiSplit] = useState('Auto');
    const [aiCardio, setAiCardio] = useState('');
    const [aiResponseJson, setAiResponseJson] = useState(null);
    const [aiResponseErr, setAiResponseErr] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleGenerateProgram = async (e) => {
        e.preventDefault();
        if (!aiGoal || !aiDays || !aiDuration || !aiEquipment || !aiLevel || !aiCardio) {
            alert('Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        setIsAiLoading(true);
        setAiResponseJson(null);
        setAiResponseErr('');

        try {
            const API_KEYS = [
                import.meta.env.VITE_GROQ_API_KEY,
            ].filter(k => k && k !== "API_ANAHTARINIZI_BURAYA_YAZIN");

            // --- 4-Week Analytics Engine Calculation ---
            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

            const recentWorkouts = (workoutHistory || []).filter(w => new Date(w.date) >= fourWeeksAgo);

            const exerciseStats = {};
            let totalVolume = 0;

            recentWorkouts.forEach(w => {
                const vol = w.maxWeight * w.bestReps * w.sets;
                totalVolume += w.totalWeight || vol;
                if (!exerciseStats[w.exercise]) {
                    exerciseStats[w.exercise] = { maxW: 0, repsR: 0, rpes: [], records: [] };
                }

                const e1RM = Math.round(w.maxWeight * (1 + (w.bestReps / 30)));
                exerciseStats[w.exercise].records.push({ date: new Date(w.date), e1RM });

                if (w.maxWeight > exerciseStats[w.exercise].maxW) {
                    exerciseStats[w.exercise].maxW = w.maxWeight;
                    exerciseStats[w.exercise].repsR = w.bestReps;
                }
                if (w.avgRpe > 0) exerciseStats[w.exercise].rpes.push(w.avgRpe);
            });

            const analyticsSummary = Object.keys(exerciseStats).map(ex => {
                const stats = exerciseStats[ex];
                const avgRPE = stats.rpes.length > 0 ? (stats.rpes.reduce((a, b) => a + b, 0) / stats.rpes.length).toFixed(1) : "N/A";

                let trend = "N/A";
                if (stats.records.length > 1) {
                    stats.records.sort((a, b) => a.date - b.date);
                    const firstRM = stats.records[0].e1RM;
                    const lastRM = stats.records[stats.records.length - 1].e1RM;
                    if (lastRM > firstRM) trend = "UP";
                    else if (lastRM < firstRM) trend = "DOWN";
                    else trend = "FLAT";
                }
                const bestEpley = Math.round(stats.maxW * (1 + (stats.repsR / 30)));

                return {
                    exercise: ex,
                    bestSet: `${stats.maxW}kg x ${stats.repsR}`,
                    avgRPE: avgRPE,
                    estimated1RM: bestEpley,
                    trend: trend
                };
            });

            const analyticsJSON = JSON.stringify({
                weeklyAvgVolume: Math.round(totalVolume / 4) + " kg",
                exerciseTrends: analyticsSummary.slice(0, 10)
            });

            const strictRules = `
Kurallar (Split 'Auto' seçilmişse haftalık gün sayısına göre aşağıdaki split türünü ZORUNLU olarak uygula):
- 2 gün → FullBody A/B
- 3 gün → FullBody A/B/C
- 4 gün → Upper/Lower (Alt/Üst)
- 5 veya 6 gün → PPL (Push/Pull/Legs)
`;

            const prompt = `Sen profesyonel bir fitness antrenörüsün. Kullanıcının durumu ve hedefleri:
- Hedef: ${aiGoal}
- Haftada antrenman günü: ${aiDays} gün
- Antrenman süresi: ${aiDuration}
- Ekipman durumu: ${aiEquipment}
- Deneyim seviyesi: ${aiLevel}
- Öncelikli gelişmesini istediği kaslar: ${aiPriority || 'Belirtilmedi'}
- Sakatlık/Kısıtlama: ${aiInjury || 'Yok'}
- Split Tercihi: ${aiSplit === 'Auto' ? 'Otomatik' : aiSplit}
- Kardiyo tercihi: ${aiCardio}

[4-Week Analytics Engine (Geçmiş Performans Özeti)]:
${analyticsSummary.length > 0 ? analyticsJSON : 'Geçmiş idman verisi bulunamadı.'}
Eğer veri varsa, kişinin Estimated 1RM gücüne ve trendine (UP/DOWN) bakarak ağırlıkları ve set/tekrarları ona göre optimize et.

${aiSplit === 'Auto' ? strictRules : ''}

Lütfen bu kullanıcıya tam uygun, kurallara uyan otomatik bir egzersiz programı tablosu çıkar.
DİKKAT: CEvap GÖVDESİ (BODY) MUTLAKA AŞAĞIDAKİ GİBİ GEÇERLİ BİR JSON FORMATINDA OLMALIDIR. MARKDOWN KULLANMA. İÇERİSİNDE BAŞKA HİÇBİR YAZI, AÇIKLAMA OLMAYACAK SADECE JSON.

{
  "programName": "3 Günlük Hipertrofi Programı",
  "days": [
    {
      "dayName": "1. Gün (Göğüs & Triceps)",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 3,
          "reps": "8-12",
          "weight": "60"
        }
      ]
    }
  ]
}

Ağırlık (weight) değerini kullanıcının seviyesine göre (Örn: "Boş bar", "10", "40") tahmini bir KG rakamı olarak veya vücut ağırlığıysa "0" olarak ver. reps (tekrar) değerini "10" veya "8-12" şeklinde string ver.`;

            let textResult = null;
            let lastError = null;

            for (let i = 0; i < API_KEYS.length; i++) {
                console.log(`AI: Attempting generation with API Key standard index ${i}...`);
                try {
                    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${API_KEYS[i]}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            "model": "llama-3.3-70b-versatile",
                            "messages": [
                                {
                                    "role": "system",
                                    "content": "You are a professional fitness coach. You must ONLY output a valid JSON object matching the requested schema. No other text, no markdown formatting like ```json."
                                },
                                {
                                    "role": "user",
                                    "content": prompt
                                }
                            ],
                            "response_format": { "type": "json_object" },
                            "temperature": 0.5
                        })
                    });

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();

                    if (result.choices && result.choices.length > 0) {
                        textResult = result.choices[0].message.content;
                        console.log("AI: Generation successful via Groq!");
                        break;
                    } else {
                        throw new Error("Boş veya geçersiz Groq yanıtı.");
                    }
                } catch (err) {
                    console.error(`AI: Error with Key ${i}:`, err.message);
                    lastError = err;

                    // Failover logic: Continue to next key if it's a quota (429), forbidden (403), or bad request (400)
                    const msg = err.message.toLowerCase();
                    const isRetryable = msg.includes("429") ||
                        msg.includes("quota") ||
                        msg.includes("exhausted") ||
                        msg.includes("limit") ||
                        msg.includes("resource") ||
                        msg.includes("403") ||
                        msg.includes("400") ||
                        msg.includes("api key not valid");

                    if (isRetryable && i < API_KEYS.length - 1) {
                        console.warn("AI: Retrying with next available API key...");
                        continue;
                    } else {
                        // If it's the last key or not a retryable error, stop
                        break;
                    }
                }
            }

            if (!textResult) {
                throw new Error(lastError ? lastError.message : "AI could not generate content with any provided keys.");
            }

            let text = textResult;
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsedData = JSON.parse(text);
            parsedData.isAiGenerated = true;
            setAiResponseJson(parsedData);
        } catch (error) {
            console.error("AI Error:", error);
            if (error.message === "QUOTA_EXHAUSTED" || (error.message && error.message.includes("429"))) {
                setAiResponseErr("Yapay Zeka Koçu çok yoruldu (Google API Günlük Kotası Doldu). Biraz dinlenmesi lazım. Farklı API Key'ler ekleyerek devam edebilirsin!");
            } else {
                setAiResponseErr(`Üzgünüm, programını oluştururken bir hata oluştu: **${error.message}**`);
            }
        } finally {
            setIsAiLoading(false);
        }
    };

    const saveProgramToDashboard = () => {
        if (aiResponseJson) {
            setSavedAiProgram(aiResponseJson);
            setCurrentView('dashboard');
        }
    };

    return (
        <div className="app-container slide-in">
            <button className="back-btn" onClick={() => setCurrentView('dashboard')}>
                <ArrowLeft size={20} />
                Dashboard'a Dön
            </button>

            <header className="workout-header">
                <h2><Bot size={28} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Onboarding Wizard (Program Üretici)</h2>
                <p>Yapay zeka antrenörünle kusursuz programını tasarla</p>
            </header>

            <form onSubmit={handleGenerateProgram} className="glass-card" style={{ marginBottom: '2rem' }}>
                <div className="metrics-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group">
                        <label>Hedefin Nedir?</label>
                        <select className="neon-input" value={aiGoal} onChange={(e) => setAiGoal(e.target.value)} required style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                            <option value="">Seçiniz...</option>
                            <option value="Kas Geliştirme (Hipertrofi)">Kas Geliştirme (Hipertrofi)</option>
                            <option value="Güç Artışı">Güç Artışı</option>
                            <option value="Yağ Yakma (Definasyon)">Yağ Yakma (Definasyon)</option>
                            <option value="Genel Form / Kondisyon">Genel Form / Kondisyon</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Haftada Kaç Gün?</label>
                        <select className="neon-input" value={aiDays} onChange={(e) => setAiDays(e.target.value)} required style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                            <option value="">Seçiniz...</option>
                            <option value="2">2 Gün</option>
                            <option value="3">3 Gün</option>
                            <option value="4">4 Gün</option>
                            <option value="5">5 Gün</option>
                            <option value="6">6 Gün</option>
                        </select>
                    </div>
                </div>

                <div className="metrics-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group">
                        <label>Antrenman Süresi</label>
                        <select className="neon-input" value={aiDuration} onChange={(e) => setAiDuration(e.target.value)} required style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                            <option value="">Seçiniz...</option>
                            <option value="30-45 Dakika">30-45 Dakika</option>
                            <option value="45-60 Dakika">45-60 Dakika</option>
                            <option value="60-90 Dakika">60-90 Dakika</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Ekipman Durumu</label>
                        <select className="neon-input" value={aiEquipment} onChange={(e) => setAiEquipment(e.target.value)} required style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                            <option value="">Seçiniz...</option>
                            <option value="Spor Salonu (Tam Ekipman)">Spor Salonu (Tam Ekipman)</option>
                            <option value="Sadece Dumbbell">Sadece Dumbbell</option>
                            <option value="Vücut Ağırlığı (Ekipmansız)">Vücut Ağırlığı (Ekipmansız)</option>
                        </select>
                    </div>
                </div>

                <div className="metrics-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group">
                        <label>Deneyim Seviyen</label>
                        <select className="neon-input" value={aiLevel} onChange={(e) => setAiLevel(e.target.value)} required style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                            <option value="">Seçiniz...</option>
                            <option value="Başlangıç">Başlangıç</option>
                            <option value="Orta">Orta</option>
                            <option value="İleri">İleri</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Split Tercihi</label>
                        <select className="neon-input" value={aiSplit} onChange={(e) => setAiSplit(e.target.value)} style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                            <option value="Auto">AI Otomatik Seçsin</option>
                            <option value="FullBody">FullBody</option>
                            <option value="UpperLower">Upper/Lower</option>
                            <option value="PPL">PPL (Push/Pull/Legs)</option>
                        </select>
                    </div>
                </div>

                <div className="metrics-row" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="input-group">
                        <label>Kardiyo Tercihi</label>
                        <select className="neon-input" value={aiCardio} onChange={(e) => setAiCardio(e.target.value)} required style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                            <option value="">Seçiniz...</option>
                            <option value="Kardiyo İstemiyorum">Kardiyo İstemiyorum</option>
                            <option value="Hafif Kardiyo (Isınma/Soğuma için)">Hafif Kardiyo (Isınma/Soğuma için)</option>
                            <option value="Yoğun Kardiyo / HIIT">Yoğun Kardiyo / HIIT</option>
                        </select>
                    </div>
                </div>

                <div className="metrics-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group">
                        <label>Öncelikli Kas Grupları (Opsiyonal)</label>
                        <input type="text" className="neon-input" value={aiPriority} onChange={(e) => setAiPriority(e.target.value)} placeholder="Örn: Omuz, Karın" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
                    </div>
                    <div className="input-group">
                        <label>Sakatlık/Kısıtlama (Opsiyonal)</label>
                        <input type="text" className="neon-input" value={aiInjury} onChange={(e) => setAiInjury(e.target.value)} placeholder="Örn: Bel fıtığı, Diz ağrısı" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
                    </div>
                </div>

                <button type="submit" className="neon-btn-secondary" style={{ width: '100%', marginTop: '1rem', color: isAiLoading ? '#fff' : 'var(--accent-primary)', borderColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={isAiLoading}>
                    {isAiLoading ? <Loader2 className="spinner" size={20} /> : <Bot size={20} />}
                    {isAiLoading ? 'YAPAY ZEKA PROGRAMINI HESAPLIYOR...' : 'BANA PROGRAM ÇIKAR'}
                </button>
            </form>

            {aiResponseErr && (
                <div className="glass-card slide-in" style={{ padding: '1.5rem', marginBottom: '3rem', border: '1px solid var(--accent-danger)' }}>
                    <p style={{ color: 'var(--accent-danger)' }}>{aiResponseErr}</p>
                </div>
            )}

            {aiResponseJson && (
                <div className="ai-response glass-card slide-in" style={{ padding: '1.5rem', marginBottom: '3rem' }}>
                    <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Check size={24} /> {aiResponseJson.programName}
                    </h3>

                    <div className="json-program-preview" style={{ marginBottom: '2rem' }}>
                        {aiResponseJson.days.map((day, dIdx) => (
                            <div key={dIdx} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                                <h4 style={{ color: '#fff', marginBottom: '1rem' }}>{day.dayName}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {day?.exercises?.map((ex, eIdx) => (
                                        <div key={eIdx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-light)' }}>{ex.name}</span>
                                            <div style={{ display: 'flex', gap: '10px', fontSize: '0.9rem' }}>
                                                <span style={{ color: 'var(--accent-secondary)' }}>{ex.sets} Sets</span>
                                                <span style={{ color: 'var(--accent-primary)' }}>{ex.weight} kg</span>
                                                <span>{ex.reps} Reps</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={saveProgramToDashboard} className="neon-btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                        PROGRAMI ANA SAYFAYA KAYDET
                    </button>
                </div>
            )}
        </div>
    );
}

export default AICoachOnboarding;
