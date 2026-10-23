# Codex for Open Source — doğrulanabilir hazırlık kaydı

İnceleme: **23 Ekim 2026**. Bu belge başvuru gönderimi, program kabulü,
lisans kararı veya üretim yayını değildir.

## Program ve dürüst kapsam

[OpenAI Docs program sayfası](https://developers.openai.com/community/codex-for-oss)
bakımcıların inceleme, triage ve bakım işlerini desteklemeyi amaçlar.
[Program şartları](https://learn.chatgpt.com/docs/codex-for-oss-terms)
doğru başvuru bilgisi ister; kullanım, ekosistem önemi ve bakım kanıtları
değerlendirilebilir ve başvuru kabul garantisi vermez.

Depo public; inceleme anındaki
[GitHub metadata'sında](https://api.github.com/repos/yagizce/NobetciAI)
**0 yıldız, 0 fork, license=null** görüldü. Kullanıcı/kurulum/indirme
telemetrisi doğrulanmadı; yaygın kullanım iddiası kurulmamalı.
Paket yayımlama veya ücretli/ücretsiz gerçek kullanıcı sayısı üretilmedi.
İSG uzmanına yönelik yerel risk/denetim iş takibi ve bağımsız çalışabilen
Fine-Kinney hesabı somut teknik bağlamdır; ekosistem etkisi ayrıca kanıtlanmalıdır.

**Açık karar:** [Lisans ve hak sahipliği #12](https://github.com/yagizce/NobetciAI/issues/12).
Lisans eklenmeden OSI lisanslı açık kaynak proje olarak sunulmamalıdır.
[Seçenekler](LICENSING_OPTIONS.md) yalnızca karşılaştırmadır.

## Kanıt haritası

| İddia | Tekrar üretilebilir kanıt |
|---|---|
| Mevcut 604 test korundu | Taban eb26b5a'daki test dosyaları değiştirilmedi; npm test artık üç ek testle 607 test çalıştırır. |
| Hesap bağımsız çalışıyor | examples/fine-kinney.mjs ve src/constants/fineKinney.standalone.test.js; motor dosyası değişmedi. |
| Güvenlik borcu izlendi | DEPENDENCY_SECURITY.md; kilit dosyası yamaları; security/audit-policy.json; ham audit CI artifact'i. |
| Katkı/bakım süreci tanımlı | CONTRIBUTING.md, SECURITY.md, MAINTENANCE.md ve .github PR/Issue şablonları. |
| Gerçek teknik işler izleniyor | #8–#13: bağımlılıklar, hesap/API, cihazlar, giriş doğrulama, lisans ve sohbet yedeği. Issues'ın açılması tamamlandıkları anlamına gelmez. |
| CI tanımlı | .github/workflows/ci.yml; gerçek çalışmanın commit ve sonucu için Actions bağlantısı kullanılmalı. |

## Bu çalışma sırasında yerel doğrulama

Windows, Node 24.19.0/npm 11.17.0:
- Temiz npm ci başarılı.
- npm test: **607/607**; mevcut 604 + bağımsız kullanım için 3 test.
- npm run test:tooling: **9/9**, yeni/bozuk/eskimiş audit sonuçlarının, boş duyuru zincirinin ve geçersiz takvim tarihinin reddi dahil.
- npm run example:fine-kinney: 126 / important / Önemli Risk.
- npm run build başarılı; mevcut ExcelJS parçası 942.09 kB (gzip 272.74 kB) uyarısı sürüyor.
- actionlint 1.7.12 ve git diff --check başarılı.
- Audit önce 8 yüksek/7 orta, uyumlu yamalardan sonra **6 yüksek/7 orta**.
  Süreli politika kontrolünün geçmesi bu açık risklerin düzeldiğini ifade etmez.

Linux/Windows hosted runner sonucu ancak
[ilgili CI run'ı](https://github.com/yagizce/NobetciAI/actions/workflows/ci.yml)
başarıyla bittiğinde başvuru kanıtına eklenebilir.
Yerel testler sahada kullanımı, canlı AI kalitesini, fiziksel cihazı, yasal
uygunluğu veya bağımsız insan incelemesini kanıtlamaz.

PR #7 birleştirilmez; onun 30 firma portföyü bu tabanın tamamlanmış özelliği gibi
anlatılmaz. Main, production, veritabanı ve yayın profili bu hazırlıkta değiştirilmez.
