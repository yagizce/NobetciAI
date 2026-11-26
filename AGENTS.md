# Bu depoda çalışırken

- Önce `docs/PROJECT_CONTEXT.md`, `docs/DEVELOPMENT_RULES.md` ve `docs/RELEASE_SCOPE.md` dosyalarını okuyun.
- Etkin `teamPreview` profili uzman, işveren ve çalışan demo görünümlerini, eğitim ve ekip modüllerini açar. Veri sıfırlayan örnek veri aracı kapalıdır.
- Kapsamın tek kaynağı `src/constants/releaseProfile.js`. UI, servis korumaları ve bildirimleri birlikte değerlendirin; URL/localStorage ile açılabilen bir geçiş eklemeyin.
- Modüllerin mevcut verilerini, store'larını ve tam yedek kapsamını koruyun. Veri silme veya şema değişikliği bu kapsam kararının parçası değildir.
- Gerçek hesap/sunucu yetkilendirmesi ve sabit kamera projesi ertelendi. Kapsam kontrolünü güvenlik yetkilendirmesi gibi sunmayın.
- Değişiklik sonrası `npm test`, `npm run build` ve ilgili kullanıcı akışını doğrulayın. Bu Windows ortamındaki eşdeğer Vite kontrolü `docs/MOBILE_RELEASE_READINESS.md` içinde açıklanır.
