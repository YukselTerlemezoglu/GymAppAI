import React, { useRef, useState } from 'react';
import { Download, Upload, ShieldCheck, FileJson, AlertTriangle, Check, X } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';
import { downloadBackup, validateBackup, restoreBackup } from '../../utils/backup';

/*
 * Yedekleme kartinin icerigi: indir + geri yukle.
 * Geri yukleme akisi: dosya sec -> dogrula -> onizleme (istatistik) ->
 * mod sec (birlestir/degistir) -> uygula -> sayfa yenile.
 */
function BackupCardInner({ t, toast, confirmDialog }) {
    const fileRef = useRef(null);
    const [pending, setPending] = useState(null); // { backup, stats }
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const handleDownload = async () => {
        haptic(10);
        const result = await downloadBackup();
        if (result === 'shared') toast.success(t('bkp_shared_ok'));
        else if (result === 'downloaded') toast.success(t('bkp_download_ok'));
        else toast.info(t('bkp_download_cancel'));
    };

    const handleFile = async (file) => {
        if (!file) return;
        setError('');
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const check = validateBackup(parsed);
            if (!check.valid) {
                setError(t('bkp_invalid_' + check.reason) || t('bkp_invalid_format'));
                haptic([30, 40, 30]);
                return;
            }
            setPending({ backup: parsed, stats: check.stats });
            haptic(12);
        } catch {
            setError(t('bkp_invalid_format'));
        }
    };

    const applyRestore = async (mode) => {
        if (!pending) return;
        if (mode === 'replace') {
            const ok = await confirmDialog({
                title: t('bkp_replace_title'),
                message: t('bkp_replace_msg'),
                confirmLabel: t('bkp_replace_yes'),
                cancelLabel: t('bkp_cancel'),
                danger: true
            });
            if (!ok) return;
        }
        setBusy(true);
        try {
            const res = await restoreBackup(pending.backup, mode);
            toast.success(t('bkp_restore_ok', { count: res.restored }));
            setPending(null);
            // Veriler yeniden okunsun diye kisa gecikmeyle yenile
            setTimeout(() => window.location.reload(), 900);
        } catch {
            toast.error(t('bkp_restore_fail'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
                <button onClick={handleDownload} className="neon-btn" style={{ fontSize: '0.85rem', padding: '0.7rem' }}>
                    <Download size={16} /> {t('bkp_export_btn')}
                </button>
                <button onClick={() => fileRef.current?.click()} className="neon-btn-secondary" style={{ fontSize: '0.85rem', padding: '0.7rem' }}>
                    <Upload size={16} /> {t('bkp_import_btn')}
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    style={{ display: 'none' }}
                    onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
                />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={13} /> {t('bkp_hint')}
            </p>

            {error && (
                <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.35)', color: '#ff6b81', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={15} /> {error}
                </div>
            )}

            {pending && (
                <div style={{ marginTop: '12px', padding: '14px', borderRadius: '12px', background: 'rgba(0,195,255,0.06)', border: '1px solid rgba(0,195,255,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <FileJson size={17} color="#00c3ff" />
                        <strong style={{ color: '#00c3ff', fontSize: '0.9rem' }}>{t('bkp_preview_title')}</strong>
                    </div>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.82rem', margin: '0 0 12px 0' }}>
                        {t('bkp_preview_stats', {
                            workouts: pending.stats?.workouts ?? 0,
                            level: pending.stats?.level ?? '-',
                            coins: pending.stats?.coins ?? 0
                        })}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => applyRestore('merge')} disabled={busy} className="neon-btn" style={{ flex: 1, minWidth: '140px', fontSize: '0.82rem', padding: '0.65rem' }}>
                            <Check size={15} /> {t('bkp_merge_btn')}
                        </button>
                        <button onClick={() => applyRestore('replace')} disabled={busy} className="neon-btn-secondary" style={{ flex: 1, minWidth: '140px', fontSize: '0.82rem', padding: '0.65rem', borderColor: 'rgba(255,71,87,0.4)', color: '#ff6b81' }}>
                            <AlertTriangle size={15} /> {t('bkp_replace_btn')}
                        </button>
                        <button onClick={() => setPending(null)} disabled={busy} className="icon-btn" aria-label={t('bkp_cancel')}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function BackupCard() {
    const { t } = useTranslation();
    const { toast, confirmDialog } = useToast();

    return (
        <div className="glass-card slide-in" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
                <h3 className="card-title">
                    <Download size={20} color="#00ff88" /> {t('bkp_title')}
                </h3>
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.82rem', margin: '-4px 0 12px 0' }}>
                {t('bkp_subtitle')}
            </p>
            <BackupCardInner t={t} toast={toast} confirmDialog={confirmDialog} />
        </div>
    );
}

export default BackupCard;
