# Mimari

Bu doküman Nöbetçi'nin teknik mimarisini tanımlar: klasör yapısı, katmanlar arası
sorumluluk dağılımı ve modül bazlı tasarım kararları. Ürün odaklı bilgi için
[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md), veri katmanının geleceği için
[DATABASE_PLAN.md](./DATABASE_PLAN.md)'ye bakın.

---

## Klasör Yapısı

```
src/
  components/       Ortak UI (Button, Badge, Modal, Toast, EmptyState, icons/)
  contexts/         Theme, Role, IsgData, Toast, Language
  features/         Modül bazlı iş mantığı (chat, risk-analysis, dashboard,
                     company, knowledge-center, legislation, documents,
                     training, ...)
  services/         Veri erişimi ve dış entegrasyonlar
  pages/            Route bileşenleri (ince sarmalayıcılar)
  hooks/             Paylaşılan React hook'ları
  utils/            Saf yardımcı fonksiyonlar
  constants/        Statik veri, ölçekler, sabit listeler (JSX içermez)
  types/            JSDoc tip tanımları (tek dosya: index.js)
api/                chat.js — Anthropic API proxy (Vercel Serverless Function)
docs/               Bu dokümantasyon seti
```

Katman sınırı nettir: `pages` yalnızca başlık ayarlar ve `features`'ı render eder;
`features` iş mantığını içerir ve yalnızca `services` üzerinden veriye erişir;
`services` tek bir veri erişim noktasından (`dataProvider`) geçer. Bir bileşen bu
zinciri atlayıp alt katmana doğrudan erişmez.

## Component Mimarisi

Her özellik modülü **orkestratör + alt bileşenler** deseniyle kurulur: bir üst
bileşen state/veri akışını yönetir, görünümü küçük, tek sorumluluklu alt
bileşenlere devreder. Örnek — Risk modülü:

```
FineKinneyModule.jsx          (orkestratör: state, filtre, form açma/kapama)
  ├── FineKinneyForm.jsx      (giriş formu)
  ├── FineKinneyFilters.jsx   (arama/filtre çubuğu)
  ├── FineKinneyCard.jsx      (liste kartı)
  └── detail/
       ├── FineKinneyDetailDrawer.jsx   (sekme yöneticisi)
       └── tabs/*.jsx                   (6 bağımsız sekme bileşeni)
```

Kural: bir bileşen büyüdükçe (≈150+ satır veya birden fazla sorumluluk) yeniden
bölünür; asla tek dosyada büyümeye devam etmez (bkz.
[DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) → "Code Quality"). Tekrar eden alt-bloklar
(örn. üç kez tekrarlanan ölçek seçici) ortak bir bileşene çıkarılır
(`ScaleSelectField.jsx`).

## Servis Katmanı

Her veri türü kendi ince servis dosyasına sahiptir (`src/services/*.js`):
`companyService`, `riskService`, `employeeService`, `documentService`,
`notificationRecordService`, `auditService`, `chatService`, `authService`. Bir
servis şu sorumlulukları taşır:

- CRUD işlemlerini `dataProvider` üzerinden yürütmek
- İş kuralını uygulamak (örn. `companyId` damgalama, risk skoru hesaplama)
- Domain'e özel doğrulama

UI bileşenleri **asla** `dataProvider`'ı doğrudan çağırmaz — her zaman ilgili
servisten geçer. Bu, servis dosyasının tek "gerçek kaynak" (source of truth)
olmasını sağlar ve ileride bir servisin iç mantığı değişse bile çağıran
bileşenlerin etkilenmemesini garanti eder.

## Mock Veri Yapısı

Gerçek bir backend olmadığı için mock veri iki farklı biçimde kullanılır:

1. **Kalıcı mock (IndexedDB üzerinden)** — Fine-Kinney kayıtları, çalışanlar,
   dokümanlar gibi kullanıcı tarafından oluşturulan veri gerçekten saklanır,
   sayfa yenilendiğinde kaybolmaz. "Mock" olan backend değil, depolama ortamıdır
   (sunucu değil tarayıcı).
2. **Statik mock (sabit dosyalarda)** — Bilgi Kütüphanesi dokümanları
   (`constants/knowledgeCenter.js`) gibi henüz gerçek bir kaynağa bağlanmamış veri,
   düz JS sabitleri olarak tutulur ve her oturumda aynıdır.

Her iki durumda da mock olan kısım kod içinde **açıkça yorumla işaretlenir**
(bkz. [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) → "Architecture"). Örnek: risk ek
dosyaları (fotoğraf/PDF/Word/Excel) yalnızca `{ id, name, type, addedAt, addedBy }`
meta verisini tutar — gerçek dosya baytları depolanmaz.

## State Yönetimi

Harici bir state kütüphanesi (Redux, Zustand vb.) kullanılmaz; React'in kendi
araçları yeterli görülür:

| Kapsam | Araç |
|---|---|
| Sayfa/bileşen içi geçici state | `useState` |
| Modül genelinde paylaşılan state | Özel hook (örn. `useFineKinneyEntries`) |
| Uygulama genelinde paylaşılan state | React Context |
| Kalıcı kullanıcı tercihi (tema, widget görünürlüğü) | `useLocalStorage` + Context |

### Context'ler

| Context | Sorumluluk |
|---|---|
| `ThemeContext` | Açık/koyu tema |
| `RoleContext` | Aktif demo rolü (`expert`/`employer`/`employee`) |
| `IsgDataContext` | Sık erişilen paylaşılan veri (ekipman, bildirimler) |
| `ToastContext` | Genel bildirim/toast mesajları |
| `LanguageContext` | Dil tercihi |

Bir modülün kendine özel state'i (örn. Fine-Kinney filtreleri) o modülün kendi
hook'unda kalır — gereksiz yere global Context'e taşınmaz. Context yalnızca
gerçekten birden fazla, ilişkisiz modül arasında paylaşılan veri için kullanılır.

## UI Katmanı

`src/components/ui/` içindeki ortak bileşenler (Button, Badge, Modal, ConfirmDialog,
EmptyState, Loading, Toast) tüm modüllerde tekrar kullanılır; yeni bir arayüz
ihtiyacı önce burada aranır (bkz.
[DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) → "Code Quality").

- **Stil:** Tailwind CSS (CDN) — tema renkleri `constants/theme.js`'teki token'lar
  (`theme.surface`, `theme.accent`, `theme.textMuted`, vb.) üzerinden uygulanır,
  ham hex kod bileşen içine yazılmaz.
- **İkonlar:** `src/components/icons/index.jsx` içinde tek bir SVG ikon seti;
  harici ikon kütüphanesi bağımlılığı yoktur.
- **Responsive:** mobil öncelikli — varsayılan tek sütun, `sm:`/`md:`/`lg:` ile
  genişleyen grid; yatay listeler `overflow-x-auto` ile kaydırılabilir.
- **Code-splitting:** tüm sayfalar `React.lazy` + `Suspense` (`App.jsx`) ile
  yükleniyor — her sayfa yalnızca ziyaret edildiğinde indiriliyor.

## Dashboard Mimarisi

`DashboardPage.jsx`, URL'yi değiştirmeden (`/dashboard` her rol için aynı),
`RoleContext`'teki aktif role göre üç farklı dashboard'dan birini render eder:

```
DashboardPage.jsx
  ├── ExpertDashboard.jsx      (İSG Uzmanı görünümü)
  ├── EmployerDashboard.jsx    (İşveren görünümü)
  │     └── employer/
  │          ├── useEmployerDashboardData.js   (tüm KPI/veri hesaplaması)
  │          ├── ExecutiveSummaryCard.jsx
  │          ├── SafetyScoreCard.jsx
  │          ├── TrendsPanel.jsx
  │          ├── PerformancePanel.jsx
  │          └── CorrectiveActionsPanel.jsx
  └── EmployeeDashboard.jsx    (Çalışan görünümü)
```

Bu tasarımın bilinçli nedeni: gerçek kimlik doğrulama eklendiğinde `role` artık
demo `RoleContext`'ten değil, oturum bilgisinden gelecek — ama `DashboardPage.jsx`
**hiç değişmeyecek.** Tüm KPI/hesaplama mantığı `useEmployerDashboardData.js`'de
toplanır; alt bileşenler yalnızca hazır veriyi render eder, kendi hesaplama
mantığı taşımaz.

## Risk Modülü

Fine-Kinney risk değerlendirmesi, `features/risk-analysis/fineKinney/` altında
kendi kendine yeten bir alt sistemdir:

- **Puanlama:** `constants/fineKinney.js` — Olasılık × Maruziyet × Şiddet
  skalaları, her seçenek için referans açıklaması, skor→renk eşlemesi.
- **Veri akışı:** `useFineKinneyEntries.js` (liste + filtre + CRUD) ve
  `detail/useFineKinneyDetail.js` (tek kayıt için düzeltici faaliyet/ek
  dosya/not güncellemeleri) olmak üzere **iki ayrı hook**. Bu ayrım bilinçlidir:
  ana form kaydı ile detay sekmesi güncellemeleri farklı kalıcılık yolları
  kullanır (`saveFineKinneyEntry` vs. `patchFineKinneyEntry`), böylece biri
  diğerini bozma riski taşımaz.
- **Risk Geçmişi (timeline):** her create/update/kapatma/ek dosya/faaliyet/not
  işlemi, kaydın kendi `history` dizisine otomatik bir olay ekler
  (`historyEvent.js`). Bu, ayrı bir genel denetim günlüğünden (`auditService`)
  bağımsız, riske özel bir izlenebilirlik katmanıdır.
- **Filtreleme:** arama, risk seviyesi, departman, şube, durum, öncelik ve tarih
  aralığı — tamamı `useFineKinneyEntries.js` içinde `useMemo` ile hesaplanır.

## Knowledge Center

`features/knowledge-center/`, Bilgi Kütüphanesi'nin tamamen bağımsız bir
modülüdür — mevcut Dokümanlar (`/documents`) ve Mevzuat (`/legislation`)
sayfalarına dokunmaz:

```
useKnowledgeDocuments.js   (arama + kategori + tür filtreleme)
CategoryCard.jsx            (8 sabit kategori kartı)
DocumentFilters.jsx         (arama kutusu + tür filtresi)
DocumentCard.jsx            (liste öğesi)
DocumentDetailDrawer.jsx    (detay ekranı)
```

Veri kaynağı `constants/knowledgeCenter.js`'teki statik mock listesidir (bkz.
"Mock Veri Yapısı"). Modül, gerçek bir doküman deposu bağlandığında yalnızca
`useKnowledgeDocuments.js`'in veri kaynağı satırının değişmesini gerektirecek
şekilde tasarlandı — bileşenler etkilenmeyecek.

## AI Modülü

Frontend, hiçbir zaman AI sağlayıcı API anahtarını görmez. Tüm çağrılar tek bir
yoldan akar:

```
UI bileşeni → chatService.js → api/chat.js (Vercel Serverless Function proxy) → Anthropic API
```

`ANTHROPIC_API_KEY` yalnızca Vercel ortam değişkeninde tutulur. Bugün bu yol
üzerinden üç özellik çalışır: serbest sohbet/fotoğraf yorumlama, Fine-Kinney
önlem/KKD önerisi ve Bilgi Kütüphanesi "AI'ya Sor" (bkz. Phase 5 — RAG'in ilk,
anahtar kelime tabanlı sürümü: `useKnowledgeAI.js`, soruyu önce yerel
`findRelevantDocuments` ile ilgili dokümanlara daraltır, sonra bunları AI'ye
bağlam olarak verir ve kaynak dokümanı her zaman cevapla birlikte gösterir).
İkinci özellikte (Fine-Kinney) önemli bir mimari güvenlik önlemi vardır:
AI'nin önerdiği artık risk değerleri kod seviyesinde asıl risk değerini aşamaz
(`Math.min` ile sınırlı) ve her zaman kullanıcının düzenleyip onaylayacağı bir
alana yazılır. Bu ilke ("AI önerir, insan onaylar"), planlanan tüm AI
genişlemelerinde (tam RAG, Vision AI) korunacaktır — ayrıntı için
[AI_ROADMAP.md](./AI_ROADMAP.md).

## Gelecekteki Supabase Entegrasyonu

Mevcut mimari, gerçek backend'e **kırılmadan geçiş** için baştan tasarlandı:

- Tüm veri erişimi `dataProvider.js`'in dört metodundan
  (`getAll/getById/upsert/remove`) geçer. Bu arayüz, Supabase istemcisiyle aynı
  şekilde tasarlandı — geçişte yalnızca aktif sağlayıcı satırı değişecek, hiçbir
  domain servisi/context/sayfa değişmeyecek.
- `authService.js`, Supabase Auth istemcisiyle aynı isim/imzada mock
  fonksiyonlar (`signUp`, `signIn`, `signOut`, `getSession`,
  `onAuthStateChange`) içerir.
- Kiracıya özel kayıtların `companyId` alanı veri modelinde bulunur ve offline aşamada
  company-scoped servisler üzerinden aktif firmaya göre okunur/yazılır. Eski tek-firma
  kayıtları ilk açılışta güvenli migration ile seçili tek firmaya bağlanır; mevcut id'ler
  korunur, yeni kayıtlar UUID kullanır.
- Bu local filtreleme **server-side güvenlik değildir**. Gerçek çok kiracılı koruma,
  Supabase Auth ve Row Level Security Phase 7'de kurulacaktır; offline sürüm ortak
  cihaz/tarayıcı erişimine karşı kurumsal authentication garantisi vermez.

Local legacy kayıt migration'ı yalnızca mevcut tek-firma verisini `companyId` ile
uyumlamak için uygulama açılışında güvenli biçimde çalışır. Supabase/Auth/RLS veri
migration'ı ise bu sprintte başlatılmaz ve kullanıcı/kurum onayı olmadan yapılmayacaktır
(bkz. [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) → "Architecture"). Tam şema ve
adım adım plan için [DATABASE_PLAN.md](./DATABASE_PLAN.md)'ye bakın.

---

## Bilinçli Olarak Yapılmayanlar

- Gerçek backend, Supabase Auth, RLS, server-side authorization ve cloud storage.
- Genel amaçlı CRUD factory'nin sınırsız genişletilmesi — mevcut `createCrudService.js`
  yalnızca tekrar eden local CRUD + company scope davranışını merkezi tutar; servis-özel
  iş kuralları ilgili servislerde kalır.
- TypeScript'e geçiş — JSDoc yeterli tip güvenliği sağlıyor.
- Harici state yönetim kütüphanesi — React Context + hook'lar bu ölçek için
  yeterli.
