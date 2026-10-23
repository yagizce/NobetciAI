# Bağımlılık güvenlik değerlendirmesi

İnceleme: **23 Ekim 2026**, taban commit `eb26b5a`, Node 24/npm 11.
Bu rapor npm duyuruları, kilit dosyası ve çağrı noktalarının statik incelemesidir;
canlı istismar/pentest veya bütün bağımlılık kodunun denetimi değildir.
`npm audit` sayıları paket kayıtlarıdır; aynı duyuru üst bağımlılıklara da yayılır.

## Uyumlu düzeltmeler

`npm audit fix --ignore-scripts` force kullanılmadan uygulandı.
Ana sürüm, ürün mimarisi ve doğrudan bağımlılık aralıkları değiştirilmedi.

| Paket | Önce → sonra | Sonuç |
|---|---|---|
| brace-expansion | 1.1.18 → 1.1.21; 2.1.4 → 2.1.7 | Bilinen recursion/CPU DoS duyuruları kapandı. ExcelJS'nin Node arşivleme/glob zincirinde. |
| source-map-js | 1.2.1 → 1.2.2 | Indexed source-map DoS duyurusu kapandı; PostCSS derleme zinciri. |
| react-router / react-router-dom | 6.30.4 → 6.30.6 | [GHSA-jjmj-jmhj-qwj2](https://github.com/advisories/GHSA-jjmj-jmhj-qwj2) XSS duyurusu kapandı; diğer Router duyuruları sürüyor. |
| @remix-run/router | 1.23.3 → 1.23.4 | Router 6.30.6'nın uyumlu bağımlılığı. |
| postcss-selector-parser | 6.1.4 → 6.1.5 | Uyumlu yama; aşağıdaki duyuruyu kapatmıyor. |

Audit: **8 yüksek + 7 orta → 6 yüksek + 7 orta**.
Geriye kalan sürümler force/major override ile gizlenmedi.

## Başlangıçtaki 15 paket kaydı ve gerçek etki

| Paket (audit önemi) | Erişilebilirlik / kalan iş |
|---|---|
| brace-expansion (yüksek) | Yukarıdaki uyumlu yamalarla kapandı. Kullanıcı girdisinin glob olarak işlendiği bir uygulama yolu bulunmadı. |
| source-map-js (yüksek) | 1.2.2 ile kapandı. Uygulama kullanıcıdan source-map yüklemiyor. |
| braces (yüksek) | Tailwind 3 globları. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): derin desenle stack DoS; duyuruda yama yok. Güvenilmeyen desen alan web API'si yok; kötü niyetli kaynak/derleme girdisi ayrı risktir. |
| chokidar (yüksek) | Tailwind geliştirme izleyicisi üzerinden braces bulgusunu miras alır; ayrı bir uygulama sunucusu açığı sayılmaz. |
| micromatch (yüksek) | Tailwind glob değerlendirmesi üzerinden braces. Son kullanıcı girdisi glob'a verilmez. |
| fast-glob (yüksek) | Aynı micromatch/braces zinciri; derleme/araç riski. |
| tailwindcss (yüksek) | 3.4.19; üstteki zincir ve selector parser. Tarayıcıya Tailwind derleyicisi gönderilmez. v4 CSS/araç geçişi bu PR'nin kapsamı dışında. |
| postcss-selector-parser (orta) | 6.1.5. [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) düz CSS selector CPU DoS; yama 7.1.6. Derleme kaynakları işlenir; kullanıcı CSS'si senkron request yolunda ayrıştırılmaz. Major override uygulanmadı. |
| postcss-nested (orta) | Tailwind'in selector parser zinciri. Mevcut 6.x sözleşmesi korunuyor. |
| esbuild (orta) | 0.21.5. [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) serve API üzerinden cross-origin okuma. Proje bu serve API'sini doğrudan kullanmaz; Vite dönüştürme/derleme bağımlılığıdır. Bu Vite'ın diğer risklerini ortadan kaldırmaz. |
| vite (yüksek) | 5.4.21. Dev server dosya ifşası ve Windows editor/komut yolları aşağıda. Static dist dağıtımı Vite server çalıştırmaz; geliştirici ortamı riski sürer. v8'e sıçranmadı, desteklenen geçiş planlanmalı. |
| react-router (orta) | 6.30.6. [Backslash open redirect](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6) için güvenilmeyen navigation hedefi gerekir. App.jsx/main.jsx BrowserRouter CSR; hedefler sabit path ve encode edilmiş query ile kuruluyor. [SSR hydration injection](https://github.com/advisories/GHSA-337j-9hxr-rhxg) için kullanılan SSR hydration yolu yok. Her ikisinin audit aralığı sürüyor; “güvenli sürüm” denmiyor. |
| react-router-dom (orta) | react-router bulgularını miras alır; doğrudan XSS duyurusu 6.30.6 ile kapandı. v7 ayrı uyumluluk işidir. |
| uuid (orta) | 8.3.2, ExcelJS üzerinden. [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) v3/v5/v6 dış buffer sınırı hakkında. İncelenen ExcelJS lib çağrısı yalnızca v4; uygulama XLSX üretir. Etkilenen çağrı yolu bulunmadı; tüm üçüncü taraf kodunun güvenliği kanıtlanmış değildir. |
| exceljs (orta) | uuid bulgusunu miras alır. npm'in 3.4.0'a düşürme önerisi kabul edilmedi; yeni uuid major'u da kör override edilmedi. |

Vite'ta kalan duyurular:
[optimized map traversal](https://github.com/advisories/GHSA-4w7w-66w2-5vf9),
[Windows UNC/NTLM](https://github.com/advisories/GHSA-v6wh-96g9-6wx3),
[Windows fs.deny](https://github.com/advisories/GHSA-fx2h-pf6j-xcff),
[Windows % escaping](https://github.com/advisories/GHSA-698v-4r3x-3vcv),
[editor flags](https://github.com/advisories/GHSA-r825-w8mm-5pxw),
[editor existence check](https://github.com/advisories/GHSA-587h-7wmj-h5pm),
[custom middleware](https://github.com/advisories/GHSA-9jrq-w75r-8gcw),
[fs.allow paths](https://github.com/advisories/GHSA-rq7h-c2jc-7f22).
Bu yolların hepsinin projede istismar edilebilir olduğu iddia edilmez.
Vite config yalnızca React eklentisini kurar; özel middleware/editor entegrasyonu eklenmedi.

## Geçici kabul ve kapanış

`security/audit-policy.json` tam paket sürümü, audit önemi ve via duyuru
URL/önem/aralık birleşimini sınırlar. İnceleme **22 Kasım 2026** tarihinde sona erer.
Yeni paket/duyuru/sürüm, değişen önem/aralık, bozuk audit veya ağ hatası kontrolü durdurur.
Düzeltilmiş bulgu çıktıda yoksa istisna var diye tekrar üretilmez; artık gerekmeyen
istisna bir sonraki bakım PR'sinde silinmelidir. Ham audit bütün bulgularla CI artifact'ine yazılır.

Dev server'ı internete/LAN'a/tünele açmayın, hassas dosyasız izole ortam kullanın
ve test sırasında güvenilmeyen siteleri açmayın. Loopback kullanmak tek başına
bütün browser-to-localhost saldırılarına karşı garanti değildir.
CI güvenilmeyen PR kaynaklarını geçici runner'da, contents:read ve deploy/AI sırrı olmadan işler.

[#8](https://github.com/yagizce/NobetciAI/issues/8) desteklenen araç geçişlerini izler.
Bu istisnalar kalıcı güvenlik politikası veya mağaza yayını onayı değildir.
