# Proje bağlamı

Kapsam güncellemesi: **26 Kasım 2026**.

Nöbetçi'nin etkin ekip önizlemesinde İSG uzmanı, işveren ve çalışan demo rolleri, uzaktan eğitim, çalışan dizini ve çalışan bildirimleri açıktır. Hedef Android ve iOS yayınıdır; mevcut uygulama web/PWA aşamasındadır. Kapsamın tek kaynağı `src/constants/releaseProfile.js`; [yeniden açma rehberi](RELEASE_SCOPE.md) yeni geliştirmelerde okunmalıdır.

## Mevcut yapı

- React 18 + Vite 5 + React Router 6; Tailwind CSS derleme sırasında üretilir.
- Yerel veri: IndexedDB; servisler `dataProvider.js` üzerinden erişir. Firma kapsamı ve eski kayıt geçişi vardır.
- Kullanıcı profili demodur. Varsayılan görünüm uzmandır; Ayarlar → Rol (Demo) üzerinden rol değiştirilebilir. Login/Register gerçek kimlik doğrulama yapmaz; yayın kapsamı sunucu yetkilendirmesi değildir.
- AI: Anthropic risk/belge işlemleri; NVIDIA metin sohbeti ve fotoğraf analizi. Anahtarlar sunucu proxy'lerinde tutulur.
- Aktif modüller: firma/şube/departman, üç rolün ana ekranları, eğitim, çalışan yönetimi ve bildirimleri, Fine-Kinney, Risk Tespiti, denetim, periyodik kontrol, belge, mevzuat ve bilgi kütüphanesi.
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
