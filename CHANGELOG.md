# Değişiklikler

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
