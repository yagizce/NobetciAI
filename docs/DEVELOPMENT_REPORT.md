# Son geliştirme raporu

**21 Ekim 2026 — Yayın planı belgeleri**

- İlk yayın uzmanlar için Android/iOS mobil uygulama; firmalara yönelik sürüm sonraki ayrı yayın olarak netleştirildi. Vercel web demosudur.
- 30 firma sınırı geçici ürün kararı olarak korundu. Uzman portföyü ile firma/ekip hesabı ayrıldı; firma sürümünün limit ve paketleme kararları açık bırakıldı.
- README, AGENTS, proje bağlamı, yayın kapsamı/hazırlığı, doküman dizini, vizyon ve yol haritası güncellendi. Şube/departmanların aktif olduğuna dair eski bağlam ifadesi düzeltildi.
- Yalnızca Markdown değişti; kod, şema ve saklı modüller değişmedi. `git diff --check` geçti; bu belge güncellemesinde test/derleme yeniden çalıştırılmadı. Aşağıdaki 608 test önceki kod değişikliğinin doğrulamasıdır.

**21 Ekim 2026 — Uzman ana ekranı ve firma portföyü**

## Yapılan Geliştirmeler

Aktif firmaya ait yüksek riskler, geciken işler, bugün/7 günlük faaliyet-kontrol-denetim planı ve incelenecek tespitler eklendi. Ana ekrandan firma oluşturma/seçme; cihaz başına 30 firma sınırı. İkinci firma öncesi legacy kayıt geçişi ve firma bazlı sohbet geçmişi. Yedek açıklaması sadeleştirildi; depolama yalnızca %70 üzerindeyken gösterilir.

## Etkilenen Modüller

Dashboard, firma servis/formu, IndexedDB/provider, sohbet ve ayarlar. Ertelenen roller/eğitim korunur. Veri şeması değişmedi.

## Doğrulama

608 test geçti; üretim derlemesi başarılı; 256 uygulama dosyasında sözdizimi/import kontrolü temiz. İzole gerçek IndexedDB’de 29 firmadan iki eşzamanlı ekleme sonucu toplam 30; sınırda güncelleme, firma izolasyonu, eski kayıt geçişi ve iki firmayı kapsayan yedek doğrulandı. Mobil formdan firma oluşturuldu ve etkinleşti; 390 px’de yatay taşma yok. Firma seçimi özeti değiştirdi.

## Bilinen Riskler

Veriler cihazda tutulur; gerçek hesap/sunucu izolasyonu veya OSGB ekip paylaşımı yok. 30 sınırı kayıt/fotoğraf boyutunu sınırlamaz. Eski yedekler sınır üstünde firma içerebilir; silinmez. Sohbet geçmişi mevcut yedek formatına dahil değildir. Fiziksel cihaz testi yapılmadı; mevcut ExcelJS parça uyarısı sürüyor.

## Sonraki Öneriler

Saha pilotunda iş takibi ve çoklu firma akışını gerçek cihazda doğrulayın.

## Documentation Check

PROJECT_CONTEXT, RELEASE_SCOPE ve ARCHITECTURE güncellendi. README değiştirilmedi.
