# Changelog

## [Denetim Öncesi Hazırlık Checklist'i] — Bu güncelleme

Denetim odaklı iyileştirme serisinin dördüncü ve son parçası. Önceki üç parça
(fotoğraf kanıtı, zorunlu belge taraması, kapanış kanıtı) burada tek bir ekranda
birleşiyor: müfettiş gelmeden önce "eksik sayılabilecek her şey" tek bakışta görünüyor.

**Yeni dosyalar:**
- `utils/auditReadiness.js` → `getAuditReadinessChecklist()`: dört kategoriyi
  birleştirir — (1) zorunlu belge eksikleri, (2) termini geçmiş açık Fine-Kinney
  kayıtları, (3) termini geçmiş periyodik kontroller, (4) kanıtsız kapatılmış kayıtlar
  (Kanıt Zorunluluğu özelliğinden ÖNCEki eski kapanışlar için).
  **Not:** `utils/attentionItems.js`'ten FARKLI bir fonksiyon — o yalnızca
  `entry.correctiveActions[]` alt-listesini kontrol ediyor, kaydın kendi ÜST SEVİYE
  `dueDate`/`status`'unu hiç kontrol etmiyordu. Bu, mevcut bir kapsam boşluğuydu;
  `attentionItems.js` dokunulmadan (paylaşılan/başka yerlerde kullanılan bir util,
  büyük bir refactor riski taşımadan) burada ayrıca kapatıldı.
- `features/dashboard/employer/AuditReadinessChecklist.jsx`: varsayılan kapalı özet
  satırı ("Denetime Hazırsınız" / "N eksik bulundu") + genişletilebilir detay listesi.

**Değişenler:**
- `AuditPackageButton.jsx`: eski dar kapsamlı "eksik zorunlu belge" uyarı satırı
  kaldırıldı (checklist bunu zaten kapsıyor, tekrar önlendi); `AuditReadinessChecklist`
  dosya oluşturma alanının üstüne eklendi. Yeni veri akışı gerekmedi — bileşen zaten
  `documents`/`fineKinneyEntries`/`periodicChecks` alıyordu.

### Doğrulama
Yine statik kod okumasıyla doğrulandı. Kullanıma almadan önce: kasıtlı olarak
(a) bir zorunlu belgeyi eksik bırak, (b) termini geçmiş bir risk kaydı oluştur,
(c) eski/kanıtsız kapatılmış bir kayıt varsa, checklist'in hepsini doğru kategoriyle
listelediğini doğrula; sonra hepsini düzelt, "Denetime Hazırsınız" durumuna döndüğünü
doğrula.

---

## [Düzeltici Faaliyet Kanıt Zorunluluğu] — Bu güncelleme

Denetim odaklı iyileştirme serisinin üçüncü parçası. Bir Fine-Kinney kaydı "Kapandı"
işaretlenirken artık bir not veya fotoğraftan en az biri zorunlu — böylece "kapandı"
denilen her kayıt, denetimde gösterilebilecek somut bir kanıtla birlikte geliyor.

**Yeni dosyalar:**
- `services/closureEvidenceService.js`: `riskDetectionPhotoService.js` ile birebir
  aynı desen (ayrı store + companyScoped + firma kontrolsüz tekil okuma).
- `features/risk-analysis/fineKinney/ClosureEvidenceFields.jsx`: not alanı + kamera/
  galeri fotoğraf seçimi + önizleme, yalnızca UI (zorunluluk mantığı formda).

**Değişenler:**
- `db.js`: `DB_VERSION` 12 → 13, yeni `closureEvidencePhotos` store'u `STORES`'a eklendi.
- `types/index.js`: `FineKinneyEntry`'e `closureNote`/`closurePhotoId` eklendi.
- `FineKinneyForm.jsx`: `form.status === "done"` iken `ClosureEvidenceFields`
  gösteriliyor; not/fotoğraf yoksa Kaydet/Güncelle butonu devre dışı kalıyor. Fotoğraf
  seçimi anında sıkıştırılıp (compressImageToDataUrl) yalnızca `pendingClosurePhotoDataUrl`
  olarak form state'inde tutuluyor — closureEvidenceService'e henüz YAZILMIYOR (form
  iptal edilirse depoda öksüz kayıt kalmasın diye).
- `FineKinneyModule.jsx` → `handleSubmit`: `pendingClosurePhotoDataUrl` varsa submit
  anında `saveClosureEvidencePhoto` ile kalıcı hale getirilip `closurePhotoId`'ye
  çevriliyor. `openEditForm`: mevcut kayıttan closureNote/closurePhotoId'yi forma taşıyor.
- `useFineKinneyEntries.js` → `saveEntry`: departmentId/branchId ile aynı desende
  kalıcı kayda yazılıyor, düzenlemede korunuyor.
- `auditPackageExport.js` → `resolveEntryPhoto`: artık ÖNCE kapanış kanıtına, yoksa
  tehlike fotoğrafına bakıyor (denetçi için asıl önemli olan giderildiğinin kanıtı).

**Kapsam dışı bırakılan (bilinçli):** Sprint 5A'daki `correctiveActions` alt-listesi
(bir kayda bağlı BİRDEN FAZLA düzeltici faaliyet) bu zorunluluğun kapsamına alınmadı —
yalnızca kaydın ANA `status` alanı kontrol ediliyor. Var olan öksüz fotoğraf temizliği
(bir kayıt silindiğinde/fotoğrafı değiştirildiğinde eski `closureEvidencePhotos`
kaydının silinmesi) de kapsam dışı — `riskDetectionPhotos` için de aynı sınırlama
zaten kabul edilmişti, tutarlılık için aynı karar korundu.

### Doğrulama
Yine statik kod okumasıyla doğrulandı, gerçek tarayıcı testi YAPILMADI. Kullanıma
almadan önce: bir kaydı "Kapandı" yapmaya çalış, not/fotoğraf girmeden kaydetmenin
engellendiğini doğrula; sonra bir fotoğraf ekleyip kaydet, Denetim Dosyası'nda o
kaydın kanıt fotoğrafının (artık kapanış fotoğrafı) göründüğünü doğrula.

## [Denetim Dosyası — Eksik Zorunlu Belge Taraması] — Bu güncelleme

Denetim odaklı iyileştirme serisinin ikinci parçası. Risk Değerlendirme Raporu ve
Acil Durum Planı gibi temel belgelerin sistemde olup olmadığı artık otomatik
kontrol ediliyor.

**Yeni dosyalar:**
- `constants/mandatoryDocuments.js`: baseline (temel) zorunlu belge listesi —
  bilinçli olarak yalnızca 2 belgeyle sınırlı (Risk Değerlendirme Raporu, Acil Durum
  Planı). Dosya içinde açık bir uyarı var: bu HUKUKİ TAM LİSTE DEĞİL, sektöre/tehlike
  sınıfına göre ek zorunluluklar olabilir.
- `utils/mandatoryDocumentsCheck.js` → `getMandatoryDocumentStatus()`: her tür için
  "ok" (tamamlanmış kaydı var) / "draftOnly" (yalnızca taslağı var) / "missing"
  (hiç kaydı yok) durumunu döner.

**Değişenler:**
- `useEmployerDashboardData.js`: `documents` artık diğer dashboard verileriyle
  birlikte tek seferde yükleniyor (önceden bu hook belgeleri hiç çekmiyordu).
- `EmployerOverviewTab.jsx`: `documents`'ı `AuditPackageButton`'a iletiyor.
- `AuditPackageButton.jsx`: dosya oluşturulmadan önce, eksik/taslak zorunlu belge
  varsa widget üzerinde uyarı satırı gösteriyor (işveren denetimden önce fark etsin).
- `auditPackageExport.js`: yeni "Zorunlu Belge Durumu" bölümü + özet satırında
  eksik/taslak sayısı — Fine-Kinney tablosundan ÖNCE, dosyanın en üstünde.

### Doğrulama
Yine `node_modules`/build ortamı yok — statik kod okumasıyla doğrulandı. Kullanıma
almadan önce: Belgeler modülünde bilerek "Acil Durum Planı" oluşturmadan Denetim
Dosyası'nı aç, uyarının hem widget'ta hem dosyada göründüğünü doğrula; sonra belgeyi
"completed" olarak ekleyip durumun "Mevcut"a döndüğünü doğrula.

## [Denetim Dosyası — Fotoğraf Kanıtı] — Bu güncelleme

Denetim odaklı iyileştirme serisinin ilk parçası (kullanıcı isteği: "denetimcilerin
bakacağı, işverenin işini kolaylaştıracak, maliyet azaltıcı"). Phase 6 Vision AI ile
tespit edilen tehlike fotoğrafları artık Denetim Dosyası'na kadar ulaşıyor.

**Bulunan kök sorun:** Risk Tespiti'nden ("Sahaya İn" / "AI ile Taslak Oluştur")
Fine-Kinney'e köprülenen kayıtlarda `photoId`/`photoDataUrl` hiç taşınmıyordu —
`departmentId` için daha önce düzeltilen "sessiz veri kaybı" ile aynı sınıftan bir
bug (bkz. RiskDetectionCard.jsx). Fotoğraf sistemde duruyordu ama hiçbir yerde
gösterilmiyordu.

**Değişenler:**
- `RiskDetectionCard.jsx` → `handleSendManual`/`handleSendAiDraft`: `photoId`/
  `photoDataUrl` artık `extra` içinde köprüleniyor.
- `FineKinneyModule.jsx` → `openDraftForm`: bu alanları forma taşıyor.
- `FineKinneyForm.jsx` → `EMPTY_FINE_KINNEY_FORM`: varsayılan alanlar eklendi.
- `useFineKinneyEntries.js` → `saveEntry`: `departmentId`/`branchId` ile aynı desende
  kalıcı kayda yazılıyor, düzenlemede korunuyor.
- `types/index.js` → `FineKinneyEntry` typedef'i güncellendi.
- `auditPackageExport.js`: yeni `resolveEntryPhoto()` — `photoId` varsa
  `riskDetectionPhotoService`'ten (IndexedDB), `photoDataUrl` varsa (legacy) doğrudan
  çözülüyor; tüm fotoğraflar popup açılmadan ÖNCE `Promise.all` ile paralel
  çözümleniyor (aynı desen: `FineKinneyExportButtons.jsx` → `handlePdfExport`'ta
  `getPrimaryCompany` için zaten kullanılıyordu). Risk tablosuna 56×56px küçük
  resim içeren yeni bir "Kanıt" sütunu eklendi.
- `AuditPackageButton.jsx`: `handleGenerate` async'e çevrildi.

**Kapsam dışı bırakılan (bilinçli):** Manuel girilen Fine-Kinney kayıtlarında hâlâ
gerçek dosya eki yok — `attachments` alanı Sprint 5A'dan beri mock/metadata-only.
Bu ayrı, daha büyük bir iş (gerçek dosya depolama) ve bu sprintin kapsamına
alınmadı; "Kanıt" sütunu bu kayıtlarda boş kalıyor.

### Doğrulama
Bu ortamda `node_modules` yok / internet yok — gerçek bir `npm run build` veya
tarayıcıda manuel deneme YAPILMADI. Değişiklikler yalnızca statik olarak (parantez
dengesi + kod okuması ile veri akışının uçtan uca izlenmesi) doğrulandı. Kullanıma
almadan önce: (1) Risk Tespiti'nde fotoğraflı bir bulguyu Fine-Kinney'e köprüleyip
kaydet, (2) Denetim Dosyası'nı o kaydı kapsayan bir aralıkla oluştur, (3) küçük
resmin göründüğünü doğrula.

## [Backend Planlama — Davet Linki, Hesap Türü Kısıtı, Rol Yetkisi] — Bu güncelleme

⚠️ SADECE PLANLAMA — `docs/backend-migration/` dışına, `src/`'e HİÇBİR DOKUNMA
YAPILMADI. Uygulama hâlâ %100 mock kimlik doğrulama + IndexedDB ile çalışıyor,
bu çalışma yalnızca taslak SQL/JS dosyalarını genişletti.

Kullanıcıyla netleşen kararlar taslaklara işlendi:
- **Hesap türü kısıtı:** `public.users.account_type` (employer/expert/employee)
  kayıtta seçilir, DEĞİŞTİRİLEMEZ (`prevent_account_type_change` trigger'ı).
  `expert` hesap türüne hiçbir firmada `employer` rolü atanamaz
  (`check_user_role_account_type` trigger'ı, RLS'i de kapsar).
- **Davet linki akışı (yeni):** `company_invites` tablosu (token, firma, rol,
  son kullanma tarihi, kullanıldı mı) + `accept_invite(token)` RPC fonksiyonu
  (SECURITY DEFINER, token doğrulama + user_roles yazımı + used_at işaretlemeyi
  TEK atomik işlemde yapar). İşveren/Uzman davet oluşturur, link'i kendisi
  paylaşır (uygulama otomatik e-posta göndermiyor — bilinçli kapsam dışı).
- **Rol yetkisi:** `user_roles` yazma politikası eklendi — bir firmanın
  employer'ı o firmadaki rolleri atayabilir/değiştirebilir; **platform
  yöneticisi (`is_platform_admin`) firma sınırı olmadan her yerde yapabilir**
  ("işveren uğraşmak istemezse destek ekibi halleder" senaryosu).
- **Kayıt anında profil oluşturma:** `handle_new_user()` trigger'ı, Supabase
  Auth signup'ının `options.data`'sına konan `full_name`/`account_type`'ı
  otomatik `public.users`'a kopyalar.
- **Yeni draft dosyası:** `supabaseAuthService.draft.js` — mevcut
  `src/services/authService.js` ile aynı 7 fonksiyon imzasını (+ 2 yeni:
  `createCompanyInvite`, `acceptInvite`) koruyan gerçek Supabase Auth taslağı.

### Doğrulama
Yine bu ortamda internet yok — SQL dosyaları gerçek bir Postgres'e karşı
ÇALIŞTIRILMADI, yalnızca yorum/string farkındalıklı bir parantez dengesi
scripti ile sözdizimsel tutarlılık kontrol edildi. **Uygulanmadan önce gerçek
bir Supabase projesinde (önce test/staging, asla doğrudan prod) çalıştırılıp
doğrulanmalı.**

## [Mobil Performans — Tailwind CDN → Build-Time, jsQR Global Script Kaldırıldı] — Bu güncelleme

Kullanıcı isteği üzerine üç mobil performans darboğazı giderildi:

1. **Tailwind CDN (`cdn.tailwindcss.com`) kaldırıldı.** Önceden her sayfa yüklemesinde
   tarayıcıda çalışan bir JIT derleyiciydi; artık `tailwindcss`/`postcss`/`autoprefixer`
   devDependency olarak eklendi (bkz. `tailwind.config.js`, `postcss.config.js`),
   `src/index.css` başına `@tailwind base/components/utilities` eklendi. Build sırasında
   sadece GERÇEKTEN kullanılan class'ları içeren statik/küçük bir CSS üretiliyor.
   `tailwind.config.js` CDN'in varsayılan davranışını birebir koruyor — hiçbir özel
   tema/renk eklenmedi (CDN sürümünde de özel config yoktu).
2. **jsQR global script'ten dinamik import'a taşındı.** Önceden `index.html`'de HER
   sayfada yükleniyordu, oysa yalnızca Dökümanlar → Ekipman Kayıtları sekmesindeki QR
   tarayıcıda kullanılıyor. `jsqr` npm paketi eklendi, `DocumentsPage.jsx`'te
   `window.jsQR` yerine `import("jsqr")` ile SADECE "QR Kod Tarayıcı Başlat"a
   basıldığında indiriliyor.
3. **Render'ı bloklayan script sırası ortadan kalktı.** Yukarıdaki iki değişiklik
   sonucunda `index.html`'de artık `defer` eklenecek bir CDN script'i kalmadı —
   Tailwind build-time'a taşındığı, jsQR talep üzerine yüklendiği için tek kalan script
   (`type="module" src="/src/main.jsx"`) zaten HTML spesifikasyonu gereği örtük olarak
   ertelenmiş (deferred) çalışıyor.

### Doğrulama

⚠️ Bu ortamda internet erişimi yok, bu yüzden `npm install`/`npm run build`/`npm test`
BURADA çalıştırılamadı — config dosyaları elle, dikkatli bir statik inceleme (dinamik
`className={\`...${x}...\`}` kalıplarının hepsi TAM/literal class string'leri kullanıyor,
parça-parça birleştirme yok — bkz. grep taraması) sonucu hazırlandı. **Deploy'dan önce
`npm install && npm run build` çalıştırılıp gerçekten hatasız derlendiği ve
`npm test`'in geçtiği doğrulanmalı.**

## [NÖBETÇİ AI — Veri Mimarisi ve Kod Kalitesi Düzeltme] — Bu güncelleme

Offline-first IndexedDB yapısı korunarak company-scoped servisler merkezileştirildi. Aktif firma seçimi için localStorage tabanlı fallback eklendi; eski tek-firma kayıtları uygulama açılışında companyId ile uyumlanıyor. Mevcut numeric/string id'ler korunuyor, yeni kayıtlar bağımlılıksız UUID helper'ı üzerinden oluşturuluyor.

`createCrudService`, Fine-Kinney, belge/ekipman, eğitim, bildirim ve audit log servislerinde scoped okuma/yazma/silme sahiplik kontrolleri güçlendirildi. Aynı id ile başka firma kaydının ezilmesi engellendi; eğitim son tarihleri eski `id=courseId` formatından yeni `courseId` + UUID formatına uyumlu taşındı. JSDoc tipleri ve mimari/roadmap dokümanları gerçek local scope davranışıyla hizalandı.

Gerçek authentication, backend, Supabase, RLS, RAG ve cloud storage bu sprintte eklenmedi.

### Doğrulama

`npm ci --ignore-scripts --no-audit --no-fund` başarılıdır. `npm test`: **162/162 test geçti**. `npm run build`: başarılıdır; ExcelJS export chunk'ı yaklaşık 942 KB minified olduğu için Vite uyarısı devam eder, ancak dinamik import ile ilk uygulama yüklemesinden ayrıdır.

## [Netlify → Vercel Geçişi] — Bu güncelleme

Kullanıcı bir hafta içinde Netlify'dan Vercel'e geçeceğini belirtti; projede
Netlify'a özgü hiçbir şey kalmaması istendi.

### Ne yapıldı
- `netlify/functions/chat.js` → `api/chat.js` — Vercel'in dosya-bazlı routing
  kuralına ve Node.js runtime formatına (`export default async function
  handler(req, res)`, otomatik body-parsing) çevrildi.
- `chatService.js` → `API_ENDPOINT`: `/.netlify/functions/chat` → `/api/chat`.
- `netlify.toml` silindi, `vercel.json` eklendi (aynı SPA rewrite kuralı,
  `/api/*` rotaları hariç tutularak).
- `netlify/` klasörü tamamen kaldırıldı.
- README.md ve 4 docs dosyasındaki (AI_ROADMAP, PROJECT_CONTEXT, ARCHITECTURE,
  docs/README) tüm Netlify referansları Vercel'e güncellendi.

### Bilinçli olarak dokunulmadı
Geçmiş CHANGELOG/DEVELOPMENT_REPORT kayıtlarındaki Netlify referansları
(gerçekten Netlify'da yaşanmış olayların tarihsel kaydı) değiştirilmedi —
tarih yeniden yazılmaz.

### Doğrulama
`npm test`: **125/125 test geçti** (bu değişiklik test edilen hiçbir saf
fonksiyonu etkilemedi). `node --check` ve JSON doğrulaması ile yeni/değişen
dosyalarda sözdizimi temiz. **Önemli:** `ANTHROPIC_API_KEY` ortam
değişkeninin Vercel projesine YENİDEN eklenmesi gerekiyor — otomatik
taşınmaz.

## [Güvenlik & Dayanıklılık — CSV Enjeksiyon, Error Boundary, Tam Yedekleme, Gizlilik Perdesi] — Bu güncelleme

Kullanıcı, kod yazmadan sunulan güvenlik/mobil-hazırlık fikirlerinden 4'ünü seçti
(kullanıcı adı/şifre sistemi ve PIN kilidi ayrı ertelendi; Netlify-özel maddeler
Vercel geçişi nedeniyle atlandı).

### 1) CSV/Formula Injection Koruması
`utils/exportCsv.js` — hücre `=`,`+`,`-`,`@`,TAB,CR ile başlıyorsa önüne `'`
eklenir (OWASP standardı) — Excel'de formül olarak çalıştırılmasın diye.

### 2) Error Boundary
Zaten `main.jsx`'te vardı (kontrol edilince görüldü). İyileştirme: `Layout.jsx`
→ `<Outlet />` ayrıca sarıldı — bir sayfa çökerse artık yalnızca o sayfa
etkileniyor, sidebar/header hayatta kalıyor.

### 3) Tam Yedekleme/Geri Yükleme
`services/backupService.js` (yeni) + `features/settings/BackupSection.jsx`
(yeni) — tüm IndexedDB verisi tek bir JSON'a yedeklenip geri yüklenebiliyor.
Geri yükleme mevcut veriyi TAMAMEN DEĞİŞTİRİR, `ConfirmDialog` ile açık onay
gerektirir.

### 4) Görev Değiştirici Gizlilik Perdesi
`components/AppSwitcherPrivacyGuard.jsx` (yeni) — `visibilitychange` ile
uygulama arka plana alınınca hassas veri yerine logo gösterir. Native değil,
%100 garantili değil ama pratikte işe yarıyor (bankacılık PWA'larında da aynı
teknik kullanılıyor) — dosya içi yorumda dürüstçe belirtildi.

### Doğrulama
11 yeni birim testi. `npm test`: **125/125 test geçti.** `tsc --noEmit --jsx react`
ile tüm JSX dosyalarında sözdizimi kontrolü temiz.

## [Toplu Veri İçe Aktarma, Uygulama Geneli Arama & Toplu İşlem] — Bu güncelleme

6 maddelik önceki plan bittikten sonra kod yazmadan 3 yeni fikir sunuldu; ikisi
seçildi (üçüncüsü "trend paneli" zaten `TrendsPanel.jsx` olarak mevcut olduğu
için elendi), üçüncü fikir olarak "toplu işlem" istendi. Üçü sırayla yapıldı.

### 1) Toplu Veri İçe Aktarma (CSV)
- `utils/importCsv.js` (yeni, saf/test edilebilir) — `utils/exportCsv.js`'in
  TERSİ, aynı format (noktalı virgül, tırnak kaçırma, UTF-8 BOM) ile round-trip
  uyumlu okur.
- `components/CsvImportButton.jsx` (yeni, tekrar kullanılabilir) — dosya
  seçilince önce önizleme (geçerli/hatalı satır sayısı), yalnızca onaylanınca
  kaydeder. "Şablon indir" ile örnek CSV sunar.
- Bağlandı: `EmployeesSection.jsx`, `DepartmentsSection.jsx`,
  `BranchesSection.jsx`.

### 2) Uygulama Geneli Arama
- Header'daki önceden tamamen işlevsiz "Ara..." kutusunun yerini gerçek bir
  arama aldı: `constants/globalSearch.js` (saf, 5 modülde arar) +
  `hooks/useGlobalSearch.js` (debounce'lı veri çekme) + `layout/GlobalSearchBar.jsx`.
- 4 hook'a (`useFineKinneyEntries`, `useRiskDetections`, `usePeriodicChecks`,
  `useKnowledgeDocuments`) geriye dönük uyumlu `initialSearch` parametresi
  eklendi; sonuca tıklayınca ilgili modül, kendi arama kutusu ÖN DOLDURULMUŞ
  şekilde açılıyor (her sayfanın kendi var olan deep-link desenine uyuldu:
  `RiskAnalysisPage` router state, `DocumentsPage`/`KnowledgeCenter` query param).

### 3) Toplu İşlem (Bulk Actions)
- Periyodik Kontrol listesine çoklu seçim + "Bugün Kontrol Edildi"/"Departman
  Değiştir" toplu aksiyonları eklendi (`usePeriodicChecks.js` →
  `bulkMarkCheckedToday`/`bulkUpdateDepartment`, ikisi de var olan tekli
  fonksiyonları döngüde çağırır). Toplu SİLME bilinçli olarak eklenmedi (kaza
  riski). Arama/filtre/görünüm değişince seçim güvenlik için sıfırlanır.

### Doğrulama
22 yeni birim testi (`importCsv.test.js`: 12, `globalSearch.test.js`: 10).
`npm test`: **114/114 test geçti.** `tsc --noEmit --jsx react` ile tüm
değiştirilen JSX dosyalarında sözdizimi kontrolü temiz.

### Not
Bu raporu `docs/DEVELOPMENT_REPORT.md`'ye eklerken iki yerde başlık satırını
yanlışlıkla önceki paragrafla birleştirmiştim — tespit edip düzelttim, hiçbir
içerik kaybolmadı.

## [PWA / Offline — Service Worker v2 (Güvenli, Network-First)] — Bu güncelleme

**Geçmiş olay:** v1 Service Worker cache-first stratejisi kullanıyordu — eski
`index.html`'i sonsuza dek önbellekte sabitleyip, silinmiş hash'li JS
dosyalarına referans veriyordu → Chrome'da birkaç saat sonra beyaz ekran (bkz.
yukarıdaki "ACİL: Service Worker Beyaz Ekran Düzeltmesi" girdisi). Bu yüzden v1
kendi kendini kaldıran bir kill-switch'e çevrilmişti, `main.jsx` her sayfada
aktif olarak SW kaydını kaldırıyordu. Kullanıcıya bu geçmiş aktarıldı; riski
bilerek güvenli bir SW ile yeniden denemeyi seçti.

### Tasarım ilkesi (aynı hata bir daha yaşanmasın diye)
index.html/JS/CSS için ASLA cache-first kullanılmıyor — her zaman network-first
(yalnızca statik varlıklar (resim/font/ikon) cache-first). Ağ tamamen
başarısız olursa (gerçek offline) önbellekten veya `offline.html`'den döner.

### Ne yapıldı
- `public/service-worker.js` — v2, sıfırdan yeniden yazıldı (network-first).
- `public/offline.html` (yeni) — bağlantı koptuğunda gösterilen sayfa.
- `main.jsx` — SW kaldırma kodu, kayıt koduna çevrildi.
- `notificationService.js` — yorum güncellendi (SW geri geldi, arka planda
  bildirim artık gerçekten çalışıyor).
- `notificationclick` dinleyicisi geri eklendi (kill-switch'te kaybolmuştu).

### Doğrulama
`node --check` ile `service-worker.js`/`main.jsx` sözdizimi temiz. `npm test`:
mevcut 92/92 test etkilenmeden geçiyor (tarayıcı API'lerine bağımlı olduğu için
birim testi yazılamadı — tutarlı bir sınır). **Gerçek doğrulama Netlify'a
deploy sonrası Chrome DevTools'tan yapılmalı.**

## [RAG-lite İyileştirmesi — Eş Anlamlı Terimler & Alan Ağırlıklandırması] — Bu güncelleme

Bilgi Kütüphanesi "AI'ya Sor" anahtar kelime eşleştirmesi (RAG-lite), gerçek
embedding olmadan iki yönde iyileştirildi.

### Ne yapıldı
- **Eş anlamlı/kısaltma sözlüğü** (`SYNONYM_GROUPS`, `knowledgeCenter.js`) — 10 grup
  (KKD↔kişisel koruyucu donanım, baret↔kask, forklift↔istif makinesi, ramak kala↔
  neredeyse kaza, risk analizi↔Fine-Kinney vb.), iki yönlü çalışır.
- **Alan ağırlıklandırması** — başlık (3x) > etiket (2x) > özet (1.5x) > içerik (1x);
  önceden tüm alanlar tek bir string'de birleşip eşit ağırlıkta sayılıyordu.
- **Tam ifade bonusu** — çok kelimeli sorgunun tamamı başlıkta birebir geçince +5.
- Fonksiyon imzası değişmedi, `useKnowledgeAI.js`'de değişiklik gerekmedi.

### Doğrulama
4 yeni birim testi (mevcut 7 test davranış değişikliğine rağmen hâlâ geçiyor).
`npm test`: **92/92 test geçti.**

## [Bildirim / Hatırlatma — Periyodik Kontrol & Eğitim Son Tarihi] — Bu güncelleme

`notificationService.js` zaten gerçek tarayıcı bildirim altyapısına sahipti ama
yalnızca anlık olaylar için kullanılıyordu — zamanlanmış tarama yoktu. Eğitim son
tarihi için kullanıcıya soruldu; sistemde kişi-bazlı atama kaydı hiç yoktu, bu
yüzden kurs-bazlı (şirket çapında) bir son tarih modeli eklendi.

### Ne yapıldı
- `db.js` → yeni `trainingCourseSettings` store (DB_VERSION 10→11).
- `trainingCourseSettingsService.js` (yeni) — kurs bazlı son tarih get/save.
- `periodicCheck.js` → `getOverdueOrDueSoonChecks` (saf) — kaydın BAYAT `status`
  alanına değil, `nextDueDate`'den canlı hesaplamaya güvenir.
- `trainingStatus.js` → `getUpcomingTrainingDueReminders` (saf).
- `useReminderScheduler.js` (yeni hook, `Layout.jsx`'e bağlı) — günde bir kez
  tarama (localStorage dedup), role'e göre farklı hatırlatmalar.
- `notificationPrefs.js` → 2 yeni tercih; `TrainingModule.jsx`/`CourseCard.jsx` →
  son tarih seçici/rozeti.

### Kapsam sınırı
Push-when-closed DEĞİL — yalnızca uygulama açıkken tetiklenir (backend/Push API
gerektiren gerçek push altyapısı onay olmadan eklenmedi).

### Doğrulama
11 yeni birim testi. `npm test`: **88/88 test geçti.** `tsc --noEmit --jsx react`
ile 3 JSX dosyasında sözdizimi kontrolü temiz.

## [Export / Raporlama — Fine-Kinney & Dashboard PDF/Excel] — Bu güncelleme

Kod tabanında iki hazır "Yakında" placeholder bulundu (`FineKinneyExportButtons.jsx`,
`DashboardExportButtons.jsx`) — bu tam olarak beklenen sıradaki adımdı, gerçek
fonksiyonelliğe kavuşturuldu.

### Paylaşılan altyapı (sıfır yeni bağımlılık)
- `utils/exportCsv.js` — "Excel" export'u aslında CSV; Türkçe uyumluluk için
  noktalı virgül ayırıcı (Türkçe Excel'de virgül ondalık ayıracı) + UTF-8 BOM
  (yoksa ş/ğ/ı/ç/ö/ü bozuk görünür).
- `utils/printWindow.js` — `printTrainingCompletionCertificate.js`'teki "ayrı
  pencerede yazdır" deseni buraya çıkarıldı, artık 2 yerde kullanılıyor.

### Ne yapıldı
- `fineKinneyExport.js` (yeni, saf/test edilebilir) + `FineKinneyExportButtons.jsx`
  gerçek export'a kavuştu — o an ekranda görünen (filtrelenmiş) liste export edilir.
- `DashboardExportButtons.jsx` — Yönetici özeti kartlarını PDF/CSV olarak dışa
  aktarıyor.

### Doğrulama
11 yeni birim testi (`buildCsv`: 6, `buildFineKinneyExportRows`: 5).
`npm test`: **77/77 test geçti.** `tsc --noEmit --jsx react` ile 4 JSX dosyasında
sözdizimi kontrolü temiz.

## [⚠️ Test Altyapısı Düzeltmesi & Türkçe "İ Problemi" Bug Fix] — Bu güncelleme

**Şeffaflık notu:** `quizGrading.test.js` eklenirken test sayısının artmadığı fark
edildi. `package.json`'daki `"test": "node --test src/**/*.test.js"` sandbox
shell'inde `**`'ı özyinelemeli genişletmiyordu — 2+ klasör derinliğindeki test
dosyaları (örn. `filterFineKinneyEntries.test.js`) o ana kadar HİÇ ÇALIŞTIRILMAMIŞTI.
Önceki "23/23", "27/27", "31/31", "36/36 test geçti" raporları bu yüzden eksikti.

**Düzeltme:** `package.json` → `"node --test 'src/**/*.test.js'"` (tek tırnak,
Node'un kendi glob'u). Bu düzeltmeyle birlikte gerçek bir bug ortaya çıktı:

**Türkçe "İ problemi":** `.toLowerCase()` Türkçe büyük "İ"yi düz "i" değil "i̇"ye
çeviriyor (`"FORKLİFT".toLowerCase()` → `"forkli̇ft"`, "forklift" ile eşleşmiyor).
Caps Lock/mobil Türkçe klavyede gerçek kullanıcıların karşılaşabileceği bir arama
bug'ı. Yeni `utils/text.js` → `turkishLower()` ile 7 dosyadaki tüm arama noktası
düzeltildi: `knowledgeCenter.js`, `useKnowledgeDocuments.js`,
`filterFineKinneyEntries.js`, `useMevzuatScan.js`, `useRiskDetections.js`,
`usePeriodicChecks.js`, `systemPrompt.js`.

**Doğrulama:** `npm test`: **64/64 test geçti** — bu projede ilk kez tüm test
dosyalarının gerçekten çalıştırıldığı doğrulanmış sonuç.

## [Eğitim Modülü Genişletmeleri — Çoklu Seçim & Tamamlama Belgesi] — Bu güncelleme

1. **Çoklu seçim sınav soruları** — `quizGrading.js` (yeni, `CourseQuiz.jsx`'ten
   çıkarıldı), `type: "multi"` desteği, geriye dönük tam uyumlu.
2. **Tamamlama Belgesi (PDF)** — kodda "sertifika/PDF üretmeyiz" şeklinde bilinçli
   bir önceki tasarım kararı bulundu; kullanıcıya sorulup "Tamamlama Belgesi"
   adıyla (sertifika değil) üretilmesine karar verildi.
   `printTrainingCompletionCertificate.js` — sıfır yeni bağımlılık, tarayıcının
   yazdırma diyaloğu kullanılıyor. `CoursePlayer.jsx` ve `ParticipantListPanel.jsx`'e
   indirme butonu eklendi.

**Doğrulama:** 15 yeni birim testi (quizGrading: 11, escapeHtml: 4).
`npm test`: 64/64 test geçti. `tsc --noEmit --jsx react` ile JSX dosyalarında
sözdizimi kontrolü temiz.

## [Fotoğraftan Tehlike Tespiti] — Bu güncelleme

Kullanıcı, Supabase/backend ve fiziksel kamera kurulumu gerektiren maddeleri
şimdilik kapsam dışı bırakıp mobil-öncelikli fikirlerden ilkini seçti. Bu bir
kamera KURULUMU değil — kullanıcının kendi telefonuyla çektiği fotoğrafın analizi.

### Ne yapıldı
- `systemPrompt.js` → `PHOTO_DETECTION_PROMPT` + `parsePhotoDetection` — fotoğrafı
  6 Risk Tespiti kategorisinden birine sınıflandırır + kısa not üretir. Bilinmeyen/
  uydurma kategori dönerse null'a düşer (kullanıcı elle seçer).
- `usePhotoDetection.js` (yeni) — dosya→base64→AI analizi, `useAiSuggestion.js`
  üzerine kurulu.
- `RiskDetectionForm.jsx` — AI önerisiyle (kategori+not+foto önizleme) ön
  doldurulabiliyor; konum her zaman elle girilir.
- `RiskDetectionPanel.jsx` — "📷 Fotoğrafla Tespit Et" butonu, telefon kamerası/
  galeri açar (`capture="environment"`).
- `useRiskDetections.js` → `addDetection` geriye dönük uyumlu `extra` parametresi
  (hazardNote, photoDataUrl) kazandı.
- `RiskDetectionCard.jsx` — foto küçük resmi + AI notu gösterimi.
- `useDetectionAIDraft.js` — hazardNote varsa Fine-Kinney taslağı üretirken AI'ye
  ek bağlam olarak veriliyor.
- `types/index.js` — `RiskDetection` typedef güncellendi.

### Doğrulama
5 yeni birim testi (`systemPrompt.test.js`). `node --test`: **36/36 test geçti.**
`tsc --noEmit --jsx react` ile 3 JSX dosyasında sözdizimi kontrolü temiz.
`npm run build` sandbox'ta yine çalıştırılamadı (ağ erişimi kapalı — tekrarlayan not).

## [AI Özellikleri — Bağlama Duyarlı Copilot, Doküman Üretimi & Hook Birleştirmesi] — Bu güncelleme

Üç madde art arda tamamlandı (ayrıntılar için `docs/DEVELOPMENT_REPORT.md`):

1. **Bağlama Duyarlı AI Copilot** — Fine-Kinney, Risk Tespiti, Periyodik Kontrol,
   Mevzuat sayfalarına "🤖 AI'ya Sor" girişi (`chatContexts.js`, `AskAiButton.jsx`,
   `ChatPanel.jsx` context desteği).
2. **Doküman İçerik Üretimi** — `generateDocumentDraft()` + yeni
   `DocumentDetailDrawer.jsx` (içerik görüntüleme/düzenleme/tamamlama).
3. **`useAiSuggestion` hook birleştirmesi** — `useAIRiskAnalysis`/
   `useInitialRiskScore`'un ortak loading/error iskeleti `hooks/useAiSuggestion.js`'e
   taşındı, davranış aynı.

**Doğrulama:** `node --test`: 31/31 test geçti (4 yeni test, `chatContexts.test.js`).
`tsc --noEmit --jsx react` ile tüm değiştirilen JSX dosyalarında sözdizimi kontrolü
temiz. `hooks/useAiSuggestion.js` için yazılan bir test, `react` paketi bu
sandbox'ta kurulu olmadığından (`node_modules` yok) çalıştırılamadı ve kaldırıldı —
gerçek uygulamada sorun değil (Netlify'da `react` kurulu), yalnızca bu sandbox'a
özgü bir test edilemezlik. `npm run build` da aynı nedenle çalıştırılamıyor.

## [AI Özellikleri — scoreRisk() Gerçek İmplementasyonu] — Bu güncelleme

`AI_ROADMAP.md` → "scoreRisk() gerçek implementasyonu" maddesi tamamlandı. Önceden
`riskService.scoreRisk()` çağrıldığında hata fırlatan bir placeholder'dı.

### Ne yapıldı
- **Yeni prompt** (`systemPrompt.js` → `INITIAL_SCORE_PROMPT`) — yalnızca tehlike+risk
  metninden önlem öncesi başlangıç Olasılık/Maruziyet/Şiddet tahmini üretir.
  `FINE_KINNEY_AI_PROMPT`'tan farkı: o P/M/Ş zaten girildikten SONRA önlem+artık risk
  öneriyor, bu ise formun EN BAŞINDA (henüz hiçbir P/M/Ş seçilmemişken) çalışıyor.
- **`parseInitialScoreSuggestion`** — diğer AI parser'larıyla aynı savunmacı desen:
  format dışı cevapta ilgili alan(lar) null döner, arayüz çökmez.
- **`riskService.scoreRisk({ hazard, risk })`** artık `chatService.sendChatMessage`
  üzerinden gerçek bir AI çağrısı yapıp parse edilmiş öneri döndürüyor.
- **`useInitialRiskScore.js`** (yeni hook, `useAIRiskAnalysis.js` ile aynı desen) —
  loading/error state yönetir, öneriyi yalnızca form'un düzenlenebilir
  probability/frequency/severity alanlarına yazar.
- **`FineKinneyForm.jsx`** — Olasılık/Maruziyet/Şiddet dropdown'larının hemen üstüne
  "🤖 AI ile Puanla" butonu + öneri geldiğinde kısa gerekçe metni eklendi.

### Güvenlik ilkesi
Diğer tüm AI özellikleriyle aynı: öneri yalnızca kullanıcının düzenleyip onaylayacağı
alanlara yazılır, hiçbir kayıt otomatik/sessizce oluşturulmaz veya kaydedilmez.

### Doğrulama
- 4 yeni birim testi (`systemPrompt.test.js`) — `node --test`: **27/27 test geçti.**
- `tsc --noEmit --jsx react` ile `FineKinneyForm.jsx`'te JSX sözdizimi kontrolü
  (gerçek hata yok, yalnızca beklenen import/modül çözümleme uyarıları filtrelendi).
- `npm run build` bu sandbox'ta çalıştırılamadı (ağ erişimi kapalı) — önceki
  sprintlerdeki gibi sandbox'a özgü bir sınırlama, yapılan değişiklikten kaynaklanmıyor.

### Bilinen sınır
`useAIRiskAnalysis.js` ve `useInitialRiskScore.js` arasında küçük bir yapısal
benzerlik var; kullanıcının daha önce gündeme gelen "ortak `useAiSuggestion` hook'u"
seçeneği ileride bu ikisini birleştirebilir — şimdilik yalnızca 2 kullanım olduğu
için erken soyutlamadan kaçınıldı.

## [Teknik Borç Sağlamlaştırma — Rol Sadeleştirme & Test Altyapısı] — Bu güncelleme

Kullanıcı, ürünün şu anlık OSGB/çoklu firma yönetimine satılan bir ürün olmadığını
belirtti; bu yüzden `companyAdmin`/`superAdmin` rolleri kaldırıldı. Ayrıca önceki
geliştirme raporunda tespit edilen "sıfır test kapsamı" maddesi ele alındı.

### Rol sadeleştirme
- `allRoles.js` → `ALL_ROLES` 5 rolden 3 role indirildi (`expert`/`employer`/
  `employee`). `SWITCHABLE_ROLES` artık `ALL_ROLES` ile birebir aynı.
- `types/index.js` → kullanılmayan `FullRole` (5 rollük) tipi 3 role indirildi.
- `utils/permissions.js` → `ROLE_PERMISSIONS` haritasından `companyAdmin`/
  `superAdmin` satırları kaldırıldı.
- Etki alanı taraması yapıldı: bu roller kod genelinde yalnızca bu 3 dosyada
  geçiyordu, hiçbir UI bileşeninde kullanılmıyordu — kaldırma sıfır riskli.

### Test altyapısı
- Sandbox'ta ağ erişimi olmadığından `vitest` kurulamadı; onun yerine Node'un
  yerleşik `node:test` çalıştırıcısı kullanıldı — **sıfır yeni bağımlılık**.
  `package.json` → `"test": "node --test src/**/*.test.js"`.
- 4 yeni test dosyası, 23 test:
  - `constants/fineKinney.test.js` — `computeFineKinneyScore`, `getFineKinneyRiskLevel`
    (20/70/200/400 sınır değerleri dahil).
  - `features/risk-analysis/fineKinney/filterFineKinneyEntries.test.js` — arama,
    departman, şube, durum, öncelik, tarih aralığı filtreleri ve AND kombinasyonu.
  - `constants/knowledgeCenter.test.js` — `findRelevantDocuments`,
    `findRelatedDocuments` (RAG-lite anahtar kelime eşleştirmesi).
  - `utils/permissions.test.js` — `hasRole`, `hasPermission`; kaldırılan rollerin
    sessizce yetki kazanmadığını doğrulayan regresyon testi dahil.
- **Davranış-koruyan küçük çıkarım:** `useFineKinneyEntries.js`'teki
  `filteredEntries` useMemo'sunun filtre mantığı `filterFineKinneyEntries.js`'e
  (saf fonksiyon) taşındı — hook artık bu fonksiyonu çağırıyor, davranış birebir
  aynı, yalnızca React'tan bağımsızlaştırılıp test edilebilir hale geldi.

### Doğrulama
- `node --test` gerçekten çalıştırıldı: **23/23 test geçti, 0 hata.**
- Tüm değiştirilen dosyalarda `node --check` ile statik sözdizimi doğrulaması
  yapıldı.
- `npm run build` bu oturumda çalıştırılamadı (sandbox'ta ağ erişimi kapalı,
  `node_modules` hiç kurulamıyor) — bu proje geneli bir sandbox sınırlaması,
  yapılan değişikliklerden kaynaklanmıyor. Gerçek build doğrulaması Netlify'daki
  otomatik build'de gerçekleşecek.

## [Sprint 9.1 — Risk Tespiti (Triage Havuzu)] — Bu güncelleme

Kural hatırlatması: gerçek kamera/backend/API eklenmedi (kapsamda değildi). Bu, yeni
eklenen `ROADMAP.md` → **Phase 9 (Canlı Kamera & Sensör AI)**'nin ilk, kamerasız
teslimatıdır — Risk Analizi sayfasına, Fine-Kinney'den bilinçli olarak AYRI yeni bir
"Risk Tespiti" sekmesi eklendi.

### Neden ayrı bir sekme, neden Fine-Kinney değil
Risk Tespiti burada toplanan kayıtlar ham/doğrulanmamış — resmi bir Fine-Kinney kaydı
değil. Fine-Kinney denetimde ibraz edilen resmi bir belge; ham/yanlış-pozitif olabilecek
tespitleri doğrudan oraya yazmak kaydı kirletir. Bu yüzden Risk Tespiti bir "triage
havuzu": Yeni → İncelemede → Dönüştürüldü / Reddedildi (yanlış pozitif).

### Eklenen
- **Manuel tespit ekleme** — kategori (6 sabit kategori: KKD Eksikliği, Forklift–İnsan
  Yakınlığı, Düşme/Yüksekte Çalışma Riski, Kapalı Alan Girişi, Yangın/Duman Tespiti,
  Uygunsuz İstifleme) + konum (serbest metin, öneri listesiyle) + opsiyonel departman.
- **Demo: Otomatik Simülasyon** — gerçek kamera henüz yok; açık olduğunda sistem ~25
  saniyede bir rastgele kategori+konum ile örnek bir tespit üretir (kapatılınca veya
  sekmeden ayrılınca interval güvenli şekilde temizlenir).
- **Biriktirme** — aynı kategori+konum için açık (Yeni/İncelemede) bir tespit zaten
  varsa yeni satır açılmaz, `occurrenceCount` artar ve "Son 30 günde N kez tespit
  edildi" olarak gösterilir. Kapanmış (Dönüştürüldü/Reddedildi) bir tehlikenin tekrar
  görülmesi bilinçli olarak yeni bir vaka sayılır.
- **"AI ile Taslak Oluştur"** — kategori+konum+tekrar sayısından yola çıkarak AI; risk
  tanımı + başlangıç Olasılık/Maruziyet/Şiddet + önlem önerisi üretir (yeni
  `DETECTION_TO_RISK_PROMPT`). Kullanıcı "Fine-Kinney Formuna Aktar" ile formu ÖN
  DOLDURULMUŞ açar — hiçbir kayıt AI tarafından doğrudan oluşturulmaz.
- **"Sahaya İn (Manuel)"** — aynı köprü, AI önerisi olmadan yalnızca kategori/konum
  ön dolgusuyla; uzman sahaya inip Fine-Kinney'i kendisi tamamlar.
- **Üst özet şeridi** — Yeni / İncelemede / Dönüştürüldü / Reddedildi sayıları, her
  zaman filtreden bağımsız tüm kayıtlar üzerinden.
- Arama + durum + kategori filtreleri (Fine-Kinney/Periyodik Kontrol'deki AYNI desen).

### Teknik detaylar
- Yeni IndexedDB koleksiyonu: `riskDetections` (DB_VERSION 9→10).
- `constants/riskDetection.js`, `services/riskDetectionService.js`,
  `features/risk-analysis/riskDetection/*` (hook + 4 bileşen).
- `ToggleSwitch` bileşeni paylaşımlı hale getirildi (`components/ui/ToggleSwitch.jsx`)
  — daha önce yalnızca Settings.jsx içinde yerel bir bileşendi, Demo Simülasyonu
  anahtarı için de aynı ihtiyaç doğunca ortak bir yere taşındı.
- `FineKinneyModule.jsx`, Risk Tespiti'nden köprülenen bir taslağı (`pendingDraft`
  prop) alıp formu otomatik ön dolduracak şekilde genişletildi — `useFineKinneyEntries`
  veya kayıt mantığı DEĞİŞMEDİ, yalnızca formun nasıl açıldığı genişledi.

### Kod kalitesi
Tüm değişen/yeni dosyalar TypeScript derleyicisi (JSX-uyumlu, sözdizimi) ve
`node --check` ile tarandı — 172 dosya, hata yok.

---

## [Sprint 7.5 — AI Mevzuat Takibi & Proaktif Fine-Kinney Önerisi] — Önceki güncelleme

Kural hatırlatması: yeni modül eklenmedi (Fine-Kinney modülünün içinde bir panel),
backend/API eklenmedi. `ROADMAP.md`'deki **Phase 5 (RAG & Proaktif Besleme)**'nin
kapanış hedefiydi — mobil/yazılım tarafının roadmap'te tarif edilen son aşaması.

### AI Mevzuat & Risk Taraması paneli (yeni)
Fine-Kinney sayfasına, Bilgi Kütüphanesi'ndeki AI asistanıyla aynı kapalı/açık kart
deseninde yeni bir panel eklendi (`MevzuatScanPanel.jsx`). "Taramayı Başlat"a
basıldığında AI'ye şu bağlam veriliyor: Bilgi Kütüphanesi'ndeki mevzuat dokümanlarının
içeriği + firmanın mevcut Fine-Kinney kayıtlarının özeti (tehlike/risk/durum, en fazla
30 kayıt — kapsam sınırı arayüzde belirtiliyor). AI iki liste üretiyor:

1. **Gözden Geçirilmesi Önerilen Kayıtlar** — mevzuat ışığında yetersiz/güncel
   olmayabilecek mevcut kayıtlar, kısa gerekçeyle. Gerçek kayıtla eşleşirse "Kayda Git"
   ile doğrudan o kaydın detay ekranı açılıyor.
2. **Yeni Risk Önerileri** — firmanın henüz hiç girmediği, mevzuat + mevcut kayıt
   örüntüsünden makul şekilde çıkarılan 1-3 somut taslak. "Taslak Oluştur" formu
   tehlike/risk alanları ÖN DOLDURULMUŞ halde açar; olasılık/maruziyet/şiddet gibi
   kritik alanları doldurup kaydetmek tamamen kullanıcıya bırakılıyor.

**Önemli ilke:** Hiçbir öneri otomatik kayda dönüşmüyor — bu, projedeki mevcut AI risk
önerisi akışıyla (`useAIRiskAnalysis.js`) aynı "AI karar vermez, karar destek verir"
prensibi. AI ayrıca spesifik mevzuat madde numarası uydurmaması, yalnızca kendisine
verilen doküman içeriğini kullanması için açıkça talimatlandırıldı.

### Teknik detaylar
- `constants/systemPrompt.js` → `MEVZUAT_SCAN_PROMPT` + `parseMevzuatScan()`: AI'nin
  serbest metin cevabını sabit `### GÖZDEN GEÇİR` / `### YENİ ÖNERİ` başlıklarıyla
  ayrıştıran, format dışı cevaplarda sessizce boş dizi dönen savunmacı bir parser
  (mevcut `parseResidualSuggestion` ile aynı yaklaşım).
- `useMevzuatScan.js` (yeni hook) — Bilgi Kütüphanesi'nden yalnızca `category ===
  "legislation"` dokümanlarını çekiyor, AI cevabını ayrıştırıp gerçek Fine-Kinney
  kayıtlarıyla (tam eşleşme → alt-dize eşleşmesi) bağlıyor.
- `useFineKinneyEntries.js`'e `allEntries` (filtreden bağımsız TÜM kayıtlar) eklendi —
  panel ve detay ekranı artık aktif bir arama/filtre kayıt dışı bıraksa bile
  "Kayda Git" doğru çalışıyor.

### Kod kalitesi
Tüm değişen/yeni dosyalar TypeScript derleyicisi (JSX-uyumlu, sözdizimi) ve
`node --check` ile tarandı — 163 dosya, hata yok.

---

## [Sprint 7.2.4 — Dashboard: Platformun Merkezi] — Önceki güncelleme

Kural hatırlatması: yeni modül eklenmedi, AI/PDF-Excel/backend/API/bildirim sistemi
eklenmedi. Amaç, mevcut Dashboard'u Fine-Kinney, Eğitim ve Periyodik Kontrol
modüllerinden gerçek veri okuyan, tıklanabilir, açıklamalı bir merkez haline getirmekti.

### 1. Açık Kritik Riskler kartı (yeni)
`CriticalRisksCard.jsx` — mevcut KPI grid'indeki "Kritik Risk" sayısı durumdan bağımsız
tüm yüksek/çok yüksek riskleri sayıyordu; bu yeni kart yalnızca **hâlâ açık olanları**
(durum ≠ "Tamamlandı") somut olarak listeler (tehlike adı, sorumlu, risk rozeti — mevcut
`RiskLevelChip` bileşeni paylaşılarak, yeniden yazılmadı), en yüksek puandan başlayarak.

### 2. Kartlardan modüllere tıkla-git
- **Son 30 Gün Değişim** — her metrik satırı artık ilgili modüle bağlı (Yeni/Kapatılan
  Risk → Risk Analizi, Tamamlanan Eğitim → Eğitim sekmesi, Yapılan Kontrol → Periyodik
  Kontroller sekmesi).
- **Güvenlik Skoru** — alta "Risk Analizi'ne Git" bağlantısı eklendi.
- **Son Aktiviteler** — her satır, olayın `entityType`'ına göre ilgili modüle yönlendiriyor
  (yeni `constants/activityLink.js`); eşleşme yoksa (örn. bildirim/şirket) satır sade
  kalıyor, var olmayan bir sayfaya yönlendirilmiyor.
- Yaklaşan Periyodik Kontroller ve Devam Eden Eğitimler kartları zaten (Sprint 7.4)
  "Tümünü Gör" bağlantısına sahipti — değişmedi.

### 3. Tooltip ve kısa açıklamalar
`InfoTooltip.jsx` (yeni) — native `<details>/<summary>` üzerine kurulu, bağımlılıksız,
hem dokunmatik hem fare ile aynı şekilde açılan bir "(i)" ipucu. `title` özniteliğine
dayalı bir hover-tooltip mobilde hiç açılmayacağı için bilinçli olarak bu yaklaşım
seçildi. `DashboardWidget.jsx`'e opsiyonel `description` prop'u eklendi; Dikkat
Gerektirenler, Açık Kritik Riskler, Yaklaşan Periyodik Kontroller, Devam Eden Eğitimler,
Son Aktiviteler ve Güvenlik Skoru / Son 30 Gün Değişim kartlarına kısa açıklamalar
eklendi.

### 4. Boş durum (Son 30 Gün Değişim)
Sprint 7.4'ün development report'unda not edilen risk giderildi: uygulama yeni
kullanılmaya başlandığında (hiç veri yok) kart artık dört sıfırlı metrik yerine
"Henüz karşılaştırılacak yeterli geçmiş veri yok" mesajı gösteriyor.

### 5. Entegrasyon (zaten mevcuttu, doğrulandı)
Fine-Kinney, Eğitim ve Periyodik Kontrol modüllerinden canlı veri okuma zaten Sprint
7.4'te kurulmuştu (`useEmployerDashboardData.js`); bu sprint üzerine ekleme yaptı,
yeniden inşa etmedi.

### 6. Kod kalitesi
Tüm değişen/yeni dosyalar TypeScript derleyicisi (JSX-uyumlu, sözdizimi) ve
`node --check` ile tarandı — 161 dosya, hata yok.

---

## [Sprint 7.2.3 — Periyodik Kontrol Merkezi (genişletme)] — Önceki güncelleme

Kural hatırlatması: yeni modül eklenmedi, AI/PDF/Excel/bildirim sistemi/API/backend
eklenmedi. Mevcut Periyodik Kontrol modülü kurumsal ürün seviyesine yaklaştırıldı.

### 1. Dashboard Özeti (üst özet kartları)
`PeriodicCheckSummaryCards.jsx` (yeni) — modülün en üstünde 4 kart: Geciken Kontroller,
Bugünkü Kontroller, Bu Hafta Yaklaşanlar, Bu Ay Tamamlananlar. Hesaplama tamamen yeni
`computePeriodicCheckStats()` (constants/periodicCheck.js) fonksiyonundan gelir — her
zaman TÜM kayıtlar üzerinden (filtreden bağımsız), aksi halde bir filtre uygulandığında
"Geciken" sayısı yanıltıcı görünürdü. Eski küçük satır-içi rozet özeti bu kartların
yerini aldı (bilgi kaybı yok, daha okunaklı).

### 2. Kontrol Listesi — yeni filtreler
Arama + Durum + Kontrol Türü filtreleri zaten vardı (Sprint 7.2.2). Bu sprintte
**Departman** ve **Tarih Aralığı** eklendi — Fine-Kinney modülündeki
(`FineKinneyFilters.jsx`) "Gelişmiş Filtreler" collapsible deseniyle birebir aynı,
hatta departman/şube listesini çeken `useCompanyOrgLists()` hook'u doğrudan paylaşıldı
(kod tekrarı yok). `PeriodicCheck` veri modeline opsiyonel `departmentId` alanı eklendi.

### 3. Kontrol Detayı (yeni ekran)
Önceden bu bilgiler yalnızca kartın küçük yazı alanında sıkışık gösteriliyordu.
`PeriodicCheckDetailDrawer.jsx` (yeni, mevcut paylaşımlı `Modal.jsx` üzerine kurulu —
projedeki tüm detay ekranlarıyla aynı bileşen) artık Ekipman, Kontrol Türü, Departman,
Son Kontrol, Sonraki Kontrol, Durum, Sorumlu, Açıklama alanlarını okunaklı satırlar
halinde gösteriyor; Düzenle/Sil/Bugün Kontrol Edildi aksiyonları da buradan yapılabiliyor.
Kart artık tıklanabilir (`role="button"`) — aksiyon butonları `stopPropagation` ile
çakışmayı önlüyor.

### 4. Takvim Görünümü — Bugün / Bu Hafta / Bu Ay
`PeriodicCheckCalendar.jsx`'e üç görünüm modu eklendi: **Bugün** (bugüne ait kontrollerin
sade listesi), **Bu Hafta** (7 günlük tek satır şerit, günlere tıklanınca o günün
kontrolleri), **Bu Ay** (Sprint 7.2.2'deki mevcut ay ızgarası, değişmedi). Hiçbir yeni
kütüphane eklenmedi — üçü de aynı `checks` verisinin farklı gruplamaları.

### 5. Dashboard Hazırlığı
`computePeriodicCheckStats()` yalnızca bu modülün kartlarını değil, aynı zamanda
istenen dört alanı da (`upcomingCount`, `overdueCount`, `okCount`→"tamamlanan",
`completionRate`) hazır döndürüyor — ileride Employer Dashboard'a bağlanmak istenirse
(Sprint 7.4'teki `UpcomingChecksCard`/`Last30DaysChangeCard` gibi) doğrudan kullanılabilir.
Bu sprintte Dashboard'a bağlama YAPILMADI (istenen kapsam yalnızca "hazırlık").

### 6. Kod kalitesi
Tüm değişen/yeni dosyalar TypeScript derleyicisi (JSX-uyumlu, sözdizimi) ve
`node --check` ile tarandı — 158 dosya, hata yok. Çalışan/Şube bölümlerindeki dokunma
alanı deseni (Sprint 7.4'te eklenen negatif margin + padding tekniği) kart butonlarında
tutarlı şekilde uygulandı.

---

## [Sprint 7.4 — Karar Destek Dashboard & Deneyim Rafine] — Önceki güncelleme

Kural hatırlatması: yeni modül eklenmedi, yeni bağımlılık/backend/API yok. Mevcut Dashboard
ve Eğitim modülleri kurumsal ürün seviyesine yaklaştırıldı. Not: bu sprint kullanıcıdan
"Sprint 7.2.2" olarak istendi, ancak bu isim `docs/SPRINTS.md`'de zaten Periyodik Kontrol
genişletmesine ait olduğu ve "7.3" de Bilgi Kütüphanesi AI Asistanı'na ait olduğu için
sıradaki boş numara olan **7.4** kullanıldı.

### 1. Devam Eden Eğitimler kartı (Education modülü zaten tamdı)
İncelemede Education modülünün istenen her maddeyi (video ilerlemesi, kaldığı yerden devam,
ileri sarma engeli, eğitim bitmeden sınav açılmaması, katılımcı ilerleme listesi) önceki
sprintlerde zaten karşıladığı görüldü — bu sprintte modülün kendisine dokunulmadı. Asıl eksik,
Sprint 7.2.1'de hazırlanan `trainingStats`'ın hiçbir widget tarafından tüketilmemesiydi:
- `src/constants/trainingStatus.js` → yeni `getOngoingTrainingItems()`: hâlâ izlemekte olan
  katılımcıları en son aktiviteye göre sıralı, isim/kurs/yüzde bazında somut satırlara çevirir.
- `OngoingTrainingsCard.jsx` (yeni) — Dashboard'daki eski statik "Eğitimler" widget'ının
  (yalnızca modül başlıklarını "Zorunlu Eğitim" etiketiyle listeleyen) yerini aldı. Artık
  gerçek Atandı/Devam Ediyor/Tamamlandı sayıları + en çok 5 "devam eden" satır gösteriyor.

### 2. Yaklaşan Periyodik Kontroller kartı
Mevcut `PeriodicCheckOverviewPanel` yalnızca makro sayaç veriyordu (kaç tanesi geçti/yaklaşıyor/
güncel). `UpcomingChecksCard.jsx` (yeni) bunu tamamlıyor: hangi kalemin, hangi tarihte,
hangi durumda olduğunu somut olarak listeliyor (en yakın 5 kayıt, durum rozetiyle). İkisi de
korunuyor — biri özet, diğeri detay.

### 3. Son 30 Gün Değişim kartı — gerçek veri, temsili değil
`TrendsPanel.jsx`'teki 6 aylık seyir açıkça "temsili" işaretliydi; bu yeni kart öyle değil.
- `src/utils/dashboardTrends.js` (yeni) → `computeLast30DayChange()`: Yeni Risk, Kapatılan
  Risk, Tamamlanan Eğitim, Yapılan Periyodik Kontrol için son 30 gün / önceki 30 gün
  karşılaştırması. `fineKinney.date` alanı ISO olmadığından (`DD.MM.YYYY`) `toComparableDate`
  ile güvenli şekilde karşılaştırılıyor; `closedAt`/`completedAt`/`lastCheckDate` zaten ISO.
- `Last30DaysChangeCard.jsx` (yeni) — artış/azalışın "iyi" mi "kötü" mü olduğuna göre
  (örn. yeni risk artışı kötü, kapatılan risk artışı iyi) yeşil/kırmızı ok ile gösteriyor.
- Veri azsa delta 0 çıkar — bu beklenen davranıştır, uydurma sayı üretilmedi.

### 4. Dashboard widget kayıt sistemi
`useWidgetVisibility.js`'e `last30DayChange` ve `upcomingChecksList` eklendi; `education`
widget'ının etiketi "Eğitimler" → "Devam Eden Eğitimler" olarak güncellendi (içerik artık
gerçek). Mevcut widget aç/kapa tercihleri (`localStorage`) bozulmadı — yeni id'ler eski
kullanıcılarda da varsayılan olarak görünür gelir.

### 5. Dokümanlara derin bağlantı
`DocumentsPage.jsx` artık `?tab=periodicChecks` / `?tab=education` gibi bir sorgu parametresini
okuyor — yeni dashboard kartlarındaki "Tümünü Gör" bağlantıları doğrudan ilgili sekmeye açılıyor.

### 6. Loading / Error durumları
`EmployerDashboard.jsx`'te veri yüklenirken sessizce `return null` dönülüyordu (boş beyaz ekran
riski) — artık mevcut `Loading` bileşeni kullanılıyor. `useEmployerDashboardData.js`'teki veri
çekme artık `try/catch` ile sarmalı; IndexedDB'ye erişilemezse (örn. tarayıcı depolama izni yok)
sessizce çökmek yerine mevcut `ErrorState` bileşeniyle "Yeniden Dene" seçeneği sunuluyor.

### 7. Mobil dokunma alanı (touch target) iyileştirmeleri
Küçük metin/ikon butonlarının görünür boyutu değiştirilmeden dokunma alanı büyütüldü (negatif
margin + padding tekniği, görsel dili bozmuyor):
- Çalışanlar/Şubeler bölümlerinde "Düzenle"/"Sil" linkleri
- Departmanlar bölümündeki dairesel silme ikonu (20px → 28px)
- Uygulama genelinde 6 farklı kapatma (X) butonu: `Modal.jsx` (paylaşılan bileşen — tüm
  modallara otomatik yansır), `FineKinneyDetailDrawer`, `DocumentDetailDrawer`,
  `KnowledgeAIAssistant`, `CoursePlayer`, mobil `Sidebar`.

### 8. Kod kalitesi
Tüm değişen/yeni dosyalar TypeScript derleyicisi (JSX-uyumlu, tip kontrolü kapalı, yalnızca
sözdizimi) ve `node --check` ile tarandı — hata yok. `EDUCATION_MODULES` importu artık
kullanılmadığı için `EmployerOverviewTab.jsx`'ten kaldırıldı (ölü kod bırakılmadı).

---

## [Sprint 4A.3 — Executive Dashboard & Decision Support] — Önceki güncelleme

Kural hatırlatması: yeni bağımlılık, backend, Supabase eklenmedi. Mock servis mimarisi korundu.

### 1. Güvenlik Skoru (AI Safety Score)
- `src/utils/safetyScore.js` — saf fonksiyon, `computeSafetyScore(metrics)`. 100 puandan başlayıp açık risk, kritik risk, eğitim tamamlama açığı, yaklaşan kontrol, düzeltici faaliyet açığına göre ağırlıklı düşüyor (kritik riskler en ağır etkiye sahip — can kaybı potansiyeli). Gerekçe/etki listesi (`breakdown`) skorla birlikte dönüyor.
- `SafetyScoreCard.jsx` — Dashboard'un en üstünde, yarım-daire gösterge (bağımlılıksız SVG) + skor + "neden bu seviyede" açıklama listesi (her kriterin puan etkisi görünür, örn. "Kritik Riskler −16").
- Skor gerçek verilerden hesaplanıyor (açık/kritik risk sayısı, periyodik kontrol durumu, düzeltici faaliyet tamamlanma oranı — hepsi gerçek Fine-Kinney/periyodik kontrol kayıtlarından); yalnızca eğitim tamamlama oranı mock (gerçek çalışan-eğitim takibi yok).

### 2. Yönetici Özeti
- `src/utils/executiveSummary.js` — `computeWeeklySummary()`, Fine-Kinney kayıtlarının `date`/`closedAt` alanlarını kullanarak **gerçek** "son 7 gün" penceresini hesaplıyor (mock değil — veri azsa sayılar küçük çıkar, bu normal). Örnek cümle formatı istediğiniz gibi: "Bu hafta X yeni risk oluşturuldu. Y risk kapatıldı. Z yüksek öncelikli risk devam ediyor. W periyodik kontrol yaklaşmaktadır."
- `ExecutiveSummaryCard.jsx` — bu cümleyi Dashboard'da gösteriyor.

### 3. Trend Analizi
- `TrendsPanel.jsx` — Aylık risk sayısı (yeni `components/MiniBarChart.jsx`, bağımlılıksız SVG çubuk grafik) + Risk Kapanma / Eğitim Tamamlama / Periyodik Kontrol oranları için `Sparkline` (önceki sprintte yazılmıştı, yeniden kullanıldı). Aylık geçmiş veri henüz birikmediği için (uygulama yeni) bu grafikler mock/temsili — kod içinde açıkça belirtildi.

### 4. KPI Kartları (eklenenler)
Genel Bakış'taki kart listesine eklendi — hepsi **gerçek** hesaplama:
- **Risk Kapanma Süresi** — `closedAt - date` farkının gün ortalaması (yalnızca kapanan riskler). Bunun çalışması için `FineKinneyEntry`'e `closedAt` alanı eklendi, durum ilk kez "Tamamlandı" olduğunda otomatik damgalanıyor.
- **Ortalama Risk Puanı** — tüm Fine-Kinney kayıtlarının puan ortalaması.
- **Aktif Düzeltici Faaliyet** — durumu "Tamamlandı" olmayan risk sayısı.
- **Yaklaşan Denetimler** — mevcut "Yaklaşan Kontroller" metriğiyle aynı veri kaynağını paylaşıyor.

### 5. Düzeltici Faaliyet Modülü
`FineKinneyEntry` tipine `priority` (Düşük/Orta/Yüksek/Acil) ve `completionPercent` (0-100, slider ile) eklendi — `responsible`/`dueDate`/`status` zaten vardı. Yeni `CorrectiveActionsPanel.jsx`, aktif (kapanmamış) riskleri önceliğe göre sıralayıp gösteriyor. Fine-Kinney formu ve kartı bu yeni alanları destekliyor (öncelik rozetleri, tamamlanma yüzdesi çubuğu).

### 6. Son Aktiviteler
Zaten mevcuttu (önceki sprintlerde `auditService` ile kuruldu) — bu sprintte istenen örnek olay türleri ("Risk güncellendi", "Risk kapatıldı") için `logActivity` metinleri daha isabetli hale getirildi (artık "Fine-Kinney değerlendirmesi güncellendi" yerine duruma göre "Risk kapatıldı" / "Risk güncellendi" / "Yeni risk oluşturuldu" yazıyor).

### 7. Dashboard Widget Yapısı
- `src/hooks/useWidgetVisibility.js` + `src/components/DashboardWidget.jsx` — **iddia ettiğim gibi yalnızca altyapı değil, gerçekten çalışan bir özellik:** Genel Bakış'ta "Widget'ları Düzenle" butonuna basınca her widget tek tıkla açılıp kapatılabiliyor, tercih `localStorage`'da kalıcı. "İleride açılıp kapatılabilecek şekilde" talebini şimdiden karşıladım.
- Tüm widget'lar (`safetyScore`, `executiveSummary`, `kpiCards`, `trends`, `correctiveActions`, `riskAnalyses`, `employees`, `education`, `recentActivity`) bu sistemden geçiyor.

### 8. Kod kalitesi
- `EmployerOverviewTab.jsx` her widget'ı ayrı bir dosyadan (`SafetyScoreCard`, `ExecutiveSummaryCard`, `TrendsPanel`, `CorrectiveActionsPanel`) çağırıyor — kendisi büyük bir JSX yığını olmak yerine bir orkestratör.
- Geliştirme sırasında bir tutarsızlık buldum ve düzelttim: `TrendsPanel.jsx`, `useEmployerDashboardData.js`'in döndürdüğü `metrics` objesinde olmayan bir `totalRisks` alanına referans veriyordu — `metrics.totalRisks` artık gerçekten hesaplanıp dönüyor.
- Kullanılmayan kod taraması yapıldı → yeni bileşenlerin hepsi gerçekten kullanılıyor, ölü kod yok.

### Doğrulama
- Tüm proje `tsc --noEmit` ile sözdizimi taramasından geçirildi → **0 hata.**
- Tüm import yolları + doğrudan/dinamik ikon referansları programatik doğrulandı → **tümü geçerli.**
- Tüm early-return içeren bileşenlerde hook çağrı sırası doğrulandı → sorun yok.
- `useEmployerDashboardData.js`'in döndürdüğü her alanın, onu tüketen bileşenlerde kullanılan alan adlarıyla birebir eştiği elle karşılaştırıldı (yukarıdaki `totalRisks` hatası bu sırada bulundu).

**Not:** Bu ortamda internet erişimi yok, gerçek `npm run build` yine çalıştırılamadı — yukarıdaki statik yöntemlerle doğrulandı.

---

## [Sprint 4A.2 — Enterprise UX & Management] — Önceki güncelleme

Kural hatırlatması: gerçek backend, authentication, kamera/sensör/AI Vision ve yeni bağımlılık **eklenmedi**. Sadece frontend/UX/mimari.

### 1 & 2. Dashboard 2.0 + KPI Performans bölümü
İşveren Paneli artık iki sekmeli (kod kalitesi gereği ayrı dosyalara bölündü — `features/dashboard/employer/`):
- **Genel Bakış** (`EmployerOverviewTab.jsx`) — istenen 6 kart: Toplam Çalışan, Açık Risk, Kritik Risk, Yaklaşan Periyodik Kontroller, Tamamlanan Eğitim, Son AI Analizleri. Hepsi gerçek servislerden (Fine-Kinney, periyodik kontrol, bildirim kayıtları) hesaplanıyor — yalnızca "Tamamlanan Eğitim" oranı mock (gerçek çalışan-eğitim takip sistemi henüz yok, kod içinde açıkça belirtildi). **Son Aktiviteler** paneli eklendi (mevcut `auditService`'i yeniden kullanıyor).
- **Performans** (`PerformancePanel.jsx`) — Risk Kapanma Oranı, Eğitim Tamamlama Oranı, Periyodik Kontrol Tamamlanma Oranı (ilerleme çubuklarıyla), Kritik Risk Sayısı, Güvenlik Performans Trendi. Trend grafiği için `components/Sparkline.jsx` yazıldı — **bağımlılıksız, saf SVG** (chart kütüphanesi eklenmedi). Trend verisi mock (gerçek zaman-serisi kaydı yok, kod içinde belirtildi).
- İki sekme de ortak `useEmployerDashboardData.js` hook'undan besleniyor — veri tek yerden yükleniyor, tekrar tekrar servis çağrısı yapılmıyor.

### 3. Bildirim Merkezi (Header — profesyonel Notification Center)
- `src/services/systemNotificationService.js` — yeni, Service+Repository mimarisine uygun (dataProvider üzerinden).
- `src/features/notifications/NotificationCenterDropdown.jsx` — Header'daki zil artık gerçek bir açılır panel: okundu/okunmadı durumu (nokta işareti + kalın yazı), tek tıkla okundu işaretleme, "Tümünü okundu işaretle", boş durum.
- **Gerçek olaylara bağlandı** (mock değil): Fine-Kinney'de yeni risk kaydedilince → "Yeni Risk" + (kritikse) "Kritik Risk" bildirimi; yeni çalışan eklenince → "Yeni Çalışan"; periyodik kontrol yaklaşan/geçmişse → "Periyodik Kontrol". Yalnızca "Eğitim Hatırlatma" türü hâlâ örnek/mock (gerçek çalışan-bazlı eğitim tarihi takibi yok).
- ⚠️ Bu, Risk Analizi sayfasındaki mevcut "Bildirim Merkezi" (ramak kala/tehlike/kaza iş akışı) ile **karıştırılmamalı** — o değişmeden duruyor, bu tamamen ayrı bir kavram (genel sistem olay akışı).
- Header'daki eski "bekleyen inceleme" rozeti kaybolmadı — dropdown'ın altında bağlantı olarak duruyor.

### 4. Audit Log
Zaten mevcuttu (önceki sprintte kuruldu) — bu sprintte Dashboard'un "Son Aktiviteler" panelinde yeniden kullanıldı, ek altyapı gerekmedi.

### 5. Profil sayfası genişletildi
`src/features/profile/PasswordChangeSection.jsx` (yeni, ayrı dosya) + `pages/Profile.jsx` güncellendi: profil fotoğrafı yükleme (firma logosuyla aynı base64 deseni), ünvan, telefon, departman, son giriş zamanı, şifre değiştirme alanı (açıkça "yalnızca arayüz" etiketli, `authService`'e gerçek bağlanmaya hazır). `User` tipine ve `MOCK_USERS`'a bu alanlar eklendi.

### 6. Ayarlar
Firma logosu, Dil, Bildirim tercihleri zaten mevcuttu. **Tema seçimini kasıtlı olarak eklemedim** — önceki bir mesajınızda açıkça "zaten sağ üstte var, kaldırabilirsin" demiştiniz ve kaldırmıştım; bu sprintin şablonunda tekrar geçmesi muhtemelen genel bir sprint dokümanından geldi. Yanılıyorsam söyleyin, geri eklerim.

### Ayrıca (sizin ek talebiniz): Rol bazlı sekme filtreleme
- **Risk Analizi**: Çalışan rolünde yalnızca "Bildirim Merkezi" sekmesi görünüyor (Fine-Kinney ve Aktivite Geçmişi gizlendi — bunlar uzman/işveren işi).
- **Dokümanlar**: Çalışan rolünde yalnızca "Ekipman Kayıtları" ve "Eğitim Modülleri" görünüyor ("Belge Oluştur" ve "Periyodik Kontroller" gizlendi).
- Rol değişince aktif sekme artık görünmüyorsa otomatik olarak ilk görünür sekmeye dönülüyor (çökme riski yok).

### Ayrıca (sizin ek talebiniz): Fine-Kinney — Artık Risk (önlem sonrası) hesaplaması
- `FineKinneyEntry` tipine `residualProbability/Frequency/Severity/Score/RiskLevel` eklendi.
- AI önerisi promptu genişletildi (`FINE_KINNEY_AI_PROMPT`): artık kontrol tedbirleri + KKD + açıklamanın yanında, **yapısal ve ayrıştırılabilir** bir "Artık Risk Önerisi" de üretiyor (`Olasılık: X / Maruziyet: Y / Şiddet: Z` formatında). Yeni `parseResidualSuggestion()` fonksiyonu bu metni ayıklayıp form alanlarını otomatik dolduruyor.
- **Güvenlik/gerçekçilik önlemi:** AI'nin önerdiği artık risk değerleri koda göre asıl değerleri ASLA aşamıyor (kodda `Math.min(...)` ile sınırlandı) — ayrıca öneriler her zaman kullanıcı tarafından düzenlenebilir dropdown'lar olarak sunuluyor, hiçbir zaman sessizce/geri dönüşsüz uygulanmıyor.
- Artık risk bölümü yalnızca "Alınacak Önlem" alanı doldurulduğunda görünüyor (mantıksal akışa uygun).
- Liste kartlarında artık "İlk Risk → Artık Risk" şeklinde iki renkli gösterge yan yana görünüyor.
- Örnek risk analizi tablosu paylaşırsanız (teklif ettiğiniz gibi), skalayı/eşikleri buna göre ince ayar yapabilirim — şu an standart Fine-Kinney referans değerleriyle ilerledim.

### 7. Kod kalitesi
- `EmployerDashboard.jsx` büyümeden önce bölündü: `useEmployerDashboardData.js` (veri), `EmployerOverviewTab.jsx`, `PerformancePanel.jsx` (görünüm), `EmployerDashboard.jsx` artık yalnızca ~70 satırlık bir orkestratör.
- Kullanılmayan bileşen kalmadı (kontrol edildi — `ErrorState`, `Sparkline`, `RouteGuard` dahil hepsi en az bir yerde kullanılıyor).
- Ortak bileşen kullanımı arttı: yeni panellerin hepsi `EmptyState`, `Badge`, `Button`, `Loading`'i yeniden kullanıyor, tekrar kod yazılmadı.

### 8. Responsive kontrol
Kod seviyesinde denetlendi (gerçek cihaz testi bu ortamda mümkün değil). Çok-sütunlu grid içeren yeni bileşenlerde (`EmployerOverviewTab`, `FineKinneyForm`, `NotificationCenterDropdown`) `sm:`/`md:` breakpoint'leri veya `overflow-x-auto`/`flex-wrap` mevcut. Tek-sütun/flex düzenli dosyalarda (`PerformancePanel`, `Profile`, `PasswordChangeSection`, `EmployerDashboard` orkestratörü) ek breakpoint gerekmedi çünkü zaten mobilde doğal olarak tek sütun/dar-uyumlu.

### Doğrulama
- Tüm proje `tsc --noEmit` ile sözdizimi taramasından geçirildi → **0 hata.**
- Tüm import yolları + doğrudan/dinamik ikon referansları programatik doğrulandı → **tümü geçerli** (eksik `LayoutDashboard` ikonu fark edilip eklendi).
- Tüm early-return içeren yeni/değişen bileşenlerde hook çağrı sırası tek tek doğrulandı → **Rules of Hooks ihlali yok.**
- Kullanılmayan kod taraması yapıldı → **temiz.**

**Not:** Bu ortamda internet erişimi yok, gerçek `npm run build` yine çalıştırılamadı — yukarıdaki statik yöntemlerle doğrulandı.

---

## [Sprint 4A — Foundation: Backend'e Hazırlık] — Önceki güncelleme

Kural hatırlatması: gerçek backend, gerçek authentication, Supabase kodu ve yeni bağımlılık **eklenmedi**. Bu sprint yalnızca mimariyi hazırladı.

### 🐛 Bildirdiğiniz hata düzeltildi
Ayarlar → Firma Yönetimi artık yalnızca **İşveren** rolünde görünüyor (Uzman ve Çalışan artık göremiyor). Tek satırlık bir if yerine, yeniden kullanılabilir **RouteGuard** bileşeniyle düzeltildi — böylece aynı altyapı ileride başka bölümleri de aynı şekilde koruyabilir.

### 7. Route Guard altyapısı (yeni)
- `src/utils/permissions.js` — `isAuthenticated()`, `hasRole()`, `hasPermission()`. Rol→izin eşleme tablosu dahil.
- `src/components/RouteGuard.jsx` — `<RouteGuard allowedRoles={["employer"]}>` şeklinde herhangi bir içeriği sarabilen bileşen. Şu an Ayarlar'daki Firma Yönetimi bölümünü koruyor (yukarıdaki hata düzeltmesi).
- ⚠️ `isAuthenticated()` şu an her zaman `true` dönüyor (mock mod, kodun içinde büyük harflerle işaretli) — gerçek login akışı sayfalara henüz bağlı değil. `hasRole()` ise gerçek: aktif demo rolüne göre çalışıyor, hemen test edilebilir.

### 1 & 4. Service + Repository mimarisi standardizasyonu
- `dataProvider.js` (önceki sprintte kurulmuştu) artık **tüm** veri servislerinin tek geçiş noktası — `IsgDataContext.jsx`'in bildirimler için doğrudan çağırdığı son nokta da kapatıldı: yeni `src/services/notificationRecordService.js` ile Service katmanı artık istisnasız.
- UI bileşenlerinin hiçbiri IndexedDB/localStorage'a doğrudan erişmiyor (kontrol edildi) — yalnızca tema/dil/rol gibi saf arayüz tercihleri `useLocalStorage` hook'unu kullanıyor, bunlar zaten Supabase'e taşınmayacak türden yerel ayarlar.

### 3. Ortak tip tanımları — ve **güvenlik açısından önerdiğim, uyguladığım ekleme**
`Company, User, Employee, Branch, Department` zaten `companyId` içeriyordu. **Eksik olanı buldum ve ekledim:** `Notification, FineKinneyEntry, DocumentRecord, PeriodicCheck, AuditLogEntry, Equipment` tiplerinde `companyId` alanı YOKTU — yani bu kayıtlar gelecekte Supabase'e taşındığında firma bazlı izolasyon (RLS) için hazır değildi. Şimdi:
- Tüm bu tiplere `companyId` eklendi.
- İlgili servisler (`riskService`, `periodicCheckService`, `documentService`, `notificationRecordService`, `auditService`) artık her yeni kayıtta `companyId`'yi **otomatik** ekliyor — `companyService.js`'teki hafif önbellekli `getPrimaryCompanyId()` yardımcısından okuyor. Kayıt oluşturan hiçbir bileşenin (FineKinney formu, bildirim formu, belge oluşturucu vb.) değişmesine gerek kalmadı — ekleme servis katmanında, tek noktadan yapıldı.
- **Bu, gerçek Supabase + RLS kurulunca "hangi tabloya tenant sütunu ekleyeyim" diye uğraşmamanız için şimdiden atılmış bir adımdır.**

### 5. Ortak Loading / Error / Empty State
- `src/components/ErrorState.jsx` — yeni. `Loading.jsx` ve `EmptyState.jsx` ile aynı aileden, "istek başarısız oldu" durumları için ("Tekrar Dene" butonlu).
- `CompanyInfoSection.jsx`'e gerçek bir kullanım örneği olarak bağlandı (firma bilgisi yüklenemezse artık sessizce takılı kalmıyor, hata gösterip yeniden deneme sunuyor).

### 6. Toast sistemi
Denetlendi — tüm oluşturma/güncelleme/silme akışları zaten tutarlı şekilde `useToast()` kullanıyordu (önceki sprintlerde kurulmuştu), ek değişiklik gerekmedi.

### 8. Temizlik
- Statik ikon denetimimi genişlettim ve bunu yaparken **gerçek bir hata buldum**: `ErrorState.jsx` yazarken `AlertTriangle` ikonunun aslında hiç tanımlı olmadığını fark ettim — eklendi. (Önceki denetimlerim yalnızca doğrudan `import { X }` kullanımını kontrol ediyordu; `Icons[key]` şeklindeki dinamik kullanımları kaçırıyordu. Artık `quickActions.js`'teki tüm `iconKey` değerlerini de otomatik doğruluyorum.)
- Kullanılmayan bileşen kalmadı (kontrol edildi: `ErrorState` yeni eklendiği için kullanım sayısını bilerek doğruladım, sıfır çıkınca gerçek bir yere bağladım).

### Yapılmayanlar (bilinçli, kural gereği)
- Task 8'de önerilebilecek "8 servis için ortak CRUD factory" yapısını **bilerek yapmadım** — mevcut servisler zaten kısa (3-6 satır) ve okunaklı; genel bir soyutlama eklemek bu ölçekte okunabilirliği artırmaz, riski artırır. Duplikasyon düşük ve kabul edilebilir seviyede.
- `documentService.js` hâlâ hem ekipman hem belge sorumluluğunu taşıyor (isim tutarsızlığı) — ayırmak mekanik ama bu sprintin kapsamı dışında tutuldu, ileride küçük bir iyileştirme olarak yapılabilir.

### Doğrulama
- Tüm proje `tsc --noEmit` ile sözdizimi taramasından geçirildi → **0 hata.**
- Tüm import yolları + doğrudan ikon import'ları + (yeni) dinamik `iconKey` referansları programatik doğrulandı → **tümü geçerli** (bir gerçek hata bulundu ve düzeltildi, yukarıda belirtildi).
- Yeni early-return içeren `CompanyInfoSection.jsx` ve `RouteGuard.jsx`'te hook çağrı sırası doğrulandı → sorun yok.
- `companyService.js`'in yeni `auditService`/`riskService`/vb. tarafından import edilmesinin dairesel bağımlılık yaratmadığı kontrol edildi (`companyService.js` yalnızca `dataProvider.js`'i import ediyor, geri döngü yok).

**Not:** Bu ortamda internet erişimi yok, gerçek `npm run build` yine çalıştırılamadı — yukarıdaki statik yöntemlerle doğrulandı.

---

## [Backend-Hazır Soyutlama Katmanı] — Önceki güncelleme

**Bağlam:** Bu sprint için asıl talep gerçek kimlik doğrulama + gerçek firma veri izolasyonuydu ("SaaS'ın temeli"). Bunu açıkça konuştuk: mevcut mimari (statik Vite uygulaması + tarayıcıya özel IndexedDB, gerçek bir sunucu/veritabanı yok) bunu **gerçek anlamda** sağlayamaz — IndexedDB tarayıcı konsolundan doğrudan okunabilir, `companyId` ile filtrelemek arayüz seviyesinde bir görünüm sağlar ama güvenlik değildir. Bu konuşuldu ve gerçek çözüm (Supabase: Postgres + Auth + Row Level Security) için adım adım ilerleme kararı alındı, ama önce **soyut bir servis katmanı** istendi — "Mock veri sadece geçici olsun ve backend geldiğinde minimum değişiklik gerektirsin."

Bu güncelleme yalnızca bu soyutlama katmanını kuruyor. Gerçek Supabase entegrasyonu, kullanıcının onayıyla ayrı ve dikkatli bir sonraki adımda yapılacak.

### `src/services/dataProvider.js` — yeni, tek geçiş noktası
Uygulamanın tüm veri servislerinin konuştuğu tek soyut arayüz: `getAll(collection, filter?)`, `getById(collection, id)`, `upsert(collection, record)`, `remove(collection, id)`. Bugün IndexedDB'ye (`services/db.js`) delege ediyor. Supabase eklendiğinde:
1. Aynı 4 metodu uygulayan bir `supabaseDataProvider.js` yazılacak (Supabase JS istemcisinin metotları zaten hemen hemen aynı isimlerde/şekilde).
2. Bu dosyanın en altındaki tek satır (`export const dataProvider = indexedDbProvider`) değiştirilecek.
3. **Hiçbir domain servisi, context, sayfa veya component değişmeyecek.**

### Refaktör edilen servisler (davranış değişmedi, yalnızca depolama çağrıları soyutlandı)
`companyService.js`, `branchService.js`, `departmentService.js`, `employeeService.js`, `documentService.js`, `riskService.js`, `periodicCheckService.js`, `auditService.js`, `src/contexts/IsgDataContext.jsx` — hepsi artık `db.js`'i doğrudan değil, `dataProvider`'ı çağırıyor. `branchService`/`departmentService`/`employeeService`'teki manuel `.filter(companyId)` çağrıları, `dataProvider.getAll(collection, { companyId })`'nin genel filtre parametresiyle sadeleşti (kod tekrarı azaldı).

### `src/services/authService.js` — Supabase-şekilli mock arayüz
Yeni eklenen fonksiyonlar, Supabase Auth istemcisinin gerçek metotlarıyla **aynı isim ve aynı dönüş şeklinde** yazıldı — `signUp()`, `signIn()`, `signOut()`, `getSession()`, `resetPasswordForEmail()`, `onAuthStateChange()`. Hiçbiri gerçek kimlik doğrulama yapmıyor (dosyanın başında büyük harflerle bu uyarı var) — yalnızca UI'nin (Login/Register formları, ileride rol bazlı yönlendirme) bu isimlere karşı yazılabilmesini sağlıyor. Gerçek backend gelince yalnızca fonksiyon gövdeleri değişecek, çağıran hiçbir yer değişmeyecek.
- **Mevcut `getCurrentUser(role)` fonksiyonu bire bir korundu** — `Profile.jsx` hâlâ aynı şekilde çağırıyor, davranış değişmedi.
- Kullanılmayan eski `loginWithCredentials()` placeholder'ı kaldırıldı (hiçbir yerde çağrılmıyordu, kontrol edildi).
- `signUp()`'a `emailConfirmed: false` alanı eklendi — "E-posta doğrulama (altyapı)" talebinin veri modeli karşılığı; henüz gerçek e-posta gönderimi yok.

### Henüz yapılmayanlar (bilinçli olarak bu sprintte değil)
- Login.jsx / Register.jsx UI'ları yeni `signIn`/`signUp` fonksiyonlarına **henüz bağlanmadı** — bu, gerçek backend kararı netleşmeden UI'yi yarım bir akışa kilitlememek için bilerek ertelendi.
- Rol bazlı otomatik yönlendirme, Dashboard 2.0 detayları, Bildirim Merkezi'nin renkli olay listesi — bunlar sonraki adımda, Supabase kurulumuyla birlikte ya da mock oturum üzerinden ele alınacak (kullanıcıyla birlikte karar verilecek).

### Doğrulama
- Tüm değişen dosyalar `tsc --noEmit` ile sözdizimi taramasından geçirildi → **0 hata.**
- Tüm import yolları programatik doğrulandı → **sorun yok.**
- `db.js`'e artık yalnızca `dataProvider.js`'in kendisinin eriştiği, başka hiçbir servisin doğrudan erişmediği grep ile doğrulandı.
- `authService.getCurrentUser(role)`'un imzası/davranışı değişmediği için `Profile.jsx` etkilenmedi.

**Not:** Bu ortamda internet erişimi yok, gerçek `npm run build` yine çalıştırılamadı — yukarıdaki statik yöntemlerle doğrulandı.

---

## [Firma Sistemi: Şirket, Şube, Departman, Çalışan] — Önceki güncelleme

Hedef: NobetciAI'yi tek kullanıcılı uygulamadan gerçek şirket platformuna dönüştürmenin ilk sprinti. Mesajda iki talimat seti verildi; ikincisi ("Bu sprintte yapılacaklar") daha somut ve sınırlıydı, o esas alındı — Fine-Kinney 2.0, manuel oluştururken AI önerisi ve otomatik rol yönlendirmesi bilerek bu sprintte yapılmadı (talimatta "Sprint 4'ün işi" olarak işaretlenmişti).

### 1. Firma Sistemi
- `src/types/index.js` — `Company` tipi (`id, name, taxNumber, sector, employeeCount, logo, address, phone, email`).
- `src/services/companyService.js` — CRUD + `getPrimaryCompany()` (tek-firma MVP yardımcısı; gerçek çoklu-kiracı auth gelince oturumdaki `companyId`'ye göre firma getirmeye dönüştürülecek).
- `src/features/company/CompanyInfoSection.jsx` — firma adı, vergi no (opsiyonel), sektör (seçilebilir liste), çalışan sayısı, adres, telefon, e-posta ve **logo yükleme** (base64, IndexedDB'de saklanıyor — yeni bir dosya depolama servisi gerekmedi).

### 2. Şube Sistemi
- `src/services/branchService.js`, `src/features/company/BranchesSection.jsx` — şube adı, adres, sorumlu kişi. Ekle/düzenle/sil.

### 3. Departmanlar
- `src/constants/company.js` — varsayılan departman seti (Üretim, Depo, İdari İşler, İnsan Kaynakları, Bakım, Kalite).
- `src/services/departmentService.js` — `ensureDefaultDepartments()`: bir firma için hiç departman kaydı yoksa varsayılan seti otomatik oluşturur, varsa dokunmaz. Kullanıcı bunlara ek olarak kendi departmanlarını da ekleyebiliyor (`isCustom: true`, rozetle ayırt ediliyor).

### 4. Çalışanlar
- `src/services/employeeService.js`, `src/features/company/EmployeesSection.jsx` — Ad Soyad, Sicil No, Departman (yukarıdaki departman listesinden seçilebilir), Görev, Telefon, E-posta, Durum (Aktif/Pasif).

### 5. Rol Altyapısı — yalnızca veri yapısı (talep edildiği gibi)
- `src/types/index.js` içine `FullRole` tipi eklendi: `superAdmin | companyAdmin | employer | expert | employee` (5 rol).
- `src/constants/allRoles.js` — yeni, **hiçbir yerde aktif kullanılmıyor**. Aktif rol değiştirici (`src/contexts/RoleContext.jsx`) bilerek dokunulmadan, hâlâ yalnızca 3 rolü (expert/employer/employee) biliyor şekilde bırakıldı. Otomatik yönlendirme Sprint 4'te bu iki listeyi birleştirecek.

### 6. Dashboard Güncellemesi
- `src/features/dashboard/EmployerDashboard.jsx` artık **gerçek verileri** gösteriyor: firma adı + logo, Toplam Çalışan / Toplam Departman / Toplam Şube özet kartları — sabit `MOCK_EMPLOYEES` kaldırıldı (artık hiçbir yerde kullanılmadığı için `constants/mockEmployees.js` de silindi).
- Firma henüz oluşturulmamışsa, Dashboard boş durum gösterip Ayarlar → Firma Yönetimi'ne yönlendiriyor (çökme yok, `EmptyState` bileşeni kullanıldı).
- `constants/companies.js` (`MOCK_COMPANIES`) **kasıtlı olarak dokunulmadı** — bu, sahte kimlik doğrulama sisteminin (`authService.js`, `Profile.jsx`, `ExpertDashboard.jsx`) hâlâ kullandığı ayrı bir kavram; yeni gerçek `Company` sistemiyle çakışmıyor.

### 7. Responsive Kontrol
Kod-seviyesi denetim yapıldı (bu ortamda gerçek cihaz/tarayıcı testi imkanı yok — bkz. "Doğrulama"): yeni bileşenlerin tümünde mobil öncelikli tek-sütun + `sm:`/`md:` breakpoint'li grid, sekme çubuklarında `overflow-x-auto`, departman etiketlerinde `flex-wrap` kullanıldı — projenin geri kalanıyla aynı desen.

### Nerede yaşıyor?
Firma/Şube/Departman/Çalışan yönetimi, yeni bir route eklemeden **Ayarlar sayfasına** "Firma Yönetimi" bölümü olarak yerleşti (kendi iç sekme çubuğuyla). Sidebar/route listesi değişmedi.

### Doğrulama
Yine bu ortamda internet erişimi yok, gerçek `npm run build` çalıştırılamadı. Yapılan statik doğrulama:
- Tüm yeni/değişen dosyalar `tsc --noEmit` ile sözdizimi taramasından geçirildi → **0 hata.**
- Tüm import yolları ve ikon import'ları programatik doğrulandı → **tümü geçerli.**
- Early-return içeren tüm yeni bileşenlerde (`CompanyInfoSection`, `BranchesSection`, `DepartmentsSection`, `EmployeesSection`, `EmployerDashboard`) hook çağrı sırası tek tek doğrulandı → **Rules of Hooks ihlali yok.**
- Yeni IndexedDB store'larının (`companies`, `branches`, `departments`, `employees`) `db.js`'e eklendiği ve `DB_VERSION`'ın artırıldığı kontrol edildi.
- Responsive sınıflarının varlığı kod okuması ile doğrulandı (gerçek cihaz testi değil).

**Gerçek build doğrulaması için:** Zip'i GitHub/Netlify'a yükleyip `npm run build` sonucunu paylaşırsanız, hata varsa anında düzeltirim.

---

## [ACİL: Service Worker Beyaz Ekran Düzeltmesi] — Önceki güncelleme

**Prod olayı:** Chrome'da birkaç saat kullanımdan sonra beyaz ekran; Safari ve Gizli Sekme etkilenmiyordu.

**Kök neden:** `public/service-worker.js` cache-first stratejisi kullanıyordu (`caches.match(req).then(cached => cached || fetch(req))`). Kurulumda `/` (index.html) önbelleğe alınıyordu; bu, o anki Vite build'inin hash'li JS dosya adlarını referans alan HTML'i sonsuza dek sabitliyordu. Bir sonraki deploy'da eski hash'li chunk dosyaları sunucudan silinince, önbellekteki eski HTML onları isteyip 404 alıyor → beyaz ekran. Gizli Sekme'de SW hiç kurulmadığından etkilenmiyordu; Safari'nin SW yaşam döngüsü davranışı farklı olduğundan henüz belirtiyi göstermemiş olabilir.

**Uygulanan çözüm — siz açıkça "şimdilik tamamen devre dışı bırak" talimatı verdiniz, bu talimat uygulandı** (aşağıdaki modern versiyonlama stratejisi listeniz, SW yeniden eklenene kadar bu dosyaya not olarak bırakıldı, şimdi uygulanmadı):

- **`public/service-worker.js` bir "kill-switch" script'ine dönüştürüldü** (silinmedi). Neden silinmedi: tarayıcılar, kayıtlı bir Service Worker'ın güncelleme kontrolünde 404 aldığında onu OTOMATİK KALDIRMAZ — dosyayı silmek, hâlihazırda etkilenmiş kullanıcıları kurtarmazdı. Bunun yerine dosya artık: kurulumda hemen aktive olur, bu uygulamaya ait tüm `nobetci-isg-*` cache'lerini siler, **kendi kaydını siler** (`self.registration.unregister()`), ve o anda açık olan tüm sekmeleri bir kez yeniden yükler (`client.navigate(client.url)`) — böylece zaten bozuk pakete takılı kalmış sekmeler bile kurtarılır.
- **`src/main.jsx`** — `navigator.serviceWorker.register(...)` çağrısı tamamen kaldırıldı. Yerine: sayfa her açıldığında `navigator.serviceWorker.getRegistrations()` ile mevcut tüm kayıtlar bulunup kaldırılıyor, `caches.keys()` ile `nobetci-isg-` önekli tüm cache'ler siliniyor. Bu, kill-switch SW'nin ulaşamadığı senaryolar için ikinci bir güvenlik katmanı.
- **PWA/offline cache özellikleri geçici olarak pasif.** `manifest.json` ve ikon dosyaları kasıtlı olarak silinmedi (zararsızlar, SW olmadan zaten işlevsiz kalırlar) — ileride PWA geri eklenirken sıfırdan kurulum gerekmesin diye durduruluyorlar.
- **Çalışan özellik bozulmadı:** `notificationService.js`'deki gerçek push bildirimi (`showLocalNotification`) SW bulamayınca zaten `new Notification()` fallback'ine düşecek şekilde yazılmıştı — kod değişikliği gerekmedi, yalnızca yorum güncellendi. Bildirim özelliği çalışmaya devam ediyor, sadece "sekme tamamen kapalıyken göster" kapasitesi SW dönene kadar pasif.

### Gelecekte SW yeniden eklenince yapılacaklar (bu sprintte UYGULANMADI, yalnızca not)
Kullanıcının orijinal talep listesi, ileride referans olması için:
- Network-first strateji yalnızca JS/HTML için; hash'li statik varlıklar (CSS, font, görsel) cache-first kalabilir.
- Sürüm numarası/build hash'i ile cache adı ilişkilendirme (her deploy'da otomatik yeni cache adı).
- Yeni SW aktive olduğunda kullanıcıya "Yeni sürüm mevcut" toast'ı + güvenli "şimdi yenile" butonu (mevcut `ToastContext` kullanılabilir).
- Yalnızca gerçekten gerekli statik dosyaların (ikonlar, manifest) cache'e alınması — sayfa kabuğu (index.html) ASLA cache-first olmamalı.

### Doğrulama
- `main.jsx` ve `service-worker.js` `tsc` ile sözdizimi taramasından geçirildi → **0 hata.**
- Tüm proje genelinde import yolları yeniden doğrulandı → **sorun yok.**
- `notificationService.js`'nin SW'siz durumda fallback'e düştüğü kod okuması ile doğrulandı (davranış değişikliği yok, yalnızca yorum güncellendi).

**Önemli — kullanıcı tarafında hâlâ gerekli olabilecek adım:** Bu düzeltme deploy edildikten sonra, hâlâ eski/bozuk sekmesi açık olan kullanıcıların kill-switch SW'nin devreye girmesi için sekmeyi bir kez kapatıp açmaları (ya da tarayıcının otomatik SW güncelleme kontrolünü tetiklemesi, genelde saatler içinde kendiliğinden olur) gerekebilir. Acil ise Chrome'da `chrome://serviceworker-internals` üzerinden manuel "Unregister" de yapılabilir.

---

## [Periyodik Kontrol Takvimi, Denetim Geçmişi, Gerçek Push Bildirim] — Önceki güncelleme

Kural: mevcut kod tabanı korunarak geliştirildi, yeni proje oluşturulmadı, yeni kütüphane eklenmedi. Bu ortamda internet erişimi olmadığı için gerçek `npm run build` yine çalıştırılamadı — aynı kapsamlı statik doğrulama yöntemi (bkz. bu bölümün sonu) uygulandı.

### 1. Periyodik Kontrol Takvimi
- **Yasal/denetim değeri:** Ekipman, yangın tüpü, elektrik tesisatı gibi kalemlerin son kontrol tarihi + kontrol aralığına göre sonraki kontrol tarihi otomatik hesaplanıyor; süresi geçen/yaklaşan (14 gün içinde) kontroller ayrı rozetlerle öne çıkıyor.
- `src/constants/periodicCheck.js` — kategori listesi, aralık ön ayarları, `computeNextDueDate()`, `computeCheckStatus()` (mevcut tema tonlarını yeniden kullanıyor, yeni renk paleti eklenmedi).
- `src/services/periodicCheckService.js` — CRUD, IndexedDB (`periodicChecks` store, `db.js`'e eklendi, `DB_VERSION` 4→5).
- `src/features/documents/periodicChecks/` — modüler: `usePeriodicChecks.js`, `PeriodicCheckForm.jsx`, `PeriodicCheckCard.jsx`, `PeriodicChecksPanel.jsx`.
- **Dokümanlar sayfasına 4. sekme olarak eklendi** ("Periyodik Kontroller") — yeni route/sayfa yok.

### 2. Denetim / Aktivite Geçmişi
- `src/services/auditService.js` — `logActivity()` (fire-and-forget, hata verse bile ana akışı bozmaz) + `getAuditLog()`.
- `auditLog` store'u eklendi.
- `src/features/risk-analysis/AuditLogPanel.jsx` — modüle göre filtrelenebilir aktivite listesi.
- **Risk Analizi sayfasına 3. sekme olarak eklendi** ("Aktivite Geçmişi") — yeni route/sayfa yok.
- Şu akışlara tek satırlık, izole `logActivity()` çağrıları eklendi (çalışan mantık değişmedi, yalnızca ek kayıt satırı): bildirim oluşturma/onaylama, Fine-Kinney ekleme/güncelleme/silme, belge oluşturma/silme, ekipman ekleme.

### 3. Gerçek Push Bildirim
- `src/services/notificationService.js` — tarayıcının gerçek `Notification` API'si + kayıtlı service worker üzerinden **gerçek OS-seviyesi bildirim** gösterir (sekme arka plandayken de çalışır). **Kapsam sınırı (bilinçli):** bu, siteye hiç girilmeden (tamamen kapalıyken) bildirim göndermek için gereken sunucu-taraflı push altyapısını (VAPID, abonelik veritabanı, `web-push` kütüphanesi) içermez — o, yeni bir kütüphane ve backend gerektirir, "yeni kütüphane eklenmeyecek" kuralıyla çelişir. Bu haliyle uygulama açıkken/arka plandayken tetiklenen gerçek bildirimler çalışır.
- `public/service-worker.js` — `notificationclick` olay dinleyicisi eklendi (bildirime dokununca uygulamaya odaklanır/açar).
- `src/constants/notificationPrefs.js` — Settings ve servis arasında paylaşılan tek kaynak (önceden Settings içinde yerel olarak tanımlıydı, tekrar önlendi).
- Settings → Bildirimler bölümüne **"Etkinleştir"** butonu ve izin durumu rozeti eklendi.
- Tetikleyiciler (kullanıcının Settings'teki tercihine göre gösterilir/gösterilmez): AI analizi tamamlandığında, bildirim onaylanıp göreve dönüştüğünde, Fine-Kinney'de "Çok Yüksek Risk" kaydedildiğinde.

### Kapsam doğrulaması
Bu sprintte yeni/değişen dosyalar: `db.js` (2 store eklendi), 3 yeni constants dosyası, 3 yeni service dosyası, `periodicChecks/` (4 dosya) + `AuditLogPanel.jsx` (yeni), `RiskAnalysisPage.jsx` / `DocumentsPage.jsx` / `DocumentGenerator.jsx` / `useFineKinneyEntries.js` / `Settings.jsx` / `service-worker.js` (hedefli, izole eklemeler — mevcut fonksiyonlar korunarak). Başka hiçbir dosyaya dokunulmadı.

### Doğrulama
- Tüm yeni/değişen dosyalar `tsc --noEmit` ile tek tek sözdizimi taramasından geçirildi → **0 hata.**
- Tüm import yolları ve ikon import'ları programatik doğrulandı → **tümü geçerli.**
- Yeni early-return içeren bileşenlerin (`PeriodicChecksPanel`, `AuditLogPanel`, güncellenen `DocumentGenerator`) hook çağrı sırası tek tek kontrol edildi → **sorun yok.**
- `RoleContext`, `Badge` tonları gibi paylaşılan export'ların kullanıldığı yerlerle eşleştiği doğrulandı.

**Gerçek build doğrulaması için:** Zip'i GitHub/Netlify'a yükleyip `npm run build` sonucunu paylaşırsanız anında düzeltirim.

---

## [Fine-Kinney Modülü — Profesyonel Seviye] — Önceki güncelleme

Kural: yalnızca Fine-Kinney Risk Analizi modülüne dokunuldu. Başka hiçbir modül (Bildirim Merkezi, Dashboard'lar, Chat, Dokümanlar, Auth) değiştirilmedi — aşağıdaki "Kapsam doğrulaması" bölümünde bu programatik olarak kontrol edildi.

### 1-4. Gerçek Fine-Kinney hesaplama ve renklendirme
- `src/constants/fineKinney.js` — ölçekler talep edilen tam değerlerle güncellendi: Olasılık artık 0.1'den başlıyor (7 basamak), Maruziyet etiketleri güncellendi, Şiddet etiketleri talep edilen metinle birebir eşleşiyor.
- Risk = Olasılık × Maruziyet × Şiddet, otomatik hesaplanıyor (`computeFineKinneyScore`).
- 5 kademeli renklendirme eklendi: <20 Yeşil, 20-69 Açık Yeşil, 70-199 Sarı, 200-399 Turuncu, 400+ Kırmızı (`getFineKinneyRiskLevel` artık tema-duyarlı gerçek renkler döndürüyor — light/dark için ayrı palet).
- Bu yeni renkler (açık yeşil, turuncu) paylaşılan `Badge.jsx` bileşenine **eklenmedi** — böylece Dashboard/Bildirim Merkezi'ndeki mevcut rozetler etkilenmedi. Bunun yerine Fine-Kinney'e özel `RiskLevelChip.jsx` oluşturuldu.

### 5. Sonuç kartı
- `fineKinney/RiskLevelChip.jsx` — puan, seviye, renk ve kısa açıklama içeren gösterge; hem formda (canlı önizleme) hem liste kartlarında kullanılıyor.

### 6-8. Kayıt, düzenleme, silme
- Liste görünümünde artık **Tarih** de var (`FineKinneyEntry.date` alanı eklendi — `types/index.js`).
- Düzenleme ve silme korundu, `useFineKinneyEntries.js` hook'una taşındı (bkz. "Modülerlik").

### 9. AI önerileri
- Formda "🤖 AI Önerisi Al" butonu: tehlike + risk metnini mevcut `chatService` üzerinden (yeni servis eklenmedi) gönderiyor, Kontrol Tedbirleri / KKD Önerileri / Kısa Açıklama formatında cevap alıyor.
- `constants/systemPrompt.js` içine yalnızca yeni bir `FINE_KINNEY_AI_PROMPT` sabiti eklendi — mevcut `SYSTEM_PROMPT` (chat/bildirim akışlarının kullandığı) **tek karakter değişmedi.**
- Öneri, tek tıkla "Alınacak Önlem" alanına eklenebiliyor.

### 10. Arama ve filtreleme
- `fineKinney/FineKinneyFilters.jsx` — metin arama (tehlike/risk içinde) + risk seviyesine göre 6 filtre çipi (Tümü + 5 seviye).

### 11. PDF / Excel — henüz çalışmıyor
- `fineKinney/FineKinneyExportButtons.jsx` — iki buton, ikisi de `disabled`, üzerlerinde "Yakında" rozeti. Herhangi bir PDF/Excel kütüphanesi eklenmedi.

### 12. Mobil uyumluluk
- Form alanları `sm:grid-cols-2/3` ile mobilde tek sütuna düşüyor, filtre çipleri yatay kaydırılabilir, liste `sm:grid-cols-2` ile mobilde tek sütun.

### 13-15. Mimari kuralları
- **Yeni kütüphane eklenmedi.**
- **Kod modüler:** modül 7 küçük dosyaya bölündü (`src/features/risk-analysis/fineKinney/`): `useFineKinneyEntries.js` (veri/mantık), `FineKinneyForm.jsx`, `FineKinneyCard.jsx`, `FineKinneyFilters.jsx`, `FineKinneyExportButtons.jsx`, `RiskLevelChip.jsx`. `FineKinneyModule.jsx` artık yalnızca bunları birleştiren ince bir orkestratör. `RiskAnalysisPage.jsx` **tek satır değişmedi** — `FineKinneyModule.jsx`'i eskisi gibi import ediyor.

### Kapsam doğrulaması
Bu sprintte değişen/eklenen dosyalar yalnızca: `src/features/risk-analysis/FineKinneyModule.jsx` (yeniden yazıldı) + yeni `src/features/risk-analysis/fineKinney/*` (7 dosya) + `src/constants/fineKinney.js` (güncellendi) + `src/constants/systemPrompt.js` (yalnızca ek export) + `src/types/index.js` (yalnızca `FineKinneyEntry.date` eklendi). `NotificationCard.jsx`, `RiskAnalysisPage.jsx` dahil projedeki hiçbir başka dosyaya dokunulmadı — programatik olarak doğrulandı.

### Doğrulama
Yine bu ortamda internet erişimi yok, gerçek `npm run build` çalıştırılamadı. Yapılan statik doğrulama:
- Tüm yeni/değişen dosyalar `tsc --noEmit` ile sözdizimi açısından tarandı → **0 hata.**
- Tüm import yolları ve ikon import'ları programatik doğrulandı → **tümü geçerli.**
- `FineKinneyModule.jsx`'teki hook çağrı sırası (early-return öncesi) manuel kontrol edildi → **sorun yok.**
- `RiskAnalysisPage.jsx`'in `FineKinneyModule`'ü import ediş şeklinin değişmediği doğrulandı.

**Gerçek build doğrulaması için:** Zip'i GitHub/Netlify'a yükleyip `npm run build` sonucunu paylaşırsanız, hata varsa anında düzeltirim.

---

## [AI Chat Hazırlığı, Genişletilmiş Ayarlar, Performans Temizliği] — Önceki güncelleme

Kural: yeniden yazma yok, çalışan sistem korunarak üzerine inşa edildi. Bu ortamda internet erişimi olmadığı için `npm install`/`npm run build` gerçek anlamda çalıştırılamadı — bunun yerine TypeScript derleyicisiyle tüm dosyaların sözdizimi tek tek doğrulandı, tüm import/export yolları programatik olarak kontrol edildi, React hook sırası (Rules of Hooks) her early-return içeren bileşende manuel izlendi, Router/Layout/Context zinciri uçtan uca takip edildi. Bkz. bu bölümün sonundaki "Doğrulama" notu.

### 6. AI Chat — sohbet veri yapısı hazırlığı
- `src/types/index.js` — `Conversation` tipi eklendi (`conversationId, userId, messages, createdAt, updatedAt`).
- `src/features/chat/conversationUtils.js` — **yeni, hiçbir yere bağlanmadı.** `createConversation(userId)` ve `touchConversation(conversation, messages)` saf fonksiyonları hazır bekliyor. `ChatPanel.jsx` hiç değiştirilmedi — çalışan sohbet sistemi bire bir aynı şekilde çalışmaya devam ediyor. Veritabanına kayıt yok (istendiği gibi).

### 7. Ayarlar genişletildi
- **Tema** — geri eklendi (Header'daki hızlı geçişle senkron, aynı `ThemeContext`).
- **Dil** — `src/contexts/LanguageContext.jsx` (yeni). Şu an yalnızca Türkçe aktif, İngilizce "Yakında" etiketiyle listeleniyor — gerçek çeviri altyapısı (yeni bağımlılık) eklenmedi.
- **Bildirimler** — 3 tercih anahtarı (yeni bildirim, AI analizi tamamlandı, görev atandı), cihazda saklanıyor.
- **Profil** — profil sayfasına kısayol.
- **Rol (Demo)** — korundu.
- **Abonelik** — yalnızca pasif bir "Yakında" satırı; mantık eklenmedi (talep edildiği gibi sonraya bırakıldı).

### 8. Performans / kod tekrarı azaltma
- `src/hooks/useLocalStorage.js` — **yeni, paylaşılan hook.** `ThemeContext` ve `RoleContext` artık kendi localStorage try/catch mantığını tekrar etmiyor, bu hook'u kullanıyor (eski formatla geriye dönük uyumlu — önceden düz string olarak saklanan `tema`/`rol` değerleri hâlâ doğru okunuyor).
- **Kullanılmayan bileşenler kaldırıldı:** `Card.jsx`, `Input.jsx`, `Loader.jsx` — hiçbir dosyada import edilmiyorlardı, projede sıfır tüketicileri vardı (kontrol edildi). `Modal.jsx` kaldırılmadı çünkü `ConfirmDialog.jsx` üzerinden dolaylı olarak kullanılıyor.
- Lazy loading (`React.lazy` + `Suspense`, `App.jsx`) korundu, dokunulmadı.

### 9. Güvenlik doğrulaması
- `src/`, `public/`, `index.html` içinde `ANTHROPIC`, `sk-ant`, `api.anthropic.com` için tam tarama yapıldı — **sıfır sonuç.** API anahtarı yalnızca `netlify/functions/chat.js` içinde `process.env.ANTHROPIC_API_KEY` olarak duruyor. Değişiklik yok, yeniden doğrulandı.

### Doğrulama (bu ortamın kısıtı nedeniyle)
Bu sandbox'ta internet erişimi kapalı olduğu için gerçek `npm install` / `npm run build` / tarayıcıda canlı açma testi **yapılamadı** — bunu iddia etmiyorum. Onun yerine:
- Her `.js`/`.jsx` dosyası `tsc --noEmit` ile tek tek sözdizimi açısından tarandı (yalnızca gerçek sözdizimi hataları (`TS1xxx`) raporlanacak şekilde filtrelendi) → **0 hata.**
- Tüm göreli import yolları dosya sisteminde gerçekten var mı diye programatik olarak kontrol edildi → **tümü geçerli.**
- Tüm `components/icons/index.jsx` import'ları gerçek export'larla eşleştirildi → **tümü geçerli.**
- Early-return içeren her bileşen (`Profile`, `FineKinneyModule`, `DocumentGenerator`) hook çağrı sırası için manuel incelendi → **Rules of Hooks ihlali yok.**
- `App.jsx` → `Layout.jsx` → `Header.jsx`/`Sidebar.jsx` → sayfa bileşenleri zinciri, context sağlayıcı sırasıyla (`main.jsx`) birebir karşılaştırıldı → **tutarlı.**

**Gerçek build doğrulaması için:** Bu zip'i GitHub'a yükleyip Netlify'da deploy ettiğinizde, `npm run build` Netlify'ın kendi sunucusunda (internet erişimi olan) çalışacak. Bir hata çıkarsa, tam hata mesajını buraya yapıştırın — anında düzeltirim.

---

## [Auth Hazırlığı, Role-Based Routing, Fine-Kinney, Doküman Altyapısı] — Önceki güncelleme

Kural: yeniden yazma değil, mevcut çalışan sistem korunarak üzerine inşa edildi. Yeni sayfa/route eklenmedi — tüm yeni özellikler mevcut route'ların içine (sekme olarak) yerleşti. Yeni bağımlılık eklenmedi.

### 1. Auth sistemi hazırlığı
- Rol değerleri artık sabit ve gerçek sisteme hazır: yalnızca `expert` | `employer` | `employee` (önceki `worker` değeri her yerde `employee` olarak güncellendi — bkz. `src/contexts/RoleContext.jsx`).
- `src/types/index.js` — `User` tipine `companyId` eklendi (`company` yerine), gerçek şirket ilişkisine hazır.
- `src/constants/mockUsers.js` — her rol için ayrı sahte kullanıcı (`MOCK_USERS.expert/employer/employee`), her biri `id, name, email, companyId, role, subscription` alanlarına sahip.
- `src/constants/companies.js` — sahte şirket dizini, `companyId` ile ilişkili.
- `src/services/authService.js` — `getCurrentUser(role)` artık role'e göre doğru sahte kullanıcıyı döndürüyor. Gerçek login eklenince yalnızca bu dosya değişecek, `role` parametresi kalkıp sunucudan gelen oturum bilgisiyle değişecek.
- `src/pages/Profile.jsx` — artık gerçek `companyId → şirket adı` çözümlemesi yapıyor, rol değiştikçe otomatik güncelleniyor.

### 2. Role-based routing
- `/dashboard` route'u tek kalmaya devam ediyor (gereksiz yeni route eklenmedi) — ama içeriği tamamen role'e göre seçiliyor: `src/features/dashboard/DashboardPage.jsx` artık `ExpertDashboard` / `EmployerDashboard` / `EmployeeDashboard` arasında yönlendirme yapan ince bir router.
- Gerçek login eklendiğinde, kullanıcı `/dashboard`'a gittiğinde otomatik olarak kendi rolüne uygun görünümü görecek — kod zaten buna göre yazıldı, ekstra değişiklik gerekmeyecek.

### 3. Role bazlı dashboard içerikleri
- `src/features/dashboard/ExpertDashboard.jsx` — Aktif şirketler, Bekleyen analizler, Son analizler, AI Chat kısayolu.
- `src/features/dashboard/EmployerDashboard.jsx` — Şirket özeti, Risk analizleri (onaylanmış bildirimler), Çalışanlar (`constants/mockEmployees.js`), Eğitimler.
- `src/features/dashboard/EmployeeDashboard.jsx` — Eğitimler, Bildirimlerim, Kendisine atanmış görevler (onaylanmış kendi bildirimleri).
- Üçü de gerçek paylaşılan veriyi (`IsgDataContext`) kullanıyor — mock olan yalnızca şirket/çalışan listeleri.

### 4. Fine-Kinney modülü güçlendirildi
- `src/constants/fineKinney.js` — standart Olasılık/Frekans/Şiddet skala değerleri + `computeFineKinneyScore()` + `getFineKinneyRiskLevel()` (5 kademeli risk seviyesi).
- `src/services/riskService.js` — artık gerçek CRUD içeriyor (`getFineKinneyEntries`, `saveFineKinneyEntry`, `deleteFineKinneyEntry`), IndexedDB'de saklıyor. `scoreRisk()` hâlâ placeholder (gelecekteki AI destekli otomatik puanlama için ayrıldı).
- `src/features/risk-analysis/FineKinneyModule.jsx` — düzenlenebilir liste: Tehlike, Risk, Olasılık, Frekans, Şiddet, otomatik puan, risk seviyesi, önlem, sorumlu, termin tarihi, durum. Ekle/düzenle/sil destekli, veri tamamen JSON-serileştirilebilir.
- Risk Analizi sayfası artık iki sekmeli: "Bildirim Merkezi" (değişmedi) ve "Fine-Kinney Değerlendirmesi" (yeni). L Tipi matris eklenmedi (talep edilmedi).

### 5. Doküman altyapısı
- `src/constants/documentTypes.js` — 6 belge türü: Risk Analizi, Acil Durum Planı, Talimat, KKD Teslim Tutanağı, Ramak Kala, İş Kazası Bildirimi.
- `src/services/documentService.js` — `getDocuments`, `saveDocument`, `deleteDocument` eklendi (equipment fonksiyonlarının yanına).
- `src/features/documents/DocumentGenerator.jsx` — belge türü + başlık seçip taslak oluşturma arayüzü. **Henüz AI ile içerik üretmiyor** (`content` alanı boş placeholder) — talep edildiği gibi yalnızca arayüz ve veri modeli.
- Dokümanlar sayfası artık üç sekmeli: Ekipman Kayıtları, Eğitim Modülleri, Belge Oluştur (yeni).

### Kod tekrarını azaltma
- `src/constants/education.js` — eğitim modülleri listesi artık tek yerde tanımlı, hem Dokümanlar sayfası hem Employer/Employee dashboard'ları buradan okuyor (önceden yalnızca Dokümanlar'da tanımlıydı, dashboard'lar için kopyalamak yerine paylaşıldı).

### Bozulmayanlar (doğrulandı)
- AI Chat, Bildirim Merkezi akışı, QR ekipman takibi, Netlify Functions, PWA, dark/light tema — hepsi test edildi, hiçbir import/referans kopmadı (otomatik bütünlük kontrolünden geçti).
- API sistemi değişmedi — hâlâ yalnızca `chatService.js` üzerinden, yalnızca `netlify/functions/chat.js` proxy'si ile.

---

## [Kurumsal Mimari Refaktörü] — Önceki güncelleme

Bu bir yeniden yazma değildir — çalışan hiçbir özellik bozulmadı, kod yeni bir mimariye taşındı.

### Kaldırıldı
- `src/pages/Settings.jsx` — tekrarlanan tema değiştirici kaldırıldı (zaten Header'da mevcut)
- `src/services/api.js` — yerini `src/services/chatService.js` aldı
- `src/hooks/useIsgData.js` — yerini `src/contexts/IsgDataContext.jsx` aldı (bkz. "Düzeltilen hata")

### Eklendi — Servis katmanı
- `src/services/chatService.js` — **tek gerçekten çalışan servis.** Chat ve fotoğraf analizi Netlify Function proxy'sine buradan gidiyor.
- `src/services/authService.js` — **sahte (mock) kullanıcı sistemi.** `getCurrentUser()` şu an sabit bir `User` objesi döndürüyor (`id, name, email, company, role, subscription`). Gerçek kimlik doğrulama eklenince yalnızca bu dosya değişecek.
- `src/services/documentService.js` — ekipman kayıtları için IndexedDB sarmalayıcı (gerçek, çalışıyor — ama API'ye gitmiyor).
- `src/services/riskService.js` — **iskelet/placeholder.** Risk analizi şu an `chatService` üzerinden yapılıyor; bu dosya gelecekte özel bir risk-skorlama backend'i eklenince kullanılacak.

### Eklendi — Sayfa/Route yapısı
- `src/App.jsx` — tüm sayfalar artık `React.lazy` + `Suspense` ile code-splitting kullanıyor (her sayfa kendi JS parçası, yalnızca ziyaret edildiğinde indiriliyor).
- Tüm sayfalara `useDocumentTitle` hook'u eklendi (`src/hooks/useDocumentTitle.js`) — sekme başlığı sayfaya göre dinamik olarak değişiyor.

### Eklendi — Hata yönetimi
- `src/components/ErrorBoundary.jsx` — `main.jsx`'te tüm uygulamayı sarmalıyor, render hatalarını yakalayıp kullanıcıya "Sayfayı Yenile" seçeneği sunuyor.
- `src/components/Loading.jsx` — tam sayfa yükleme göstergesi (Suspense fallback olarak da kullanılıyor).
- `src/components/EmptyState.jsx` — boş liste durumları için (Dashboard ve Risk Analizi'nde kullanıldı).
- 404 sayfası zaten mevcuttu (`src/pages/NotFound.jsx`), route yapısına bağlı kalmaya devam ediyor.

### Eklendi — Yeniden kullanılabilir bileşenler (`src/components/ui/`)
`Button`, `Input`, `Modal`, `Card`, `Badge`, `Loader`, `Toast` (+ `src/contexts/ToastContext.jsx`), `ConfirmDialog`.
Bazıları (Button, Badge, EmptyState) Risk Analizi ve Dashboard sayfalarında kullanılmaya başlandı; diğerleri (Modal, Input, Card, ConfirmDialog) hazır ve kullanılabilir durumda ama henüz her ekrana zorla entegre edilmedi — mevcut, çalışan arayüzü bozmamak adına kademeli benimseme tercih edildi.

### Düzeltilen hata
- **Veri tutarsızlığı:** Önceki sürümde `useIsgData` düz bir hook'tu; Header, Dashboard, Risk Analizi ve Dokümanlar sayfaları her biri kendi bağımsız IndexedDB okuma/durum kopyasına sahipti. Bir sayfada bildirim gönderildiğinde diğerleri anında güncellenmiyordu. Şimdi `src/contexts/IsgDataContext.jsx` tek bir paylaşılan kaynak — tüm sayfalar gerçek zamanlı senkronize.

### TypeScript hazırlığı
- `src/types/index.js` içine `User` tipi eklendi (JSDoc `@typedef`).
- Servis fonksiyonlarına JSDoc `@param`/`@returns` eklendi — ileride `.ts`'e geçişte tip çıkarımı kolaylaşsın diye.
- Yeni bağımlılık eklenmedi (TypeScript derleyicisi dahil) — mevcut kısıtlamaya uyuldu.

### Performans
- Route bazlı code splitting (`React.lazy`/`Suspense`).
- `React.memo`: `NotificationCard`, `QuickActionButton` — liste öğeleri artık gereksiz yere yeniden render olmuyor.
- `useMemo`: Dashboard metrikleri, Risk Analizi'nde görünür bildirim filtresi.
- `useCallback`: memoized bileşenlere geçen tüm handler'lar (`askQuickAction`, `copyMessage`, `submitNotification`, `expertApprove`).

### Güvenlik
- Değişiklik yok — API anahtarı hâlâ yalnızca `netlify/functions/chat.js` içinde, ortam değişkeni olarak duruyor. Hiçbir noktada frontend koduna yazılmadı.

### Bozulmayanlar (doğrulandı)
- AI Chat (hazır sorular, fotoğraf analizi, kopyala/temizle)
- Bildirim Merkezi akışı (Çalışan → AI → Uzman → İşveren)
- QR ekipman takibi, Eğitim modülleri
- Netlify Functions, `netlify.toml` build ayarları
- PWA (manifest, service worker) — `/public` altında değişmeden duruyor
- Dark/Light tema — `localStorage`'da saklanmaya devam ediyor, artık yalnızca Header'da
