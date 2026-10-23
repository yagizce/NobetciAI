# PR ve sürüm bakım süreci

Bu süreç önerilen depo standardıdır. Branch protection/required checks, özel güvenlik
bildirimi ve otomatik deploy ayarları bu PR ile etkinleştirilmiş sayılmaz.

## Triage ve inceleme

- Hata/teknik iş için kanıt, kapsam ve kabul ölçütleri kullanın. Aynı iş varsa yeni
  issue açmak yerine mevcut işi güncelleyin. Takvim/faaliyet sayısı üretmek için issue açmayın.
- Bakımcı işleri kullanıcı etkisi ve veri/güvenlik riskiyle önceliklendirsin.
  Hassas raporlar SECURITY.md üzerinden ele alınsın; kamuya özel istismar ayrıntısı yazılmasın.
- Her PR tek ana sonucu anlatsın; issue referansı, değişen davranış, test çıktısı ve
  kalan risk taşısın. Tamamlanmamış kabul ölçütünü kapatmak için `Closes` kullanmayın.
- Main'e girmeden önce CI'ın iki OS test/build işi, Fine-Kinney Core'un iki OS paket/eşitlik işi ve Dependency security sonucu
  incelensin; bilinen istisnalar varsa tarihler ve erişilebilirlik tekrar okunsun.
- Lisans, workflow ve güvenlik politikasına dokunan değişiklikleri özellikle inceleyin.
  Yeni npm bağımlılığı/backend/rol açılışı ürün kararıdır.
- Depo sahibi GitHub'da main için required checks ve inceleme zorunluluğunu ayrıca
  yapılandırsın. Tek bakımcı varsa bağımsız inceleme yapılmış gibi gösterilmesin.
- Dependabot haftalık npm ve aylık Actions PR'leri önerir; otomatik merge yapılmaz.

## Güvenlik kontrolü

CI PR/push, elle çalıştırma ve main'de haftalık programla tanımlıdır. Fork PR'lerinde
`pull_request` kullanılır; `pull_request_target`, deploy veya AI anahtarı yoktur.
Actions commit SHA'larına sabitlenir; token contents:read ve checkout credentials kapalıdır.
Fork/scheduled çalışmanın GitHub tarafından onay veya etkinleştirme gerektirebileceğini
kontrol edin. Workflow main'e alınmadan schedule/Dependabot aktif bakım kanıtı sayılamaz.

`npm run audit:security` ağ veya JSON hatasını başarı saymaz. Yeni paket/duyuru,
duyuru aralığı/önemi veya incelenmiş sürüm değişimi ve inceleme süresi sonu CI'ı durdurur.
13 açık paket kaydı geçici kabul listesindedir; sonuç sıfır zafiyet değildir.
İstisnalar 22 Kasım 2026 tarihinde sona erer; otomatik uzatılmaz.
[#8](https://github.com/yagizce/NobetciAI/issues/8) kapanış/yeniden inceleme kaydıdır.

## Sürüm adayı ve yayın

1. Yalnızca birleşmiş commit'i seçin; sürüm numarasını ve önceki tag'i doğrulayın.
   package.json'daki 1.0.0 mağaza yayını veya gerçek GitHub Release kanıtı değildir.
2. CHANGELOG'a gerçek kullanıcı etkisini ve kalan eksikleri yazın.
   Temiz `npm ci`, uygulama/tooling testleri, örnek, build ve audit çalıştırın.
3. Veri şeması/yedek uyumluluğunu ve ilgili cihaz akışını kontrol edin.
   Canlı AI veya fiziksel cihaz testi yapılmadıysa sürüm notunda belirtin.
4. LICENSING.md kapsamını inceleyin: yalnızca Fine-Kinney Core Apache-2.0 kapsamındadır.
   Uygulamanın tamamı için izin çıkarmayın. Hak çatışması varsa ilgili yayını durdurun.
   Yayın hazırlığı engellerini gözden geçirin; pre-release etiketini gerekiyorsa kullanın.
5. Depo sahibinin açık yayın onayından sonra `vX.Y.Z` tag'i ve commit'e bağlı
   GitHub Release oluşturun; test/CI bağlantılarını sürüm notuna koyun.
   Bu çalışma tag/release/paket/deploy oluşturmaz.
6. Main birleşmesi mevcut Vercel otomasyonunu tetikleyebilir. Merge/yayın kararından
   önce üretim etkisini kontrol edin; PR oluşturulması production yetkisi vermez.
7. Geri dönüşte veritabanını silmeyin; önce yedek ve eski veri uyumluluğunu doğrulayın.

## İzlenen gerçek eksikler

[#8 bağımlılıklar](https://github.com/yagizce/NobetciAI/issues/8) ·
[#9 oturum ve AI erişimi](https://github.com/yagizce/NobetciAI/issues/9) ·
[#10 mobil cihazlar](https://github.com/yagizce/NobetciAI/issues/10) ·
[#11 Fine-Kinney giriş sözleşmesi](https://github.com/yagizce/NobetciAI/issues/11) ·
[#12 lisans](https://github.com/yagizce/NobetciAI/issues/12) ·
[#13 sohbet yedeği](https://github.com/yagizce/NobetciAI/issues/13).
