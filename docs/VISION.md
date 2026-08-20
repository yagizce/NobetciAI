# Vizyon

## Misyon

İşyerlerinin İSG yükümlülüklerini kağıt/Excel'den kurtarıp; risk değerlendirmesinden
periyodik kontrole, eğitimden acil durum planlamasına kadar tek bir dijital, AI destekli
platformda toplamak.

## Hedef Kitle

- **Küçük/orta ölçekli işletmeler** — kendi İSG uzmanı olmayan veya dışarıdan hizmet alan
  firmalar.
- **İSG uzmanları/OSGB'ler** — birden fazla firmayı tek panelden yönetmek isteyenler
  (çoklu firma mimarisi bu ihtiyaca yöneliktir).
- **İşverenler** — yasal uyumluluğu ve saha güvenliğini üst düzeyden takip etmek
  isteyenler.

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

Bir İSG uzmanının/işverenin, ayrı bir Excel dosyası veya kağıt form açmadan; risk
oluşturma → onay → düzeltici faaliyet → kapanış döngüsünün tamamını Nöbetçi içinde
yürütebilmesi.

## Kapsam Dışı (bilinçli olarak hedeflenmeyen)

- Genel amaçlı bir proje yönetim aracı olmak (yalnızca İSG odaklı kalır).
- İSG uzmanının/işverenin onayının yerine geçen tam otonom AI karar alma.
