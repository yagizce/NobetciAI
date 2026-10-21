# Bu depoda çalışırken

- Önce `docs/PROJECT_CONTEXT.md`, `docs/DEVELOPMENT_RULES.md` ve `docs/RELEASE_SCOPE.md` dosyalarını okuyun.
- Etkin ürün kapsamı **yalnızca İSG uzmanı**. İşveren, çalışan, uzaktan eğitim ve çalışan bildirimi modülleri bilerek kapalıdır. Bunları kullanılmayan kod sanıp silmeyin veya kullanıcı istemeden açmayın.
- İlk yayın uzmanlar için Android/iOS mobil uygulamadır; Vercel web demosudur. Firmalara yönelik sürüm daha sonra ayrı yayınlanacaktır. Uzmanın çoklu firma portföyünü firma hesabı/ekip erişimiyle karıştırmayın. Ayrı yayın kararı tek başına yeni repo, paket veya backend kurma yetkisi değildir.
- Kapsamın tek kaynağı `src/constants/releaseProfile.js`. UI, servis korumaları ve bildirimleri birlikte değerlendirin; URL/localStorage ile açılabilen bir geçiş eklemeyin.
- Kapalı modüllerin mevcut verilerini, store'larını ve tam yedek kapsamını koruyun. Veri silme veya şema değişikliği bu kapsam kararının parçası değildir.
- Gerçek hesap/sunucu yetkilendirmesi ve sabit kamera projesi ertelendi. Kapsam kontrolünü güvenlik yetkilendirmesi gibi sunmayın.
- Değişiklik sonrası `npm test`, `npm run build` ve ilgili kullanıcı akışını doğrulayın. Bu Windows ortamındaki eşdeğer Vite kontrolü `docs/MOBILE_RELEASE_READINESS.md` içinde açıklanır.
