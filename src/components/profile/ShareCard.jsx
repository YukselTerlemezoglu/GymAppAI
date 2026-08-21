import React, { useMemo, useRef, useState } from 'react';
import { Share2, Download, Trophy, Flame, Zap } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast, haptic } from '../ui/ToastProvider';

// Antrenman ozetini PNG kart olarak uretir (canvas) ve paylasir/indirir.
// Istatistikler: toplam antrenman, seri, toplam hacim, seviye/XP.
function ShareCard({ userName, userLevel, userXP, streak, workoutHistory }) {
    const { t, lang } = useTranslation();
    const { toast } = useToast();
    const canvasRef = useRef(null);
    const [preview, setPreview] = useState(null);

    const stats = useMemo(() => {
        if (!workoutHistory || workoutHistory.length === 0) return null;
        const totalVolume = workoutHistory.reduce((s, w) => s + (w.totalWeight || w.maxWeight * w.bestReps * w.sets || 0), 0);
        const totalWorkouts = new Set(workoutHistory.map(w => new Date(w.date).toDateString())).size;
        return { totalVolume, totalWorkouts };
    }, [workoutHistory]);

    if (!stats) return null;

    // Kart cizimi (1080x1350, dikey - Instagram story uyumlu)
    const generateCard = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d');

        // Arka plan: koyu gradyan
        const bg = ctx.createLinearGradient(0, 0, 1080, 1350);
        bg.addColorStop(0, '#0a0a14');
        bg.addColorStop(1, '#141428');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1080, 1350);

        // Neon isik efektleri
        const glow1 = ctx.createRadialGradient(180, 200, 20, 180, 200, 500);
        glow1.addColorStop(0, 'rgba(0,195,255,0.25)');
        glow1.addColorStop(1, 'rgba(0,195,255,0)');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, 1080, 1350);

        const glow2 = ctx.createRadialGradient(900, 1150, 20, 900, 1150, 500);
        glow2.addColorStop(0, 'rgba(255,0,136,0.22)');
        glow2.addColorStop(1, 'rgba(255,0,136,0)');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, 1080, 1350);

        // Baslik
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00c3ff';
        ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
        ctx.fillText('GYM APP AI', 540, 130);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '24px system-ui, -apple-system, sans-serif';
        ctx.fillText(lang === 'tr' ? 'ANTRENMAN KARNE' : 'WORKOUT REPORT CARD', 540, 175);

        // Isim + seviye
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
        ctx.fillText(String(userName || (lang === 'tr' ? 'Sporcu' : 'Athlete')), 540, 320);
        ctx.fillStyle = '#ff0088';
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${t('level')} ${userLevel} · ${userXP} XP`, 540, 370);

        // Istatislik kartlari (2x2)
        const cards = [
            { label: lang === 'tr' ? 'Antrenman' : 'Workouts', value: String(stats.totalWorkouts), color: '#00c3ff' },
            { label: lang === 'tr' ? 'Gün Seri' : 'Day Streak', value: String(streak || 0), color: '#ff9f43' },
            { label: lang === 'tr' ? 'Toplam Hacim' : 'Total Volume', value: `${Math.round(stats.totalVolume).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} kg`, color: '#2ed573' },
            { label: lang === 'tr' ? 'Seviye' : 'Level', value: String(userLevel), color: '#ff0088' }
        ];
        cards.forEach((c, i) => {
            const cx = 120 + (i % 2) * 460;
            const cy = 460 + Math.floor(i / 2) * 240;
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            roundRect(ctx, cx, cy, 400, 200, 24);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            roundRect(ctx, cx, cy, 400, 200, 24);
            ctx.stroke();

            ctx.fillStyle = c.color;
            ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
            ctx.fillText(c.value, cx + 200, cy + 105);
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.font = '26px system-ui, -apple-system, sans-serif';
            ctx.fillText(c.label, cx + 200, cy + 155);
        });

        // Alt serit
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '22px system-ui, -apple-system, sans-serif';
        ctx.fillText(lang === 'tr' ? 'Benimle antrenman yap → GymAppAI' : 'Train with me → GymAppAI', 540, 1240);

        return canvas;
    };

    const handleGenerate = () => {
        haptic(10);
        const canvas = generateCard();
        canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            setPreview(url);
        }, 'image/png');
    };

    const handleShare = async () => {
        const canvas = generateCard();
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        if (!blob) return;
        const file = new File([blob], 'gymapp-kart.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: 'GymAppAI' });
                toast.success(t('shc_shared'));
            } catch {
                /* kullanicinin iptali */
            }
        } else {
            // Paylasim yoksa indir
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gymapp-kart.png';
            a.click();
            URL.revokeObjectURL(url);
            toast.info(t('shc_downloaded'));
        }
    };

    return (
        <div className="glass-card slide-in">
            <h3 style={{ color: '#fff', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={20} color="#ff0088" /> {t('shc_title')}
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                {t('shc_hint')}
            </p>

            {preview && (
                <img src={preview} alt="share card" style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.15)' }} />
            )}

            <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button onClick={handleGenerate} className="neon-btn" style={{ flex: 1, padding: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} /> {t('shc_preview')}
                </button>
                <button onClick={handleShare} className="neon-btn" style={{ flex: 1, padding: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: 'rgba(255,0,136,0.1)', borderColor: '#ff0088', color: '#ff0088' }}>
                    <Download size={16} /> {t('shc_share')}
                </button>
            </div>
        </div>
    );
}

// Yuvarlak koseli dikdortgen (Path2D destekli)
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

export default ShareCard;
