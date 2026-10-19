# Android ve iOS yayın hazırlığı

İnceleme: **20 Ekim 2026**. Bu belge depo incelemesidir; mağaza kabulü veya gerçek cihaz testi sonucu değildir.

## Mevcut durum

Uygulama React/Vite web/PWA olarak derlenir. `android/`, `ios/`, Capacitor yapılandırması veya başka bir yerel mobil proje yoktur. Temizlik, mağazaya yüklenebilir Android/iOS paketi üretmez.

## Yayından önce tamamlanacak işler

| İş | Depodaki kanıt / mevcut sınır |
|---|---|
| Gerçek hesap ve yetki sistemi | Login/Register yalnızca dashboard'a yönlendiriyor. `authService.js` mock; `isAuthenticated()` gerçek oturum doğrulamıyor. Demo rol seçimi kaldırılmalı veya gerçek yetkilerden ayrılmalı. |
| Sunucu veri katmanı ve firma izolasyonu | `dataProvider.js` IndexedDB kullanıyor. Supabase/RLS dosyaları taslak; aktif sunucu izolasyonu ve cihazlar arası senkronizasyon yok. |
| AI uç noktalarında hesap doğrulaması ve kullanım sınırları | `api/` işlevlerinde oturum doğrulaması yok. IP hız sınırı process belleğinde; origin kontrolü kullanıcı kimliği değildir. |
| Mobil paketleme ve API bağlantısı | Paketleme yaklaşımı, uygulama kimlikleri, imzalama ve sürümleme belirlenmeli. Göreli `/api/*` yolları ve origin kontrolleri seçilen mobil çalışma ortamında doğrulanmalı. |
| İçerik ve demo temizliği | Örnek kullanıcılar, bilgi kütüphanesi, eğitim yer tutucu videosu, demo veri sıfırlama ve işlevsiz hesap ekranları yayın kapsamına göre tamamlanmalı. |
| Veri/gizlilik akışları | Fotoğraf ve belge verisinin AI servislerine gönderimi, saklama/silme akışları ve kullanıcı bilgilendirmesi ürünün gerçek davranışıyla eşleştirilmeli. |
| Fiziksel cihaz doğrulaması | Kamera/galeri, QR okuma, dosya seçme, klavye, yön değişimi, güvenli alanlar, bildirim, çevrimdışı açılış, yedek geri yükleme, PDF/yazdırma ve güncelleme senaryoları Android/iOS cihazlarında denenmeli. |
| Paket bağımlılıklarının ayrı incelemesi | Temizlikte sürüm yükseltmesi yapılmadı. Yayın öncesi bağımlılık güvenliği ve yükseltme uyumluluğu ayrıca değerlendirilmelidir. |

## Bu turda doğrulananlar

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
