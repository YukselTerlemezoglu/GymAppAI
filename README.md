# GymAppAI - Akıllı Antrenman ve Beslenme Asistanı

GymAppAI, antrenmanlarınızı takip etmenizi, gelişiminizi analiz etmenizi, dinlenme sürelerinizi yönetmenizi, beslenme makrolarınızı hesaplamanızı ve Yapay Zeka destekli özel programlar oluşturmanızı sağlayan kapsamlı ve tamamen mobil uyumlu (PWA) bir fitness asistanıdır.

## 🚀 Yeni Gelen Özellikler
- **Tasarım & Mobil Optimizasyon:** Uygulama tamamen mobil cihazlara göre yeniden boyutlandırıldı. Yüzen bileşenler, buton hedefleri (minimum 44px) ve esnek tablo görünümleriyle (%100 Responsive) her ekranda kusursuz bir deneyim sunulmaktadır.
- **PWA (Progressive Web App):** Uygulamayı artık telefonunuza "Ana Ekrana Ekle" diyerek bir mobil uygulama gibi indirebilirsiniz.
- **1RM Hesaplayıcı:** Epley ve Brzycki formüllerini kullanarak kaldırdığınız ağırlığa göre 1 Tekrar Maksimum (1RM) değerinizi ve yüzdelik dilimlerinizi hesaplayabilirsiniz.
- **Beslenme Takipçisi (Nutrition Tracker):** Günlük kalori ve makro (Protein, Karbonhidrat, Yağ) hedeflerinizi belirleyip, öğünlerinizi kaydedebilir ve hedefinize ne kadar yaklaştığınızı görebilirsiniz.
- **Veri Dışa/İçe Aktarımı (Data Sync):** Tüm gelişiminizi yedeklemek için JSON formatında dışa aktarabilir, başka bir cihazda veya tarayıcıda kaldığınız yerden devam edebilirsiniz.

## 🌟 Temel Özellikler

*   **🏆 Yapay Zeka Koçu (Onboarding Wizard & Soru Cevap):**
    *   Geçmiş antrenman performansınızı (hacim, RPE ortalaması) analiz ederek size en uygun haftalık split'i (FullBody, Upper/Lower, PPL vb.) otomatik oluşturur.
    *   `Groq API` ve `Llama 3` altyapısı kullanarak son derece hızlı ve ücretsiz tavsiyeler sunar (API Key girişi üzerinden güvenli).
    *   Motivasyonel tavsiyeleri (Bugün ne yapayım? Duraklama (Plateau) Analizi) sunar.

*   **🏋️‍♂️ Antrenman Takibi & Otomatik Dinlenme Sayacı (Rest Timer):**
    *   Seviye atlatan (XP kazandıran) detaylı bir idman giriş ekranı.
    *   Antrenman sırasında sürenizi otomatik olarak yönetebileceğiniz **Yüzen Dinlenme Sayacı** (Floating Rest Timer) ekranın altında sizi bekler.

*   **📈 Gelişmiş Gelişim Analizi & Dashboard:**
    *   Son 8 haftanın hacim (Volume) değişimi (BarChart).
    *   En çok yapılan egzersizlerin tahmini 1RM (E1RM) güç değişim trendi (LineChart).

*   **🔥 Rozetler & Seviye Sistemi:**
    *   Ağırlık kaldırdıkça ve antrenman kaydettikçe kümülatif XP kazanırsınız. Seviyeniz her arttığında gereken XP miktarı zorlaşır.
    *   Farklı kilometre taşları (Örn: Toplam 10.000kg Hacim) için özel rozetler kilitlerini açın.

## 🛠️ Kurulum ve Çalıştırma

Bu projeyi yerel bilgisayarınızda çalıştırmak için:

1.  **Gereksinimler:** Bilgisayarınızda [Node.js](https://nodejs.org/) (Sürüm 18 veya üzeri önerilir) yüklü olmalıdır.
2.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/KULLANICI_ADINIZ/GymAppAI.git
    cd GymAppAI
    ```
3.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```
4.  **API Anahtarlarını Ayarlayın (Yapay Zeka İçin Gerekli):**
    *   Projenin ana dizinindeki `.env.example` dosyasını `.env` olarak kopyalayın.
    *   İçerisindeki `VITE_GROQ_API_KEY` değişkenine kendi Groq API anahtarınızı yapıştırın. Yapay Zeka ve Llama modelinin çalışması için bu gereklidir. (Groq API şu an için ücretsizdir ve [Groq Console](https://console.groq.com/keys) üzerinden alınabilir).
5.  **Geliştirici Sunucusunu Başlatın:**
    ```bash
    npm run dev
    ```
6.  Tarayıcınızda `http://localhost:8080` adresine giderek uygulamayı görüntüleyin.

## 📦 PWA ve Versiyon Build İşlemleri

Proje, Production (Canlı/Yayın) ortamı için PWA eklentisiyle birlikte derlenmeye (build) uygundur. Vite-PWA entegrasyonu sayesinde çevrimdışı önbelleğe alma (Service Worker) ve Manifest yapıları derleme sırasında otomatik üretilir.

```bash
npm run build
npm run preview
```

## 🔒 Güvenlik

- Projede hiçbir API anahtarı kaynak kodlara gömülü değildir. `.gitignore` dosyası aracılığıyla `.env` dosyası gizlenmiştir. Kendi verilerinizi veya API anahtarlarınızı sadece `.env` içerisinden kullanın. Kimlik doğrulaması API'ler için doğrudan header üzerinden (client side) yapılır.

## 🤝 Katkıda Bulunma

Hata bildirimleri, öneriler ve PR'lar (Pull Request) memnuniyetle karşılanır. Gelişim için proje tahtasını (Issues) kullanabilirsiniz.

## 📝 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. İsteğinize göre kopyalayıp geliştirmekte özgürsünüz.
