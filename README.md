# Nöbetçi AI — İSG uzmanının saha çalışma alanı

Türkçe, mobil öncelikli risk değerlendirmesi, denetim, periyodik kontrol,
belge üretimi ve AI danışmanlığı uygulaması.

**Durum:** React web/PWA geliştirme sürümü. Etkin ürün kapsamı yalnızca İSG uzmanı.
Gerçek hesap sistemi, sunucu veri izolasyonu ve Android/iOS mağaza paketleri yoktur.
Depo public'tir; **açık kaynak lisansı henüz seçilmemiştir**. Kaynakların görünür
olması yeniden kullanım/dağıtım lisansı anlamına gelmez.
[Lisans kararı](docs/LICENSING_OPTIONS.md) · [Katkı rehberi](CONTRIBUTING.md).

## Bugün bulunan özellikler

- Fine-Kinney puanlama, filtreler, artık risk önerileri, düzeltici faaliyet ve kapanış kanıtları.
- Manuel/fotoğraflı Risk Tespiti; fotoğraftan çoklu bulgu ve kullanıcı onayı.
- Uzman dashboard'u, yerel firma kaydı, denetim/DİF ve periyodik kontrol takibi.
- Belge taslağı oluşturma, mevzuat ekranı ve örnek içerikli bilgi kütüphanesi.
- Anthropic risk/belge danışmanlığı; NVIDIA metin sohbeti ve fotoğraf analizi.
- IndexedDB'de yerel kayıt, JSON yedek/geri yükleme, PWA çevrimdışı kabuğu ve XLSX dışa aktarım.

İşveren/çalışan, eğitim, çalışan listesi/bildirimi ve demo veri sıfırlaması bilerek
kapalıdır. Şube/departman yönetimi ve firma idari alanları gizlidir; eski verileri
korunur. AI Mevzuat & Risk Taraması kaldırılmıştır. Sabit kamera sistemi ertelenmiştir.
[Ürün kapsamı](docs/RELEASE_SCOPE.md) tek başvuru kaynağıdır;
`src/constants/releaseProfile.js` kapsamın kod tarafındaki tek kontrol noktasıdır.

## Kurulum ve doğrulama

Node.js **24** kullanın. Terminalde:

```sh
git clone https://github.com/yagizce/NobetciAI.git
cd NobetciAI
npm ci
npm run dev
```

Geliştirme sunucusunu yerelde tutun; açık LAN/tünel/production sunucusu olarak
kullanmayın. Kalan [Vite güvenlik riskleri](docs/DEPENDENCY_SECURITY.md) vardır.

```sh
npm test
npm run test:tooling
npm run example:fine-kinney
npm run build
npm run audit:security
npm run preview
```

Test/build için AI anahtarı veya backend gerekmez. `npm run dev` ve preview yalnızca
ön yüz içindir; göreli `/api/*` fonksiyonlarını çalıştırmaz.
Sunucu işlevlerini destekleyen ayrı yerel ortamda AI denenebilir.
Windows'ta Vite yapılandırma yüklemesi ortam iznine takılırsa belgelenmiş
[eşdeğer derleme kontrolünü](docs/MOBILE_RELEASE_READINESS.md) kullanın ve sonucu açıkça raporlayın.

[CI tanımı](.github/workflows/ci.yml) Node 24 ile Linux/Windows kurulum,
test/build ve bağımlılık kontrolü çalıştırır. Gerçek sonuçlar
[Actions](https://github.com/yagizce/NobetciAI/actions) sayfasındadır;
workflow dosyası tek başına başarılı çalışma kanıtı değildir.

## Mimari

`pages → features → services → dataProvider → IndexedDB`.
React 18, React Router 6, Vite 5; Tailwind derleme sırasında üretilir.
State React Context/hook'larda, ortak bileşenler `src/components/ui/` altındadır.
ExcelJS ve jsQR gerektiğinde yüklenir.

| Yol | Sorumluluk |
|---|---|
| src/pages, src/features | Sayfa girişleri ve modül iş mantığı |
| src/services | Veri erişimi ve AI istemcileri |
| src/constants, src/utils | Ölçekler, saf hesaplama ve yardımcılar |
| api | Anthropic/NVIDIA sunucu proxy'leri |
| public | PWA manifesti, service worker, çevrimdışı sayfası |
| scripts, security | Bağımlılık kontrolü ve süreli risk incelemeleri |
| docs, examples | Mimari/kurallar, teknik kullanım ve çalışan örnek |

Fine-Kinney hesabı doğrudan ESM olarak kullanılabilir:
[bağımsız kullanım, sınırlar ve testler](docs/FINE_KINNEY.md).
Ayrı npm paketi yayımlanmamıştır; hesaplama dosyasının davranışı bu hazırlıkta değiştirilmez.

## AI yapılandırması

Anahtarları yalnızca sunucu ortamına koyun; `VITE_*` değişkenlerine veya repoya yazmayın.

| Değişken | Sunucu yolu |
|---|---|
| ANTHROPIC_API_KEY | /api/chat: risk, belge ve bilgi kütüphanesi |
| NVIDIA_API_KEY | /api/kimi-chat ve /api/cosmos-vision: sohbet/fotoğraf |

AI önerir, insan onaylar. Bulgular onaylanmadan kaydolmaz.
Bilgi kütüphanesi anahtar kelime bağlamı kullanır; tam vektör RAG değildir.

## Mevcut sınırlamalar

- Veriler cihaz/tarayıcıda kalır; bulut senkronizasyonu ve gerçek Auth/RLS yoktur.
  Login/Register ve şifre işlemleri demodur. Yerel kapsam kontrolü yetkilendirme değildir.
- API origin/IP kontrolleri kullanıcı oturumu veya kalıcı kota sağlamaz.
- Yedek saklı modüllerin IndexedDB verilerini kapsar; **sohbet geçmişini kapsamaz**.
  Kısmi eski yedek geri yükleme, eksik bölümleri onay sonrasında boşaltabilir.
- Bilgi kütüphanesinde örnek içerik vardır; eğitim yer tutucu videosu kapalı modülde kalır.
- Android/iOS paketleme, imzalama, fiziksel cihaz ve canlı AI doğrulamaları bekler.
- Bağımlılıklarda açık güvenlik borcu ve ExcelJS büyük parça uyarısı vardır.
  [Audit değerlendirmesi](docs/DEPENDENCY_SECURITY.md) · [Güvenlik bildirimi](SECURITY.md).
- Supabase taslakları aktif değildir; yeni backend/sağlayıcı kendiliğinden eklenmez.

## Katkı ve bakım

[CONTRIBUTING](CONTRIBUTING.md) ve [AGENTS.md](AGENTS.md) ile başlayın.
Hata/teknik iş şablonlarında kişisel veri içermeyen kanıt ve kabul ölçütleri kullanın.
PR/sürüm süreci, güvenlik istisnası incelemesi ve gerçek açık işler
[MAINTENANCE](docs/MAINTENANCE.md) içinde açıklanır. Bu süreç otomatik merge/deploy eklemez;
mevcut Vercel bağlantısı nedeniyle main'e birleşmenin yayın etkisini ayrıca kontrol edin.

[Dokümantasyon](docs/README.md) · [Mimari](docs/ARCHITECTURE.md) ·
[Yayın hazırlığı](docs/MOBILE_RELEASE_READINESS.md) · [Değişiklikler](CHANGELOG.md).
