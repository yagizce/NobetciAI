# 🦺 Nöbetçi — İSG Yönetim Platformu

**Türkçe konuşulan işyerleri için yapay zeka destekli İş Sağlığı ve Güvenliği (İSG) yönetim platformu.**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&labelColor=20232A)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Build--Time-38BDF8?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Durum](https://img.shields.io/badge/Durum-Aktif%20Geliştirme-orange)
![Dil](https://img.shields.io/badge/Dil-Türkçe-red)

[Dokümantasyon](./docs/README.md) · [Yol Haritası](./docs/ROADMAP.md) · [Değişiklik Kaydı](./docs/CHANGELOG.md) · [Katkı Kuralları](./docs/DEVELOPMENT_RULES.md)

---

## Proje Tanıtımı

**Nöbetçi**, işyerlerinin İş Sağlığı ve Güvenliği yükümlülüklerini kağıt ve dağınık
Excel dosyalarından kurtarıp; risk değerlendirmesi, periyodik kontrol takibi, doküman
yönetimi ve yapay zeka destekli danışmanlığı **tek bir dijital platformda** birleştiren
kurumsal bir web uygulamasıdır.

Proje, tek kullanıcılı bir prototipten **çok kiracılı (multi-tenant) SaaS** ürününe
kademeli olarak dönüştürülmektedir. Mimari kararların tamamı bu dönüşüm göz önünde
bulundurularak alınır.

## Platform Hakkında

Nöbetçi, üç kullanıcı rolünü tek çatı altında hizmet verecek şekilde tasarlanmıştır:

| Rol | Kullanım Amacı |
|---|---|
| 🧑‍🔬 **İSG Uzmanı** | Risk analizi girer/onaylar, dokümanları hazırlar |
| 🏢 **İşveren** | Firma genelini yönetir, KPI ve performansı izler, onaylar |
| 👷 **Çalışan** | Ramak kala/tehlike bildirimi gönderir, eğitimlerini takip eder |

Hedef kitle; kendi İSG uzmanı bulunmayan küçük/orta ölçekli işletmeler, birden fazla
firmayı yöneten OSGB'ler ve saha güvenliğini merkezi olarak takip etmek isteyen
işverenlerdir. Uygulama **mobil öncelikli** tasarlanmıştır — sahada, telefonla
kullanılabilir olması bir seçenek değil, temel gerekliliktir.

## Temel Özellikler

- 📊 **Fine-Kinney Risk Analizi** — açıklamalı puanlama skalaları, otomatik risk
  skoru/renklendirme, artık risk (önlem sonrası) hesaplama.
- 🗂️ **Risk Detay Sayfası** — tek risk için Risk Bilgileri, Düzeltici Faaliyetler,
  Ek Dosyalar, Risk Geçmişi ve Notlar sekmeleri.
- 🔍 **Gelişmiş Filtreleme** — departman, şube, durum, öncelik ve tarih aralığına göre
  arama.
- 🏢 **Firma Yönetimi** — Firma / Şube / Departman / Çalışan CRUD işlemleri.
- 🛠️ **Periyodik Kontrol Takvimi** — ekipman ve tesisat kontrol tarihlerinin otomatik
  takibi; liste ve aylık takvim görünümü, arama/durum/kategori filtreleri, tek tıkla
  "Bugün Kontrol Edildi" işaretleme.
- 📚 **Bilgi Kütüphanesi** — mevzuat, Fine-Kinney, KKD, acil durum ve eğitim
  dokümanlarının kategorilere ayrılmış, aranabilir arşivi; favoriler ve ilgili
  doküman önerileri.
- 📈 **Yönetici Dashboard'u** — güvenlik skoru, kazasız gün sayacı, risk workflow
  özeti, departman bazlı risk dağılımı, dikkat gerektirenler listesi, KPI kartları,
  trend ve düzeltici faaliyet paneli.
- 🔔 **Bildirim Merkezi** — çalışan bildirimleri ve sistem olayları için tek akış.
- 🎓 **Uzaktan Eğitim** — video izleme (ileri sarma kapalı, kaldığı yerden devam
  eder) + sınav + otomatik puanlama; Atandı/Devam Ediyor/Tamamlandı/Kaldı
  durumları; katılımcı listesi yalnızca İSG uzmanı ve işverene açık.
- 📝 **Denetim Günlüğü** — kritik işlemlerin (oluşturma/güncelleme/kapatma) izlenebilir
  kaydı.

## Yapay Zeka Özellikleri

Nöbetçi'de yapay zeka, karar vericinin **yerine geçmez, ona yardımcı olur.** Tüm AI
çağrıları sunucu taraflı bir proxy (Vercel Serverless Function) üzerinden yürütülür;
API anahtarı istemci koduna asla yazılmaz.

| Özellik | Açıklama |
|---|---|
| 💬 AI Sohbet Danışmanı | İSG konularında serbest metin soru-cevap |
| 🖼️ Fotoğraf Analizi | Sohbet üzerinden görsel gönderip AI yorumu alma |
| 🎯 Fine-Kinney Önerisi | Tehlike/risk açıklamasından otomatik önlem, KKD ve artık risk önerisi |
| ✨ Bilgi Kütüphanesi'ne AI'ya Sor | Soruyu ilgili dokümanlara daraltıp kaynak göstererek yanıtlar (RAG-lite) |

> **Güvenlik ilkesi:** AI'nin önerdiği değerler her zaman düzenlenebilir alanlara
> yazılır ve kod seviyesinde asıl risk değerlerini aşamaz. Hiçbir AI çıktısı sessizce
> ya da geri dönüşsüz biçimde uygulanmaz. Planlanan AI Vision ve otomatik risk
> puanlama özellikleri için bkz. [AI Yol Haritası](./docs/AI_ROADMAP.md).

## Kullanılan Teknolojiler

| Katman | Teknoloji |
|---|---|
| Frontend | React 18, Vite, React Router |
| Stil | Tailwind CSS (CDN) |
| Veri Katmanı | IndexedDB (aktif firma scope'u + `dataProvider` soyutlaması ile backend-hazır) |
| Yapay Zeka | Anthropic API (Vercel Serverless Function proxy üzerinden) |
| Tip Güvenliği | JSDoc `@typedef` |
| Dağıtım (CI/CD) | GitHub → Vercel (otomatik build) |

## Proje Yapısı

```
nobetci/
├── api/                  Sunucu taraflı AI proxy (chat.js — Vercel Serverless Function)
├── docs/                 Proje dokümantasyonu (mimari, yol haritası, kurallar)
├── public/               Statik dosyalar
├── src/
│   ├── components/       Yeniden kullanılabilir UI bileşenleri (Button, Badge, icons...)
│   ├── contexts/         Theme, Role, IsgData, Toast, Language
│   ├── constants/        Sabit veriler, ölçekler (Fine-Kinney, Bilgi Kütüphanesi...)
│   ├── features/         Modül bazlı iş mantığı (risk-analysis, dashboard, company...)
│   ├── hooks/            Paylaşılan React hook'ları
│   ├── pages/             Route bileşenleri
│   ├── services/          Veri erişimi ve dış entegrasyonlar (dataProvider, db, riskService...)
│   ├── types/             JSDoc tip tanımları
│   └── utils/             Saf yardımcı fonksiyonlar
├── vercel.json           Vercel build/dağıtım yapılandırması (SPA rewrite kuralı)
└── package.json
```

Mimarinin tam açıklaması için bkz. [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Kurulum

### Gereksinimler

- Node.js 18 veya üzeri
- Bir [Anthropic API anahtarı](https://console.anthropic.com/) (AI özellikleri için)

### Yerel Geliştirme

```bash
git clone <repo-url>
cd nobetci
npm install
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde açılır.

### Production Build

```bash
npm run build   # dist/ klasörünü üretir
npm run preview # üretilen build'i yerel olarak önizler
```

### Vercel Üzerinden Dağıtım

1. Depoyu GitHub'a yükleyin.
2. Vercel'de **"Add New... → Project"** ile depoyu içe aktarın.
3. Framework olarak "Vite" otomatik algılanır; build ayarları `vercel.json`
   üzerinden de tanımlıdır (`npm run build`, yayın klasörü `dist`).
   `api/` klasöründeki dosyalar Vercel tarafından otomatik olarak Serverless
   Function'a çevrilir — ayrı bir yapılandırma gerekmez.
4. Vercel ortam değişkenlerine (Project → Settings → Environment Variables)
   `ANTHROPIC_API_KEY` değerini ekleyin (Fine-Kinney AI önerileri, mevzuat
   taraması, doküman/fotoğraf analizi ve Bilgi Merkezi bu anahtar olmadan
   çalışmaz). `NVIDIA_API_KEY`'i de aynı şekilde ekleyin — bu tek anahtar hem
   Cosmos3-Nano-Reasoner test sayfası (`/cosmos-vision-test`, bkz.
   `api/cosmos-vision.js`, yalnızca test amaçlı izole bir entegrasyon) hem de
   AI Chat sekmesinin metin sohbeti (moonshotai/kimi-k3, bkz.
   `api/kimi-chat.js`) tarafından kullanılır.
5. `main` dalına yapılan her push, otomatik build ve dağıtım tetikler.

> Not: Proje bir React uygulaması olduğundan, statik dosyaları doğrudan Vercel'e
> sürükleyip bırakma yöntemi desteklenmez — build adımı zorunludur.

## Geliştirme Süreci

- Geliştirme **sprint bazlı** ilerler; her sprintin kapsamı, kararları ve durumu
  [SPRINTS.md](./docs/SPRINTS.md) ve [CHANGELOG.md](./docs/CHANGELOG.md) içinde
  kayıt altına alınır.
- Yeni bir özellik eklenirken mevcut çalışan davranış bozulmaz; mimari ve kod kalitesi
  kuralları için bkz. [DEVELOPMENT_RULES.md](./docs/DEVELOPMENT_RULES.md).
- `/docs` klasörü, kodla eş zamanlı güncellenen **canlı referans dokümantasyonudur** —
  yeni katkı sağlayan herkes önce oradan başlamalıdır.
- Backend/veri katmanı, gerçek bir sunucu veritabanına (bkz.
  [DATABASE_PLAN.md](./docs/DATABASE_PLAN.md)) geçişe hazır şekilde, tek bir soyutlama
  katmanı (`dataProvider`) arkasında tutulur.

## Yol Haritası

| Faz | Durum |
|---|---|
| Phase 1 — Core Platform | ✅ Tamamlandı |
| Phase 2 — Risk Intelligence | ✅ Tamamlandı |
| Phase 3 — Knowledge Center | ✅ Tamamlandı |
| Phase 4 — AI Copilot | 🟡 Kısmen tamamlandı |
| Phase 5 — RAG & Proaktif Besleme | 🟡 Kısmen tamamlandı |
| Phase 6 — Vision AI (statik fotoğraf) | 🔲 Planlandı |
| Phase 7 — Enterprise | 🔲 Planlandı |
| Phase 8 — Mobile Platform | 🟡 Kısmen tamamlandı (PWA v2 sağlam; native app kararı bekliyor) |
| Phase 9 — Canlı Kamera & Sensör AI | 🟡 Kısmen tamamlandı (9.1 teslim edildi) |

Tam ve güncel yol haritası için bkz. [ROADMAP.md](./docs/ROADMAP.md).

## Gelecek Özellikler

- 🔐 Gerçek kullanıcı kimlik doğrulama ve server-side firma veri izolasyonu (Supabase Auth + RLS); offline sürümde local company scope uygulanır
- 👁️ AI Vision ile risk fotoğraflarından otomatik tehlike tespiti
- 🧮 Serbest metinden otomatik Fine-Kinney puan önerisi (`scoreRisk`)
- 📁 Gerçek doküman depolama (Bilgi Kütüphanesi ve risk ek dosyaları için)
- 📱 Native mobil uygulama paketleme kararı ve uygulaması
- 🏬 Tek hesaptan birden fazla firmayı yönetme (OSGB) deneyimi

## Katkıda Bulunma

Bu proje aktif geliştirme aşamasındadır. Katkı sağlamadan önce:

1. [DEVELOPMENT_RULES.md](./docs/DEVELOPMENT_RULES.md) dosyasını okuyun — mevcut
   sistemi bozmama, bağımlılık/backend disiplini ve kod kalitesi kuralları burada
   tanımlıdır.
2. Değişikliğinizi ilgili [SPRINTS.md](./docs/SPRINTS.md) veya
   [ROADMAP.md](./docs/ROADMAP.md) maddesiyle ilişkilendirin.
3. Pull request açmadan önce değişikliğinizin kapsamını (hangi dosyalar, neden)
   açıkça belirtin.
4. Kod ile birlikte ilgili dokümantasyonu (`/docs`) güncelleyin.

Hata bildirimi ve öneriler için lütfen bir **Issue** açın.

## Lisans

Bu proje için henüz açık bir lisans belirlenmemiştir — tüm hakları saklıdır.
Lisans modeli netleştiğinde bu bölüm güncellenecektir.
