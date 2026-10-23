# Güvenlik politikası

Uygulama geliştirme aşamasındadır. Gerçek hesap/sunucu yetkilendirmesi yoktur;
yerel firma kapsamı bir güvenlik sınırı değildir. Üretime hazır güvenlik garantisi verilmez.
İnceleme önceliği güncel main'dir; eski sürümler için backport veya yanıt süresi taahhüdü yoktur.

## Hassas bildirim

Güvenlik açığı ayrıntılarını, anahtarları, saha/kişi verisini açık issue'ya göndermeyin.
[Security → Advisories](https://github.com/yagizce/NobetciAI/security/advisories)
sayfasında **Report a vulnerability** görünüyorsa özel bildirim kullanın.
Bu özelliğin açık olduğu bu dosyayla iddia edilmez. Buton yoksa ayrıntı içermeyen
“Özel güvenlik bildirim kanalı talebi” issue'su açın; bakımcı özel kanal sağlamadan
kanıt/istismar ayrıntısı paylaşmayın. Bakımcı için
[GitHub özel bildirim ayarı](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository).

Özel raporda etkilenen commit/sürüm, ön koşullar, kişisel veri içermeyen en küçük
yeniden üretim, beklenen/gerçekleşen sonuç ve etkiyi belirtin.
Canlı hesap/sunucuya izinsiz test yapmayın. Açığa çıkan anahtarlar iptal edilip yenilenmelidir.

## Bilinen sınırlar ve bağımlılıklar

- Auth mock; AI proxy'lerinde gerçek oturum/kullanıcı kotası yok:
  [#9](https://github.com/yagizce/NobetciAI/issues/9).
- Bilgi kütüphanesi örnek içerik içerir; AI çıktısı insan onayı gerektirir.
- Vite/esbuild geliştirme sunucusu borcu nedeniyle `--host 0.0.0.0`, tünel veya
  açık LAN sunucusu kullanmayın; hassas dosya içermeyen izole ortam kullanın.
- Yerel yedek gerçek senkronizasyon değildir; sohbet kapsamı
  [#13](https://github.com/yagizce/NobetciAI/issues/13) ile izlenir.
- [Bağımlılık değerlendirmesi](docs/DEPENDENCY_SECURITY.md) ve
  [süreli istisnalar](security/audit-policy.json) açıktır.

`npm run audit:security` tüm npm audit bulgularını JSON'a yazar; yeni/değişen duyuru,
incelenmemiş paket sürümü, süre sonu veya audit hatasında başarısız olur.
Yeşil kontrol yalnızca mevcut süreli politikanın karşılandığını ifade eder; sıfır
zafiyet veya canlı güvenlik testi anlamına gelmez. Ham JSON CI artifact'idir.
