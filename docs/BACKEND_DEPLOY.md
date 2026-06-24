# GymAppAI - Backend Deploy Rehberi (Vercel)

Bu rehber, kod review'da tespit edilen güvenlik açıklarını kapatmak için
eklenen **Vercel Edge Function** altyapısını deploy etmenize yardımcı olur.

## Neden Vercel?

| İhtiyaç | Vercel Çözümü |
|---------|---------------|
| Groq API anahtarını gizlemek | Vercel Environment Variables (sunucuda) |
| Backend kodu çalıştırmak | Edge Function (`api/groq.js`) |
| Frontend host etmek | Vercel Static Hosting (Vite out-of-the-box) |
| Ücretsiz kalmak | Hobby planı tamamen ücretsiz, **kredi kartı yok** |
| Firestore veritabanı | Firebase Auth + Firestore (Spark planı yeterli) |

---

## Mimari

```
┌───────────────────────┐
│   Browser (Vite app)  │
│  src/services/groq.js │
└──────────┬────────────┘
           │  POST /api/groq
           │  + Firebase ID Token
           ▼
┌───────────────────────┐         ┌─────────────────────┐
│  Vercel Edge Function │  ────►  │  api.groq.com       │
│  api/groq.js          │  ◄────  │  (Groq LLM)         │
│                       │         └─────────────────────┘
│  • ID Token verify    │
│  • Rate limit (uid)   │
│  • GROQ_API_KEY gizli │
└───────────┬───────────┘
            │
            ▼
   Vercel Environment Variables
   (sunucuda, istemciye ASLA gönderilmez)
```

---

## 1. Ön Koşullar

- [Node.js 20+](https://nodejs.org)
- Bir [Vercel](https://vercel.com) hesabı (GitHub ile login olabilirsiniz)
- Mevcut Firebase projeniz (Auth + Firestore için)

## 2. Groq API Anahtarı Alın

1. https://console.groq.com → API Keys → Create API Key
2. Anahtarı **güvenli bir yerde** saklayın (`gsk_...` ile başlar)
3. Anahtarı **ASLA** GitHub'a push etmeyin, `.env`'e yazmayın, sohbette paylaşmayın

## 3. Frontend `.env` Dosyası

`.env.example`'a bakarak `.env` oluşturun. **Artık `VITE_GROQ_API_KEY` yok** —
sadece Firebase istemci yapılandırması:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_PASSWORD=...
```

## 4. Vercel CLI Kurulumu (opsiyonel)

CLI yerine Vercel Dashboard'dan da deploy edebilirsiniz. CLI tercih ederseniz:

```bash
npm install -g vercel
vercel login
```

## 5. Vercel'de Environment Variable Ekleyin

### Yöntem A — Dashboard

1. https://vercel.com/dashboard → projeniz → **Settings** → **Environment Variables**
2. **New Environment Variable**:
   - **Name:** `GROQ_API_KEY`
   - **Value:** Groq anahtarınız (`gsk_...`)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
3. **Save**

### Yöntem B — CLI

```bash
vercel env add GROQ_API_KEY
# Value'yu yapıştırın (gizli, ekranda görünmez)
# Tüm ortamlar için (Production, Preview, Development) ekleyin
```

Doğrulayın:

```bash
vercel env ls
# GROQ_API_KEY listelenmeli
```

## 6. Firestore Rules Deploy (tek seferlik)

Cloud Sync kullanıyorsanız Firestore rules'larını bir kez deploy edin:

```bash
firebase login
firebase deploy --only firestore:rules
```

> Not: `firebase.json` artık sadece `firestore.rules`'a işaret ediyor.
> Cloud Functions **artık kullanılmıyor** — Firebase Functions için
> Blaze planı (kredi kartı) gerekmediğinden bu gereksizdi.

## 7. Deploy

### İlk deploy

```bash
npm run deploy
# veya: vercel --prod
```

İlk seferde Vercel sizden proje ayarlarını isteyecek:
- **Framework:** Vite (otomatik algılanır)
- **Build Command:** `npm run build` (otomatik)
- **Output Directory:** `dist` (otomatik)

### Sonraki deploy'lar

```bash
npm run deploy          # production
npm run deploy:preview  # preview branch
```

### Git entegrasyonu (önerilen)

GitHub repo'nuzu Vercel'e bağlarsanız, `git push` yaptığınızda otomatik
deploy olur. Bu, manuel CLI'den daha pratik.

## 8. Test

### Local'de

```bash
npm run dev
```

> **Local'de `/api/groq` çalışmaz** — Vercel CLI gerekir.
> Test için `vercel dev` kullanın (production ortamını simüle eder).

```bash
vercel dev
# http://localhost:3000 açılır
```

### Production'da

- Giriş yapmadan AI Coach kullanmaya çalışın → "AI için giriş yapmalısınız" hatası beklenir
- Giriş yapın → AI Coach çalışmalı
- Hızlıca 11+ kez "Generate" butonuna basın → "Çok fazla istek" hatası beklenir (rate limit)

## 9. Maliyet

| Kaynak | Hobby Planı Limiti |
|--------|---------------------|
| Edge Function Requests | 1.000.000/ay ücretsiz |
| Edge Function Execution Time | 1.000 saat/ay ücretsiz |
| Bandwidth | 100 GB/ay ücretsiz |
| Groq API | Ücretsiz tier (değer üretici) |

**Senaryonuzda (tek kullanıcı / küçük ölçek) tamamen ücretsiz kalır.**

---

## Sorun Giderme

### "AI servisi yapılandırılmamış" hatası
`GROQ_API_KEY` environment variable tanımlı değil. Adım 5'i tekrarlayın ve
**deploy'ı tekrarlayın** — env değişiklikleri yeni deploy'da etkili olur.

### "AI için giriş yapmalısınız" hatası
Firebase Auth ile giriş yapılmamış. Uygulamaya giriş yapın.

### "Çok fazla istek" hatası (429)
Rate limit'e takıldınız (10 istek/dakika/uid). 60 sn bekleyin.
Bu sınır `api/groq.js` içindeki `RATE_LIMIT_MAX` ile ayarlanır.

### "AI servisi geçici olarak ulaşılamaz" hatası (502)
Groq servisinde geçici sorun. Biraz bekleyip tekrar deneyin.

### Function çağrısı çok yavaş
İlk çağrı cold-start olabilir (Vercel Edge'ler genelde ~50ms). Sonraki
çağrılar daha hızlıdır. Groq'un yanıtı gecikiyorsa modeli değiştirmeyi düşünün.

### CORS hatası
`api/groq.js` içindeki CORS ayarları `*` origin'e izin verir. Prod'da
kendi domain'inizle kısıtlamak isterseniz `Access-Control-Allow-Origin`
değerini değiştirin.

### Firestore "permission denied"
Rules deploy edilmemiş veya test mode açık. Adım 6'yı kontrol edin.

### Vercel CLI deploy hatası
- `vercel link` ile projeyi bağlamayı unutmayın
- Hesabınıza login olduğunuzdan emin olun (`vercel whoami`)
