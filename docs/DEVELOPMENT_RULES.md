# Development Rules

Nöbetçi üzerinde çalışan herkes (insan ya da AI asistan) için **tek referans
geliştirme standardıdır.** Amaç çok kural biriktirmek değil; net karar vermeyi
kolaylaştıran, kısa ve sürdürülebilir bir çerçeve sunmaktır. Bir talep bu
standartla çelişiyorsa, sessizce esnetilmez — önce kullanıcıyla netleştirilir.

---

## Development Philosophy

- Önce mevcut sistemi geliştir, sonra yeni özellik ekle.
- Her sprint tek bir ana hedefe odaklansın — birden fazla hedefi aynı anda
  kovalayan sprint, hiçbirini tam bitirmez.
- Gereksiz karmaşıklık oluşturma; en basit çözüm, ispatlanana kadar doğru
  çözümdür.
- Uzun vadeli sürdürülebilirliği ön planda tut — bugünkü hız, yarınki bakım
  maliyetini artırmamalı.

## Code Quality

- Büyük refactor yapma; gerçekten ihtiyaç varsa yap. "Gerçekten ihtiyaç var"
  demek: mevcut yapı yeni bir özelliği **imkansız** kılıyor, yalnızca
  "daha temiz olurdu" demek değil.
- Mevcut componentleri yeniden kullanmayı tercih et — yenisini yazmadan önce
  `src/components/ui/` ve ilgili modül taranır.
- Kod tekrarını azalt; aynı blok iki yerde tekrar ediyorsa ortak bir
  bileşene/hook'a çıkar.
- Okunabilirliği ön planda tut — akıllıca ama anlaşılması zor kod tercih
  edilmez.
- Gereksiz bağımlılık ekleme; ihtiyaç önce mevcut araçlarla çözülür.
- Küçük ve sorumluluğu net componentler yaz; büyüyen bir bileşen
  orkestratör + alt bileşenlere bölünür.

## Architecture

- Mevcut mimariyi koru — katman sınırları (`pages → features → services →
  dataProvider`) ve context yapısı değiştirilmez (bkz.
  [ARCHITECTURE.md](./ARCHITECTURE.md)).
- Gelecekte AI, mobil uygulama ve backend entegrasyonuna uygun geliştir; yeni
  bir modül eklerken "bu yapı yarın Supabase'e, native uygulamaya veya yeni bir
  AI özelliğine bağlanabilir mi" sorusu sorulur.
- Mock veri yapısını gerçek sistemlere kolay taşınabilecek şekilde tasarla —
  alan adları ve veri şekli, gelecekteki gerçek kaynakla (bkz.
  [DATABASE_PLAN.md](./DATABASE_PLAN.md)) uyumlu olacak şekilde seçilir.

## User Experience

- Mevcut kullanıcı deneyimini bozma.
- Responsive tasarımı koru — mobil öncelikli, `sm:`/`md:`/`lg:` ile genişleyen
  düzen.
- Tutarlı tasarım dili kullan — renk, ikon ve bileşen seçimi her zaman mevcut
  `theme` token'larından ve ortak bileşenlerden yapılır.

## AI Readiness

- AI entegrasyonu olmayan yerlerde bile veri modelini geleceğe hazır tasarla.
- AI karar vermez, öneri sunar.
- Son karar her zaman kullanıcıya ait olmalıdır — hiçbir AI çıktısı sessizce
  veya geri dönüşsüz biçimde uygulanmaz (bkz.
  [AI_ROADMAP.md](./AI_ROADMAP.md)).

## Documentation Policy

Her geliştirme sonunda, **yalnızca gerçekten gerekiyorsa**, aşağıdaki
dosyalardan ilgili olan(lar) güncellenir:

- `README.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `SPRINTS.md`
- `ARCHITECTURE.md`
- `DATABASE_PLAN.md`

"Gerekiyor" demek: o dosyanın mevcut içeriği yapılan değişiklikle **çelişiyor
veya eksik kalıyor** demektir — kozmetik ya da "belki faydalı olur" gerekçesiyle
doküman güncellenmez. Gerekmiyorsa hiçbir dosyaya dokunulmaz.

## Development Report

Her geliştirme sonunda kısa bir rapor oluşturulur. Rapor şu başlıklardan
oluşur:

- **Yapılan Geliştirmeler**
- **Etkilenen Modüller**
- **Bilinen Riskler**
- **Sonraki Öneriler**
- **Documentation Check** — Documentation Policy'deki hangi dosyaların
  güncellendiği/güncellenmediği ve neden.

## General Rules

- İnternet erişimin olmadığını varsay.
- Gerçek build yaptığını iddia etme.
- Statik analiz ve mevcut proje üzerinden değerlendirme yap.
- Emin olmadığın konularda varsayım yapma — belirsizlik varsa sorulur.
- Ürünün kurumsal kalitesini artırmayı önceliklendir.

---

Bu doküman yalnızca standardın kendisi değiştiğinde güncellenir. Kod
değişiklikleri bu dosyayı otomatik olarak güncellemez.
