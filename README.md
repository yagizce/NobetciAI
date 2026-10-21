# Nöbetçi — İSG Yönetim Platformu

İSG uzmanı için risk değerlendirmesi, denetim, periyodik kontrol, belge ve AI danışmanlığını birleştiren Türkçe, mobil öncelikli uygulama.

**Yayın planı:** İlk sürüm İSG uzmanları için Android/iOS mobil uygulama olacak; firmalara yönelik sürüm daha sonra ayrı yayınlanacak. Vercel mevcut mobil uygulamanın web demosudur. Uzman, bağımsız veya OSGB bünyesinde çalışırken cihaz başına en fazla 30 firmayı ayrı kayıtlarla takip edebilir; bu firma hesabı veya ekip paylaşımı sağlamaz.

**Mevcut durum:** React tabanlı web/PWA; yalnızca uzman görünümü açık. İşveren, çalışan ve eğitim modülleri firma sürümü için değerlendirilmek üzere korunur. Veriler cihazın IndexedDB alanında tutulur; gerçek hesap sistemi ve Android/iOS mağaza paketleri henüz yoktur. [Kapsam ve yeniden açma rehberi](docs/RELEASE_SCOPE.md) · [Yayın hazırlığı](docs/MOBILE_RELEASE_READINESS.md).

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
- Demo veri sıfırlama uzman sürümünde kapalıdır; saklı modüllerin verileri tam yedeğe dahildir.
- Giriş, kayıt ve şifre işlemleri gerçek hesap sistemine bağlı değildir.
- Bilgi kütüphanesinde örnek içerik bulunur. Kapalı eğitim modülündeki yer tutucu video yeniden açılıştan önce tamamlanmalıdır.
- Mevcut ISO prototip yardımcıları ve testleri gelecek çalışma için korunur; aktif denetim ekranları `pages/Audit.jsx` üzerinden yapılandırılır.

## Web dağıtımı

Vercel yapılandırması `vercel.json` içindedir: build komutu `npm run build`, çıktı `dist`, AI fonksiyonları `api/` altında. Ortam değişkenlerini dağıtım ortamında tanımlayın. Üretime geçmeden [yayın hazırlığı](docs/MOBILE_RELEASE_READINESS.md) maddelerini tamamlayın.

## Dokümanlar

[Dokümantasyon](docs/README.md) · [Değişiklikler](CHANGELOG.md) · [Geliştirme kuralları](docs/DEVELOPMENT_RULES.md) · [Mimari](docs/ARCHITECTURE.md)
