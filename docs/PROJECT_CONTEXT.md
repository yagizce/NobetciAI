# Proje Bağlamı (Project Memory)

> Bu dosya **projenin hafızasıdır.** Nöbetçi üzerinde çalışan herkes (insan ya da AI
> asistan), bir görev almadan önce bu dosyayı okumalıdır. Buradaki bilgiler,
> sonraki tüm geliştirme kararlarının referans noktasıdır — çelişen bir talep
> geldiğinde önce burası kontrol edilir.

---

## Şu An Açık Olan Konular (21 Ağustos 2026 itibarıyla)

> Bu bölüm, farklı bir hesap/oturumdan devam edilirse (ör. yeni bir e-postayla veya
> Claude Code'a geçilirse) o oturumun sıfırdan tahmin etmek zorunda kalmaması için
> yazıldı — CHANGELOG.md tamamlanan işleri kronolojik olarak listeler, burası ise
> **şu an açık/bekleyen** konuları listeler. Bir madde tamamlandığında buradan
> silinmeli (CHANGELOG.md'ye zaten kendi kaydı düşer).

**Mühendislik incelemesi — öncelik sırasına konmuş, kısmen tamamlandı:**
Depolama/yedekleme/satış odaklı bir kod incelemesi yapıldı, bulgular önceliklendirildi:
1. ✅ Yedekleme boyut sınırı kilitlenmesi — çözüldü (`backupService.js`, `BackupSection.jsx`)
2. ✅ Yedekleme hatırlatması pasif metinden gerçek bildirime taşındı (`useReminderScheduler.js`)
3. ✅ Depolama kullanım göstergesi eklendi (`StorageUsageIndicator.jsx`, Storage API)
4. ✅ Denetim Dosyası'na (Audit Package) fotoğraf kanıtı ekleme — tamamlandı
   (`auditPackageExport.js`, kanıt fotoğrafları popup açılmadan önce çözümleniyor).
5. ✅ Mock Vision AI'nin satış demolarında şeffaf sunulması — artık gerekmiyor: Risk
   Tespiti fotoğraf analizi gerçek bir görsel modele bağlı (`visionAnalysisService.js` →
   `/api/cosmos-vision`, `mode: "findings"`), mock adapter ve "Demo: Otomatik Simülasyon"
   kaldırıldı.
6. ✅ `window.open` tabanlı print-window'un mobilde popup engelleme riski — `utils/printWindow.js`
   artık popup engellenirse (`window.open` → `null`) aynı sayfada görünmez bir iframe ile
   yazdırıyor; tüm export'lar (Denetim Dosyası, Fine-Kinney, Yönetici Özeti, Tamamlama
   Belgesi) aynı yardımcıyı kullandığı için hepsi kapsandı. **Gerçek bir mobil cihazda
   (iOS Safari / Android Chrome / ana ekrana eklenmiş PWA) henüz denenmedi.**

**Vercel deployment:** Kullanıcı bir `npm error ENOENT package.json` hatası aldı,
kaynağını birlikte araştırdık (Root Directory ayarı boş/doğruydu, repo kökünde
`package.json` gerçekten vardı) — muhtemelen eski/stale bir build logu olduğu
sonucuna varıldı, kullanıcı "hallettim" dedi ama kesin kök neden doğrulanmadı.
Benzer bir hata tekrar çıkarsa: önce en son commit'in gerçekten deploy edildiğini
(stale log ihtimali), sonra Root Directory ayarını kontrol et.

**Supabase migration (Phase 7) henüz başlamadı.** Kullanıcı Supabase projesini
"bugün" açacağını söylemişti ama bu konuşmada henüz SQL şeması yapıştırılmadı, key
alınmadı. `docs/backend-migration/` altındaki taslak dosyalar (şema SQL, RLS
politikaları, `supabaseDataProvider.draft.js`) hazır ama aktif değil. Bu geçiş
`@supabase/supabase-js` bağımlılığı gerektirir — kullanıcının açık onayı olmadan
eklenmemeli (bkz. aşağıdaki "Yapay Zeka Yaklaşımı" bölümü, "yeni bir sağlayıcı/
kütüphane eklenmez" ilkesi).

**Ortam notu:** Kullanıcı telefondan bilgisayara geçiş yapıyor, Claude Code
kullanmayı planlıyor. Bu konuşmadaki tüm doğrulamalar (test suite, syntax kontrolü,
import/export taraması) bir **sandbox'ta, `npm install` çalıştırılamadan** yapıldı —
gerçek bir `vite build`/`npm test` hiç denenmedi. Bilgisayarda/Claude Code'da ilk iş
olarak `npm install && npm run build && npm test` çalıştırıp gerçek bir doğrulama
yapmak faydalı olur.

---

## Projenin Amacı

**Nöbetçi**, işyerlerinin İş Sağlığı ve Güvenliği (İSG) yükümlülüklerini kağıt ve
dağınık Excel dosyalarından kurtarıp; risk değerlendirmesi, periyodik kontrol takibi,
doküman/mevzuat yönetimi ve yapay zeka destekli danışmanlığı **tek bir dijital
platformda** birleştirmeyi amaçlar.

Somut olarak çözülen problem: bir İSG uzmanının veya işverenin bugün ayrı ayrı
tuttuğu risk değerlendirme Excel'i, periyodik kontrol takvimi, mevzuat arşivi ve
danışmanlık ihtiyacını **tek bir uygulama içinde, uçtan uca izlenebilir** hale
getirmek.

## Hedef Kullanıcılar

Platform üç rolü tek çatı altında hizmet verecek şekilde tasarlanmıştır:

| Rol | İhtiyaç |
|---|---|
| 🧑‍🔬 **İSG Uzmanı** | Risk analizi girme/onaylama, doküman hazırlama, mevzuata hızlı erişim |
| 🏢 **İşveren** | Firma genelinde güvenlik durumunu tek bakışta görme, onay verme |
| 👷 **Çalışan** | Ramak kala/tehlike bildirimi gönderme, kendi eğitimlerini takip etme |

İkincil hedef kullanıcı: **birden fazla firmayı yöneten OSGB'ler / bağımsız İSG
danışmanları** (bkz. "Planlanan Modüller" → çoklu firma yönetimi).

## Hedef Sektörler

Türkiye'de 6331 sayılı Kanun kapsamında her işyeri risk sınıfına göre gruplanır.
Nöbetçi öncelik sırasıyla şu gruplara hitap eder:

1. **Çok tehlikeli sınıf** — inşaat, maden, ağır metal/sanayi. En yoğun risk
   değerlendirme ve periyodik kontrol ihtiyacı burada.
2. **Tehlikeli sınıf** — imalat/üretim, gıda üretimi, lojistik/depolama.
3. **Az tehlikeli sınıf** — ofis/hizmet sektörü, perakende. Daha hafif kullanım
   ama yasal zorunluluk aynı derecede geçerli.

Uygulama sektörden bağımsız, genel amaçlı İSG mantığıyla kurulmuştur; sektöre özel
şablon/kontrol listesi ihtiyacı **Planlanan Modüller** kapsamındadır.

## Platform Vizyonu

Nöbetçi, tek kullanıcılı bir prototipten **çok kiracılı (multi-tenant) kurumsal
SaaS**'a kademeli olarak dönüştürülmektedir. Uzun vadeli vizyon:

- **Mobil öncelikli** — sahada telefonla tam işlevsellik, masaüstü bir seçenektir.
- **AI, karar vericinin yerine geçmez, ona yardımcı olur** — her öneri düzenlenebilir
  ve onaya tabidir.
- **Kademeli güvenilirlik** — mock veri açıkça işaretlenir, gerçek veri gibi
  sunulmaz.
- **Kırılmadan büyüme** — yeni özellik, çalışan özelliği bozarak eklenmez.

Vizyonun tam metni için bkz. [VISION.md](./VISION.md).

## Mevcut Teknoloji

| Katman | Teknoloji |
|---|---|
| Frontend | React 18 + Vite, React Router |
| Stil | Tailwind CSS (CDN) |
| Veri katmanı | IndexedDB, tek soyutlama arkasında (`dataProvider.js`) |
| Yapay zeka | Anthropic API, Vercel Serverless Function proxy üzerinden |
| Tip güvenliği | JSDoc `@typedef` (henüz TypeScript'e geçilmedi) |
| Dağıtım | GitHub → Vercel, otomatik build |

Tam mimari açıklaması için bkz. [ARCHITECTURE.md](./ARCHITECTURE.md).

## Tamamlanan Modüller

Ürün yol haritasının **Phase 1–3** aralığı tamamlanmıştır (bkz.
[ROADMAP.md](./ROADMAP.md)):

- Firma / Şube / Departman / Çalışan yönetimi (Phase 1)
- Rol bazlı dashboard ve bildirim/denetim günlüğü altyapısı (Phase 1)
- Fine-Kinney risk değerlendirmesi: açıklamalı puanlama, artık risk, düzeltici
  faaliyet takibi, risk geçmişi, gelişmiş filtreleme (Phase 2)
- Periyodik kontrol takvimi (Phase 1)
- Yönetici dashboard'u: güvenlik skoru, KPI'lar, trendler (Phase 1)
- Bilgi Kütüphanesi: kategorili, aranabilir doküman arşivi (Phase 3, mock veri ile)
- Temel AI sohbet danışmanı ve fotoğraf yorumlama (Phase 4'ün başlangıcı)

Sprint bazlı tam kayıt için bkz. [SPRINTS.md](./SPRINTS.md) ve
[CHANGELOG.md](./CHANGELOG.md).

## Planlanan Modüller

Yol haritasının **Phase 4 (devamı) – Phase 9** aralığı (bkz.
[ROADMAP.md](./ROADMAP.md)):

- **AI Copilot'un genişletilmesi** — bağlama duyarlı, modül-bilinçli öneriler
- **RAG & Proaktif Besleme** — AI yanıtlarının Bilgi Kütüphanesi içeriğinden kaynaklı
  üretilmesi; kapanışta mevzuat takibi ve kullanıcı sormadan risk önerisi
- **Vision AI** — risk fotoğraflarından otomatik tehlike tespiti
- **Enterprise** — gerçek kimlik doğrulama, sunucu taraflı veri izolasyonu (RLS),
  çoklu firma (OSGB) yönetimi, gerçek doküman depolama
- **Mobile Platform** — PWA/Capacitor kararı, çevrimdışı AI davranışı
- **Canlı Kamera & Sensör AI** (Phase 9, ürünün son fazı) — Risk Tespiti havuzu, dar
  kapsamlı CV pilotu, Detect→Act→Coach döngüsü, gizlilik-by-design, opsiyonel kendi
  donanım paketi

Sektöre özel kontrol listesi/şablon kütüphanesi ve gerçek dosya yükleme, bu fazların
doğal uzantısı olarak değerlendirilecektir.

## Kodlama Yaklaşımı

- **Mevcut sistem bozulmaz.** Yeni özellik, çalışan bir özelliği silmeden/kırmadan
  eklenir.
- **Bağımlılık ve backend disiplini.** Aksi açıkça istenmedikçe yeni npm paketi veya
  backend eklenmez.
- **Mock veri açıkça işaretlenir.** Kullanıcıya gerçek veri gibi sunulmaz.
- **Tekrar eden kod ortak bileşene çıkarılır**, büyüyen bileşenler orkestratör + alt
  bileşen olarak bölünür.
- **Mobil öncelikli, responsive tasarım** zorunludur.
- Kod içi yorumlar ve arayüz metni **Türkçe**, değişken/fonksiyon isimleri İngilizce.

Tam kural seti için bkz. [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md).

## Yapay Zeka Yaklaşımı

**Temel ilke: AI önerir, insan onaylar.** Hiçbir AI çıktısı sessizce veya geri
dönüşsüz biçimde uygulanmaz; her öneri kullanıcının düzenleyip onaylayabileceği bir
alana yazılır (örn. Fine-Kinney AI önerisi, asıl risk değerini asla aşamayacak
şekilde kod seviyesinde sınırlıdır).

- Tüm AI çağrıları sunucu taraflı bir proxy (Vercel Serverless Function) üzerinden yürütülür;
  API anahtarı istemci koduna asla yazılmaz.
- Yeni bir AI özelliği eklenirken yeni bir sağlayıcı/kütüphane eklenmez — mevcut
  proxy deseni genişletilir.
- Planlanan genişlemeler (RAG, Vision AI) aynı ilkeyle: AI bulgu/öneri üretir,
  nihai karar ve onay insanda kalır.

Ayrıntı için bkz. [AI_ROADMAP.md](./AI_ROADMAP.md).

## Gelecek Mimarisi

Bugünkü mimari, gerçek bir backend'e **kırılmadan geçiş** yapacak şekilde
kuruldu:

- Tüm veri erişimi `dataProvider.js` arkasında tek noktadan geçer; backend değişince
  yalnızca bu dosyanın içindeki sağlayıcı değişecek, hiçbir servis/sayfa/component
  etkilenmeyecek.
- `authService.js`, gerçek Supabase Auth istemcisiyle aynı isim/imzada mock
  fonksiyonlar içerir.
- Kiracıya özel veri türlerinde `companyId` alanı kullanılır; offline aşamada aktif firma
  scope'lu servisler kayıtları filtreler ve legacy tek-firma kayıtlarını migration ile
  uyumlar. Bu local filtreleme server-side güvenlik değildir; gerçek Auth/RLS Phase 7
  kapsamındadır.

Hedef: **Supabase (Postgres + Auth + Row Level Security)**. Migrasyon adımları ve
şema planı için bkz. [DATABASE_PLAN.md](./DATABASE_PLAN.md). Bu geçiş, kullanıcı
açık onayı olmadan başlatılmaz.

---

## Bu Dosyayı Güncel Tutma Kuralı

- Yeni bir modül tamamlandığında **Tamamlanan Modüller** listesine eklenir,
  **Planlanan Modüller**'den çıkarılır.
- Vizyon veya hedef kitlede köklü bir değişiklik olursa ilgili bölüm **aynı gün**
  güncellenir — bu dosya geçmişe değil, projenin **şu anki gerçeğine** sadık kalır.
- Diğer `/docs` dosyalarıyla çelişki oluşursa (örn. `ROADMAP.md` faz sırası
  değişirse), önce bu dosya senkronize edilir.
