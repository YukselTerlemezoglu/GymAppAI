# 🚀 GymAppAI - Yapay Zeka Destekli Yeni Nesil Fitness Ekosistemi

GymAppAI, antrenmanlarınızı, beslenmenizi ve gelişiminizi takip etme şeklinizi devrimsel bir boyuta taşıyan, mobil öncelikli (PWA) kapsamlı bir fitness asistanıdır. En modern Yapay Zeka teknolojileri ile güçlendirilen bu uygulama; kişiselleştirilmiş koçluk, gelişmiş antrenman kaydı ve derinlemesine analizler sunarak zirve performansınıza ulaşmanıza yardımcı olur.

---

## 🌟 Temel Özellikler

### 🤖 Yapay Zeka Koçu (Groq & Llama 3.3 Destekli)
*   **Akıllı Program Oluşturma:** Hedefinize, ekipmanınıza ve seviyenize göre bilimsel temelli, periyotlandırılmış antrenman planları hazırlar.
*   **Performans Analizi:** Son 4 haftalık verilerinizi analiz ederek plato (duraklama) dönemlerini tespit eder, deload veya ağırlık artırımı önerir.
*   **Mikro Hedefler:** Motivasyonunuzu yüksek tutmak için "Bugün rekoruna +1 tekrar ekle" veya "20 dakika hafif kardiyo dene" gibi günlük hedefler belirler.

### 🏋️‍♂️ Gelişmiş Antrenman Kaydı
*   **Dinamik İdman Modları:** **Drop Set**, **AMRAP (Yapabildiğin Kadar Tekrar)** ve manuel set düzenlemelerini destekler.
*   **Yüzen Dinlenme Sayacı:** Ekranın altında sizi takip eden akıllı sayaç, set aralarınızı yönetir ve bir sonraki set zamanı geldiğinde sizi uyarır.
*   **XP ve Oyunlaştırma:** Her set ve tekrar için XP kazanın. Seviye atlayın, rütbe (Demir Çaylak'tan Elit Titan'a) kazanın ve başarı rozetlerini toplayın.

### 🥗 Akıllı Beslenme Takibi
*   **Günlük Makro Takibi:** Öğünlerinizi kaydedin; Kalori, Protein, Karbonhidrat ve Yağ değerlerinizi hedeflerinize göre izleyin.
*   **AI ile Besin Tahmini:** Sadece "1 kase yulaf ve 2 yumurta" yazın ve Yapay Zekanın makro değerlerini anında tahmin etmesini sağlayın.
*   **Görsel Özetler:** Dashboard üzerindeki widget ile günlük beslenme durumunuzu bir bakışta görün.

### 📊 Derinlemesine Analiz ve Gelişim
*   **Gelişim Grafikleri:** Haftalık hacim (Volume) tabloları ve en sevdiğiniz egzersizler için güç artış trendleri.
*   **Kas Dengesi Radarı:** Antrenmanlarınızın kas gruplarına dağılımını gösteren interaktif radar grafiği ile zayıf bölgelerinizi tespit edin.
*   **Vücut Takibi:** Ölçümlerinizi kaydedin ve değişimini gözlemlemek için "Öncesi/Sonrası" fotoğraflarınızı saklayın.

### 📱 Premium Mobil Deneyim (PWA)
*   **Yüklenebilir:** "Ana Ekrana Ekle" diyerek yerel bir iOS/Android uygulaması gibi kullanın.
*   **Mağaza ve Temalar:** Kazandığınız jetonlarla premium temaların (Cyberpunk, Kan, Altın, Sakura vb.) kilidini açın.
*   **Bulut Senkronizasyonu:** Verilerinizi Firebase kullanarak tüm cihazlarınızda güvenle yedekleyin ve eşitleyin.

---

## 🛠️ Teknoloji Yığını

*   **Frontend:** React 19 (Vite)
*   **Stil:** Modern Vanilla CSS (Glassmorphism & Neon Estetiği)
*   **AI Motoru:** Groq API (Llama 3.3-70B)
*   **Veritabanı ve Auth:** Firebase (Firestore / Authentication)
*   **Animasyonlar:** Framer Motion & Canvas Confetti
*   **Grafikler:** Recharts
*   **İkonlar:** Lucide React

---

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için şu adımları izleyin:

1.  **Depoyu Klonlayın:**
    ```bash
    git clone https://github.com/kullanici-adiniz/GymAppAI.git
    cd GymAppAI
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Çevresel Değişkenler:**
    Ana dizinde bir `.env` dosyası oluşturun ve bilgilerinizi ekleyin:
    ```env
    VITE_GROQ_API_KEY="groq_api_anahtariniz"
    VITE_ADMIN_PASSWORD="admin_panel_sifreniz"

    # Firebase Yapılandırması
    VITE_FIREBASE_API_KEY="..."
    VITE_FIREBASE_AUTH_DOMAIN="..."
    VITE_FIREBASE_PROJECT_ID="..."
    VITE_FIREBASE_STORAGE_BUCKET="..."
    VITE_FIREBASE_MESSAGING_SENDER_ID="..."
    VITE_FIREBASE_APP_ID="..."
    ```

4.  **Geliştirici Sunucusunu Başlatın:**
    ```bash
    npm run dev
    ```
    Uygulama `http://localhost:5173` adresinde çalışacaktır.

---

## 🛡️ Güvenlik ve Gizlilik

*   **Gizli Anahtarlar:** Hiçbir API anahtarı veya şifre kod içerisine gömülü değildir. Tamamı çevresel değişkenler (.env) ile yönetilir.
*   **Admin Güvenliği:** Geliştirici araçları, çift tıklama jesti ve güvenli şifre kontrolü ile korunmaktadır.
*   **Yerel Öncelikli Veri:** Uygulama, bulut hesabı olmasa dahi verilerinize erişebilmeniz için LocalStorage kullanır.

---

## 📝 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.

---


