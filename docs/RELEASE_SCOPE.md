# Ekip önizlemesi ve yayın kapsamı

26 Kasım 2026 itibarıyla etkin web/PWA geliştirme profili `teamPreview`. Ayarlar → Rol (Demo) üzerinden uzman, işveren ve çalışan görünümleri seçilebilir. Kayıtlar bu tarayıcıdaki etkin firmaya aittir. Roller yerel demo görünümünü belirler. Gerçek kullanıcı hesapları, sunucu oturumu ve firma izolasyonu yayın öncesi açık işlerdir.

| Kapsam | Ekip önizlemesi |
|---|---|
| İşveren ve çalışan | Rol seçimi, ilgili ana ekranlar ve rol bazlı menüler açık. Varsayılan rol uzman. |
| `training` | Üç rol için eğitim, izleme ve sınav açık. Uzman ve işveren katılımcıları ve son tarihleri yönetebilir. Eğitim hatırlatmaları açık. Mevcut eğitim videosu yer tutucudur. |
| `employeeReports` | Çalışan bildirimi, uzman incelemesi ve göreve dönüştürme açık. İlgili sohbet kısayolları ve bildirimler etkin. |
| `employeeDirectory` | Uzman ve işveren, firma yönetiminden çalışan listesine ve ekleme, düzenleme, silme, içe aktarma işlemlerine erişebilir. |
| `companyOrgManagement`, `companyAdminFields` | Uzman ve işveren için şubeler, departmanlar ve firma idari alanları açık. |
| `demoData` | Veriyi sıfırlayan örnek veri aracı kapalı. |

Risk değerlendirmesi, saha tespiti, denetim, DİF, periyodik kontrol, belge, mevzuat ve AI danışmanlığı ekip önizlemesinde açık. AI Mevzuat & Risk Taraması daha önce kaldırıldı. Sabit kamera ayrı bir proje olarak ertelendi.

## Profil ve veri

- Derleme kapsamının tek kaynağı `src/constants/releaseProfile.js`. URL ve yerel rol tercihi yalnızca profilin açtığı ekranları seçebilir.
- Önceki `expert` profili uzman kapsamını korur. `multiRoleDemo` yerel geliştirme için eski demo davranışını, örnek veri sıfırlaması dâhil, korur.
- IndexedDB şeması ve yedek biçimi aynı. Tam yedek eğitim ilerlemesi, tamamlamalar, son tarihler, çalışan ve bildirim kayıtlarını kapsar. Kısmi yedek geri yüklemesi, eksik bölümleri onaydan sonra boşaltabilir.
- Sürüm doğrulamasında üç rolün menülerini, doğrudan bağlantıları, firma bazında eski kayıtları, eğitim/sınav, bildirim/onay, yedek geri yükleme ve bildirim tercihlerini kontrol edin. Açık PWA sekmelerini yeni sürümde yeniden yükleyin.

[Proje bağlamı](PROJECT_CONTEXT.md) · [Yayın hazırlığı](MOBILE_RELEASE_READINESS.md)
