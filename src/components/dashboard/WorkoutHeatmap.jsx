import React, { useMemo, useState } from 'react';
import { CalendarDays, Flame } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useCutoff } from '../../hooks/useToday';

// GitHub tarzi yillik antrenman isi haritasi.
// workoutHistory kayitlarini gun bazinda toplar; renk siddeti
// o gunki toplam set sayisina gore 0-4 arasi kademe alir.
function WorkoutHeatmap({ workoutHistory }) {
    const { t, lang } = useTranslation();
    const [selectedDay, setSelectedDay] = useState(null);

    // Bugunun gece yarisi (stabil memo bagimliligi icin useCutoff kullanilir)
    const todayCut = useCutoff(0);

    const { weeks, dayMap, monthLabels, totalActive, bestStreak } = useMemo(() => {
        const dayMap = new Map(); // 'YYYY-MM-DD' -> { sets, volume, count }
        if (workoutHistory && workoutHistory.length) {
            workoutHistory.forEach(w => {
                const d = new Date(w.date);
                if (isNaN(d.getTime())) return;
                const key = localDateKey(d);
                const volume = w.totalWeight || (w.maxWeight * w.bestReps * w.sets) || 0;
                const entry = dayMap.get(key) || { sets: 0, volume: 0, count: 0 };
                entry.sets += w.sets || 0;
                entry.volume += volume;
                entry.count += 1;
                dayMap.set(key, entry);
            });
        }

        // Izgara: son 53 hafta, satirlar pazartesiden baslar
        const today = new Date(todayCut);
        const monday = new Date(today);
        monday.setHours(0, 0, 0, 0);
        const dow = (monday.getDay() + 6) % 7; // 0=Pzt
        monday.setDate(monday.getDate() - dow - 7 * 52);

        const weeks = [];
        const monthLabels = [];
        let cursor = new Date(monday);
        let lastMonth = -1;
        for (let wk = 0; wk < 53; wk++) {
            const days = [];
            for (let d = 0; d < 7; d++) {
                if (cursor.getTime() > today.getTime()) {
                    days.push({ key: null, level: -1 }); // gelecek gun
                } else {
                    const key = localDateKey(cursor);
                    const info = dayMap.get(key);
                    const level = !info ? 0 : info.sets >= 20 ? 4 : info.sets >= 14 ? 3 : info.sets >= 7 ? 2 : 1;
                    days.push({ key, level, date: new Date(cursor), ...(info || {}) });
                    if (cursor.getMonth() !== lastMonth) {
                        monthLabels.push({ week: wk, month: cursor.getMonth() });
                        lastMonth = cursor.getMonth();
                    }
                }
                cursor = addDays(cursor, 1);
            }
            weeks.push(days);
        }

        // Aktif gun sayisi + en uzun seri (yalnizca son 1 yil)
        let totalActive = 0;
        let bestStreak = 0, run = 0, prev = null;
        const sortedKeys = [...dayMap.keys()].sort();
        for (const k of sortedKeys) {
            const d = parseKey(k);
            if (d < monday) continue;
            totalActive++;
            if (prev && (d - prev) === 86400000) {
                run++;
            } else {
                run = 1;
            }
            if (run > bestStreak) bestStreak = run;
            prev = d;
        }

        return { weeks, dayMap, monthLabels, totalActive, bestStreak };
    }, [workoutHistory, todayCut]);

    if (!workoutHistory || workoutHistory.length === 0) return null;

    const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const MONTHS = lang === 'tr' ? MONTHS_TR : MONTHS_EN;
    const DOW = lang === 'tr'
        ? ['Pzt', '', 'Çar', '', 'Cum', '', 'Paz']
        : ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

    const cellColor = (level) => {
        if (level <= 0) return 'rgba(255,255,255,0.05)';
        // tema uyumlu gradyan: mavi -> pembe
        return ['rgba(0,195,255,0.25)', 'rgba(0,195,255,0.5)', 'rgba(0,195,255,0.75)', 'linear-gradient(135deg,#00c3ff,#ff0088)'][level - 1];
    };

    return (
        <div className="glass-card slide-in" style={{ animationDelay: '0.05s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarDays size={20} color="var(--accent-primary)" /> {t('heatmap_title')}
                </h3>
                <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    <span title={t('heatmap_active_days')}><Flame size={13} style={{ verticalAlign: '-2px' }} /> {totalActive}</span>
                    <span title={t('heatmap_best_streak')}>🔥 {bestStreak}</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
                {/* Gun etiketleri */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '18px', flexShrink: 0 }}>
                    {DOW.map((d, i) => (
                        <span key={i} style={{ fontSize: '0.6rem', color: 'var(--text-light)', height: '12px', lineHeight: '12px' }}>
                            {d}
                        </span>
                    ))}
                </div>

                <div style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
                    {/* Ay etiketleri */}
                    <div style={{ display: 'flex', gap: '2px', height: '16px', marginBottom: '2px' }}>
                        {weeks.map((w, wi) => {
                            const m = monthLabels.find(ml => ml.week === wi);
                            return (
                                <div key={wi} style={{ width: '12px', flexShrink: 0, fontSize: '0.6rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                                    {m ? MONTHS[m.month] : ''}
                                </div>
                            );
                        })}
                    </div>

                    {/* Izgara */}
                    <div style={{ display: 'flex', gap: '2px' }}>
                        {weeks.map((days, wi) => (
                            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {days.map((day, di) => (
                                    <div
                                        key={day.key || `f-${wi}-${di}`}
                                        onClick={() => day.key && setSelectedDay(day.key === selectedDay ? null : day.key)}
                                        title={day.key ? `${day.key} — ${day.sets || 0} set` : ''}
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '3px',
                                            background: cellColor(day.level),
                                            cursor: day.key ? 'pointer' : 'default',
                                            outline: selectedDay === day.key ? '2px solid var(--accent-primary)' : 'none',
                                            flexShrink: 0
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>{t('heatmap_less')}</span>
                        {[0, 1, 2, 3, 4].map(l => (
                            <div key={l} style={{ width: '10px', height: '10px', borderRadius: '2px', background: cellColor(l), border: '1px solid rgba(255,255,255,0.05)' }} />
                        ))}
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>{t('heatmap_more')}</span>
                    </div>
                </div>
            </div>

            {/* Secili gun detayi */}
            {selectedDay && dayMap.get(selectedDay) && (
                <div style={{ marginTop: '0.8rem', padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    <strong style={{ color: '#fff' }}>{formatDate(selectedDay, lang)}</strong> — {dayMap.get(selectedDay).sets} {t('heatmap_sets')}, {Math.round(dayMap.get(selectedDay).volume).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} kg
                </div>
            )}
        </div>
    );
}

// --- yardimcilar ---
function localDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function parseKey(k) {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function addDays(d, n) {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + n);
    return nd;
}
function formatDate(key, lang) {
    const d = parseKey(key);
    return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default WorkoutHeatmap;
