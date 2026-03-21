# GymAppAI - Akıllı Antrenman ve Beslenme Asistanı

GymAppAI, antrenmanlarınızı takip etmenizi, gelişiminizi analiz etmenizi, dinlenme sürelerinizi yönetmenizi, beslenme makrolarınızı hesaplamanızı ve Yapay Zeka destekli özel programlar oluşturmanızı sağlayan kapsamlı ve tamamen mobil uyumlu (PWA) bir fitness asistanıdır.

## 🚀 Yeni Gelen Özellikler (Oyunlaştırma & Tema Sistemi)
- **Rütbe (Rank) Sistemi:** Antrenman yaparak kazandığınız XP'ler ile seviye atlarsınız ve "Demir Çaylak" tan "Elit Titan" a kadar yükselen özel rütbe ikonlarına sahip olursunuz.
- **Kutlama Animasyonları:** Seviye atladığınızda ekranı kaplayan konfeti (Confetti) animasyonlarıyla başarınız kutlanır.
- **Jeton (Coin) Sistemi ve Tema Mağazası:** İdmanlardan kazandığınız XP'lerin %10'u kadar Jeton kazanırsınız. Bu jetonları harcayarak uygulamanın genel renk paletini ve arka planlarını değiştiren (Siberpunk, Kanlı Ay, Olimpiyat vb.) premium temalar satın alabilirsiniz.
- **Seri Çarpanı (Streak Multiplier):** İdman günlerinizi aksatmazsanız 3 gün için (1.2x) ve 7 gün için (1.5x) XP ve Jeton çarpanı kazanırsınız! İstikrar her şeydir.
- **Gizli Rozetler (Secret Badges):** 100 kg barajını aşmak veya gece yarısı spor yapmak gibi sadece özel eylemleri yapınca kilidi açılan sürpriz rozetler eklendi.
- **Geliştirici Admin Paneli:** Testler için Profil resminize *çift tıklayarak* erişebileceğiniz gizli bir Admin menüsü bulunur. Buradan kendi istatistiklerinizi (Jeton, XP) simüle edebilir veya sistemi tamamen sıfırlayabilirsiniz.

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
