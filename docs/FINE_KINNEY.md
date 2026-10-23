# Fine-Kinney'nin bağımsız kullanımı

## Değerlendirme

`src/constants/fineKinney.js` import bağımlılığı olmayan saf bir ESM dosyasıdır.
Hesaplama ve sınıflandırma Node'da React, DOM, IndexedDB, AI, ağ veya npm kurulumu
olmadan çalışır. Dosyada ayrıca UI etiketleri/paletleri vardır; ayrı npm paketi
veya sürümlenmiş bağımsız API değildir. Bu çalışma dosyayı ayırmaz ve davranışını değiştirmez.
Lisans kararı beklediği için dış projeye kopyalama/dağıtım izni verilmiş sayılmaz.

Depo kökünde:

```sh
node examples/fine-kinney.mjs
node --test src/constants/fineKinney.test.js src/constants/fineKinney.standalone.test.js
```

Örnek aynı fonksiyonları doğrudan çağırır:

```js
import {
  computeFineKinneyScore,
  getFineKinneyRiskLevel,
} from "./src/constants/fineKinney.js";

const score = computeFineKinneyScore(3, 6, 7);
const { key, label } = getFineKinneyRiskLevel(score);
// score: 126, key: "important", label: "Önemli Risk"
```

`computeFineKinneyScore(probability, frequency, severity)` sayıları çarpar.
Olasılık değerleri 0.1/0.2/0.5/1/3/6/10; maruziyet 0.5/1/2/3/6/10;
şiddet 1/3/7/15/40/100'dür. Bunlar mevcut uygulama ölçekleridir;
bu belge bağımsız metodoloji veya hukuki uygunluk doğrulaması değildir.

| Skor | key |
|---|---|
| <20 | low |
| 20 ≤ skor <70 | possible |
| 70 ≤ skor <200 | important |
| 200 ≤ skor <400 | high |
| ≥400 | veryHigh |

`getFineKinneyRiskLevel(score, mode = "light")` key, Türkçe label/description ve
bg/text renklerini döndürür. `dark` yalnızca paleti değiştirir; bilinmeyen tema light'a düşer.
Başlangıç/artık risk, kayıt, kapatma kanıtı ve yetki denetimi bu iki fonksiyonun işi değildir;
ilgili servis/özellik katmanlarında kalır. AI önerisini kabul etme kararı kullanıcıdadır.

## Mevcut giriş sözleşmesinin sınırı

Motor finite sayı veya ölçek doğrulaması yapmaz; JS sayı dönüşümü uygulanır.
Örneğin eksik girdi NaN, negatif girdi negatif skor üretebilir.
`getFineKinneyRiskLevel(NaN)` mevcut karşılaştırmalar nedeniyle veryHigh döndürür;
bu geçerli bir değerlendirme değildir. Çağıran katman finite, pozitif ve seçilen
ölçeklere uygun girdi sağlamalıdır. Bu davranış sessizce düzeltilmedi:
[#11](https://github.com/yagizce/NobetciAI/issues/11).

Mevcut eşik testleri korunur. Yeni testler 252 ölçek birleşiminde finite sonuç/tema
tutarlılığını, 0.05–10000 uç değerlerini, örneğin ayrı Node sürecinde çalışmasını ve
geçersiz girdi davranışını belgeler. Testler yöntemin sahadaki karar kalitesini kanıtlamaz.
