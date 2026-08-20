# Geliştirme Raporu

Bu dosya, her geliştirme sonunda [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) →
"Development Report" standardına göre eklenen, **tarihe göre tersten sıralı**
raporların kaydıdır. En yeni rapor en üsttedir.

## [AI Mevzuat Öneri Sistemi + Export Sadeleştirme] · Phase 5

### Eklenen
- **AI Mevzuat Öneri Sistemi**: Risk Detay → Düzeltici Faaliyetler sekmesine
  `AIRegulationSuggestionsPanel.jsx` eklendi. İSG uzmanı bir mevzuat/yönetmelik
  PDF'i yükler, AI (Claude'un `document` içerik bloğu ile, gerçek PDF okuma —
  OCR/metin çıkarma hack'i değil) bu tehlike/riskle ilgili 3-6 farklı somut
  düzeltici faaliyet önerir. Her öneri ayrı kart + "Ekle" butonu — hiçbiri
  otomatik eklenmez ("AI önerir, insan onaylar" ilkesi).
- `sendDocumentAnalysis()` (chatService.js) — PDF/document analiz çağrısı için
  yeni fonksiyon, `sendPhotoAnalysis()` ile aynı desende.
- `FINE_KINNEY_REGULATION_ACTIONS_PROMPT` + `parseActionSuggestions()`
  (systemPrompt.js) — numaralandırılmış öneri listesini ayrıştırır.
- `validatePdfFile()` (fileValidation.js) — boyut (6MB) + gerçek PDF imzası
  ("%PDF" magic bytes) doğrulaması, mevcut `validateImageFile()` ile aynı desen.

### Değişen
- `api/chat.js` → `MAX_PAYLOAD_BYTES` 4MB'den 8MB'e yükseltildi (Güvenlik
  Sprinti'nde konan sınır; PDF'ler fotoğraflardan büyük olabildiği için
  gözden geçirildi — hâlâ sınırlı, sınırsız değil).
- Fine-Kinney export tablosundan **Sorumlu** ve **Şube** sütunları kaldırıldı
  (müşteri talebi — Sorumlu zaten düzeltici faaliyet listesinde tutuluyor).
- PDF export'ta Skor/Risk Seviyesi hücreleri için, uygulama genelindeki açık
  tonlu rozet paletinden BAĞIMSIZ, daha doygun bir "yalnızca PDF" renk seti
  eklendi (`PDF_RISK_COLORS`) — önceki renkler basılı belgede yeterince göze
  çarpmıyordu (müşteri geri bildirimi, ekran görüntüsüyle doğrulandı).

### Etkilenen Modüller

- Yeni: `AIRegulationSuggestionsPanel.jsx`.
- Değişen: `chatService.js`, `systemPrompt.js`, `fileValidation.js`,
  `CorrectiveActionsTab.jsx`, `fineKinneyExport.js`,
  `FineKinneyExportButtons.jsx`, `api/chat.js`.

### Bilinen Riskler

- PDF'ten öneri üretimi, AI'nin dokümanı doğru okuyup okumadığına bağlı —
  prompt "dokümanda olmayan mevzuat detayını uydurma" diye sıkı şekilde
  uyarıyor ama %100 garanti değil. İSG uzmanının önerileri gözden geçirip
  eklemesi zaten tasarımın parçası (tek tık = onay, otomatik ekleme değil).
  Bu conversation'da gerçek bir Anthropic API çağrısı YAPILAMADI (sandbox'ta
  network yok) — prompt/parser mantığı statik olarak doğrulandı, gerçek AI
  cevabıyla uçtan uca test edilmedi. İlk kullanımda dikkatli test edilmeli.
- 6MB PDF sınırı büyük/çok sayfalı yönetmelikler için yetersiz kalabilir —
  gerekirse yükseltilebilir ama `api/chat.js`'teki 8MB payload tavanıyla
  uyumlu kalmalı.

### Sonraki Öneriler

- Gerçek kullanımda (Vercel'e deploy sonrası) bu özellik mutlaka canlı test
  edilmeli — sandbox'ta API çağrısı yapılamadığı için doğrulanamadı.
- "Firma bilgili CSV" sorusu müşteriye soruldu, cevap bekleniyor — henüz
  kod yazılmadı.

### Documentation Check

- `SPRINTS.md`, `CHANGELOG.md`: güncellendi.
- `AI_ROADMAP.md`: güncellenmedi ama güncellenmeli — bu, "AI önerir, insan
  onaylar" ilkesinin yeni bir somut örneği, roadmap dokümanına eklenmesi
  faydalı olur (bir sonraki teslimatta yapılabilir).

---

## Fine-Kinney Export Geliştirmesi — Etkilenenler, Renkli Skor, Firma Bilgisi

**Bağlam:** Müşteri, yüklediği gerçek bir akaryakıt istasyonu Fine-Kinney
örneğini (242 satır) ve standart Euronorm.net risk renklendirme tablosunu
paylaşarak uygulamanın renk şemasını buna göre ayarlamamı istedi; ayrıca
export'a Sıra No, Etkilenenler ve otomatik firma bilgisi eklenmesini istedi.

### Yapılan Geliştirmeler

- `affected` (Etkilenenler) alanı veri modeline eklendi — `FineKinneyForm.jsx`,
  `RiskInfoTab.jsx`, `fineKinneyExport.js` güncellendi.
- `getFineKinneyRiskLevel()` renk paleti yeşil/mavi/sarı/turuncu/kırmızı
  olarak değiştirildi — TEK kaynak olduğu için (Risk Isı Haritası dahil) her
  yerde otomatik yayıldı, ayrı ayrı güncelleme gerekmedi.
- PDF export'a Sıra No sütunu ve Skor/Risk Seviyesi hücrelerinde satır rengi
  eklendi.
- PDF export'un başına `getPrimaryCompany()`'den çekilen firma bilgisi
  (ad, sektör, VKN, adres) otomatik ekleniyor.

### Etkilenen Modüller

- `src/constants/fineKinney.js` (renk paleti)
- `src/features/risk-analysis/fineKinney/fineKinneyExport.js` (yeni sütunlar)
- `src/features/risk-analysis/fineKinney/FineKinneyForm.jsx` (yeni alan)
- `src/features/risk-analysis/fineKinney/FineKinneyExportButtons.jsx` (firma
  bilgisi + renkli PDF, async hale getirildi)
- `src/features/risk-analysis/fineKinney/detail/tabs/RiskInfoTab.jsx`
- `src/types/index.js`

### Bilinen Riskler

- Firma bilgisi çekilemezse (ör. henüz firma profili girilmemişse) PDF export
  ENGELLENMİYOR — firma bilgisi olmadan devam ediyor ve kullanıcıya kısa bir
  uyarı gösteriliyor. Bilinçli tercih: export'un tamamen durması, eksik bir
  başlıktan daha kötü bir kullanıcı deneyimi olurdu.
- Yeni `affected` alanı eski (önceden oluşturulmuş) kayıtlarda boş olacak —
  bu beklenen davranış, geriye dönük veri migrasyonu yapılmadı (gerek yok,
  alan opsiyonel).
- Playwright ile gerçek HTML/CSS şablonu render edilip renkler görsel olarak
  doğrulandı (`preview2_screenshot.png`) — tahmini değil, gerçek çıktı.

### Sonraki Öneriler

- CSV export'a firma bilgisi eklenmedi (bilinçli — CSV'nin ilk satırı hâlâ
  başlık satırı, veri işleme araçlarıyla uyumluluğu bozmamak için). İstenirse
  ayrı bir "firma bilgili CSV" varyantı ayrı sprint olarak eklenebilir.

### Documentation Check

- `SPRINTS.md`, `CHANGELOG.md`: güncellendi.
- `DATABASE_PLAN.md`: güncellenmedi — `affected` opsiyonel bir alan eklemesi,
  şema dokümantasyonunu değiştirecek büyüklükte bir mimari karar değil.

---

## Excel Export — O/F/Ş Referans Skala Tabloları + Risk Derecesi Tablosu

**Bağlam:** Önceki teslimatta bilinçli olarak dışarıda bırakılan referans
skala tabloları, kullanıcı onayıyla eklendi.

### Yapılan Geliştirmeler

- `buildFineKinneyReferenceRows()` (fineKinneyExport.js) — Olasılık,
  Sıklık/Maruziyet, Şiddet skala tabloları + Risk Derecesi karar tablosu.
- **BİLİNÇLİ TERCİH:** Bu değerler referans görselden elle kopyalanmadı —
  uygulamanın ZATEN KULLANDIĞI gerçek sabitlerden (`PROBABILITY_SCALE`,
  `FREQUENCY_SCALE`, `SEVERITY_SCALE`, `getFineKinneyRiskLevel` eşikleri)
  üretiliyor. Bu, form ile export'un birbirinden SAPMASINI imkansız kılar —
  tek kaynak. Görselden OCR/elle kopyalama riskli olurdu (yanlış rakam
  girme ihtimali).
- Excel export sırası: Firma bilgisi bloğu → boş satır → 4 referans tablosu
  → boş satır → asıl Fine-Kinney tablosu (değişmedi).

### Doğrulama

- Gerçek LibreOffice dönüşümüyle (CSV → XLSX → PDF → PNG) görsel olarak
  doğrulandı, tahmini değil. `full-header-page-1.png`.

### Documentation Check

- `CHANGELOG.md` güncellendi. Zip hâlâ oluşturulmadı.

---

## Excel Export — Sabit Firma Bilgisi Alanı (Aynı Dosya, Ayrı Dosya Değil)

**Bağlam:** Müşteri gerçek bir referans doküman (TCDD Alsancak Gar risk analizi)
paylaşarak, "ayrı dosya değil, Excel'in en üstünde sabit bir firma bilgisi alanı,
aşağıdaki Fine-Kinney tablosunu etkilemesin" istedi.

### Yapılan Geliştirmeler

- `utils/exportCsv.js` genişletildi: `buildCsvWithHeaderBlock()` +
  `downloadCsvWithHeaderBlock()` — mevcut `buildCsv`/`downloadCsv`'ye
  DOKUNMADAN (diğer 2 kullanıcısı: `CsvImportButton.jsx`,
  `DashboardExportButtons.jsx` etkilenmedi), yeni, ayrı fonksiyonlar.
- `fineKinneyExport.js` → `buildFineKinneyHeaderBlockRows(company)` —
  referans dokümandaki alan isimleriyle birebir aynı 12 satırlık başlık
  bloğu. Sistemde bulunan alanlar (firma adı, adres, tarih) otomatik
  dolduruluyor; sistemde KARŞILIĞI OLMAYAN alanlar (SGK Sicil No, İşveren
  Vekili, İSG Uzmanı, İşyeri Hekimi, Çalışan Temsilcisi, Destek Elemanları,
  Diğer Ekip Üyeleri) BOŞ bırakılıyor — uydurma veri konulmadı, kullanıcı
  Excel'de elle dolduracak.
- `FineKinneyExportButtons.jsx` → Excel export artık PDF gibi async, firma
  bilgisini `getPrimaryCompany()`'den çekiyor, ayrı loading/error state.

### Doğrulama

- CSV çıktısı gerçek LibreOffice ile (`soffice --headless --convert-to xlsx`)
  gerçek bir spreadsheet'e dönüştürülüp PNG'ye render edildi — TAHMİNİ değil,
  gerçek dönüşüm. İlk denemede yanlış ayraç algılandığı görüldü (araç
  hatası, dosya hatası değil); doğru ayraçla (`;`) açıldığında beklenen
  düzen doğrulandı: firma bilgisi bloğu üstte 2 sütun halinde, boş satır,
  altında Fine-Kinney tablosu bozulmadan duruyor.
- BOM + `;` kombinasyonu gerçek Excel'de zaten önceden doğrulanmış bir
  davranış (bkz. "Türkçe Excel Uyumluluğu" sprint'i) — bu yeni özellik aynı
  temel mekanizmayı kullanıyor, yeni bir uyumluluk riski eklemedi.

### Bilinen Riskler

- Boş bırakılan alanlar (SGK Sicil No vb.) formda/veri modelinde henüz yok.
  İleride bu alanlar gerçekten isteniyorsa (örn. firma profiline "İSG Uzmanı
  adı" eklemek), Company type'ına yeni alanlar eklemek gerekir — ayrı,
  onaylanması gereken bir veri modeli kararı, bu sprintte yapılmadı.
- O/S/Ş referans skala tabloları ve "Kabul Edilebilir/Orta/Yüksek" risk
  karar tablosu (referans dokümanın sağ üst köşesinde) BİLİNÇLİ olarak
  eklenmedi — istenmedi, kapsam dışı tutuldu. İstenirse ayrı madde olarak
  eklenebilir.

### Documentation Check

- `CHANGELOG.md`, `SPRINTS.md`: güncellendi.
- Zip henüz oluşturulmadı — kullanıcı "geliştirmeye devam, en son zip
  yaparsın" dedi.

---

## Güvenlik Sprinti — Açık Proxy, Dosya Doğrulama, Vercel Header'ları, CSV Sınırları

**Bağlam:** Önceki turda kod yazmadan sunulan güvenlik/dosya bulguları listesinden
son 2 madde (zaten tamamlanmış olanlar + PIN kilidi kararı) hariç, kalan 4 madde
tek sprint olarak yapıldı.

### Yapılan Geliştirmeler

**1) `api/chat.js` — açık proxy kapatıldı (EN KRİTİK)**
- Öncesi: rate limit yok, payload boyutu sınırı yok, origin kontrolü yok,
  `max_tokens` tamamen istemcinin kontrolündeydi. URL'i bulan HERKES
  `ANTHROPIC_API_KEY`'in faturasına sınırsız yük bindirebilirdi.
- `max_tokens` artık sunucu tarafında **2000 tavanına** sabitlendi (en yüksek
  meşru kullanım 1500'dü) — istemci ne gönderirse göndersin aşılamaz.
- Payload boyutu **4MB** ile sınırlandı (413 döner).
- Basit bellek-içi **rate limit**: IP başına dakikada 20 istek (429 döner).
  BİLİNÇLİ SINIRLAMA: Vercel fonksiyonları durumsuz olduğu için bu yalnızca
  "sıcak" instance'lar arasında geçerli, cold start'ta sıfırlanır — kesin
  değil, ek bir sürtünme katmanı. Gerçek/kalıcı rate limit için Vercel KV/
  Upstash gerekir; bu yeni bir backend kararı olduğu için onay olmadan
  eklenmedi.
- **Origin kontrolü**: `req.headers.host` ile karşılaştırılıyor (başka bir
  sitenin bu endpoint'i kendi sayfasına gömmesini engeller). Origin header'ı
  göndermeyen doğrudan bir curl çağrısını durdurmaz — o senaryo için asıl
  koruma rate limit + max_tokens tavanıdır.

**2) Dosya yükleme doğrulaması — `utils/fileValidation.js` (yeni)**
- `validateImageFile()`: boyut sınırı (varsayılan 5MB) + dosyanın ilk
  baytlarına bakıp GERÇEKTEN JPEG/PNG/GIF/WEBP olduğunu doğrulama (magic
  bytes) — `accept="image/*"` yalnızca tarayıcı ipucuydu, gerçek kontrol
  değildi.
- Bağlandığı 4 nokta: `ChatPanel.jsx` (AI fotoğraf analizi), `CompanyInfoSection.jsx`
  (logo), `Profile.jsx` (profil fotoğrafı), `RiskDetectionPanel.jsx` (risk
  tespit fotoğrafı). Geçersiz dosyada mevcut `ToastContext` ile hata mesajı
  gösteriliyor — yeni bir UI mekanizması icat edilmedi.

**3) Vercel güvenlik header'ları — `vercel.json`**
- Eklenen (risk yok, kesin fayda): `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (`camera=(self)` — `DocumentsPage.jsx`'teki QR
  `getUserMedia` kamera erişimini KIRMAMAK için özellikle `(self)`, `()` değil).
- **CSP bilinçli olarak `Content-Security-Policy-Report-Only` olarak eklendi,
  ZORLAYICI DEĞİL.** Neden: uygulama `cdn.tailwindcss.com` (Play CDN — resmi
  olarak "production için değil" ama mevcut mimarinin temeli) ile çalışma
  zamanında inline `<style>` üretiyor; bunu sandbox'ta gerçek bir tarayıcıda
  test edemedim (network yok, npm install yok). Zorlayıcı bir CSP yanlış
  yazılırsa TÜM UYGULAMA STİLSİZ/BOZUK görünebilir — bu, ben göremeden canlıya
  çıkacak bir regresyon riski. Report-Only modu HİÇBİR ŞEYİ ENGELLEMEZ, yalnızca
  ihlalleri tarayıcı konsoluna loglar. **Sonraki adım:** siteyi birkaç gün
  Report-Only ile kullan, tarayıcı konsolunda (F12 → Console) hiç CSP ihlali
  görünmüyorsa, `vercel.json`'da `Content-Security-Policy-Report-Only`
  anahtarını `Content-Security-Policy` olarak değiştir (zorlayıcı hale gelir).

**4) CSV/JSON içe aktarma sınırları**
- `CsvImportButton.jsx`: 2MB dosya boyutu + 5000 satır sınırı, aşılırsa
  Toast ile net hata.
- `BackupSection.jsx` (yedek geri yükleme): 25MB sınırı (gömülü görseller
  içerebileceği için CSV'den daha yüksek tutuldu).

### Etkilenen Modüller

- Yeni: `src/utils/fileValidation.js`.
- Değişen: `api/chat.js`, `vercel.json`, `ChatPanel.jsx`,
  `CompanyInfoSection.jsx`, `Profile.jsx`, `RiskDetectionPanel.jsx`,
  `CsvImportButton.jsx`, `BackupSection.jsx`.

### Bilinen Riskler / Test Edilemeyenler

- **CSP Report-Only'nin gerçek tarayıcıda ihlal üretip üretmediğini
  DOĞRULAYAMADIM** (sandbox'ta network/browser yok) — yukarıdaki "sonraki
  adım" bu yüzden var, körlemesine zorlayıcı moda GEÇİLMEMELİ.
  `cdn.jsdelivr.net` (jsQR) ve Google Fonts domain'leri CSP'ye eklendi ama
  bunlar da aynı şekilde doğrulanamadı.
  - **Vercel Function region uyarısı:** rate limit Map'i tek instance'a
  özgü — birden fazla Vercel bölgesi/instance'ı varsa (yüksek trafikte
  olası) her biri kendi sayacını tutar, toplam limit teorik olarak
  N × 20/dk olabilir. Küçük ölçekli kullanım için (60 çalışanlık tek
  fabrika) bu pratikte önemsiz.
- `api/chat.js`'teki origin kontrolü `req.headers.host`'a güveniyor; bu,
  Vercel'in kendi TLS sonlandırmasından geldiği için güvenilir kabul edildi.

### Sonraki Öneriler

- CSP Report-Only birkaç gün izlendikten sonra zorlayıcıya geçirilmeli.
- Gerçek/kalıcı rate limit isteniyorsa Vercel KV/Upstash kararı ayrı onay
  gerektirir.
- PIN kilidi hâlâ ayrı, bekleyen bir karar (kod yazılmadı).

### Documentation Check

- `CHANGELOG.md`, `SPRINTS.md`: güncellendi.
- `ROADMAP.md`, `ARCHITECTURE.md`, `DATABASE_PLAN.md`: güncellenmedi — veri
  modeli değişmedi.

---

## Departman Detay Paneli, İsim Eşleştirme, Eğitim Uyum Listesi, Çoklu Şube UI Gizleme

**Bağlam:** Müşteri, Risk Isı Haritası'na tıklanabilir detay paneli istedi (6
alan) + kendi "isterim" listesindeki 4 maddeyi onayladı + tek şubeli
firmalarda çoklu şube arayüzünün gizlenmesini istedi.

### Yapılan Geliştirmeler

- **Departman Detay Paneli**: `DepartmentHeatMap.jsx` artık tıklanabilir;
  `DepartmentDetailPanel.jsx` (Modal.jsx üzerine) 6 alanı gösterir. Panel
  BİLİNÇLİ olarak iki güven seviyesini görsel olarak ayırıyor: üstte
  departmentId'ye doğrudan bağlı (güvenilir) alanlar, altta bir "isim
  eşleştirmesiyle hesaplandı" uyarı kutusu + best-effort alanlar.
- **İsim→çalışan eşleştirme altyapısı** (`employeeNameMatch.js`): bu, hem
  panelin hem yeni eğitim listesinin ortak temeli. Veri modelini
  DEĞİŞTİRMEDİ (Notification/TrainingCompletion'a employeeId eklemek daha
  büyük bir karar, ROADMAP.md Backlog'da duruyor) — mevcut serbest metin
  isimle en iyi eşleşmeyi yapan bir köprü.
- **Eğitim Uyum Listesi**: mevcut `ParticipantListPanel.jsx`'ten farklı
  olarak kurs bazlı değil ÇALIŞAN bazlı; hiç eğitime başlamamış çalışanlar
  da (mevcut kurs bazlı listede hiç görünmüyorlardı) artık görünüyor.
- **Çoklu şube UI gizleme**: `useCompanyOrgLists.hasMultipleBranches`
  eklendi; 3 dosyada (Filters, Form, RiskInfoTab) Şube alanı tek şubeli
  firmalarda tamamen kayboluyor. `BranchesSection.jsx` (şube EKLEME ekranı)
  bilerek dokunulmadı — o, ikinci şubeyi eklemek isteyen firma için hep
  açık kalmalı.

### İncelenip Kod Yazılmayanlar

- "Uygulama dışına ulaşan hatırlatma": `useReminderScheduler.js` zaten
  periyodik kontrol/eğitim gecikmelerinde tarayıcı bildirim gösteriyor.
  Uygulama tamamen kapalıyken de bildirim (gerçek Push API + backend)
  şu an yok — bu, yeni backend altyapısı gerektirir, DEVELOPMENT_RULES.md
  gereği açık onay olmadan eklenmedi.
- "Veri Yedekleme/Dışa Aktarma": `backupService.js` + `BackupSection.jsx`
  zaten tam JSON yedekleme/geri yükleme sağlıyor.

### Etkilenen Modüller

- Yeni: `DepartmentDetailPanel.jsx`, `departmentDetail.js`,
  `employeeNameMatch.js`, `trainingComplianceGaps.js`,
  `TrainingComplianceListCard.jsx`.
- Değişen: `DepartmentHeatMap.jsx`, `EmployerOverviewTab.jsx`,
  `useEmployerDashboardData.js`, `useWidgetVisibility.js`,
  `useCompanyOrgLists.js`, `FineKinneyFilters.jsx`, `FineKinneyForm.jsx`,
  `RiskInfoTab.jsx`.

### Bilinen Riskler

- İsim eşleştirmesi (%100 doğru değil): iki çalışan aynı adı taşıyorsa veya
  isim yanlış girildiyse yanlış/eksik sonuç verir. Tüm ilgili ekranlarda bu
  açıkça belirtiliyor, gizlenmiyor.
- `FineKinneyExportButtons.jsx` (CSV/PDF export) bilerek DOKUNULMADI — dışa
  aktarılan dosyada Şube sütunu tek şubeli firmada da kalıyor (boş/"Belirtilmedi"
  görünür). Kayıt tutma amaçlı dosyalarda bu zararsız; sadece interaktif
  filtre/form arayüzlerindeki gereksiz karmaşıklık giderildi.

### Sonraki Öneriler

- Gerçek "uygulama kapalıyken de bildirim" istenirse (Web Push API + VAPID +
  backend endpoint) ayrı bir onay ve sprint gerekir.
- İsim eşleştirmesi yerine gerçek `employeeId` foreign key'e geçiş,
  ROADMAP.md → Backlog'da bekliyor; büyük veri modeli değişikliği.

### Documentation Check

- `SPRINTS.md`, `CHANGELOG.md`: güncellendi.
- `ROADMAP.md`, `ARCHITECTURE.md`, `DATABASE_PLAN.md`: güncellenmedi — veri
  modeli şemaları değişmedi (yalnızca hesaplama katmanı ve UI koşulları).

---

## Sprint 5-8: Denetim Dosyası, Eğitim Sertifikası, Risk Trend, Mevzuat Uyarısı

**Bağlam:** Müşteri onaylı sprint listesinin kalan 4 maddesi tek oturumda,
tek teslimde yapıldı (madde madde zip istenmedi).

### Yapılan Geliştirmeler

**5. Tek Tık Denetim Dosyası**
- `auditPackageExport.js`: tarih aralığı filtreli Fine-Kinney + periyodik
  kontrol + eğitim özet PDF'i. `DashboardExportButtons.jsx`'teki tek sayfalık
  KPI özetinden BİLİNÇLİ olarak ayrı tutuldu — farklı ihtiyaç, farklı veri
  şekli.
- `AuditPackageButton.jsx`: tarih seçici UI.
- `useEmployerDashboardData.js`: `trainingCompletionRecords` artık hook
  return'ünde (önceden hesaplanıyordu ama dışa açılmıyordu).

**6. Eğitim Sertifika Otomasyonu**
- Kod yazılmadı. `printTrainingCompletionCertificate.js` incelendi,
  istenen işlevi (tamamlama anında PDF üretimi) zaten karşılıyor. Gereksiz
  tekrar iş üretilmedi (DEVELOPMENT_RULES.md → "mevcut componentleri yeniden
  kullan").

**7. Ramak Kala/Risk Trend Uyarısı**
- `departmentRiskTrend.js`: departman bazlı 30/30 gün karşılaştırması.
- `DepartmentTrendAlertCard.jsx`: artan departmanları listeler.

**8. Mevzuat Değişikliği → Etkilenen Risk İşaretleme**
- `legislationRiskLinker.js`: RAG-lite anahtar kelime örtüşmesi.
- `LegislationImpactCard.jsx`: eşleşen mevzuat + etkilenen açık risk
  kayıtları, "uzmanla teyit edin" notuyla.

### Etkilenen Modüller

- Yeni dosyalar: `auditPackageExport.js`, `AuditPackageButton.jsx`,
  `departmentRiskTrend.js`, `DepartmentTrendAlertCard.jsx`,
  `legislationRiskLinker.js`, `LegislationImpactCard.jsx`.
- Değişen: `useEmployerDashboardData.js` (1 satır — yeni return alanı),
  `EmployerOverviewTab.jsx` (3 yeni widget bloğu + import'lar),
  `useWidgetVisibility.js` (3 yeni widget kaydı).
- Dokunulmayan: `DashboardExportButtons.jsx`, `DepartmentRiskBreakdown.jsx`,
  `printTrainingCompletionCertificate.js`, tüm Eğitim modülü dosyaları.

### Bilinen Riskler

- **Mevzuat uyarısı, mevcut mock veriyle muhtemelen BOŞ görünecek.**
  `MOCK_KNOWLEDGE_DOCUMENTS`'taki en güncel `updatedAt` "2026-02-10"; sistem
  saatine göre 90 günlük pencerenin dışında kalabilir. Bu bir hata değil —
  sahte veri üretmemek için bilinçli tasarım (DEVELOPMENT_RULES.md). Gerçek
  mevzuat verisi/tarihleri girildiğinde otomatik çalışacak.
- Denetim Dosyası'ndaki periyodik kontrol filtresi `lastCheckDate` alanına
  göre yapılıyor; bu alan boşsa (hiç kontrol yapılmamışsa) o kayıt dosyada
  görünmez — beklenen davranış, ama kullanıcıya "neden görünmüyor" diye
  sorulursa kaynağı budur.
- Mevzuat eşleştirmesi kelime bazlı — yanlış pozitif/negatif üretebilir.
  UI'da "gerçek hukuki analiz değildir, uzmanla teyit edin" notu bu yüzden var.

### Sonraki Öneriler

- Onaylanan 8 maddenin tamamı tamamlandı. Sıradaki adım: müşterinin bunları
  test edip onaylaması; ardından `ROADMAP.md` → Backlog'daki ertelenmiş
  maddelere (ekipman maliyet/duruş, vardiya alanı, şeffaf ROI hesaplayıcı)
  geçilebilir — ama veri modeli netleşmeden kodlanmayacak.

### Documentation Check

- `SPRINTS.md`, `CHANGELOG.md`: güncellendi (4 madde de eklendi).
- `ROADMAP.md`, `ARCHITECTURE.md`, `DATABASE_PLAN.md`: güncellenmedi — hiçbiri
  yeni veri modeli veya mimari katman gerektirmedi (hepsi mevcut alanlar
  üzerinden hesaplandı).

---

## Bölüm Bazlı Risk Isı Haritası

**Bağlam:** Sprint listesinin 4. maddesi — "hangi bölümde en çok risk var"
sorusu zaten `DepartmentRiskBreakdown` ile (kayıt sayısı) cevaplanıyordu;
müşteri talebi bunun bir "ısı haritası" olmasıydı, bu yüzden sayının ötesine
geçip **şiddeti** (ortalama Fine-Kinney skoru) esas alan tamamlayıcı bir
görünüm eklendi.

### Yapılan Geliştirmeler

- `src/features/dashboard/employer/DepartmentHeatMap.jsx` — her departman
  için tüm Fine-Kinney kayıtlarının ortalama skorunu hesaplar, mevcut 5'li
  risk seviyesi renklendirmesini (`getFineKinneyRiskLevel`) uygular, en
  tehlikeliyi en üste sıralar. Kaç kaydın yüksek/çok yüksek seviyede olduğunu
  da alt satırda gösterir.
- `EmployerOverviewTab.jsx`'e, mevcut "Departman Bazlı Risk Dağılımı"
  widget'ının hemen altına eklendi — biri diğerinin yerine geçmiyor.
- `useWidgetVisibility.js`'e yeni widget kaydı (`departmentHeatMap`) eklendi;
  kullanıcı isterse gizleyebilir.

### Etkilenen Modüller

- `src/features/dashboard/employer/DepartmentHeatMap.jsx` (yeni dosya)
- `src/features/dashboard/employer/EmployerOverviewTab.jsx` (widget eklendi)
- `src/hooks/useWidgetVisibility.js` (yeni widget kaydı)
- `DepartmentRiskBreakdown.jsx`'e **dokunulmadı** — mevcut davranışı korunuyor.

### Bilinen Riskler

- Şube (branch) kırılımı yok, yalnızca departman. Firmada tek şube olduğu
  varsayımıyla şimdilik yeterli görüldü; çok şubeli kullanım senaryosu
  gelirse ayrı bir sprint gerekir (`ROADMAP.md` → Backlog'a eklenmedi çünkü
  şu an talep yok, gerektiğinde eklenir).
- Ortalama skor, az sayıda kayıtla (örn. 1 kayıt) yanıltıcı olabilir — bir
  departmanın "1 kayıt, çok yüksek" görünmesi o departmanın genel olarak
  tehlikeli olduğu anlamına gelmeyebilir. Kart bu yüzden kayıt sayısını da
  ayrıca gösteriyor, kullanıcı bağlamı görebiliyor.

### Sonraki Öneriler

- Sprint listesindeki 5. maddeye (Tek Tık Denetim Dosyası / PDF) geçilebilir.

### Documentation Check

- `SPRINTS.md`, `CHANGELOG.md`: güncellendi.
- `ROADMAP.md`, `ARCHITECTURE.md`, `DATABASE_PLAN.md`: güncellenmedi — veri
  modeli veya mimari katman değişmedi.

---

## Yönetici Modu (Patron Ekranı)

**Bağlam:** Müşteri görüşmesinde somut TL/zaman karşılığı olan özellikler
listelendi ve önceliklendirildi; bu sprint listenin ilk maddesi olan "5
metriklik dashboard" + "Patron Ekranı" isteğini kapsıyor.

### Yapılan Geliştirmeler

- İşveren Paneli'ne yeni "Patron Modu" sekmesi eklendi
  (`src/features/dashboard/employer/ExecutiveModePanel.jsx`) — 5 kart: Açık
  Kritik Risk, Geciken Kontrol, Son 30 Günde Kapanan Risk, Eğitim Tamamlama %,
  Son Kaza.
- `EmployerDashboard.jsx`'e üçüncü tab (`executive`) eklendi.
- Yeni hesaplama mantığı **yazılmadı** — mevcut `useEmployerDashboardData()`
  çıktısı (`metrics.criticalRisks`, `metrics.trainingCompletionRate`,
  `last30DayChange.closedRisks`, `accidentFreeStreak`) ve
  `computePeriodicCheckStats()` (zaten `docs/constants/periodicCheck.js`'te
  vardı) yeniden kullanıldı.

### Etkilenen Modüller

- `src/features/dashboard/EmployerDashboard.jsx` (tab listesi + routing)
- `src/features/dashboard/employer/ExecutiveModePanel.jsx` (yeni dosya)
- Diğer hiçbir dosyaya dokunulmadı; mevcut sekmeler/widget'lar değişmedi.

### Bilinen Riskler

- "Son 30 Günde Kapanan Risk" etiketi kasıtlı olarak "Bu Ay" değil "Son 30
  Gün" olarak yazıldı — mevcut `computeLast30DayChange` takvim ayı değil,
  hareketli 30 günlük pencere hesaplıyor. Müşteriye "bu ay" diye sunulursa
  yanlış anlaşılma riski var; UI metni buna göre netleştirildi.
- `computePeriodicCheckStats`'ın `status` alanına değil `nextDueDate`'e göre
  canlı hesaplama yapıp yapmadığı doğrulanmadı (mevcut fonksiyon `c.status`
  alanına güveniyor — dosyadaki başka bir yorum bu alanın "bayatlayabileceğini"
  belirtiyor). Kritik değil (dashboard özet kartı, hatırlatma sistemi değil)
  ama ileride "Geciken Kontrol" sayısı ile Periyodik Kontrol sayfasındaki
  liste arasında küçük bir tutarsızlık görülürse kaynağı burasıdır.

### Sonraki Öneriler

- Sprint listesindeki 2. madde (süre dolan kontrol için dashboard'da rozet)
  büyük ölçüde zaten mevcuttu (`UpcomingChecksCard` + `getCheckStatusStyle`) —
  ayrı bir sprint gerekmiyor, doğrudan 4. maddeye (Bölüm Bazlı Risk Isı
  Haritası) geçilebilir.
- Makine bazlı analiz ve vardiya alanı istekleri `ROADMAP.md` → "Backlog"a
  eklendi; veri modeli netleşmeden kodlanmayacak.

### Documentation Check

- `SPRINTS.md`: güncellendi (yeni satır eklendi).
- `CHANGELOG.md`: güncellendi (yeni sürüm bölümü eklendi).
- `ROADMAP.md`: güncellendi (Backlog bölümü eklendi, deferred istekler
  kayıt altına alındı).
- `ARCHITECTURE.md`, `DATABASE_PLAN.md`: **güncellenmedi** — hiçbir mimari
  katman veya veri modeli değişmedi, mevcut yapıyla çelişen/eksik kalan bir
  şey yok.

---

## Netlify → Vercel Geçişi

**Bağlam:** Kullanıcı bir hafta içinde Netlify'dan Vercel'e geçeceğini belirtti;
projede Netlify'a özgü hiçbir şey kalmamasını istedi.

### Yapılan Değişiklikler

- **`netlify/functions/chat.js` → `api/chat.js`** — Vercel'in dosya-bazlı routing
  kuralına göre taşındı (`/api/chat.js` otomatik olarak `/api/chat` adresinde
  erişilebilir). Handler imzası da Vercel'in Node.js runtime formatına
  çevrildi: Netlify'ın `exports.handler = async (event) => {...}` + elle
  `JSON.parse(event.body)` deseni yerine, Vercel'in standart
  `export default async function handler(req, res)` deseni ve otomatik
  body-parsing'i kullanıldı.
- **`src/services/chatService.js`** → `API_ENDPOINT` `/.netlify/functions/chat`'ten
  `/api/chat`'e güncellendi.
- **`netlify.toml` silindi, `vercel.json` eklendi** — SPA fallback kuralı
  (`/((?!api/).*) → /index.html`) korunarak taşındı; `/api/*` rotaları bu
  rewrite'ın dışında tutuldu ki Serverless Function'lar etkilenmesin.
- **`netlify/` klasörü tamamen kaldırıldı.**
- **`public/service-worker.js`** içindeki bir yorum satırı güncellendi
  ("Netlify Functions" → "Vercel Functions").
- **Dokümantasyon** — `README.md` (badge, teknoloji tablosu, proje yapısı,
  dağıtım talimatları), `docs/AI_ROADMAP.md`, `docs/PROJECT_CONTEXT.md`,
  `docs/ARCHITECTURE.md`, `docs/README.md` içindeki tüm Netlify referansları
  Vercel'e güncellendi.

### Bilinçli Olarak DOKUNULMAYAN Yerler

- **`CHANGELOG.md` ve `DEVELOPMENT_REPORT.md`'deki GEÇMİŞ kayıtlar** (örn.
  "ACİL: Service Worker Beyaz Ekran Düzeltmesi" gibi geçmişte gerçekten
  Netlify'da yaşanmış olaylar) — bunlar tarihsel bir kayıt, "Netlify'da X oldu"
  ifadesini "Vercel'de X oldu" diye değiştirmek geçmişi yeniden yazmak olurdu.
  Kullanıcının isteği fonksiyonel/güncel dokümantasyon içindi, tarihi
  değiştirmek değil.
- **`api/chat.js` içindeki karşılaştırma yorumları** (örn. "Netlify
  Functions'tan farklı olarak...") — bunlar geçmiş yapıyla farkı açıklayan,
  bilinçli olarak bırakılmış bağlam notları.

### Test Sonuçları

Kod değişikliği yalnızca bir sabit (`API_ENDPOINT`) ve yeni bir dosya
(`api/chat.js`, mevcut hiçbir testin dokunmadığı bir alan) içerdiğinden test
paketi etkilenmedi. `npm test`: **125/125 test geçti, 0 hata** (değişiklik
öncesiyle aynı). `node --check` ile `api/chat.js`/`chatService.js`/
`service-worker.js`'te, `python3 -c "json.load(...)"` ile `vercel.json`'da
sözdizimi doğrulaması yapıldı.

**Gerçek doğrulama Vercel'e ilk deploy sonrası yapılmalı** — bu sandbox'ta
gerçek bir Vercel ortamı simüle edilemiyor; `api/chat.js`'in Vercel'in
otomatik body-parsing davranışıyla gerçekten uyumlu çalıştığı yalnızca canlı
bir deploy'da doğrulanabilir.

### Bilinen Sınırlar / Sıradaki Adımlar

- `ANTHROPIC_API_KEY` ortam değişkeninin Vercel projesine YENİDEN eklenmesi
  gerekiyor — Netlify'daki değişken otomatik taşınmaz, kullanıcının Vercel
  dashboard'undan elle eklemesi gerekiyor (deploy sonrası AI özellikleri
  bu adım atlanırsa çalışmaz).
- Daha önce ertelenen Netlify-özel maddeler (güvenlik header'ları, rate
  limiting) artık Vercel eşdeğerleriyle (örn. `vercel.json` → `headers`,
  Vercel'in kendi Edge Config/rate limiting seçenekleri) değerlendirilebilir.

---

## Güvenlik & Dayanıklılık — CSV Enjeksiyon, Error Boundary, Tam Yedekleme, Gizlilik Perdesi

**Bağlam:** Kullanıcı, kod yazmadan sunulan güvenlik/mobil-hazırlık fikirlerinden 4'ünü
seçti (1, 4, 5, 6 — kullanıcı adı/şifre sistemi ve PIN kilidi ayrı bir konuşmada
ertelendi; gerçek şifre sisteminin backend gerektirdiği, PIN'in ise yalnızca "rastgele
biri telefonu eline alırsa" senaryosuna karşı işe yaradığı açıklandı). Kullanıcı
Netlify'dan Vercel'e bir hafta içinde geçeceğini belirttiği için Netlify'a özgü
maddeler (güvenlik header'ları, rate limiting) bu turda atlandı.

### 1) CSV / Formula Injection Koruması

- **`utils/exportCsv.js`** — OWASP standart mitigasyonu: bir hücre `=`, `+`, `-`, `@`,
  TAB veya CR ile başlıyorsa (örn. biri "Ad Soyad" alanına `=CMD(...)` yazarsa),
  önüne bir tek tırnak (`'`) eklenir. Excel/Google Sheets bunu görünce hücreyi düz
  metin gösterir, formül olarak ÇALIŞTIRMAZ. Yalnızca export edilen dosyada
  uygulanır, ekranda görünen veri değişmez.
- 4 yeni test (`exportCsv.test.js`).

### 2) Error Boundary İncelemesi + Sayfa-Seviyesi İyileştirme

- İnceleme sırasında `components/ErrorBoundary.jsx`'in **zaten var olduğu**
  görüldü (main.jsx'te tüm uygulamayı sarıyordu) — bu madde zaten büyük ölçüde
  tamamlanmıştı.
- **Gerçek iyileştirme:** `Layout.jsx`'teki `<Outlet />` AYRICA (compact bir
  varyantla) sarıldı — önceden bir sayfa çökerse TÜM uygulama (sidebar/header
  dahil) kayboluyordu; artık yalnızca o sayfanın içeriği "Bu sayfa yüklenemedi"
  mesajıyla değişiyor, navigasyon hayatta kalıyor. `key={location.pathname}` ile
  rota değişince sınır otomatik sıfırlanıyor; "Tekrar Dene" butonu ile aynı
  sayfada (rota değişmeden) yeniden denenebiliyor.

### 3) Tam Yedekleme / Geri Yükleme

Bu uygulama tek bir cihazda çalışıyor, backend senkronizasyonu yok — bu özellik
olmadan telefon kaybolur/arızalanırsa hiçbir veri kurtarma yolu yoktu.

- **`services/backupService.js`** (yeni) — `buildFullBackup()` (tüm IndexedDB
  store'larını `db.js`'ten export edilen `STORES` listesini kullanarak tek bir
  JSON'a toplar — yeni bir store eklendiğinde bu dosyanın ayrıca güncellenmesi
  GEREKMEZ), `validateBackup()` (saf/test edilebilir, 7 test),
  `restoreFullBackup()` (mevcut veriyi TAMAMEN DEĞİŞTİRİR — birleştirmez),
  `downloadBackupFile()`.
- **`features/settings/BackupSection.jsx`** (yeni) — Ayarlar sayfasına
  "Tam Yedek İndir" / "Yedekten Geri Yükle" butonları eklendi. Geri yükleme,
  `ConfirmDialog` ile AÇIKÇA "bu geri alınamaz" uyarısı gösterip onay
  aldırmadan ASLA çalışmaz; başarılı geri yüklemeden sonra tüm React state'in
  tutarlı kalması için sayfa otomatik yenilenir.
- `db.js` → `STORES` listesi export edildi (öncesinde modül-içi sabitti).

### 4) Görev Değiştirici Gizlilik Perdesi

Başlangıçta "native gerekir" denilmişti; Page Visibility API ile saf web'de de
yapılabildiği fark edilip düzeltildi.

- **`components/AppSwitcherPrivacyGuard.jsx`** (yeni) — `visibilitychange`
  olayını dinler, sekme/uygulama arka plana alınınca tam ekran, markaya uygun
  ama İÇERİKSİZ bir perde (yalnızca logo) gösterir — telefonun görev
  değiştirici önizlemesinde hassas veri (çalışan listesi, risk kayıtları)
  görünmesin diye. `Layout.jsx`'e bağlandı.
- **Dürüstçe belirtilen sınır (dosya içi yorumda):** bu native bir çözüm değil,
  işletim sisteminin anlık görüntüyü TAM OLARAK ne zaman aldığı üzerinde kesin
  kontrol yok — pratikte tarayıcılar `visibilitychange`'i anlık görüntüden önce
  tetiklediği için işe yarıyor (bankacılık PWA'larında da aynı teknik
  kullanılıyor), ama %100 garantili değil.

### Test Sonuçları

11 yeni birim testi (`exportCsv.test.js`: 4, `backupService.test.js`: 7).
`npm test`: **125/125 test geçti, 0 hata** (önceki 114 + yeni 11).
`tsc --noEmit --jsx react` ile tüm değiştirilen JSX dosyalarında sözdizimi
kontrolü temiz. Error Boundary ve Gizlilik Perdesi DOM/tarayıcı olaylarına
bağımlı olduğu için doğrudan birim testi yazılamadı (tutarlı bir sınır).

### Bilinen Sınırlar / Sıradaki Adımlar

- Netlify'a özgü maddeler (güvenlik header'ları, Netlify Function rate
  limiting kontrolü) kullanıcının Vercel geçişi nedeniyle bilinçli olarak
  ertelendi — Vercel'e geçince eşdeğerleri (vercel.json header'ları vb.)
  değerlendirilebilir.
- Kullanıcı adı/şifre sistemi (gerçek veya hafif) ve PIN kilidi ayrı
  kararlar olarak beklemede — kullanıcı "daha fazla soru sormak istiyorum"
  dedi, henüz karara bağlanmadı.
- Gizlilik perdesi yalnızca `Layout.jsx` (authenticated sayfalar) içinde —
  Login/Register ekranlarında hassas veri olmadığı için kapsam dışı
  bırakıldı.

---

## Toplu Veri İçe Aktarma, Uygulama Geneli Arama & Toplu İşlem

**Bağlam:** 6 maddelik önceki plan tamamlandıktan sonra kullanıcıya kod yazmadan
3 yeni fikir sunuldu; ikisi kabul edildi (biri zaten mevcut olduğu için elendi —
"trend paneli" kontrol edilince `TrendsPanel.jsx` olarak zaten var olduğu görüldü),
üçüncü fikir (toplu işlem) istendi. Üçü sırayla yapıldı.

### 1) Toplu Veri İçe Aktarma (CSV)

- **`utils/importCsv.js`** (yeni, saf/test edilebilir) — `parseCsv`/`rowsToObjects`.
  `utils/exportCsv.js`'in TERSİ: aynı formatı (noktalı virgül ayırıcı, tırnak
  kaçırma, UTF-8 BOM) okur — kullanıcı export ettiği bir listeyi Excel'de
  düzenleyip geri yükleyebilsin diye bilinçli olarak round-trip uyumlu.
- **`components/CsvImportButton.jsx`** (yeni, tekrar kullanılabilir) — dosya
  seçilince HEMEN kaydetmez; önce önizleme modalı (kaç kayıt geçerli, kaç satır
  hangi hatayla atlanacak) gösterir, yalnızca "Aktar"a basılınca kaydeder.
  "Şablon indir" ile boş bir örnek CSV de sunuyor.
- Bağlandığı yerler: `EmployeesSection.jsx` (departman adı eşleşmezse satır
  hata olarak işaretlenir, sessizce yanlış departmana atanmaz),
  `DepartmentsSection.jsx` (yinelenen isim kontrolü), `BranchesSection.jsx`.

### 2) Uygulama Geneli Arama

Header'da önceden **tamamen işlevsiz** bir "Ara..." kutusu vardı (hiçbir state/
handler yoktu) — bu, gerçek bir özelliğe kavuşturuldu.

- **`constants/globalSearch.js` → `buildGlobalSearchResults`** (saf/test edilebilir)
  — Fine-Kinney, Risk Tespiti, Periyodik Kontrol, Dokümanlar, Bilgi Kütüphenesi'nde
  arar; her modül için kategori bazlı max 3 sonuç + hedef rota/state döner.
- **`hooks/useGlobalSearch.js`** — 250ms debounce, 4 servisten (+ statik Bilgi
  Kütüphanesi verisi) paralel veri çeker.
- **`layout/GlobalSearchBar.jsx`** (yeni) — Header'daki eski placeholder'ın
  yerini aldı; sonuca tıklayınca ilgili modüle, o modülün KENDİ arama kutusu
  ÖN DOLDURULMUŞ şekilde gider.
- **Alt yapı değişikliği:** 4 hook'a (`useFineKinneyEntries`, `useRiskDetections`,
  `usePeriodicChecks`, `useKnowledgeDocuments`) geriye dönük uyumlu
  `initialSearch` parametresi eklendi; bunları çağıran bileşenler
  (`FineKinneyModule`, `RiskDetectionPanel`, `PeriodicChecksPanel`,
  `KnowledgeCenterPage`) artık bu değeri prop olarak alıp geçiriyor.
  `RiskAnalysisPage.jsx` router state'ten (`targetTab`/`prefillSearch`),
  `DocumentsPage.jsx`/`KnowledgeCenter.jsx` ise mevcut `?tab=`/yeni `?q=` query
  param deseninden okuyor — her sayfanın KENDİ önceden var olan deep-link
  desenine uyuldu, yeni bir konvansiyon zorlanmadı.

### 3) Toplu İşlem (Bulk Actions)

Periyodik Kontrol listesine (en somut fayda: "10 gecikmiş kontrolü tamamlandı
yapmak için 10 kez tıklamak" senaryosu) eklendi.

- **`usePeriodicChecks.js` → `bulkMarkCheckedToday`/`bulkUpdateDepartment`** —
  ikisi de var olan TEKLİ fonksiyonları (`markCheckedToday`/`saveCheck`) döngü
  içinde çağırır, kendi başına yeni bir kayıt mantığı içermez (tek sorumluluk
  noktası — tekli ve toplu işlem asla farklı davranmaz).
- **`PeriodicCheckCard.jsx`** — opsiyonel checkbox (`selected`/`onToggleSelect`
  prop'ları verilmezse eskisi gibi davranır, geriye dönük uyumlu).
- **`PeriodicChecksPanel.jsx`** — "Tümünü Seç" + seçim varken beliren bir aksiyon
  çubuğu ("Bugün Kontrol Edildi" / "Departman Değiştir..."). Arama/filtre/görünüm
  değişince seçim GÜVENLİK İÇİN sıfırlanır (artık ekranda olmayan kayıtları
  yanlışlıkla toplu güncellememek için).
- **Bilinçli olarak eklenmedi: toplu SİLME.** Yanlışlıkla çok sayıda kaydı
  silme riski, tek tek silmenin getirdiği sürtünmeden daha ciddi bir risk
  olarak değerlendirildi.

### Test Sonuçları

`importCsv.test.js`: 12 test (round-trip dahil). `globalSearch.test.js`: 10 test.
Toplu işlem tarafı (bulk actions) DOM/state'e bağımlı UI wiring olduğu için
doğrudan test edilmedi (tutarlı bir sınır) — ama üzerine kurulduğu
`markCheckedToday`/`saveCheck` zaten dolaylı olarak diğer testlerle güvence
altında. `npm test`: **114/114 test geçti, 0 hata** (önceki 92 + yeni 22).
`tsc --noEmit --jsx react` ile tüm değiştirilen JSX dosyalarında sözdizimi
kontrolü temiz.

### Bilinen Sınırlar / Sıradaki Adımlar

- Toplu işlem şu an yalnızca Periyodik Kontrol'de. Fine-Kinney listesine de
  aynı desenle (checkbox + aksiyon çubuğu + `bulkUpdateStatus` gibi bir hook
  fonksiyonu) eklenebilir — istenirse ayrı bir iş olarak yapılabilir.
- Uygulama geneli arama şu an yalnızca başlık/özet/tehlike/konum gibi ana
  metin alanlarında arıyor; Fine-Kinney'nin önlem/KKD metni gibi daha derin
  alanlar kapsam dışı (performans/karmaşıklık dengesi gözetildi).
- CSV içe aktarma şu an yalnızca Çalışan/Departman/Şube'de; Ekipman kayıtları
  gibi diğer listelere de aynı `CsvImportButton` ile kolayca eklenebilir.

---

## PWA / Offline — Service Worker v2 (Güvenli, Network-First)

**Bağlam:** Kullanıcının planındaki altıncı ve son madde. Kod incelemesinde,
PWA/offline özelliğinin **daha önce denenip gerçek bir prod olayına yol açtığı**
bulundu: v1 Service Worker cache-first stratejisi kullanıyordu, bu da eski
`index.html`'in (o anki build'in hash'li JS dosyalarına referans veren) sonsuza
dek önbellekte kalmasına yol açıyordu — bir sonraki deploy'da o JS dosyaları
silinince Chrome'da birkaç saat sonra **beyaz ekran**. Bu yüzden v1, kendi
kendini kaldıran bir "kill-switch"e çevrilmiş, `main.jsx` de aktif olarak her
sayfa yüklemesinde kayıtlı SW'yi kaldırıyordu (bkz. kök `CHANGELOG.md` →
"ACİL: Service Worker Beyaz Ekran Düzeltmesi").

Bu geçmiş kullanıcıya aktarıldı; kullanıcı, riski bilerek **"güvenli (network-first,
versiyonlu) bir Service Worker ile dikkatlice yeniden dene"** seçeneğini seçti.

### Tasarım İlkesi (önceki olayın bir daha yaşanmaması için)

**index.html, JS ve CSS dosyaları için ASLA cache-first kullanılmaz.** Bunun
yerine:
- Navigasyon (HTML) + JS/CSS + diğer her şey → **network-first**: önce ağdan
  denenir, yalnızca ağ TAMAMEN başarısız olursa (gerçek offline durumu)
  önbellekten/offline sayfasından döner. Bu, "eski HTML'in silinmiş JS
  dosyalarına referans vermesi" senaryosunu **yapısal olarak imkansız kılar**.
- Resim/font/ikon gibi pratikte hiç değişmeyen statik varlıklar → cache-first
  (güvenli, gerçek offline kullanımda hız/veri tasarrufu sağlar).
- Versiyonlu cache adı (`nobetci-isg-runtime-v2`) — `activate` aşamasında bu
  isim dışındaki TÜM eski `nobetci-isg-` önekli cache'ler (v1'in kill-switch
  cache'leri dahil) otomatik temizlenir.

### Yapılan Geliştirmeler

- **`public/service-worker.js`** — sıfırdan yeniden yazıldı (v2). `install`:
  offline sayfası + ikonları önceden önbellekler (başarısız olsa bile kurulum
  durmaz). `activate`: eski cache'leri temizler + `clients.claim()`. `fetch`:
  yalnızca GET + aynı origin istekleri ele alınır (Netlify Functions AI proxy'si
  gibi POST istekleri hiç dokunulmadan geçer); statik varlıklar cache-first,
  geri kalan her şey network-first.
- **`public/offline.html`** (yeni) — bağlantı tamamen koptuğunda gösterilen
  minimal, markaya uygun bir sayfa ("Tekrar Dene" butonuyla).
- **`main.jsx`** — SW'yi kaldıran kod, artık `/service-worker.js`'i kaydeden
  koda çevrildi. Elle cache temizleme main.jsx'ten kaldırıldı — o sorumluluk
  artık tamamen `service-worker.js`'in kendi `activate` olayında (tek
  sorumluluk noktası, iki dosyanın birbiriyle çelişme riski yok).
- **`notificationService.js`** — dosya başı yorumu güncellendi: SW artık geri
  geldiği için `showLocalNotification()` gerçekten `registration.showNotification()`
  yolunu kullanabiliyor (sekme arka plandayken de bildirim gösterir).
- **`notificationclick` olay dinleyicisi geri eklendi** — Sprint 7.2.3'te
  eklenmişti (gerçek push bildirim özelliği), v1→kill-switch geçişinde
  kaybolmuştu; v2'de restore edildi.

### Geçiş Güvenliği (v1 kill-switch kullanıcıları için)

v1'in kill-switch'i zaten kendi kendini kaldırıp eski cache'lerini temizliyordu;
bu kullanıcılarda `main.jsx`'teki yeni `register()` çağrısı v2'yi normal şekilde
kurar. Hâlâ eski (kill-switch öncesi, orijinal bozuk) SW'ye takılı kalmış
kullanıcılar varsa, tarayıcı güncelleme kontrolünde `/service-worker.js`'in
içeriğinin değiştiğini görüp v2'yi kurar; v2'nin `activate`'i de eski
`nobetci-isg-` önekli her cache'i (hangi versiyon olursa olsun) temizler.

### Test Sonuçları

Service Worker/`main.jsx` tarayıcı API'lerine (`self`, `caches`, `navigator.serviceWorker`)
bağımlı olduğu için `node:test` ile birim testi yazılamadı (tutarlı bir sınır,
önceki sprintlerdeki DOM-bağımlı dosyalarla aynı). `node --check` ile
`service-worker.js` ve `main.jsx`'te sözdizimi doğrulaması yapıldı → **0 hata**.
`npm test`: mevcut 92/92 test hâlâ geçiyor (bu özellik hiçbir test edilen saf
fonksiyonu etkilemedi).

**Gerçek tarayıcı doğrulaması için:** Bu, sandbox'ta gerçek bir tarayıcıda test
edilemeyen bir özellik — Netlify'a deploy ettikten sonra Chrome DevTools →
Application → Service Workers'tan v2'nin kurulduğunu, ve birkaç deploy sonrasında
(v1'deki senaryonun tersine) uygulamanın beyaz ekran vermediğini doğrulaman iyi olur.

### Bilinen Sınırlar / Sıradaki Adımlar

- Bu, kullanıcının planındaki **son madde** — 6 maddenin tamamı tamamlandı.
- Özel bir "Ana Ekrana Ekle" davet butonu (`beforeinstallprompt` olayını
  yakalayıp özel bir UI göstermek) eklenmedi — tarayıcıların kendi doğal
  install UI'ı (adres çubuğu ikonu vb.) PWA kriterleri karşılandığı için zaten
  çalışacaktır. İstenirse ayrı bir iş olarak eklenebilir.
- Gerçek "site tamamen kapalıyken de bildir" (Push API + backend) hâlâ kapsam
  dışı — `notificationService.js`'in belirttiği gibi, yeni bağımlılık/backend
  gerektirir.

---

## RAG-lite İyileştirmesi — Eş Anlamlı Terimler & Alan Ağırlıklandırması

**Bağlam:** Kullanıcının planındaki beşinci madde. Bilgi Kütüphanesi'nin "AI'ya Sor"
özelliği anahtar kelime eşleştirmesi (RAG-lite) kullanıyordu; gerçek embedding
olmadan da eşleştirme kalitesi artırılabilecek iki net eksik vardı.

### Yapılan Geliştirmeler

- **Eş anlamlı/kısaltma sözlüğü** (`SYNONYM_GROUPS`, `knowledgeCenter.js`) — 10 grup
  (KKD↔kişisel koruyucu donanım, baret↔kask, forklift↔istif makinesi, ramak kala↔
  neredeyse kaza, risk analizi↔Fine-Kinney vb.). Sorguda bir grup üyesi geçerse
  grubun TÜM üyeleri arama terimlerine eklenir — iki yönlü çalışır (kısaltmayla
  arayan tam adı bulur, tam adla arayan kısaltmayı bulur).
- **Alan ağırlıklandırması** — önceden tüm alanlar (başlık/özet/içerik/etiket) tek
  bir "haystack" string'inde birleştirilip eşit ağırlıkta sayılıyordu. Artık
  başlık (3x) > etiket (2x) > özet (1.5x) > içerik (1x) ağırlıklı puanlanıyor —
  bir terimin başlıkta geçmesi artık uzun içerik metninde bir kez geçmesinden
  daha güçlü bir sinyal.
- **Tam ifade bonusu** — çok kelimeli bir sorgunun TAMAMI başlıkta birebir
  geçiyorsa ekstra puan (+5) — tam eşleşen doküman diğerlerinin önüne geçer.
- Fonksiyon imzası **değişmedi** (`findRelevantDocuments(query, documents,
  maxResults)`) — `useKnowledgeAI.js`'de hiçbir değişiklik gerekmedi.

### Test Sonuçları

4 yeni birim testi eklendi (toplam `knowledgeCenter.test.js`: 11). Mevcut 7 test
davranış değişikliğine rağmen hâlâ geçiyor (skorlama değişti ama sıralama
sonuçları aynı kaldı). `npm test`: **92/92 test geçti, 0 hata**.

### Bilinen Sınırlar / Sıradaki Adımlar

- Sıradaki madde (kullanıcının planına göre, son madde): PWA/Offline kontrolü.
- Sözlük şu an yalnızca 10 grup içeriyor — gerçek kullanımda hangi aramaların
  sonuç vermediği gözlemlenip zamanla genişletilebilir.
- Gerçek vektör/embedding tabanlı RAG hâlâ backend/Phase 7'ye bağlı, kapsam dışı.

---

## Bildirim / Hatırlatma — Periyodik Kontrol & Eğitim Son Tarihi

**Bağlam:** Kullanıcının planındaki dördüncü madde. Mevcut `notificationService.js`
zaten gerçek tarayıcı bildirimleri (Notification API) altyapısına sahipti, ama
yalnızca anlık olaylar (AI analizi tamamlandı vb.) için kullanılıyordu — zamanlanmış/
periyodik bir tarama mekanizması yoktu.

**Veri modeli genişletmesi:** Eğitim son tarihi hatırlatması için kullanıcıya
soruldu; sistemde kişi-bazlı bir "TrainingAssignment" kaydı hiç yoktu (her çalışan
her kursa örtük atanmış sayılıyor). Kullanıcı gerçek bir son tarih alanı eklenmesini
istedi — kişi-bazlı değil, **kurs-bazlı (şirket çapında)** bir son tarih modeliyle
mevcut mimariye en uyumlu şekilde eklendi.

### Yapılan Geliştirmeler

- **`db.js`** — yeni `trainingCourseSettings` IndexedDB store'u (DB_VERSION 10→11).
  Yağız'ın cihazında bir sonraki açılışta `onupgradeneeded` otomatik oluşturacak.
- **`trainingCourseSettingsService.js`** (yeni) — kurs bazlı son tarih get/save.
- **`periodicCheck.js` → `getOverdueOrDueSoonChecks`** (yeni, saf) — süresi geçmiş
  veya ≤3 gün kalan kontrolleri döner. **Önemli:** kaydın olası BAYAT `status`
  alanına güvenmez, `nextDueDate`'den her çağrıda canlı hesaplar (mevcut
  `usePeriodicChecks.js`'de status yalnızca kayıt en son düzenlendiğinde
  hesaplanıp saklanıyor, zamanla bayatlayabiliyor — bu fonksiyon o riski taşımaz).
- **`trainingStatus.js` → `getUpcomingTrainingDueReminders`** (yeni, saf) —
  belirli bir çalışan için, son tarihi geçmiş/yaklaşan VE henüz tamamlanmamış
  kursları döner. Tamamlanan kurslar için asla hatırlatma üretilmez.
- **`useReminderScheduler.js`** (yeni hook) — `Layout.jsx`'e bağlandı (her
  authenticated route'ta çalışır), ama **günde yalnızca bir kez** gerçek tarama
  yapar (localStorage dedup). Role göre: expert/employer → periyodik kontrol
  hatırlatması, employee → kendi eğitim son tarihi hatırlatması.
- **`notificationPrefs.js`** — `periodicCheckDue`/`trainingDue` tercihleri eklendi;
  Settings sayfası bunları otomatik render ediyor (mevcut desen, kod değişikliği
  gerekmedi).
- **`TrainingModule.jsx`** — Uzman/İşveren için "Katılımcılar" panelinde son tarih
  seçici (`<input type="date">`); **`CourseCard.jsx`** — son tarih rozeti (geçmişse
  kırmızı, yaklaşıyorsa sarı).

### Kapsam Sınırı (bilinçli, dosya içi yorumlarda belirtildi)

Bu **push-when-closed altyapısı DEĞİLDİR** — yalnızca kullanıcı uygulamayı
açtığında/açıkken tetiklenir (`notificationService.js`'in zaten belirttiği sınır).
Gerçek "site kapalıyken de bildir" için Push API + backend (VAPID, subscription
DB) gerekir — bu, DEVELOPMENT_RULES.md'nin "backend/Supabase onayı olmadan
eklenmez" kuralına takılacağı için kapsam dışı bırakıldı.

### Test Sonuçları

`getOverdueOrDueSoonChecks` için 5, `getUpcomingTrainingDueReminders` için 6 yeni
birim testi. `npm test`: **88/88 test geçti, 0 hata**. `tsc --noEmit --jsx react`
ile 3 değiştirilen JSX dosyasında sözdizimi kontrolü temiz.

### Bilinen Sınırlar / Sıradaki Adımlar

- Sıradaki madde (kullanıcının planına göre): RAG-lite iyileştirmesi (Bilgi
  Kütüphanesi eşleştirme kalitesi), ardından PWA/Offline kontrolü.
- `useReminderScheduler.js` DOM/localStorage/IndexedDB'ye bağımlı olduğu için
  doğrudan test edilmedi — yalnızca içindeki saf hesaplama fonksiyonları test
  edildi (tutarlı bir sınır, önceki sprintlerdeki gibi).
- DB_VERSION artışı gerçek build'de (Netlify) test edilemedi (sandbox'ta
  IndexedDB/tarayıcı yok) — yalnızca kod incelemesiyle doğrulandı, mevcut
  `onupgradeneeded` deseniyle birebir tutarlı.

---

## Export / Raporlama — Fine-Kinney & Dashboard PDF/Excel Export

**Bağlam:** Kullanıcının planındaki üçüncü madde. Kod tabanında bu özellik için
**iki hazır "Yakında" placeholder** bulundu (`FineKinneyExportButtons.jsx`,
`DashboardExportButtons.jsx` — ikisi de `disabled` butonlar + "Yakında" rozeti),
yani bu tam olarak beklenen/planlanmış bir sıradaki adımdı.

### Paylaşılan Altyapı (sıfır yeni bağımlılık)

- **`utils/exportCsv.js` → `buildCsv`/`downloadCsv`** — "Excel" export'u aslında
  CSV. İki Türkçe'ye özgü detay: (1) ayırıcı virgül değil **noktalı virgül** —
  Türkçe Excel kurulumlarında virgül ondalık ayıracı olduğu için varsayılan CSV
  ayracı da odur, virgüllü CSV Türkçe Excel'de tek sütun halinde açılır; (2)
  **UTF-8 BOM** ekleniyor — yoksa Excel ş/ğ/ı/ç/ö/ü karakterlerini bozar.
- **`utils/printWindow.js`** — `printTrainingCompletionCertificate.js`'teki
  "ayrı pencerede yazdır" deseni buraya çıkarıldı (artık 2. bir yerde de
  kullanılıyor); `escapeHtml` de burada, eski dosya geriye dönük uyumluluk için
  re-export ediyor.

### Fine-Kinney Export

- **`fineKinneyExport.js`** (yeni, saf/test edilebilir) — `buildFineKinneyExportRows`:
  departmentId/branchId'yi okunabilir isme çevirir, risk seviyesi/öncelik/durum
  etiketlerini (ham değer değil) çözer.
- **`FineKinneyExportButtons.jsx`** — artık gerçek: `entries` prop'u (o an
  ekranda görünen, FİLTRELENMİŞ liste) alıyor, "PDF" tablo raporu / "Excel" CSV
  üretiyor. Liste boşsa butonlar disabled.
- `FineKinneyModule.jsx` → `entries`'i export butonlarına geçiriyor.

### Dashboard Export

- **`DashboardExportButtons.jsx`** — `EmployerOverviewTab.jsx`'te zaten
  hesaplanmış `CARDS` (özet metrik kartları) dizisini PDF (basit anahtar-değer
  tablosu) / CSV olarak dışa aktarıyor. Fine-Kinney export'uyla BİLİNÇLİ olarak
  ayrı bileşen kalmaya devam etti (farklı veri şekilleri), yalnızca paylaşılan
  alt katman (CSV/print) ortak.

### Test Sonuçları

`buildCsv` için 6, `buildFineKinneyExportRows` için 5 yeni birim testi.
`npm test`: **77/77 test geçti, 0 hata** (bu, glob düzeltmesinden sonraki gerçek
sayı). `tsc --noEmit --jsx react` ile 4 değiştirilen JSX dosyasında sözdizimi
kontrolü temiz.

### Bilinen Sınırlar / Sıradaki Adımlar

- Sıradaki madde (kullanıcının planına göre): Bildirim/Hatırlatma (gecikmiş
  kontrol + eğitim son tarih push notification).
- `downloadCsv`/`openPrintWindow` DOM'a bağımlı olduğu için doğrudan test
  edilmedi; yalnızca içerdikleri saf fonksiyonlar (`buildCsv`, `escapeHtml`)
  test edildi (tutarlı bir sınır, önceki sprintlerdeki gibi).
- Dashboard PDF/CSV export'u yalnızca `EmployerOverviewTab`'daki özet kartları
  kapsıyor; ayrıntılı (satır satır) dashboard export'u istenirse ayrı bir iştir.

---

## ⚠️ Test Altyapısı Düzeltmesi & Türkçe "İ Problemi" Bug Fix

**Bu bölüm bir şeffaflık notudur.** Eğitim modülü genişletmesi sırasında yeni bir test
dosyası (`quizGrading.test.js`) eklerken, `npm test` çalıştırdığımda test sayısının
hiç artmadığını fark ettim. Araştırınca ciddi bir sorun ortaya çıktı:

### Sorun

`package.json`'daki `"test": "node --test src/**/*.test.js"` komutu, sandbox'ın
`/bin/sh`'inde çalıştırıldığında `**` deseni ÖZYİNELEMELİ (recursive) genişlemiyor —
yalnızca `src/<bir-klasör>/<dosya>.test.js` derinliğindeki dosyaları buluyor. Sonuç:
**`src/features/...` altındaki (2+ klasör derinliğindeki) test dosyaları o ana kadar
YAPILAN HİÇBİR `npm test`/`node --test` ÇALIŞTIRMASINDA GERÇEKTEN ÇALIŞTIRILMAMIŞ.**
Bu, `filterFineKinneyEntries.test.js`'i (Teknik Borç sprintinde eklenmişti) ve o ana
kadar yazdığım "23/23", "27/27", "31/31", "36/36 test geçti" raporlarının **hepsinin
eksik/yanıltıcı olduğu** anlamına geliyor — dosya gerçekten var ve syntax olarak
doğruydu, ama hiç ÇALIŞTIRILMAMIŞTI, dolayısıyla içindeki gerçek bir hata gizli kaldı.

### Düzeltme

- `package.json` → `"test": "node --test 'src/**/*.test.js'"` (glob artık tek tırnak
  içinde — shell'e değil Node'un kendi glob motoruna genişletiliyor, bu da klasör
  derinliğinden bağımsız gerçek özyinelemeli tarama yapıyor). `npm test` ile
  doğrulandı: artık tüm 9 test dosyası (64 test) gerçekten çalışıyor.
- Bu düzeltmeyle birlikte, o ana kadar hiç çalıştırılmamış olan
  `filterFineKinneyEntries.test.js`'te **gerçek bir başarısız test** ortaya çıktı.

### Bulunan Gerçek Bug: Türkçe "İ Problemi"

JS'in varsayılan (locale'siz) `.toLowerCase()`'i Türkçe büyük **"İ"**yi düz "i" değil,
nokta işaretli "i̇" (U+0069 + U+0307, iki kod noktası) karakterine çevirir. Örnek:
`"FORKLİFT".toLowerCase()` → `"forkli̇ft"` — bu, `"forklift"` ile substring eşleşmesi
YAPMAZ. Bu, Caps Lock açıkken veya mobil Türkçe klavyede otomatik büyük harfle
başlarken gerçek kullanıcıların karşılaşabileceği bir arama bug'ıydı. Uygulama %100
Türkçe olduğu için bu, kozmetik değil gerçek bir kullanılabilirlik sorunuydu.

**Düzeltme:** Yeni `utils/text.js` → `turkishLower(str)` (`.toLocaleLowerCase("tr-TR")`
kullanır) eklendi; kod tabanındaki TÜM serbest metin arama/karşılaştırma noktaları
(7 dosya: `knowledgeCenter.js`, `useKnowledgeDocuments.js`, `filterFineKinneyEntries.js`,
`useMevzuatScan.js`, `useRiskDetections.js`, `usePeriodicChecks.js`, `systemPrompt.js`)
çıplak `.toLowerCase()` yerine bu fonksiyonu kullanacak şekilde güncellendi. Ayrıca
test dosyasındaki testin KENDİSİ de düzeltildi — test, `.toLowerCase()`'i kendi
içinde çağırarak veriyi fonksiyona vermeden önce bozuyordu (gerçek kullanımda arama
kutusundan ham metin gelir); artık ham "FORKLİFT" doğrudan gönderiliyor.

### Test Sonuçları

`turkishLower` için 5 yeni birim testi (`utils/text.test.js`) — Türkçe İ/I dönüşümü,
gerçek dünya senaryosu (Caps Lock ile yazılan arama) dahil.
**`npm test` (düzeltilmiş glob ile): 64/64 test geçti, 0 hata.** Bu, bu projede ilk
kez TÜM test dosyalarının (klasör derinliğinden bağımsız) gerçekten çalıştırıldığı
doğrulanmış sonuçtur.

### Ders / Kalıcı Not

Bundan sonraki tüm oturumlarda test çalıştırırken `npm test` (package.json script'i
üzerinden, tek tırnaklı glob ile) kullanılacak — doğrudan `node --test src/**/*.test.js`
(tırnaksız) bir daha ÇALIŞTIRILMAYACAK, çünkü sandbox'ın shell'i `**`'ı özyinelemeli
genişletmiyor.

---

## Eğitim Modülü Genişletmeleri — Çoklu Seçim Sınav Soruları & Tamamlama Belgesi

**Bağlam:** Kullanıcının belirlediği sırada (fotoğraf → eğitim → export → bildirim →
RAG → PWA) ikinci madde. "Eğitim Modülü genişletmeleri" iki alt maddeden oluşuyordu:
yeni quiz soru tipleri ve sertifika PDF export.

### 1) Çoklu Seçim (Multi-Select) Sınav Soruları

- **`quizGrading.js`** (yeni, `CourseQuiz.jsx`'ten çıkarıldı) — `isAnswered`/
  `isCorrect`/`gradeQuiz` saf fonksiyonları. `type: "multi"` desteği eklendi;
  `type` belirtilmemişse `"single"` varsayılır — **tüm mevcut mock kurs verisiyle
  geriye dönük tam uyumlu**, hiçbir soru değiştirilmeden yeni tip eklenebildi.
  Multi-select puanlaması tam eşleşme (all-or-nothing) — kısmi puan yok.
- **`CourseQuiz.jsx`** — çoklu seçim soruları için checkbox benzeri buton grubu
  render ediyor ("Birden fazla seçenek işaretleyebilirsiniz" ipucuyla).
- **`trainingCourses.js`** — KKD kursuna örnek bir multi-select soru eklendi
  (mevcut sorular değiştirilmedi).

### 2) Tamamlama Belgesi (PDF) — İSİMLENDİRME KARARI

Kodda **bilinçli bir önceki tasarım kararı** bulundu: `types/index.js` →
`TrainingCompletion`, "Sertifika/PDF ÜRETMEZ — kaydın kendisi belgedir" notunu
taşıyordu. Bunu görmezden gelip sessizce üzerine yazmak yerine kullanıcıya
sorduk; kullanıcı özelliği **"Tamamlama Belgesi"** adıyla (sertifika değil)
üretmeye karar verdi.

- **`printTrainingCompletionCertificate.js`** (yeni) — **sıfır yeni bağımlılık**:
  jsPDF gibi bir kütüphane yerine tarayıcının kendi yazdırma diyaloğu
  (`window.open` + `window.print()`) kullanılıyor; kullanıcı "PDF olarak kaydet"
  seçeneğiyle indirebiliyor. Belge içeriğinde resmi bir kurum/OSGB sertifikası
  olmadığını belirten bir dipnot var (önceki tasarım kararının ruhu korunuyor).
  XSS'e karşı `escapeHtml()` ile veri kaçırılıyor (çalışan adı/kurs başlığı HTML'e
  gömülüyor).
- **`CoursePlayer.jsx`** — sınavı geçince sonuç ekranında "Tamamlama Belgesini
  İndir (PDF)" butonu.
- **`ParticipantListPanel.jsx`** — Uzman/İşveren, tamamlanan her kayıt için
  sonradan da belge yazdırabiliyor.
- Pop-up engellenirse (bazı tarayıcılarda `window.open` engellenebilir) kullanıcıya
  görünür bir uyarı gösteriliyor.

### Test Sonuçları

`quizGrading.js` için 11, `escapeHtml` için 4 yeni birim testi.
**`npm test`: 64/64 test geçti** (bu sayı yukarıdaki glob düzeltmesiyle artık
gerçekten doğrulanmış). `tsc --noEmit --jsx react` ile `CourseQuiz.jsx`,
`CoursePlayer.jsx`, `ParticipantListPanel.jsx`'te sözdizimi kontrolü temiz.

### Bilinen Sınırlar / Sıradaki Adımlar

- Sıradaki madde (kullanıcının planına göre): Export/Raporlama — Fine-Kinney
  kayıtlarının PDF/Excel export'u.
- `printTrainingCompletionCertificate.js` `window` nesnesine bağımlı olduğu için
  (DOM olmadan) birim testi yazılamadı — yalnızca içindeki saf `escapeHtml`
  fonksiyonu test edildi (diğer DOM-bağımlı dosyalarla tutarlı bir sınır).

---

## Fotoğraftan Tehlike Tespiti

**Bağlam:** Kullanıcı, Supabase/backend ve fiziksel kamera kurulumu gerektiren
maddeleri (Phase 6/7/9.2) şimdilik kapsam dışı bırakıp, yalnızca mobilden
(mevcut mimariyle) yapılabilecek fikirlerden ilkini seçti: fotoğraftan tehlike
tespiti. Bunun bir kamera KURULUMU olmadığını, kullanıcının kendi telefon
kamerasıyla çektiği/galeriden seçtiği bir fotoğrafın analizi olduğunu netleştirdi.

### Yapılan Geliştirmeler

- **`systemPrompt.js` → `PHOTO_DETECTION_PROMPT` + `parsePhotoDetection`** —
  fotoğrafı `constants/riskDetection.js`'teki 6 kategoriden birine sınıflandırır
  (KKD Eksikliği, Forklift-İnsan Yakınlığı, Düşme Riski, Kapalı Alan, Yangın/Duman,
  Uygunsuz İstifleme) + kısa gözlem notu üretir. Parser, listede olmayan/uydurma
  bir kategori dönerse `null`'a düşürüp kullanıcının elle seçmesine bırakıyor
  (diğer parser'larla aynı savunmacı desen).
- **`usePhotoDetection.js`** (yeni hook, `riskDetection/` altında) — dosyayı
  base64'e çevirir, `sendPhotoAnalysis` ile AI'ye gönderir, sonucu parse eder.
  Ortak loading/error iskeleti için `useAiSuggestion.js` kullanıldı.
- **`RiskDetectionForm.jsx`** — `initialCategory`/`initialNote`/`photoDataUrl`
  opsiyonel prop'ları eklendi; fotoğraf varsa küçük bir önizleme + "AI önerisi
  dolduruldu" notu gösteriliyor. Konum alanı bilinçli olarak HER ZAMAN elle
  girilir — AI bir fiziksel yer adını bilemez.
- **`RiskDetectionPanel.jsx`** — "📷 Fotoğrafla Tespit Et" butonu (gizli
  `<input type="file" accept="image/*" capture="environment">` ile telefon
  kamerasını/galeriyi açar); analiz sürerken form yerine yükleniyor göstergesi,
  bittiğinde ön doldurulmuş form gösterilir.
- **`useRiskDetections.js` → `addDetection`** — geriye dönük uyumlu 5. parametre
  (`extra = {}`) eklendi: `hazardNote`, `photoDataUrl`. Mevcut çağrılar
  (parametre vermeyenler) etkilenmedi.
- **`RiskDetectionCard.jsx`** — fotoğraf küçük resmi + AI notu gösteriliyor;
  kaynak etiketine "Fotoğraf (AI)" eklendi; "Sahaya İn (Manuel)" artık notu da
  Fine-Kinney'e taşıyor.
- **`useDetectionAIDraft.js`** — küçük iyileştirme: `hazardNote` doluysa (fotoğraf
  tespitinden geldiyse) Fine-Kinney taslağı üretilirken AI'ye ek bağlam olarak
  veriliyor — daha isabetli taslak için.
- **`types/index.js`** — `RiskDetection` typedef'ine `source: "photo"`,
  `hazardNote`, `photoDataUrl` alanları eklendi.

### Güvenlik İlkesi (korunuyor)

AI hiçbir Risk Tespiti kaydını doğrudan oluşturmuyor — yalnızca kategori/not
önerip formu ön dolduruyor; kullanıcı konum girip "Ekle"ye basmadan hiçbir şey
kaydedilmiyor. Belirsiz fotoğraflarda AI kategori seçmek yerine "belirsiz" der
(parser bunu null'a çevirip elle seçime bırakır).

### Etkilenen Modüller

Yeni: `usePhotoDetection.js`. Değişen: `systemPrompt.js`, `RiskDetectionForm.jsx`,
`RiskDetectionPanel.jsx`, `RiskDetectionCard.jsx`, `useRiskDetections.js`,
`useDetectionAIDraft.js`, `types/index.js`, `docs/AI_ROADMAP.md`.

### Test Sonuçları

`parsePhotoDetection` için 5 yeni birim testi (`systemPrompt.test.js`'e eklendi).
`node --test`: **36/36 test geçti, 0 hata** (önceki 31 + yeni 5).
`tsc --noEmit --jsx react` ile 3 değiştirilen JSX dosyasında (`RiskDetectionForm`,
`RiskDetectionPanel`, `RiskDetectionCard`) sözdizimi kontrolü — gerçek hata yok.
Diğer değiştirilen dosyalarda `node --check` temiz. `npm run build` bu sandbox'ta
yine çalıştırılamadı (ağ erişimi kapalı, `node_modules` yok — sandbox'a özgü,
tekrarlayan not).

### Bilinen Sınırlar / Sıradaki Adımlar

- Kullanıcının seçtiği plana göre sıradaki madde: Eğitim Modülü genişletmeleri
  (sertifika PDF export + yeni quiz soru tipleri).
- Aynı kategori+konum kombinasyonuna sahip AÇIK bir tespit zaten varsa
  (`addDetection`'daki "biriktirme" mantığı), yeni fotoğraf/not o mevcut kayda
  YAZILMIYOR — yalnızca `occurrenceCount`/`lastSeenAt` güncelleniyor. Bilinçli
  bir kapsam kararı (mevcut biriktirme davranışını bozmamak için), ama ileride
  "en son fotoğrafı da güncelle" isteği gelirse küçük bir ek gerekir.

**Bağlam:** Kullanıcı "Hepsini sırayla yap" diyerek kalan 3 AI özelliği seçeneğinin
(Bağlama Duyarlı Copilot, Doküman İçerik Üretimi, `useAiSuggestion` hook çıkarımı)
tamamının art arda yapılmasını istedi.

### 1) Bağlama Duyarlı AI Copilot

- **`constants/chatContexts.js`** (yeni) — 4 context tanımı (fineKinney,
  riskDetection, periodicChecks, legislation): her biri için sistem promptu eki,
  özel karşılama mesajı, önerilen sorular. Yeni bir modül eklemek istendiğinde
  buraya bir girdi eklemek + ilgili sayfada `AskAiButton` kullanmak yeterli —
  dosya içi yorumda bu genişletme yolu belgelendi.
- **`components/AskAiButton.jsx`** (yeni) — 4 sayfada (RiskAnalysisPage'in
  Fine-Kinney/Risk Tespiti sekmeleri, DocumentsPage'in Periyodik Kontroller
  sekmesi, LegislationPage) tekrarı önlemek için tek bir buton bileşeni;
  `/chat`'e `state: { contextId }` ile yönlendirir.
- **`ChatPanel.jsx`** — `contextId` prop'u alır; aktifse SYSTEM_PROMPT'a context
  eki eklenir, karşılama mesajı context'e özel olur, context'e özel önerilen
  sorular gösterilir, üstte context chip'i ("🤖 {label}") + genel sohbete dönme
  (×) butonu bulunur. `contextId` yokken (doğrudan menüden girişte) davranış
  tamamen eskisi gibi.
- **`Chat.jsx`** — `useLocation().state.contextId`'yi okuyup `ChatPanel`'e geçirir.

### 2) Doküman İçerik Üretimi

- **`systemPrompt.js` → `DOCUMENT_DRAFT_PROMPT`** — belge türü+başlıktan
  düzenlenmeye hazır taslak üretir; işyerine özel bilgi/mevzuat maddesi
  uydurmama kuralı diğer prompt'larla tutarlı.
- **`documentService.js` → `generateDocumentDraft()`** — `chatService` üzerinden
  çağırır; hata durumunda **fırlatmaz**, boş string döner (diğer AI
  fonksiyonlarından bilinçli fark: burada üretim başarısız olsa bile belge
  taslağı yine de boş içerikle oluşturulabilsin istendi — kullanıcı elle
  yazabilir, tüm akış çökmesin).
- **`DocumentGenerator.jsx`** — belge oluşturma artık AI taslağını bekleyip
  (loading durumu: "AI taslak oluşturuyor...") `content` alanına yazıyor.
- **`DocumentDetailDrawer.jsx`** (yeni) — önceden belge içeriğini görüntülemenin
  hiçbir yolu yoktu; artık karta tıklayınca içerik görüntülenip düzenlenebiliyor,
  "Tamamlandı Olarak İşaretle" ile durum güncelleniyor. `PeriodicCheckDetailDrawer.jsx`
  ile aynı `Modal.jsx` tabanlı desen kullanıldı.

### 3) `useAiSuggestion` Hook Birleştirmesi

- **`hooks/useAiSuggestion.js`** (yeni) — `useAIRiskAnalysis.js` ve
  `useInitialRiskScore.js`'in ortak loading/error/try-catch iskeletini taşır.
  Domain'e özel kısım (hangi servis çağrılır, cevap forma nasıl uygulanır)
  çağıran hook'ta kalır; bu ortak hook AI/form hakkında hiçbir şey bilmez.
- İki hook da bu ortak hook'u kullanacak şekilde yeniden yazıldı — **davranış
  birebir aynı**, yalnızca tekrar eden state/try-catch kodu kaldırıldı.

### Güvenlik İlkesi (korunuyor)

Üçü de aynı ilkeye uyuyor: AI hiçbir kaydı doğrudan/sessizce oluşturmuyor veya
tamamlamıyor — belge taslağı her zaman "Taslak" statüsünde başlıyor, Copilot
yalnızca sohbet cevabı üretiyor, sayfa/form state'ini değiştirmiyor.

### Etkilenen Modüller

Yeni: `constants/chatContexts.js`, `components/AskAiButton.jsx`,
`features/documents/DocumentDetailDrawer.jsx`, `hooks/useAiSuggestion.js`,
`constants/chatContexts.test.js`. Değişen: `ChatPanel.jsx`, `Chat.jsx`,
`RiskAnalysisPage.jsx`, `DocumentsPage.jsx`, `LegislationPage.jsx`,
`systemPrompt.js`, `documentService.js`, `DocumentGenerator.jsx`,
`useAIRiskAnalysis.js`, `useInitialRiskScore.js`, `documentTypes.js` (yorum).

### Test Sonuçları

`getChatContext` için 4 yeni birim testi (`chatContexts.test.js`).
`node --test`: **31/31 test geçti, 0 hata** (önceki 27 + yeni 4).
`tsc --noEmit --jsx react` ile tüm değiştirilen `.jsx` dosyalarında sözdizimi
kontrolü yapıldı, gerçek hata yok. Diğer değiştirilen dosyalarda `node --check` temiz.

**Not — test edilemeyen bir dosya:** `hooks/useAiSuggestion.js` için başlangıçta bir
test dosyası yazıldı, ancak bu dosya `react`'i import ettiğinden ve sandbox'ta
`node_modules` hiç kurulamadığından (`react` paketi yok), test çalıştırılamadı
(`ERR_MODULE_NOT_FOUND`). Bu test dosyası kaldırıldı — çalıştığı doğrulanamayan bir
test eklemek yerine dürüstçe bu sınırı burada belirtiyorum. Gerçek uygulamada
(Netlify build'inde `react` kurulu olduğu için) hook normal çalışır; yalnızca bu
sandbox'ta izole birim testi yazılamıyor. `npm run build` da aynı nedenle bu
sandbox'ta çalıştırılamıyor (önceki sprintlerdeki not).

### Bilinen Sınırlar / Sıradaki Adımlar

- AI Vision (fotoğraftan tehlike tespiti) ve gerçek vektör tabanlı RAG hâlâ
  `AI_ROADMAP.md`'de planlanan aşamada (ikincisi Phase 7/backend'e bağlı).
- Bağlama Duyarlı Copilot şu an 4 modülde devrede; Bilgi Kütüphanesi'nin kendi
  AI asistanı zaten ayrı ve odaklı olduğu için oraya eklenmedi.

**Bağlam:** `AI_ROADMAP.md` → "Planlanan Genişlemeler" listesindeki `scoreRisk()`
maddesi ele alındı. Kullanıcı, teknik borç sağlamlaştırma turunun ardından AI
özellikleri yönünü seçti; dört seçenek arasından bunu ilk sıraya koydu.

### Yapılan Geliştirmeler

- **Yeni AI prompt'u** (`systemPrompt.js` → `INITIAL_SCORE_PROMPT`) — yalnızca
  tehlike+risk metninden, önlem öncesi başlangıç Olasılık/Maruziyet/Şiddet önerisi
  üretir. `FINE_KINNEY_AI_PROMPT`'tan bilinçli olarak ayrı: o, P/M/Ş zaten girildikten
  sonra önlem + artık risk öneriyor; bu, formun EN BAŞINDA çalışıyor.
- **`parseInitialScoreSuggestion`** — diğer parser'larla (`parseResidualSuggestion`,
  `parseDetectionRiskDraft`) aynı savunmacı yaklaşım: format dışı cevapta ilgili
  alan(lar) null döner, arayüz çökmez.
- **`riskService.scoreRisk()` artık gerçek implementasyon** — önceden
  `throw new Error(...)` atan placeholder'dı; artık `chatService` üzerinden AI'ye
  gidip parse edilmiş öneriyi döner.
- **Yeni hook: `useInitialRiskScore.js`** — `useAIRiskAnalysis.js` ile aynı desen
  (loading/error state, form'a yalnızca düzenlenebilir alanlara yazma). Bilinçli
  olarak ayrı dosya: ikisi farklı zamanlarda (form başı / form sonu) çalışıyor.
- **`FineKinneyForm.jsx`** — Olasılık/Maruziyet/Şiddet dropdown'larının hemen
  üstüne "🤖 AI ile Puanla" butonu eklendi; öneri geldiğinde gerekçe kısa bir
  metinle gösteriliyor, değerler dropdown'lara yazılıyor (kullanıcı düzenleyebilir,
  otomatik kaydedilmiyor).

### Güvenlik İlkesi (korunuyor)

Bu özellik de üründeki "AI karar vermez, karar destek verir" ilkesine uyuyor: öneri
yalnızca kullanıcının düzenleyip onaylayacağı dropdown alanlarına yazılıyor, hiçbir
kayıt AI tarafından doğrudan oluşturulmuyor/kaydedilmiyor.

### Etkilenen Modüller

`src/constants/systemPrompt.js`, `src/services/riskService.js` (+ dosya başı yorumu),
`src/features/risk-analysis/fineKinney/useInitialRiskScore.js` (yeni),
`src/features/risk-analysis/fineKinney/FineKinneyForm.jsx`, `docs/AI_ROADMAP.md`
(scoreRisk() maddesi "bugün çalışıyor" tablosuna taşındı).

### Test Sonuçları

`parseInitialScoreSuggestion` için 4 yeni birim testi (`systemPrompt.test.js`) —
beklenen format, boş/null cevap, format dışı kısmi cevap, ondalıklı değerler.
`node --test`: **27/27 test geçti, 0 hata** (önceki 23 + yeni 4).
`tsc --noEmit --jsx react` ile `FineKinneyForm.jsx` üzerinde JSX sözdizimi kontrolü
yapıldı (import/modül çözümleme hataları filtrelendi, gerçek sözdizimi hatası yok).
Diğer değiştirilen dosyalarda `node --check` temiz.
**Not:** `npm run build` bu sandbox'ta hâlâ çalıştırılamıyor (ağ erişimi kapalı,
`node_modules` kurulamıyor) — önceki sprintlerdeki gibi sandbox'a özgü bir sınırlama.

### Bilinen Sınırlar / Sıradaki Adımlar

- `useAIRiskAnalysis.js` ve `useInitialRiskScore.js` arasında küçük bir yapısal
  benzerlik var (ikisi de loading/error state + chatService çağrısı) — kullanıcının
  daha önce onayladığı "önce `useAiSuggestion` hook çıkarımı" seçeneği bu ikisini
  (ve gelecekteki benzer AI hook'larını) tek bir ortak temel üzerine oturtabilir.
  Şimdilik erken soyutlama riskinden kaçınmak için ayrı tutuldu (bkz.
  DEVELOPMENT_RULES.md → "3 kullanım öncesi soyutlama yapma" ilkesi, burada 2 var).
- AI Vision (fotoğraftan tehlike tespiti) ve doküman içeriği üretimi hâlâ planlanan
  aşamada.

**Bağlam:** Bir önceki oturumda tespit edilen "rol modeli ikiliği" ve "sıfır test
kapsamı" maddeleri ele alındı. Kullanıcı ayrıca ürünün şu anlık OSGB/çoklu firma
senaryosuna satılmadığını belirterek `companyAdmin`/`superAdmin` rollerinin
kaldırılmasını istedi.

### Yapılan Geliştirmeler

- **Rol modeli sadeleştirildi** — `allRoles.js`'teki `ALL_ROLES` 5 rolden 3 role
  indirildi (`expert`/`employer`/`employee`); `companyAdmin`/`superAdmin` bilinçli
  olarak kaldırıldı (bkz. dosya içi yorum, gerekirse Phase 7'de geri eklenebilir).
  `SWITCHABLE_ROLES` artık `ALL_ROLES` ile birebir aynı.
- `src/types/index.js` → `FullRole` typedef'i 3 role indirildi (kullanılmayan kod
  temizlendi, hiçbir yerde referans edilmiyordu).
- `src/utils/permissions.js` → `ROLE_PERMISSIONS` haritasından `companyAdmin`/
  `superAdmin` satırları kaldırıldı.
- **Test altyapısı kuruldu — sıfır yeni bağımlılıkla.** Sandbox'ta ağ erişimi
  olmadığı için `vitest` kurulamadı; bunun yerine Node'un yerleşik `node:test`
  çalıştırıcısı kullanıldı (Node 18+ ile gelir, `package.json`'a yalnızca
  `"test": "node --test src/**/*.test.js"` script'i eklendi, **hiçbir
  dependency/devDependency eklenmedi**).
- **Kritik iş mantığı için 23 birim testi yazıldı:**
  - `fineKinney.test.js` — `computeFineKinneyScore` ve `getFineKinneyRiskLevel`
    (özellikle 20/70/200/400 sınır değerleri).
  - `filterFineKinneyEntries.test.js` — arama/departman/şube/durum/öncelik/tarih
    aralığı filtreleri ve bunların AND kombinasyonu.
  - `knowledgeCenter.test.js` — `findRelevantDocuments`/`findRelatedDocuments`
    (RAG-lite anahtar kelime eşleştirmesi).
  - `permissions.test.js` — `hasRole`/`hasPermission`, kaldırılan rollerin
    sessizce yetki kazanmadığını doğrulayan regresyon testi dahil.
- **Küçük, davranış-koruyan çıkarım:** `useFineKinneyEntries.js` içindeki
  `filteredEntries` useMemo'sunun filtre mantığı, test edilebilmesi için
  `filterFineKinneyEntries.js`'e (saf fonksiyon) taşındı; hook artık bu fonksiyonu
  çağırıyor. Davranış birebir aynı, yalnızca React'tan bağımsızlaştırıldı.

### Etkilenen Modüller

`src/constants/allRoles.js`, `src/types/index.js`, `src/utils/permissions.js`,
`src/features/risk-analysis/fineKinney/useFineKinneyEntries.js` (küçük çıkarım),
`package.json` (yeni `test` script'i). 4 yeni test dosyası eklendi.

### Test Sonuçları

`node --test` ile gerçekten çalıştırıldı: **23/23 test geçti, 0 hata.**
`node --check` ile tüm değiştirilen dosyalarda statik sözdizimi doğrulaması yapıldı.
**Not:** Sandbox'ta ağ erişimi olmadığından `npm run build` çalıştırılamadı
(`node_modules` hiç kurulamıyor) — bu, bu oturuma özgü bir sınırlama olup yapılan
değişikliklerden kaynaklanmıyor; gerçek build doğrulaması Netlify'daki otomatik
build'de gerçekleşecek.

### Bilinen Sınırlar / Sıradaki Adımlar

- Dashboard ve Bilgi Kütüphanesi'ndeki diğer `useMemo` filtre desenleri (React
  state'ine sıkı bağlı) bu sprintte test edilmedi — kapsam bilinçli olarak en
  kritik iş kuralı olan Fine-Kinney puanlama/filtreleme ile sınırlı tutuldu.
- **Not (düzeltme):** Kontrol edildiğinde `docs/CHANGELOG.md`, `SPRINTS.md` ve kök
  `README.md`'nin zaten güncel 9 fazlı `ROADMAP.md` yapısıyla senkron olduğu
  görüldü (önceki bir oturumda düzeltilmiş). Bu sprint için üçüne de (+ kök
  `CHANGELOG.md`'ye) ilgili girdiler eklendi; ayrı bir "senkronizasyon" işi
  gerekmedi.

---

## Sprint 9.1 — Risk Tespiti (Triage Havuzu)

**Bağlam:** `ROADMAP.md`'ye eklenen Phase 9 (Canlı Kamera & Sensör AI, ürünün son fazı)
planlamasının ilk, kamerasız/backend'siz teslimatı. Kullanıcı önceki turda mock tespit
üretiminin hem manuel hem otomatik simülasyon şeklinde olmasını istemişti — ikisi de
uygulandı.

### Yapılan Geliştirmeler

- **Yeni "Risk Tespiti" sekmesi** — Risk Analizi sayfasına (mevcut sekme sistemine,
  `RiskAnalysisPage.jsx`) eklendi; yalnızca Uzman ve İşveren görüyor (Çalışan
  görmüyor), tıpkı Fine-Kinney ve Aktivite Geçmişi sekmeleri gibi.
- **Bilinçli olarak Fine-Kinney'den ayrı bir veri modeli** (`RiskDetection`, yeni
  IndexedDB koleksiyonu `riskDetections`) — ham/doğrulanmamış tespit ile resmi/
  denetime-ibraz-edilen Fine-Kinney kaydı karıştırılmıyor.
- **Durum akışı, insan-yönlendirmeli:** Yeni → (İncele) → İncelemede → (AI ile Taslak
  / Sahaya İn) → Fine-Kinney formu açılır → kullanıcı orada kaydeder → Risk Tespiti'ne
  dönüp "Dönüştürüldü Olarak İşaretle" ile kapatır. Hiçbir adım sistem tarafından
  otomatik/sessizce yapılmıyor.
- **Biriktirme** — aynı kategori+konum için açık (Yeni/İncelemede) bir kayıt varsa
  yeni satır açılmıyor, `occurrenceCount` artıp `lastSeenAt` güncelleniyor. Kapanmış
  bir tehlikenin tekrar görülmesi bilinçli olarak yeni bir vaka sayılıyor.
- **Manuel ekleme** (`RiskDetectionForm.jsx`) — kategori + konum (öneri listeli
  serbest metin) + opsiyonel departman.
- **Demo: Otomatik Simülasyon** (`ToggleSwitch` ile açık/kapalı) — açıkken ~25
  saniyede bir rastgele kategori+konum ile `source: "simulated"` bir tespit üretir;
  kapatılınca veya bileşen unmount olunca `setInterval` güvenli şekilde temizleniyor
  (bellek sızıntısı yok, iki ayrı `useEffect` ile garanti altına alındı).
- **"AI ile Taslak Oluştur"** — yeni `DETECTION_TO_RISK_PROMPT` + `parseDetectionRiskDraft`
  (systemPrompt.js): kategori+konum+tekrar sayısından risk tanımı + başlangıç
  Olasılık/Maruziyet/Şiddet + önlem önerisi üretir. `useAIRiskAnalysis.js` ile AYNI
  ilke: AI hiçbir kaydı doğrudan oluşturmuyor, yalnızca "Fine-Kinney Formuna Aktar"
  ile ön dolgu sağlıyor.
- **"Sahaya İn (Manuel)"** — aynı köprü mekanizması, AI önerisi olmadan yalnızca
  kategori/konum ön dolgusuyla; uzman sahaya inip Fine-Kinney'i kendisi tamamlıyor.
- **`FineKinneyModule.jsx` köprü desteği** — `pendingDraft`/`onDraftConsumed` prop'ları
  eklendi; `openDraftForm()` artık olasılık/maruziyet/şiddet/önlem gibi ek alanları da
  ön doldurabiliyor (önceden yalnızca hazard/risk destekliyordu — Sprint 7.5'in
  Mevzuat Taraması akışı hâlâ bunu hazard/risk-only kullanıyor, geriye dönük uyumlu).
- **`ToggleSwitch` paylaşımlı bileşene çıkarıldı** — daha önce yalnızca `Settings.jsx`
  içinde yerel bir bileşendi; Demo Simülasyonu anahtarı için aynı ihtiyaç doğunca
  `components/ui/ToggleSwitch.jsx`'e taşındı, Settings.jsx buradan import ediyor
  (davranış/görünüm değişmedi, yalnızca kod tekrarı kaldırıldı).
- **Üst özet şeridi + arama/durum/kategori filtreleri** — Periyodik Kontrol ve
  Fine-Kinney modüllerindeki AYNI desenler (her zaman filtreden bağımsız tüm kayıtlar
  üzerinden hesaplama).

### Etkilenen Modüller

- **Yeni:** `constants/riskDetection.js`, `services/riskDetectionService.js`,
  `features/risk-analysis/riskDetection/` (useRiskDetections.js,
  useDetectionAIDraft.js, RiskDetectionPanel.jsx, RiskDetectionCard.jsx,
  RiskDetectionFilters.jsx, RiskDetectionForm.jsx), `components/ui/ToggleSwitch.jsx`.
- **Küçük ek:** `constants/systemPrompt.js` (+`DETECTION_TO_RISK_PROMPT`,
  +`parseDetectionRiskDraft`), `services/db.js` (+`riskDetections` store, DB_VERSION
  9→10), `types/index.js` (+`RiskDetection` typedef), `constants/activityLink.js`
  (+`riskDetection` entity route).
- **Değişen:** `RiskAnalysisPage.jsx` (yeni sekme + köprü state'i),
  `FineKinneyModule.jsx` (`pendingDraft` desteği), `pages/Settings.jsx`
  (`ToggleSwitch` artık paylaşımlı bileşenden import ediliyor).
- **Dokunulmayan:** `useFineKinneyEntries.js`'in kayıt/kaydetme mantığı, Bildirim
  Merkezi, Aktivite Geçmişi — hiçbiri değiştirilmedi.

### Bilinen Riskler

- Risk Tespiti'nden dönüştürülen bir tespit ile sonuçta oluşan Fine-Kinney kaydı
  arasında **otomatik bir id bağlantısı kurulmuyor** — kullanıcı manuel olarak
  "Dönüştürüldü Olarak İşaretle" ile kapatıyor. Bu bilinçli bir basitleştirme
  (bkz. "Sonraki Öneriler"), ama iki modül arasında ileri-geri geçen kullanıcı için
  ekstra bir adım demek.
- Demo Simülasyonu tam olarak metronomik 25 saniyede bir çalışmıyor — her yeni tespit
  eklendiğinde `addDetection` referansı değiştiği için interval yeniden kurulur
  (yaklaşık 25 saniyelik bir kadans korunur ama kesin/sabit değildir). Fonksiyonel
  bir hata değil, yalnızca zamanlamanın hassas olmadığı bir demo özelliği.
- `RiskAnalysisPage.jsx`'in sekme durumu URL'e yansımıyor (Dokümanlar sayfasındaki
  `?tab=` desteğinin aksine) — bu yüzden Dashboard'daki "Son Aktiviteler"nden bir
  `riskDetection` olayına tıklamak kullanıcıyı `/risk-analysis`'e götürür ama doğrudan
  Risk Tespiti sekmesine değil, sayfanın varsayılan ilk sekmesine düşer.
- Gerçek AI çağrısı ("AI ile Taslak Oluştur") bu ortamda (internet erişimi yok) test
  edilemedi — yalnızca statik olarak doğrulandı, Netlify'a deploy sonrası
  doğrulanmalı.

### Sonraki Öneriler

1. `RiskAnalysisPage.jsx`'e de `?tab=` desteği eklemek (Dokümanlar sayfasındaki
   desenle aynı) — Dashboard'dan gelen "Son Aktiviteler" bağlantılarının doğrudan
   Risk Tespiti sekmesine açılabilmesi için.
2. Dönüştürülen tespit ile oluşan Fine-Kinney kaydı arasında opsiyonel bir bağlantı
   (örn. "Dönüştürüldü Olarak İşaretle" tıklanınca son eklenen 5 Fine-Kinney kaydından
   birini seçtirmek) — şu an kasıtlı olarak basit bırakıldı.
3. Phase 9.2 — dar kapsamlı gerçek CV entegrasyonu (gerçek kamera + backend gerektirir,
   ayrı ve büyük bir sonraki adım).

### Documentation Check

| Dosya | Güncellendi mi? | Gerekçe |
|---|---|---|
| README.md | ✅ | Yol haritası özet tablosunda Phase 9 durumu güncellendi |
| CHANGELOG.md | ✅ | Kullanıcıya görünen yeni sekme/özellik |
| ROADMAP.md | ✅ | Phase 9.1 "teslim edildi" olarak işaretlendi |
| SPRINTS.md | ✅ | Yeni sprint satırı + Phase 9 sayaç/durum güncellemesi + "Sıradaki Sprint" notu tazelendi |
| ARCHITECTURE.md | ❌ | Mimari desen değişmedi (aynı dataProvider/hook/servis katmanlaması) |
| DATABASE_PLAN.md | ❌ | Yeni bir IndexedDB koleksiyonu eklendi ama bu doküman Supabase'e geçiş planına odaklı — ayrı bir sprintte tüm yeni koleksiyonlarla birlikte toplu güncellenmesi daha tutarlı olur |

---

## Sprint 7.5 — AI Mevzuat Takibi & Proaktif Fine-Kinney Önerisi

**Bağlam:** Bu sprint, `ROADMAP.md`'ye yeni eklenen **Phase 9 — Canlı Kamera & Sensör
AI** planlamasının ardından, kullanıcının "önce hangisiyle başlayalım" sorusuna verdiği
yanıtla belirlendi: kamerasız/backend'siz üretilebilecek **Phase 5 kapanış hedefi**
("AI Mevzuat Takibi & Proaktif Fine-Kinney Önerisi") seçildi; Phase 9.1 (Risk Tespiti
triage sekmesi) ileri bir sprint için beklemede.

### Yapılan Geliştirmeler

- **AI Mevzuat & Risk Taraması paneli** — Fine-Kinney sayfasına, Bilgi
  Kütüphanesi'ndeki AI asistanıyla (`KnowledgeAIAssistant.jsx`) AYNI kapalı/açık kart
  deseninde yeni bir panel eklendi. Bağlam olarak Bilgi Kütüphanesi'nin
  `category === "legislation"` dokümanları + firmanın mevcut Fine-Kinney kayıtlarının
  özeti (en fazla 30 kayıt, kapsam sınırı arayüzde belirtiliyor) AI'ye veriliyor.
- **İki liste üretiliyor:** (1) Gözden Geçirilmesi Önerilen Kayıtlar — mevzuat
  ışığında yetersiz görünen mevcut kayıtlar, kısa gerekçeyle; gerçek kayda eşleşirse
  "Kayda Git" ile detay ekranı açılıyor. (2) Yeni Risk Önerileri — henüz hiç
  girilmemiş, mevzuat + mevcut kayıt örüntüsünden çıkarılan 1-3 somut taslak;
  "Taslak Oluştur" formu ön doldurulmuş açıyor, kaydetme kararı kullanıcıda.
- **AI hiçbir zaman doğrudan kayıt oluşturmuyor** — `useAIRiskAnalysis.js`'teki
  "AI karar vermez, karar destek verir" ilkesiyle birebir aynı: `openDraftForm()`
  yalnızca formu dolduruyor, `saveEntry()`'yi çağırmıyor.
- **Savunmacı ayrıştırma** — `MEVZUAT_SCAN_PROMPT`, AI'den sabit `### GÖZDEN GEÇİR` /
  `### YENİ ÖNERİ` başlıklarıyla cevap istiyor; `parseMevzuatScan()` format dışı bir
  cevapta çökmek yerine sessizce boş dizi dönüyor (mevcut `parseResidualSuggestion`
  ile aynı savunmacı yaklaşım). AI ayrıca spesifik mevzuat madde numarası uydurmaması
  için açıkça talimatlandırıldı.
- **Filtre-bağımsız navigasyon** — `useFineKinneyEntries.js`'e `allEntries`
  (filtreden bağımsız TÜM kayıtlar) eklendi; panel ve detay ekranı artık aktif bir
  arama/durum/departman filtresi bir kaydı görünümden çıkarmış olsa bile "Kayda Git"
  doğru çalışıyor (önceden yalnızca filtrelenmiş `entries` kullanılıyordu — bu, AI
  panelinden gelen bir yönlendirmeyi sessizce kırabilirdi, düzeltildi).
- **Dokümantasyon** — `ROADMAP.md`'ye Phase 9 (Canlı Kamera & Sensör AI, ürünün son
  fazı) eklendi, Phase 5'in tanımı "RAG & Proaktif Besleme" olarak genişletildi;
  `README.md` ve `PROJECT_CONTEXT.md`'deki faz özetleri senkronize edildi.

### Etkilenen Modüller

- **Yeni:** `features/risk-analysis/fineKinney/useMevzuatScan.js`,
  `features/risk-analysis/fineKinney/MevzuatScanPanel.jsx`.
- **Küçük ek:** `constants/systemPrompt.js` (+`MEVZUAT_SCAN_PROMPT`,
  +`parseMevzuatScan`), `features/risk-analysis/fineKinney/useFineKinneyEntries.js`
  (+`allEntries`).
- **Değişen:** `features/risk-analysis/FineKinneyModule.jsx` (panel entegre edildi,
  `openDraftForm` eklendi, detay lookup `allEntries`'e geçirildi), `docs/ROADMAP.md`,
  `README.md`, `docs/PROJECT_CONTEXT.md` (Phase 9 + Phase 5 güncellemesi).
- **Dokunulmayan:** `useAIRiskAnalysis.js`, Bilgi Kütüphanesi AI asistanı — yeni
  panel bunlardan desen ödünç aldı ama hiçbirini değiştirmedi.

### Bilinen Riskler

- Mevcut mock Bilgi Kütüphanesi'nde yalnızca 2 mevzuat dokümanı var (6331 sayılı
  Kanun, Risk Değerlendirmesi Yönetmeliği) — tarama sonuçlarının kalitesi/çeşitliliği
  gerçek, daha geniş bir mevzuat kütüphanesiyle çok daha anlamlı olacaktır. Bu bir
  kod eksikliği değil, mock verinin doğal sınırıdır.
- AI'nin "Gözden Geçir" maddesinde tehlike adını AYNEN kullanması istendi, ancak model
  yine de küçük yazım farkına düşerse (örn. büyük/küçük harf, fazladan boşluk) eşleşme
  bulunamayabilir — bu durumda madde "Kayda Git" bağlantısı olmadan serbest metin
  olarak gösteriliyor (çökme yok, sadece navigasyon eksik kalıyor).
- Gerçek AI çağrısı bu ortamda (internet erişimi yok) test edilemedi — yalnızca
  statik olarak (sözdizimi, import/prop akışı, parser fonksiyonunun örnek girdilerle
  mantığı) doğrulandı. Netlify'a deploy sonrası gerçek bir taramayla doğrulanmalı.

### Sonraki Öneriler

1. Phase 9.1 — Risk Tespiti triage sekmesi (bir önceki turda kullanıcıya soruldu,
   bu sprint için ertelendi).
2. Bilgi Kütüphanesi'ndeki mevzuat kategorisine gerçek/daha fazla doküman eklemek —
   tarama kalitesini doğrudan artırır.
3. `parseMevzuatScan()`'i gerçek AI çağrısı sonrası örnek çıktılarla (Netlify'da)
   doğrulayıp gerekirse formatı ince ayar yapmak.

### Documentation Check

| Dosya | Güncellendi mi? | Gerekçe |
|---|---|---|
| README.md | ✅ | Yol haritası özet tablosu Phase 9 ile senkronize edildi |
| CHANGELOG.md | ✅ | Kullanıcıya görünen yeni AI panel |
| ROADMAP.md | ✅ | Phase 9 eklendi, Phase 5 tanımı genişletildi |
| SPRINTS.md | ✅ | Yeni sprint satırı + Phase 5 sayaç güncellemesi + "Sıradaki Sprint" notu tazelendi |
| ARCHITECTURE.md | ❌ | Mimari desen değişmedi (mevcut AI-hook + servis katmanlaması) |
| DATABASE_PLAN.md | ❌ | Yeni kalıcı veri/alan eklenmedi (panel state'i geçici, kayda dönüşene kadar kaydedilmiyor) |

---

## Sprint 7.2.4 — Dashboard: Platformun Merkezi

### Yapılan Geliştirmeler

- **Entegrasyon kontrolü** — Fine-Kinney, Eğitim, Periyodik Kontrol modüllerinden
  canlı veri okuma zaten Sprint 7.4'te kurulmuştu (`useEmployerDashboardData.js`).
  Bu sprint bunu yeniden inşa etmedi, üzerine ekleme yaptı.
- **Açık Kritik Riskler kartı** — `CriticalRisksCard.jsx` (yeni). Mevcut KPI
  grid'indeki "Kritik Risk" sayısı durumdan bağımsız tüm yüksek/çok yüksek
  riskleri sayıyordu; bu kart yalnızca hâlâ açık olanları (durum ≠ "Tamamlandı")
  somut satırlar halinde listeler. Risk rozeti için mevcut `RiskLevelChip`
  bileşeni (risk-analysis modülünden) doğrudan paylaşıldı, yeniden yazılmadı.
- **Kartlardan modüllere tıkla-git** — Son 30 Gün Değişim'in 4 satırı artık
  ilgili modüle bağlı (Risk Analizi / Eğitim / Periyodik Kontroller); Güvenlik
  Skoru'na "Risk Analizi'ne Git" bağlantısı eklendi; Son Aktiviteler'deki her
  satır, olayın `entityType`'ına göre (yeni `constants/activityLink.js`) ilgili
  modüle yönlendiriyor — eşleşme yoksa (bildirim/şirket gibi) satır sade kalıyor,
  var olmayan bir sayfaya yönlendirme YAPILMIYOR.
- **Tooltip ve kısa açıklamalar** — `InfoTooltip.jsx` (yeni, `components/ui/`):
  native `<details>/<summary>` üzerine kurulu, JS state'siz, bağımlılıksız; hem
  dokunmatik (mobil) hem fare (masaüstü) ile aynı şekilde açılıyor — `title`
  özniteliğine dayalı bir hover-tooltip mobilde hiç çalışmayacağı için bilinçli
  olarak bu yaklaşım seçildi. `DashboardWidget.jsx`'e opsiyonel `description`
  prop'u eklendi ve Dikkat Gerektirenler, Açık Kritik Riskler, Yaklaşan Periyodik
  Kontroller, Devam Eden Eğitimler, Son Aktiviteler, Güvenlik Skoru, Son 30 Gün
  Değişim kartlarına kısa açıklamalar eklendi.
- **Boş durum** — Sprint 7.4'ün development report'unda not edilen risk
  giderildi: Son 30 Gün Değişim kartı artık, uygulamada hiç veri yokken dört
  sıfırlı metrik yerine "Henüz karşılaştırılacak yeterli geçmiş veri yok"
  mesajı gösteriyor.
- **Loading/Error tutarlılığı** — kontrol edildi: `EmployerDashboard.jsx`
  (Sprint 7.4'te düzeltilmişti) hem Genel Bakış hem Performans sekmesini aynı
  `Loading`/`ErrorState` kapısının arkasında render ediyor; ek değişiklik
  gerekmedi.

### Etkilenen Modüller

- **Yeni:** `components/ui/InfoTooltip.jsx`, `constants/activityLink.js`,
  `features/dashboard/employer/CriticalRisksCard.jsx`.
- **Değişen:** `components/DashboardWidget.jsx` (+`description` prop),
  `features/dashboard/employer/SafetyScoreCard.jsx` (+tooltip, +link),
  `features/dashboard/employer/Last30DaysChangeCard.jsx` (+tooltip, +linkler,
  +boş durum), `features/dashboard/employer/EmployerOverviewTab.jsx` (yeni kart
  entegre edildi, açıklamalar eklendi, Son Aktiviteler tıklanabilir yapıldı),
  `hooks/useWidgetVisibility.js` (+1 widget id: `criticalRisks`).
- **Dokunulmayan:** `useEmployerDashboardData.js` (mevcut veri akışı yeterliydi,
  yeni bir alan gerekmedi — `CriticalRisksCard` doğrudan `fineKinneyEntries`
  kullanıyor), Expert/Employee dashboard'ları (ayrı, eski `IsgDataContext`
  mimarisi kullanıyorlar — bu sprintin kapsamı yalnızca İşveren/karar-destek
  dashboard'uydu, büyük bir mimari birleştirme riske atılmadı).

### Bilinen Riskler

- Expert ve Employee dashboard'ları hâlâ `useIsgData()` context'ini kullanıyor
  (Employer'ın yeni `useEmployerDashboardData` hook mimarisinden farklı) — bu
  sprintte bilinçli olarak dokunulmadı, ayrı bir sprint gerektirir.
- `InfoTooltip`, `<details>` elementinin tarayıcı varsayılan davranışına
  dayanıyor; bazı eski tarayıcılarda okun/üçgenin görünümü farklılık
  gösterebilir (işlevsellik etkilenmez, yalnızca kozmetik).
- Kontrol edilemedi: gerçek tarayıcıda tıklanabilir Son Aktiviteler
  satırlarının (artık `<Link>` olan) önceki `<div>` görsel stiliyle birebir
  aynı göründüğü yalnızca statik olarak doğrulandı (bu ortamda tarayıcı yok).

### Sonraki Öneriler

1. Expert/Employee dashboard'larını da `useEmployerDashboardData` benzeri bir
   hook mimarisine taşımak (ayrı bir sprint — mimari değişiklik).
2. `CriticalRisksCard`'a da (Yaklaşan Kontroller/Eğitimler gibi) kendi
   `?tab=`/departman bazlı derin bağlantısını eklemek (şu an yalnızca genel
   `/risk-analysis`'e gidiyor).
3. `AttentionNeededPanel`'deki öğelere de tıkla-git eklemek (bu sprintte
   yalnızca açıklama tooltip'i eklendi, navigasyon eklenmedi — öğeler hem risk
   hem kontrol karışımı olduğundan tek bir hedef net değildi).

### Documentation Check

| Dosya | Güncellendi mi? | Gerekçe |
|---|---|---|
| README.md | ❌ | Modül adı/üst seviye açıklama değişmedi |
| CHANGELOG.md | ✅ | Kullanıcıya görünen yeni kart, tıklanabilirlik, tooltip, boş durum |
| ROADMAP.md | ❌ | Faz durumları değişmedi (Phase 1 kapsamında) |
| SPRINTS.md | ✅ | Yeni sprint satırı + Phase 1 sayaç güncellemesi |
| ARCHITECTURE.md | ❌ | Mimari desen değişmedi |
| DATABASE_PLAN.md | ❌ | Yeni kalıcı veri/alan eklenmedi |

---

## Sprint 7.2.3 — Periyodik Kontrol Merkezi (genişletme)

### Yapılan Geliştirmeler

- **Dashboard Özeti** — `PeriodicCheckSummaryCards.jsx` (yeni): Geciken Kontroller,
  Bugünkü Kontroller, Bu Hafta Yaklaşanlar, Bu Ay Tamamlananlar. Modülün en üstünde,
  her zaman tüm kayıtlar üzerinden (filtreden bağımsız) hesaplanıyor.
- **Kontrol Listesi filtreleri** — Departman ve Tarih Aralığı (Sonraki Kontrol
  tarihine göre) eklendi. Fine-Kinney modülündeki `FineKinneyFilters.jsx`'in
  "Gelişmiş Filtreler" collapsible deseni birebir uygulandı; departman listesini
  çeken `useCompanyOrgLists()` hook'u (daha önce yalnızca risk-analysis'te
  kullanılıyordu) doğrudan içe aktarılıp paylaşıldı — kopyalanmadı.
- **Kontrol Detayı** — `PeriodicCheckDetailDrawer.jsx` (yeni, paylaşımlı `Modal.jsx`
  üzerine kurulu): Ekipman, Kontrol Türü, Departman, Son Kontrol, Sonraki Kontrol,
  Durum, Sorumlu, Açıklama alanlarını gösteriyor + Düzenle/Sil/Bugün Kontrol Edildi
  aksiyonları. Kart artık tıklanabilir; aksiyon butonları `stopPropagation` ile
  kartın kendi tıklama davranışını ezmiyor.
- **Takvim Görünümü** — Bugün / Bu Hafta / Bu Ay mod anahtarı eklendi. "Bugün" sade
  bir günlük liste, "Bu Hafta" 7 günlük tek satır şerit, "Bu Ay" ise Sprint
  7.2.2'deki mevcut ay ızgarası (değiştirilmedi). Yeni kütüphane eklenmedi.
- **Dashboard Hazırlığı** — `computePeriodicCheckStats()` (constants/periodicCheck.js,
  yeni, saf fonksiyon) istenen dört alanı (`upcomingCount`, `overdueCount`,
  `okCount`, `completionRate`) hazır döndürüyor. Bu sprintte yalnızca "hazırlık"
  istendiği için Employer Dashboard'a bağlanmadı — Sprint 7.4'teki
  `UpcomingChecksCard`/`Last30DaysChangeCard` gibi ileride doğrudan tüketilebilir.
- **Veri modeli** — `PeriodicCheck`'e opsiyonel `departmentId` eklendi (form, kayıt,
  filtre, kart, detay ekranı hepsi güncellendi; mevcut kayıtlar `departmentId`
  olmadan da sorunsuz çalışır — alan opsiyonel).

### Etkilenen Modüller

- **Yeni:** `PeriodicCheckSummaryCards.jsx`, `PeriodicCheckDetailDrawer.jsx`.
- **Küçük ek:** `constants/periodicCheck.js` (+`computePeriodicCheckStats`),
  `icons/index.jsx` (+1 ikon: Clock), `types/index.js` (`PeriodicCheck.departmentId`).
- **Değişen (yeniden yazıldı, davranış korunarak genişletildi):**
  `usePeriodicChecks.js` (+departmentFilter/dateFrom/dateTo/stats),
  `PeriodicCheckForm.jsx` (+departman seçimi), `PeriodicCheckFilters.jsx`
  (+gelişmiş filtreler paneli), `PeriodicCheckCard.jsx` (+tıklanabilir detay,
  +departman etiketi, dokunma alanı büyütüldü), `PeriodicCheckCalendar.jsx`
  (+3 görünüm modu), `PeriodicChecksPanel.jsx` (hepsini bağlayan orkestratör).
- **Dokunulmayan:** `periodicCheckService.js` (zaten `companyId` otomatik damgalıyordu,
  değişiklik gerekmedi), `PeriodicCheckOverviewPanel.jsx` (Dashboard'daki makro özet —
  ayrı, tamamlayıcı bir görünüm; bilinçli olarak dokunulmadı).

### Bilinen Riskler

- `departmentId` alanı yalnızca **yeni** kayıtlarda ve düzenlenen kayıtlarda dolar;
  Sprint 7.2.3 öncesi girilmiş mevcut kayıtlarda `departmentId` boş kalır (bu kayıtlar
  Departman filtresi uygulanınca listelenmez, ama filtre uygulanmadığı sürece normal
  görünmeye devam eder — veri kaybı yok).
- Kontrol Detayı (`Modal`) ve Sil onayı (`ConfirmDialog`) aynı paylaşımlı `Modal`
  bileşenini (z-50, ortada) kullanıyor; ikisi aynı anda açıldığında (detaydan "Sil"e
  basınca) DOM sırasına göre üstte doğru şekilde görünüyor — ancak bu, iki modalın
  aynı anda ekranda olduğu, alışılmadık bir durum. Görsel olarak test edilemedi
  (bu ortamda tarayıcı yok), yalnızca statik olarak doğrulandı.
- Takvim'deki "Bu Hafta" görünümü haftayı Pazartesi'den başlatıyor (Ay görünümüyle
  tutarlı) — bazı kullanıcılar Pazar başlangıcı bekleyebilir; bu bir tasarım kararı,
  hata değil.

### Sonraki Öneriler

1. `computePeriodicCheckStats()`'i Employer Dashboard'daki mevcut
   `PeriodicCheckOverviewPanel`/`UpcomingChecksCard` ile birleştirip tek bir veri
   kaynağına indirmek (şu an ikisi ayrı ayrı `periodicChecks` diziliyor — küçük kod
   tekrarı, acil değil).
2. Departman filtresi eklenen diğer modüllerde (Fine-Kinney) olduğu gibi, periyodik
   kontrollere de Şube (branch) filtresi eklemek istenirse aynı `useCompanyOrgLists()`
   hook'u zaten hazır (`branches` de dönüyor, yalnızca UI eklemek yeterli).
3. Gerçek tarayıcıda Kontrol Detayı + Sil onayı modal stacking'inin görsel doğrulaması.

### Documentation Check

| Dosya | Güncellendi mi? | Gerekçe |
|---|---|---|
| README.md | ❌ | Modül adı/üst seviye açıklama değişmedi (mevcut modül geliştirildi) |
| CHANGELOG.md | ✅ | Kullanıcıya görünen yeni kartlar/filtreler/detay ekranı/takvim modları |
| ROADMAP.md | ❌ | Faz durumları değişmedi (Phase 1 kapsamında) |
| SPRINTS.md | ✅ | Yeni sprint satırı + Phase 1 sayaç güncellemesi |
| ARCHITECTURE.md | ❌ | Mimari desen değişmedi (aynı hook/servis/component katmanlaması) |
| DATABASE_PLAN.md | ❌ | `PeriodicCheck`'e yalnızca opsiyonel bir alan eklendi, şema kırılmadı |

---

## Sprint 7.4 — Karar Destek Dashboard & Deneyim Rafine

**İsimlendirme notu:** İstenen sprint adı "Sprint 7.2.2" idi, ancak bu isim
`SPRINTS.md`'de zaten tamamlanmış Periyodik Kontrol genişletmesine ait; "7.3" de
Bilgi Kütüphanesi AI Asistanı'na ait olduğundan sıradaki boş numara **7.4**
kullanıldı.

### Yapılan Geliştirmeler

- **Education modülü incelemesi:** İstenen tüm maddeler (video ilerleme durumu,
  kaldığı yerden devam, ileri sarma engeli, eğitim tamamlanmadan sınav
  açılmaması, katılımcı ilerleme durumu) Sprint 7.2/7.2.1'de zaten
  tamamlanmıştı — bu sprintte modülün kendisine dokunulmadı, gereksiz yeniden
  yazım yapılmadı. Tek gerçek eksik, o sprintte hazırlanan `trainingStats`'ın
  hiçbir widget tarafından tüketilmemesiydi.
- **Devam Eden Eğitimler kartı (Dashboard)** — `getOngoingTrainingItems()`
  (yeni, `trainingStatus.js`) + `OngoingTrainingsCard.jsx` (yeni). Eski statik
  "Eğitimler" widget'ının (yalnızca modül başlıklarını "Zorunlu Eğitim"
  etiketiyle listeleyen) yerini gerçek Atandı/Devam Ediyor/Tamamlandı sayıları
  ve en çok 5 "devam eden" katılımcı satırı aldı.
- **Yaklaşan Periyodik Kontroller kartı** — `UpcomingChecksCard.jsx` (yeni).
  Mevcut `PeriodicCheckOverviewPanel` (makro sayaç) korunuyor; bu yeni kart
  onu tamamlayan bir detay listesi (en yakın 5 kontrol, kalem adı + kategori +
  tarih + durum rozeti).
- **Son 30 Gün Değişim kartı** — `utils/dashboardTrends.js` (yeni) →
  `computeLast30DayChange()`: Yeni Risk, Kapatılan Risk, Tamamlanan Eğitim,
  Yapılan Periyodik Kontrol için gerçek son-30-gün/önceki-30-gün karşılaştırması.
  `TrendsPanel.jsx`'teki açıkça "temsili" işaretli seyirden farklı olarak,
  burada yalnızca gerçek zaman damgalı kayıtlar sayılıyor; veri azsa delta 0
  çıkıyor (uydurma sayı yok). `fineKinney.date` alanı ISO olmadığından
  (`DD.MM.YYYY`) mevcut `toComparableDate` yardımcı fonksiyonuyla
  karşılaştırılıyor.
- **Widget kayıt sistemi** — `useWidgetVisibility.js`'e `last30DayChange` ve
  `upcomingChecksList` eklendi; mevcut aç/kapa tercihleri (`localStorage`)
  bozulmadı (yeni id'ler eski kullanıcılarda da varsayılan görünür gelir).
- **Dokümanlara derin bağlantı** — `DocumentsPage.jsx` artık `?tab=` sorgu
  parametresini okuyor; yeni kartlardaki "Tümünü Gör" linkleri doğrudan ilgili
  sekmeye açılıyor.
- **Loading/Error** — `EmployerDashboard.jsx`'teki sessiz `return null`
  (yükleme sırasında boş beyaz ekran riski) mevcut `Loading` bileşenine
  çevrildi. `useEmployerDashboardData.js`'teki veri çekme `try/catch` ile
  sarmalandı; hata durumunda mevcut `ErrorState` + "Yeniden Dene" gösteriliyor
  (önceden hiç ele alınmıyordu).
- **Mobil dokunma alanı** — görsel boyut değiştirilmeden (negatif margin +
  padding tekniği) dokunma alanı büyütüldü: Çalışanlar/Şubeler bölümlerindeki
  "Düzenle"/"Sil" linkleri, Departmanlar'daki dairesel silme ikonu (20px→28px),
  ve uygulama genelinde 6 farklı modal/drawer kapatma butonu — bunlardan biri
  paylaşılan `Modal.jsx` olduğu için düzeltme tüm modallara otomatik yansıyor.

### Etkilenen Modüller

- **Yeni:** `utils/dashboardTrends.js`,
  `features/dashboard/employer/Last30DaysChangeCard.jsx`,
  `features/dashboard/employer/UpcomingChecksCard.jsx`,
  `features/dashboard/employer/OngoingTrainingsCard.jsx`.
- **Küçük ek:** `constants/trainingStatus.js` (+`getOngoingTrainingItems`),
  `icons/index.jsx` (+3 ikon: ArrowUp, ArrowDown, Minus).
- **Değişen:** `useEmployerDashboardData.js` (error state + yeni türetilmiş
  alanlar), `EmployerOverviewTab.jsx` (yeni kartlar entegre, statik eğitim
  listesi kaldırıldı — artık `EDUCATION_MODULES` importu kullanılmıyor),
  `EmployerDashboard.jsx` (Loading/ErrorState), `useWidgetVisibility.js`
  (+2 widget id), `DocumentsPage.jsx` (`?tab=` desteği), `EmployeesSection.jsx`,
  `BranchesSection.jsx`, `DepartmentsSection.jsx`, `Modal.jsx`,
  `FineKinneyDetailDrawer.jsx`, `DocumentDetailDrawer.jsx`,
  `KnowledgeAIAssistant.jsx`, `CoursePlayer.jsx`, `Sidebar.jsx` (yalnızca
  dokunma alanı — görsel/işlevsel davranış değişmedi).
- **Dokunulmayan:** `NoSkipVideoPlayer.jsx`, `CourseQuiz.jsx`,
  `ParticipantListPanel.jsx`, `TrainingModule.jsx` — Education modülünün
  kendisi zaten tamdı, riske atılmadı.

### Bilinen Riskler

- "Son 30 Gün Değişim" kartı, uygulama yeni kullanılmaya başlandığında (az
  veri) çoğu satırda 0 gösterecektir — bu bir hata değil, gerçek veri
  yansımasıdır, ancak ilk izlenim "kart boş/çalışmıyor" gibi algılanabilir.
  Önerilen çözüm: veri hiç yoksa küçük bir "Henüz karşılaştırılacak yeterli
  geçmiş veri yok" notu eklemek (bu sprintte kapsam dışı bırakıldı).
- ErrorState/Loading iyileştirmesi yalnızca İşveren Dashboard'una uygulandı;
  Uzman/Çalışan dashboard'ları ve diğer sayfalardaki (varsa) benzer sessiz
  yükleme örüntüleri bu sprintte taranmadı — ayrı bir tarama önerilir.
- `PeriodicCheckOverviewPanel` (makro) ve yeni `UpcomingChecksCard` (detay)
  aynı `periodicChecks` verisini ayrı ayrı filtreliyor; ileride tek bir ortak
  seçici (selector) fonksiyonuna çıkarılabilir (şu an kod tekrarı küçük, acil
  değil).

### Sonraki Öneriler

1. Uzman ve Çalışan dashboard'larına da (varsa uygun olan) benzer
   Loading/ErrorState taraması yapmak.
2. "Son 30 Gün Değişim" için veri-yok durumunda açıklayıcı bir empty-state notu.
3. Mobil dokunma alanı taramasını Dokümanlar/Bilgi Kütüphanesi/Risk Analizi
   detay sekmelerine de genişletmek — bu sprintte yalnızca Şirket Yönetimi ve
   paylaşılan modal/drawer bileşenleri kapsandı.

### Documentation Check

| Dosya | Güncellendi mi? | Gerekçe |
|---|---|---|
| README.md | ❌ | Yeni modül/özellik adı değişmedi, mevcut Dashboard/Education modülleri geliştirildi — üst seviye açıklama hâlâ doğru |
| CHANGELOG.md | ✅ | Kullanıcıya görünen yeni kartlar + loading/error/mobil iyileştirmeleri |
| ROADMAP.md | ❌ | Faz durumları değişmedi (Phase 1 kapsamında bir geliştirme) |
| SPRINTS.md | ✅ | Yeni sprint satırı + Phase 1 sayaç güncellemesi |
| ARCHITECTURE.md | ❌ | Mimari desen değişmedi (aynı dataProvider/hook/widget yapısı kullanıldı) |
| DATABASE_PLAN.md | ❌ | Yeni kalıcı veri/alan eklenmedi — yalnızca mevcut veriden türetilen hesaplamalar |

---

## Bilgi Kütüphanesi — AI Asistanı

### Yapılan Geliştirmeler

- **"AI'ya Sor" (RAG-lite)** — kullanıcı soru sorunca önce yerel anahtar kelime
  eşleştirmesiyle (`findRelevantDocuments`) en ilgili 1-3 doküman bulunuyor,
  içerikleri AI'ye bağlam olarak veriliyor, cevap **her zaman** kaynak
  doküman(lar)la birlikte gösteriliyor. İlgili doküman bulunamazsa AI hiç
  çağrılmıyor — tahmin yürütülmüyor.
- **Favoriler** — doküman kartı ve detay ekranında yıldız butonu, "Yalnızca
  Favoriler" hızlı filtresi. Yeni backend/IndexedDB store gerekmedi
  (`useLocalStorage`, mevcut tema/widget-görünürlüğü deseniyle aynı).
- **İlgili Dokümanlar** — detay ekranında, aynı kategori/etiketi paylaşan
  dokümanlar öneriliyor (`findRelatedDocuments`).
- **Dürüstlük notu:** Hem kodda hem dokümantasyonda defalarca vurgulandı —
  bu **gerçek bir vektör/embedding tabanlı RAG değildir**, basit anahtar
  kelime eşleştirmesidir. Bunu "tam RAG" gibi sunmak yanıltıcı olurdu.

### Etkilenen Modüller

- **Yeni:** `useKnowledgeAI.js`, `useKnowledgeFavorites.js`,
  `KnowledgeAIAssistant.jsx`.
- **Küçük ek:** `constants/systemPrompt.js` (+`KNOWLEDGE_AI_PROMPT`, ana
  `SYSTEM_PROMPT`'tan bağımsız), `constants/knowledgeCenter.js`
  (+`findRelevantDocuments`, +`findRelatedDocuments`), `icons/index.jsx`
  (+2 ikon: Sparkles, Star).
- **Değişen:** `DocumentCard.jsx` (favori butonu — kök eleman `<button>`'dan
  `<div role="button">`'a değişti, çünkü içine iç içe bir `<button>`
  eklenemezdi), `DocumentDetailDrawer.jsx` (favori + İlgili Dokümanlar),
  `KnowledgeCenterPage.jsx` (hepsini bağlama).
- **Dokunulmayan:** `CategoryCard.jsx`, `DocumentFilters.jsx` — mevcut arama/
  kategori/tür filtreleme mantığına hiç dokunulmadı.

### Bilinen Riskler

- Anahtar kelime eşleştirmesi, eş anlamlı kelimeleri veya farklı yazımları
  anlamıyor (örn. "KKD" ile "koruyucu ekipman" aynı doküman kümesini
  bulmayabilir) — gerçek semantik/vektör arama olmadan bu sınırlı kalacak.
- Favoriler yalnızca **tarayıcı yerelinde** (localStorage) tutuluyor —
  cihaz değişince veya tarayıcı verisi temizlenince kaybolur. Gerçek
  backend'e geçişte (Phase 7) kullanıcı hesabına taşınmalı.
- AI'nin cevap kalitesi, dokümanların `content` alanındaki metnin
  ayrıntısına bağlı — bazı mock dokümanların `content`'i kısa, bu da bazı
  sorularda yüzeysel cevaba yol açabilir (mock veri sınırı, kod sınırı değil).

### Sonraki Öneriler

1. `findRelevantDocuments`'in eşik değerini (şu an skor > 0 olan her şey
   dahil) gözden geçirmek — çok genel sorularda alakasız doküman
   getirebilir.
2. AI Chat'teki (`ChatPanel.jsx`) genel sohbete de, isteğe bağlı olarak
   Bilgi Kütüphanesi'nden bağlam çekme seçeneği eklemek — bugün bu yalnızca
   Bilgi Kütüphanesi sayfasında izole.
3. Gerçek vektör tabanlı RAG'e geçiş kararı (Phase 7 ile birlikte
   değerlendirilmeli, bkz. AI_ROADMAP.md).

### Documentation Check

| Dosya | Güncellendi mi? | Gerekçe |
|---|---|---|
| README.md | ✅ | Yeni AI özelliği + Yol Haritası tablosundaki Phase 5 durumu artık yanlıştı |
| CHANGELOG.md | ✅ | Kullanıcıya görünen yeni özellikler |
| ROADMAP.md | ✅ | Phase 5 durumu "Planlandı" iken artık gerçekten kısmen yapılmıştı — güncellenmemesi yanlış bilgi olurdu |
| SPRINTS.md | ✅ | Yeni sprint + Phase 5 ilerleme sayacı |
| ARCHITECTURE.md | ✅ | AI Modülü bölümü "iki özellik çalışır" diyordu, artık üç |
| DATABASE_PLAN.md | ❌ | Yeni kalıcı veri yok (favoriler localStorage, dokümanlar zaten mock sabit) |

---

## Sprint 7.2.2 — Periyodik Kontrol Modülü (genişletme)

### Yapılan Geliştirmeler

- **Filtreleme** — arama + durum + kategori (`PeriodicCheckFilters.jsx`),
  Fine-Kinney'deki filtre desenine birebir uyumlu.
- **Takvim görünümü** — yeni bir bağımlılık eklemeden saf ay ızgarası
  (`PeriodicCheckCalendar.jsx`), liste görünümüyle aynı veriyi/filtreleri
  paylaşıyor.
- **Dashboard kartları** — "Periyodik Kontrol Özeti" widget'ı (durum bazlı
  sayaç şeridi).
- **Kontrol listesi / Yeni kayıt** — zaten vardı, **korundu, sıfırdan
  yazılmadı.**
- **Geciken kontroller** — hem üstteki özet rozetinde (zaten vardı, filtreden
  bağımsız hale getirildi) hem yeni "Süresi Geçti" hızlı filtresinde.
- **Kesin olması gereken yaratıcı ek — tek tıkla "Bugün Kontrol Edildi":**
  önceden bu işlem için formu açıp tarihi elle güncellemek gerekiyordu; bu,
  modülün en sık yapılan işlemi için gereksiz sürtünmeydi. Artık geciken/
  yaklaşan her kartta tek buton.

### Etkilenen Modüller

- **Yeni:** `PeriodicCheckFilters.jsx`, `PeriodicCheckCalendar.jsx`,
  `PeriodicCheckOverviewPanel.jsx` (dashboard).
- **Küçük ek:** `usePeriodicChecks.js` (filtre state + `markCheckedToday` —
  **mevcut `checks`/`saveCheck`/`removeCheck` sözleşmesi değişmedi**),
  `PeriodicCheckCard.jsx` (1 buton), `icons/index.jsx` (+2 ikon: Calendar,
  ChevronLeft), `dateUtils.js` (+1 yardımcı: `todayISO`), `useWidgetVisibility.js`
  ve `EmployerOverviewTab.jsx` (yeni widget kaydı).
- **Dokunulmayan (bilinçli):** `PeriodicCheckForm.jsx`,
  `constants/periodicCheck.js`, `services/periodicCheckService.js` — hiçbiri
  sıfırdan yazılmadı veya gereksiz yere refactor edilmedi.

### Bilinen Riskler

- Takvim görünümü, ayda çok sayıda (10+) kontrol aynı güne denk gelirse hücre
  içinde yalnızca bir sayı gösteriyor, tek tek isim göstermiyor (tıklayınca alt
  listede görünüyor) — büyük hacimli firmalarda bu yeterli olmayabilir.
- `markCheckedToday`, mevcut `saveCheck` fonksiyonunu `lastCheckDate: bugün`
  ile yeniden çağırıyor — bu, formu elle doldurmakla birebir aynı sonucu
  üretir ama kendi ayrı bir "kontrol geçmişi" kaydı tutmuyor (yalnızca son
  kontrol tarihi güncellenir, önceki tarih üzerine yazılır). İleride kontrol
  geçmişi (Risk Geçmişi'ne benzer bir timeline) istenirse bu ayrıca ele
  alınmalı.
- Yeni Dashboard widget'ı yalnızca durum sayısı gösteriyor; kategori kırılımı
  (örn. "en çok geciken kategori hangisi") eklenmedi — kapsam dışı bırakıldı.

### Sonraki Öneriler

1. Takvim görünümüne haftalık görünüm seçeneği eklemek (yoğun aylarda daha
   kullanışlı olabilir).
2. `markCheckedToday` için ayrı bir "kontrol geçmişi" kaydı (kim, ne zaman
   kontrol etti) — denetim/uyumluluk kanıtı olarak değerli olabilir.
3. Dashboard widget'ına kategori bazlı kırılım eklemek (Departman Bazlı Risk
   Dağılımı ile aynı görsel dille).

### Documentation Check

| Dosya | Güncellendi mi? | Gerekçe |
|---|---|---|
| README.md | ✅ | Periyodik Kontrol maddesi artık eksikti (filtre/takvim/hızlı aksiyon yoktu) |
| CHANGELOG.md | ✅ | Kullanıcıya görünen davranış değişikliği var |
| ROADMAP.md | ❌ | Zaten Phase 1 kapsamında ("periyodik kontrol takvimi"), faz değişmedi |
| SPRINTS.md | ✅ | Yeni bir sprint tamamlandı |
| ARCHITECTURE.md | ❌ | Yeni bir mimari desen yok — mevcut filtre/dashboard-widget desenleri aynen izlendi |
| DATABASE_PLAN.md | ❌ | Yeni store/alan eklenmedi, mevcut `PeriodicCheck` şeması değişmedi |

---

## Sprint 7.2.1 — Education Module (genişletme)

### Yapılan Geliştirmeler

- **Video ilerleme yüzdesi** — oynatıcı üzerinde canlı gösterge (zaten kısmen
  vardı, şimdi ayrıca kalıcı hale getirildi).
- **Kaldığı yerden devam et** — yeni `trainingProgress` koleksiyonu; video
  yeniden açıldığında son izlenen noktadan başlıyor, ileri sarma engeli bu
  noktayı yanlışlıkla "sarma" saymıyor.
- **İleri sarma engeli** ve **video bitmeden sınav açılmaması** — korundu
  (Sprint 7.2'de zaten vardı, sıfırdan yazılmadı).
- **Sınav sonucunu gösterme** — korundu (Sprint 7.2'de zaten vardı).
- **4 durumlu eğitim modeli** (Atandı/Devam Ediyor/Tamamlandı/Kaldı) —
  `resolveTrainingStatus`, Sprint 7.1'in `resolveEntryWorkflowState`'iyle
  birebir aynı desen.
- **Katılımcı listesine ilerleme + sınav puanı** — artık yalnızca sınavı
  bitirenler değil, izlemekte olanlar (Devam Ediyor) da listede, ilerleme
  yüzdesiyle birlikte.
- **Dashboard eğitim istatistikleri** — `computeTrainingStats` hazırlandı VE
  bir adım ileri gidilerek dashboard'daki **sahte %72 mock değeri gerçek
  veriyle değiştirildi** (Güvenlik Skoru hesaplamasını da düzeltti).

### Etkilenen Modüller

- **Yeni:** `src/constants/trainingStatus.js` (tek dosya, riskWorkflow.js
  deseniyle).
- **Küçük ek:** `db.js` (+1 store, versiyon 8→9), `types/index.js`
  (`TrainingProgress` typedef), `trainingService.js` (+2 fonksiyon),
  `useTrainingCompletions.js` (+`progress`/`recordProgress`, **mevcut
  `completions`/`recordCompletion` sözleşmesi değişmedi**).
- **Değişen (davranış eklendi, yeniden yazılmadı):** `NoSkipVideoPlayer.jsx`
  (resume + onProgress), `CoursePlayer.jsx` (myProgress prop), `CourseCard.jsx`
  (4 durum + ilerleme çubuğu), `ParticipantListPanel.jsx` (progress birleşimi),
  `TrainingModule.jsx` (yeni prop'ları alt bileşenlere iletme),
  `useEmployerDashboardData.js` (+2 fetch, mock → gerçek).
- **Dokunulmayan:** `CourseQuiz.jsx` (sınav mantığı zaten doğruydu, hiç
  değişmedi) — sıfırdan yazma yasağına en net uyulan dosya.

### Bilinen Riskler

- İleri sarma engeli hâlâ yalnızca tarayıcı `<video>` olaylarına dayanıyor —
  DevTools'tan `currentTime` doğrudan değiştirilirse aşılabilir (Sprint
  7.2'den beri bilinen, değişmeyen bir sınır).
- `trainingCompletionRate` KPI'ı artık gerçek ama **çok az veri noktasına**
  dayanıyor (demo modelinde en fazla 3 farklı `employeeName` üretilebilir —
  `MOCK_USERS`'taki 3 rol). Gerçek çok-kullanıcılı veri gelene kadar bu KPI
  oynak kalabilir.
- `trainingStats` hesaplandı ama **hiçbir widget henüz tüketmiyor** — "hazırla"
  talimatı harfiyen uygulandı, dashboard'a yeni bir widget eklenmedi (kapsam
  dışı bırakıldı, "büyük component oluşturma" kuralına uyum).

### Sonraki Öneriler

1. `trainingStats`'i tüketecek bir Dashboard widget'ı (örn. "Eğitim Durumu"
   pasta/çubuk grafiği) — altyapı hazır, yalnızca UI eklenmesi kaldı.
2. Sprint 7.1 raporundaki açık soru hâlâ geçerli: Eğitim Modülü'nün
   ROADMAP.md'nin 8 fazından hangisine ait olduğu netleşmedi.
3. `employeeName` yerine gerçek bir `employeeId` kullanımına geçiş (Phase 7 —
   Enterprise ile birlikte) — bugünkü isim-bazlı eşleştirme, iki farklı
   çalışanın aynı adı taşıması durumunda kayıtları birbirine karıştırabilir.

### Documentation Check

| Dosya | Güncellendi mi? | Gerekçe |
|---|---|---|
| README.md | ✅ | "Kaldığı yerden devam et" ve 4 durum, kullanıcıya görünen yeni davranış |
| CHANGELOG.md | ✅ | Kullanıcıya görünen davranış + mock→gerçek veri değişikliği |
| ROADMAP.md | ❌ | Sprint 7.2'den beri açık olan faz sorusu bu sprintte çözülmedi |
| SPRINTS.md | ✅ | Yeni sprint + geriye dönük numaralandırma tutarlılığı (Eğitim Modülü → Sprint 7.2) düzeltildi |
| ARCHITECTURE.md | ❌ | Yeni bir mimari desen yok — mevcut desenler (riskWorkflow.js benzeri, hook sözleşmesi koruma) aynen izlendi |
| DATABASE_PLAN.md | ✅ | `Trainings` bölümü yeni `trainingProgress` koleksiyonundan bahsetmiyordu |

---

## Sprint 7.2 — Eğitim Modülü

### Yapılan Geliştirmeler

- Uçtan uca uzaktan eğitim akışı: video izleme (ileri sarma engelli) → video
  sonu sınav → otomatik puanlama → tamamlama kaydı.
- 5 kurs, her biri 3 soruluk gerçek bir sınavla (`constants/trainingCourses.js`)
  — önceki statik `EDUCATION_MODULES` başlık listesinin yerini aldı.
- Katılımcı listesi — yalnızca İSG uzmanı ve işverene açık, çalışanlar yalnızca
  kendi sonucunu görür.
- Yeni kalıcı koleksiyon: `trainingCompletions` (IndexedDB, `DB_VERSION` 7→8).
- **Bilinçli olarak yapılmayan:** AI ile video üretimi ve sertifika/PDF üretimi.
  İkisi de kullanıcının kendi talimatıyla kapsam dışı bırakıldı — video için
  telifsiz bir yer tutucu (`Big Buck Bunny`) kullanıldı, tamamlama kaydının
  kendisi "belge" yerine geçti.

### Etkilenen Modüller

- **Yeni:** `src/features/training/` (7 dosya: `TrainingModule`, `CoursePlayer`,
  `NoSkipVideoPlayer`, `CourseQuiz`, `CourseCard`, `ParticipantListPanel`,
  `useTrainingCompletions`), `src/services/trainingService.js`,
  `src/constants/trainingCourses.js`.
- **Küçük ek:** `db.js` (yeni store + versiyon), `types/index.js`
  (`TrainingCompletion` typedef), `constants/education.js` (tek kaynağa
  yönlendirme — 3 mevcut tüketici hiç değişmeden çalışmaya devam ediyor).
- **Değişen:** `DocumentsPage.jsx`'teki statik "Eğitim Modülleri" sekmesi artık
  gerçek modülü render ediyor.
- **Dokunulmayan:** Dashboard'daki Eğitim widget'ı ve Çalışan panosundaki mini
  liste — `EDUCATION_MODULES` değişmeden aynı başlıkları göstermeye devam
  ediyor.

### Bilinen Riskler

- Katılımcı adı, gerçek kimlik doğrulama olmadığı için mevcut demo modelindeki
  `MOCK_USERS[role].name` üzerinden geliyor — yani "kim tamamladı" bilgisi rol
  değiştiriciye bağlı, gerçek çok kullanıcılı bir ortamda değil. Gerçek auth
  (Phase 7) gelene kadar bu böyle kalacak, mimarinin bilinen bir sınırı.
  Bu vesileyle fark edildi: `CURRENT_EMPLOYEE_NAME = "Ahmet Yıldız"` gibi
  hardcoded string'ler zaten `MOCK_USERS.employee.name`'in birebir kopyasıydı
  (2 ayrı dosyada) — yeni kodda bu tekrar edilmedi, `MOCK_USERS` doğrudan
  kullanıldı, ama önceki 2 kullanım **düzeltilmedi** (kapsam dışı).
- İleri sarma engeli tarayıcı `<video>` olaylarına dayanıyor — kullanıcı
  DevTools'tan `video.currentTime`'ı doğrudan değiştirirse engel aşılabilir.
  Bu bir "gerçek güvenlik" önlemi değil, sıradan kullanıcı için bir kolaylaştırıcı
  caydırıcıdır — ciddi bir uyumluluk kanıtı gerekiyorsa yeterli değildir.
- Sınavda başarısız olan kullanıcı videoyu yeniden izlemeden direkt tekrar
  sınava girebiliyor (zaten bir kez tam izlediği için). Bu bilinçli bir tercih
  ama "her denemede video yeniden izlensin" isteniyorsa değişmeli.

### Sonraki Öneriler

1. **ROADMAP.md ile ilgili açık soru:** Eğitim Modülü, mevcut 8 fazın
   (Core Platform...Mobile Platform) hiçbirine temiz şekilde oturmuyor —
   bu rapor Phase 1'e (Core Platform) gevşek bağladı ama bu bir varsayımdır.
   Kullanıcıyla netleştirilmeli: ayrı bir faz mı olmalı, yoksa mevcut bir
   fazın kapsamına mı eklenmeli?
2. Departman/şube bazlı zorunlu eğitim ataması (şu an herkese aynı 5 kurs
   gösteriliyor, role/departmana göre farklılaşmıyor).
3. Gerçek video/AI üretim kararı netleşince, bu modülün veri şekli
   (`videoUrl`, `quiz`) hiç değişmeden gerçek içerikle doldurulabilir —
   bu sprintin en önemli tasarım kazanımı budur.

### Documentation Check

| Dosya | Güncellendi mi? | Gerekçe |
|---|---|---|
| README.md | ✅ | Yeni, kullanıcıya görünen bir özellik eklendi |
| CHANGELOG.md | ✅ | Kullanıcıya görünen davranış değişikliği var |
| ROADMAP.md | ❌ | Bilerek dokunulmadı — bkz. Sonraki Öneriler #1, kullanıcı onayı olmadan faz yapısı değiştirilmedi |
| SPRINTS.md | ✅ | Yeni bir sprint tamamlandı |
| ARCHITECTURE.md | ✅ | Klasör yapısı listesi eksikti (`training` yoktu) |
| DATABASE_PLAN.md | ✅ | `Trainings` tablosu açıklaması artık yanlıştı ("bugün karşılığı yok" diyordu, artık var) |

---

## Dashboard Genişletmesi

### Yapılan Geliştirmeler

- **Kazasız Gün Sayacı** — bildirim akışındaki gerçek "İş Kazası" (`type: "kaza"`)
  kayıtlarından hesaplanan, hem İşveren hem Çalışan dashboard'unda gösterilen
  paylaşılan `StreakCounterCard`. Hiç kaza kaydı yoksa sahte bir gün sayısı
  UYDURULMADI — "henüz kayıt yok" durumu açıkça gösteriliyor.
- **Risk Workflow** widget'ı — Sprint 7.1'de eklenen ama hiçbir ekranda
  gösterilmeyen `workflowState` verisini ilk kez görselleştiriyor (6 aşamalı
  sayaç şeridi).
- **Departman Bazlı Risk Dağılımı** — Sprint 5A'da risklere eklenen
  `departmentId`'yi ilk kez özetleyen bar-liste.
- **Dikkat Gerektirenler** widget'ı — Risk Detay Sayfası'ndaki alt-faaliyet
  termin tarihlerini ve yaklaşan/geciken periyodik kontrolleri tek, aciliyet
  sıralı listede birleştiriyor (ikisi de bugüne kadar dashboard'da yalnızca
  toplam SAYI olarak görünüyordu, tek tek listelenmiyordu).
- Dashboard için "Yakında" etiketli PDF/Excel dışa aktarım butonları eklendi
  (`FineKinneyExportButtons` ile birebir aynı desen — bilinçli olarak henüz
  ortak bileşene çıkarılmadı, bkz. Bilinen Riskler).
- **Yan bulgu/düzeltme:** `EmployerOverviewTab.jsx`'te "Düzeltici Faaliyetler"
  widget'ının `ListChecks` ikonu import edilmemişti; render sırasında hataya yol
  açabilecek bu mevcut hata düzeltildi.

**Kapsam dışı bırakılan 2 fikir (bilinçli, gerekçeli):**
- *"Haftalık özet"* zaten `ExecutiveSummaryCard`/`computeWeeklySummary` olarak
  mevcuttu — tekrar yapılmadı.
- *"Çalışan dashboard zenginleştirme"* zaten "Bildirimlerim" listesi olarak
  mevcuttu — yalnızca Kazasız Gün Sayacı eklendi, geri kalanı olduğu gibi
  bırakıldı.
- *"Mobilde bilgi yoğunluğu"* ayrı bir yeni widget olarak değil, yeni panellerin
  (Risk Workflow şeridi) `overflow-x-auto` ile mobil-öncelikli tasarlanması
  şeklinde uygulandı — mevcut KPI grid'iyle bilgiyi tekrar etmemek için.

### Etkilenen Modüller

- **Yeni:** `src/utils/accidentFreeStreak.js`, `src/utils/attentionItems.js`,
  `src/features/dashboard/StreakCounterCard.jsx` (paylaşılan),
  `src/features/dashboard/employer/{WorkflowPipelinePanel,
  DepartmentRiskBreakdown, AttentionNeededPanel, DashboardExportButtons}.jsx`.
- **Küçük ek:** `useEmployerDashboardData.js` (`notifications` ve
  `accidentFreeStreak` return'e eklendi), `useWidgetVisibility.js` (4 yeni
  widget kaydı), `EmployerOverviewTab.jsx` (yeni widget'lar + import düzeltmesi),
  `EmployeeDashboard.jsx` (StreakCounterCard eklendi).
- **Dokunulmayan:** `ExpertDashboard.jsx`, `DashboardPage.jsx`,
  `SafetyScoreCard.jsx`, `TrendsPanel.jsx`, `CorrectiveActionsPanel.jsx`,
  `PerformancePanel.jsx` — hiçbiri değiştirilmedi.

### Bilinen Riskler

- `DashboardExportButtons.jsx`, `FineKinneyExportButtons.jsx` ile **birebir aynı
  kod**. Bilinçli olarak ortak bileşene çıkarılmadı (2. kullanım, "3. kullanımda
  soyutla" ilkesi) — üçüncü bir yerde aynı desen istenirse bu tekrar gözden
  geçirilmeli.
- Kazasız Gün Sayacı, **onay durumundan bağımsız tüm** "kaza" bildirimlerini
  sayıyor (yalnızca onaylanmışları değil). Bu bilinçli bir tercih (güvenlik
  metriğinde eksik saymak, yanlış alarmdan daha kötüdür) ama bir kullanıcı
  "neden onaylanmamış bir kaza bildirimi sayaca yansıdı" diye sorabilir —
  gerekirse bu davranış netleştirilmeli.
- "Dikkat Gerektirenler" ve "Düzeltici Faaliyetler" (mevcut) panelleri artık
  aynı ekranda, farklı granülerlikte (alt-faaliyet vs risk-bazlı) benzer veriyi
  gösteriyor. Kullanıcı testinde kafa karıştırıcı bulunursa birleştirilmeli.

### Sonraki Öneriler

1. Departman kırılımına şube (branch) boyutunu da ekleyip aralarında geçiş
   yapılabilen bir toggle eklemek (şimdilik yalnızca departman var).
2. "Dikkat Gerektirenler" widget'ından doğrudan ilgili Risk Detay Sayfası'na
   tıklanabilir geçiş eklemek (şu an salt-okunur liste).
3. Risk Workflow widget'ını tıklanabilir yapıp bir filtre olarak kullanmak
   (örn. "İncelemede" kutusuna tıklayınca Risk Analizi sayfası o filtreyle
   açılsın).

### Documentation Check

| Dosya | Güncellendi mi? | Gerekçe |
|---|---|---|
| README.md | ✅ | "Temel Özellikler" listesindeki Dashboard maddesi artık eksikti |
| CHANGELOG.md | ✅ | Kullanıcıya görünen 4 yeni widget eklendi |
| ROADMAP.md | ❌ | Faz kapsamı değişmedi, Phase 2 içinde zaten örtük |
| SPRINTS.md | ✅ | Yeni bir sprint tamamlandı |
| ARCHITECTURE.md | ❌ | "Dashboard Mimarisi" bölümündeki desen (merkezi hook + dumb alt bileşenler) aynen izlendi, tarif değişmedi |
| DATABASE_PLAN.md | ❌ | Yeni bir kalıcı veri alanı/tablo eklenmedi, yalnızca mevcut veriden hesaplama |

---

## Sprint 7.1 — Risk Workflow Foundation

### Yapılan Geliştirmeler

- Risk yaşam döngüsü için esnek bir workflow veri modeli tasarlandı: 6 durum
  (Taslak, Açık, İncelemede, Aksiyon Bekliyor, Tamamlandı, Kapatıldı) ve
  aralarındaki izin verilen geçişler (`RISK_WORKFLOW_TRANSITIONS`).
- Bugünkü basit `status` alanı (`open`/`in_progress`/`done`) yeni modele
  geriye dönük uyumlu şekilde eşlendi (`mapLegacyStatusToWorkflowState`) —
  hiçbir eski kayıt migrasyon gerektirmiyor.
- Her yeni/güncellenen Fine-Kinney kaydına, legacy durumdan türetilen bir
  `workflowState` alanı otomatik olarak yazılmaya başlandı.
- `FineKinneyEntry` tip tanımına opsiyonel `workflowState` alanı eklendi.

### Etkilenen Modüller

- **Yeni:** `src/constants/riskWorkflow.js` (tek dosya, sıfır bağımlılık).
- **Küçük ek:** `src/features/risk-analysis/fineKinney/useFineKinneyEntries.js`
  (`saveEntry` içine 1 satır alan ekleme), `src/types/index.js` (1 satır JSDoc).
- **Dokunulmayan (bilinçli):** Hiçbir UI bileşeni (`FineKinneyForm`,
  `FineKinneyCard`, `FineKinneyFilters`, Risk Detay Sayfası sekmeleri) veya
  `constants/fineKinney.js`'teki mevcut `STATUS_OPTIONS` değiştirilmedi —
  kapsam gereği bu sprint yalnızca veri modeli/mimaridir.

### Bilinen Riskler

- `workflowState` yalnızca **kayıt anında** damgalanıyor; Sprint 7.1 öncesi
  oluşturulmuş eski kayıtlarda bu alan yok. `resolveEntryWorkflowState(entry)`
  bu durumu anlık hesaplayarak karşılıyor, ama bu iki okuma yolunun
  (damgalanmış alan / anlık hesaplama) gelecekte senkron kalması gerekiyor —
  workflow'u tüketen ilk gerçek UI eklendiğinde bu fonksiyon üzerinden
  okunmalı, `entry.workflowState`'e doğrudan erişilmemeli.
- Geçiş kuralları (`RISK_WORKFLOW_TRANSITIONS`) şu an **hiçbir yerde
  uygulanmıyor** (enforcement yok) — bu bilinçli bir tercih (Sprint 7.1
  kapsamı UI değil) ama ileride bir ekran bu tabloyu yok sayarsa modelin
  amacı boşa çıkar.
- `completed` → `awaitingAction` geri dönüş geçişi tanımlandı ama bu senaryo
  için henüz bir tetikleyici/iş kuralı yok; ileride netleştirilmeli.

### Sonraki Öneriler

1. Bu foundation'ı gerçekten kullanacak ilk ekranı tasarlarken (muhtemel
   Sprint 7.2), `STATUS_OPTIONS` dropdown'ının yeni 6 durumlu modele nasıl
   kademeli geçeceğine karar ver (bkz. Bilinen Riskler #1).
2. Geçiş kurallarını (`isValidWorkflowTransition`) gerçek bir UI'da
   uygulamaya koy — aksi halde tablo yalnızca dokümantasyon değerinde kalır.
3. Rol modeliyle (bkz. önceki sprint) ilişkilendir: hangi rol hangi geçişi
   yapabilir (örn. yalnızca uzman "İncelemede"ye alabilir) — bugün tanımlı
   değil, kasıtlı olarak bu sprintin kapsamı dışında bırakıldı.

### Documentation Check

[DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) → "Documentation Policy" listesi
tek tek değerlendirildi:

| Dosya | Güncellendi mi? | Gerekçe |
|---|---|---|
| README.md | ❌ | Kullanıcıya görünen hiçbir davranış değişmedi |
| CHANGELOG.md | ✅ | Yeni bir mimari eklendi, kayıt altına alınması gerekiyor |
| ROADMAP.md | ❌ | Bu çalışma bir fazın kapsamını değiştirmiyor, "Risk Intelligence" fazının içinde zaten örtük |
| SPRINTS.md | ✅ | Yeni bir sprint tamamlandı |
| ARCHITECTURE.md | ❌ | Katman/mimari desen değişmedi, yalnızca yeni bir domain sabiti eklendi |
| DATABASE_PLAN.md | ❌ | `Risks` tablosu planı zaten bir `durum` alanı öngörüyordu; bu ayrıntı düzeyi plan dokümanının kapsamı dışında |

---

# Geliştirme Raporu (Sprint 5A / Sprint 6 dönemi)

**Kapsam:** Sprint 5A (Risk Yönetimi v2), Sprint 6 (Bilgi Kütüphanesi) ve bu iki
sprint'in ardından oluşturulan `/docs` dokümantasyon seti.
**Bakış açısı:** Senior Software Architect + Product Manager değerlendirmesi.
**Yöntem:** Statik kod incelemesi ve programatik analiz (import doğrulama, satır/dosya
sayımı, desen arama). Gerçek `npm run build` bu ortamda çalıştırılamadı — bu rapor
canlı build çıktısına değil, kod okumasına dayanır.

---

## 1. Yapılan Geliştirmeler

**Sprint 5A — Risk Yönetimi (v2)**
- Fine-Kinney puanlama seçeneklerine (Olasılık/Maruziyet/Şiddet) referans açıklaması.
- Risk Detay Sayfası: Risk Bilgileri, Fine-Kinney, Düzeltici Faaliyetler, Ek
  Dosyalar, Risk Geçmişi, Notlar olmak üzere 6 sekmeli görünüm.
- Çoklu düzeltici faaliyet listesi (önceki tekil alanların yanına, geriye dönük
  uyumlu şekilde eklendi).
- Ek dosya (fotoğraf/PDF/Word/Excel) mock altyapısı.
- Risk geçmişi (timeline) — her create/update/kapatma/dosya/faaliyet/not işleminde
  otomatik olay kaydı.
- Departman, şube, durum, öncelik, tarih aralığı filtreleri.

**Sprint 6 — Bilgi Kütüphanesi**
- 8 kategorili, mock veriyle beslenen doküman kütüphanesi modülü.
- Arama kutusu, kategori ve doküman türü filtreleme.
- Doküman detay ekranı.

**Dokümantasyon**
- `/docs` altında 10 dosyalık kalıcı referans seti oluşturuldu/yenilendi:
  `README.md`, `PROJECT_CONTEXT.md`, `VISION.md`, `ROADMAP.md` (8 fazlı), `SPRINTS.md`,
  `CHANGELOG.md`, `ARCHITECTURE.md` (11 bölüm), `DATABASE_PLAN.md` (14 tablo),
  `AI_ROADMAP.md`, `DEVELOPMENT_RULES.md` (14 madde).
- Kök dizindeki `README.md` GitHub'da profesyonel görünecek şekilde yeniden yazıldı.

## 2. Etkilenen Modüller

**Yoğun değişen:**
- `src/features/risk-analysis/fineKinney/` — modülün en büyük ve en çok değişen
  parçası; bugün 21 dosyadan oluşuyor (proje genelinde tek bir feature'ın ulaştığı
  en yüksek dosya sayısı).
- `src/constants/fineKinney.js`, `src/services/riskService.js`,
  `src/utils/dateUtils.js`, `src/types/index.js` — Sprint 5A alanları için genişletildi.
- `src/components/icons/index.jsx` — 6 yeni ikon eklendi (34 ikon oldu).

**Yeni eklenen (izole):**
- `src/features/knowledge-center/` — 6 dosyalık tamamen yeni ve bağımsız modül.
- `src/constants/knowledgeCenter.js`.
- `src/pages/KnowledgeCenter.jsx`, `App.jsx` (1 route), `Sidebar.jsx` (1 nav girişi).

**Dokunulmayan (bilinçli olarak korunan):**
- `src/features/documents/`, `src/features/legislation/` — Bilgi Kütüphanesi ile
  kavramsal olarak örtüşmesine rağmen hiç değiştirilmedi.
- `src/features/dashboard/`, `src/features/chat/`, `src/features/company/`,
  kimlik doğrulama katmanı, `db.js` şeması (yeni object store eklenmedi).

## 3. Mimari Değerlendirme

**Güçlü yönler**
- `dataProvider` soyutlaması iki kez pratikte kanıtlandı: Risk Detay Sayfası'nın
  alt-sekme güncellemeleri (`patchFineKinneyEntry`), ana form kaydından
  (`saveFineKinneyEntry`) tamamen ayrı bir yoldan geçirildi — bu, ana akışı
  bozma riskini fiilen sıfırladı.
- Orkestratör + alt bileşen deseni iki sprint boyunca tutarlı uygulandı
  (`FineKinneyModule` → `detail/tabs/*`, `KnowledgeCenterPage` → `CategoryCard`/
  `DocumentCard`/`DocumentFilters`).
- Knowledge Center'ın **tamamen izole** kurulması ("mevcut sistemi bozma" ilkesinin
  somut kanıtı) — Documents/Legislation modüllerine sıfır dokunuşla yeni bir modül
  eklenebildiğini gösterdi.

**İleride sorun çıkarabilecek noktalar**
- **Rol modeli ikiliği.** `RoleContext` yalnızca 3 rol biliyor (`expert`/`employer`/
  `employee`), ama `src/constants/allRoles.js`'teki 5 rollük genişletilmiş küme
  (`superAdmin`, `companyAdmin` dahil) firma modülünün 4 ayrı dosyasında
  (`DepartmentsSection`, `EmployeesSection`, `BranchesSection`, `CompanyInfoSection`)
  zaten kullanılıyor. İki rol kümesi henüz birleşmedi — gerçek kimlik doğrulama
  eklenirken bu netleştirilmezse çelişkili bir yetkilendirme mantığı doğar.
- **Modül içi büyüme yoğunlaşması.** `risk-analysis/fineKinney` tek başına 21
  dosyaya, `FineKinneyForm.jsx` tek başına 212 satıra ulaştı (bugün proje
  genelindeki en büyük dosya). Modül büyümeye devam ederse, kendi içinde ikinci
  bir alt-modülerlik seviyesi (örn. `fineKinney/ai/`, `fineKinney/form/`)
  gerekebilir.
- **Güvenlik modeli hâlâ istemci taraflı.** `companyId` ile filtreleme bugün yalnızca
  bir arayüz görünümüdür, IndexedDB tarayıcı konsolundan doğrudan okunabilir. Bu,
  `DATABASE_PLAN.md`'de not edilmiş bilinen bir sınırdır ama prod'a çıkmadan önce
  mutlaka çözülmesi gereken bir mimari zorunluluktur, "ileride bakılır" denilecek
  bir ayrıntı değildir.
- **Tekrarlanan arama/filtre deseni.** Üç bağımsız modülde (`useFineKinneyEntries`,
  `useKnowledgeDocuments`, `useEmployerDashboardData`) birbirinden habersiz,
  benzer `useMemo` + zincirleme `filter()` mantığı yazıldı. Ortak bir soyutlama
  henüz yok — bkz. Bölüm 4.

## 4. Kod Kalitesi

**Tespit edilen tekrarlar (gerçek kod taramasıyla doğrulandı):**

| Tekrar | Nerede | Değerlendirme |
|---|---|---|
| Arama/filtre `useMemo` deseni | 3 modül (fineKinney, knowledge-center, dashboard) | Küçük ama artan bir desen; 4. kullanım çıkarsa soyutlanmalı |
| `getPrimaryCompanyId()` çağrısı | 7 servis dosyası | Beklenen/kabul edilebilir tekrar — her serviste companyId damgalama gerekiyor |
| `ROLES.find(r => r.id === role)?.label` | 3 yer (aktör etiketi çözümleme) | Küçük, `RoleContext`'e taşınabilecek bir yardımcı |
| Ölçek seçici formu (select+açıklama) | Sprint 5A'da zaten `ScaleSelectField`'a çıkarıldı | ✅ Çözüldü, örnek iyi uygulama |

**Refactor önerileri (küçük kapsamlı, mevcut "büyük refactor yapma" kuralını
ihlal etmeyen düzeyde):**

1. `FineKinneyForm.jsx` içindeki AI öneri state/mantığı (`aiLoading`,
   `aiSuggestion`, `aiError`, `getAiSuggestion`) bağımsız bir `useAiSuggestion`
   hook'una çıkarılabilir — hem dosyayı küçültür hem Vision AI/RAG gibi gelecekteki
   AI özellikleri için yeniden kullanılabilir temel oluşturur.
2. `ROLES.find(...).label` deseni `RoleContext` içinde `resolveActorLabel(role)`
   adında tek bir yardımcıya taşınabilir.
3. Üç modülde tekrarlanan arama/filtre deseni **şimdi soyutlanmamalı** — üç
   kullanım henüz "erken soyutlama" (premature abstraction) riskini haklı
   çıkarmıyor. Dördüncü bir modül aynı deseni gerektirdiğinde ortak bir
   `useFilteredList` hook'u değerlendirilmelidir.

## 5. Teknik Borç

- **Sıfır test kapsamı.** Ne birim ne entegrasyon testi var. Özellikle risk skoru
  hesaplama (`computeFineKinneyScore`) ve filtreleme mantığı gibi kritik iş
  kuralları, testsiz büyümeye devam ediyor.
- **Rol modeli ikiliği** (yukarıda Bölüm 3) — henüz kod hatasına yol açmıyor ama
  gerçek auth entegrasyonunun önünde net bir engel.
- **PWA/Service Worker hâlâ devre dışı** (kill-switch script duruyor); yeniden
  etkinleştirme için network-first strateji tanımlanmadı.
- **Ek dosyalar tamamen mock.** Risk ek dosyaları ve Bilgi Kütüphanesi dokümanları
  yalnızca meta veri/statik liste; gerçek dosya baytı hiçbir yerde depolanmıyor.
- **Güvenlik modeli istemci taraflı** (Bölüm 3'te detaylandırıldı).
- **Login/Register arayüzleri gerçek `authService`'e bağlı değil** — halen taslak.
- **`risks` object store adı ile `fineKinney` koleksiyon adı arasındaki
  tutarsızlık.** `DATABASE_PLAN.md` gelecekteki tabloyu "Risks" olarak
  adlandırıyor, ama bugünkü kodda hâlâ `fineKinney` ismi kullanılıyor. Gerçek
  migrasyonda bu adlandırma netleştirilmeli.

## 6. Dokümantasyon

- `README.md`, `docs/ROADMAP.md`, `docs/PROJECT_CONTEXT.md`,
  `docs/ARCHITECTURE.md`, `docs/DATABASE_PLAN.md`, `docs/DEVELOPMENT_RULES.md`
  bu oturumda yenilendi ve birbiriyle tutarlı.
- **`docs/CHANGELOG.md` ve `docs/SPRINTS.md` senkron değil.** İkisi de hâlâ eski
  sprint isimlendirmesiyle (örn. "Sprint 4A.3") yazılı; yeni 8 fazlı `ROADMAP.md`
  yapısına (Phase 1–8) referans vermiyor.
- **Kök `README.md`'deki "Yol Haritası" tablosu güncel değil** — hâlâ eski
  9 satırlık aşama listesini yansıtıyor, yeni 8 fazlı yapıyla değiştirilmedi.
- `VISION.md` ve `AI_ROADMAP.md`, Phase 4 (AI Copilot) / Phase 5 (RAG)
  isimlendirmesine henüz çapraz referans vermiyor — küçük ama gerçek bir
  tutarlılık eksiği.

## 7. Bilinen Eksikler

- Gerçek kimlik doğrulama ve sunucu taraflı veri izolasyonu (Phase 7 — Enterprise)
- AI Copilot'un bağlama duyarlı hale getirilmesi (Phase 4'ün devamı)
- RAG — AI yanıtlarının Bilgi Kütüphanesi içeriğinden kaynaklanması (Phase 5)
- Vision AI — risk fotoğraflarından otomatik tehlike tespiti (Phase 6)
- Gerçek doküman/dosya depolama
- Mobil paketleme kararı — PWA yeniden etkinleştirme veya Capacitor (Phase 8)
- Personel eğitim takibi (`Trainings` tablosu planlandı, uygulamada karşılığı yok)
- Tek hesaptan birden fazla firma (OSGB) yönetimi deneyimi

## 8. Sonraki Öncelikler

1. **Rol modelini birleştir** (`RoleContext` ↔ `allRoles.js`) — sonraki her
   auth/izin çalışmasının önkoşulu; ertelendikçe maliyeti artar.
2. **Test altyapısı kur** — en az risk skoru hesaplama ve filtreleme mantığı için
   birim testleri; bugün en riskli, sessiz teknik borç kalemi.
3. **`docs/CHANGELOG.md` ve `docs/SPRINTS.md`'yi yeni 8 fazlı `ROADMAP.md` ile
   senkronize et** — küçük efor, gerçek tutarlılık kazancı.
4. **`FineKinneyForm.jsx`'teki AI öneri mantığını `useAiSuggestion` hook'una
   çıkar** — düşük riskli, Vision AI/RAG için de temel oluşturur.
5. **Gerçek kimlik doğrulama + RLS geçişi için somut bir karar takvimi belirle**
   — plan (`DATABASE_PLAN.md`) hazır, tetikleyici karar yok.

## 9. Genel Değerlendirme

**Güçlü yönler:** Bu sürüm, disiplinli ve kırılmadan ilerleyen bir geliştirme
sürecinin somut kanıtıdır. `dataProvider` soyutlaması artık teoride değil,
pratikte (Risk Detay Sayfası'nın ayrı kalıcılık yolu ve Knowledge Center'ın tam
izolasyonu ile) doğrulandı. Dokümantasyon seti artık gerçekten kullanılabilir,
kod tabanıyla tutarlı ve birbirine çapraz referans veren bir bütün haline geldi.

**Zayıf yönler:** Karmaşıklık `risk-analysis` modülünde yoğunlaşıyor ve büyümeye
devam ediyor; üç modülde bağımsız yazılan arama/filtre deseni henüz küçük ama
izlenmesi gereken bir eğilim; test kapsamının sıfır olması, hızlı ilerleyen bir
kod tabanında en büyük risktir; rol modeli ikiliği ve dokümantasyon senkronizasyon
eksikleri bugün zararsız ama ertelendikçe maliyeti artan organizasyonel borçlardır.

**Sonuç:** Ürün, MVP'den kurumsal SaaS'a sağlıklı bir geçiş çizgisinde ilerliyor.
Bir sonraki büyük adım (Phase 7 — Enterprise: gerçek auth ve RLS) atılmadan önce,
Bölüm 8'deki ilk iki öncelik (rol modeli birleştirme ve test altyapısı)
çözülmezse, bu iki eksik o fazda çok daha yüksek maliyetle geri dönecektir.
