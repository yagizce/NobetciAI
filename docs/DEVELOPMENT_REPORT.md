# Son geliştirme raporu

**20 Ekim 2026 — Uzman odaklı ilk sürüm**

## Yapılan Geliştirmeler

- İşveren/çalışan görünümü, uzaktan eğitim, çalışan yönetimi ve çalışan bildirim/onay akışı merkezi yayın profiliyle kapatıldı.
- Sekme, eski rol tercihi, servis yazması, arka plan hatırlatması, bildirim tercihi ve sohbet yönlendirmesi aynı kapsamla sınırlandı.
- Uzman firma/şube/departman kurabilir; risk, denetim, belge ve kontrol akışları açık. Kritik risk uyarısı genel çalışan bildiriminden ayrıldı.
- Tüm eski kod ve veriler korunuyor. Tam yedek kapalı modül verilerini de içeriyor; demo veri sıfırlaması kapalı.
- Başka model/geliştirici için kök AGENTS.md ve RELEASE_SCOPE.md yeniden açma rehberi eklendi.

## Etkilenen Modüller

Rol bağlamı, dashboard, ayarlar/firma, doküman/risk sekmeleri, eğitim/çalışan/bildirim servisleri, hatırlatıcı ve sohbet kısayolu. Veri şeması ve bağımlılıklar değişmedi.

## Doğrulama

- Yayın profili ve kapalı servis davranışları için 7 yeni testle **601/601 test** geçti; **255** uygulama JS/JSX dosyasında sözdizimi ve kullanılmayan import kontrolü temiz.
- Tarayıcıda eski employee/employer tercihi uzman olarak açıldı; eğitim ve bildirim derin bağlantıları açık sekmelere düştü.
- Uzman olarak firma ve manuel saha tespiti oluşturuldu. Altı kapalı modül kaydı geçişten sonra korunuyordu; saklı eğitim bildirimi gösterilmedi.
- Üretim derlemesi aynı Vite ayarları doğrudan yüklenerek tamamlandı. Windows geliştirme sunucusunun bağımlılık tarayıcısı üst klasör erişiminde hata verdiği için tarayıcı kontrolleri üretim önizlemesinde yapıldı.

## Bilinen Riskler

Kapsam kontrolü gerçek hesap/sunucu yetkilendirmesi değildir. Veriler cihazdadır; eski çevrimdışı sürüm bir güncelleme almadan değişmez. Fiziksel Android/iOS ve canlı AI testi yapılmadı. Eğitim/işveren/çalışan kodları korunmuştur; yeniden açma öncesinde kendi akışları tekrar test edilmelidir.

## Sonraki Öneriler

Uzman pilotunda saha tespiti → değerlendirme → faaliyet → rapor akışını cihazda doğrulayın. Gerçek hesap ve kamera projesi sonraki ürün aşamasındadır. Modül açma adımları [RELEASE_SCOPE.md](RELEASE_SCOPE.md) içindedir.

## Documentation Check

README, PROJECT_CONTEXT, ARCHITECTURE, CHANGELOG, yayın hazırlığı ve dokümantasyon dizini etkin kapsamla eşleştirildi. Veri modeli değişmedi; DATABASE_PLAN ve tarihsel sprint belgeleri korundu.
