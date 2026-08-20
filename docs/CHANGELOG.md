# Changelog

Bu dosya [Keep a Changelog](https://keepachangelog.com) yaklaşımına uygun, **özet**
bir değişiklik kaydıdır. Dosya/kod seviyesinde tam ayrıntı için kök dizindeki
`CHANGELOG.md` (geliştirme günlüğü) dosyasına bakın.

Kategoriler: `Eklenen`, `Değişen`, `Düzeltilen`, `Kaldırılan`. Her sürüm başlığının
yanındaki `· Phase X` etiketi, o sürümün [ROADMAP.md](./ROADMAP.md)'deki hangi faza
karşılık geldiğini gösterir — sprint bazlı özet için [SPRINTS.md](./SPRINTS.md)'e
bakın.

## [Yedekleme — Boyut Sınırı Kilitlenmesi Düzeltildi] · Phase 6

### Düzeltilen

- **🔴 Kritik: yedek indirme ile geri yükleme arasında asimetrik boyut sınırı.**
  `BackupSection.jsx`, geri yüklenen dosyalarda `MAX_BACKUP_SIZE_BYTES` (25MB) sınırı
  uyguluyordu, ama `buildFullBackup()`'ın ürettiği İNDİRİLEN yedeğin boyutu hiç kontrol
  edilmiyordu. Phase 6'dan beri fotoğraflar (`riskDetectionPhotos`) otomatik olarak tam
  yedeğe dahil olduğu için, biriken Vision AI fotoğraflarıyla bir kullanıcı kendi
  ürettiği yedeği ileride bu cihaza GERİ YÜKLEYEMEZ hale gelebiliyordu — tam da bu
  özelliğin var olma sebebi olan senaryoda (telefon kaybolur, yedek gerekir) sessiz bir
  kilitlenme riskiydi.

### Eklenen

- `backupService.js` → `buildFullBackup({ includePhotos })`: fotoğrafları hariç tutarak
  daha küçük bir yedek üretme seçeneği (yalnızca `riskDetectionPhotos` atlanır, diğer
  TÜM uyum-kritik veri — Fine-Kinney, çalışan, eğitim, periyodik kontrol — eksiksiz kalır).
- `backupService.js` → `estimateBackupSizeBytes()`: saf/test edilebilir boyut tahmini.
- `BackupSection.jsx`: indirmeden ÖNCE boyut kontrol edilir; sınır aşılırsa kullanıcıya
  üç net seçenek sunulur — Fotoğrafsız İndir (önerilir) / Yine de Tam İndir / Vazgeç.
  Hiçbir durumda kullanıcı "geri yüklenemeyecek bir yedek" ile sessizce baş başa
  bırakılmaz.

### Test Kapsamı

- 3 yeni test eklendi (275 → 278): `estimateBackupSizeBytes` için, gerçekçi bir base64
  fotoğraf senaryosu dahil.



### Test Kapsamı

- 54 yeni test eklendi (221 → 275): `accidentFreeStreak`, `attentionItems`,
  `trainingComplianceGaps`, `legislationRiskLinker`, `executiveSummary`,
  `departmentRiskTrend`, `departmentDetail`. Bunlar dashboard/Patron Modu/Departman Isı
  Haritası'ndaki sayıları besleyen dosyalardı, önceden testsizdi. `src/utils/` klasörü
  artık %100 test kapsamında (tüm `.js` dosyalarının eşleşen `.test.js`'i var).



### Kaldırılan

- **`usePhotoDetection.js` silindi.** Phase 6'daki `useVisionFindings.js`/
  `visionAnalysisService.js` geçişinden sonra hiçbir kod bu hook'u import etmiyordu
  (yalnızca yorumlarda anılıyordu) — doğrulanmış ölü kod.
- **`PHOTO_DETECTION_PROMPT` / `parsePhotoDetection` kaldırıldı** (`systemPrompt.js`) —
  yalnızca silinen `usePhotoDetection.js` tarafından kullanılıyordu. İlgili testler de
  (`systemPrompt.test.js`) kaldırıldı.
- **`RiskDetectionForm.jsx` sadeleştirildi** — artık kullanılmayan
  `initialCategory`/`initialNote`/`photoDataUrl` prop'ları ve fotoğraf önizleme bloğu
  kaldırıldı; form yalnızca saf manuel giriş akışından sorumlu (fotoğraf tabanlı akış
  zaten ayrı, bkz. `VisionFindingsPanel.jsx`).

### Değişen

- **`RiskDetectionPanel.jsx` bölündü.** Fotoğraf çek/galeriden seç butonları + gizli
  `<input>`'lar yeni `PhotoCaptureButtons.jsx`'e taşındı — davranış değişikliği yok,
  yalnızca sorumluluk ayrımı.
- **`docs/AI_ROADMAP.md` Phase 6'yı yansıtacak şekilde güncellendi** — eski tek-tespit
  fotoğraf akışı satırı kaldırıldı, Vision AI v1'in bugün mock olduğu netleştirildi,
  "Planlanan Genişlemeler" listesine gerçek Vision API'ye bağlanma maddesi eklendi.



### Düzeltilen

- **Kritik veri kaybı bug'ı: Vision AI Phase 6 alanları hiç kaydedilmiyordu.**
  `RiskDetectionCard.jsx`, `description`/`recommendedAction`/`affected`/`legislationRef`/
  `confidenceScore` alanlarını gösterecek şekilde güncellenmişti, ama
  `useRiskDetections.js` → `addDetection()` bu alanları `extra`'dan hiç okumuyordu —
  sessizce kayboluyorlardı. Artık tüm alanlar kayda yazılıyor.

### Değişen

- **Fotoğraf depolama optimizasyonu.** Bir fotoğraftan birden fazla tehlike bulgusu
  onaylandığında (Phase 6 çoklu bulgu akışı), fotoğraf artık HER kayda ayrı ayrı
  gömülmüyor — yeni `riskDetectionPhotos` store'una BİR KEZ kaydediliyor, ilgili
  kayıtlar yalnızca `photoId` referansı taşıyor (bkz. `riskDetectionPhotoService.js`,
  `useRiskDetectionPhotoUrl.js` — okuma tarafında modül-seviyesi önbellek de var).
  Eski `photoDataUrl` (inline) biçimi geriye dönük uyumlu, `usePhotoDetection.js`'in
  tek-tespit akışı değişmedi.
- **Fotoğraf sıkıştırma.** Kamera/galeriden gelen fotoğraflar (`imageCompression.js`,
  canvas tabanlı, yeni bağımlılık yok) analiz/önizleme ve depolama öncesi 1600px uzun
  kenar + %80 JPEG kalitesine küçültülüyor — tipik 4-5MB'lık bir fotoğrafı genelde
  200-500KB'a indiriyor.
- `db.js` → `DB_VERSION` 12'ye çıktı (yeni `riskDetectionPhotos` store).

### Test Kapsamı

- 52 yeni test eklendi (174 → 226): `visionAnalysisService`, `imageCompression`
  (`computeScaledDimensions` — saf fonksiyon), `safetyScore`, `employeeNameMatch`,
  `fileValidation` (magic-byte doğrulama, minimal FileReader polyfill ile), `authService`
  (mock oturum akışı, minimal localStorage polyfill ile — üretim kodu değişmedi).



Bu sprint, önceki turlarda "Bilinen Risk" olarak dokümante edilip ertelenen 4 maddeyi
tek tek ele aldı. 3'ü çözüldü, 1'i (gerçek backend/auth gerektirdiği için) hâlâ
kapsam dışı — aşağıda net olarak ayrılıyor.

### Çözülen

- **Zaman dilimi hatası (`toISOString` vs yerel saat) — 15 dosyada.** Beklenenden çok
  daha yaygın çıktı: `date.toISOString().slice(0,10)` deseni (UTC bazlı "bugünün
  tarihi") 15 farklı dosyada BAĞIMSIZ olarak tekrarlanmıştı, bazıları kendi
  `isoDateNDaysAgo`/`tomorrowISO` yardımcılarını yeniden tanımlamıştı (kod tekrarı).
  Türkiye gibi UTC'nin ilerisindeki (+3) saat dilimlerinde, gece yarısından sonraki
  ~birkaç saatlik dilimde YANLIŞ GÜNÜ döndürebiliyordu — örn. `computeNextDueDate`
  (yeni periyodik kontrol oluştururken) veya `PeriodicCheckCalendar.jsx`'in hafta
  görünümündeki gün eşleştirmesi. `utils/dateUtils.js`'e tek bir kanonik
  `toLocalIsoDate`/`isoDateNDaysAgo`/`isoDateNDaysFromNow` seti eklendi; 8 dosyadaki
  (`dashboardTrends.js`, `departmentRiskTrend.js`, `legislationRiskLinker.js`,
  `attentionItems.js`, `constants/periodicCheck.js`, `PeriodicCheckCalendar.jsx`,
  `useReminderScheduler.js`, `AuditPackageButton.jsx`) tüm kullanımlar buraya
  yönlendirildi — hem zaman dilimi hatası düzeltildi hem 15 yerdeki kod tekrarı sona
  erdi. 13 yeni test eklendi (`dateUtils.test.js`), gece yarısına yakın saatleri de
  kapsıyor.
- **`restoreFullBackup` artık gerçekten atomik.** `db.js`'e yeni `replaceAllData`
  fonksiyonu eklendi — TÜM store'ları TEK bir IndexedDB transaction'ı içinde
  temizleyip yeniden dolduruyor. IndexedDB'nin native davranışı gereği, transaction
  içindeki herhangi bir işlem başarısız olursa TÜM değişiklikler otomatik geri alınır
  (uygulama kodunda try/catch ile taklit edilmiyor, IndexedDB'nin kendi transaction
  motoru sağlıyor). Önceki "her store ayrı transaction, biri başarısız olursa geri
  kalanlar yarım kalabilir" riski ortadan kalktı. (Not: bu fonksiyon gerçek
  `indexedDB` API'sine bağımlı olduğu için Node test ortamında birim testi
  YAZILAMADI — bkz. aşağıdaki "Doğrulanamayan" notu.)
- **`useRiskDetections.js`'teki gereksiz interval yeniden kurulumu.** `addDetection`'ın
  en güncel hali artık bir `ref`'te tutuluyor; simülasyon interval'i artık yalnızca
  `simulating` değiştiğinde kurulup sökülüyor, her yeni tespitte değil.

### Hâlâ Kapsam Dışı (gerçek backend gerektiriyor)

- Servis katmanında (`deleteEmployee`, `saveCompany` vb.) rol bazlı yetki kontrolü
  YOK — yalnızca UI/`RouteGuard` katmanında var. Bu, sunucu tarafı bir oturum/kimlik
  kavramı olmadan (Phase 7) çözülemez; her sprintte tekrar doğrulanan yapısal bir
  sınır, "temizlenecek" bir kod hatası değil.

### Doğrulanamayan (bu ortamın sınırı, kod hatası değil)

- Yeni `db.js` → `replaceAllData` gerçek `indexedDB` API'sine bağımlı; bu sandbox'ta
  network/tarayıcı olmadığı için (aynı ExcelJS notundaki gibi) uçtan uca test
  edilemedi — statik kod incelemesiyle doğrulandı, **Vercel'e deploy sonrası gerçek
  bir yedek dosyasıyla geri yükleme test edilmeli.**

## [Geliştirme Sprinti — Performans Trendi Tamamlama] · Phase 1

### Tamamlanan (Yarım Kalmış Özellik)
- **Employer Dashboard → "Güvenlik Performans Trendi" artık gerçek veri kullanıyor.**
  Önceden bu 6 dönemlik grafik, mevcut risk kapanma oranından sabit ofsetlerle üretilen
  SENTETİK bir diziydi (UI'da "temsili" olarak işaretliydi ve metin ayrıca eğitim
  tamamlama oranını da yanlışlıkla "temsili" gösteriyordu, oysa o oran zaten Sprint
  7.2.1'den beri gerçekti — yanıltıcı/bayat bir açıklama metniydi). Yeni
  `utils/dashboardTrends.js` → `computeRiskClosureTrend`, her Fine-Kinney kaydının
  zaten sakladığı gerçek `date`/`closedAt` zaman damgalarından son 6 ayın her biri için
  GERÇEK bir kapanma oranı hesaplıyor — yeni bir backend/API gerekmedi, bu veri zaten
  toplanıyordu. Açıklama metni de doğru bilgiyi yansıtacak şekilde düzeltildi. 7 yeni
  test eklendi.

### Doğrulandı, ek bulgu çıkmadı
Eğitim modülü (`NoSkipVideoPlayer.jsx` ileri-sarma engeli, kaldığı yerden devam etme,
throttle'lı ilerleme kaydı — zaten sağlam), Periyodik Kontrol takvimi (Bugün/Bu Hafta/
Bu Ay görünümleri, mobil ızgara düzeni — zaten sağlam ve önceki sprintteki canlı-durum
düzeltmesinden otomatik faydalanıyor), `ParticipantListPanel.jsx`'in `employeeName`
bazlı eşleştirmesi (bilinçli, dokümante edilmiş bir ön-auth mimarisi kararı — bkz.
`types/index.js` → `TrainingProgress`, gerçek `employeeId`'ye geçiş Phase 7'ye bağlı).

## [Hardening / Stabilite Sprinti] · Phase 1/2

### Düzeltilen (Kritik)
- **Yedekten geri yükleme akışında hiç hata yakalama yoktu.** `BackupSection.jsx`'in
  `handleConfirmRestore`'unda `try`/`finally` vardı ama `catch` YOKTU — bozuk bir yedek
  dosyası (örn. `id` alanı eksik bir kayıt) `restoreFullBackup`'ı yarıda bırakabiliyordu,
  veritabanı bazı store'lar silinmiş/yeniden yazılmamış halde kalabiliyordu ve kullanıcı
  hiçbir hata mesajı görmüyordu. Düzeltildi: `validateBackup()` artık her kaydın `id`
  alanını da kontrol ediyor (en yaygın bozulma nedenini restore BAŞLAMADAN reddediyor),
  `restoreFullBackup` hangi store'da başarısız olduğunu bildiren bir hata fırlatıyor,
  `BackupSection.jsx` bunu yakalayıp net bir toast gösteriyor.
- **CSV toplu içe aktarmada gerçek ID çakışması riski.** `mapDepartmentRow`/`mapBranchRow`/
  `mapEmployeeRow`, id üretiminde `Date.now() + Math.random()*100000` kullanıyordu — aynı
  dosyanın TÜM satırları senkron bir döngüde işlendiği için `Date.now()` her satırda AYNI
  milisaniyeyi dönüyordu; birkaç yüz satırlık bir dosyada bile doğum günü paradoksu
  nedeniyle çakışma olasılığı ihmal edilemezdi — çakışan kayıtlar IndexedDB'de birbirinin
  üstüne yazılıp sessizce kayboluyordu. `Date.now() + rowIndex` (garantili benzersiz) ile
  değiştirildi.
- **Aynı CSV dosyası içindeki tekrarlar yakalanmıyordu.** `mapDepartmentRow` zaten kayıtlı
  departmanlara karşı kontrol yapıyordu ama dosyanın KENDİ İÇİNDE iki kez geçen bir isim
  (örn. "Üretim" iki satırda) hiç yakalanmıyordu — `CsvImportButton.jsx` artık `mapRow`'a
  o ana kadar kabul edilmiş satırları da parametre olarak veriyor.
- Departman "Ekle" butonu (manuel, CSV değil) aynı isimde ikinci bir departman
  oluşturulmasına izin veriyordu — CSV yolu zaten bunu engelliyordu, manuel yol
  engellemiyordu. Aynı kontrol eklendi.
- **Çift tıklama / yarış durumu (sistemik).** Uygulama genelinde "Kaydet" ve "Sil"
  butonları yalnızca form geçerliliğine göre disable ediliyordu, async işlem sürerken
  değil — hızlı çift tıklama aynı kaydın iki kez oluşturulmasına (hatta iki ayrı firma
  kaydına) yol açabiliyordu. `ConfirmDialog.jsx`'e (7 kullanım yeri, tek merkezi
  düzeltme) ve yeni `hooks/useSubmitGuard.js`'e (Fine-Kinney, Risk Tespiti, Departman/
  Çalışan/Şube, Periyodik Kontrol formlarına uygulandı) çift-tetikleme koruması eklendi.
- `completionPercent` alanı (düzeltici faaliyet tamamlanma yüzdesi) hiçbir yerde 0-100
  aralığına sıkıştırılmıyordu — bozuk bir yedek/doğrudan IndexedDB düzenlemesiyle gelen
  aşırı bir değer, ilerleme çubuğunu (`width: %`) konteynerinin çok dışına taşırıp
  sayfa genelinde kırılmaya yol açabilirdi. Yeni `utils/numberGuards.js` → `clampPercent`
  ile 5 yazma/gösterim noktasında sıkıştırıldı.
- Fine-Kinney ve Risk Tespiti formlarındaki serbest metin alanlarında (`hazard`, `risk`,
  `affected`, `responsible`, `action`, `location`, `hazardNote`) hiç `maxLength` yoktu —
  bu alanlar hem AI çağrılarına hem de Excel/PDF export'a/kart düzenine gidiyor; aşırı
  büyük bir yapıştırma hem istek maliyetini hem de görünümü bozabilirdi. Makul sınırlar
  eklendi (300/1000/2000 karakter, alana göre).

### Düzeltilen (Mobil — önceki sprintten devam)
_(Bu sprint kapsamında yeni mobil bulgu çıkmadı; Header menü/form-zoom düzeltmeleri
önceki sprintte yapıldı, bkz. yukarı.)_

### Doğrulandı, sorun bulunmadı
Error Boundary (2 katmanlı, zaten sağlam), olmayan kayda erişim (`FineKinneyDetailDrawer`
ve `patchFineKinneyEntry` zaten güvenli `null`/no-op dönüyor), `setInterval`/
`addEventListener` temizlikleri (memory leak yok), React `.map()` render'larında eksik
`key` prop'u (tarama sonucu bulunamadı — kontrol edilen 12 `.map()` çağrısının hepsi veri
dönüştürme amaçlı, JSX render değil), rol tabanlı erişim (`RouteGuard`/`hasRole` bilinmeyen
rollerde "fail closed" — güvenli varsayılan), CSV/JSON dosya boyutu ve satır sayısı
sınırları (`MAX_CSV_SIZE_BYTES`, `MAX_CSV_ROWS`, `MAX_BACKUP_SIZE_BYTES` zaten mevcuttu).

### Bilinen Risk (ÇÖZÜLDÜ — bkz. yukarıdaki "Risk Temizliği Sprinti")
- ~~`restoreFullBackup`, birden fazla IndexedDB store'unu kapsayan TEK bir atomik
  transaction kullanmıyor...~~ → `db.js` → `replaceAllData` ile çözüldü.
- ~~`useRiskDetections.js`'teki demo simülasyon interval'i... her yeni tespitte
  kendini yeniden kurar...~~ → `addDetectionRef` deseniyle çözüldü.
- Servis katmanında (örn. `deleteEmployee`, `saveCompany`) rol bazlı yetki kontrolü YOK —
  yalnızca UI/`RouteGuard` katmanında var. Bu, gerçek bir backend olmadığı için (bu
  sprintin de yasakladığı bir değişiklik) yapısal bir sınırdır; sunucu tarafı zorlama
  gerçek backend'e geçilince (Phase 7) eklenmelidir. **Hâlâ kapsam dışı.**

## [Mevcut Sistem İyileştirme — Hata/Tutarlılık Düzeltmeleri] · Phase 1/2

### Düzeltilen
- **(Kritik) Periyodik kontrol durumu bayatlıyordu.** `status` alanı yalnızca
  kayıt kaydedildiği anda hesaplanıp saklanıyordu; zamanla (örn. 6 ay sonra)
  gerçek durumdan (`nextDueDate`) sapabiliyordu ama Periyodik Kontrol
  kartları/takvimi/detay paneli, Employer Dashboard paneli ve durum filtresi
  hâlâ bu bayat alana güveniyordu. Yalnızca bildirim planlayıcı
  (`getOverdueOrDueSoonChecks`) canlı hesaplama yapıyordu. `periodicCheckService.getPeriodicChecks()`
  artık `status`'u her okumada `nextDueDate`'den taze hesaplıyor — tek noktadan
  düzeltme, tüm tüketiciler otomatik doğru veri alıyor.
- Risk Tespiti → Fine-Kinney köprüsünde (`RiskDetectionCard.jsx` → "Sahaya İn" /
  "AI ile Taslak Oluştur") `departmentId` taşınmıyordu; dönüştürülen kayıtlar
  Departman Isı Haritası'nda hiç görünmüyordu. Düzeltildi.
- Mobil: `Header.jsx`'teki profil menüsü yalnızca `onMouseLeave` ile kapanıyordu
  (dokunmatik ekranlarda hover oluşmadığı için hiç kapanmıyordu). Aynı
  "dışarı tıklayınca kapat" deseni `NotificationCenterDropdown.jsx`'ten alınıp
  uygulandı.
- Mobil: form alanlarının çoğu (`text-sm`, 14px) iOS Safari'de odaklanıldığında
  otomatik yakınlaştırmayı tetikliyordu (16px altı eşik). `index.css`'e tek bir
  mobil-genişlik media query'si eklendi — 59+ dosya tek tek değiştirilmedi.
- `db.js`: `saveData`/`loadAllData`/`deleteData` her çağrıda yeni bir
  `indexedDB.open()` bağlantısı açıyordu (performans); artık bağlantı
  önbelleğe alınıyor. Ayrıca yazma/silme işlemleri artık transaction
  `oncomplete`/`onerror`'ını bekliyor ve hatada reddediyor (önceden sessizce
  yutuluyordu) — `IsgDataContext.jsx`'teki optimistic update'ler artık gerçek
  yazma hatasında UI'ı geri alıp toast gösteriyor.
- `FineKinneyExportButtons.jsx`: ExcelJS statik import'u dinamik `import()`'a
  çevrildi — PDF export'u ExcelJS'i hiç kullanmadığı halde Risk Analizi sayfası
  açılır açılmaz indiriliyordu.

### Değişen (Kod Tekrarının Azaltılması)
- `branchService`/`employeeService`/`departmentService`/`periodicCheckService`/
  `riskDetectionService`/`notificationRecordService`/`trainingCourseSettingsService`
  — birebir aynı get/save/delete boilerplate'i tekrarlıyordu. Ortak
  `createCrudService.js` factory'sine taşındı; dışa açılan fonksiyon isimleri ve
  davranış (companyId otomatik doldurma farkı dahil) birebir korundu.

### Eklenen (Yalnızca Dokümantasyon)
- `types/index.js` → `KnowledgeDocument` typedef'i eklendi (önceden hiç
  tanımlanmamıştı) — Bilgi Kütüphanesi'nin gelecekteki gerçek RAG/çok-kiracılı
  geçişi için veri şeklini şimdiden belgeliyor; kod davranışı değişmedi.

### Bilinen Risk (ÇÖZÜLDÜ — bkz. "Risk Temizliği Sprinti")
- ~~`todayLabel()` (yerel saat, `toLocaleDateString`) ile `todayISO()`/
  `isoDateNDaysAgo()` (UTC, `toISOString`) farklı zaman dilimi kaynakları
  kullanıyor...~~ → `todayISO()`/`isoDateNDaysAgo()` artık `toLocalIsoDate` (yerel)
  kullanıyor; kapsam başlangıçta tahmin edilenden geniş çıktı (~6 değil 15 dosya) ama
  merkezi yardımcılara yönlendirilerek tek seferde temizlendi.

## [Fine-Kinney Excel Export — Gerçek Renkli .xlsx (CSV Değil)] · Phase 2


### Değişen (Mimari Karar — Kullanıcı Onaylı)
- **Yeni bağımlılık: `exceljs`** (package.json). Sebep: CSV (önceki yaklaşım)
  gerçek hücre rengi/format YAPAMIYOR — düz metin dosyası. Kullanıcı gerçek,
  düzgün bir Excel tablosu istedi. SheetJS'in (xlsx) ücretsiz sürümü de hücre
  renklendirmeyi desteklemiyor (Pro'ya özel); ExcelJS bunu ücretsiz/MIT
  lisansla, tamamen tarayıcıda (backend gerektirmeden) sağlıyor. Eklemeden
  önce kullanıcıdan açık onay alındı.
- "Excel" butonu artık gerçek bir `.xlsx` dosyası üretiyor
  (`fineKinneyExcelWorkbook.js` → `buildFineKinneyWorkbookBuffer()`),
  CSV değil. Emoji-renk hilesi (önceki sprint) kaldırıldı — artık GERÇEK
  hücre arkaplan rengi var.
- Yerleşim: firma bilgisi solda, risk renk lejandı sağda (referans dokümanla
  aynı), altında O/F/Ş skala tabloları, en altta ana tablo — Skor ve Risk
  Seviyesi hücreleri gerçek renkli.
- `exportCsv.js`'teki `buildCsvWithHeaderBlock`/`downloadCsvWithHeaderBlock`
  DEĞİŞMEDİ (silinmedi) — başka export akışları için genel amaçlı yardımcı
  olarak kalmaya devam ediyor, sadece Fine-Kinney artık onu kullanmıyor.
- `fineKinneyExport.test.js` — önceden BOZUKTU (eski 3 parametreli/branş
  sütunlu API'ye göre yazılmıştı, hiç çalıştırılmamış olmalı). Güncel API'ye
  göre yeniden yazıldı ve gerçekten çalıştırıldı: 5/5 test geçti.

### Bilinen Riskler
- **ExcelJS ile üretilen .xlsx dosyası bu sandbox'ta gerçek bir Excel'de
  AÇILARAK test edilemedi** (network yok, `npm install` çalıştırılamıyor).
  Kod, ExcelJS'in dokümante edilmiş API'sine göre dikkatle yazıldı ama
  uçtan uca doğrulama YAPILAMADI — Playwright/LibreOffice ile önceki
  PDF/CSV örneklerinde yaptığım gibi gerçek render testi burada mümkün
  olmadı. **Vercel'e deploy ettikten sonra mutlaka gerçek Excel'de
  (Microsoft Excel veya Google Sheets) açıp test edilmeli.**
- 15 sütunun tamamı tek bir sütun genişliği setini paylaşıyor (üst bilgi
  bloğu ile veri tablosu aynı sütunları kullanıyor) — bu, Excel'in doğası
  gereği satır bazlı genişlik değiştirilemediği için bilinçli bir
  kompromi; veri kaybı yok, yalnızca bazı sütunlar ideal genişlikte
  olmayabilir (örn. "Sıra No" gereğinden geniş).

## [Excel Export — O/F/Ş Referans Skala Tabloları + Risk Derecesi Tablosu] · Phase 2

### Eklenen
- `buildFineKinneyReferenceRows()` — Olasılık/Sıklık/Şiddet skala tabloları
  + Risk Derecesi karar tablosu, firma bilgisi bloğunun altına eklendi.
  Uygulamanın kendi skala sabitlerinden üretiliyor (tek kaynak, sapma riski yok).

## [Excel Export — Sabit Firma Bilgisi Alanı] · Phase 2

### Eklenen
- `buildCsvWithHeaderBlock()`/`downloadCsvWithHeaderBlock()` (exportCsv.js) —
  mevcut `buildCsv`/`downloadCsv`'yi değiştirmeden, aynı CSV'nin başına
  sabit bir bilgi bloğu eklemeyi sağlayan yeni fonksiyonlar.
- Fine-Kinney Excel export'unun başına, TCDD referans formatına uygun 12
  satırlık firma/ekip bilgisi alanı eklendi (sistemde olan alanlar
  otomatik, olmayanlar boş — elle doldurulur).

## [Güvenlik Sprinti — Açık Proxy, Dosya Doğrulama, Vercel Header'ları, CSV Sınırları] · Phase 8

### Güvenlik
- `api/chat.js`: sunucu tarafında `max_tokens` tavanı (2000), payload boyutu
  sınırı (4MB), IP başına dakikada 20 istek rate limit, origin kontrolü.
  Önceden tamamen açık bir proxy'ydi.
- `vercel.json`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` eklendi. `Content-Security-Policy-Report-Only` eklendi
  (bilinçli olarak ZORLAYICI DEĞİL — bkz. DEVELOPMENT_REPORT.md).

### Eklenen
- `src/utils/fileValidation.js` — görsel dosyalarda boyut + gerçek format
  (magic bytes) doğrulaması. 4 yükleme noktasına bağlandı (sohbet fotoğrafı,
  logo, profil fotoğrafı, risk tespit fotoğrafı).
- CSV içe aktarma (2MB/5000 satır) ve yedek geri yükleme (25MB) için boyut
  sınırları.

## [Departman Detay Paneli + İsim Eşleştirme Altyapısı + Eğitim Uyum Listesi + Çoklu Şube UI Gizleme] · Phase 2

### Eklenen
- `DepartmentDetailPanel.jsx` — Risk Isı Haritası'nda departmana tıklanınca
  açılan modal: açık risk, ortalama risk puanı, periyodik kontrol durumu
  (güvenilir/departmentId'ye bağlı) + son ramak kala, son iş kazası, eğitim
  tamamlama oranı (isim eşleştirmeli, best-effort — panelde ayrı bölümde,
  açıkça etiketli).
- `src/utils/employeeNameMatch.js` — serbest metin isim → Employee kaydı
  eşleştirme altyapısı (tek ortak fonksiyon, kod tekrarı yok).
- `src/utils/departmentDetail.js` — panelin veri hesaplama katmanı.
- `src/utils/trainingComplianceGaps.js` + `TrainingComplianceListCard.jsx` —
  "kim hangi eğitimi almadı" çalışan bazlı liste (hiç başlamamışlar dahil).
- `useCompanyOrgLists` hook'una `hasMultipleBranches` bayrağı.

### Değişen
- `FineKinneyFilters.jsx`, `FineKinneyForm.jsx`, `RiskInfoTab.jsx` — Şube
  seçici/satırı artık yalnızca `hasMultipleBranches === true` iken görünüyor.
- `useEmployerDashboardData.js` — `trainingProgressRecords` return'e eklendi
  (zaten fetch ediliyordu, dışa açılmamıştı).

### İncelenip Kod Yazılmayanlar
- "Uygulama dışına ulaşan hatırlatma" ve "Veri Yedekleme/Dışa Aktarma" —
  ikisi de zaten mevcuttu (`useReminderScheduler.js`, `backupService.js`).

## [Fine-Kinney Export Sadeleştirme + AI Mevzuat Öneri Sistemi] · Phase 5

### Eklenen
- AI Mevzuat Öneri Sistemi — mevzuat PDF yükle, AI çoklu düzeltici faaliyet
  önersin, tek tıkla ekle (`AIRegulationSuggestionsPanel.jsx`,
  `sendDocumentAnalysis()`, `FINE_KINNEY_REGULATION_ACTIONS_PROMPT`,
  `validatePdfFile()`).

### Değişen
- `api/chat.js`: payload sınırı 4MB → 8MB (PDF desteği için).
- Export tablosundan Sorumlu/Şube sütunları kaldırıldı.
- PDF'te skor renkleri daha doygun/görünür hale getirildi.

## [Fine-Kinney Export Geliştirmesi — Etkilenenler, Renkli Skor, Firma Bilgisi] · Phase 2

### Eklenen
- `FineKinneyEntry.affected` (Etkilenenler) alanı — form, detay görünümü (`RiskInfoTab.jsx`)
  ve export'a eklendi. Eski kayıtlarda boş olabilir (opsiyonel, geriye dönük uyumlu).
- PDF export'a "Sıra No" sütunu (computed, satır index'i).
- PDF export'ta Skor ve Risk Seviyesi hücreleri, standart Fine-Kinney referans
  eşikleriyle (Risk<20/<70/<200/<400/≥400) renklendiriliyor: yeşil → mavi →
  sarı → turuncu → kırmızı.
- PDF export'un başına, sistemde kayıtlı firma bilgisi (`getPrimaryCompany()`)
  otomatik ekleniyor — ad, sektör, VKN, adres.

### Değişen
- `RISK_LEVEL_PALETTE` (fineKinney.js) — renk sırası müşteri talebiyle
  yeşil/mavi/sarı/turuncu/kırmızıya güncellendi. Eşikler (20/70/200/400)
  değişmedi. Tek kaynak olduğu için Risk Isı Haritası, rozetler, formlar
  dahil TÜM uygulama otomatik güncellendi.
- `FINE_KINNEY_EXPORT_HEADERS` — "Önlem" → "Alınacak Önlemler" (netlik için).

## [Mevzuat Değişikliği → Etkilenen Risk İşaretleme] · Phase 5

### Eklenen
- `src/utils/legislationRiskLinker.js` — son 90 günde `updatedAt`'i güncellenmiş
  "legislation" kategorisindeki dokümanları, anahtar kelime örtüşmesiyle açık
  Fine-Kinney kayıtlarıyla eşleştirir (RAG-lite; gerçek embedding/hukuki analiz
  değildir, dosya başında açıkça belirtilmiştir).
- `LegislationImpactCard.jsx` — eşleşen mevzuat + etkilenen risk kayıtlarını
  listeleyen dashboard widget'ı, "İSG uzmanınızla teyit edin" uyarısıyla.

## [Ramak Kala/Risk Trend Uyarısı] · Phase 2

### Eklenen
- `src/utils/departmentRiskTrend.js` — departman bazlı son 30 gün / önceki 30
  gün risk kaydı karşılaştırması (dashboardTrends.js'teki firma-geneli pencere
  mantığının departman kırılımına uygulanmış hali).
- `DepartmentTrendAlertCard.jsx` — artış tespit edilen departmanları listeler;
  gürültü olmasın diye min. 3 kayıt eşiği var.

## [Eğitim Sertifika Otomasyonu — İncelendi] 

Talep gözden geçirildi: `printTrainingCompletionCertificate.js` ile bu özellik
**zaten mevcut** (sınav geçilir geçilmez "Tamamlama Belgesi" PDF'i üretiliyor).
Kod değişikliği yapılmadı, tekrar iş üretilmedi.

## [Tek Tık Denetim Dosyası] · Phase 2

### Eklenen
- `src/features/dashboard/employer/auditPackageExport.js` — seçilen tarih
  aralığındaki Fine-Kinney kayıtları + yapılan periyodik kontroller + genel
  eğitim durumunu tek PDF'te (tarayıcı yazdırma diyaloğu) birleştirir.
- `AuditPackageButton.jsx` — tarih aralığı seçici + oluştur butonu, popup
  engellenmesi durumunu kullanıcıya açıkça bildirir.
- `useEmployerDashboardData.js` — hook'un döndürdüğü nesneye
  `trainingCompletionRecords` eklendi (zaten fetch ediliyordu, sadece dışa
  açılmadı önceden).

## [Bölüm Bazlı Risk Isı Haritası] · Phase 2

### Eklenen
- `DepartmentHeatMap.jsx` — departman bazlı risk widget'ı, kayıt SAYISI değil
  ORTALAMA ŞİDDET (Fine-Kinney skoru) baz alınarak renklendirilir. Mevcut
  `DepartmentRiskBreakdown` (sayı bazlı bar-liste) korunmuştur, ikisi birlikte
  gösterilir.
- Dashboard widget görünürlük ayarlarına yeni widget: "Risk Isı Haritası
  (Departman)".

### Değişen
- Yok — mevcut renk paleti (`getFineKinneyRiskLevel`) ve tema token'ları
  aynen kullanıldı, yeni bir renk sistemi eklenmedi.

## [Yönetici Modu (Patron Ekranı)] · Phase 1

### Eklenen
- İşveren Paneli'ne 3. sekme: "Patron Modu" — 5 kartlık sade özet (açık kritik
  risk, geciken kontrol, son 30 günde kapanan risk, eğitim tamamlama %, son
  kaza). `ExecutiveModePanel.jsx`.
- Yeni hesaplama mantığı yok — mevcut `useEmployerDashboardData` çıktısı
  (`metrics`, `last30DayChange`, `accidentFreeStreak`) ve
  `computePeriodicCheckStats` yeniden kullanıldı.

## [Netlify → Vercel Geçişi] · Phase 8

### Değişen
- `netlify/functions/chat.js` → `api/chat.js` (Vercel Serverless Function
  formatına çevrildi). `chatService.js` → `API_ENDPOINT` güncellendi.
- `netlify.toml` → `vercel.json` (aynı SPA rewrite kuralı korunarak).
- Tüm dokümantasyondaki Netlify referansları Vercel'e güncellendi (geçmiş
  changelog/rapor kayıtları hariç — tarihsel kayıt değiştirilmedi).

### Kaldırılan
- `netlify/` klasörü.

## [Güvenlik & Dayanıklılık — CSV Enjeksiyon, Error Boundary, Tam Yedekleme, Gizlilik Perdesi] · Phase 8

### Eklenen
- CSV export'unda formula/injection koruması (OWASP mitigasyonu).
- `Layout.jsx`'teki sayfa içeriği artık ayrı bir Error Boundary ile sarılı — bir
  sayfa çökerse sidebar/header hayatta kalır.
- Tam Yedekleme/Geri Yükleme (`BackupSection.jsx`, `backupService.js`) — tüm
  IndexedDB verisini tek bir JSON dosyasına yedekler/geri yükler.
- Görev Değiştirici Gizlilik Perdesi (`AppSwitcherPrivacyGuard.jsx`) — uygulama
  arka plana alınınca hassas veri yerine logo gösterir.

## [Toplu Veri İçe Aktarma, Uygulama Geneli Arama & Toplu İşlem] · Phase 2

### Eklenen
- **CSV içe aktarma** — Çalışan/Departman/Şube listelerine önizlemeli/onaylı
  toplu veri girişi (`CsvImportButton.jsx`, `utils/importCsv.js`).
- **Uygulama geneli arama** — Header'daki önceden işlevsiz arama kutusu artık
  gerçek: Fine-Kinney, Risk Tespiti, Periyodik Kontrol, Dokümanlar, Bilgi
  Kütüphanesi'nde birden arıyor (`GlobalSearchBar.jsx`, `useGlobalSearch.js`).
- **Toplu işlem** — Periyodik Kontrol listesinde çoklu seçim + "Bugün Kontrol
  Edildi" / "Departman Değiştir" toplu aksiyonları.

## [PWA / Offline — Service Worker v2 (Güvenli, Network-First)] · Phase 8

### Düzeltilen
- **v1'in beyaz ekran riski yapısal olarak giderildi.** v1 cache-first stratejisi
  kullanıyordu (eski `index.html`'i sonsuza dek önbellekte sabitleyip silinmiş JS
  dosyalarına referans veriyordu → beyaz ekran); v2, index.html/JS/CSS için ASLA
  cache-first kullanmaz — her zaman network-first (yalnızca statik varlıklar
  cache-first). SW yeniden kaydedildi (önceden `main.jsx` her kaydı kaldırıyordu).

### Eklenen
- `public/offline.html` — bağlantı tamamen koptuğunda gösterilen sayfa.
- `notificationclick` olay dinleyicisi geri eklendi (v1→kill-switch geçişinde
  kaybolmuştu).

## [RAG-lite İyileştirmesi — Eş Anlamlı Terimler & Alan Ağırlıklandırması] · Phase 5

### Değişen
- Bilgi Kütüphanesi "AI'ya Sor" araması: 10 gruplu eş anlamlı/kısaltma sözlüğü
  (KKD↔kişisel koruyucu donanım vb., iki yönlü) + alan ağırlıklandırması
  (başlık 3x > etiket 2x > özet 1.5x > içerik 1x) + tam ifade bonusu.

## [Unreleased]

Henüz yayınlanmamış / planlama aşamasında değişiklik yok.

## [Bildirim / Hatırlatma — Periyodik Kontrol & Eğitim Son Tarihi] · Phase 2

### Eklenen
- Gecikmiş/yaklaşan periyodik kontroller ve eğitim son tarihleri için gerçek
  tarayıcı bildirimi (günde bir kez taranır). Eğitim kursları için kurs-bazlı
  (şirket çapında) son tarih ayarlanabiliyor (`TrainingModule.jsx`).
- Yeni bildirim tercihleri: "Periyodik kontrol süresi yaklaşınca/geçince",
  "Eğitim son tarihi yaklaşınca/geçince" (Ayarlar sayfasında otomatik göründü).
- **Kapsam sınırı:** yalnızca uygulama açıkken tetiklenir, gerçek push-when-closed
  değildir (backend/Push API gerektirir, onay olmadan eklenmedi).

## [Export / Raporlama — Fine-Kinney & Dashboard PDF/Excel] · Phase 2

### Eklenen
- Fine-Kinney listesi ve Dashboard özet kartları için gerçek PDF/Excel export
  (önceden "Yakında" placeholder'dı). Sıfır yeni bağımlılık: "Excel" → CSV
  (Türkçe uyumlu: noktalı virgül ayırıcı + UTF-8 BOM), "PDF" → tarayıcı yazdırma
  diyaloğu. Yeni paylaşılan altyapı: `utils/exportCsv.js`, `utils/printWindow.js`.

## [⚠️ Test Altyapısı Düzeltmesi & Türkçe "İ Problemi" Bug Fix]

### Düzeltilen
- **`package.json` test script'i** — glob artık tek tırnak içinde
  (`"node --test 'src/**/*.test.js'"`), Node'un kendi glob motoru özyinelemeli
  tarama yapıyor. Önceki haliyle 2+ klasör derinliğindeki test dosyaları (örn.
  `filterFineKinneyEntries.test.js`) hiç çalıştırılmıyordu — önceki "X/X test
  geçti" raporları eksikti. Artık `npm test` ile 9 dosya, 64 test doğrulanıyor.
- **Türkçe "İ problemi"** — `.toLowerCase()` Türkçe büyük "İ"yi yanlış çeviriyordu
  (`"FORKLİFT"` → `"forkli̇ft"`, "forklift" ile eşleşmiyor). Yeni `utils/text.js` →
  `turkishLower()` ile 7 dosyadaki tüm arama noktası düzeltildi.

## [Eğitim Modülü Genişletmeleri — Çoklu Seçim & Tamamlama Belgesi] · Phase 4

### Eklenen
- Sınavlarda çoklu seçim (multi-select) soru tipi desteği (`quizGrading.js`).
- "Tamamlama Belgesi" PDF export'u — sıfır yeni bağımlılıkla (tarayıcı yazdırma
  diyaloğu). Bilinçli isimlendirme: "sertifika" değil, çünkü uygulama resmi bir
  eğitim kurumu değil.

## [Fotoğraftan Tehlike Tespiti] · Phase 9

### Eklenen
- **"📷 Fotoğrafla Tespit Et"** (Risk Tespiti sekmesi) — kullanıcının kendi
  telefonuyla çektiği/galeriden seçtiği fotoğraf AI ile analiz edilip 6 kategoriden
  birine sınıflandırılıyor + kısa not üretiliyor (`usePhotoDetection.js`); sonuç
  Risk Tespiti formunu ön dolduruyor, kullanıcı gözden geçirip onaylıyor.
- Risk Tespiti kartlarında fotoğraf küçük resmi + AI notu gösteriliyor; "AI ile
  Taslak Oluştur" artık bu notu da Fine-Kinney taslağı üretirken dikkate alıyor.

## [AI Özellikleri — Bağlama Duyarlı Copilot, Doküman Üretimi & Hook Birleştirmesi] · Phase 4

### Eklenen
- **Bağlama Duyarlı AI Copilot** — Fine-Kinney, Risk Tespiti, Periyodik Kontrol ve
  Mevzuat ekranlarına "🤖 AI'ya Sor" butonu eklendi; sohbete o bağlamla girilir
  (özel karşılama + önerilen sorular + odaklı sistem promptu), context chip'inden
  genel sohbete dönülebilir.
- **Doküman İçerik Üretimi** — yeni belge oluşturulurken AI düzenlemeye hazır bir
  ilk taslak yazıyor (`generateDocumentDraft()`); yeni `DocumentDetailDrawer.jsx`
  ile içerik görüntülenip düzenlenebiliyor ve "Tamamlandı" işaretlenebiliyor.

### Değişen (iç refactor, davranış aynı)
- `useAIRiskAnalysis.js` ve `useInitialRiskScore.js`'teki ortak loading/error
  iskeleti yeni `hooks/useAiSuggestion.js`'e taşındı.

## [AI Özellikleri — scoreRisk() Gerçek İmplementasyonu] · Phase 4

### Eklenen
- **"AI ile Puanla" butonu** (Fine-Kinney formu) — yalnızca tehlike+risk metninden,
  henüz Olasılık/Maruziyet/Şiddet seçilmemişken önlem öncesi başlangıç puan önerisi
  üretir. Öneri dropdown'lara yazılır, kullanıcı düzenleyip onaylar.
- `riskService.scoreRisk()` artık gerçek AI implementasyonu (önceden placeholder/
  `throw` idi).

## [Teknik Borç Sağlamlaştırma — Rol Sadeleştirme & Test Altyapısı] · Phase 1

### Değişen
- **Rol modeli 5 rolden 3 role indirildi** — `companyAdmin`/`superAdmin` kaldırıldı;
  ürün şu anlık OSGB/çoklu firma yönetimi senaryosuna satılmıyor. `companyId` tabanlı
  çok-kiracılı veri modeli (bkz. `DATABASE_PLAN.md`) etkilenmedi, yalnızca bu iki
  placeholder rol kaldırıldı.
- `useFineKinneyEntries.js` içindeki filtre mantığı, test edilebilirlik için
  `filterFineKinneyEntries.js`'e (saf fonksiyon) çıkarıldı — davranış aynı.

### Eklenen
- **Test altyapısı** — Node'un yerleşik `node:test` çalıştırıcısı (sıfır yeni
  bağımlılık). Risk puanı hesaplama, risk seviyesi sınırları, Fine-Kinney
  filtreleme, RAG-lite doküman eşleştirme ve rol/izin kontrolü için 23 birim testi.

### Kaldırılan
- `companyAdmin`/`superAdmin` rolleri (`allRoles.js`, `permissions.js`,
  `types/index.js`'teki kullanılmayan `FullRole` tipi).

## [Sprint 9.1 — Risk Tespiti (Triage Havuzu)] · Phase 9

### Eklenen
- **Risk Tespiti sekmesi** (Risk Analizi sayfası, Fine-Kinney'den ayrı) — ham/
  doğrulanmamış tespitlerin toplandığı yeni bir triage havuzu.
- Manuel tespit ekleme + "Demo: Otomatik Simülasyon" (kamera henüz yok, periyodik
  mock tespit üretimi).
- Aynı kategori+konum tekrar tespit edilince biriktirme ("Son 30 günde N kez").
- **"AI ile Taslak Oluştur"** ve **"Sahaya İn (Manuel)"** — ikisi de Fine-Kinney
  formunu ön doldurarak açar; kayıt kararı her zaman kullanıcıya ait.

## [Sprint 7.5 — AI Mevzuat Takibi & Proaktif Fine-Kinney Önerisi] · Phase 5

### Eklenen
- **AI Mevzuat & Risk Taraması paneli** (Fine-Kinney sayfası) — mevzuat dokümanları
  + mevcut risk kayıtlarını birlikte tarar; gözden geçirilmesi önerilen kayıtları
  işaretler ve henüz girilmemiş olası riskler için taslak önerir.
- "Taslak Oluştur" — öneriyi tek tıkla ön doldurulmuş Fine-Kinney formuna aktarır;
  kaydetme kararı kullanıcıdadır, hiçbir öneri otomatik kaydedilmez.
- "Kayda Git" — işaretlenen kayıt gerçek bir Fine-Kinney kaydına eşleşiyorsa, aktif
  filtre ne olursa olsun doğrudan o kaydın detayını açar.

## [Sprint 7.2.4 — Dashboard: Platformun Merkezi] · Phase 1

### Eklenen
- **Açık Kritik Riskler kartı** — durumu "Tamamlandı" olmayan Yüksek/Çok Yüksek
  seviye riskler, en yüksek puandan başlayarak.
- **InfoTooltip bileşeni** — birkaç kilit kartta ("bu sayı nasıl hesaplanıyor")
  kısa açıklamalar.
- **Kartlardan modüllere tıkla-git** — Son 30 Gün Değişim satırları, Güvenlik
  Skoru, Son Aktiviteler artık ilgili modüle bağlı.
- Son 30 Gün Değişim kartına "henüz veri yok" boş durumu.

## [Sprint 7.2.3 — Periyodik Kontrol Merkezi (genişletme)] · Phase 1

### Eklenen
- **Üst özet kartları** — Geciken Kontroller, Bugünkü Kontroller, Bu Hafta
  Yaklaşanlar, Bu Ay Tamamlananlar (gerçek veriden, `computePeriodicCheckStats`).
- **Departman ve Tarih Aralığı filtresi** — mevcut arama/durum/kontrol türü
  filtrelerine eklendi.
- **Kontrol Detayı ekranı** — kart tıklanınca tüm bilgiler (Ekipman, Kontrol Türü,
  Departman, Son/Sonraki Kontrol, Durum, Sorumlu, Açıklama) okunaklı bir modalda.
- **Takvim: Bugün / Bu Hafta / Bu Ay görünüm modları.**
- Dashboard'un ileride kullanabileceği hazır istatistik fonksiyonu
  (`computePeriodicCheckStats` → yaklaşan/geciken/tamamlanan sayısı + tamamlama oranı).

## [Sprint 7.4 — Karar Destek Dashboard & Deneyim Rafine] · Phase 1

### Eklenen
- **Son 30 Gün Değişim kartı** — Yeni/Kapatılan Risk, Tamamlanan Eğitim, Yapılan
  Periyodik Kontrol için gerçek son-30-gün/önceki-30-gün karşılaştırması
  (`utils/dashboardTrends.js`), temsili veri değil.
- **Yaklaşan Periyodik Kontroller kartı** — mevcut makro özet panelinin yanına,
  hangi kontrolün hangi tarihte olduğunu somut listeleyen bir detay kartı eklendi.
- **Devam Eden Eğitimler kartı** — Sprint 7.2.1'de hazırlanıp hiç kullanılmayan
  `trainingStats` artık Dashboard'da gerçek katılımcı/kurs/ilerleme satırlarıyla
  gösteriliyor; eski statik modül-başlığı listesinin yerini aldı.
- Dokümanlar sayfasına `?tab=` derin bağlantı desteği (dashboard kartlarından
  doğrudan ilgili sekmeye gitmek için).

### Değişen
- `EmployerDashboard.jsx`'teki sessiz "boş ekran" yükleme durumu, mevcut `Loading`
  bileşenini kullanacak şekilde düzeltildi; veri çekme hatası artık `ErrorState`
  ile gösteriliyor (önceden hiç ele alınmıyordu).
- Uygulama genelinde modal/drawer kapatma butonlarının ve birkaç şirket-yönetimi
  ekranındaki düzenle/sil bağlantılarının dokunma alanı büyütüldü (mobil UX).

## [Bilgi Kütüphanesi — AI Asistanı] · Phase 5

### Eklenen
- **"AI'ya Sor"** — Bilgi Kütüphanesi'nde soru sorulduğunda, önce yerel anahtar
  kelime eşleştirmesiyle (`findRelevantDocuments`) ilgili dokümanlar bulunuyor,
  sonra bu dokümanların içeriği AI'ye bağlam olarak veriliyor. Cevapla birlikte
  kullanılan kaynak doküman(lar) her zaman gösteriliyor. **Not:** bu gerçek bir
  vektör/embedding tabanlı RAG değildir — bkz. [AI_ROADMAP.md](./AI_ROADMAP.md).
- **Favoriler** — doküman kartlarına yıldız butonu, "Yalnızca Favoriler" filtresi
  (yerel depoda tutulur, yeni backend gerekmedi).
- **İlgili Dokümanlar** — doküman detay ekranında, aynı kategori/etiketi paylaşan
  diğer dokümanlar önerilir.

### Değişen
- `docs/ROADMAP.md` → Phase 5 (RAG) durumu "Planlandı" → "Kısmen tamamlandı".

## [Sprint 7.2.2] — Periyodik Kontrol Modülü (genişletme) · Phase 1

### Eklenen
- **Filtreleme** — arama + durum (Süresi Geçti/Yaklaşıyor/Güncel) + kategori
  chip'leri (`PeriodicCheckFilters.jsx`, Fine-Kinney'deki filtre deseninin
  birebir uygulanması).
- **Takvim görünümü** — yeni bağımlılık eklemeden, saf bir ay ızgarası
  (`PeriodicCheckCalendar.jsx`); günlere tıklayınca o güne planlı kontroller
  listeleniyor.
- **Dashboard kartları** — yeni "Periyodik Kontrol Özeti" widget'ı (durum bazlı
  sayaç şeridi, Risk Workflow widget'ıyla aynı görsel dil).
- **Yaratıcı ek — tek tıkla "Bugün Kontrol Edildi":** önceden bir kontrolü
  tamamlanmış işaretlemenin tek yolu formu açıp tarihi elle değiştirmekti; artık
  geciken/yaklaşan her kartta tek butonla yapılabiliyor.

### Değişen
- `usePeriodicChecks.js`'e filtre state'i eklendi — mevcut `checks`/`saveCheck`/
  `removeCheck` sözleşmesi değişmedi, yalnızca yanına eklendi.
- `PeriodicCheckCard.jsx`'e hızlı aksiyon butonu eklendi, geri kalanı aynı.

### Not
- `PeriodicCheckForm.jsx`, `constants/periodicCheck.js` ve
  `services/periodicCheckService.js`'e **hiç dokunulmadı** — zaten doğru
  çalışıyordu.

## [Sprint 7.2.1] — Education Module (genişletme) · Phase 1

### Eklenen
- Video ilerleme yüzdesi (canlı, oynatıcı üzerinde) ve **"kaldığı yerden devam
  et"** — yeni `trainingProgress` koleksiyonu (`DB_VERSION` 8→9), her (kurs,
  çalışan) çifti için tek kayıt.
- 4 durumlu eğitim durum modeli: **Atandı / Devam Ediyor / Tamamlandı / Kaldı**
  (`constants/trainingStatus.js` → `resolveTrainingStatus`, Sprint 7.1'deki
  `riskWorkflow.js` ile aynı desen).
- Katılımcı listesine ilerleme yüzdesi ve durum rozeti eklendi — artık yalnızca
  sınavı bitirenler değil, izlemekte olanlar da listede.
- Dashboard'un kullanacağı eğitim istatistikleri (`computeTrainingStats`) —
  katılımcı/atanan/devam eden/tamamlanan/kalan sayıları. Şimdilik hiçbir widget
  tüketmiyor, `useEmployerDashboardData`'nın döndürdüğü `trainingStats` üzerinden
  hazır bekliyor.

### Değişen
- Dashboard'daki "Tamamlanan Eğitim" KPI'ı ve Güvenlik Skoru hesaplaması artık
  **gerçek** veriden besleniyor — önceden sabit `%72` mock değeri kullanılıyordu.
- İleri sarma engeli (`NoSkipVideoPlayer`) artık devam noktasını da koruyor —
  "kaldığı yerden devam et" ile birlikte yanlışlıkla ileri sarma sayılmıyor.

### Not
- Video/sınav sonucu gösterimi ve video bitmeden sınavın açılmaması Sprint 7.2'de
  zaten vardı, bu sprintte yalnızca korundu (tekrar yazılmadı).

## [Sprint 7.2] — Eğitim Modülü · Phase 1

### Eklenen
- `features/training/` — uçtan uca uzaktan eğitim akışı: video izleme (ileri
  sarma engelli `NoSkipVideoPlayer`) → video sonu sınav (`CourseQuiz`, otomatik
  puanlama) → tamamlama kaydı.
- `constants/trainingCourses.js` — 5 kurs (önceki statik `EDUCATION_MODULES`
  başlıklarının yerini aldı), her biri kendi 3 soruluk sınavıyla. Video alanı
  şimdilik telifsiz bir yer tutucu (`Big Buck Bunny` örnek dosyası) — gerçek
  eğitim videosu (AI ile üretim dahil) ayrı bir karar/altyapı gerektiriyor,
  bkz. docs/AI_ROADMAP.md.
- Yeni IndexedDB koleksiyonu: `trainingCompletions` (DB_VERSION 7 → 8).
- Katılımcı listesi — yalnızca İSG uzmanı ve işveren rolüne görünür.
- Sertifika/PDF üretimi **bilinçli olarak yok** — tamamlama kaydının kendisi
  "uzaktan eğitimin verildiğinin belgesi" işlevi görüyor.

### Değişen
- `constants/education.js` → `EDUCATION_MODULES`, artık `trainingCourses.js`'ten
  türetiliyor (tek kaynak) — mevcut 3 tüketici (Dashboard widget'ları,
  Employee mini liste) değişmeden çalışmaya devam ediyor.
- `DocumentsPage.jsx`'teki statik "Eğitim Modülleri" sekmesi gerçek
  `TrainingModule`'e bağlandı.

## [Dashboard Genişletmesi] — Phase 2

### Eklenen
- **Kazasız Gün Sayacı** — bildirim akışındaki gerçek "İş Kazası" kayıtlarından
  hesaplanan, hem İşveren hem Çalışan dashboard'unda gösterilen ortak widget.
- **Risk Workflow** widget'ı — Sprint 7.1'de eklenen 6 durumlu workflow modelini
  (`workflowState`) ilk kez görselleştiriyor.
- **Departman Bazlı Risk Dağılımı** — Sprint 5A'da risklere eklenen `departmentId`
  alanını ilk kez özetleyen bar-liste.
- **Dikkat Gerektirenler** widget'ı — geciken/yaklaşan düzeltici faaliyet
  alt-öğeleri ve periyodik kontrolleri tek, aciliyet sıralı listede birleştirir.
- Dashboard için "Yakında" etiketli PDF/Excel dışa aktarım butonları
  (Fine-Kinney listesindekiyle aynı desen).

### Düzeltilen
- `EmployerOverviewTab.jsx`'te "Düzeltici Faaliyetler" widget'ının ikonu
  (`ListChecks`) import edilmemişti — render sırasında hataya yol açabilecek bu
  eksik import düzeltildi.

## [Sprint 7.1] — Risk Workflow Foundation · Phase 2

### Eklenen
- `src/constants/riskWorkflow.js` — risk yaşam döngüsü için 6 durumlu esnek
  workflow modeli (Taslak/Açık/İncelemede/Aksiyon Bekliyor/Tamamlandı/Kapatıldı)
  ve aralarındaki izin verilen geçişler.
- Legacy `status` alanından (`open`/`in_progress`/`done`) yeni modele geriye
  dönük uyumlu otomatik eşleme (`mapLegacyStatusToWorkflowState`).
- `FineKinneyEntry` tipine opsiyonel `workflowState` alanı.

### Not
- Bu sprint yalnızca veri modeli/mimaridir — hiçbir ekran değiştirilmedi,
  kullanıcı arayüzünde görünen bir değişiklik yoktur.

## [Rol Modeli Birleştirmesi & AI Hook Refaktörü] · Phase 1

### Değişen
- Rol verisi tek kaynağa (`src/constants/allRoles.js`) indirildi; `RoleContext.jsx`
  artık kendi rol listesini tutmuyor, oradan türetiyor. 9 yerde tekrarlanan
  `ROLES.find(...).label` deseni `getRoleLabel()` ile sadeleştirildi.
- `FineKinneyForm.jsx`'teki AI öneri mantığı (`aiLoading`/`aiSuggestion`/
  `getAiSuggestion`) bağımsız `useAIRiskAnalysis` hook'una taşındı — form JSX'i
  değişmedi, dosya 212 → 165 satıra indi.
- `README.md`, `docs/SPRINTS.md`, `docs/CHANGELOG.md` güncel 8 fazlı
  `ROADMAP.md` yapısıyla senkronize edildi.

## [Sprint 6] — Bilgi Kütüphanesi · Phase 3

### Eklenen
- Yeni `knowledge-center` modülü: 8 sabit kategori, mock doküman listesi.
- Arama kutusu, doküman türü filtresi, kategori bazlı filtreleme.
- Doküman detay ekranı (görüntüle/indir eylemleri henüz pasif — gerçek depolama yok).
- `/knowledge-center` route'u ve Sidebar girişi.

## [Sprint 5A] — Risk Yönetimi (v2) · Phase 2

### Eklenen
- Fine-Kinney puanlama seçeneklerine referans açıklamaları.
- Risk Detay Sayfası: Risk Bilgileri, Fine-Kinney, Düzeltici Faaliyetler, Ek Dosyalar,
  Risk Geçmişi, Notlar sekmeleri.
- Çoklu düzeltici faaliyet listesi (önceki tekil alanların yanına, geriye dönük uyumlu).
- Departman/Şube/Durum/Öncelik/Tarih filtreleri.
- Risk geçmişi (timeline) otomatik olay kaydı.

### Değişen
- Fine-Kinney formundaki tekrar eden select blokları `ScaleSelectField` bileşenine
  indirildi.

## [Sprint 4A.3] — Executive Dashboard · Phase 1

### Eklenen
- AI Güvenlik Skoru (`computeSafetyScore`), Yönetici Özeti, Trend paneli.
- Düzeltici Faaliyet paneli, widget görünürlük tercihleri (`localStorage`).
- KPI kartları: risk kapanma süresi, ortalama risk puanı, aktif düzeltici faaliyet.

## [Sprint 4A.2] — Enterprise UX · Phase 1

### Eklenen
- Dashboard 2.0 (Genel Bakış + Performans sekmeleri), Bildirim Merkezi (sistem olayları).
- Profil sayfası genişlemesi (fotoğraf, ünvan, şifre değiştirme arayüzü).
- Rol bazlı sekme filtreleme (Risk Analizi, Dokümanlar).
- Fine-Kinney artık risk (önlem sonrası) hesaplaması ve AI destekli öneri.

## [Sprint 4A] — Foundation · Phase 1

### Eklenen
- `RouteGuard` ve `permissions.js` (rol/izin kontrolü).
- Tüm veri tiplerine `companyId` alanı (çok kiracılı izolasyona hazırlık).
- `notificationRecordService.js` ile Service+Repository mimarisi tamamlandı.

## [Firma Sistemi] · Phase 1

### Eklenen
- Firma, Şube, Departman, Çalışan CRUD modülleri (Ayarlar → Firma Yönetimi).
- Varsayılan departman seti otomatik oluşturma.

## [Backend-Hazır Soyutlama Katmanı] · Phase 1

### Eklenen
- `dataProvider.js` — tüm servislerin geçtiği tek veri erişim arayüzü.
- `authService.js` — Supabase Auth istemcisiyle aynı isimlerde mock fonksiyonlar.

## [Periyodik Kontrol & Denetim Geçmişi] · Phase 1

### Eklenen
- Periyodik kontrol takvimi ve durum hesaplama (`computeNextDueDate`).
- `auditService.js` (denetim/aktivite günlüğü).
- Gerçek tarayıcı push bildirimi (`Notification` API).

### Düzeltilen
- Service Worker'ın cache-first stratejisinin sebep olduğu prod beyaz ekran hatası —
  SW geçici olarak devre dışı bırakıldı (kill-switch script).

## [Fine-Kinney — Profesyonel Seviye (v1)] · Phase 2

### Eklenen
- Gerçek Olasılık × Maruziyet × Şiddet hesaplaması, 5 kademeli renklendirme.
- AI destekli önlem/KKD önerisi, arama ve risk seviyesi filtresi.

## [Auth Hazırlığı & Role-Based Dashboard] · Phase 1

### Eklenen
- 3 rollü (`expert`/`employer`/`employee`) dashboard yönlendirmesi.
- Doküman türleri ve belge oluşturucu arayüzü (mock içerik).

## [Kurumsal Mimari Refaktörü] · Phase 1

### Eklenen
- Servis katmanı (`chatService`, `authService`, `documentService`, `riskService`).
- Route bazlı code-splitting, `ErrorBoundary`, ortak UI bileşenleri (`Button`, `Badge`, vb).

### Değişen
- Dağınık `useIsgData` hook'u yerine paylaşılan `IsgDataContext` — sayfalar arası veri
  senkronizasyonu düzeltildi.
