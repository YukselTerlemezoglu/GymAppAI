import React, { useState } from 'react';
import { Calculator, ArrowLeft, Info } from 'lucide-react';

function OneRepMaxCalc({ onBack }) {
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');

    const calculate1RM = () => {
        const w = parseFloat(weight);
        const r = parseFloat(reps);
        if (!w || !r || w <= 0 || r <= 0) return 0;
        if (r === 1) return w;
        // Epley Formula: 1RM = Weight * (1 + Reps/30)
        return Math.round(w * (1 + r / 30));
    };

    const calculateBrzycki = () => {
        const w = parseFloat(weight);
        const r = parseFloat(reps);
        if (!w || !r || w <= 0 || r <= 0) return 0;
        if (r === 1) return w;
        // Brzycki Formula: 1RM = Weight * (36 / (37 - Reps))
        return Math.round(w * (36 / (37 - r)));
    };

    const oneRepMax = calculate1RM();
    const brzycki = calculateBrzycki();

    // Calculate percentages based on Epley formula
    const percentages = [
        { percent: 100, reps: 1, label: '1RM' },
        { percent: 95, reps: 2, label: '2RM' },
        { percent: 90, reps: 4, label: '4RM' },
        { percent: 85, reps: 6, label: '6RM' },
        { percent: 80, reps: 8, label: '8RM' },
        { percent: 75, reps: 10, label: '10RM' },
        { percent: 70, reps: 12, label: '12RM' },
    ];

    return (
        <div className="fade-in" style={{ padding: '20px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button
                    onClick={onBack}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calculator size={24} color="var(--accent-primary)" />
                    1RM Hesaplayıcı
                </h2>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
                    Bir egzersizdeki kaldırabileceğin maksimum ağırlığı (1 Tekrar Maksimum - 1RM) hesaplamak için kullandığın ağırlığı ve tekrar sayısını gir.
                </p>

                <div className="orm-inputs" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '0.9rem' }}>Ağırlık (kg)</label>
                        <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="Örn: 80"
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '0.9rem' }}>Tekrar</label>
                        <input
                            type="number"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            placeholder="Örn: 8"
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                        />
                    </div>
                </div>

                {oneRepMax > 0 && (
                    <div className="fade-in" style={{ marginTop: '20px' }}>
                        <div style={{ textAlign: 'center', background: 'linear-gradient(145deg, rgba(0,195,255,0.1), rgba(255,0,136,0.1))', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '5px' }}>Tahmini 1RM (Maksimum Ağırlık)</div>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '5px' }}>
                                {oneRepMax} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>kg</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                <Info size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                Epley: {oneRepMax}kg | Brzycki: {brzycki}kg
                            </div>
                        </div>

                        <h3 style={{ marginTop: '25px', marginBottom: '15px', fontSize: '1.1rem', color: '#fff' }}>Yüzdelik Dilimler</h3>
                        <div className="orm-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {percentages.map((p, idx) => {
                                const calculatedWeight = Math.round(oneRepMax * (p.percent / 100));
                                return (
                                    <div key={idx} style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderLeft: `3px solid ${p.percent >= 90 ? '#ff0088' : p.percent >= 80 ? '#00c3ff' : '#00ff88'}`
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#fff' }}>%{p.percent}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{p.reps} Tekrar</div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                                            {calculatedWeight} kg
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

export default OneRepMaxCalc;
