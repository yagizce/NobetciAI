# Codex for Open Source — doğrulanabilir kapsam

İnceleme: **23 Ekim 2026**. Başvuru deposu mevcut
[yagizce/NobetciAI](https://github.com/yagizce/NobetciAI) olacaktır.
Başvuru gönderilmedi; yeni repo, npm yayını, merge veya deploy yapılmadı.

## Açık kaynak kapsamı

**Yalnızca [packages/fine-kinney-core/](../packages/fine-kinney-core/README.md)
Apache-2.0 lisanslı bileşendir.** Ticari uygulamanın tamamı Apache-2.0 veya
tamamen açık kaynak olarak sunulamaz. [LICENSING.md](../LICENSING.md) kesin
sınırı; bileşen LICENSE/NOTICE/PROVENANCE kaynak ve hak incelemesini tanımlar.

Başvuruda depo URL'sinin yanında gerçek bileşen tree/commit bağlantısı ve
kapsam açıklaması verilmelidir. PR dalındaki bileşen main'de varmış gibi
gösterilmemeli; PR #7'nin özellikleri bu tabana mal edilmemelidir.
Uygulamanın önceki bakım geçmişi depo bağlamıdır; bağımsız paket geçmişi,
kullanıcı sayısı veya benimsenme kanıtı değildir.

[OpenAI program sayfası](https://developers.openai.com/community/codex-for-oss)
ve [şartları](https://learn.chatgpt.com/docs/codex-for-oss-terms) bakımcı rolü,
gerçek kullanım, ekosistem önemi ve bakım kanıtlarını değerlendirebilir.
Karma lisans düzeni için otomatik uygunluk veya kabul garantisi belirtilmez.
Doğrulanmış kullanıcı/kurulum/indirme sayısı yoktur; yaygın kullanım iddiası
kurulmamalıdır. Depo düzeyindeki GitHub lisans metadata'sı klasör kapsamını
tek başına anlatmaz. [#12](https://github.com/yagizce/NobetciAI/issues/12)
ticari uygulamanın bütünü için çözülmüş sayılmaz.

## Gerçek kanıtlar

| İddia | Kanıt |
|---|---|
| Mevcut uygulama korunuyor | 607 uygulama testi; src motoru, veri yapısı, API, yayın profili ve uygulama bağımlılıkları değişmedi. |
| PR #14 güvenlik araçları korunuyor | 9 tooling testi; mevcut CI, security/audit-policy.json ve scripts değişmedi. |
| Bağımsız açık kaynak hesaplama | Bileşende 272 test, saf ESM API, sayısal ölçekler, tip bildirimleri, örnek, bağımlılıksız kilit dosyası. |
| Uygulama ile eşitlik | tools/verify-upstream.mjs: 252 birleşim, 19 sınıflandırma ucu, 7 aritmetik uç durum; özgün kaynak hash'i 52f2c9507feff142cf61c591fffaea8e4f1ccdc3688c94a364b2103ba1bbae1f. |
| Lisansın sınırı | Kök LICENSING.md; Apache LICENSE/NOTICE yalnızca bileşen klasöründe. Tarihsel MIT izinleri ve üçüncü taraf hakları korunur. |
| CI ve bakım | Mevcut test/build/security CI'a ek olarak ayrı fine-kinney-core.yml Linux/Windows paket testi/eşitlik/audit işleri; katkı ve bakım rehberleri. |

## Bu entegrasyonda yerel sonuçlar

Windows, Node 24.19.0/npm 11.17.0:
- Uygulama: **607/607**; tooling: **9/9**; paket: **272/272** başarılı.
- Paket npm ci, sözdizimi, örnek 270/high ve motorla eşitlik başarılı.
- npm run build başarılı; ExcelJS 942.09 kB büyük parça uyarısı devam ediyor.
- Kök audit politikası başarılı; **6 yüksek/7 orta** mevcut paket kaydı sürüyor.
  İstisnalar **22 Kasım 2026** tarihinde sona eriyor; kapsam/tarih değiştirilmedi.
- Paket audit sonucu 0 bulgu; paketin npm bağımlılığı yok. Bu genel bir sıfır
  güvenlik riski iddiası değildir.
- Mevcut ve yeni workflow actionlint kontrolünden geçti.

Uzak CI sonucu için [PR #14 checks](https://github.com/yagizce/NobetciAI/pull/14/checks)
ve [Actions](https://github.com/yagizce/NobetciAI/actions) üzerindeki **güncel
head commit'e ait** sonuçları kullanın. Workflow tanımı veya önceki head'in
başarılı çalışması yeni commit'in başarısı sayılmaz. Gerçek koşu bağlantıları
PR açıklamasında güncellenir.

Canlı AI, fiziksel cihaz, pentest, dış benimsenme ve metodolojinin sahadaki
karar kalitesi doğrulanmadı. Başvuru kanıtı, production yayın onayı değildir.

## Açık işler ve sınırlar

[#8 bağımlılıklar](https://github.com/yagizce/NobetciAI/issues/8),
[#9 oturum/API](https://github.com/yagizce/NobetciAI/issues/9),
[#10 cihazlar](https://github.com/yagizce/NobetciAI/issues/10),
[#11 girdi doğrulama](https://github.com/yagizce/NobetciAI/issues/11),
[#12 uygulama lisansı](https://github.com/yagizce/NobetciAI/issues/12),
[#13 sohbet yedeği](https://github.com/yagizce/NobetciAI/issues/13) açık kalır.
İncelenen bileşende somut hak çatışması bulunmadı; Git yazarlığı bilinmeyen
sözleşmelerin yokluğunu kanıtlamaz. Böyle bir çatışmada ilgili yayın durdurulur.
Apache izni yalnızca hak sahiplerinin lisanslayabildiği kapsamda geçerlidir.
Main ve Vercel production bu çalışma kapsamında değiştirilmez.
