# NÖBETÇİ AI — Veri Mimarisi ve Kod Kalitesi Sprint Raporu

## Sonuç

İstenen sprint, yeni büyük özellik eklenmeden tamamlandı. Offline-first IndexedDB mimarisi, mevcut dataProvider/CRUD yaklaşımı ve çalışan kullanıcı akışları korundu. Supabase, backend, RLS, gerçek authentication, API, RAG veya cloud storage eklenmedi.

## Düzeltilen sorunlar

| Alan | Uygulanan düzeltme |
|---|---|
| Firma izolasyonu | Şube, departman, çalışan, bildirim, periyodik kontrol, risk tespiti, eğitim, ekipman, belge, Fine-Kinney, sistem bildirimi ve audit log okumaları aktif firmaya göre scope edildi. Scoped yazma/silme işlemlerinde başka firmaya ait kayıtların okunması veya aynı id ile ezilmesi engellendi. |
| Aktif firma | `getPrimaryCompany()` artık seçili firma localStorage anahtarını dikkate alan, tek-firma fallback'li `getActiveCompany()` davranışını kullanıyor. Çoklu firma UI'si eklenmedi. |
| Legacy migration | Tek firmalı eski IndexedDB kayıtları açılışta eksik `companyId` ile işaretleniyor. Birden fazla firma varsa otomatik yanlış eşleştirme yapılmıyor; kayıtlar gizlenerek güvenli tarafta kalınıyor. |
| ID sistemi | Yeni kayıtlar için bağımlılıksız UUID helper'ı eklendi. Eski numeric/string id'ler değiştirilmedi. CSV import, şirket kayıtları, Fine-Kinney, periyodik kontrol, risk tespiti, eğitim, belge, ekipman, bildirim, audit log ve nested risk kayıtları yeni UUID üretimine geçirildi. |
| Eğitim ayarları | Eski `id=courseId` formatı korunarak okunuyor; yeni kayıtlarda `courseId` ayrı alan, `id` UUID olacak şekilde uyumluluk sağlandı. |
| Veri bütünlüğü | Scoped update/delete sahiplik kontrolleri, patch id koruması, dataProvider eksik id fallback'i ve yedek/restore duplicate doğrulaması birlikte çalışıyor. |
| Kod/dokümantasyon | JSDoc id tipleri güncellendi. README, ARCHITECTURE, PROJECT_CONTEXT, ROADMAP, SPRINTS ve CHANGELOG gerçek local scope davranışıyla hizalandı. Dashboard/Profile mock şirket sabitleri yerine gerçek local firma kayıtlarını kullanıyor. |

## Değiştirilen dosyalar

Değişiklikler; `src/services` altındaki company/dataProvider/CRUD/risk/training/document/audit/notification servisleri, `src/features` altındaki şirket yönetimi, dashboard, belge, eğitim, periyodik kontrol, risk ve sohbet yardımcıları, `src/pages/Profile.jsx`, `src/main.jsx`, `src/types/index.js`, `src/utils/id.js` ve ilgili test dosyası ile proje dokümantasyonunu kapsıyor. Toplam değişiklik yaklaşık **40 mevcut dosya** seviyesindedir; yeni büyük modül eklenmemiştir.

## Test sonucu

`npm ci --ignore-scripts --no-audit --no-fund` başarılıdır. `npm test` sonucu **162/162 test geçti, 0 başarısız**. `npm run build` başarılıdır. Vite, ExcelJS export chunk'ının yaklaşık 942 KB minified olması nedeniyle uyarı vermektedir; chunk dinamik import ile ilk uygulama yüklemesinden ayrıdır.

## Hâlâ backend gerektiren konular

Offline local scope server-side güvenlik değildir. Ortak cihaz veya tarayıcıya erişen kişi localStorage/IndexedDB verisini değiştirebilir; mock authentication gerçek kimlik doğrulama değildir. Firmalar arası merkezi veri izolasyonu, kullanıcı/rol yetkilerinin güvenilir uygulanması, çoklu cihaz senkronizasyonu, object storage, gerçek RAG doküman izolasyonu ve merkezi audit için Phase 7 kapsamında backend/Auth/RLS gerekir.

Ayrıca kaza ve ramak kala kayıtları ayrı store'lar değil, company-scoped `notifications` akışındaki `type` değerleridir. DÖF ayrı bir store değil, Fine-Kinney kaydının nested `correctiveActions` alanıdır. Bu sprintte yeni kaza/DÖF modülü eklenmemiştir.

## Sprint/Roadmap durumu

`docs/SPRINTS.md` içine **NÖBETÇİ AI — Veri Mimarisi ve Kod Kalitesi Düzeltme** sprinti eklendi ve Phase 1 tamamlandı olarak işaretlendi. `docs/ROADMAP.md` Phase 1 açıklaması offline aktif-firma scope'u ve mock authentication sınırıyla güncellendi. Phase 7 gerçek Auth/RLS/backend hedefi olarak planlı kalmaktadır.
