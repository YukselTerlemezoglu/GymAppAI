import React, { useEffect, useState, useCallback } from 'react';
import { CloudUpload, History, Loader2, AlertTriangle, Cloud, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';
import { auth } from '../../services/firebase';
import {
    takeSnapshot, listSnapshots, restoreFromSnapshot,
    isSnapshotEnabled, setSnapshotEnabled, getLastSnapshotTs
} from '../../utils/snapshotScheduler';
import { validateBackup } from '../../utils/backup';

/**
 * Bulut Snapshot (oto-yedek) karti.
 * - Oto-yedek acma/kapama (varsayilan acik)
 * - "Simdi Yedekle" (force)
 * - "Yedeklerden Yukle": gun listesi -> onizleme -> onay -> replace restore
 * Sadece girisli kullaniciya gosterilir (misafire bulut yok).
 */
function CloudSnapshotCardInner({ t, toast, confirmDialog }) {
    const [enabled, setEnabled] = useState(isSnapshotEnabled());
    const [busy, setBusy] = useState(false);
    const [listOpen, setListOpen] = useState(false);
    const [list, setList] = useState(null); // null = yukleniyor, [] = bos
    const [restoring, setRestoring] = useState('');
    const [lastTs, setLastTs] = useState(getLastSnapshotTs());

    const uid = auth?.currentUser?.uid;

    const refreshList = useCallback(async () => {
        if (!uid) return;
        setList(null);
        try {
            const items = await listSnapshots(uid);
            setList(items);
        } catch {
            setList([]);
            toast.error(t('snap_list_fail'));
        }
    }, [uid, toast, t]);

    useEffect(() => {
        if (listOpen) {
            // ilk acilista yukleme durumu goster; alive flag'i unmount/uid
            // degisiminde state yazmayi keser
            let alive = true;
            (async () => {
                try {
                    const items = await listSnapshots(uid);
                    if (alive) setList(items);
                } catch {
                    if (alive) {
                        setList([]);
                        toast.error(t('snap_list_fail'));
                    }
                }
            })();
            return () => { alive = false; };
        }
        return undefined;
    }, [listOpen, uid, toast, t]);

    const handleToggle = () => {
        haptic(12);
        const next = !enabled;
        setEnabled(next);
        setSnapshotEnabled(next);
        toast.info(next ? t('snap_enabled_on') : t('snap_enabled_off'));
    };

    const handleBackupNow = async () => {
        if (!uid) return;
        setBusy(true);
        haptic(10);
        try {
            const ok = await takeSnapshot(uid, { force: true });
            if (ok) {
                setLastTs(getLastSnapshotTs());
                toast.success(t('snap_now_ok'));
            } else {
                toast.error(t('snap_now_fail'));
            }
        } catch {
            toast.error(t('snap_now_fail'));
        } finally {
            setBusy(false);
        }
    };

    const handleRestore = async (day) => {
        if (!uid) return;
        const parsed = (() => {
            const item = (list || []).find((s) => s.day === day);
            if (!item) return null;
            try { return JSON.parse(item.payload); } catch { return null; }
        })();
        const stats = parsed ? (validateBackup(parsed).stats || {}) : {};

        const ok = await confirmDialog({
            title: t('snap_restore_title'),
            message: t('snap_restore_msg', {
                day,
                workouts: stats.workouts ?? 0,
                level: stats.level ?? '-',
                coins: stats.coins ?? 0
            }),
            confirmLabel: t('snap_restore_yes'),
            cancelLabel: t('snap_cancel'),
            danger: true
        });
        if (!ok) return;

        setRestoring(day);
        haptic([20, 30, 20]);
        try {
            await restoreFromSnapshot(uid, day);
            toast.success(t('snap_restore_ok'));
            setTimeout(() => window.location.reload(), 900);
        } catch (err) {
            const reason = String(err?.message || '').split(':')[1] || '';
            toast.error(reason ? t('snap_restore_invalid') : t('snap_restore_fail'));
            setRestoring('');
        }
    };

    const lastStr = lastTs ? new Date(lastTs).toLocaleString() : t('snap_never');

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-light)' }}>
                    <Cloud size={15} /> {t('snap_last_backup')} <strong>{lastStr}</strong>
                </div>
                {/* Toggle */}
                <button
                    onClick={handleToggle}
                    role="switch"
                    aria-checked={enabled}
                    aria-label={t('snap_toggle_aria')}
                    style={{
                        width: '44px', height: '24px', flexShrink: 0,
                        borderRadius: '12px',
                        border: `1px solid ${enabled ? 'rgba(0,195,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
                        background: enabled ? 'rgba(0,195,255,0.25)' : 'rgba(255,255,255,0.06)',
                        position: 'relative', cursor: 'pointer'
                    }}
                >
                    <span style={{
                        position: 'absolute', top: '2px',
                        left: enabled ? '22px' : '2px',
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: enabled ? '#00c3ff' : '#888',
                        transition: 'all 0.2s'
                    }} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
                <button onClick={handleBackupNow} disabled={busy} className="neon-btn" style={{ fontSize: '0.85rem', padding: '0.7rem' }}>
                    {busy ? <Loader2 size={16} className="spinner" /> : <CloudUpload size={16} />} {t('snap_now_btn')}
                </button>
                <button onClick={() => { setListOpen(v => !v); haptic(8); }} className="neon-btn-secondary" style={{ fontSize: '0.85rem', padding: '0.7rem' }}>
                    <History size={16} /> {t('snap_list_btn')}
                </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cloud size={13} /> {t('snap_hint')}
            </p>

            {listOpen && (
                <div style={{ marginTop: '12px', padding: '14px', borderRadius: '12px', background: 'rgba(0,195,255,0.06)', border: '1px solid rgba(0,195,255,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <strong style={{ color: '#00c3ff', fontSize: '0.9rem' }}>{t('snap_list_title')}</strong>
                        <button onClick={refreshList} className="icon-btn" aria-label={t('snap_refresh')} disabled={!uid}>
                            <RefreshCw size={15} />
                        </button>
                    </div>
                    {list === null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '8px 0' }}>
                            <Loader2 size={15} className="spinner" /> {t('snap_loading')}
                        </div>
                    )}
                    {list && list.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{t('snap_empty')}</p>
                    )}
                    {list && list.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {list.map((s) => {
                                let stats = {};
                                try { stats = (validateBackup(JSON.parse(s.payload)).stats) || {}; } catch { /* bozuk satir atlanir */ }
                                return (
                                    <div key={s.day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 10px', borderRadius: '10px', background: 'rgba(0,195,255,0.05)' }}>
                                        <div style={{ fontSize: '0.8rem' }}>
                                            <strong>{s.day}</strong>
                                            <span style={{ color: 'var(--text-muted)' }}> · {t('snap_item_stats', { workouts: stats.workouts ?? 0, level: stats.level ?? '-' })}</span>
                                            {stats.trimmedHistory > 0 && (
                                                <span style={{ color: '#ffb020', fontSize: '0.72rem' }}> · {t('snap_trimmed', { count: stats.trimmedHistory })}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRestore(s.day)}
                                            disabled={restoring === s.day || !!restoring}
                                            className="neon-btn"
                                            style={{ fontSize: '0.75rem', padding: '0.45rem 0.8rem' }}
                                        >
                                            {restoring === s.day ? <Loader2 size={13} className="spinner" /> : <CloudUpload size={13} />} {t('snap_restore_btn')}
                                        </button>
                                    </div>
                                );
                            })}
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangle size={12} /> {t('snap_replace_warn')}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

function CloudSnapshotCard() {
    const { t } = useTranslation();
    const { toast, confirmDialog } = useToast();
    const user = auth?.currentUser;

    // Misafir: bulut yedegi yok — kart gizli (BK-[A7b] ayri toast akisi)
    if (!user) return null;

    return (
        <div className="glass-card slide-in" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
                <h3 className="card-title">
                    <CloudUpload size={20} color="#00c3ff" /> {t('snap_title')}
                </h3>
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.82rem', margin: '-4px 0 12px 0' }}>
                {t('snap_subtitle')}
            </p>
            <CloudSnapshotCardInner t={t} toast={toast} confirmDialog={confirmDialog} />
        </div>
    );
}

export default CloudSnapshotCard;
