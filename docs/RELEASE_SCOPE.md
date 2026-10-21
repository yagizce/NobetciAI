# Uzman sürümü ve ertelenen modüller

Karar: **20 Ekim 2026**. İlk sürüm yalnızca İSG uzmanına yöneliktir. İşveren/çalışan hesapları, ekip iş akışları ve uzaktan eğitim sonraya bırakılmıştır. Sabit kamera sistemi ayrı, ertelenmiş projedir.

## Tek kontrol noktası

`src/constants/releaseProfile.js` içindeki `RELEASE_PROFILE = "expert"` etkin kapsamı seçer. Bu bir kaynak kodu/derleme kararıdır; URL, localStorage, ortam değişkeni veya ayarlardaki bir düğme ile değiştirilemez. Yeni bağımlılık veya uzak özellik servisi yoktur.

| Kapsam | Uzman sürümü | Korunan kod ve kontrol noktaları |
|---|---|---|
| İşveren/çalışan görünümü | Kapalı; eski tercihler ilk render'dan itibaren uzman olarak çözülür | `allRoles`, `RoleContext`, `DashboardPage`; eski rol etiketleri ve tercihler silinmez |
| `training` | Eğitim sekmesi, video/sınav, katılımcılar, son tarih ve eğitim hatırlatmaları kapalı | `DocumentsPage`, `features/training`, `trainingService`, `trainingCourseSettingsService`, `useReminderScheduler` |
| `employeeReports` | Çalışan bildirimi, uzman onayı/göreve çevirme, bekleyen/son bildirim analizi ve ilgili sohbet kısayolu kapalı | `RiskAnalysisPage`, `ExpertDashboard`, `IsgDataContext`, `notificationRecordService`, `quickActions` |
| `employeeDirectory` | Çalışan listesi, ekleme/düzenleme/silme ve içe aktarma kapalı | `CompanyManagementPanel`, `EmployeesSection`, `employeeService` |
| `demoData` | Veriyi sıfırlayan örnek veri aracı kapalı | `Settings`, `demoSeedService`; servis kontrolü silme işleminden önce çalışır |
| Firma/şube/departman | Uzman kendi yerel çalışma alanını kurabilir | `canEditCompany`; çok rollü demo profilinde önceki işveren düzenleme kuralı korunur |

Risk değerlendirmesi, manuel/fotoğraflı saha tespiti, denetim, düzeltici faaliyet, periyodik kontrol, belge üretimi, mevzuat, bilgi kütüphanesi ve AI danışmanlığı açıktır. Firma çalışan sayısı ve riskteki serbest metin “sorumlu” alanı yerel kayıt bilgisidir; kullanıcı hesabına görev göndermez. Bu alanlar korunmuştur.

## Uzman çalışma alanı — 21 Ekim 2026

- Firma formu ad, sektör, tehlike sınıfı ve çalışan sayısını gösterir. Şube/departman yönetim sekmeleri companyOrgManagement kapsamında gizlidir; mevcut kayıtlar ve saha bağlantıları korunur.
- İşyeri adresi, logo, vergi numarası ve genel iletişim alanları companyAdminFields özelliğiyle kapalıdır; eski değerler güncellemede korunur. Geri açmak için profilin özellik listesine bu anahtarı ekleyin. İşveren yetki seçeneği ayrıca işveren rolüne bağlıdır.
- AI Mevzuat & Risk Taraması kullanıcı kararıyla tamamen kaldırıldı; panel/hook/istem/ayrıştırıcı bulunmaz. Yeniden açılacak saklı modüllerden değildir. Mevzuat sayfası ve diğer risk araçları korunur.
- Alt menüde Riskler doğrudan açılır; profil üst menüden erişilir. Üst profilde rol etiketi gösterilmez. Tek kullanılabilir dil varken dil seçimi görünmez.

## Korumalar ve veri bütünlüğü

- Sekme seçimi görünür sekme listesiyle **render öncesinde** çözülür. `?tab=education` ve eski `location.state.targetTab = notifications` kapalı bileşeni kısa süreliğine bile bağlamaz.
- Kapalı modül okumaları boş liste döndürür, yazmaları veri erişiminden önce reddedilir. `IsgDataContext` çalışan bildirimlerini yüklemez.
- Eğitim/çalışan/görev bildirimleri gösterilmez ve yeniden üretilmez. Eski sistem bildirimleri ve aktivite kayıtları yalnızca görünümde filtrelenir; silinmez.
- Kritik risk, saha tespiti, DİF, periyodik kontrol ve yedek hatırlatmaları açıktır. Kritik risk tercihi ayrılmıştır; eski genel bildirim kapatma tercihi korunur.
- `db.js`, store listesi ve veri modeli değişmemiştir. Tam yedek, kapalı modüllerin kayıtlarını da içerir; geri yükleme tüm bölümleri korur. **Kısmi yedek geri yüklemesi** mevcut sözleşme gereği eksik bölümleri boşaltır ve onay ister.
- `multiRoleDemo` yalnızca eski üç rollü demo kapsamını yeniden üretir; üretim yetkilendirmesi değildir. Korunan modül kodu paket içinde bulunabilir.
- Bu kontroller uygulamanın ürün kapsamını sınırlar. Kullanıcının kendi cihazındaki veriyi değiştirmesini veya eski çevrimdışı sürümü çalıştırmasını engelleyen bir güvenlik sınırı değildir. Gerçek hesaplar için sunucu oturumu, firma izolasyonu ve işlem yetkileri ayrıca gereklidir. Yeni dağıtım sonrası açık eski sekmeler yeniden yüklenmelidir.

## Başka bir geliştirici/model yeniden açarken

1. Kullanıcının hangi modülü açmak istediğini belirleyin. Korumaları tek tek silmeyin; `releaseProfile.js` içindeki rol ve özellik kapsamını değiştirin.
2. Eski görünümü yalnızca geliştirme ortamında incelemek için `RELEASE_PROFILE = "multiRoleDemo"` kullanılabilir. Genel yayında demo rol değiştiricisini yetkilendirme yerine kullanmayın.
3. Kademeli açılışta yeni bir profil tanımlayın. Eğitim için `training`; çalışan bildirimi için `employeeReports` ve çalışan rolü; çalışan yönetimi için `employeeDirectory` birlikte değerlendirilmelidir. `demoData` üretimde kapalı kalmalıdır.
4. Önce mevcut tam yedekle geçişi deneyin. Store silmeyin/yeniden adlandırmayın. Eski eğitim ilerlemesi, tamamlama, son tarih, çalışan ve bildirim kayıtlarının aynı kimliklerle göründüğünü kontrol edin.
5. `releaseProfile.test.js` iki profilin kurallarını test eder. Etkin uzman kapsamını sabitleyen test ve `releaseScope.test.js` kapalı servis testleri bilinçli olarak uzman sürümünü bekler; ürün kapsamı değişince yeni etkin kapsamın beklentilerini ve açık servis senaryolarını ekleyin. Testleri yalnızca geçsin diye kaldırmayın.
6. `npm test` ve üretim derlemesini çalıştırın. Üç rolün menüleri, doğrudan bağlantılar, eğitim izleme/sınav/kayıt, bildirim oluşturma/onaylama, veri izolasyonu, bildirim tercihleri ve tam yedek geri yükleme akışlarını yeniden doğrulayın.
7. `PROJECT_CONTEXT`, bu belge ve yayın hazırlığını güncelleyin. Gerçek kullanıcıya açmadan önce gerçek oturum/yetki sistemi ve Android/iOS cihaz kontrollerini tamamlayın.

## Bu değişiklikte doğrulananlar

- Eski JSON çalışan tercihi ve düz metin işveren tercihiyle uzman görünümü açıldı.
- Doğrudan eğitim bağlantısı Belge Oluştur'a; eski bildirim sekmesi bağlantısı Risk Tespiti'ne düştü.
- Uzman olarak firma ve manuel saha tespiti oluşturuldu.
- İzole tarayıcı veritabanına konan altı saklı modül kaydı geçişten sonra yerinde kaldı; eğitim bildirimi arayüzde görünmedi.
- Servis testleri kapalı işlemlerin depolamaya ulaşmadığını ve tam yedeğin saklı modül verisini içerdiğini doğruluyor. Fiziksel cihaz ve canlı AI testi yapılmadı.
