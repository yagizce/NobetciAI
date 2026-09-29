# Offline MVP Düzeltme Notları

Bu sürüm, mevcut offline-first/IndexedDB ürün davranışı korunarak güvenilirlik ve veri bütünlüğü için güncellenmiştir. Supabase, backend, RLS, gerçek authentication, multi-tenant yapı, ödeme veya yeni ürün modülü eklenmemiştir.

## Uygulanan düzeltmeler

- Toplu periyodik kontrol işlemlerine hata yakalama, kullanıcı bildirimi ve çift gönderim koruması eklendi.
- Periyodik kontrol, Fine-Kinney ve Risk Tespiti veri yükleme hatalarında sonsuz loading yerine görünür hata durumu eklendi.
- Fine-Kinney, periyodik kontrol ve Risk Tespiti kayıt/güncelleme/silme hataları kullanıcıya bildirilecek şekilde ele alındı.
- Yedek restore çağrısında doğrulama zorunlu hale getirildi; yedek tarihi, plain object, `id`, yinelenen kimlik ve veri şekli kontrolleri güçlendirildi.
- Yedekleme arayüzünde indirme/geri yükleme hataları kullanıcıya gösteriliyor; atomic restore garantisiyle uyumlu mesajlar kullanılıyor.
- PDF ham dosya limiti base64 ve JSON payı bırakacak şekilde 5 MiB'e çekildi; API'nin 8 MiB toplam istek mesajı düzeltildi.
- Periyodik kontrol aralıkları 1–3650 gün arasında normalize ediliyor; geçersiz tarih girdisi NaN tarih üretmiyor.
- Dependency sürümlerinin tekrarlanabilir kurulumu için `package-lock.json` eklendi.
- Yedek doğrulama ve periyodik kontrol guard'ları için testler eklendi.

## Doğrulama

- `npm ci --ignore-scripts --no-audit --no-fund` başarılı.
- `npm test`: **158 test geçti, 0 başarısız**.
- `npm run build`: **başarılı**.
- ExcelJS export paketi zaten dinamik import ile ayrı chunk olarak yükleniyor; build yaklaşık 920.6 KB minified ExcelJS chunk'ı için uyarı veriyor, ancak bu chunk ilk sayfa yüklemesine dahil edilmiyor.

## Bilinçli olarak sonraki aşamaya bırakılanlar

Gerçek authentication, server-side authorization, Supabase/RLS, multi-tenant backend, object storage, gerçek RAG ve puantaj bu offline MVP çalışmasının kapsamı değildir. Dependency audit'inde React Router/Vite/ExcelJS kaynaklı güncellemeler mevcut; bazı düzeltmeler major sürüm veya ExcelJS downgrade gerektirdiğinden mevcut çalışan ürün kırılmaması için otomatik uygulanmamıştır.
