/**
 * Tema tanımları - lookup tablosu.
 *
 * App.jsx içindeki 90+ satırlık if/else zinciri yerine, her tema
 * bir key'dir; CSS değişkenleri Object.entries ile uygulanır.
 *
 * Yeni tema eklemek için: aşağıya yeni bir key ekleyin. App.jsx
 * DEĞİŞTİRİLMEMELİDİR.
 */

export const THEMES = {
    default: {
        '--accent-primary': '#00ff88',
        '--accent-secondary': '#00d4ff',
        '--bg-dark': '#0f1115',
        '--bg-card': 'rgba(26, 29, 36, 0.7)',
        '--bg-card-hover': 'rgba(36, 40, 50, 0.8)',
        '--gradient-1': 'rgba(0, 255, 136, 0.08)',
        '--gradient-2': 'rgba(0, 212, 255, 0.08)',
        '--neon-glow': '0 0 20px rgba(0, 255, 136, 0.15)',
        '--neon-glow-strong': '0 0 30px rgba(0, 255, 136, 0.4)',
    },
    cyberpunk: {
        '--accent-primary': '#ff00ff',
        '--accent-secondary': '#00ffff',
        '--bg-dark': '#090014',
        '--bg-card': 'rgba(25, 0, 45, 0.7)',
        '--bg-card-hover': 'rgba(40, 0, 70, 0.8)',
        '--gradient-1': 'rgba(255, 0, 255, 0.1)',
        '--gradient-2': 'rgba(0, 255, 255, 0.1)',
        '--neon-glow': '0 0 20px rgba(255, 0, 255, 0.2)',
        '--neon-glow-strong': '0 0 30px rgba(255, 0, 255, 0.5)',
    },
    blood: {
        '--accent-primary': '#ff4757',
        '--accent-secondary': '#ff6b81',
        '--bg-dark': '#1a0505',
        '--bg-card': 'rgba(45, 10, 10, 0.8)',
        '--bg-card-hover': 'rgba(70, 15, 15, 0.9)',
        '--gradient-1': 'rgba(255, 71, 87, 0.1)',
        '--gradient-2': 'rgba(255, 107, 129, 0.1)',
        '--neon-glow': '0 0 20px rgba(255, 71, 87, 0.2)',
        '--neon-glow-strong': '0 0 30px rgba(255, 71, 87, 0.5)',
    },
    gold: {
        '--accent-primary': '#ffd700',
        '--accent-secondary': '#ffa502',
        '--bg-dark': '#151205',
        '--bg-card': 'rgba(40, 35, 10, 0.7)',
        '--bg-card-hover': 'rgba(60, 50, 15, 0.8)',
        '--gradient-1': 'rgba(255, 215, 0, 0.1)',
        '--gradient-2': 'rgba(255, 165, 2, 0.1)',
        '--neon-glow': '0 0 20px rgba(255, 215, 0, 0.15)',
        '--neon-glow-strong': '0 0 30px rgba(255, 215, 0, 0.4)',
    },
    abyss: {
        '--accent-primary': '#00cec9',
        '--accent-secondary': '#0984e3',
        '--bg-dark': '#010a15',
        '--bg-card': 'rgba(5, 25, 45, 0.7)',
        '--bg-card-hover': 'rgba(10, 40, 70, 0.8)',
        '--gradient-1': 'rgba(0, 206, 201, 0.1)',
        '--gradient-2': 'rgba(9, 132, 227, 0.1)',
        '--neon-glow': '0 0 20px rgba(0, 206, 201, 0.15)',
        '--neon-glow-strong': '0 0 30px rgba(0, 206, 201, 0.4)',
    },
    toxic: {
        '--accent-primary': '#adff2f',
        '--accent-secondary': '#7fff00',
        '--bg-dark': '#0a1005',
        '--bg-card': 'rgba(15, 30, 5, 0.7)',
        '--bg-card-hover': 'rgba(25, 45, 10, 0.8)',
        '--gradient-1': 'rgba(173, 255, 47, 0.1)',
        '--gradient-2': 'rgba(127, 255, 0, 0.1)',
        '--neon-glow': '0 0 20px rgba(173, 255, 47, 0.15)',
        '--neon-glow-strong': '0 0 30px rgba(173, 255, 47, 0.4)',
    },
    sakura: {
        '--accent-primary': '#ffb7b2',
        '--accent-secondary': '#e28495',
        '--bg-dark': '#15050a',
        '--bg-card': 'rgba(45, 15, 25, 0.7)',
        '--bg-card-hover': 'rgba(60, 25, 35, 0.8)',
        '--gradient-1': 'rgba(255, 183, 178, 0.1)',
        '--gradient-2': 'rgba(226, 132, 149, 0.1)',
        '--neon-glow': '0 0 20px rgba(255, 183, 178, 0.15)',
        '--neon-glow-strong': '0 0 30px rgba(255, 183, 178, 0.4)',
    },
    sunset: {
        '--accent-primary': '#ff7e5f',
        '--accent-secondary': '#feb47b',
        '--bg-dark': '#150a05',
        '--bg-card': 'rgba(45, 20, 10, 0.7)',
        '--bg-card-hover': 'rgba(60, 30, 15, 0.8)',
        '--gradient-1': 'rgba(255, 126, 95, 0.1)',
        '--gradient-2': 'rgba(254, 180, 123, 0.1)',
        '--neon-glow': '0 0 20px rgba(255, 126, 95, 0.15)',
        '--neon-glow-strong': '0 0 30px rgba(255, 126, 95, 0.4)',
    },
    darkmatter: {
        '--accent-primary': '#ffffff',
        '--accent-secondary': '#888888',
        '--bg-dark': '#000000',
        '--bg-card': 'rgba(15, 15, 15, 0.9)',
        '--bg-card-hover': 'rgba(30, 30, 30, 0.9)',
        '--gradient-1': 'rgba(255, 255, 255, 0.05)',
        '--gradient-2': 'rgba(200, 200, 200, 0.05)',
        '--neon-glow': '0 0 20px rgba(255, 255, 255, 0.1)',
        '--neon-glow-strong': '0 0 30px rgba(255, 255, 255, 0.3)',
    },
};

/**
 * DUKKAN TEMA KATALOGU - tek dogru kaynak.
 * Dukkan bu listeyi render eder; THEMES'e yeni tema eklenince buraya da
 * bir kayit dustugunde dukkan otomatik gosterir (isim/fiyat burada,
 * CSS degiskenleri THEMES'te yasar).
 * not: price 0 = ucretsiz (default).
 */
export const THEME_CATALOG = [
    { id: 'default', name_tr: 'Klasik Neon (Zümrüt)', name_en: 'Classic Neon (Emerald)', price: 0 },
    { id: 'blood', name_tr: 'Kanlı Ay (Kırmızı)', name_en: 'Blood Moon (Red)', price: 100 },
    { id: 'cyberpunk', name_tr: 'Siberpunk (Mor)', name_en: 'Cyberpunk (Purple)', price: 250 },
    { id: 'gold', name_tr: 'Olimpiyat (Altın)', name_en: 'Olympic (Gold)', price: 500 },
    { id: 'abyss', name_tr: 'Abyss (Okyanus Mavisi)', name_en: 'Abyss (Ocean Blue)', price: 750 },
    { id: 'toxic', name_tr: 'Zehir (Asit Yeşili)', name_en: 'Toxic (Acid Green)', price: 1000 },
    { id: 'sakura', name_tr: 'Sakura (Pembe)', name_en: 'Sakura (Pink)', price: 1000 },
    { id: 'sunset', name_tr: 'Gün Batımı (Turuncu)', name_en: 'Sunset (Orange)', price: 1250 },
    { id: 'darkmatter', name_tr: 'Karanlık Madde (Siyah&Beyaz)', name_en: 'Dark Matter (B&W)', price: 1500 }
];

/**
 * Verilen tema adını document root'una uygular.
 * Bilinmeyen tema adı 'default'a düşer.
 */
export function applyTheme(themeName) {
    const root = document.documentElement;
    const theme = THEMES[themeName] || THEMES.default;
    Object.entries(theme).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}
