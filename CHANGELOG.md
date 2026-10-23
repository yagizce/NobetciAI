# Değişiklikler

## 2026-10-23 — Katkı ve güvenlik bakım hazırlığı

- Son incelemede audit denetleyicisi boş duyuru zinciri ve geçersiz takvim tarihini reddedecek şekilde sıkılaştırıldı; iki regresyon testi eklendi.

- Uyumlu bağımlılık yamaları; audit 8 yüksek/7 orta kayıttan 6 yüksek/7 orta kayda indi. Kalan riskler süreli ve duyuru/sürüm bazlı izlenir.
- Linux/Windows test/build CI, bağımlılık kontrolü ve katkı/güvenlik/PR/Issue süreçleri eklendi.
- Fine-Kinney motoru değiştirilmeden bağımsız ESM örneği ve üç testle belgelendi; mevcut 604 test korundu.
- Fine-Kinney Core, packages/fine-kinney-core/ altında yalnızca kendi klasörünü kapsayan Apache-2.0 lisansı, 272 test ve Linux/Windows motor eşitlik CI ile eklendi.
- Ticari uygulamanın geri kalanının lisans kararı ayrı; production yayını ve PR #7 birleşmesi yapılmadı.


## 2026-10-20 — Web ve mobil uyumlu düzen

- Masaüstünü 390 px telefon maketine sıkıştıran PhoneFrame kaldırıldı. Web uygulaması ekranı doldurur; 1024 px ve üstünde kalıcı yan menü gösterilir.
- Dar ekranlarda çekmece ve alt gezinme korunur. Üst menünün dokunma alanları büyütüldü; bildirim paneli küçük ekranın içine sığar.
- Mobil form yazıları 16 px; güvenli alanlar, dinamik ekran yüksekliği ve içerik kaydırması korunur. Fareyle yatay listelerin kaydırma çubukları kullanılabilir. PWA önbellek sürümü v6.
- 601 test ve üretim derlemesi başarılı. 320/390/768/1024 px test pencereleri ve 1280 px masaüstü tarayıcı görünümü kontrol edildi; fiziksel cihaz testi değildir.

## 2026-10-20 — Uzman odaklı ilk sürüm

- İşveren/çalışan rolleri, uzaktan eğitim, çalışan yönetimi ve bildirim/onay akışı merkezi yayın profiliyle kapatıldı; kod ve eski veriler korunur.
- Kapalı modüller doğrudan sekme bağlantısından açılamaz ve servis üzerinden veri yazamaz. Eğitim/ekip hatırlatmaları ile demo veri sıfırlaması kapalıdır.
- Uzmanın firma/şube/departman kurulumu açık; kritik risk uyarıları ayrı tercihle korunur. Tam yedek tüm modülleri içerir.
- Kök AGENTS.md ve RELEASE_SCOPE rehberi gelecekteki yeniden açılışı belgeler. PWA önbellek sürümü v5 oldu.

## 2026-10-20 — Yedek ve çevrimdışı güvenilirliği

- Veri bölümü içermeyen yedek reddedilir; eski kısmi yedeklerde silinecek bölümler geri yükleme öncesinde belirtilir. Dosya okuma hatası gösterilir.
- Çevrimdışı önbellek 404/500 yanıtlarını saklamaz. Önbellek sürümü yenilendi ve ilgili senaryolar test edildi.
- Yedekleme modülündeki geçmiş hata anlatan uzun yorumlar kısaltıldı. Toplam 594 test başarılı.

## 2026-10-20 — Mobil kullanım ve kod güvenilirliği

- Mobil kabuk ekran yüksekliğiyle sınırlandı; içerik kayarken üst ve alt menü sabit kalır. Rota değişince içerik başa döner, menü kapanır. Denetim sayfasında “Diğer” sekmesi aktif görünür.
- AI servislerinin JSON istekleri ortak `apiClient.js` katmanında toplandı. Metin/belge analizine de 65 saniyelik zaman aşımı eklendi; gövde okunurken kopan bağlantılar artık yutulmaz.
- `RouteGuard`, açıkça verilen `fallback={null}` değerini korur; gizlenmesi istenen bölüm için yetki uyarısı üretmez.
- Aynı anda gelen aynı bildirimler birleşir. Bildirim callback'i sabit tutulur, provider kapanırken zamanlayıcılar temizlenir.
- Mobil stil ve gezinme dosyalarındaki tarihsel açıklama tekrarları kısaltıldı. Dokunmatik yatay ekranlar da 16 px form alanı kuralına dahil edildi.
- Ağ hata senaryoları için 11 test eklendi; toplam 590 test başarılı.

## 2026-10-20 — Yayın öncesi temizlik

- Uygulama girişinden erişilmeyen eski dashboard, denetim, sohbet ve fotoğraf analiz parçaları kaldırıldı.
- Yalnızca deneme için kullanılan `/cosmos-test` sayfası kaldırıldı. Aktif sohbet ve Risk Tespiti fotoğraf analizleri devam ediyor.
- Kullanılmayan görsel analiz istemi ve Anthropic fotoğraf yardımcısı temizlendi.
- Profil, ayarlar, dashboard ve arama metinleri kısaltıldı. Şifre sıfırlama demosu artık gönderilmemiş bir e-postayı gönderilmiş gibi göstermiyor.
- İşlevsiz “Yakında” doküman düğmeleri yerine dosyanın bulunmadığını belirten kısa açıklama eklendi.
- Yinelenen ignore dosyaları, boş varlık klasörü açıklaması ve ayrı offline düzeltme günlüğü kaldırıldı.
- `npm test` komutundaki tırnaklar Windows ile uyumlu hale getirildi. Kilit dosyasının eksik platform bağımlılıkları tamamlandı; mevcut paketlerin sürümleri değişmedi.
- Kurulum dokümanı kısaltıldı; mevcut AI sağlayıcıları ve Tailwind derlemesi düzeltildi. Android/iOS yayın eksikleri ayrı bir belgede toplandı.

## Mevcut işlevlerin özeti

- Fine-Kinney risk değerlendirmesi, düzeltici faaliyetler ve kapanış kanıtları.
- Firma/şube/departman/çalışan kayıtları, rol bazlı demo dashboard.
- Denetim, periyodik kontrol, eğitim takibi ve belge üretimi.
- NVIDIA sohbet/görsel analiz ve Anthropic risk/belge analizi.
- IndexedDB firma kapsamı, eski veri geçişi, doğrulanan yedek geri yükleme ve fotoğraf saklama.
- PWA çevrimdışı sayfası; HTML/JS/CSS için network-first önbellek.

## Önceki ayrıntılı kayıtlar

Geçmiş geliştirme anlatımları Git geçmişinde korunur:

- [Önceki kök değişiklik günlüğü](https://github.com/yagizce/NobetciAI/blob/ed191594dcd8f0dc4623286847eace9d6d5ff9d7/CHANGELOG.md)
- [Önceki sürüm günlüğü](https://github.com/yagizce/NobetciAI/blob/ed191594dcd8f0dc4623286847eace9d6d5ff9d7/docs/CHANGELOG.md)
- [Önceki geliştirme raporları](https://github.com/yagizce/NobetciAI/blob/ed191594dcd8f0dc4623286847eace9d6d5ff9d7/docs/DEVELOPMENT_REPORT.md)
- [Offline MVP düzeltme notları](https://github.com/yagizce/NobetciAI/blob/ed191594dcd8f0dc4623286847eace9d6d5ff9d7/OFFLINE_FIXES_CHANGELOG.md)

Yeni kayıtlar yalnızca bu dosyaya kısa, kullanıcıya veya geliştiriciye etkisi açık maddelerle eklenir.
