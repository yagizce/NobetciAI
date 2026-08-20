# Sprint Takibi

Bu doküman geliştirmenin **sprint bazlı** kaydını tutar. Her satır tek bir sprinti temsil
eder ve [ROADMAP.md](./ROADMAP.md)'deki ilgili **faza** bağlanır. Ayrıntılı, dosya
seviyesinde değişiklik kaydı için kök dizindeki `CHANGELOG.md` (tarihsel geliştirme
notları) ve [CHANGELOG.md](./CHANGELOG.md) (sürüm bazlı özet) dosyalarına bakın.

## Tamamlanan Sprintler

| Sprint | Odak | Faz | Durum |
|---|---|---|---|
| Acil Öncelikler — Demo Veri Temizliği + AI Uyarı Konumlandırma + Yedek Hatırlatması | Sahte "eğitim hatırlatma" bildirimi kaldırıldı (gereksiz+sahteydi, gerçek trainingDue zaten üretiliyordu); "Ahmet Yıldız" hardcoded ismi 3 dosyada MOCK_USERS'a bağlandı; ölü MOCK_COMPANIES silindi; AI Copilot/Fine-Kinney AI önerisi/mevzuat AI panelinde eksik "uzman onayı gerekir" uyarıları eklendi; BackupSection'a son yedek tarihi takibi + 30 gün+ bayat yedek uyarısı eklendi | Phase 1 | ✅ |
| Backend Geçiş Hazırlığı — Modelleme Boşluklarının Kapatılması | `DATABASE_PLAN.md`'deki 4 eksik tablo (Documents, RiskDetections, SystemNotifications, TrainingCourseSettings) modellendi; SQL şema/RLS/provider taslakları buna göre güncellendi (16/16 IndexedDB store'u artık karşılıklı); ayrıca `notifications` tablosunun sütunlarının gerçek `Notification` tipiyle uyuşmadığı fark edilip düzeltildi | Phase 1 (hazırlık) | ✅ |
| Backend Geçiş Hazırlığı — SQL/RLS/Provider Taslakları + Şifre Sıfırlama UI | `docs/backend-migration/` altında Supabase şema+RLS SQL taslakları ve inaktif `supabaseDataProvider` referans implementasyonu (src/ dışında, build'e etkisiz), servis katmanı firma-izolasyonu denetimi (zaten tamamdı, doğrulandı), "Şifremi Unuttum" mock ekranı | Phase 1 (hazırlık, Phase 7'ye köprü) | ✅ |
| Risk Temizliği Sprinti | 15 dosyadaki zaman dilimi hatası/kod tekrarının merkezi giderilmesi, `restoreFullBackup`'ın gerçek IndexedDB transaction'ıyla atomikleştirilmesi, gereksiz interval yeniden kurulumunun düzeltilmesi | Phase 1 | ✅ |
| Geliştirme Sprinti — Performans Trendi Tamamlama | Dashboard'daki sentetik trend grafiğinin gerçek `date`/`closedAt` verisiyle tamamlanması | Phase 1 | ✅ |
| Hardening / Stabilite Sprinti | Yedek geri yükleme hata yakalama, CSV id çakışması, çift-tıklama/yarış koruması (ConfirmDialog + useSubmitGuard), completionPercent sınırlama | Phase 1 | ✅ |
| Mevcut Sistem İyileştirme — Hata/Tutarlılık Sprinti | Periyodik kontrol bayat-durum bug'ı, Risk Tespiti→Fine-Kinney departman kopukluğu, mobil menü/form odak-zoom düzeltmeleri, `createCrudService` migrasyonu | Phase 1 | ✅ |
| Kurumsal Mimari Refaktörü | Servis katmanı, code-splitting, hata yönetimi, ortak bileşenler | Phase 1 | ✅ |
| Auth Hazırlığı & Role-Based Dashboard | Rol sistemi (3 rol), Fine-Kinney servisi, doküman altyapısı | Phase 1 | ✅ |
| AI Chat Hazırlığı & Ayarlar Genişletmesi | Sohbet veri modeli, Dil/Bildirim ayarları, `useLocalStorage` | Phase 4 | ✅ |
| Fine-Kinney — Profesyonel Seviye (v1) | Gerçek puanlama/renklendirme, AI önerisi, arama/filtre | Phase 2 | ✅ |
| Periyodik Kontrol & Denetim Geçmişi | Periyodik kontrol takvimi, `auditService`, gerçek push bildirim | Phase 1 | ✅ |
| Service Worker Beyaz Ekran Düzeltmesi | Prod hotfix — SW kill-switch, PWA geçici devre dışı | Phase 8 | ✅ |
| Firma Sistemi | Firma/Şube/Departman/Çalışan CRUD, rol altyapısı veri modeli | Phase 1 | ✅ |
| Backend-Hazır Soyutlama Katmanı | `dataProvider.js`, `authService` Supabase-şekilli mock arayüz | Phase 1 | ✅ |
| Sprint 4A — Foundation | `RouteGuard`, `permissions.js`, tüm tiplere `companyId` | Phase 1 | ✅ |
| Sprint 4A.2 — Enterprise UX | Dashboard 2.0, Bildirim Merkezi (sistem olayları), Profil genişlemesi | Phase 1 | ✅ |
| Sprint 4A.3 — Executive Dashboard | Güvenlik skoru, yönetici özeti, trendler, düzeltici faaliyet paneli | Phase 1 | ✅ |
| Sprint 5A — Risk Yönetimi (v2) | Fine-Kinney açıklamalı puanlama, Risk Detay Sayfası (6 sekme), gelişmiş filtreleme | Phase 2 | ✅ |
| Sprint 6 — Bilgi Kütüphanesi | Kategorili doküman kütüphanesi (mock), arama/filtre/detay ekranı | Phase 3 | ✅ |
| Rol Modeli Birleştirmesi & AI Hook Refaktörü | Tek rol kaynağı (`allRoles.js`), `useAIRiskAnalysis` çıkarımı, doküman senkronizasyonu | Phase 1 | ✅ |
| Sprint 7.1 — Risk Workflow Foundation | 6 durumlu esnek risk yaşam döngüsü modeli, legacy `status` uyumluluğu | Phase 2 | ✅ |
| Dashboard Genişletmesi | Kazasız gün sayacı, risk workflow/departman kırılımı widget'ları, dikkat gerektirenler listesi | Phase 2 | ✅ |
| Sprint 7.2 — Eğitim Modülü | Video (yer tutucu) + sınav + otomatik puanlama + katılımcı listesi (uzman/işveren) | Phase 1 | ✅ |
| Sprint 7.2.1 — Education Module (genişletme) | İlerleme yüzdesi, kaldığı yerden devam, 4 durumlu model, dashboard istatistikleri | Phase 1 | ✅ |
| Sprint 7.2.2 — Periyodik Kontrol Modülü (genişletme) | Filtreleme, takvim görünümü, dashboard kartı, tek tıkla tamamlama | Phase 1 | ✅ |
| Bilgi Kütüphanesi — AI Asistanı | "AI'ya Sor" (RAG-lite), favoriler, ilgili dokümanlar | Phase 5 | ✅ |
| Sprint 7.4 — Karar Destek Dashboard & Deneyim Rafine | Gerçek "Son 30 Gün Değişim", Yaklaşan Kontroller ve Devam Eden Eğitimler kartları; mobil dokunma alanı ve loading/error iyileştirmeleri | Phase 1 | ✅ |
| Sprint 7.2.3 — Periyodik Kontrol Merkezi (genişletme) | Üst özet kartları, departman/tarih filtresi, Kontrol Detayı ekranı, Bugün/Bu Hafta/Bu Ay takvim modları, dashboard-hazır istatistik fonksiyonu | Phase 1 | ✅ |
| Sprint 7.2.4 — Dashboard: Platformun Merkezi | Açık Kritik Riskler kartı, kartlardan modüllere tıkla-git, tooltip/kısa açıklamalar, "veri yok" boş durumu, Son Aktiviteler'de modül bağlantısı | Phase 1 | ✅ |
| Sprint 7.5 — AI Mevzuat Takibi & Proaktif Fine-Kinney Önerisi | Mevzuat + mevcut risk kayıtlarını birlikte tarayan AI paneli: gözden geçirme işaretleri + yeni risk taslak önerileri (Phase 5'in kapanış hedefi) | Phase 5 | ✅ |
| Sprint 9.1 — Risk Tespiti (triage havuzu) | Fine-Kinney'den ayrı yeni sekme: manuel/simüle tespit, biriktirme, AI destekli Fine-Kinney taslağı, "Sahaya İn" manuel akışı (Phase 9'un ilk, kamerasız teslimatı) | Phase 9 | ✅ |
| Teknik Borç Sağlamlaştırma — Rol Sadeleştirme & Test Altyapısı | 5 rollü model 3 role indirildi (companyAdmin/superAdmin kaldırıldı — OSGB senaryosu şu anlık hedeflenmiyor); `node:test` ile 23 birim test (risk puanı, risk seviyesi sınırları, Fine-Kinney filtreleme, RAG-lite doküman eşleştirme, rol/izin) — sıfır yeni bağımlılık | Phase 1 | ✅ |
| AI Özellikleri — scoreRisk() Gerçek İmplementasyonu | Fine-Kinney formuna "AI ile Puanla" butonu — tehlike+risk metninden başlangıç Olasılık/Maruziyet/Şiddet önerisi (`useInitialRiskScore.js` → `riskService.scoreRisk()`) | Phase 4 | ✅ |
| AI Özellikleri — Bağlama Duyarlı Copilot, Doküman Üretimi & Hook Birleştirmesi | 4 modülden "AI'ya Sor" ile bağlama duyarlı sohbet girişi; belge oluşturmada AI taslak üretimi + `DocumentDetailDrawer.jsx`; `useAIRiskAnalysis`/`useInitialRiskScore` ortak `useAiSuggestion` hook'una taşındı | Phase 4 | ✅ |
| Fotoğraftan Tehlike Tespiti | Risk Tespiti sekmesine "Fotoğrafla Tespit Et" — kullanıcının çektiği fotoğraf AI ile kategori+not önerisi üretip formu ön dolduruyor (`usePhotoDetection.js`) | Phase 9 | ✅ |
| ⚠️ Test Altyapısı Düzeltmesi & Türkçe İ Bug Fix | `npm test` glob'u düzeltildi (2+ derinlikteki testler hiç çalışmıyordu); Türkçe "İ problemi" (`.toLowerCase()` → `turkishLower()`, 7 dosya) düzeltildi | Phase 1 | ✅ |
| Eğitim Modülü Genişletmeleri | Sınavlarda çoklu seçim soru tipi; "Tamamlama Belgesi" PDF export'u (sıfır yeni bağımlılık, tarayıcı yazdırma diyaloğu) | Phase 4 | ✅ |
| Export / Raporlama | Fine-Kinney + Dashboard için gerçek PDF/Excel export (önceden "Yakında" placeholder); `utils/exportCsv.js`, `utils/printWindow.js` paylaşılan altyapısı | Phase 2 | ✅ |
| Bildirim / Hatırlatma | Gecikmiş/yaklaşan periyodik kontrol + eğitim son tarihi için gerçek tarayıcı bildirimi (günlük tarama); kurs-bazlı son tarih alanı eklendi | Phase 2 | ✅ |
| RAG-lite İyileştirmesi | Bilgi Kütüphanesi araması: eş anlamlı/kısaltma sözlüğü (10 grup, iki yönlü) + alan ağırlıklandırması (başlık>etiket>özet>içerik) + tam ifade bonusu | Phase 5 | ✅ |
| PWA / Offline — Service Worker v2 | v1'in beyaz ekran olayından ders çıkarılarak güvenli (network-first) SW yeniden yazıldı; offline sayfası, versiyonlu cache temizliği | Phase 8 | ✅ |
| Toplu Veri İçe Aktarma, Uygulama Geneli Arama & Toplu İşlem | CSV içe aktarma (Çalışan/Departman/Şube); Header'a gerçek uygulama geneli arama; Periyodik Kontrol'de çoklu seçim + toplu işlem | Phase 2 | ✅ |
| Güvenlik & Dayanıklılık — CSV Enjeksiyon, Error Boundary, Tam Yedekleme, Gizlilik Perdesi | CSV formula injection koruması; sayfa-seviyesi Error Boundary; tam yedekleme/geri yükleme; görev değiştirici gizlilik perdesi | Phase 8 | ✅ |
| Netlify → Vercel Geçişi | `netlify/functions/chat.js` → `api/chat.js`; `netlify.toml` → `vercel.json`; tüm dokümantasyon güncellendi | Phase 8 | ✅ |
| Güvenlik Sprinti 2 — Açık Proxy, Dosya Doğrulama, Vercel Header'ları | `api/chat.js` açık proxy kapatıldı (rate limit + max_tokens tavanı + origin kontrolü); `fileValidation.js` (4 yükleme noktası); Vercel güvenlik header'ları (+ CSP Report-Only); CSV/yedek boyut sınırları | Phase 8 | ✅ |
| Yönetici Modu (Patron Ekranı) | Employer Dashboard'a 3. sekme: 5 kartlık sade özet (açık kritik risk, geciken kontrol, son 30 günde kapanan risk, eğitim tamamlama %, son kaza) — yeni hesaplama yok, mevcut `metrics`/`last30DayChange`/`accidentFreeStreak`/`computePeriodicCheckStats` yeniden kullanıldı | Phase 1 | ✅ |
| Bölüm Bazlı Risk Isı Haritası | `DepartmentHeatMap.jsx` — departmanları kayıt sayısına değil ortalama Fine-Kinney skoruna (şiddet) göre renklendirir; mevcut 5'li risk paleti (`getFineKinneyRiskLevel`) yeniden kullanıldı, `DepartmentRiskBreakdown`'ın yerine geçmez, tamamlar | Phase 2 | ✅ |
| Tek Tık Denetim Dosyası (PDF) | `auditPackageExport.js` + `AuditPackageButton.jsx` — tarih aralığı seçilip Fine-Kinney kayıtları + yapılan periyodik kontroller + genel eğitim durumu tek PDF'te (tarayıcı yazdırma diyaloğu) birleştiriliyor | Phase 2 | ✅ |
| Eğitim Sertifika Otomasyonu | Talep incelendi, **zaten mevcut** — `printTrainingCompletionCertificate.js` sınav geçilir geçilmez "Tamamlama Belgesi" üretiyor. Kod değişikliği yapılmadı. | Phase 2 | ✅ (önceden tamamlanmış) |
| Ramak Kala/Risk Trend Uyarısı | `departmentRiskTrend.js` + `DepartmentTrendAlertCard.jsx` — departman bazlı son 30 gün / önceki 30 gün karşılaştırması, artış varsa (min. 3 kayıt eşiğiyle gürültü filtrelenmiş) uyarı | Phase 2 | ✅ |
| Departman Detay Paneli | `DepartmentDetailPanel.jsx` + `departmentDetail.js` — Risk Isı Haritası'nda departmana tıklayınca açılır; açık risk/ort. puan/periyodik kontrol (güvenilir) ile son ramak kala/son kaza/eğitim oranı (isim eşleştirmeli, best-effort — UI'da ayrı işaretli) gösterir | Phase 2 | ✅ |
| İsim→Çalışan Eşleştirme Altyapısı | `employeeNameMatch.js` — ramak kala/kaza/eğitim kayıtlarındaki serbest metin isimleri Employee kaydına bağlayan tek ortak fonksiyon; departman paneli ve eğitim uyum listesi bunu kullanıyor | Phase 2 | ✅ |
| Eğitim Uyum Listesi | `trainingComplianceGaps.js` + `TrainingComplianceListCard.jsx` — hangi aktif çalışanın hangi eğitimi tamamlamadığını (hiç başlamamışlar dahil) listeler | Phase 2 | ✅ |
| Uygulama Dışı Hatırlatma / Veri Yedekleme | İncelendi, **ikisi de zaten mevcut** (`useReminderScheduler.js`, `backupService.js`). Kod değişikliği yapılmadı. | Phase 4/8 | ✅ (önceden tamamlanmış) |
| Tek Şubeli Firmalarda Çoklu Şube UI'sini Gizleme | `useCompanyOrgLists` hook'una `hasMultipleBranches` bayrağı eklendi; `FineKinneyFilters`, `FineKinneyForm`, `RiskInfoTab`'daki Şube seçici/satırı yalnızca birden fazla şube varsa gösteriliyor | Phase 1 | ✅ |
| Mevzuat Değişikliği → Etkilenen Risk İşaretleme | `legislationRiskLinker.js` + `LegislationImpactCard.jsx` — son 90 günde güncellenen mevzuat dokümanlarıyla anahtar kelimede örtüşen açık risk kayıtlarını işaretler (RAG-lite, gerçek hukuki analiz değil) | Phase 5 | ✅ |
| Fine-Kinney Export Geliştirmesi — Etkilenenler Alanı, Renkli PDF, Firma Bilgisi | `affected` (Etkilenenler) alanı eklendi (form + detay + export); PDF export'a Sıra No sütunu, Skor/Risk Seviyesi hücrelerinde standart Fine-Kinney referans renklendirmesi (yeşil/mavi/sarı/turuncu/kırmızı, Euronorm.net eşikleriyle: <20/<70/<200/<400/≥400), ve otomatik firma bilgisi başlığı eklendi | Phase 2 | ✅ |
| Fine-Kinney Export Sadeleştirme + AI Mevzuat Öneri Sistemi | Export tablosundan Sorumlu/Şube sütunları kaldırıldı; PDF'te skor renkleri daha doygun/belirgin hale getirildi (ayrı, güçlü bir PDF paleti); yeni özellik: İSG uzmanı bir mevzuat/yönetmelik PDF'i yükleyip AI'dan o dokümana dayanan ÇOKLU düzeltici faaliyet önerisi alabiliyor, her öneriyi tek tıkla "Faaliyet Ekle" listesine ekleyebiliyor (`AIRegulationSuggestionsPanel.jsx`) | Phase 5 | ✅ |
| Fine-Kinney Excel Export — Gerçek .xlsx | CSV'den ExcelJS tabanlı gerçek `.xlsx` üretimine geçildi (kullanıcı onaylı yeni bağımlılık) — firma bilgisi + renkli risk lejandı + O/F/Ş skala tabloları + ana tablo, Skor/Risk Seviyesi hücreleri gerçek arkaplan rengiyle. Bozuk/eski test dosyası düzeltilip gerçekten çalıştırıldı (5/5 geçti) | Phase 2 | ✅ (xlsx render testi Vercel sonrası doğrulanmalı) |
| NÖBETÇİ AI — Veri Mimarisi ve Kod Kalitesi Düzeltme | Offline local company scope, aktif firma fallback'i, legacy companyId migration, UUID tabanlı yeni kayıt id'leri, scoped CRUD/silme doğrulaması, duplicate/backup uyumluluğu, JSDoc ve mimari doküman hizalaması | Phase 1 | ✅ |
| Phase 6 — Vision AI v1 (mock/adapter) | Risk Tespiti fotoğraf akışı çoklu/yapılandırılmış tehlike bulgusuna genişletildi (tehlike/açıklama/kategori/önerilen önlem/etkilenenler/mevzuat referansı/AI güven skoru); kullanıcı onayı zorunlu (`VisionFindingsPanel.jsx`), onaylanan bulgular Risk Tespiti'ne ve oradan mevcut köprüyle Fine-Kinney'e aktarılabiliyor; `visionAnalysisService.js` gerçek bir Vision API'ye BAĞLI DEĞİL — ileride değiştirilebilir adapter yapısı; mobil fotoğraf seçiminde "Fotoğraf Çek"/"Galeriden Seç" ayrımı eklendi; eski tek-kategori önerisi (`usePhotoDetection.js`) dokunulmadan korundu | Phase 6 | ✅ (mock/adapter — gerçek Vision API entegrasyonu bekliyor) |
| Phase 6 Sertleştirme — Fotoğraf Depolama Optimizasyonu + Test Kapsamı | Bug fix: Vision AI yapılandırılmış alanları (`description`/`recommendedAction`/vb.) `addDetection()` tarafından hiç kaydedilmiyordu, düzeltildi; çoklu bulgu akışında fotoğraf artık `riskDetectionPhotos` store'unda BİR KEZ saklanıyor (`photoId` referansı, modül-seviyesi okuma önbelleği); kamera/galeri fotoğrafları depolama öncesi canvas ile sıkıştırılıyor (`imageCompression.js`, yeni bağımlılık yok); 52 yeni test eklendi (`visionAnalysisService`, `safetyScore`, `employeeNameMatch`, `fileValidation`, `authService` — son ikisi için üretim kodu değişmeden test dosyasında minimal polyfill) | Phase 6 | ✅ |
| Temizlik Turu — Ölü Kod + Doküman Güncelliği + Bileşen Bölme | `usePhotoDetection.js`/`PHOTO_DETECTION_PROMPT`/`parsePhotoDetection` (artık kullanılmayan, doğrulanmış ölü kod) silindi; `RiskDetectionForm.jsx` saf manuel girişe sadeleştirildi; `docs/AI_ROADMAP.md` Phase 6'yı yansıtacak şekilde güncellendi; `RiskDetectionPanel.jsx`'in fotoğraf buton/input bloğu `PhotoCaptureButtons.jsx`'e ayrıştırıldı (davranış değişikliği yok) | Phase 6 | ✅ |

## Faz Bazlı İlerleme Özeti

| Faz | Tamamlanan Sprint Sayısı | Faz Durumu ([ROADMAP.md](./ROADMAP.md)) |
|---|---|---|
| Phase 1 — Core Platform | 17 | ✅ Tamamlandı |
| Phase 2 — Risk Intelligence | 7 | ✅ Tamamlandı |
| Phase 3 — Knowledge Center | 1 | ✅ Tamamlandı |
| Phase 4 — AI Copilot | 4 | 🟡 Kısmen tamamlandı |
| Phase 5 — RAG & Proaktif Besleme | 3 | 🟡 Kısmen tamamlandı |
| Phase 6 — Vision AI (statik fotoğraf) | 1 | 🟡 Kısmen tamamlandı (v1 mock/adapter teslim edildi, gerçek Vision API bekliyor) |
| Phase 7 — Enterprise | 0 | 🔲 Planlandı |
| Phase 8 — Mobile Platform | 4 (1 hotfix + PWA v2 + güvenlik/dayanıklılık + Vercel geçişi) | 🟡 Kısmen tamamlandı (PWA + temel güvenlik sağlam; native app kararı bekliyor) |
| Phase 9 — Canlı Kamera & Sensör AI | 2 | 🟡 Kısmen tamamlandı (9.1 + fotoğraf tespiti teslim edildi, 9.2 gerçek sabit kamera bekliyor) |

## Sıradaki Sprint

Henüz resmi olarak planlanmadı. [ROADMAP.md](./ROADMAP.md)'ye göre en olası adaylar
Phase 9.2 (dar kapsamlı gerçek CV entegrasyonu — gerçek kamera/backend gerektirir) veya
Phase 5'in geri kalanı (vektör tabanlı arama, firma bazlı bilgi izolasyonu). Diğer aday
konular için [ROADMAP.md](./ROADMAP.md) → "Açık Kararlar" bölümüne bakın.

## Kayıt Kuralı

- Bir sprint tamamlandığında bu tabloya **tek satır** eklenir (uzun açıklama buraya
  yazılmaz — o [CHANGELOG.md](./CHANGELOG.md)'nin işidir) ve ilgili
  [ROADMAP.md](./ROADMAP.md) fazıyla eşleştirilir.
- Sprint adı, kullanıcıdan gelen orijinal isimle (örn. "Sprint 5A") tutarlı olmalıdır.
- Bir sprint birden fazla fazı ilgilendiriyorsa, sprintin **ağırlıklı odağına** göre
  tek bir faz seçilir; ayrıntı [CHANGELOG.md](./CHANGELOG.md)'de belirtilir.
