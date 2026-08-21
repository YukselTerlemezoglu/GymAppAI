import React, { useMemo } from 'react';
import { Crown, Medal, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

// Lider tablosu: kullanici + seviyeye gore uretilmis sanal rakipler.
// Not: sunucu tarafli gercek sosyal katman yok; bu tablo kullanicinin
// seviyesine gore dinamik olusturulur, kisisel motivasyon icindir.
const RIVALS = [
    { id: 'r1', name_tr: 'Demir Yürek', name_en: 'Iron Heart', offset: 0.22 },
    { id: 'r2', name_tr: 'Çelik Bilek', name_en: 'Steel Wrist', offset: 0.08 },
    { id: 'r3', name_tr: 'Kaya', name_en: 'Rocky', offset: -0.05 },
    { id: 'r4', name_tr: 'Fırtına', name_en: 'Storm', offset: -0.18 },
    { id: 'r5', name_tr: 'Şimşek', name_en: 'Bolt', offset: -0.32 }
];

// XP'den seviye: App ile ayni formul (lvl*500 + lvl*100)
const xpForLevel = lvl => lvl * 500 + lvl * 100;

function Leaderboard({ userName, userLevel, userXP }) {
    const { t, lang } = useTranslation();

    // Kullanicinin mevcut seviye icindeki ilerleme yuzdesi
    const reqXP = xpForLevel(userLevel);
    const pct = Math.min(100, Math.max(0, (userXP / reqXP) * 100));

    const rows = useMemo(() => {
        // Rakipler kullanicinin XP'si etrafinda dagitilir; sabit tohumla
        // oturumlar arasi tutarlilik (isim + seviye bazli deterministik)
        const seedBase = (String(userName).length * 37 + userLevel * 101) % 97;
        const list = RIVALS.map((r, i) => {
            const seed = Math.abs(Math.sin(seedBase + i * 13.7)) % 1; // 0-1 deterministik
            const xp = Math.max(0, Math.round(userXP * (1 + r.offset) + seed * 250));
            const lvl = Math.max(1, Math.floor(xp / 600) + 1);
            return { id: r.id, name: lang === 'tr' ? r.name_tr : r.name_en, xp, lvl, isUser: false };
        });
        list.push({ id: 'me', name: userName || (lang === 'tr' ? 'Sen' : 'You'), xp: userXP, lvl: userLevel, isUser: true });
        return list.sort((a, b) => b.xp - a.xp);
    }, [userName, userXP, userLevel, lang]);

    const myRank = rows.findIndex(r => r.isUser) + 1;

    return (
        <div className="glass-card slide-in">
            <h3 style={{ color: '#fff', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={20} color="#ffd700" /> {t('lb_title')}
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.75rem', margin: '0 0 0.8rem 0', opacity: 0.7 }}>
                {t('lb_subtitle')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {rows.map((r, i) => (
                    <div key={r.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px',
                        background: r.isUser ? 'rgba(0,195,255,0.12)' : 'rgba(255,255,255,0.03)',
                        border: r.isUser ? '1px solid rgba(0,195,255,0.4)' : '1px solid transparent'
                    }}>
                        <span style={{ width: '26px', textAlign: 'center', fontWeight: 'bold', color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-light)', fontSize: '0.9rem' }}>
                            {i < 3 ? <Medal size={16} /> : i + 1}
                        </span>
                        <span style={{ flex: 1, color: r.isUser ? '#fff' : 'var(--text-light)', fontWeight: r.isUser ? 'bold' : 400, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.name} {r.isUser && <span style={{ color: 'var(--accent-primary)', fontSize: '0.72rem' }}>({t('lb_you')})</span>}
                        </span>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.78rem', flexShrink: 0 }}>{t('level')} {r.lvl}</span>
                        <span style={{ color: r.isUser ? 'var(--accent-primary)' : 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: r.isUser ? 'bold' : 400, flexShrink: 0 }}>{r.xp.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} XP</span>
                    </div>
                ))}
            </div>

            {myRank > 1 && (
                <p style={{ color: '#00ff88', fontSize: '0.8rem', margin: '10px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ChevronRight size={14} />
                    {t('lb_gap_text')
                        .replace('{gap}', (rows[myRank - 2].xp - userXP).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US'))
                        .replace('{name}', rows[myRank - 2].name)}
                </p>
            )}
            {myRank === 1 && (
                <p style={{ color: '#ffd700', fontSize: '0.8rem', margin: '10px 0 0 0' }}>
                    👑 {t('lb_first_text')}
                </p>
            )}

            {/* Seviye ilerleme hatirlatmasi */}
            <div style={{ marginTop: '10px' }}>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #00c3ff, #ff0088)', transition: 'width 0.5s ease' }} />
                </div>
                <p style={{ color: 'var(--text-light)', fontSize: '0.7rem', margin: '4px 0 0 0', textAlign: 'center' }}>
                    {t('lb_next_level')}: {Math.max(0, reqXP - userXP).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} XP
                </p>
            </div>
        </div>
    );
}

export default Leaderboard;
