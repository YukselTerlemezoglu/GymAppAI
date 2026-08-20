import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { error as logError } from '../../utils/logger';
import { useToast } from '../ui/ToastProvider';

function DataSync() {
    const fileInputRef = useRef(null);
    const { toast, confirmDialog } = useToast();

    const exportData = () => {
        try {
            const dataToExport = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('gym_app_')) {
                    dataToExport[key] = localStorage.getItem(key);
                }
            }

            if (Object.keys(dataToExport).length === 0) {
                toast.warning("Dışa aktarılacak GymAppAI verisi bulunamadı.");
                return;
            }

            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `gymappai-yedek-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Verileriniz başarıyla dışa aktarıldı!");
        } catch (error) {
            logError("Export Error:", error);
            toast.error("Dışa aktarma sırasında bir hata oluştu.");
        }
    };

    const importData = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const ok = await confirmDialog({
            title: "İçe aktarma onayı",
            message: "İçe aktaracağınız bu veri, mevcut uygulama verilerinizin üzerine yazılacaktır. Devam etmek istiyor musunuz?",
            confirmLabel: "Üzerine yaz",
            cancelLabel: "Vazgeç",
            danger: true
        });

        if (ok) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);

                    Object.keys(importedData).forEach(key => {
                        if (key.startsWith('gym_app_')) {
                            localStorage.setItem(key, importedData[key]);
                        }
                    });

                    toast.success("Veriler başarıyla içe aktarıldı! Uygulama yenileniyor...");
                    setTimeout(() => window.location.reload(), 900);
                } catch (error) {
                    logError("Import Error:", error);
                    toast.error("Geçersiz dosya formatı. Lütfen geçerli bir yedek dosyası (JSON) seçin.");
                }
            };
            reader.readAsText(file);
        }

        // Clear input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="glass-card slide-in" style={{ border: '1px solid rgba(0, 195, 255, 0.2)', background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0, 195, 255, 0.05) 100%)', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Veri Yedekleme</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0 }}>Antrenman geçmişinizi, ölçümlerinizi ve seviyelerinizi JSON formatında cihazınıza kaydedin veya geri yükleyin.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={exportData} className="neon-btn" style={{ padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                    <Download size={18} /> Dışa Aktar
                </button>

                <button onClick={() => fileInputRef.current?.click()} className="neon-btn" style={{ background: 'rgba(255, 0, 136, 0.1)', borderColor: '#ff0088', color: '#ff0088', boxShadow: 'none', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                    <Upload size={18} /> İçe Aktar
                </button>
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={importData}
                />
            </div>
        </div>
    );
}

export default DataSync;
