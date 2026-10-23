# Lisans kararı — henüz kabul edilmedi

23 Ekim 2026 incelemesinde LICENSE yok ve GitHub metadata'sı license=null.
Public depo, tek başına yeniden kullanım/dağıtım lisansı vermez.
Bu belge bir lisans veya hukuki izin değildir. Sahip onayı olmadan LICENSE,
SPDX lisans alanı veya katkıları yeniden lisanslama taahhüdü eklenmedi.

| Seçenek | Temel koşul ve ürün etkisi |
|---|---|
| [MIT](https://opensource.org/license/mit) | Kısa, izinli lisans; lisans/telif bildirimi korunarak ticari ve kapalı türevler mümkün. Açık patent lisansı içermez. |
| [Apache-2.0](https://opensource.org/license/apache-2.0) | İzinli; açık patent lisansı, değiştirme ve varsa NOTICE bildirimleri. Patent açıklığı isteniyorsa değerlendirilebilir. |
| [AGPL-3.0](https://opensource.org/license/agpl-3.0) | Güçlü copyleft; değiştirilmiş programla ağ üzerinden etkileşen kullanıcılara ilgili kaynak sunma yükümlülüğü. SaaS/türev paylaşımı hedefiyle birlikte incelenmeli. |

Seçim için sorular: kapalı ticari türevlere izin verilecek mi; değiştirilmiş ağ
hizmetlerinin kaynağı paylaşılmalı mı; katkı sahiplerinin tüm kodu lisanslama
yetkisi var mı? İleride ikili lisanslama düşünülüyorsa hak sahipliği ayrıca değerlendirilir.

Kodun yanında video, görsel, mevzuat/örnek belge metinleri, marka/ikonlar ve
üçüncü taraf bağımlılıkların lisansları da incelenmeli. Proje lisansı bunların
haklarını otomatik değiştirmez. Fine-Kinney formülünün bağımsız kullanılabilirliği,
bu depodaki somut kod/etiketlerin serbestçe yeniden lisanslanabileceği anlamına gelmez.

[#12](https://github.com/yagizce/NobetciAI/issues/12) karar ve hak sahipliği takibidir.
Sahip seçimi onayladıktan sonra ayrı PR ile lisans, gerekli bildirimler ve katkı koşulları
tutarlı hale getirilir. O zamana kadar başvuruda “OSI lisanslı açık kaynak” denmemeli.
[GitHub kullanım koşulları](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)
kapsamındaki görüntüleme/fork izinleri genel bir açık kaynak lisansının yerini tutmaz.

## Ticari ürün için öneri — onay bekliyor

Kapalı ticari türevlerin karşılıksız oluşmasını sınırlamak öncelikse, bu proje için
**AGPL-3.0-only + ayrı ticari lisans** modelini öneriyorum. Bu bir öneridir; kabul
edilmiş lisans veya eklenmiş ticari sözleşme değildir.

[AGPL madde 13](https://opensource.org/license/agpl-3.0), değiştirilmiş ağ sürümünün
kullanıcılarına ilgili kaynağı sunmasını gerektirir. Bu, copyleft koşullarını kabul
etmeyen kapalı entegrasyonlar için ayrı ticari anlaşma seçeneği bırakabilir.
MIT ve [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) kapalı türevlere de
izin verdiğinden bu hedef için daha zayıf karşılıklılık sağlar; Apache ayrıca açık
patent lisansı ve marka sınırları sunar.

**Sınır:** AGPL rakiplerin ticari kullanımını veya koşullara uygun satışını yasaklamaz.
[Açık Kaynak Tanımı](https://opensource.org/osd) ticari kullanımı dışlamaya izin vermez.
“Rakip hiç kullanamasın” hedefi varsa bunu bir açık kaynak lisansı garanti edemez.

Çift lisans yalnızca sahibinin yeterli yeniden lisanslama yetkisine sahip olduğu kod
için kurulabilir. Tüm katkıların hak sahipliği ve gelecekteki katkı anlaşmalarının ticari
lisanslama yetkisi incelenmeli; üçüncü taraf bağımlılık koşulları korunmalıdır.
Önceden verilen açık kaynak izinleri koşullara uyulduğu sürece sonradan geri alınamaz.
Nöbetçi adı/logo hakları ayrıca ele alınmalı. Nihai model, kapsam ve sözleşme metni
[#12](https://github.com/yagizce/NobetciAI/issues/12) içinde sahibin kararıyla netleşmelidir.
