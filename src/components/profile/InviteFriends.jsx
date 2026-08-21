import React, { useState } from 'react';
import { UserPlus, Copy, Check, MessageCircle } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';

// Arkadas davet karti: uygulama linkini kopyalar / mesajlasma
// uygulamalariyla paylasir. Link kullanici kodunu tasir (?add=KOD);
// yeni kullanici giris yaptiginda otomatik arkadaslik istegi gider.
function InviteFriends({ userName, myCode }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://gym-app-ai-snowy.vercel.app';
    const INVITE_LINK = myCode ? `${APP_URL}/?add=${myCode}` : APP_URL;
    const INVITE_TEXT = t('inv_message').replace('{name}', userName || '');

    const copyLink = async () => {
        haptic(8);
        try {
            await navigator.clipboard.writeText(INVITE_LINK);
            setCopied(true);
            toast.success(t('inv_copied'));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API yoksa fallback
            const ta = document.createElement('textarea');
            ta.value = INVITE_LINK;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                toast.success(t('inv_copied'));
                setTimeout(() => setCopied(false), 2000);
            } catch {
                toast.error(t('inv_copy_fail'));
            }
            document.body.removeChild(ta);
        }
    };

    const shareWhatsApp = () => {
        haptic(8);
        window.open(`https://wa.me/?text=${encodeURIComponent(INVITE_TEXT + ' ' + INVITE_LINK)}`, '_blank');
    };

    const shareGeneric = async () => {
        haptic(8);
        if (navigator.share) {
            try {
                await navigator.share({ title: 'GymAppAI', text: INVITE_TEXT, url: INVITE_LINK });
                toast.success(t('inv_shared'));
            } catch {
                /* kullanici iptali */
            }
        } else {
            copyLink();
        }
    };

    return (
        <div className="glass-card slide-in" style={{ border: '1px solid rgba(0,195,255,0.25)' }}>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="#00c3ff" /> {t('inv_title')}
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                {t('inv_hint')}
            </p>

            {/* Link kutusu */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
                padding: '8px 12px', marginBottom: '0.8rem',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <span style={{ color: 'var(--text-light)', fontSize: '0.8rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {INVITE_LINK}
                </span>
                <button
                    onClick={copyLink}
                    style={{
                        background: copied ? 'rgba(0,255,136,0.15)' : 'rgba(0,195,255,0.15)',
                        border: `1px solid ${copied ? '#00ff88' : 'rgba(0,195,255,0.4)'}`,
                        color: copied ? '#00ff88' : '#00c3ff',
                        borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem',
                        fontWeight: 'bold', flexShrink: 0
                    }}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t('inv_copied_btn') : t('inv_copy_btn')}
                </button>
            </div>

            {/* Paylas butonlari */}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                    onClick={shareWhatsApp}
                    className="neon-btn"
                    style={{ flex: 1, padding: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: 'rgba(37,211,102,0.12)', borderColor: '#25d366', color: '#25d366', fontSize: '0.85rem' }}
                >
                    <MessageCircle size={15} /> WhatsApp
                </button>
                <button
                    onClick={shareGeneric}
                    className="neon-btn"
                    style={{ flex: 1, padding: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                    <UserPlus size={15} /> {t('inv_share_btn')}
                </button>
            </div>
        </div>
    );
}

export default InviteFriends;
