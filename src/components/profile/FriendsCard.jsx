import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Users, UserPlus, Crown, X, Check, Trash2, Copy, RefreshCcw } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';
import {
    sendRequest, subscribeRequests, acceptRequest, declineRequest,
    subscribeFriendships, getFriendProfiles, removeFriend
} from '../../utils/friends';

/*
 * Arkadaslar karti: kendi kodun, kodla arkadas ekleme, gelen istekler ve
 * sadece arkadaslarin gordugu canli lider tablosu.
 * Giris yoksa bilgi karti gosterir (giris yaptiktan sonra acilir).
 * myCode prop'u BodyTracker'daki ensureProfile cagrisindan gelir.
 */
function FriendsCard({ currentUser, myCode, userName, userXP, userLevel }) {
    const { t } = useTranslation();
    const { toast, confirmDialog } = useToast();
    const [codeInput, setCodeInput] = useState('');
    const [sending, setSending] = useState(false);
    const [requests, setRequests] = useState([]);
    const [friendUids, setFriendUids] = useState([]);
    const [friendProfiles, setFriendProfiles] = useState([]);
    const [loadingBoard, setLoadingBoard] = useState(false);

    const isLoggedIn = Boolean(currentUser);

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
        const me = { uid: 'me', name: userName, xp: Number(userXP) || 0, level: Number(userLevel) || 1, isMe: true };
        const valid = friendUids.length > 0 ? friendProfiles.filter((p) => friendUids.includes(p.uid)) : [];
        const rows = [me, ...valid.map((p) => ({ ...p, isMe: false }))];
        rows.sort((a, b) => b.xp - a.xp);
        return rows;
    }, [userName, userXP, userLevel, friendProfiles, friendUids]);

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
                        <span style={{ flex: 1, color: '#fff', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.name} {row.isMe && <span style={{ color: '#00c3ff', fontSize: '0.7rem' }}>({t('fr_you')})</span>}
                        </span>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', flexShrink: 0 }}>
                            {t('fr_lvl_short')} {row.level}
                        </span>
                        <span style={{ color: '#adff2f', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>
                            {Number(row.xp || 0).toLocaleString()} XP
                        </span>
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
