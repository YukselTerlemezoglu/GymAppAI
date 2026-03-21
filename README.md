# GymAppAI - Akıllı Antrenman ve Beslenme Asistanı

GymAppAI, antrenmanlarınızı takip etmenizi, gelişiminizi analiz etmenizi, dinlenme sürelerinizi yönetmenizi, beslenme makrolarınızı hesaplamanızı ve Yapay Zeka destekli özel programlar oluşturmanızı sağlayan kapsamlı ve tamamen mobil uyumlu (PWA) bir fitness asistanıdır.

## 🌟 Temel Özellikler

*   **🏆 Yapay Zeka Koçu:**
    *   Geçmiş antrenman performansınızı analiz ederek size en uygun özel programı otomatik oluşturur.
    *   `Groq API` ve `Llama 3` altyapısı kullanarak son derece hızlı ve ücretsiz tavsiyeler sunar.
    *   Plateau (Duraklama) Analizi yapar, Off-Day (Dinlenme) önerebilir ve anlık mikro hedefler belirler.

*   **🏋️‍♂️ Antrenman Takibi & Otomatik Dinlenme Sayacı:**
    *   Seviye atlatan detaylı bir idman giriş ekranı.
    *   Setleri işaretledikçe otomatik sıfırlanan **Yüzen Dinlenme Sayacı (Floating Rest Timer)** ekranın altında sizi bekler.

*   **📈 Gelişmiş Gelişim Analizi & Beslenme (Nutrition):**
    *   Kalori ve Makro (Protein, Karbonhidrat, Yağ) hedeflerinizi hesaplar ve takip eder.
    *   1 Tekrar Maksimum (1RM) Güç E-1RM değişim trendi ve Hacim (Volume) değişim tablosu.

*   **PWA (Progressive Web App):** 
    *   Uygulamayı telefonunuza "Ana Ekrana Ekle" diyerek yerel mobil bir uygulama gibi indirebilirsiniz. Tamamen Mobile-First (Responsive) olarak tasarlanmıştır.

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
    *   İçerisindeki `VITE_GROQ_API_KEY` değişkenine kendi Groq API anahtarınızı yapıştırın. Yapay Zeka ve Llama modelinin çalışması için bu gereklidir.
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

- Projede hiçbir API anahtarı kaynak kodlara gömülü değildir. `.gitignore` dosyası aracılığıyla `.env` dosyası gizlenmiştir. Kendi verilerinizi veya API anahtarlarınızı sadece `.env` içerisinden kullanın.

## 📝 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. İsteğinize göre kopyalayıp geliştirmekte özgürsünüz.
