# Proje bağlamı

Son inceleme: **21 Ekim 2026**.

Nöbetçi'nin ilk sürümü yalnızca İSG uzmanına yöneliktir. İşveren, çalışan, uzaktan eğitim ve çalışan bildirimi modülleri silinmeden kapatılmıştır. Hedef Android ve iOS yayınıdır; mevcut uygulama web/PWA aşamasındadır. Kapsamın tek kaynağı `src/constants/releaseProfile.js`; [yeniden açma rehberi](RELEASE_SCOPE.md) yeni geliştirmelerde okunmalıdır.

Firmalara yönelik sürüm daha sonra ayrı yayınlanacaktır. Uzman sürümünde çoklu firma, bağımsız veya OSGB bünyesindeki uzmanın kendi portföyüdür; firma hesabı ya da ekip erişimi oluşturmaz. Mevcut 30 firma sınırı geçici ürün kararıdır; firma sürümünün sınırı ve teknik dağıtımı henüz belirlenmedi. Vercel yalnızca mobil uygulamanın web demosudur.

## Mevcut yapı

- React 18 + Vite 5 + React Router 6; Tailwind CSS derleme sırasında üretilir.
- Firma portföyü: cihaz başına en fazla 30 firma; ana ekrandan eklenir/seçilir. Risk, denetim, kontrol ve belge kayıtları firma kapsamlıdır; sohbet geçmişi firma anahtarıyla ayrılır. Uzman özeti yalnızca aktif firmanın kayıtlarını kullanır.
- Yerel veri: IndexedDB; servisler `dataProvider.js` üzerinden erişir. Firma kapsamı ve eski kayıt geçişi vardır.
- Kullanıcı profili demodur; etkin görünüm uzmandır. Login/Register gerçek kimlik doğrulama yapmaz; yayın kapsamı sunucu yetkilendirmesi değildir.
- AI: Anthropic risk/belge işlemleri; NVIDIA metin sohbeti ve fotoğraf analizi. Anahtarlar sunucu proxy'lerinde tutulur.
- Aktif modüller: firma portföyü, uzman dashboard, Fine-Kinney, Risk Tespiti, denetim, periyodik kontrol, belge, mevzuat ve bilgi kütüphanesi. Şube/departman yönetimi gizlidir; mevcut verileri korunur.
- Fotoğrafla tehlike tespiti gerçek servis çağrısı kullanır. Bulgular onaylanmadan kaydolmaz.
- Sabit kamera projesi ve gerçek hesap sistemi ertelendi. Telefonda tek fotoğraf analizi ayrı bir mevcut özelliktir.
- Android/iOS proje ve imzalama yapılandırmaları henüz yoktur.
- Supabase taslakları `docs/backend-migration/` altındadır; aktif uygulamaya bağlı değildir.
- Testle korunan `isoStandards.js` eski çoklu standart prototipidir; aktif ekran girişinden kullanılmaz. Silme kararı ayrı kapsamda değerlendirilmelidir.

## Açık işler

[Yayın hazırlığı](MOBILE_RELEASE_READINESS.md) güncel öncelik listesidir: gerçek hesap/yetki sistemi, güvenilir sunucu veri katmanı, AI erişim denetimi, mobil paketleme, gerçek içerik ve cihaz doğrulaması.

## Çalışma ilkeleri

- Mevcut katmanları ve mobil kullanımı koru; yeni özellikten önce mevcut sistemi iyileştir.
- Yeni backend, sağlayıcı veya npm bağımlılığı eklemek ayrı ürün kararıdır; Supabase geçişi kendiliğinden başlatılmaz.
- AI önerir, insan onaylar. Risk puanlaması ve kayıt doğrulamasını kozmetik temizlik kapsamında değiştirme.
- Demo ve örnek veri gerçek hizmet gibi sunulmaz.
- Kod yorumları ve arayüz Türkçe; değişken ve fonksiyon adları İngilizce.
- Belgeleri yalnızca güncelliğini korumak gerektiğinde değiştir; geçmiş anlatımları koda yığma.
- Gerçekte yapılan test/derlemeyi sonucu ve ortam sınırlarıyla raporla.

[Geliştirme kuralları](DEVELOPMENT_RULES.md) · [Mimari](ARCHITECTURE.md) · [Backend planı](DATABASE_PLAN.md)
