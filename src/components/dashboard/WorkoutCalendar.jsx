import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Flame, Trophy } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

// AYLIK TAKVIM GORUNUMU (Faz 2a).
// workoutHistory kayitlarini ay izgarasinda renk kodlu gosterir:
//   - gri nokta: antrenman yok
//   - mavi kademeli dolgu: set sayisina gore yoğunluk
//   - altin halka: o gun PR kirildi (totalWeight rekoru kaba kontrol)
// Ustte ay ozeti: antrenman gunu, toplam set, toplam hacim.

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DOW_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function WorkoutCalendar({ workoutHistory, prDates }) {
    const { t, lang } = useTranslation();
    const today = new Date();
    const [monthOffset, setMonthOffset] = useState(0);

    const MONTHS = lang === 'tr' ? MONTHS_TR : MONTHS_EN;
    const DOW = lang === 'tr' ? DOW_TR : DOW_EN;

    const { cells, summary, monthLabel } = useMemo(() => {
        // Hedef ay
        const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
        const y = base.getFullYear();
        const m = base.getMonth();

        // Gun bazli toplama
        const dayMap = new Map();
        (Array.isArray(workoutHistory) ? workoutHistory : []).forEach(w => {
            if (!w || !w.date) return;
            const d = new Date(w.date);
            if (isNaN(d.getTime()) || d.getFullYear() !== y || d.getMonth() !== m) return;
            const key = d.getDate();
            const entry = dayMap.get(key) || { sets: 0, volume: 0, count: 0 };
            entry.sets += parseInt(w.sets) || 0;
            entry.volume += w.totalWeight || (w.maxWeight * w.bestReps * w.sets) || 0;
            entry.count += 1;
            dayMap.set(key, entry);
        });

        // PR gunleri (Set olarak tarih -> 'YYYY-MM-DD')
        const prSet = new Set(
            (Array.isArray(prDates) ? prDates : []).map(d => {
                const dt = new Date(d);
                return isNaN(dt.getTime()) ? null : `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
            }).filter(Boolean)
        );

        // Izgara hucreleri: ayin 1. gununun hafta ici konumu (pzt=0)
        const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

        const cells = [];
        for (let i = 0; i < firstDow; i++) cells.push(null); // bos dolgu
        for (let day = 1; day <= daysInMonth; day++) {
            const info = dayMap.get(day);
            const dateKey = `${y}-${m}-${day}`;
            const isPr = prSet.has(dateKey);
            const isFuture = new Date(y, m, day) > today;
            cells.push({
                day,
                sets: info?.sets || 0,
                volume: info?.volume || 0,
                count: info?.count || 0,
                isPr,
                isToday: dateKey === todayKey,
                isFuture
            });
        }

        // Ay ozeti
        let totalSets = 0, totalVolume = 0, activeDays = 0;
        dayMap.forEach(e => { totalSets += e.sets; totalVolume += e.volume; activeDays += 1; });

        return {
            cells,
            summary: { activeDays, totalSets, totalVolume: Math.round(totalVolume) },
            monthLabel: `${MONTHS[m]} ${y}`
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workoutHistory, prDates, monthOffset, lang]);

    const cellStyle = (c) => {
        if (!c) return { visibility: 'hidden' };
        const base = {
            aspectRatio: '1 / 1',
            borderRadius: '10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative', fontSize: '0.85rem',
            border: c.isToday ? '2px solid #00c3ff' : '1px solid rgba(255,255,255,0.06)',
            opacity: c.isFuture ? 0.35 : 1
        };
        if (c.sets > 0) {
            const level = c.sets >= 25 ? 4 : c.sets >= 16 ? 3 : c.sets >= 8 ? 2 : 1;
            const alpha = [0, 0.22, 0.4, 0.6, 0.85][level];
            base.background = `rgba(0,195,255,${alpha})`;
            base.color = level >= 3 ? '#001a26' : '#fff';
            base.fontWeight = level >= 3 ? 700 : 500;
        } else {
            base.background = 'rgba(255,255,255,0.03)';
            base.color = 'var(--text-light)';
        }
        return base;
    };

    return (
        <div className="glass-card slide-in" style={{ marginTop: '1rem', border: '1px solid rgba(0, 195, 255, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarDays size={20} color="var(--accent-primary)" /> {t('calendar_title')}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={() => setMonthOffset(o => o - 1)} aria-label="prev-month" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', padding: '4px 8px', display: 'flex' }}>
                        <ChevronLeft size={16} />
                    </button>
                    <span style={{ color: '#fff', fontWeight: 600, minWidth: '110px', textAlign: 'center', fontSize: '0.9rem' }}>{monthLabel}</span>
                    <button onClick={() => setMonthOffset(o => Math.min(0, o + 1))} aria-label="next-month" disabled={monthOffset >= 0} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: monthOffset >= 0 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: monthOffset >= 0 ? 'default' : 'pointer', padding: '4px 8px', display: 'flex' }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Ay ozeti */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}><Flame size={13} style={{ verticalAlign: '-2px' }} color="#ff6b81" /> {summary.activeDays} {t('calendar_days')}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>📦 {summary.totalSets} {t('calendar_sets_total')}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>🏋️ {summary.totalVolume.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} kg</span>
            </div>

            {/* Gun etiketleri */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
                {DOW.map((d, i) => (
                    <span key={i} style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 600 }}>{d}</span>
                ))}
            </div>

            {/* Takvim izgarasi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {cells.map((c, i) => c ? (
                    <div
                        key={i}
                        style={cellStyle(c)}
                        title={c.sets > 0 ? `${c.day} — ${c.sets} ${t('calendar_sets_total')}` : `${c.day}`}
                    >
                        {c.day}
                        {c.isPr && (
                            <span style={{ position: 'absolute', top: '2px', right: '3px', fontSize: '0.6rem' }}>
                                <Trophy size={10} color="#ffd700" />
                            </span>
                        )}
                    </div>
                ) : <div key={i} />)}
            </div>

            {/* Lejant */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '0.7rem', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>{t('musclemap_low')}</span>
                {[0.03, 0.22, 0.4, 0.6, 0.85].map((a, i) => (
                    <div key={i} style={{ width: 14, height: 9, borderRadius: 3, background: `rgba(0,195,255,${a})`, border: '1px solid rgba(255,255,255,0.05)' }} />
                ))}
                <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>{t('musclemap_high')}</span>
                <span style={{ fontSize: '0.65rem', color: '#ffd700', marginLeft: '8px' }}><Trophy size={10} style={{ verticalAlign: '-1px' }} /> {t('calendar_pr_day')}</span>
            </div>
        </div>
    );
}

export default WorkoutCalendar;
