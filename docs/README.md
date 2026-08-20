# Nöbetçi — Proje Dokümantasyonu

Bu klasör, Nöbetçi projesinin **kalıcı referans dokümantasyonudur**. Buradaki dosyalar
bundan sonraki tüm geliştirme, planlama ve mimari kararların ortak referans noktasıdır.

> Kök dizindeki `README.md` **dağıtım/kurulum** talimatlarını içerir (GitHub → Vercel).
> Bu klasördeki dosyalar ise projenin **ne olduğu, neden bu şekilde yapıldığı ve nereye
> gittiğidir**. İkisi farklı amaçlara hizmet eder, birbirinin yerini tutmaz.

## İçindekiler

| Dosya | Amaç |
|---|---|
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) | Projenin ne olduğu, kim için yapıldığı, mevcut durum ve kısıtlar |
| [VISION.md](./VISION.md) | Uzun vadeli vizyon, hedef kitle, ürün ilkeleri |
| [ROADMAP.md](./ROADMAP.md) | Aşama bazlı yol haritası ve açık kararlar |
| [SPRINTS.md](./SPRINTS.md) | Tamamlanan/planlanan sprintlerin özet takibi |
| [CHANGELOG.md](./CHANGELOG.md) | Sürüm bazlı değişiklik kaydı (Keep a Changelog formatı) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Teknik mimari, katmanlar, klasör yapısı |
| [DATABASE_PLAN.md](./DATABASE_PLAN.md) | Mevcut veri katmanı ve backend'e geçiş planı |
| [AI_ROADMAP.md](./AI_ROADMAP.md) | AI entegrasyonunun mevcut durumu ve planlanan genişlemeler |
| [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) | Tek referans geliştirme standardı (felsefe, kod kalitesi, mimari, AI, dokümantasyon politikası) |
| [DEVELOPMENT_REPORT.md](./DEVELOPMENT_REPORT.md) | Sprint bazlı mimari/kod kalitesi değerlendirme raporları |

## Bu dosyaları güncel tutma kuralı

- Her yeni sprint/özellik tamamlandığında **önce ilgili doküman güncellenir**, sonra
  geliştirmeye devam edilir. Dokümantasyon geriye dönük "hatırlama" değil, eş zamanlı
  kayıt olmalıdır.
- Sprint bazlı detaylar `SPRINTS.md`'ye, kalıcı mimari kararlar `ARCHITECTURE.md`'ye,
  kullanıcıya/geliştiriciye görünen değişiklikler `CHANGELOG.md`'ye yazılır.
- Bir dosya güncellenirken diğerleriyle çelişki oluşup oluşmadığı kontrol edilir
  (örn. ROADMAP.md'de "planlanan" olarak duran bir madde SPRINTS.md'de tamamlandıysa,
  ROADMAP.md da güncellenmelidir).
