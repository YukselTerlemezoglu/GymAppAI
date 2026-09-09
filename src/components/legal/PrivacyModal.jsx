import React from 'react';
import { ShieldCheck, Database, Cloud, Users, Trash2, Mail } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

// GIZLILIK POLITIKASI (KVKK uyumlu ozet)
// Modal olarak acilir; profil sayfasi + kayit ekranindan link verilir.
// Icerik urun gercegini yansitir: veriler oncelikle CIHAZDA saklanir;
// bulut senkronu ve arkadas sistemi yalnizca giris yapan kullanici icin
// aktiftir. Ucuncu taraf: Google Firebase (Auth + Firestore), Groq (AI).

// Bolum sarmalayicisi modul seviyesinde tanimli (render icinde degil)
function Section({ icon, title, children }) {
    return (
        <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                {icon}
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{title}</strong>
            </div>
            <div style={{ color: 'var(--text-light)', fontSize: '0.82rem', lineHeight: 1.6, paddingLeft: '2px' }}>
                {children}
            </div>
        </div>
    );
}

function PrivacyModal({ onClose }) {
    const { t } = useLanguage();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', width: '100%' }}>
                <div className="card-header">
                    <h3 className="card-title"><ShieldCheck size={20} color="#00ff88" /> {t('privacy_title')}</h3>
                    <button onClick={onClose} className="icon-btn" aria-label={t('privacy_close')}>✕</button>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 4px' }}>
                    <Section icon={<Database size={15} color="#00c3ff" />} title={t('privacy_local_title')}>
                        {t('privacy_local_body')}
                    </Section>

                    <Section icon={<Cloud size={15} color="#c084fc" />} title={t('privacy_cloud_title')}>
                        {t('privacy_cloud_body')}
                    </Section>

                    <Section icon={<Users size={15} color="#ffd700" />} title={t('privacy_social_title')}>
                        {t('privacy_social_body')}
                    </Section>

                    <Section icon={<Trash2 size={15} color="#ff6b81" />} title={t('privacy_delete_title')}>
                        {t('privacy_delete_body')}
                    </Section>

                    <Section icon={<Mail size={15} color="#00ff88" />} title={t('privacy_contact_title')}>
                        {t('privacy_contact_body')}
                    </Section>

                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
                        {t('privacy_updated')}
                    </p>
                </div>

                <button onClick={onClose} className="neon-btn-secondary" style={{ width: '100%', marginTop: '10px' }}>
                    {t('privacy_close')}
                </button>
            </div>
        </div>
    );
}

export default PrivacyModal;
