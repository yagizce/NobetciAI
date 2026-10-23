# Katkı rehberi

Yalnızca `packages/fine-kinney-core/` Apache-2.0 kapsamındadır; bu klasöre katkılar
aynı lisans altında, sahiplik devri olmadan sunulur. [Bileşen rehberi](packages/fine-kinney-core/CONTRIBUTING.md)
ve [kesin kapsam](LICENSING.md) geçerlidir. Uygulamanın geri kalanında katkı ve
lisans haklarını bakımcıyla ayrıca netleştirin. [#12](https://github.com/yagizce/NobetciAI/issues/12)
tüm uygulama için kapanmış sayılmaz. Paket yayını, merge ve deploy ayrıca onay gerektirir.

## Başlangıç

Önce [AGENTS.md](AGENTS.md), [proje bağlamı](docs/PROJECT_CONTEXT.md),
[geliştirme kuralları](docs/DEVELOPMENT_RULES.md) ve [yayın kapsamını](docs/RELEASE_SCOPE.md) okuyun.
Bir hata için tekrar üretim, iyileştirme için somut ihtiyaç ve kabul ölçütleri yazın.
Büyük refactor, backend/sağlayıcı ekleme veya saklı modül açma ayrı ürün kararıdır.

Node 24 ile depoyu kurun:

```sh
npm ci
npm test
npm run test:tooling
npm run example:fine-kinney
npm run build
npm run audit:security
npm --prefix packages/fine-kinney-core ci --ignore-scripts
npm --prefix packages/fine-kinney-core test
node packages/fine-kinney-core/tools/verify-upstream.mjs src/constants/fineKinney.js
```

AI olmadan yerel test ve derleme çalışır. Canlı AI için anahtarlar yalnızca sunucuda tutulur;
fork PR CI'ına anahtar verilmez. Vite geliştirme sunucusunu internete veya paylaşılan ağa
açmayın; güvenlik borcu [burada](docs/DEPENDENCY_SECURITY.md) açıklanır.

## Branch ve PR

1. Güncel main'den kapsamı anlatan bir branch açın. Mevcut yerel değişiklikleri koruyun;
   force push/reset/clean ile başkasının çalışmasını silmeyin.
2. Küçük, bir amacı olan commit'ler hazırlayın. Bir issue birden çok PR gerektirebilir;
   issue'yu yalnızca kabul ölçütlerinin tamamı karşılanınca kapatın.
3. PR şablonunda problem, sonuç, doğrulama ortamı ve kalan riskleri açıklayın.
   Yapılmayan testleri yapıldı diye işaretlemeyin. AI katkısını ve insan doğrulamasını belirtin.
4. Katmanlar pages → features → services → dataProvider şeklinde korunur.
   Ortak UI/token'ları kullanın. Arayüz ve yorumlar Türkçe, isimler İngilizcedir.
5. Fine-Kinney puan/eşiklerini, AI insan-onayı akışını ve eski veri/yedek sözleşmesini
   kozmetik temizlik sırasında değiştirmeyin. Kapalı rol/eğitim kodunu ve store'larını koruyun.
6. Gerekli testler ve bakımcı incelemesi bitmeden birleştirmeyin. PR #7 bağımsız çalışmadır.
   Merge izni production deploy izni değildir; main'in mevcut Vercel bağlantısını hesaba katın.

Bağımlılık güncellemesinde `npm audit fix --force` kullanmayın. Duyuru, erişilebilirlik,
kilit dosyası değişimi ve kullanıcı akışı doğrulamasını birlikte değerlendirin.
İstisna eklemek güvenlik düzeltmesi değildir; gerekçe, issue ve yeniden inceleme tarihi gerekir.
Sırlar, gerçek saha fotoğrafları ve kişisel verileri issue/fixture içine koymayın.

## Bakım ve sürüm

[PR/sürüm süreci](docs/MAINTENANCE.md) ve [güvenlik bildirimi](SECURITY.md).
Belgeleri yalnızca değişiklik mevcut açıklamayı eksik/yanlış bıraktığında güncelleyin.
