import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Users, UserPlus, Crown, X, Check, Trash2, Copy, RefreshCcw, Swords } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';
import { totalXpForLevel } from '../../utils/levelSystem';
import {
    sendRequest, subscribeRequests, acceptRequest, declineRequest,
    subscribeFriendships, getFriendProfiles, removeFriend, setDuelTarget, getMyProfile
} from '../../utils/friends';
import { findBuddy } from '../../utils/buddy';
import { duelState, pastDuelResult, duelReward, duelClaimKey, lastWeekKey, computeWeekStats } from '../../utils/duel';
import { getWeekKey } from '../../utils/consistency';

// Benim duel hedefimin localStorage aynasi ("gym_app_duel_target")
const DUEL_TARGET_LS = 'gym_app_duel_target';
function readMyDuelTarget() {
    try {
        const raw = localStorage.getItem(DUEL_TARGET_LS);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.uid === 'string' && typeof parsed.week === 'string') return parsed;
        return null;
    } catch { return null; }
}

/*
 * Arkadaslar karti: kendi kodun, kodla arkadas ekleme, gelen istekler ve
 * sadece arkadaslarin gordugu canli lider tablosu.
 * Giris yoksa bilgi karti gosterir (giris yaptiktan sonra acilir).
 * myCode prop'u BodyTracker'daki ensureProfile cagrisindan gelir.
 */
function FriendsCard({ currentUser, myCode, userName, userXP, userLevel, activeBuddyId, nameStyle, workoutHistory, setUserCoins }) {
    const { t } = useTranslation();
    const { toast, confirmDialog } = useToast();
    const [codeInput, setCodeInput] = useState('');
    const [sending, setSending] = useState(false);
    const [requests, setRequests] = useState([]);
    const [friendUids, setFriendUids] = useState([]);
    const [friendProfiles, setFriendProfiles] = useState([]);
    const [loadingBoard, setLoadingBoard] = useState(false);
    const [claimingDuel, setClaimingDuel] = useState(false);

    // Benim duel hedefim: Firestore profilinde yazar; ayna olarak localStorage
    // tutulur (hizli okuma; setDuelTarget her ikisine de yazar). Ref degil state:
    // davet gonderilince UI aninda guncellensin.
    const [myDuelTarget, setMyDuelTarget] = useState(readMyDuelTarget);

    const isLoggedIn = Boolean(currentUser);
    const currentWeek = useMemo(() => getWeekKey(new Date()) || '', []);
    const prevWeek = useMemo(() => lastWeekKey(new Date()), []);

    // Ayna senkronizasyonu: yeni cihazda / depolama temizlendiginde ayna bos
    // kalirken Firestore'da hedef durabilir — aktif duel "bekleyen davet"
    // olarak yanlis gosterilir ve gecmis duel odulleri talil edilemez hale
    // gelir. Giris yapildiginda tek seferlik kendi profilinden duelTarget
    // okunup ayna onarilir.
    useEffect(() => {
        if (!isLoggedIn) return;
        let alive = true;
        getMyProfile().then((p) => {
            if (!alive) return;
            const remote = p?.duelTarget || null;
            if (remote && typeof remote.uid === 'string' && typeof remote.week === 'string') {
                setMyDuelTarget((prev) => {
                    if (prev?.uid === remote.uid && prev?.week === remote.week) return prev;
                    try { localStorage.setItem(DUEL_TARGET_LS, JSON.stringify(remote)); } catch { /* kota */ }
                    return remote;
                });
            }
        });
        return () => { alive = false; };
    }, [isLoggedIn]);

    // Gelen istekleri canli dinle
    useEffect(() => {
        if (!isLoggedIn) return;
        const unsub = subscribeRequests(setRequests);
        return () => unsub();
    }, [isLoggedIn]);

    // Arkadasliklari canli dinle
    useEffect(() => {
        if (!isLoggedIn) return;
        const unsub = subscribeFriendships(setFriendUids);
        return () => unsub();
    }, [isLoggedIn]);

    // Arkadas uids degistiginde profilleri cek (canli: anlik XP degisimleri yansir)
    // Not: bosalma durumu render'da turetilir (asagida), efektte senkron setState yok.
    useEffect(() => {
        if (!isLoggedIn || friendUids.length === 0) return;
        let alive = true;
        const load = async () => {
            setLoadingBoard(true);
            const profiles = await getFriendProfiles(friendUids);
            if (alive) {
                setFriendProfiles(profiles);
                setLoadingBoard(false);
            }
        };
        load();
        // 60 sn'de bir tazele (abonelik profilleri kapsamadigi icin polling)
        const timer = setInterval(load, 60000);
        return () => { alive = false; clearInterval(timer); };
    }, [isLoggedIn, friendUids]);

    // Beni ilgilendiren her degisimde siralamayi hesapla
    // (friendUids bos ise eski profiller gosterilmez - arkadas silinince aninda duser)
    const board = useMemo(() => {
        const myTotal = totalXpForLevel(Number(userLevel) || 1) + (Number(userXP) || 0);
        const me = { uid: 'me', name: userName, totalXp: myTotal, level: Number(userLevel) || 1, isMe: true, buddyId: activeBuddyId || null };
        const valid = friendUids.length > 0 ? friendProfiles.filter((p) => friendUids.includes(p.uid)) : [];
        const rows = [me, ...valid.map((p) => ({ ...p, totalXp: totalXpForLevel(Number(p.level) || 1) + (Number(p.xp) || 0), isMe: false }))];
        rows.sort((a, b) => b.totalXp - a.totalXp);
        return rows;
    }, [userName, userXP, userLevel, friendProfiles, friendUids, activeBuddyId]);

    // ---- HAFTALIK DUELLO ----
    // Benim profilim: weekStats'i workoutHistory'den yerel hesaplariz (tek kaynak),
    // duelTarget'i FriendsCard kendi profilinde tutmak icin publish edilir.
    // prevWeekStats: gecen haftanin arsivi (odul tahsiti dogru hesaplanir).
    const myProfile = useMemo(() => ({
        uid: currentUser?.uid || 'me',
        weekStats: computeWeekStats(workoutHistory),
        prevWeekStats: computeWeekStats(workoutHistory, new Date(), prevWeek),
        duelTarget: myDuelTarget
    }), [currentUser, workoutHistory, myDuelTarget, prevWeek]);

    // Dost profillerinden aktif duel cikarimi (ucuz dongu; compiler memoize eder)
    let duelInfo = null;
    for (const p of friendProfiles) {
        const st = duelState(myProfile, p, currentWeek);
        if (st.invited) { duelInfo = { profile: p, state: st }; break; }
    }

    // Gecmis hafta karsilikli duel sonuclari (odul tahsiti; localstorage'da kilitli)
    const pastResults = friendProfiles.flatMap((p) => {
        const res = pastDuelResult(myProfile, p, prevWeek);
        if (!res) return [];
        const claim = duelClaimKey(prevWeek, [currentUser?.uid, p.uid].sort().join('_'));
        const already = localStorage.getItem(`gym_app_${claim}`);
        if (already) return [];
        return [{ profile: p, result: res, claimKey: claim }];
    });

    const inviteDuel = async (friendUid, friendName) => {
        haptic(15);
        const res = await setDuelTarget(friendUid, currentWeek);
        if (res.ok) {
            const target = { uid: friendUid, week: currentWeek };
            setMyDuelTarget(target);
            try { localStorage.setItem(DUEL_TARGET_LS, JSON.stringify(target)); } catch { /* kota */ }
            toast.success(t('fr_duel_invited', { name: friendName }));
        } else {
            toast.error(t('fr_net_error'));
        }
    };

    const claimDuelReward = async (entry) => {
        if (claimingDuel) return;
        setClaimingDuel(true);
        haptic([20, 40, 20]);
        try {
            const finalAmount = duelReward(entry.result.winner);
            setUserCoins?.((prev) => (Number(prev) || 0) + finalAmount);
            localStorage.setItem(`gym_app_${entry.claimKey}`, '1');
            toast.success(t('fr_duel_claimed', { amount: finalAmount }));
        } finally {
            setClaimingDuel(false);
        }
    };

    const copyCode = async () => {
        haptic(8);
        try {
            await navigator.clipboard.writeText(myCode || '');
            toast.success(t('fr_code_copied'));
        } catch {
            toast.error(t('fr_copy_fail'));
        }
    };

    const handleSend = useCallback(async () => {
        if (sending) return;
        const code = codeInput.trim().toUpperCase();
        if (code.length !== 6) {
            toast.warning(t('fr_code_format'));
            return;
        }
        setSending(true);
        const res = await sendRequest(code);
        setSending(false);
        if (res.error) {
            const msgs = {
                format: 'fr_code_format',
                notfound: 'fr_not_found',
                self: 'fr_self_code',
                already: 'fr_already_friends',
                network: 'fr_net_error',
                auth: 'fr_login_needed'
            };
            toast.error(t(msgs[res.error] || 'fr_net_error'));
            return;
        }
        haptic(15);
        setCodeInput('');
        if (res.accepted) {
            toast.success(t('fr_match_now', { name: res.profile.name }));
        } else {
            toast.success(t('fr_request_sent', { name: res.profile.name }));
        }
    }, [codeInput, sending, toast, t]);

    const handleAccept = async (fromUid, fromName) => {
        haptic(15);
        const res = await acceptRequest(fromUid);
        if (res.ok) toast.success(t('fr_match_now', { name: fromName }));
        else toast.error(t('fr_net_error'));
    };

    const handleDecline = async (fromUid) => {
        haptic(8);
        await declineRequest(fromUid);
        toast.info(t('fr_declined'));
    };

    const handleRemove = async (uid, name) => {
        const ok = await confirmDialog({
            title: t('fr_remove_title'),
            message: t('fr_remove_msg', { name }),
            confirmLabel: t('fr_remove_confirm'),
            cancelLabel: t('aw_exit_cancel'),
            danger: true
        });
        if (!ok) return;
        const res = await removeFriend(uid);
        if (res.ok) toast.info(t('fr_removed'));
        else toast.error(t('fr_net_error'));
    };

    const refreshBoard = () => {
        haptic(8);
        setLoadingBoard(true);
        getFriendProfiles(friendUids).then((p) => {
            setFriendProfiles(p);
            setLoadingBoard(false);
        });
    };

    /* ---- Giris yok ---- */
    if (!isLoggedIn) {
        return (
            <div className="glass-card slide-in" style={{ border: '1px solid rgba(0,195,255,0.25)' }}>
                <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} color="#00c3ff" /> {t('fr_title')}
                </h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                    {t('fr_login_hint')}
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card slide-in" style={{ border: '1px solid rgba(0,195,255,0.25)' }}>
            <h3 style={{ color: '#fff', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#00c3ff" /> {t('fr_title')}
            </h3>

            {/* Kodum */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.9rem' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                        {t('fr_my_code')}
                    </div>
                    <div style={{
                        fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '6px',
                        color: '#00c3ff', background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
                        padding: '8px 14px', display: 'inline-block', border: '1px solid rgba(0,195,255,0.3)'
                    }}>
                        {myCode || '···'}
                    </div>
                </div>
                <button
                    onClick={copyCode}
                    title={t('fr_copy_code')}
                    className="neon-btn"
                    style={{ padding: '10px', borderColor: 'rgba(0,195,255,0.4)', color: '#00c3ff', background: 'rgba(0,195,255,0.1)', flexShrink: 0 }}
                >
                    <Copy size={16} />
                </button>
            </div>

            {/* Kodla ekle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '0.4rem' }}>
                <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                    placeholder={t('fr_enter_code')}
                    maxLength={6}
                    style={{
                        flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '16px',
                        fontFamily: 'monospace', letterSpacing: '3px', textTransform: 'uppercase', outline: 'none'
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={sending}
                    className="neon-btn"
                    style={{
                        padding: '10px 14px', borderColor: '#00ff88', color: '#00ff88',
                        background: 'rgba(0,255,136,0.1)', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0
                    }}
                >
                    <UserPlus size={16} /> {t('fr_add_btn')}
                </button>
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.72rem', margin: '0 0 1rem 0' }}>
                {t('fr_code_hint')}
            </p>

            {/* Gelen istekler */}
            {requests.length > 0 && (
                <div style={{ marginBottom: '1rem', border: '1px solid rgba(255,193,7,0.3)', borderRadius: '10px', padding: '10px', background: 'rgba(255,193,7,0.05)' }}>
                    <div style={{ color: '#ffc107', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '8px' }}>
                        {t('fr_requests_title')} ({requests.length})
                    </div>
                    {requests.map((r) => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                            <span style={{ flex: 1, color: '#fff', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {r.fromName || 'Athlete'}
                            </span>
                            <button
                                onClick={() => handleAccept(r.from, r.fromName)}
                                title={t('fr_accept')}
                                className="neon-btn"
                                style={{ padding: '6px 9px', borderColor: '#00ff88', color: '#00ff88', background: 'rgba(0,255,136,0.1)' }}
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={() => handleDecline(r.from)}
                                title={t('fr_decline')}
                                className="neon-btn"
                                style={{ padding: '6px 9px', borderColor: '#ff4757', color: '#ff4757', background: 'rgba(255,71,87,0.1)' }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* HAFTALIK DUELLO */}
            {duelInfo && (
                <div style={{
                    marginBottom: '1rem', borderRadius: '12px', padding: '12px',
                    background: duelInfo.state.active ? 'rgba(255,0,136,0.08)' : 'rgba(255,171,0,0.06)',
                    border: `1px solid ${duelInfo.state.active ? 'rgba(255,0,136,0.4)' : 'rgba(255,171,0,0.35)'}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Swords size={16} color={duelInfo.state.active ? '#ff0088' : '#ffab00'} />
                        <strong style={{ color: '#fff', fontSize: '0.88rem' }}>
                            {duelInfo.state.active ? t('fr_duel_active_title', { name: duelInfo.profile.name }) : t('fr_duel_pending_title', { name: duelInfo.profile.name })}
                        </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-light)', fontSize: '0.7rem' }}>{t('fr_you')}</div>
                            <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '1.15rem' }}>{duelInfo.state.myScore}</div>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>VS</span>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-light)', fontSize: '0.7rem' }}>{duelInfo.profile.name}</div>
                            <div style={{ color: '#ff6b81', fontWeight: 'bold', fontSize: '1.15rem' }}>{duelInfo.state.otherScore}</div>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.72rem', margin: '8px 0 0 0', textAlign: 'center' }}>
                        {duelInfo.state.active ? t('fr_duel_active_hint') : t('fr_duel_pending_hint', { name: duelInfo.profile.name })}
                    </p>
                </div>
            )}

            {/* GECMIS HAFTA DUELLO ODULU */}
            {pastResults.map((entry) => (
                <div key={entry.claimKey} style={{
                    marginBottom: '1rem', borderRadius: '12px', padding: '12px',
                    background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.4)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Crown size={15} color="#ffd700" />
                        <strong style={{ color: '#fff', fontSize: '0.85rem' }}>
                            {entry.result.winner === 'me'
                                ? t('fr_duel_won_title', { name: entry.profile.name })
                                : entry.result.winner === 'other'
                                    ? t('fr_duel_lost_title', { name: entry.profile.name })
                                    : t('fr_duel_tie_title', { name: entry.profile.name })}
                        </strong>
                    </div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.78rem', marginBottom: '10px' }}>
                        {entry.result.myScore} - {entry.result.otherScore}
                    </div>
                    <button
                        onClick={() => claimDuelReward(entry)}
                        disabled={claimingDuel}
                        className="neon-btn"
                        style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', borderColor: '#ffd700', color: '#ffd700', background: 'rgba(255,215,0,0.1)' }}
                    >
                        {t('fr_duel_claim_btn', { amount: duelReward(entry.result.winner) })}
                    </button>
                </div>
            ))}

            {/* Lider tablosu */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Crown size={14} color="#ffd700" /> {t('fr_board_title')}
                </div>
                <button
                    onClick={refreshBoard}
                    title={t('fr_refresh')}
                    className="neon-btn"
                    style={{ padding: '6px 9px', borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-light)', background: 'transparent' }}
                >
                    <RefreshCcw size={13} />
                </button>
            </div>

            {loadingBoard && (
                <div style={{ color: 'var(--text-light)', fontSize: '0.78rem', marginBottom: '8px' }}>
                    {t('fr_loading')}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {board.map((row, i) => (
                    <div
                        key={row.uid}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 10px', borderRadius: '8px',
                            background: row.isMe ? 'rgba(0,195,255,0.12)' : 'rgba(255,255,255,0.03)',
                            border: row.isMe ? '1px solid rgba(0,195,255,0.4)' : '1px solid rgba(255,255,255,0.06)'
                        }}
                    >
                        <span style={{
                            width: '26px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0,
                            color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-light)'
                        }}>
                            {i + 1}
                        </span>
                        <span style={{ flex: 1, color: '#fff', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {row.isMe && activeBuddyId && (
                                <span style={{ fontSize: '0.95rem' }} title={t('shop_buddy_title')}>
                                    {findBuddy(activeBuddyId)?.icon}
                                </span>
                            )}
                            <span style={{
                                color: row.isMe && nameStyle ? nameStyle.cssColor : undefined,
                                textShadow: row.isMe && nameStyle ? nameStyle.cssTextShadow : undefined
                            }}>
                                {row.name}
                            </span>
                            {row.isMe && <span style={{ color: '#00c3ff', fontSize: '0.7rem' }}>({t('fr_you')})</span>}
                        </span>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', flexShrink: 0 }}>
                            {t('fr_lvl_short')} {row.level}
                        </span>
                        <span style={{ color: '#adff2f', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>
                            {Number(row.totalXp || 0).toLocaleString()} XP
                        </span>
                        {!row.isMe && !(duelInfo?.state.active) && (
                            <button
                                onClick={() => inviteDuel(row.uid, row.name)}
                                title={t('fr_duel_invite')}
                                style={{
                                    background: 'rgba(255,0,136,0.12)', border: '1px solid rgba(255,0,136,0.35)',
                                    color: '#ff0088', cursor: 'pointer', padding: '4px', borderRadius: '6px',
                                    display: 'flex', flexShrink: 0
                                }}
                            >
                                <Swords size={13} />
                            </button>
                        )}
                        {!row.isMe && (
                            <button
                                onClick={() => handleRemove(row.uid, row.name)}
                                title={t('fr_remove_friend')}
                                style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
                                    color: 'var(--text-light)', opacity: 0.6, display: 'flex', flexShrink: 0
                                }}
                            >
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {friendProfiles.length === 0 && (
                <p style={{ color: 'var(--text-light)', fontSize: '0.78rem', margin: '0.75rem 0 0 0', textAlign: 'center' }}>
                    {t('fr_empty_board')}
                </p>
            )}
        </div>
    );
}

export default FriendsCard;
