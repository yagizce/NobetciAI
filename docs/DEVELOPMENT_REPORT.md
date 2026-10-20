# Son geliştirme raporu

**20 Ekim 2026 — Genel yapı ikinci inceleme**

## Yapılan Geliştirmeler

- Boş veya yalnızca bilinmeyen alanlar içeren yedeklerin tüm yerel kayıtları silmesine yol açabilecek geri yükleme yolu kapatıldı.
- Eski kısmi yedeklerde eksik veri bölümü sayısı geri yükleme onayında gösterilir. Dosya okuma hatası da görünür.
- Service worker başarısız HTTP yanıtlarını önbelleğe almaz. Önbellek sürümü yenilendi; yedekleme kodundaki uzun geçmiş açıklamaları kısaltıldı.

## Etkilenen Modüller

`backupService`, ayarlar/yedekleme ekranı, service worker ve testleri. Veri modeli ile bağımlılıklar değişmedi.

## Doğrulama

594 test geçti; yedek doğrulaması ve çevrimdışı önbellek senaryoları dahil. Vite ayarları doğrudan yüklenerek üretim derlemesi tamamlandı. Fiziksel telefon testi yapılmadı.

## Bilinen Riskler

- Kısmi yedekte bulunmayan veri bölümleri geri yüklenirken boşalır; onay ekranı bunu bildirir.
- İş verisi yalnızca cihazdaki IndexedDB'de. Otomatik uzak yedek ve cihazlar arası eşitleme yok; telefon kaybında indirilmiş yedek gerekir.
- Yerel depolamadaki beklenmeyen tema/rol değerleri tüm bağlamlarda doğrulanmıyor. Gerçek hesap, sunucu izolasyonu, AI uç nokta yetkilendirmesi ve Android/iOS paketleri henüz yok.

## Sonraki Öneriler

Önce fiziksel cihazlarda yedek geri yükleme ve çevrimdışı güncelleme akışı denenmeli. Ardından yerel ayar doğrulaması ve mobil paketleme ele alınmalı. Gerçek oturum ve sunucu veri modeli, ürün kararı gereği sonraki aşamaya bırakıldı.

## Documentation Check

`CHANGELOG.md` davranış, `MOBILE_RELEASE_READINESS.md` doğrulama için güncellendi. Mimari, veri modeli, README ve geliştirme kuralları değişmediği için diğer belgeler korundu.

---

**20 Ekim 2026 — Mobil kullanım ve kod güvenilirliği**

## Yapılan Geliştirmeler

- Mobil kabukta yalnızca içeriğin kayması sağlandı; menüler sabit, yeni rota baştan açılıyor. Denetim rotası “Diğer” sekmesine dahil edildi.
- Üç AI uç noktasının tekrarlanan JSON/zaman aşımı kodu tek API istemcisinde toplandı. Metin ve belge istekleri de 65 saniyede sonlanır. Yanıt gövdesindeki ağ kopması ve bozuk JSON sessizce yutulmaz.
- Açıkça boş bırakılan RouteGuard fallback'i düzeltildi. Aynı anda gelen aynı bildirimler birleşir; callback değişmez ve provider kapanınca zamanlayıcılar temizlenir.
- Mobil CSS ve gezinme açıklamalarındaki tekrarlar azaltıldı; dokunmatik yatay ekranlarda form alanları 16 px kalır.

## Etkilenen Modüller

Layout/Header/BottomTabBar, ortak CSS, RouteGuard, ToastContext, chatService ve cosmosVisionService. Veri modeli, risk hesaplama ve mevcut API istek içerikleri korunur. Yeni bağımlılık eklenmedi.

## Doğrulama

- 590 test / 127 test grubu başarılı. 11 yeni test; takılı istek ve yanıt gövdesi, bağlantı kopması, HTML HTTP hatası, geçersiz JSON, zamanlayıcı temizliği ve PDF istek sözleşmesini kapsar.
- 254 JS/JSX kaynak dosyasında sözdizimi ve kullanılmayan import kontrolü temiz; eksik import hedefi yok.
- Aynı Vite yapılandırması doğrudan yüklenerek üretim derlemesi başarılı. Standart yapılandırma yükleyicisindeki Windows üst klasör erişim sınırı sürüyor; komut [yayın hazırlığında](MOBILE_RELEASE_READINESS.md). ExcelJS parçası için mevcut büyük paket uyarısı devam ediyor.
- Tarayıcı: çalışan ayarlarında firma bölümü/uyarı gizli; rota değişiminde scrollTop 1067'den 0'a döndü. 390 × 600 alanda içerik yüksekliği 1404 px, kaydırma alanı 483 px; üst ve alt menü yerinde kaldı.
- İzole gerçek React bileşeninde aynı işlemde üç showToast çağrısı tek bildirim üretti. Farklı mesaj ayrı bildirim ekledi; showToast bağımlılığına bağlı effect yalnızca ilk kez çalıştı. Provider kaldırıldığında bildirimler kalktı.

## Bilinen Riskler

Gerçek kimlik doğrulama, sunucuda firma izolasyonu ve Android/iOS paketleri mevcut değil. Canlı AI ve fiziksel cihaz doğrulaması yapılmadı. Dokunmatik yatay ekran, klavye ve güvenli alanlar cihaz üzerinde ayrıca denenmeli. Bu çalışma web/PWA temelini güçlendirir; mağaza yayınına hazır paket oluşturmaz.

## Sonraki Öneriler

Öncelik gerçek oturum/AI uç nokta yetkilendirmesi ve güvenli veri katmanıdır. Ardından mobil paketleme, API bağlantısı ve cihaz testleri tamamlanmalıdır. Ayrıntılı mevcut sınırlar [yayın hazırlığında](MOBILE_RELEASE_READINESS.md).

## Documentation Check

CHANGELOG davranış değişiklikleri, ARCHITECTURE ortak ağ katmanı ve mobil kabuk, MOBILE_RELEASE_READINESS son test sonuçları için güncellendi. README, veri modeli, geliştirme kuralları ve geçmiş sprint dokümanları bu turda değişmedi.

[Önceki temizlik raporu](https://github.com/yagizce/NobetciAI/blob/3a52bc9159893baf0f04330afe3eaf3ae7dc05e6/docs/DEVELOPMENT_REPORT.md)
