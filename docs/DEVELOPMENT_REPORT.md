# Son geliştirme raporu

**21 Ekim 2026 — Uzman çalışma alanı**

## Yapılan Geliştirmeler

AI Mevzuat & Risk Taraması paneli, hook’u, istemi ve ayrıştırıcısı tamamen kaldırıldı. Profildeki rol etiketi kaldırıldı. Firma formu beş saha bilgisine indirildi; kalıcı etiketler eklendi. Riskler alt menüye alındı, işlevsiz dil seçimi gizlendi. PWA önbelleği v8.

## Etkilenen Modüller

Fine-Kinney, firma formu, gezinme ve ayarlar. Diğer roller/eğitim saklı kalır. Gizlenen firma bilgileri ve ek eski alanlar güncellemede korunur.

## Doğrulama

604 test geçti; 253 uygulama JS/JSX dosyasında sözdizimi/import kontrolü temiz. Üretim derlemesi başarılı. 320/390 px’de yatay sayfa taşması yok; 1280 px’de uygulama ortalanmış 430 px. Firma güncellemesi, risklere geçiş, tarama panelinin yokluğu ve profil menüsü kontrol edildi. Tarayıcı hata kaydı yok.

## Bilinen Riskler

Fiziksel Android/iOS testi yapılmadı. Mevcut ExcelJS büyük parça uyarısı sürüyor. Gerçek hesap ve native paketleme bu değişikliğin kapsamında değil.

## Sonraki Öneriler

Fiziksel cihazlarda klavye, kamera/galeri ve belge dışa aktarma akışlarını doğrulayın.

## Documentation Check

RELEASE_SCOPE, SPRINTS ve MOBILE_RELEASE_READINESS güncellendi. README ve veri modeli değiştirilmedi.
