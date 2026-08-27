import React, { useMemo } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Trophy, Zap } from 'lucide-react';
import { seasonInfo, seasonSP, leagueForSP, nextLeague, LEAGUES, SEASON_EPOCH } from '../../utils/season';

// SEZON KARTI (Faz 5a).
// 8 haftalik sezon + 1 hafta off-season dongusu. SP birikimi gosterilir;
// lig progress bar'i ile bir sonraki lige kalan gosterilir.
// SP canli hesaplanir: seasonSP(workoutHistory) + kayitli seasonSP tabani.

function SeasonCard({ seasonData, workoutHistory }) {
    const { t, lang } = useTranslation();

    const info = useMemo(() => seasonInfo(SEASON_EPOCH), []);

    const { sp, liveTotal, league, next, progressPct } = useMemo(() => {
        const base = seasonData?.seasonSP || 0;
        const live = seasonSP(workoutHistory).sp; // sezon icindeki tum kayitlar
        const sp = Math.max(base, live);
        const total = (seasonData?.totalSP || 0) + sp;
        const lg = leagueForSP(total);
        const nl = nextLeague(total);
        // Lig ici ilerleme: bu ligden sonraki lige kalan
        const span = nl ? nl.minSP - lg.minSP : 1;
        const into = nl ? total - lg.minSP : 1;
        const pct = nl ? Math.min(100, Math.round((into / span) * 100)) : 100;
        return { sp, liveTotal: total, league: lg, next: nl, progressPct: pct };
    }, [seasonData, workoutHistory]);

    const leagueHist = seasonData?.history || [];

    return (
        <div className="glass-card slide-in" style={{ border: `1px solid ${league.color}55`, background: `linear-gradient(145deg, rgba(0,0,0,0.5) 0%, ${league.color}14 100%)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                    <Trophy size={18} color={league.color} />
                    {t('season_title')} #{info.number}
                </h3>
                {info.isOffSeason ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '999px' }}>
                        🌴 {t('season_offseason')}
                    </span>
                ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '999px' }}>
                        {t('season_week')} {info.week}/8 · {info.daysLeft} {t('season_days_left')}
                    </span>
                )}
            </div>

            {/* Lig rozeti + SP */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.7rem' }}>
                <div style={{ fontSize: '2rem' }}>{league.icon}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ color: league.color, fontWeight: 800, fontSize: '1rem' }}>
                        {t('league_' + league.id)}
                    </div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.78rem' }}>
                        {sp.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} SP · {t('season_total')}: {liveTotal.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                    </div>
                </div>
                <Zap size={20} color={league.color} />
            </div>

            {/* Lig ilerleme cubugu */}
            {next ? (
                <>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
                        <div style={{ height: '100%', width: `${progressPct}%`, background: `linear-gradient(90deg, ${league.color}, ${next.color})`, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                    </div>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.72rem', margin: 0, textAlign: 'right' }}>
                        {next.icon} {t('league_' + next.id)}: {(next.minSP - liveTotal).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} SP
                    </p>
                </>
            ) : (
                <p style={{ color: '#ff0088', fontSize: '0.78rem', margin: 0, textAlign: 'center', fontWeight: 700 }}>
                    👑 {t('season_max_league')}
                </p>
            )}

            {/* Gecmis sezonlar (varsa kucuk satir) */}
            {leagueHist.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                    {leagueHist.slice(-3).map(h => {
                        const lg = LEAGUES.find(l => l.id === h.league) || LEAGUES[0];
                        return (
                            <span key={h.season} style={{ fontSize: '0.68rem', color: 'var(--text-light)', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '6px' }}>
                                S{h.season}: {lg.icon} {h.sp} SP
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default SeasonCard;
