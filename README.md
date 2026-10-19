# Nöbetçi — İSG Yönetim Platformu

Risk değerlendirmesi, denetim, periyodik kontrol, eğitim ve AI danışmanlığını birleştiren Türkçe, mobil öncelikli uygulama.

**Mevcut durum:** React tabanlı web/PWA. Veriler cihazın IndexedDB alanında tutulur; hesaplar ve rol seçimi demodur. Android/iOS mağaza paketleri henüz yoktur. [Yayın hazırlığı](docs/MOBILE_RELEASE_READINESS.md).

## Yerel geliştirme

Node.js 24 ile doğrulanmıştır.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

`npm run dev` ön yüzü çalıştırır. `/api/*` fonksiyonları için Vercel işlevlerini çalıştıran bir ortam gerekir; yalnızca Vite çalışırken AI istekleri hizmet alamaz.

## Yapı

| Yol | İçerik |
|---|---|
| `src/pages/` | Sayfa girişleri |
| `src/features/` | Dashboard, risk, denetim, firma, eğitim ve belge modülleri |
| `src/components/` | Ortak arayüz bileşenleri ve ikonlar |
| `src/services/` | IndexedDB veri erişimi ve AI servisleri |
| `src/constants/`, `src/utils/` | Veri şablonları, iş kuralları ve yardımcılar |
| `api/` | Sunucu taraflı AI proxy'leri |
| `public/` | PWA manifesti, ikonlar, çevrimdışı sayfası ve service worker |
| `docs/` | Mimari, geliştirme kuralları ve yayın hazırlığı |

React 18, React Router 6, Vite 5 ve derleme sırasında üretilen Tailwind CSS kullanılır. ExcelJS dışa aktarım, jsQR QR okuma içindir; ağır modüller gerektiğinde yüklenir.

## AI yapılandırması

Anahtarları yalnızca sunucu ortamında tanımlayın; istemciye açılan `VITE_*` değişkenlerine koymayın.

| Sunucu değişkeni | Kullanım |
|---|---|
| `ANTHROPIC_API_KEY` | `/api/chat`: risk önerisi, belge analizi/üretimi, bilgi kütüphanesi |
| `NVIDIA_API_KEY` | `/api/kimi-chat`: sohbet; `/api/cosmos-vision`: fotoğraf ve tehlike analizi |

AI çıktıları kullanıcı onayıyla uygulanır. Fotoğraf bulguları ayrıca doğrulanır. API anahtarlarının tanımlı olması, gerçek kimlik doğrulama ve sunucu yetkilendirmesi ihtiyacını ortadan kaldırmaz.

## Veri ve demo sınırları

- Kayıtlar bu tarayıcı/cihazda saklanır; cihazlar arasında otomatik senkronizasyon yoktur.
- Ayarlardan tam yedek alınabilir ve geri yüklenebilir.
- Demo veri yükleme mevcut cihaz verilerini siler; arayüzde onay gerektirir.
- Giriş, kayıt ve şifre işlemleri gerçek hesap sistemine bağlı değildir.
- Bilgi kütüphanesinde örnek içerik, eğitimlerde yer tutucu video bulunur.
- Mevcut ISO prototip yardımcıları ve testleri gelecek çalışma için korunur; aktif denetim ekranları `pages/Audit.jsx` üzerinden yapılandırılır.

## Web dağıtımı

Vercel yapılandırması `vercel.json` içindedir: build komutu `npm run build`, çıktı `dist`, AI fonksiyonları `api/` altında. Ortam değişkenlerini dağıtım ortamında tanımlayın. Üretime geçmeden [yayın hazırlığı](docs/MOBILE_RELEASE_READINESS.md) maddelerini tamamlayın.

## Dokümanlar

[Dokümantasyon](docs/README.md) · [Değişiklikler](CHANGELOG.md) · [Geliştirme kuralları](docs/DEVELOPMENT_RULES.md) · [Mimari](docs/ARCHITECTURE.md)
