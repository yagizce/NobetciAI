# Android ve iOS yayın hazırlığı

İnceleme: **20 Ekim 2026**. Bu belge depo incelemesidir; mağaza kabulü veya gerçek cihaz testi sonucu değildir.

## Mevcut durum

Etkin kapsam yalnızca İSG uzmanıdır. İşveren/çalışan ve uzaktan eğitim bilerek kapalıdır;
bu özelliklerin kod ve verileri korunur. [Yeniden açma rehberi](RELEASE_SCOPE.md).

Uygulama React/Vite web/PWA olarak derlenir. `android/`, `ios/`, Capacitor yapılandırması veya başka bir yerel mobil proje yoktur. Temizlik, mağazaya yüklenebilir Android/iOS paketi üretmez.

## Yayından önce tamamlanacak işler

| İş | Depodaki kanıt / mevcut sınır |
|---|---|
| Gerçek hesap ve yetki sistemi | Login/Register yalnızca dashboard'a yönlendiriyor. `authService.js` mock; `isAuthenticated()` gerçek oturum doğrulamıyor. Demo rol seçimi uzman kapsamında kapalı; bu kontrol gerçek yetkilendirme değildir. |
| Sunucu veri katmanı ve firma izolasyonu | `dataProvider.js` IndexedDB kullanıyor. Supabase/RLS dosyaları taslak; aktif sunucu izolasyonu ve cihazlar arası senkronizasyon yok. |
| AI uç noktalarında hesap doğrulaması ve kullanım sınırları | `api/` işlevlerinde oturum doğrulaması yok. IP hız sınırı process belleğinde; origin kontrolü kullanıcı kimliği değildir. |
| Mobil paketleme ve API bağlantısı | Paketleme yaklaşımı, uygulama kimlikleri, imzalama ve sürümleme belirlenmeli. Göreli `/api/*` yolları ve origin kontrolleri seçilen mobil çalışma ortamında doğrulanmalı. |
| İçerik ve demo temizliği | Örnek kullanıcılar, bilgi kütüphanesi ve işlevsiz hesap ekranları yayın kapsamına göre tamamlanmalı. Eğitim ve demo veri sıfırlama uzman kapsamında kapalı; yeniden açılmadan önce içerikleri değerlendirilmelidir. |
| Veri/gizlilik akışları | Fotoğraf ve belge verisinin AI servislerine gönderimi, saklama/silme akışları ve kullanıcı bilgilendirmesi ürünün gerçek davranışıyla eşleştirilmeli. |
| Fiziksel cihaz doğrulaması | Kamera/galeri, QR okuma, dosya seçme, klavye, yön değişimi, güvenli alanlar, bildirim, çevrimdışı açılış, yedek geri yükleme, PDF/yazdırma ve güncelleme senaryoları Android/iOS cihazlarında denenmeli. |
| Paket bağımlılıklarının ayrı incelemesi | Temizlikte sürüm yükseltmesi yapılmadı. Yayın öncesi bağımlılık güvenliği ve yükseltme uyumluluğu ayrıca değerlendirilmelidir. |

## Son doğrulama — uzman sürümü

- **601/601 test** geçti; **255** uygulama JS/JSX dosyasında sözdizimi ve kullanılmayan import kontrolü temiz. Aynı Vite ayarları doğrudan yüklenerek üretim derlemesi tamamlandı; mevcut ExcelJS büyük parça uyarısı sürüyor.
- Eski rol tercihi, kapalı eğitim/bildirim bağlantısı, uzman firma kurulumu ve manuel saha tespiti üretim önizlemesinde doğrulandı.
- Tarayıcıda altı saklı modül kaydı geçişten sonra korundu. Tam yedeğin saklı veriyi içerdiği ve kapalı servis yazmalarının depolamaya ulaşmadığı otomatik test edildi.
- Fiziksel cihaz, canlı AI ve gerçek hesap doğrulaması yapılmadı.

## Önceki doğrulama — yedek ve çevrimdışı güvenilirliği

- **594/594 test** geçti. Boş/bilinmeyen veri bölümleri içeren yedek reddi, kısmi yedek uyarısı ve 404/500 yanıtlarının önbelleğe alınmaması test edildi.
- Üretim derlemesi aynı Vite ayarları doğrudan yüklenerek başarılı oldu. Fiziksel cihazda yedek geri yükleme ve çevrimdışı açılış hâlâ denenmeli.

## Önceki doğrulama — mobil kullanım ve kod güvenilirliği

- 11 yeni ağ testiyle **590/590 test** geçti. **254** uygulama JS/JSX dosyasında sözdizimi/import kontrolü temiz.
- Aynı Vite ayarlarıyla üretim derlemesi başarılı; aşağıdaki Windows yapılandırma yükleme yöntemi kullanıldı.
- 390 × 600 tarayıcı alanında mobil kabuk, sabit menüler ve içerik kaydırması kontrol edildi. Masaüstü telefon önizlemesi ve rota değişiminde kaydırmanın sıfırlanması da doğrulandı.
- Çalışan rolünde gizlenen firma bölümü, eşzamanlı bildirimlerin birleşmesi ve bildirim callback'inin sabit kalması tarayıcıda kontrol edildi.
- Bu kontroller fiziksel Android/iOS, sanal klavye veya canlı AI servis testi değildir.

## Önceki temizlik turunda doğrulananlar

- Temizlik öncesi ve sonrası **579 test geçti**, başarısız test yok.
- **253** uygulama JS/JSX dosyası sözdizimi kontrolünden geçti; kullanılmayan import bulunmadı.
- Import grafiğinde eksik dosya yok. Testle korunan ISO prototipi dışında aktif girişten kopuk kaynak modülü kalmadı.
- Kilit dosyası onarıldıktan sonra temiz bağımlılık kurulumu tamamlandı.
- Üretim Vite derlemesi aynı ayarlar doğrudan yüklenerek tamamlandı. Standart CLI yapılandırma yüklemesi bu Windows ortamında üst klasör okuma hatası verdi; aşağıdaki eşdeğer kontrol kullanıldı:

```sh
node --input-type=module -e "import {build} from './node_modules/vite/dist/node/index.js';import config from './vite.config.js';await build({...config,configFile:false});"
```

- ExcelJS dışa aktarım parçası yaklaşık **942 kB** (gzip **273 kB**); dinamik yüklenir ve Vite büyük parça uyarısı verir.
- Derlenmiş ön yüzde dashboard ve ayarlar açılışı, demo rol seçimi, şifre sıfırlama sonucu ve bilgi kütüphanesi detay ekranı tarayıcıda kontrol edildi.
- Canlı AI servisleri, gerçek hesap, fiziksel cihaz ve mağaza dağıtımı bu turda doğrulanmadı.
