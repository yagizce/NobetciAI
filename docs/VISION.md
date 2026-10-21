# Vizyon

## Misyon

İşyerlerinin İSG yükümlülüklerini kağıt/Excel'den kurtarıp; risk değerlendirmesinden
periyodik kontrole, eğitimden acil durum planlamasına kadar tek bir dijital, AI destekli
platformda toplamak.

## Hedef Kitle

- **İlk yayın — İSG uzmanları:** Bağımsız veya OSGB bünyesinde çalışan uzmanların sahadaki risk, denetim, kontrol ve belge işlerini yürüttüğü Android/iOS mobil uygulama. Çoklu firma portföyü uzmanın kendi çalışma alanıdır; başlangıçta cihaz başına 30 firma ile sınırlıdır.
- **Sonraki ayrı yayın — firmalar:** İşletmelerin kendi İSG süreçlerini ve ekiplerini yöneteceği firma sürümü. İşveren/çalışan erişimi ve eğitim gibi saklı modüller bu sürüm için değerlendirilecektir; ilk uzman sürümüne dahil değildir.

Vercel yayını mobil uygulamanın web demosudur. Ayrı sürümlerin paketleme ve hesap altyapısı kararları henüz verilmedi; güncel sınırlar [Yayın kapsamı](RELEASE_SCOPE.md) belgesindedir.

## Ürün İlkeleri

1. **Mobil öncelikli.** Sahada, telefonla kullanılabilir olmalı — masaüstü bir gereklilik
   değil, bir seçenektir.
2. **AI, karar vericinin yerine geçmez, ona yardımcı olur.** Örn. Fine-Kinney AI önerisi
   her zaman düzenlenebilir alanlara yazılır, sessizce/geri dönüşsüz uygulanmaz.
3. **Kademeli güvenilirlik.** Mock veri kullanılan yerler kod içinde açıkça işaretlenir;
   kullanıcıya gerçek veri gibi sunulmaz.
4. **Kırılmadan büyüme.** Yeni özellik, mevcut çalışan özelliği bozarak eklenmez
   (bkz. [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)).

## Farklılaştırıcılar

- **Fine-Kinney'in tam dijitalleşmesi**: açıklamalı puanlama, artık risk hesaplama, AI
  önerisi, düzeltici faaliyet takibi ve risk geçmişi tek modülde.
- **AI destekli danışmanlık**: sohbet arayüzünden risk/önlem/KKD önerisi.
- **Kurumsal ölçeklenebilirlik**: firma/şube/departman/çalışan yapısı baştan çok-kiracılı
  düşünülerek kuruluyor (veri modelinde `companyId` her kayıtta mevcut).

## Başarının Tanımı

İlk sürümde bir İSG uzmanının, ayrı bir Excel dosyası veya kağıt form açmadan; risk
oluşturma → onay → düzeltici faaliyet → kapanış döngüsünün tamamını Nöbetçi içinde
yürütebilmesi.

## Kapsam Dışı (bilinçli olarak hedeflenmeyen)

- Genel amaçlı bir proje yönetim aracı olmak (yalnızca İSG odaklı kalır).
- İSG uzmanının/işverenin onayının yerine geçen tam otonom AI karar alma.
